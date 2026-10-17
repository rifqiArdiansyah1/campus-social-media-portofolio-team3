from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from app.schemas.recommendation import CandidateProfile, RecommendationItem, RecommendationResponse

class TFIDFRecommender:
    """
    AI-1: Engine rekomendasi kolaborator mahasiswa berbasis TF-IDF & Cosine Similarity.
    Mendukung complementary skill weighting dan penjelasan berbasis bahasa alami.
    """
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words=None, # Mengakomodasi variasi istilah teknis & bahasa Indonesia
            ngram_range=(1, 2)
        )
    
    def _build_profile_text(self, profile: CandidateProfile) -> str:
        skills_text = " ".join(profile.skills)
        interests_text = " ".join(profile.interests)
        return f"{profile.bio} {skills_text} {interests_text} {profile.department}".strip().lower()

    def recommend(
        self,
        query_user: CandidateProfile,
        candidates: List[CandidateProfile],
        target_skills: Optional[List[str]] = None,
        project_description: Optional[str] = "",
        top_k: int = 5
    ) -> RecommendationResponse:
        # Filter out self
        candidate_pool = [c for c in candidates if c.user_id != query_user.user_id]
        if not candidate_pool:
            return RecommendationResponse(query_user_id=query_user.user_id, recommendations=[])

        # Query text formulation
        target_skills_str = " ".join(target_skills) if target_skills else ""
        query_text = f"{query_user.bio} {' '.join(query_user.skills)} {' '.join(query_user.interests)} {target_skills_str} {project_description}".strip().lower()

        # Build corpus
        candidate_texts = [self._build_profile_text(c) for c in candidate_pool]
        all_texts = [query_text] + candidate_texts

        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            # Cosine similarity between query (index 0) and all candidates (index 1 onwards)
            similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            # Fallback to simple keyword match if vocabulary is empty
            similarity_scores = np.zeros(len(candidate_pool))

        recommendations: List[RecommendationItem] = []
        user_skills_set = set(s.lower() for s in query_user.skills)
        needed_skills_set = set(s.lower() for s in (target_skills or []))

        for idx, candidate in enumerate(candidate_pool):
            base_score = float(similarity_scores[idx])
            cand_skills_set = set(s.lower() for s in candidate.skills)
            
            # Intersection & Complementary analysis
            matched = list(user_skills_set.intersection(cand_skills_set))
            complementary = list(cand_skills_set.difference(user_skills_set))

            # Boost score if candidate has skills explicitly needed for project
            if needed_skills_set:
                needed_matched = cand_skills_set.intersection(needed_skills_set)
                if needed_matched:
                    base_score = min(1.0, base_score + 0.25 * (len(needed_matched) / len(needed_skills_set)))

            # Normalize final score between 0.05 and 0.99
            final_score = round(max(0.05, min(0.99, base_score)), 2)

            # Generate natural language reason
            if needed_skills_set and cand_skills_set.intersection(needed_skills_set):
                matching_needed = list(cand_skills_set.intersection(needed_skills_set))
                reason = f"Memiliki keahlian {', '.join(matching_needed[:2])} yang sangat dibutuhkan untuk proyek ini."
            elif complementary:
                reason = f"Memiliki keahlian {', '.join(complementary[:2])} yang dapat melengkapi profil keahlian Anda."
            elif matched:
                reason = f"Memiliki kesamaan minat dan keahlian di bidang {', '.join(matched[:2])}."
            else:
                reason = f"Mahasiswa se-universitas dari program studi {candidate.department} dengan potensi kolaborasi tinggi."

            recommendations.append(
                RecommendationItem(
                    user_id=candidate.user_id,
                    name=candidate.name,
                    department=candidate.department,
                    score=final_score,
                    matched_terms=matched,
                    complementary_skills=complementary[:3],
                    reason=reason
                )
            )

        # Sort descending by score
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return RecommendationResponse(
            query_user_id=query_user.user_id,
            recommendations=recommendations[:top_k]
        )

# Singleton instance
recommender_engine = TFIDFRecommender()
