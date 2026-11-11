import io
from datetime import datetime, timedelta
from typing import List
from uuid import uuid4

from PIL import Image
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import Friendship, ModerationRecord, Post, Skill, User, UserBlock
from app.schemas.moderation import ModerationResponse
from app.services.ai_engine.moderator import ContentModerator, get_moderator_engine


# Helper to generate unique users
def create_unique_user(
    db: Session,
    nama: str = "Test User",
    role: str = "mahasiswa",
    jurusan: str = "Teknik Informatika",
) -> User:
    uid = uuid4().hex[:8]
    user = User(
        nim=f"NIM-{uid}",
        nama=f"{nama} {uid}",
        email=f"user-{uid}@campus.ac.id",
        password_hash="fakehash",
        role=role,
        jurusan=jurusan,
        angkatan=2022,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.user_id)
    return {"Authorization": f"Bearer {token}"}


def create_dummy_jpeg() -> bytes:
    buffer = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(73, 109, 137))
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


# ============================================================================
# 1. TEST UPLOAD POST IMAGE
# ============================================================================

def test_upload_post_image_success_and_validation(client, db_session: Session):
    user = create_unique_user(db_session, nama="Uploader")
    headers = auth_headers(user)

    # 1. Valid image upload
    jpeg_bytes = create_dummy_jpeg()
    files = {"file": ("test.jpg", jpeg_bytes, "image/jpeg")}
    res = client.post("/api/v1/uploads/post-image", files=files, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["path"].startswith(f"{user.user_id}/")
    assert data["url"] is not None
    assert data["content_type"] == "image/jpeg"
    assert data["size_bytes"] > 0

    # 2. Invalid fake image file (text masquerading as .jpg)
    fake_files = {"file": ("fake.jpg", b"NOT AN IMAGE", "image/jpeg")}
    res_fake = client.post("/api/v1/uploads/post-image", files=fake_files, headers=headers)
    assert res_fake.status_code == 422
    assert res_fake.json()["code"] == "INVALID_IMAGE_FILE"


# ============================================================================
# 2. TEST POST CREATION & AI PRE-SCREENING (AD-01)
# ============================================================================

class FakeModerator(ContentModerator):
    def __init__(self, target_label: str, confidence: float = 0.90, should_timeout: bool = False):
        self.target_label = target_label
        self.confidence = confidence
        self.should_timeout = should_timeout

    def moderate_text(self, post_id: str, content: str) -> ModerationResponse:
        import time
        if self.should_timeout:
            time.sleep(0.5)
        return ModerationResponse(
            post_id=post_id,
            label=self.target_label,
            categories=["ujaran_kasar"] if self.target_label != "aman" else [],
            confidence=self.confidence,
            explanation=f"Fake AI labeled as {self.target_label}",
        )


def test_create_post_ai_prescreening_safe(client, db_session: Session):
    user = create_unique_user(db_session, nama="Safe Writer")
    headers = auth_headers(user)

    # Inject Safe AI Moderator
    fake_safe_ai = FakeModerator(target_label="aman", confidence=0.92)
    client.app.dependency_overrides[get_moderator_engine] = lambda: fake_safe_ai

    try:
        payload = {
            "isi": "Ini adalah postingan positif tentang proyek kuliah kami.",
            "tipe": "umum",
        }
        res = client.post("/api/v1/posts", json=payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "tayang"
        assert data["is_owner"] is True
        assert data["can_edit"] is False

        # Verify record in moderation_records
        rec = db_session.query(ModerationRecord).filter(ModerationRecord.post_id == data["post_id"]).first()
        assert rec is not None
        assert rec.label_ai == "aman"
        assert rec.confidence == 0.92
    finally:
        client.app.dependency_overrides.pop(get_moderator_engine, None)


def test_create_post_ai_prescreening_flagged_and_timeout(client, db_session: Session):
    user = create_unique_user(db_session, nama="Flagged Writer")
    headers = auth_headers(user)

    # 1. Test Flagged -> status 'menunggu_review'
    fake_flagged_ai = FakeModerator(target_label="berpotensi_melanggar", confidence=0.88)
    client.app.dependency_overrides[get_moderator_engine] = lambda: fake_flagged_ai

    try:
        payload = {
            "isi": "Ini postingan yang mengandung kata-kata kasar.",
            "tipe": "umum",
        }
        res = client.post("/api/v1/posts", json=payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "menunggu_review"
        assert data["is_owner"] is True
        assert data["moderation_note"] is not None
    finally:
        client.app.dependency_overrides.pop(get_moderator_engine, None)

    # 2. Test Timeout -> fallback status 'menunggu_review'
    # Use very short timeout for test
    from app.core.config import settings
    original_timeout = settings.AI_TIMEOUT_SECONDS
    settings.AI_TIMEOUT_SECONDS = 0.05
    fake_slow_ai = FakeModerator(target_label="aman", should_timeout=True)
    client.app.dependency_overrides[get_moderator_engine] = lambda: fake_slow_ai

    try:
        payload_slow = {
            "isi": "Postingan saat AI lambat merespons.",
            "tipe": "umum",
        }
        res_slow = client.post("/api/v1/posts", json=payload_slow, headers=headers)
        assert res_slow.status_code == 201
        assert res_slow.json()["status"] == "menunggu_review"
    finally:
        settings.AI_TIMEOUT_SECONDS = original_timeout
        client.app.dependency_overrides.pop(get_moderator_engine, None)


# ============================================================================
# 3. TEST POST CREATION VALIDATIONS (EMPTY, SKILLS DEDUPE, IMAGE OWNERSHIP)
# ============================================================================

def test_create_post_validations(client, db_session: Session):
    user = create_unique_user(db_session, nama="Valid User")
    headers = auth_headers(user)

    s1 = Skill(nama=f"SkillA-{uuid4().hex[:4]}", tipe="skill")
    s2 = Skill(nama=f"SkillB-{uuid4().hex[:4]}", tipe="skill")
    db_session.add_all([s1, s2])
    db_session.commit()

    # 1. Empty isi
    res_empty = client.post("/api/v1/posts", json={"isi": "   ", "tipe": "umum"}, headers=headers)
    assert res_empty.status_code == 422

    # 2. Recruiting without skill
    res_no_skill = client.post("/api/v1/posts", json={"isi": "Cari tim", "tipe": "cari_anggota", "skill_ids": []}, headers=headers)
    assert res_no_skill.status_code == 422

    # 3. Recruiting with duplicate skills -> deduplicated successfully
    res_dup_skills = client.post(
        "/api/v1/posts",
        json={"isi": "Cari tim frontend", "tipe": "cari_anggota", "skill_ids": [s1.skill_id, s1.skill_id, s2.skill_id]},
        headers=headers,
    )
    assert res_dup_skills.status_code == 201
    assert len(res_dup_skills.json()["skills"]) == 2

    # 4. Non-existent skill ID
    res_bad_skill = client.post(
        "/api/v1/posts",
        json={"isi": "Proyek baru", "tipe": "umum", "skill_ids": [9999999]},
        headers=headers,
    )
    assert res_bad_skill.status_code == 422
    assert res_bad_skill.json()["code"] == "INVALID_SKILL_ID"

    # 5. Invalid image ownership (using someone else's user_id or external URL)
    res_bad_img1 = client.post(
        "/api/v1/posts",
        json={"isi": "Test image", "gambar_url": "https://malicious.com/exploit.jpg"},
        headers=headers,
    )
    assert res_bad_img1.status_code == 422
    assert res_bad_img1.json()["code"] == "INVALID_IMAGE_OWNERSHIP"

    other_user_id = user.user_id + 999
    res_bad_img2 = client.post(
        "/api/v1/posts",
        json={"isi": "Test image other user", "gambar_url": f"{other_user_id}/photo.jpg"},
        headers=headers,
    )
    assert res_bad_img2.status_code == 422
    assert res_bad_img2.json()["code"] == "INVALID_IMAGE_OWNERSHIP"

    # 6. Path traversal attempt in gambar_url
    res_traversal = client.post(
        "/api/v1/posts",
        json={"isi": "Test traversal", "gambar_url": f"{user.user_id}/../other/secret.jpg"},
        headers=headers,
    )
    assert res_traversal.status_code == 422
    assert res_traversal.json()["code"] == "INVALID_IMAGE_OWNERSHIP"


# ============================================================================
# 4. TEST FEED KEYSET PAGINATION, SORTING & TIE-BREAKING
# ============================================================================

def test_feed_keyset_pagination_and_sorting(client, db_session: Session):
    user = create_unique_user(db_session, nama="Poster")
    headers = auth_headers(user)

    # Create 5 posts directly with distinct and identical timestamps
    base_time = datetime.utcnow()
    created_posts: List[Post] = []
    for i in range(5):
        p = Post(
            user_id=user.user_id,
            isi=f"Feed Post #{i}",
            tipe="umum",
            status="tayang",
            created_at=base_time + timedelta(seconds=i if i < 3 else 2),  # i=2 and i=3 have same timestamp (tie)
        )
        db_session.add(p)
        created_posts.append(p)
    db_session.commit()

    # Query first page (limit=2)
    res1 = client.get("/api/v1/posts?limit=2", headers=headers)
    assert res1.status_code == 200
    page1 = res1.json()
    assert len(page1["items"]) == 2
    assert page1["has_more"] is True
    assert page1["next_cursor"] is not None

    # Query second page with cursor
    cursor = page1["next_cursor"]
    res2 = client.get(f"/api/v1/posts?limit=2&cursor={cursor}", headers=headers)
    assert res2.status_code == 200
    page2 = res2.json()
    assert len(page2["items"]) == 2

    # Ensure no duplicates between page 1 and page 2
    ids_p1 = [item["post_id"] for item in page1["items"]]
    ids_p2 = [item["post_id"] for item in page2["items"]]
    assert set(ids_p1).isdisjoint(set(ids_p2))


# ============================================================================
# 5. TEST MUTUAL BLOCKING & SCOPES (ALL, FRIENDS, RECRUITING)
# ============================================================================

def test_feed_scopes_and_mutual_blocking(client, db_session: Session):
    user_a = create_unique_user(db_session, nama="User A")
    user_b = create_unique_user(db_session, nama="User B")
    user_c = create_unique_user(db_session, nama="User C")

    headers_a = auth_headers(user_a)

    # User B is accepted friend with A
    db_session.add(Friendship(requester_id=user_a.user_id, addressee_id=user_b.user_id, status="diterima"))
    # User C has pending friendship with A
    db_session.add(Friendship(requester_id=user_c.user_id, addressee_id=user_a.user_id, status="menunggu"))

    # Posts
    p_a = Post(user_id=user_a.user_id, isi="Post A Umum", tipe="umum", status="tayang")
    p_b_rec = Post(user_id=user_b.user_id, isi="Post B Cari Anggota", tipe="cari_anggota", status="tayang")
    p_c = Post(user_id=user_c.user_id, isi="Post C Pending Friend", tipe="umum", status="tayang")
    db_session.add_all([p_a, p_b_rec, p_c])
    db_session.commit()

    # 1. Test scope=recruiting
    res_rec = client.get("/api/v1/posts?scope=recruiting", headers=headers_a)
    assert res_rec.status_code == 200
    items_rec = res_rec.json()["items"]
    assert all(item["tipe"] == "cari_anggota" for item in items_rec)
    assert any(item["post_id"] == p_b_rec.post_id for item in items_rec)

    # 2. Test scope=friends (Should see A's and B's posts, but NOT C's because pending)
    res_fr = client.get("/api/v1/posts?scope=friends", headers=headers_a)
    assert res_fr.status_code == 200
    ids_fr = [item["post_id"] for item in res_fr.json()["items"]]
    assert p_a.post_id in ids_fr
    assert p_b_rec.post_id in ids_fr
    assert p_c.post_id not in ids_fr

    # 3. Test Mutual Blocking: A blocks B
    db_session.add(UserBlock(blocker_id=user_a.user_id, blocked_id=user_b.user_id))
    db_session.commit()

    res_blocked = client.get("/api/v1/posts", headers=headers_a)
    ids_blocked = [item["post_id"] for item in res_blocked.json()["items"]]
    assert p_b_rec.post_id not in ids_blocked

    # Single post detail for blocked post -> 404
    res_single = client.get(f"/api/v1/posts/{p_b_rec.post_id}", headers=headers_a)
    assert res_single.status_code == 404


# ============================================================================
# 6. TEST STATUS MASKING & MODERATION NOTE PRIVACY
# ============================================================================

def test_post_status_masking_and_moderation_notes_privacy(client, db_session: Session):
    author = create_unique_user(db_session, nama="Author", jurusan="Teknik Informatika")
    visitor = create_unique_user(db_session, nama="Visitor", jurusan="Sistem Informasi")
    moderator_same = create_unique_user(db_session, nama="Kaprodi TI", role="moderator", jurusan="Teknik Informatika")

    # Post with status 'direview' and moderation record
    post = Post(user_id=author.user_id, isi="Post Under Review", tipe="umum", status="direview")
    db_session.add(post)
    db_session.flush()

    mod_rec = ModerationRecord(
        post_id=post.post_id,
        label_ai="perlu_review",
        penjelasan_ai="Sensitive context reported",
        catatan_admin="Tolong jangan spam",
    )
    db_session.add(mod_rec)
    db_session.commit()

    # 1. Visitor reads post -> status masked to 'tayang', moderation_note is None
    res_vis = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(visitor))
    assert res_vis.status_code == 200
    data_vis = res_vis.json()
    assert data_vis["status"] == "tayang"
    assert data_vis["moderation_note"] is None
    assert data_vis["can_report"] is True
    assert data_vis["can_takedown"] is False

    # 2. Author reads post -> status is 'direview', moderation_note visible
    res_auth = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(author))
    assert res_auth.status_code == 200
    data_auth = res_auth.json()
    assert data_auth["status"] == "direview"
    assert data_auth["moderation_note"] == "Tolong jangan spam"
    assert data_auth["is_owner"] is True

    # 3. Moderator same prodi reads post -> status is 'direview', moderation_note visible, can_takedown is True
    res_mod = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(moderator_same))
    assert res_mod.status_code == 200
    data_mod = res_mod.json()
    assert data_mod["status"] == "direview"
    assert data_mod["can_takedown"] is True


# ============================================================================
# 7. TEST PATCH POST ACCESS, CONFLICT & RE-EVALUATION
# ============================================================================

def test_update_post_conflict_and_permissions(client, db_session: Session):
    owner = create_unique_user(db_session, nama="Post Owner")
    other = create_unique_user(db_session, nama="Other User")

    post_tayang = Post(user_id=owner.user_id, isi="Sudah Tayang", tipe="umum", status="tayang")
    post_revisi = Post(user_id=owner.user_id, isi="Perlu Revisi", tipe="umum", status="revisi")
    db_session.add_all([post_tayang, post_revisi])
    db_session.commit()

    # 1. Other user attempts to update -> 403 Forbidden
    res_other = client.patch(
        f"/api/v1/posts/{post_revisi.post_id}",
        json={"isi": "Hacked content"},
        headers=auth_headers(other),
    )
    assert res_other.status_code == 403

    # 2. Owner attempts to update post with status 'tayang' -> 409 Conflict
    res_conflict = client.patch(
        f"/api/v1/posts/{post_tayang.post_id}",
        json={"isi": "Update tayang"},
        headers=auth_headers(owner),
    )
    assert res_conflict.status_code == 409
    assert res_conflict.json()["code"] == "POST_STATE_CONFLICT"

    # 3. Owner updates post with status 'revisi' -> 200 OK & re-evaluated by AI
    fake_safe = FakeModerator(target_label="aman", confidence=0.95)
    client.app.dependency_overrides[get_moderator_engine] = lambda: fake_safe
    try:
        res_ok = client.patch(
            f"/api/v1/posts/{post_revisi.post_id}",
            json={"isi": "Konten yang sudah diperbaiki sesuai catatan"},
            headers=auth_headers(owner),
        )
        assert res_ok.status_code == 200
        assert res_ok.json()["status"] == "tayang"
        assert res_ok.json()["isi"] == "Konten yang sudah diperbaiki sesuai catatan"
    finally:
        client.app.dependency_overrides.pop(get_moderator_engine, None)


# ============================================================================
# 8. TEST GET MY POSTS & ROUTE ORDER (/me)
# ============================================================================

def test_get_my_posts_and_route_order(client, db_session: Session):
    user = create_unique_user(db_session, nama="My Posts Tester")
    headers = auth_headers(user)

    p1 = Post(user_id=user.user_id, isi="Post 1", tipe="umum", status="tayang")
    p2 = Post(user_id=user.user_id, isi="Post 2", tipe="umum", status="menunggu_review")
    db_session.add_all([p1, p2])
    db_session.commit()

    res = client.get("/api/v1/posts/me?limit=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 2
    statuses = {item["status"] for item in data["items"]}
    assert "tayang" in statuses
    assert "menunggu_review" in statuses


def test_feed_scope_prodi(client, db_session: Session):
    uid = uuid4().hex[:6]
    jurusan_ti = f"Teknik Informatika {uid}"
    jurusan_si = f"Sistem Informasi {uid}"

    u_ti = create_unique_user(db_session, nama="User TI", jurusan=jurusan_ti)
    u_si = create_unique_user(db_session, nama="User SI", jurusan=jurusan_si)

    p_ti = Post(user_id=u_ti.user_id, isi="Post dari Mahasiswa TI", tipe="umum", status="tayang")
    p_si = Post(user_id=u_si.user_id, isi="Post dari Mahasiswa SI", tipe="umum", status="tayang")
    db_session.add_all([p_ti, p_si])
    db_session.commit()

    # Query with scope=prodi as u_ti -> should see p_ti but not p_si
    res = client.get("/api/v1/posts?scope=prodi", headers=auth_headers(u_ti))
    assert res.status_code == 200
    ids = [item["post_id"] for item in res.json()["items"]]
    assert p_ti.post_id in ids
    assert p_si.post_id not in ids

