from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.entities import User


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Fixture user mahasiswa aktif untuk pengujian degradasi anggun."""
    user = User(
        nim="999888111",
        nama="Mahasiswa Uji Degradasi",
        email="uji.degradasi@campus.ac.id",
        password_hash=hash_password("Password123!"),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        bio="Mahasiswa pengembang sistem terdistribusi dan AI."
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_recommender_graceful_degradation_on_exception(client: TestClient, db_session: Session, test_user: User):
    """
    Batasan AI #4: Kegagalan pada engine rekomendasi (misal timeout atau memory error)
    TIDAK BOLEH melumpuhkan platform; endpoint mengembalikan fallback response tanpa crash 500.
    """
    token = create_access_token(subject=test_user.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Mock TFIDFRecommender.recommend to raise an unhandled exception (simulasi kegagalan/timeout)
    with patch("app.services.ai_engine.recommender.TFIDFRecommender.recommend") as mock_rec:
        mock_rec.side_effect = TimeoutError("Simulated AI Recommender timeout (> 3000ms)")

        resp = client.post(
            "/api/v1/recommendations/match",
            json={"target_skills": ["Python"], "project_description": "Proyek Web", "top_k": 5},
            headers=headers
        )

        # Harus graceful: tidak crash 500, melainkan fallback response 200 OK
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("fallback") is True or "recommendations" in data
        assert isinstance(data["recommendations"], list)


def test_post_creation_graceful_degradation_on_moderator_failure(client: TestClient, db_session: Session, test_user: User):
    """
    Batasan AI #4: Jika ContentModerator gagal (misal regex timeout / internal error),
    pembuatan postingan (CRUD feed) TETAP BERHASIL dan konten dialihkan ke antrean review manusia (status 'menunggu_review').
    """
    token = create_access_token(subject=test_user.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Mock moderate_text to raise an unexpected exception
    with patch("app.services.ai_engine.moderator.ContentModerator.moderate_text") as mock_mod:
        mock_mod.side_effect = RuntimeError("Simulated AI moderation pipeline crash")

        payload = {
            "isi": "Postingan penting untuk koordinasi tugas akhir semester ini tanpa sensor.",
            "tipe": "umum"
        }
        resp = client.post("/api/v1/posts", json=payload, headers=headers)

        # Postingan tetap tersimpan dan tidak gagal 500
        assert resp.status_code == 201
        data = resp.json()
        assert data["isi"] == payload["isi"]
        # Berkat graceful degradation, status dialihkan ke menunggu_review untuk review manusia
        assert data["status"] == "menunggu_review"


def test_core_search_and_profile_independent_of_ai(client: TestClient, db_session: Session, test_user: User):
    """
    Fitur inti (Pencarian mahasiswa dan CRUD profil) tetap berjalan normal
    tanpa dependensi pada modul AI.
    """
    token = create_access_token(subject=test_user.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Pencarian
    search_resp = client.get("/api/v1/search?q=Informatika&tipe=mahasiswa", headers=headers)
    assert search_resp.status_code == 200
    assert "items" in search_resp.json()

    # 2. Profil
    profile_resp = client.get("/api/v1/auth/me", headers=headers)
    assert profile_resp.status_code == 200
    assert profile_resp.json()["nama"] == test_user.nama
