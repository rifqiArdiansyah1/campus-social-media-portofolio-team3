from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import Post, RecommendationLog, User, UserBlock
from app.schemas.recommendation import CandidateProfile
from app.services.ai_engine.moderator import ContentModerator
from app.services.ai_engine.recommender import TFIDFRecommender
from app.services.ai_engine.validator import (
    validate_moderation_output,
    validate_recommendation_output,
)

# ============================================================================
# 1. UNIT TESTS: CONTENT MODERATOR (NORMALIZATION, EVASION & BENCHMARKS)
# ============================================================================

def test_moderator_explicit_profanity():
    moderator = ContentModerator()
    res = moderator.moderate_text("post_01", "Dasar anjing bangsat lu tolol banget!")
    assert res.label == "berpotensi_melanggar"
    assert res.confidence >= 0.75
    assert "ujaran_kasar" in res.categories
    assert "[Saran AI]" in res.explanation
    validate_moderation_output(res.model_dump())


def test_moderator_leetspeak_detection():
    moderator = ContentModerator()
    # 4nj1ng, b3g0, t0l0l
    res1 = moderator.moderate_text("post_02", "Dasar 4nj1ng lu!")
    assert res1.label == "berpotensi_melanggar"
    assert "ujaran_kasar" in res1.categories

    res2 = moderator.moderate_text("post_03", "Mukanya b3g0 banget")
    assert res2.label == "berpotensi_melanggar"
    assert "ujaran_kasar" in res2.categories


def test_moderator_character_repetition_collapse():
    moderator = ContentModerator()
    # "Anjiiiiiiiing", "tooolooool", "goblokkkkk"
    res1 = moderator.moderate_text("post_04", "Anjiiiiiiiing kaget gue!")
    assert res1.label == "berpotensi_melanggar"

    res2 = moderator.moderate_text("post_05", "Lu tooolooool amat")
    assert res2.label == "berpotensi_melanggar"


def test_moderator_cyrillic_homoglyphs():
    moderator = ContentModerator()
    # Cyrillic 'а' (\u0430) and 'о' (\u043e)
    res1 = moderator.moderate_text("post_06", "Emang dasar \u0430njing ga tahu diri!")
    assert res1.label == "berpotensi_melanggar"

    res2 = moderator.moderate_text("post_07", "Kelakuan lu beneran k\u043ent\u043el abis")
    assert res2.label == "berpotensi_melanggar"


def test_moderator_zero_width_spaces():
    moderator = ContentModerator()
    # Zero-width space \u200B inside "anjing"
    res = moderator.moderate_text("post_08", "Dasar an\u200bjing lu!")
    assert res.label == "berpotensi_melanggar"


def test_moderator_single_char_delimiters():
    moderator = ContentModerator()
    # "a.n.j.i.n.g", "b-a-n-g-s-a-t"
    res1 = moderator.moderate_text("post_09", "Woy t.o.l.o.l dengerin!")
    assert res1.label == "berpotensi_melanggar"

    res2 = moderator.moderate_text("post_10", "Kelakuan b-a-n-g-s-a-t kayak gitu")
    assert res2.label == "berpotensi_melanggar"


def test_moderator_raw_patterns_spam_scam():
    moderator = ContentModerator()
    res1 = moderator.moderate_text("post_11", "Solusi cuan: investasi pasti untung 100% langsung kaya!")
    assert res1.label == "berpotensi_melanggar"
    assert "penipuan" in res1.categories

    res2 = moderator.moderate_text("post_12", "Minat saldo gratis hubungi wa.me/628123456789")
    assert res2.label == "berpotensi_melanggar"
    assert "spam" in res2.categories


def test_moderator_false_positive_traps_must_be_safe():
    moderator = ContentModerator()

    # Trap 1: "Bang satu" should NOT match "bangsat"
    res1 = moderator.moderate_text("p1", "Bang satu porsi lagi tolong dibungkus ya mas.")
    assert res1.label == "aman"

    # Trap 2: "begonia" should NOT match "bego"
    res2 = moderator.moderate_text("p2", "Tanaman begonia merah di taman sedang mekar indah.")
    assert res2.label == "aman"

    # Trap 3: "Aamiin" double letter preserved
    res3 = moderator.moderate_text("p3", "Aamiin ya rabbal alamin semoga ujian lancar.")
    assert res3.label == "aman"

    # Trap 4: "Mohon maaf" double letter preserved
    res4 = moderator.moderate_text("p4", "Mohon maaf atas keterlambatan pengumpulan tugas.")
    assert res4.label == "aman"

    # Trap 5: Academic & medical contexts
    res5 = moderator.moderate_text("p5", "Penelitian pencegahan kanker serviks pada usia produktif.")
    assert res5.label == "aman"

    res6 = moderator.moderate_text("p6", "Kajian universitas meminimalisir praktik curang dalam ujian daring.")
    assert res6.label == "aman"


def test_moderator_borderline_cases():
    moderator = ContentModerator()
    res1 = moderator.moderate_text("p7", "Males banget rasanya besok harus kuliah pagi.")
    assert res1.label == "perlu_review"

    res2 = moderator.moderate_text("p8", "Dosen ga jelas ngasih instruksi tugas besar.")
    assert res2.label == "perlu_review"


# ============================================================================
# 2. UNIT TESTS: RECOMMENDER (STATELESS CONCURRENCY & DETERMINISM)
# ============================================================================

def test_recommender_stateless_concurrency():
    """Memverifikasi bahwa eksekusi paralel di thread pool tidak merusak vocabulary/matrix."""
    recommender = TFIDFRecommender()

    user_a = CandidateProfile(
        user_id="101",
        name="Alice",
        department="Teknik Informatika",
        bio="Fullstack python and react developer",
        skills=["Python", "React", "FastAPI"],
    )
    user_b = CandidateProfile(
        user_id="102",
        name="Bob",
        department="Desain Komunikasi Visual",
        bio="UI UX designer Figma illustration",
        skills=["Figma", "UI/UX", "Illustration"],
    )

    candidates = [
        CandidateProfile(
            user_id="201",
            name="Charlie",
            department="Teknik Informatika",
            bio="Backend python django developer",
            skills=["Python", "Django", "PostgreSQL"],
        ),
        CandidateProfile(
            user_id="202",
            name="Diana",
            department="Sistem Informasi",
            bio="Frontend react vue typescript",
            skills=["React", "TypeScript", "Vue"],
        ),
        CandidateProfile(
            user_id="203",
            name="Evan",
            department="DKV",
            bio="Product designer figma design thinking",
            skills=["Figma", "UI/UX", "Product Design"],
        ),
    ]

    def run_query(user, target):
        return recommender.recommend(
            query_user=user,
            candidates=candidates,
            target_skills=target,
            top_k=2,
        )

    # Eksekusi 10 kueri secara concurrent di thread pool
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = []
        for i in range(10):
            if i % 2 == 0:
                futures.append(executor.submit(run_query, user_a, ["Python"]))
            else:
                futures.append(executor.submit(run_query, user_b, ["Figma"]))

        results = [f.result() for f in futures]

    assert len(results) == 10
    # Seluruh hasil user_a harus konsisten (Charlie urutan pertama karena Python)
    for i in range(0, 10, 2):
        assert results[i].recommendations[0].user_id == "201"
        validate_recommendation_output(results[i].model_dump())

    # Seluruh hasil user_b harus konsisten (Evan urutan pertama karena Figma)
    for i in range(1, 10, 2):
        assert results[i].recommendations[0].user_id == "203"
        validate_recommendation_output(results[i].model_dump())


def test_recommender_deterministic_sorting():
    recommender = TFIDFRecommender()

    query_user = CandidateProfile(
        user_id="10",
        name="Seeker",
        department="Informatika",
        bio="Mencari partner lomba AI",
        skills=["Python", "Machine Learning"],
    )

    candidates = [
        CandidateProfile(user_id="2", name="Beta", department="Informatika", bio="ML engineer", skills=["Python", "ML"]),
        CandidateProfile(user_id="1", name="Alpha", department="Informatika", bio="ML engineer", skills=["Python", "ML"]),
    ]

    # Eksekusi berulang harus menghasilkan urutan yang persis sama
    res1 = recommender.recommend(query_user, candidates)
    res2 = recommender.recommend(query_user, candidates)

    assert [r.user_id for r in res1.recommendations] == [r.user_id for r in res2.recommendations]
    # Tie-breaking deterministik: user_id 1 (Alpha) sebelum user_id 2 (Beta) jika skor & irisan sama
    assert res1.recommendations[0].user_id == "1"


def test_recommender_programming_languages_tokens():
    """Memastikan bahasa pemrograman seperti C, C++, C#, .NET tidak rusak oleh tokenizer."""
    recommender = TFIDFRecommender()

    query_user = CandidateProfile(
        user_id="10",
        name="Seeker",
        department="Teknik Komputer",
        bio="Embedded systems and backend engineering",
        skills=["C++", "C#", ".NET"],
    )

    candidate_cpp = CandidateProfile(
        user_id="11",
        name="CPP Dev",
        department="Teknik Komputer",
        bio="Low level programming with C++ and C",
        skills=["C++", "C"],
    )

    candidate_other = CandidateProfile(
        user_id="12",
        name="Web Dev",
        department="Sistem Informasi",
        bio="PHP laravel developer",
        skills=["PHP", "Laravel"],
    )

    res = recommender.recommend(query_user, [candidate_cpp, candidate_other], target_skills=["C++"])
    assert len(res.recommendations) > 0
    assert res.recommendations[0].user_id == "11"
    assert "C++" in res.recommendations[0].matched_terms or "C++" in res.recommendations[0].complementary_skills


def test_recommender_empty_profile_returns_empty():
    recommender = TFIDFRecommender()

    empty_user = CandidateProfile(
        user_id="99",
        name="Empty User",
        department="Teknik",
        bio="",
        skills=[],
        interests=[],
    )

    candidate = CandidateProfile(
        user_id="100",
        name="Active User",
        department="Teknik",
        bio="Active developer",
        skills=["Python"],
    )

    res = recommender.recommend(empty_user, [candidate])
    assert res.recommendations == []
    assert res.fallback is False


# ============================================================================
# 3. INTEGRATION TESTS: DATABASE FILTERING, ACCESS CONTROL & FALLBACK
# ============================================================================

def test_api_recommendations_match_excludes_self_blocks_staff(client: TestClient, db_session: Session):
    db = db_session
    # Buat pengguna
    u_seeker = User(nim="111111", nama="Mahasiswa Seeker", email="seeker@univ.ac.id", password_hash="hash", role="mahasiswa", jurusan="Informatika", bio="Suka Python")
    u_cand1 = User(nim="222222", nama="Kandidat Sah", email="cand1@univ.ac.id", password_hash="hash", role="mahasiswa", jurusan="Informatika", bio="Python developer")
    u_blocked = User(nim="333333", nama="User Terblokir", email="blocked@univ.ac.id", password_hash="hash", role="mahasiswa", jurusan="Informatika", bio="Python pro")
    u_staff = User(nim="444444", nama="Dosen Pembimbing", email="dosen@univ.ac.id", password_hash="hash", role="moderator", jurusan="Informatika", bio="Python lecturer")

    db.add_all([u_seeker, u_cand1, u_blocked, u_staff])
    db.commit()

    # Relasi blokir: Seeker memblokir u_blocked
    block = UserBlock(blocker_id=u_seeker.user_id, blocked_id=u_blocked.user_id)
    db.add(block)
    db.commit()

    token = create_access_token(subject=u_seeker.user_id)

    response = client.post(
        "/api/v1/recommendations/match",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "target_skills": ["Python"],
            "project_description": "Membangun API Python",
            "top_k": 5
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["query_user_id"] == str(u_seeker.user_id)

    cand_ids = [r["user_id"] for r in data["recommendations"]]
    assert str(u_cand1.user_id) in cand_ids
    assert str(u_seeker.user_id) not in cand_ids  # Diri sendiri tidak boleh muncul
    assert str(u_blocked.user_id) not in cand_ids  # User terblokir tidak boleh muncul
    assert str(u_staff.user_id) not in cand_ids  # Moderator/staff tidak boleh muncul
    validate_recommendation_output(data)


def test_api_recommendations_for_post_authorization(client: TestClient, db_session: Session):
    db = db_session
    u_author = User(nim="555551", nama="Author Post", email="author@univ.ac.id", password_hash="hash", role="mahasiswa", jurusan="Teknik")
    u_other = User(nim="555552", nama="Other Mahasiswa", email="other@univ.ac.id", password_hash="hash", role="mahasiswa", jurusan="Teknik")
    db.add_all([u_author, u_other])
    db.commit()

    # Post cari_anggota milik author
    p_valid = Post(user_id=u_author.user_id, isi="Mencari desainer UI/UX untuk lomba", tipe="cari_anggota", status="tayang")
    # Post umum (bukan cari_anggota)
    p_umum = Post(user_id=u_author.user_id, isi="Postingan sharing informasi biasa", tipe="umum", status="tayang")
    db.add_all([p_valid, p_umum])
    db.commit()

    token_author = create_access_token(subject=u_author.user_id)
    token_other = create_access_token(subject=u_other.user_id)

    # 1. Author memanggil untuk post valid -> Sukses 200
    res_ok = client.post(
        f"/api/v1/recommendations/for-post/{p_valid.post_id}",
        headers={"Authorization": f"Bearer {token_author}"}
    )
    assert res_ok.status_code == 200

    # 2. Non-author memanggil untuk post milik author -> 404 (Anti-ID enumeration)
    res_forbidden = client.post(
        f"/api/v1/recommendations/for-post/{p_valid.post_id}",
        headers={"Authorization": f"Bearer {token_other}"}
    )
    assert res_forbidden.status_code == 404

    # 3. Author memanggil untuk post bertipe 'umum' -> 404
    res_not_recruitment = client.post(
        f"/api/v1/recommendations/for-post/{p_umum.post_id}",
        headers={"Authorization": f"Bearer {token_author}"}
    )
    assert res_not_recruitment.status_code == 404


def test_api_recommendations_feedback_idempotent_and_idor_protection(client: TestClient, db_session: Session):
    db = db_session
    u_user1 = User(nim="666661", nama="User Satu", email="u1@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_user2 = User(nim="666662", nama="User Dua", email="u2@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_target = User(nim="666663", nama="User Target", email="target@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add_all([u_user1, u_user2, u_target])
    db.commit()

    # Log milik user1
    log_entry = RecommendationLog(
        pemohon_id=u_user1.user_id,
        kandidat_id=u_target.user_id,
        kebutuhan_teks="Kebutuhan Python",
        skor=0.85,
        alasan="Keahlian cocok",
        is_fallback=False,
        sumber="match",
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    token_u1 = create_access_token(subject=u_user1.user_id)
    token_u2 = create_access_token(subject=u_user2.user_id)

    # 1. User2 mencoba mengisi feedback untuk log milik User1 -> 404
    res_idor = client.post(
        f"/api/v1/recommendations/{log_entry.rec_id}/feedback",
        headers={"Authorization": f"Bearer {token_u2}"},
        json={"umpan_balik": "relevan"}
    )
    assert res_idor.status_code == 404

    # 2. User1 mengisi feedback -> 200
    res_success = client.post(
        f"/api/v1/recommendations/{log_entry.rec_id}/feedback",
        headers={"Authorization": f"Bearer {token_u1}"},
        json={"umpan_balik": "relevan"}
    )
    assert res_success.status_code == 200
    db.refresh(log_entry)
    assert log_entry.umpan_balik == "relevan"

    # 3. Idempoten: User1 mengubah umpan balik -> 200
    res_update = client.post(
        f"/api/v1/recommendations/{log_entry.rec_id}/feedback",
        headers={"Authorization": f"Bearer {token_u1}"},
        json={"umpan_balik": "tidak_relevan"}
    )
    assert res_update.status_code == 200
    db.refresh(log_entry)
    assert log_entry.umpan_balik == "tidak_relevan"


def test_api_moderation_check_restricted_to_staff(client: TestClient, db_session: Session):
    db = db_session
    u_mhs = User(nim="777771", nama="Mhs Biasa", email="mhs@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_admin = User(nim="777772", nama="Admin Kampus", email="admin@univ.ac.id", password_hash="hash", role="admin")
    db.add_all([u_mhs, u_admin])
    db.commit()

    token_mhs = create_access_token(subject=u_mhs.user_id)
    token_admin = create_access_token(subject=u_admin.user_id)

    # 1. Mahasiswa mengakses oracle /moderation/check -> 403 Forbidden
    res_forbidden = client.post(
        "/api/v1/moderation/check",
        headers={"Authorization": f"Bearer {token_mhs}"},
        json={"post_id": "test_1", "content": "Teks postingan"}
    )
    assert res_forbidden.status_code == 403

    # 2. Admin mengakses /moderation/check -> 200 OK
    res_ok = client.post(
        "/api/v1/moderation/check",
        headers={"Authorization": f"Bearer {token_admin}"},
        json={"post_id": "test_2", "content": "Teks postingan aman"}
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["label"] == "aman"


def test_schema_validation_runtime_enforcement(client: TestClient, db_session: Session, monkeypatch):
    import jsonschema
    import pytest

    # 1. Invalid recommendation schema raises ValidationError
    bad_rec_data = {
        "query_user_id": "1",
        "recommendations": [
            {
                "user_id": "2",
                "score": 2.5,  # Invalid: score > 1.0
                "matched_terms": [],
                "complementary_skills": [],
                "reason": "Invalid score",
            }
        ],
    }
    with pytest.raises(jsonschema.ValidationError):
        validate_recommendation_output(bad_rec_data)

    # 2. Invalid moderation schema raises ValidationError
    bad_mod_data = {
        "post_id": "p1",
        "label": "bukan_label_valid",  # Invalid enum value
        "categories": [],
        "confidence": 0.5,
        "explanation": "Invalid label",
    }
    with pytest.raises(jsonschema.ValidationError):
        validate_moderation_output(bad_mod_data)

    # 3. Runtime API fallback triggered when schema validation fails
    db = db_session
    u_seeker = User(nim="888881", nama="Seeker", email="seeker@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_cand = User(nim="888882", nama="Candidate", email="cand@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add_all([u_seeker, u_cand])
    db.commit()

    token_seeker = create_access_token(subject=u_seeker.user_id)

    # Mock recommender.recommend to return an item that violates schema validation
    from app.schemas.recommendation import RecommendationItem, RecommendationResponse
    from app.services.ai_engine.recommender import TFIDFRecommender

    def bad_recommend(*args, **kwargs):
        return RecommendationResponse(
            query_user_id=str(u_seeker.user_id),
            recommendations=[
                RecommendationItem(
                    user_id=str(u_cand.user_id),
                    score=0.8,
                    matched_terms=[],
                    complementary_skills=[],
                    reason="Test reason",
                    match_level="LabelIlegalYangTidakAdaDiEnum",  # Schema violation!
                )
            ]
        )

    monkeypatch.setattr(TFIDFRecommender, "recommend", bad_recommend)

    # Request ke /api/v1/recommendations/match harus mengalihkan ke mode fallback, bukan error 500
    res = client.post(
        "/api/v1/recommendations/match",
        headers={"Authorization": f"Bearer {token_seeker}"},
        json={"target_skills": ["Python"]}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["fallback"] is True
