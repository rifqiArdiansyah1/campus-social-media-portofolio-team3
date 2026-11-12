from typing import Dict, List, Optional, Set

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.schemas.recommendation import (
    CandidateProfile,
    RecommendationItem,
    RecommendationResponse,
)


class TFIDFRecommender:
    """
    AI-1: Engine rekomendasi kolaborator mahasiswa berbasis stateless TF-IDF & Cosine Similarity.
    Mendukung perbandingan keahlian presisi (skill_id / token atomik), complementary boost,
    dan penjelasan berbasis bahasa alami tanpa korupsi vocabulary konkurensi.
    """

    MIN_SCORE_THRESHOLD: float = 0.15

    @classmethod
    def _build_profile_text(cls, profile: CandidateProfile) -> str:
        skills_text = " ".join(profile.skills)
        interests_text = " ".join(profile.interests)
        return f"{profile.bio} {skills_text} {interests_text} {profile.department}".strip().lower()

    @classmethod
    def _derive_match_level(cls, score: float) -> str:
        if score >= 0.80:
            return "Sangat Cocok"
        elif score >= 0.50:
            return "Cukup Cocok"
        else:
            return "Potensial"

    def recommend(
        self,
        query_user: CandidateProfile,
        candidates: List[CandidateProfile],
        target_skills: Optional[List[str]] = None,
        target_skill_ids: Optional[List[int]] = None,
        project_description: Optional[str] = "",
        top_k: int = 5,
    ) -> RecommendationResponse:
        """
        Menghitung rekomendasi kolaborator secara stateless dan deterministik.
        Instansiasi TfidfVectorizer dilakukan lokal per-request untuk mencegah race condition.
        """
        # Saring diri sendiri dari pool kandidat
        candidate_pool = [c for c in candidates if str(c.user_id) != str(query_user.user_id)]
        if not candidate_pool:
            return RecommendationResponse(
                query_user_id=str(query_user.user_id),
                fallback=False,
                recommendations=[]
            )

        # Cek profil kosong pemohon: jika tanpa bio, tanpa skills, tanpa target skills, dan tanpa deskripsi
        has_query_info = bool(
            (query_user.bio and query_user.bio.strip())
            or query_user.skills
            or (target_skills and len(target_skills) > 0)
            or (project_description and project_description.strip())
        )
        if not has_query_info:
            return RecommendationResponse(
                query_user_id=str(query_user.user_id),
                fallback=False,
                recommendations=[]
            )

        # 1. Bangun teks kueri dan korpus
        target_skills_str = " ".join(target_skills) if target_skills else ""
        query_text = (
            f"{query_user.bio} {' '.join(query_user.skills)} {' '.join(query_user.interests)} "
            f"{target_skills_str} {project_description or ''}"
        ).strip().lower()

        candidate_texts = [self._build_profile_text(c) for c in candidate_pool]
        all_texts = [query_text] + candidate_texts

        # 2. Stateless TF-IDF dengan token_pattern kustom (menjaga simbol bahasa seperti C++, C#, .NET)
        local_vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words=None,
            ngram_range=(1, 2),
            token_pattern=r"(?u)\b[\w#+.]+\b",
        )

        try:
            tfidf_matrix = local_vectorizer.fit_transform(all_texts)
            similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            similarity_scores = np.zeros(len(candidate_pool))

        # 3. Analisis kecocokan keahlian & pembentukan skor
        user_skills_set = set(s.lower() for s in query_user.skills)
        user_skill_ids_set = set(query_user.skill_ids) if query_user.skill_ids else set()

        needed_skills_set = set(s.lower() for s in (target_skills or []))
        needed_skill_ids_set = set(target_skill_ids or [])

        recommendations: List[RecommendationItem] = []

        for idx, candidate in enumerate(candidate_pool):
            base_score = float(similarity_scores[idx])

            cand_skills_map: Dict[str, str] = {s.lower(): s for s in candidate.skills}
            cand_skills_lower = set(cand_skills_map.keys())
            cand_skill_ids_set = set(candidate.skill_ids) if candidate.skill_ids else set()

            # Irisan keahlian (matched terms) - keahlian bersama antara pemohon dan kandidat
            matched_names: Set[str] = set()
            if user_skill_ids_set and cand_skill_ids_set:
                common_ids = user_skill_ids_set.intersection(cand_skill_ids_set)
                if common_ids:
                    # Ambil nama skill yang cocok dari kandidat
                    for s_name in candidate.skills:
                        if s_name.lower() in user_skills_set:
                            matched_names.add(s_name)
            else:
                for s_lower in user_skills_set.intersection(cand_skills_lower):
                    matched_names.add(cand_skills_map.get(s_lower, s_lower))

            # Keahlian komplementer (berdasarkan target_skills yang dibutuhkan proyek)
            complementary_names: Set[str] = set()
            if needed_skills_set or needed_skill_ids_set:
                needed_matched = cand_skills_lower.intersection(needed_skills_set)
                # Komplementer sejati: hanya keahlian yang dibutuhkan proyek yang BELUM dimiliki oleh pemohon
                for s_lower in needed_matched:
                    if s_lower not in user_skills_set:
                        complementary_names.add(cand_skills_map.get(s_lower, s_lower))

                total_needed = len(needed_skills_set) if needed_skills_set else len(needed_skill_ids_set)
                # Boost proporsional jika kandidat memenuhi keahlian yang dicari proyek
                if needed_matched and total_needed > 0:
                    boost = 0.25 * (len(needed_matched) / total_needed)
                    base_score = min(1.0, base_score + boost)
            else:
                # Jika tidak ada target spesifik, komplementer adalah skill unik kandidat di luar pemohon
                diff_skills = cand_skills_lower.difference(user_skills_set)
                for s_lower in sorted(list(diff_skills))[:3]:
                    complementary_names.add(cand_skills_map.get(s_lower, s_lower))

            # Normalisasi skor akhir
            final_score = round(min(1.0, max(0.0, base_score)), 2)

            # Saring kandidat: wajib memenuhi ambang batas relevansi minimum
            # atau memiliki minimal 1 irisan keahlian / keahlian komplementer
            if final_score < self.MIN_SCORE_THRESHOLD and not matched_names and not complementary_names:
                continue

            sorted_matched = sorted(list(matched_names))
            sorted_complementary = sorted(list(complementary_names))

            # Pembentukan alasan bahasa alami yang transparan
            if needed_skills_set and sorted_complementary:
                reason = f"Memiliki keahlian {', '.join(sorted_complementary[:2])} yang sangat dibutuhkan untuk proyek ini."
            elif sorted_complementary and not sorted_matched:
                reason = f"Memiliki keahlian {', '.join(sorted_complementary[:2])} yang dapat melengkapi profil keahlian Anda."
            elif sorted_matched:
                reason = f"Memiliki kesamaan minat dan keahlian di bidang {', '.join(sorted_matched[:2])}."
            else:
                # Jika skor TF-IDF tinggi berdasarkan keselarasan bio akademik
                reason = f"Memiliki keselarasan fokus dan latar belakang minat kolaborasi di bidang {candidate.department}."

            recommendations.append(
                RecommendationItem(
                    user_id=str(candidate.user_id),
                    name=candidate.name,
                    department=candidate.department,
                    match_level=self._derive_match_level(final_score),
                    score=final_score,
                    matched_terms=sorted_matched,
                    complementary_skills=sorted_complementary[:3],
                    reason=reason,
                )
            )

        # Pengurutan deterministik multi-kunci: (-skor, -jumlah irisan, user_id asc)
        recommendations.sort(
            key=lambda x: (
                -x.score,
                -len(x.matched_terms),
                int(x.user_id) if x.user_id.isdigit() else x.user_id,
            )
        )

        return RecommendationResponse(
            query_user_id=str(query_user.user_id),
            fallback=False,
            recommendations=recommendations[:top_k],
        )

    @classmethod
    def keyword_fallback_recommend(
        cls,
        query_user: CandidateProfile,
        candidates: List[CandidateProfile],
        target_skills: Optional[List[str]] = None,
        top_k: int = 5,
    ) -> RecommendationResponse:
        """
        Algoritma cadangan cepat (Graceful Degradation):
        Pencocokan kata kunci dan tag skill persis jika TF-IDF mengalami timeout (> 3 detik) atau galat.
        """
        candidate_pool = [c for c in candidates if str(c.user_id) != str(query_user.user_id)]
        needed_skills_set = set(s.lower() for s in (target_skills or []))
        user_skills_set = set(s.lower() for s in query_user.skills)

        recommendations: List[RecommendationItem] = []

        for candidate in candidate_pool:
            cand_skills_map = {s.lower(): s for s in candidate.skills}
            cand_skills_lower = set(cand_skills_map.keys())

            matched_lower = cand_skills_lower.intersection(user_skills_set)
            needed_matched_lower = cand_skills_lower.intersection(needed_skills_set) if needed_skills_set else set()

            matched_terms = sorted([cand_skills_map[s] for s in matched_lower])
            # Komplementer sejati di mode cadangan: keahlian target di luar skill pemohon
            complementary = sorted([cand_skills_map[s] for s in needed_matched_lower if s not in user_skills_set])

            # Hitung skor perkiraan sederhana berbasis rasio overlap
            total_target = max(1, len(needed_skills_set) if needed_skills_set else len(user_skills_set))
            overlap_count = len(needed_matched_lower) if needed_skills_set else len(matched_lower)

            if overlap_count == 0 and candidate.department != query_user.department:
                continue

            score = round(min(0.90, max(0.20, (overlap_count / total_target) * 0.80)), 2)

            if complementary:
                reason = f"[Mode Cadangan] Cocok berdasarkan keahlian {', '.join(complementary[:2])}."
            elif matched_terms:
                reason = f"[Mode Cadangan] Cocok berdasarkan kesamaan minat {', '.join(matched_terms[:2])}."
            else:
                reason = f"[Mode Cadangan] Mahasiswa dari program studi {candidate.department}."

            recommendations.append(
                RecommendationItem(
                    user_id=str(candidate.user_id),
                    name=candidate.name,
                    department=candidate.department,
                    match_level=cls._derive_match_level(score),
                    score=score,
                    matched_terms=matched_terms,
                    complementary_skills=complementary[:3],
                    reason=reason,
                )
            )

        # Pengurutan deterministik
        recommendations.sort(
            key=lambda x: (
                -x.score,
                -len(x.matched_terms),
                int(x.user_id) if x.user_id.isdigit() else x.user_id,
            )
        )

        return RecommendationResponse(
            query_user_id=str(query_user.user_id),
            fallback=True,
            recommendations=recommendations[:top_k],
        )


# Singleton stateless engine instance
recommender_engine = TFIDFRecommender()


def get_recommender_engine() -> TFIDFRecommender:
    return recommender_engine
