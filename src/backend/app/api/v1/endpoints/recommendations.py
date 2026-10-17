from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.recommendation import CandidateProfile, RecommendationQuery, RecommendationResponse
from app.services.ai_engine.recommender import recommender_engine

router = APIRouter()

# Data dummy mahasiswa awal untuk uji coba endpoint (akan digantikan query database PostgreSQL)
MOCK_STUDENTS: List[CandidateProfile] = [
    CandidateProfile(
        user_id="u_01",
        name="Rifqi Ardiansyah",
        department="Teknik Informatika",
        bio="Backend developer antusias dengan FastAPI, Python, PostgreSQL, dan pipeline AI.",
        skills=["FastAPI", "Python", "PostgreSQL", "Backend", "Git"],
        interests=["AI", "Cloud Computing", "Hackathon"]
    ),
    CandidateProfile(
        user_id="u_02",
        name="Hakim",
        department="Sistem Informasi",
        bio="UI/UX Designer dan Frontend Flutter mobile developer. Senang mendesain prototipe Figma yang rapi.",
        skills=["Flutter", "Dart", "UI/UX", "Figma", "Mobile Development"],
        interests=["Product Design", "Design Thinking", "Start-up"]
    ),
    CandidateProfile(
        user_id="u_03",
        name="Ramadhan (Rama)",
        department="Manajemen Bisnis",
        bio="Product strategist, market researcher, dan business development. Berpengalaman pitching lomba inovasi.",
        skills=["Product Management", "Business Strategy", "Market Research", "Public Speaking"],
        interests=["Business Plan", "Venture Capital", "Lomba Bisnis"]
    ),
    CandidateProfile(
        user_id="u_04",
        name="Aisyah Putri",
        department="Teknik Informatika",
        bio="Frontend web enthusiast yang mendalami React, TailwindCSS, dan integrasi REST API.",
        skills=["React", "TailwindCSS", "JavaScript", "REST API"],
        interests=["Web Development", "Open Source"]
    ),
    CandidateProfile(
        user_id="u_05",
        name="Dimas Pratama",
        department="Ilmu Komputer",
        bio="Machine Learning and Data Science explorer. Berfokus pada NLP dan Text Classification.",
        skills=["Python", "Machine Learning", "NLP", "Pandas", "Scikit-Learn"],
        interests=["Artificial Intelligence", "Research", "Data Science"]
    )
]

@router.post("/match", response_model=RecommendationResponse, summary="Rekomendasi Kolaborator Mahasiswa (AI-1)")
def get_collaborator_recommendations(query: RecommendationQuery):
    """
    Endpoint AI-1: Menganalisis kemiripan semantik dan keahlian komplementer 
    untuk merekomendasikan rekan proyek/lomba mahasiswa.
    """
    # Cari pengguna pencari di pool
    query_user = next((s for s in MOCK_STUDENTS if s.user_id == query.query_user_id), None)
    if not query_user:
        # Default query profile jika user belum terdaftar di mock
        query_user = CandidateProfile(
            user_id=query.query_user_id,
            name="Mahasiswa Pengguna",
            department="Teknik",
            bio=query.project_description or "Mencari rekan kolaborasi proyek",
            skills=query.target_skills or [],
            interests=[]
        )

    return recommender_engine.recommend(
        query_user=query_user,
        candidates=MOCK_STUDENTS,
        target_skills=query.target_skills,
        project_description=query.project_description,
        top_k=query.top_k
    )

@router.get("/candidates", response_model=List[CandidateProfile], summary="Daftar Profil Mahasiswa (Dummy/Sample)")
def list_candidates():
    return MOCK_STUDENTS
