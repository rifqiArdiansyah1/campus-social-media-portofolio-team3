#!/usr/bin/env python3
"""
Skrip Evaluasi Benchmark AI-2: Moderasi Konten Feed Kampus.
Mengevaluasi akurasi, presisi, recall, F1-score, dan mendeteksi false positive / false negative
terhadap dataset benchmark di ai/eval/eval-moderation-dataset.json.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List

# Pastikan UTF-8 untuk Windows terminal console
if sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Tambahkan backend ke PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent.parent / "src" / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.ai_engine.moderator import ContentModerator  # noqa: E402


def run_evaluation():
    dataset_path = Path(__file__).resolve().parent / "eval-moderation-dataset.json"
    if not dataset_path.exists():
        print(f"Error: Dataset {dataset_path} tidak ditemukan!")
        sys.exit(1)

    with open(dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    moderator = ContentModerator()

    total = len(dataset)
    correct = 0
    y_true: List[str] = []
    y_pred: List[str] = []
    mismatches: List[Dict] = []

    print(f"=== Menjalankan Evaluasi Benchmark Moderasi Konten ({total} Sampel) ===")

    for item in dataset:
        post_id = item["id"]
        text = item["text"]
        expected = item["expected_label"]

        result = moderator.moderate_text(post_id=post_id, content=text)
        predicted = result.label

        y_true.append(expected)
        y_pred.append(predicted)

        if predicted == expected:
            correct += 1
        else:
            mismatches.append({
                "id": post_id,
                "text": text,
                "expected": expected,
                "predicted": predicted,
                "confidence": result.confidence,
                "explanation": result.explanation,
                "notes": item.get("notes", "")
            })

    accuracy = correct / total if total > 0 else 0.0

    # Per-class metrics
    labels = ["aman", "perlu_review", "berpotensi_melanggar"]
    metrics: Dict[str, Dict[str, float]] = {}

    for label in labels:
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == label and yp == label)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt != label and yp == label)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == label and yp != label)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        metrics[label] = {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "precision": precision,
            "recall": recall,
            "f1": f1
        }

    print("\n" + "=" * 60)
    print("HASIL EVALUASI BENCHMARK")
    print("=" * 60)
    print(f"Total Sampel : {total}")
    print(f"Benar        : {correct}")
    print(f"Salah        : {len(mismatches)}")
    print(f"Akurasi      : {accuracy * 100:.2f}%\n")

    print(f"{'Label':<22} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 60)
    for label in labels:
        m = metrics[label]
        print(f"{label:<22} | {m['precision'] * 100:>8.2f}% | {m['recall'] * 100:>8.2f}% | {m['f1'] * 100:>8.2f}%")
    print("-" * 60)

    if mismatches:
        print("\nDAFTAR MISMATCH / KETIDAKSESUAIAN:")
        for idx, m in enumerate(mismatches, 1):
            print(f"{idx}. [{m['id']}] Expected: '{m['expected']}' -> Predicted: '{m['predicted']}'")
            print(f"   Teks: \"{m['text']}\"")
            print(f"   Catatan: {m['notes']}")
            print(f"   Penjelasan AI: {m['explanation']}\n")
    else:
        print("\nSempurna! 100% sampel benchmark terprediksi dengan benar tanpa false-positive!")

    return accuracy, metrics, mismatches


if __name__ == "__main__":
    run_evaluation()
