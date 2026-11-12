#!/usr/bin/env python3
"""
Skrip Evaluasi Benchmark AI-2: Moderasi Konten Feed Kampus.
Membandingkan dua pendekatan secara head-to-head pada Held-out Test Set (50 sampel):
  1. Naive Blacklist (Word Boundary Regex sederhana tanpa pra-pemrosesan)
  2. Advanced Heuristic Pipeline (ContentModerator produksi dengan NFKC, zero-width stripping,
     leetspeak decoding, homoglyph replacement, repeat collapsing, dan multi-stage regex).

Mengevaluasi:
  - Akurasi Keseluruhan (Overall Accuracy)
  - Precision, Recall, Macro-F1 per kelas ('aman', 'perlu_review', 'berpotensi_melanggar')
  - False Positive Rate (FPR) pada kelas 'aman'
  - False Negative Rate (FNR) pada kelas 'berpotensi_melanggar'
"""

import json
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

# Pastikan UTF-8 untuk Windows terminal console
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Tambahkan backend ke PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent.parent / "src" / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.ai_engine.moderator import ContentModerator  # noqa: E402


class NaiveBlacklistModerator:
    """Baseline 1: Pemeriksaan kata terlarang berbasis regex naif tanpa pra-pemrosesan."""

    FLAGGED_WORDS = [
        "anjing", "bangsat", "tolol", "goblok", "bego",
        "kampret", "kontol", "memek", "open bo", "jablay",
        "lonte", "sange", "bugil", "joki skripsi", "investasi pasti untung"
    ]
    SUSPICIOUS_WORDS = [
        "males banget", "dosen ga jelas", "tugas tai", "parah sih"
    ]

    def __init__(self):
        self.flagged_regexes = [re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE) for w in self.FLAGGED_WORDS]
        self.suspicious_regexes = [re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE) for w in self.SUSPICIOUS_WORDS]

    def predict(self, text: str) -> str:
        for r in self.flagged_regexes:
            if r.search(text):
                return "berpotensi_melanggar"
        for r in self.suspicious_regexes:
            if r.search(text):
                return "perlu_review"
        return "aman"


def compute_metrics(y_true: List[str], y_pred: List[str], labels: List[str]) -> Tuple[float, Dict[str, Dict[str, float]], float, float]:
    total = len(y_true)
    correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    accuracy = correct / total if total > 0 else 0.0

    class_metrics = {}
    for label in labels:
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == label and yp == label)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt != label and yp == label)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == label and yp != label)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        class_metrics[label] = {
            "tp": tp, "fp": fp, "fn": fn,
            "precision": round(precision * 100, 2),
            "recall": round(recall * 100, 2),
            "f1": round(f1 * 100, 2)
        }

    # False Positive Rate on 'aman' (konten aman yang salah dituduh melanggar atau perlu review)
    # FPR_aman = FP_aman / (FP_aman + TN_aman)
    # Dalam konteks moderasi: konten yang ground truth-nya 'aman' tapi diprediksi != 'aman'
    total_true_aman = sum(1 for yt in y_true if yt == "aman")
    false_flagged_aman = sum(1 for yt, yp in zip(y_true, y_pred) if yt == "aman" and yp != "aman")
    fpr_aman = (false_flagged_aman / total_true_aman * 100) if total_true_aman > 0 else 0.0

    # False Negative Rate on 'berpotensi_melanggar' (konten melanggar yang lolos ke 'aman')
    total_true_violation = sum(1 for yt in y_true if yt == "berpotensi_melanggar")
    escaped_violations = sum(1 for yt, yp in zip(y_true, y_pred) if yt == "berpotensi_melanggar" and yp == "aman")
    fnr_violation = (escaped_violations / total_true_violation * 100) if total_true_violation > 0 else 0.0

    return accuracy, class_metrics, fpr_aman, fnr_violation


def run_evaluation():
    dataset_path = Path(__file__).resolve().parent / "eval-moderation-dataset.json"
    if not dataset_path.exists():
        print(f"Error: Dataset {dataset_path} tidak ditemukan!")
        sys.exit(1)

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data["metadata"]
    # Evaluasi dilakukan secara ketat pada Held-out Test Set
    test_set = data.get("held_out_test_set", data if isinstance(data, list) else [])

    naive_moderator = NaiveBlacklistModerator()
    advanced_moderator = ContentModerator()

    labels = ["aman", "perlu_review", "berpotensi_melanggar"]

    y_true: List[str] = [item["expected_label"] for item in test_set]
    y_pred_naive: List[str] = []
    y_pred_adv: List[str] = []
    adv_mismatches: List[Dict] = []

    print("=" * 70)
    print("=== EVALUASI BENCHMARK AI-2: MODERASI KONTEN FEED KAMPUS ===")
    print("=" * 70)
    print(f"Dataset             : {meta.get('dataset_name', 'Benchmark Moderasi')}")
    print(f"Jumlah Sampel Uji   : {len(test_set)} sampel (Held-out Test Set)")
    print(f"Distribusi Kelas    : aman={y_true.count('aman')} | perlu_review={y_true.count('perlu_review')} | melanggar={y_true.count('berpotensi_melanggar')}")
    print("-" * 70)

    for item in test_set:
        post_id = item["id"]
        text = item["text"]
        expected = item["expected_label"]

        # Naive prediction
        pred_naive = naive_moderator.predict(text)
        y_pred_naive.append(pred_naive)

        # Advanced heuristic prediction
        res_adv = advanced_moderator.moderate_text(post_id=post_id, content=text)
        pred_adv = res_adv.label
        y_pred_adv.append(pred_adv)

        if pred_adv != expected:
            adv_mismatches.append({
                "id": post_id,
                "text": text,
                "expected": expected,
                "predicted": pred_adv,
                "confidence": res_adv.confidence,
                "explanation": res_adv.explanation,
                "notes": item.get("notes", "")
            })

    # Hitung metrik kedua model
    acc_naive, metrics_naive, fpr_aman_naive, fnr_viol_naive = compute_metrics(y_true, y_pred_naive, labels)
    acc_adv, metrics_adv, fpr_aman_adv, fnr_viol_adv = compute_metrics(y_true, y_pred_adv, labels)

    macro_f1_naive = sum(metrics_naive[lbl]["f1"] for lbl in labels) / len(labels)
    macro_f1_adv = sum(metrics_adv[lbl]["f1"] for lbl in labels) / len(labels)

    # Cetak Perbandingan Head-to-Head
    print(f"{'Metrik Evaluasi Moderasi':<36} | {'Naive Blacklist':<15} | {'Advanced Pipeline':<18}")
    print("-" * 75)
    print(f"{'Overall Accuracy':<36} | {acc_naive * 100:>14.2f}% | {acc_adv * 100:>17.2f}%")
    print(f"{'Macro-F1 Score':<36} | {macro_f1_naive:>14.2f}% | {macro_f1_adv:>17.2f}%")
    print(f"{'False Positive Rate (Aman Salah Blok)':<36} | {fpr_aman_naive:>14.2f}% | {fpr_aman_adv:>17.2f}%")
    print(f"{'False Negative Rate (Pelanggaran Lolos)':<36} | {fnr_viol_naive:>14.2f}% | {fnr_viol_adv:>17.2f}%")

    print("\n" + "-" * 75)
    print("DETAIL PER-KELAS (ADVANCED HEURISTIC PIPELINE PRODUKSI):")
    print(f"{'Kelas':<24} | {'Precision':<12} | {'Recall':<12} | {'F1-Score':<12}")
    print("-" * 75)
    for lbl in labels:
        m = metrics_adv[lbl]
        print(f"{lbl:<24} | {m['precision']:>11.2f}% | {m['recall']:>11.2f}% | {m['f1']:>11.2f}%")

    if adv_mismatches:
        print(f"\n[Catatan Error Analysis: Ditemukan {len(adv_mismatches)} Mismatch]")
        for mis in adv_mismatches:
            print(f"  - {mis['id']}: expected '{mis['expected']}', got '{mis['predicted']}' | Text: '{mis['text'][:60]}...'")
    else:
        print("\nSempurna! 100% sampel Held-out Test Set terprediksi sesuai label ground truth tanpa false positive!")

    # Simpan hasil dalam JSON report
    report_output = {
        "benchmark_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "test_set_count": len(test_set),
        "comparison": {
            "naive_blacklist": {
                "accuracy": round(acc_naive * 100, 2),
                "macro_f1": round(macro_f1_naive, 2),
                "false_positive_rate_aman": round(fpr_aman_naive, 2),
                "false_negative_rate_violation": round(fnr_viol_naive, 2),
                "per_class": metrics_naive
            },
            "advanced_heuristic_pipeline": {
                "accuracy": round(acc_adv * 100, 2),
                "macro_f1": round(macro_f1_adv, 2),
                "false_positive_rate_aman": round(fpr_aman_adv, 2),
                "false_negative_rate_violation": round(fnr_viol_adv, 2),
                "per_class": metrics_adv
            }
        },
        "mismatches": adv_mismatches
    }

    report_path = Path(__file__).resolve().parent / "moderation-eval-results.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_output, f, indent=2)

    print(f"\nHasil evaluasi moderasi lengkap disimpan di: {report_path}")


if __name__ == "__main__":
    run_evaluation()
