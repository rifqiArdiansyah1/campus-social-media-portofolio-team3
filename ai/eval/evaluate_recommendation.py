#!/usr/bin/env python3
"""
Skrip Evaluasi Benchmark AI-1: Rekomendasi Rekan Kolaborator Mahasiswa.
Membandingkan 3 model secara head-to-head:
  1. Random Baseline (Batas Bawah)
  2. Exact Tag/Keyword Matcher (Fallback Baseline Sistem)
  3. TF-IDF + Cosine Similarity (Model Produksi CampusFolio)

Mengukur:
  - Hit Rate@1, Hit Rate@3, Hit Rate@5
  - Precision@3, Precision@5
  - Mean Reciprocal Rank (MRR)
  - Complementary Skill Precision
  - Latensi Komputasi End-to-End pada Skala Korpus (N=50, N=500, N=5.000)
"""

import copy
import json
import random
import sys
import time
from pathlib import Path
from typing import List, Set

import numpy as np

# Pastikan UTF-8 untuk console output
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Tambahkan backend ke PYTHONPATH
backend_dir = Path(__file__).resolve().parent.parent.parent / "src" / "backend"
sys.path.insert(0, str(backend_dir))

from app.schemas.recommendation import CandidateProfile  # noqa: E402
from app.services.ai_engine.recommender import TFIDFRecommender  # noqa: E402


class RandomRecommender:
    """Baseline 1: Pengacakan seragam (Uniform Random Baseline)."""

    def __init__(self, seed: int = 42):
        self.rng = random.Random(seed)

    def recommend(
        self,
        query_user: CandidateProfile,
        candidates: List[CandidateProfile],
        top_k: int = 5,
    ) -> List[str]:
        pool = [c.user_id for c in candidates if str(c.user_id) != str(query_user.user_id)]
        shuffled = list(pool)
        self.rng.shuffle(shuffled)
        return shuffled[:top_k]


class ExactTagRecommender:
    """Baseline 2: Pencocokan eksak kata kunci & tag keahlian (Fallback Rule-based)."""

    def recommend(
        self,
        query_user: CandidateProfile,
        candidates: List[CandidateProfile],
        target_skills: List[str],
        top_k: int = 5,
    ) -> List[str]:
        pool = [c for c in candidates if str(c.user_id) != str(query_user.user_id)]
        needed = set(s.lower() for s in (target_skills or []))
        user_skills = set(s.lower() for s in query_user.skills)
        all_query = needed.union(user_skills)

        scored = []
        for c in pool:
            cand_skills = set(s.lower() for s in c.skills)
            overlap = len(cand_skills.intersection(all_query))
            scored.append((overlap, c.user_id))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [uid for score, uid in scored[:top_k]]


def evaluate_ranking(recommended_ids: List[str], ground_truth: Set[str], k_values=(1, 3, 5)):
    rec_k = {k: recommended_ids[:k] for k in k_values}

    hits = {}
    precisions = {}
    for k in k_values:
        sub = rec_k[k]
        hit = 1.0 if any(item in ground_truth for item in sub) else 0.0
        p = sum(1.0 for item in sub if item in ground_truth) / k if k > 0 else 0.0
        hits[k] = hit
        precisions[k] = p

    # Reciprocal Rank (RR)
    rr = 0.0
    for rank_idx, item in enumerate(recommended_ids, start=1):
        if item in ground_truth:
            rr = 1.0 / rank_idx
            break

    return hits, precisions, rr


def run_evaluation():
    dataset_path = Path(__file__).resolve().parent / "eval-recommendation-dataset.json"
    if not dataset_path.exists():
        print(f"Error: Dataset {dataset_path} tidak ditemukan!")
        sys.exit(1)

    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data["metadata"]
    profiles_raw = data["profiles"]
    queries_raw = data["queries"]

    candidates = [
        CandidateProfile(
            user_id=p["user_id"],
            name=p["name"],
            department=p["department"],
            bio=p["bio"],
            skills=p["skills"],
            interests=p["interests"]
        )
        for p in profiles_raw
    ]

    random_model = RandomRecommender(seed=42)
    exact_model = ExactTagRecommender()
    tfidf_model = TFIDFRecommender()

    models = ["Random Baseline", "Exact Tag Matching (Fallback)", "TF-IDF Recommender (Proposed)"]
    metrics_summary = {m: {"hr1": [], "hr3": [], "hr5": [], "p3": [], "p5": [], "mrr": [], "comp_prec": []} for m in models}

    print("=" * 70)
    print("=== EVALUASI BENCHMARK AI-1: REKOMENDASI KOLABORATOR MAHASISWA ===")
    print("=" * 70)
    print(f"Total Profil Kandidat : {len(candidates)}")
    print(f"Total Skenario Kueri  : {len(queries_raw)}")
    print(f"Inter-Annotator Kappa : {meta['inter_annotator_agreement']['cohens_kappa']} ({meta['inter_annotator_agreement']['agreement_strength']})")
    print("-" * 70)

    for q in queries_raw:
        target_skills = q.get("target_skills", [])
        desc = q.get("project_description", "")
        ground_truth_relevant = set(q["annotated_relevant_ids"])
        ground_truth_comp_skills = set(s.lower() for s in q.get("annotated_complementary_skills", []))

        seeker = CandidateProfile(
            user_id=q["seeker_profile"]["user_id"],
            name=q["seeker_profile"].get("name", "Seeker"),
            department=q["seeker_profile"].get("department", "Mahasiswa"),
            bio=q["seeker_profile"].get("bio", ""),
            skills=q["seeker_profile"].get("skills", []),
            interests=q["seeker_profile"].get("interests", [])
        )

        # 1. Random
        rand_recs = random_model.recommend(seeker, candidates, top_k=5)
        h, p, rr = evaluate_ranking(rand_recs, ground_truth_relevant)
        metrics_summary["Random Baseline"]["hr1"].append(h[1])
        metrics_summary["Random Baseline"]["hr3"].append(h[3])
        metrics_summary["Random Baseline"]["hr5"].append(h[5])
        metrics_summary["Random Baseline"]["p3"].append(p[3])
        metrics_summary["Random Baseline"]["p5"].append(p[5])
        metrics_summary["Random Baseline"]["mrr"].append(rr)

        # Random complementary check
        rand_cand_profiles = [c for c in candidates if c.user_id in rand_recs[:3]]
        comp_count_rand = sum(
            1 for c in rand_cand_profiles if any(s.lower() in ground_truth_comp_skills for s in c.skills)
        )
        metrics_summary["Random Baseline"]["comp_prec"].append(comp_count_rand / 3.0)

        # 2. Exact Tag
        exact_recs = exact_model.recommend(seeker, candidates, target_skills, top_k=5)
        h, p, rr = evaluate_ranking(exact_recs, ground_truth_relevant)
        metrics_summary["Exact Tag Matching (Fallback)"]["hr1"].append(h[1])
        metrics_summary["Exact Tag Matching (Fallback)"]["hr3"].append(h[3])
        metrics_summary["Exact Tag Matching (Fallback)"]["hr5"].append(h[5])
        metrics_summary["Exact Tag Matching (Fallback)"]["p3"].append(p[3])
        metrics_summary["Exact Tag Matching (Fallback)"]["p5"].append(p[5])
        metrics_summary["Exact Tag Matching (Fallback)"]["mrr"].append(rr)

        exact_cand_profiles = [c for c in candidates if c.user_id in exact_recs[:3]]
        comp_count_exact = sum(
            1 for c in exact_cand_profiles if any(s.lower() in ground_truth_comp_skills for s in c.skills)
        )
        metrics_summary["Exact Tag Matching (Fallback)"]["comp_prec"].append(comp_count_exact / 3.0)

        # 3. TF-IDF Proposed
        tfidf_resp = tfidf_model.recommend(
            query_user=seeker,
            candidates=candidates,
            target_skills=target_skills,
            project_description=desc,
            top_k=5
        )
        tfidf_recs = [item.user_id for item in tfidf_resp.recommendations]
        h, p, rr = evaluate_ranking(tfidf_recs, ground_truth_relevant)
        metrics_summary["TF-IDF Recommender (Proposed)"]["hr1"].append(h[1])
        metrics_summary["TF-IDF Recommender (Proposed)"]["hr3"].append(h[3])
        metrics_summary["TF-IDF Recommender (Proposed)"]["hr5"].append(h[5])
        metrics_summary["TF-IDF Recommender (Proposed)"]["p3"].append(p[3])
        metrics_summary["TF-IDF Recommender (Proposed)"]["p5"].append(p[5])
        metrics_summary["TF-IDF Recommender (Proposed)"]["mrr"].append(rr)

        comp_count_tfidf = sum(
            1 for item in tfidf_resp.recommendations[:3]
            if any(s.lower() in ground_truth_comp_skills for s in (item.complementary_skills or []))
            or any(s.lower() in ground_truth_comp_skills for s in (item.matched_terms or []))
        )
        metrics_summary["TF-IDF Recommender (Proposed)"]["comp_prec"].append(
            comp_count_tfidf / max(1, len(tfidf_resp.recommendations[:3]))
        )

    # Cetak Hasil Head-to-Head
    print(f"{'Metrik Evaluasi':<32} | {'Random':<10} | {'Exact Tag':<12} | {'TF-IDF (Proposed)':<18}")
    print("-" * 80)

    rows = [
        ("Hit Rate@1 (HR@1)", "hr1"),
        ("Hit Rate@3 (HR@3)", "hr3"),
        ("Hit Rate@5 (HR@5)", "hr5"),
        ("Precision@3 (P@3)", "p3"),
        ("Precision@5 (P@5)", "p5"),
        ("Mean Reciprocal Rank (MRR)", "mrr"),
        ("Complementary Precision@3", "comp_prec"),
    ]

    final_results = {}
    for label, key in rows:
        val_rand = np.mean(metrics_summary["Random Baseline"][key]) * 100
        val_exact = np.mean(metrics_summary["Exact Tag Matching (Fallback)"][key]) * 100
        val_tfidf = np.mean(metrics_summary["TF-IDF Recommender (Proposed)"][key]) * 100
        print(f"{label:<32} | {val_rand:>9.2f}% | {val_exact:>11.2f}% | {val_tfidf:>17.2f}%")
        final_results[key] = {
            "random": round(val_rand, 2),
            "exact_tag": round(val_exact, 2),
            "tfidf_proposed": round(val_tfidf, 2),
        }

    # 4. Latency & Scalability Benchmark
    print("\n" + "=" * 70)
    print("=== BENCHMARK SKALABILITAS LATENSI KOMPUTASI END-TO-END ===")
    print("=" * 70)

    corpus_sizes = [50, 500, 5000]
    latency_results = {}

    test_seeker = CandidateProfile(
        user_id="bench_seeker",
        name="Tester",
        department="Teknik Informatika",
        bio="Mahasiswa butuh rekan developer Flutter dan FastAPI untuk riset capstone.",
        skills=["Python", "FastAPI", "PostgreSQL"],
        interests=["Hackathon", "Mobile Development"]
    )
    test_target_skills = ["Flutter", "Dart", "Docker"]

    for size in corpus_sizes:
        if size == 50:
            corpus = candidates
        else:
            # Sintesis perbanyakan profil realistis
            corpus = []
            for i in range(size):
                base_c = candidates[i % len(candidates)]
                mutated = copy.deepcopy(base_c)
                mutated.user_id = f"synth_{i}"
                corpus.append(mutated)

        times_ms = []
        # Warmup
        tfidf_model.recommend(test_seeker, corpus[:50], test_target_skills, top_k=5)

        # 20 Iterasi pengukuran waktu
        for _ in range(20):
            t0 = time.perf_counter()
            tfidf_model.recommend(test_seeker, corpus, test_target_skills, top_k=5)
            t1 = time.perf_counter()
            times_ms.append((t1 - t0) * 1000.0)

        p50 = float(np.percentile(times_ms, 50))
        p95 = float(np.percentile(times_ms, 95))
        p99 = float(np.percentile(times_ms, 99))
        mean_lat = float(np.mean(times_ms))

        latency_results[f"N={size}"] = {
            "size": size,
            "mean_ms": round(mean_lat, 2),
            "p50_ms": round(p50, 2),
            "p95_ms": round(p95, 2),
            "p99_ms": round(p99, 2),
        }

        print(f"Korpus N={size:<5} | Mean: {mean_lat:>6.2f} ms | p50: {p50:>6.2f} ms | p95: {p95:>6.2f} ms | p99: {p99:>6.2f} ms")

    # Simpan laporan data JSON
    output_report = {
        "benchmark_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "corpus_total": len(candidates),
        "queries_total": len(queries_raw),
        "metrics_head_to_head": final_results,
        "scalability_latency": latency_results,
        "inter_annotator_agreement": meta["inter_annotator_agreement"],
    }

    report_path = Path(__file__).resolve().parent / "recommendation-eval-results.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(output_report, f, indent=2)

    print(f"\nHasil evaluasi lengkap disimpan di: {report_path}")


if __name__ == "__main__":
    run_evaluation()
