import random
import uuid

from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.entities import Friendship, Skill, User, UserBlock, UserSkill

# ============================================================================
# HELPER FIXTURES & UTILS
# ============================================================================

def create_unique_user(
    db: Session,
    role: str = "mahasiswa",
    jurusan: str = "Teknik Informatika",
    angkatan: int = 2023,
    nama: str = "Test User",
) -> User:
    uid = uuid.uuid4().hex[:8]
    user = User(
        nim=f"9{random.randint(10000000, 99999999)}",
        nama=nama,
        email=f"user_{uid}@campus.ac.id",
        password_hash=hash_password("Password123!"),
        role=role,
        jurusan=jurusan,
        angkatan=angkatan,
        bio="Bio testing",
        kontak_url="https://github.com/test",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.user_id)
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# 1. SKILLS CATALOG ENDPOINTS (GET /api/v1/skills)
# ============================================================================

def test_get_skills_filter_and_search(client, db_session: Session):
    # Seed unique master skills for this test
    uid = uuid.uuid4().hex[:6]
    s0 = Skill(nama=f"Python Programming {uid}", tipe="skill")
    s1 = Skill(nama=f"Wildcard {uid} 100% Guaranteed", tipe="skill")
    s2 = Skill(nama=f"Wildcard_{uid}_C_Sharp", tipe="skill")
    s3 = Skill(nama=f"Unique Minat {uid}", tipe="minat")
    db_session.add_all([s0, s1, s2, s3])
    db_session.commit()

    # Filter tipe=skill
    res = client.get("/api/v1/skills?tipe=skill")
    assert res.status_code == 200
    skills = res.json()
    assert len(skills) > 0
    assert all(item["tipe"] == "skill" for item in skills)

    # Filter tipe=minat
    res = client.get("/api/v1/skills?tipe=minat")
    assert res.status_code == 200
    minats = res.json()
    assert len(minats) > 0
    assert all(item["tipe"] == "minat" for item in minats)
    assert any(item["nama"] == f"Unique Minat {uid}" for item in minats)

    # Search with case-insensitivity
    res = client.get("/api/v1/skills?q=python")
    assert res.status_code == 200
    results = res.json()
    assert len(results) >= 1
    assert all("python" in item["nama"].lower() for item in results)

    # Wildcard character escaping: '%'
    res_percent = client.get(f"/api/v1/skills?q={uid} 100%")
    assert res_percent.status_code == 200
    data_percent = res_percent.json()
    assert len(data_percent) == 1
    assert data_percent[0]["nama"] == f"Wildcard {uid} 100% Guaranteed"

    # Wildcard character escaping: '_'
    res_underscore = client.get(f"/api/v1/skills?q=Wildcard_{uid}_C_Sharp")
    assert res_underscore.status_code == 200
    data_underscore = res_underscore.json()
    assert len(data_underscore) == 1
    assert data_underscore[0]["nama"] == f"Wildcard_{uid}_C_Sharp"


def test_get_skills_pagination_limits(client):
    # Limit invalid (< 1)
    res = client.get("/api/v1/skills?limit=0")
    assert res.status_code == 422

    # Limit invalid (> 100)
    res = client.get("/api/v1/skills?limit=101")
    assert res.status_code == 422

    # Limit valid (1 and 100)
    res1 = client.get("/api/v1/skills?limit=1")
    assert res1.status_code == 200
    assert len(res1.json()) <= 1

    res100 = client.get("/api/v1/skills?limit=100")
    assert res100.status_code == 200


# ============================================================================
# 2. PROFILE EDIT ENDPOINTS (PATCH /api/v1/users/me)
# ============================================================================

def test_student_update_own_profile(client, db_session: Session):
    student = create_unique_user(
        db_session,
        nama="Rizky Pratama",
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    headers = auth_headers(student)

    payload = {
        "nama": "Rizky P. Updated",
        "bio": "Software Engineering Student & Open Source Enthusiast",
        "kontak_url": "https://linkedin.com/in/rizkypratama",
        "jurusan": "Sistem Informasi",
        "angkatan": 2023,
    }

    res = client.patch("/api/v1/users/me", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["nama"] == "Rizky P. Updated"
    assert data["bio"] == payload["bio"]
    assert data["kontak_url"] == payload["kontak_url"]
    assert data["jurusan"] == "Sistem Informasi"
    assert data["angkatan"] == 2023


def test_moderator_cannot_change_jurusan(client, db_session: Session):
    moderator = create_unique_user(
        db_session,
        nama="Kaprodi TI Mock",
        role="moderator",
        jurusan="Teknik Informatika",
    )
    headers = auth_headers(moderator)

    # Moderator attempts to change department -> 403 Forbidden
    res = client.patch(
        "/api/v1/users/me",
        json={"jurusan": "Sistem Informasi"},
        headers=headers,
    )
    assert res.status_code == 403
    assert res.json()["code"] == "FORBIDDEN_OPERATION"

    # Moderator updates allowed fields (nama, bio, kontak_url) -> 200 OK
    res_ok = client.patch(
        "/api/v1/users/me",
        json={"nama": "Kaprodi TI Baru", "bio": "Ketua Program Studi TI"},
        headers=headers,
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["nama"] == "Kaprodi TI Baru"


def test_update_profile_validation_errors(client, db_session: Session):
    student = create_unique_user(
        db_session,
        nama="Citra Lestari",
    )
    headers = auth_headers(student)

    # Empty name
    res_empty_name = client.patch("/api/v1/users/me", json={"nama": "  "}, headers=headers)
    assert res_empty_name.status_code == 422

    # Invalid department
    res_invalid_jurusan = client.patch(
        "/api/v1/users/me", json={"jurusan": "Kedokteran Gigi"}, headers=headers
    )
    assert res_invalid_jurusan.status_code == 422
    assert res_invalid_jurusan.json()["code"] == "INVALID_DEPARTMENT"

    # Bio > 1000 characters
    res_long_bio = client.patch(
        "/api/v1/users/me", json={"bio": "X" * 1001}, headers=headers
    )
    assert res_long_bio.status_code == 422

    # Invalid URL
    res_bad_url = client.patch(
        "/api/v1/users/me", json={"kontak_url": "ftp://not-http.com"}, headers=headers
    )
    assert res_bad_url.status_code == 422


# ============================================================================
# 3. USER SKILLS ENDPOINTS (PUT /api/v1/users/me/skills)
# ============================================================================

def test_update_skills_atomic_and_case_insensitive(client, db_session: Session):
    user = create_unique_user(db_session, nama="Dewi Sartika")
    headers = auth_headers(user)

    # Get or create master skill
    existing_skill = (
        db_session.query(Skill).filter(Skill.nama == "Machine Learning").first()
    )
    if not existing_skill:
        existing_skill = Skill(nama="Machine Learning", tipe="skill")
        db_session.add(existing_skill)
        db_session.commit()

    # 1. First update: assign 2 skills
    payload1 = {
        "items": [
            {"skill_id": existing_skill.skill_id, "tipe": "skill", "level": "mahir"},
            {"nama": "Docker Container", "tipe": "skill", "level": "menengah"},
        ]
    }
    res1 = client.put("/api/v1/users/me/skills", json=payload1, headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert len(data1) == 2

    # 2. Case-insensitive lookup and master type precedence:
    # User submits "machine learning" with tipe="minat", but master has "Machine Learning" with tipe="skill"
    payload2 = {
        "items": [
            {"nama": "machine learning", "tipe": "minat", "level": "pemula"},
            {"nama": "react.js", "tipe": "skill", "level": "mahir"},
        ]
    }
    res2 = client.put("/api/v1/users/me/skills", json=payload2, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2) == 2

    # Verify atomic replacement: "Docker Container" is removed
    names = [s["nama"] for s in data2]
    assert "Docker Container" not in names
    # Master type wins
    ml_item = next(s for s in data2 if s["nama"].lower() == "machine learning")
    assert ml_item["tipe"] == "skill"  # Kept master's type!


def test_update_skills_quota_and_duplicate_validation(client, db_session: Session):
    user = create_unique_user(db_session, nama="Eko Nugroho")
    headers = auth_headers(user)

    # Duplicate names in single request -> 422
    uid = uuid.uuid4().hex[:4]
    payload_dup = {
        "items": [
            {"nama": f"Skill-{uid}", "tipe": "skill", "level": "pemula"},
            {"nama": f"skill-{uid}", "tipe": "skill", "level": "mahir"},
        ]
    }
    res_dup = client.put("/api/v1/users/me/skills", json=payload_dup, headers=headers)
    assert res_dup.status_code == 422

    # Limit exactly 20 items -> 200 OK
    items_20 = [{"nama": f"Skill-{uid}-{i}", "tipe": "skill", "level": "pemula"} for i in range(20)]
    res_20 = client.put("/api/v1/users/me/skills", json={"items": items_20}, headers=headers)
    assert res_20.status_code == 200
    assert len(res_20.json()) == 20

    # Limit 21 items (> 20) -> 422
    items_21 = [{"nama": f"Extra-{uid}-{i}", "tipe": "skill", "level": "pemula"} for i in range(21)]
    res_21 = client.put("/api/v1/users/me/skills", json={"items": items_21}, headers=headers)
    assert res_21.status_code == 422

    # Non-existent skill_id rolls back entire transaction
    res_invalid_id = client.put(
        "/api/v1/users/me/skills",
        json={"items": [{"skill_id": 999999, "tipe": "skill", "level": "pemula"}]},
        headers=headers,
    )
    assert res_invalid_id.status_code == 404
    assert res_invalid_id.json()["code"] == "SKILL_NOT_FOUND"

    # Previous 20 skills remain unchanged
    current_count = db_session.query(UserSkill).filter(UserSkill.user_id == user.user_id).count()
    assert current_count == 20


# ============================================================================
# 4. PUBLIC PROFILE & PRIVACY RBAC (GET /api/v1/users/{id})
# ============================================================================

def test_public_profile_privacy_matrix(client, db_session: Session):
    student_ti = create_unique_user(
        db_session,
        nama="Target Mahasiswa TI",
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2021,
    )

    other_student = create_unique_user(
        db_session,
        nama="Peer Mahasiswa",
        role="mahasiswa",
        jurusan="Sistem Informasi",
    )

    kaprodi_ti = create_unique_user(
        db_session,
        nama="Kaprodi TI Mock",
        role="moderator",
        jurusan="Teknik Informatika",
    )

    kaprodi_si = create_unique_user(
        db_session,
        nama="Kaprodi SI Mock",
        role="moderator",
        jurusan="Sistem Informasi",
    )

    admin_campus = create_unique_user(
        db_session,
        nama="Admin Kampus Mock",
        role="admin",
        jurusan=None,
    )

    # 1. Other student views target: NIM and Email MUST be None
    res_peer = client.get(
        f"/api/v1/users/{student_ti.user_id}", headers=auth_headers(other_student)
    )
    assert res_peer.status_code == 200
    peer_data = res_peer.json()
    assert peer_data["nim"] is None
    assert peer_data["email"] is None
    assert peer_data["nama"] == "Target Mahasiswa TI"

    # 2. Owner views own profile: NIM and Email visible
    res_self = client.get(
        f"/api/v1/users/{student_ti.user_id}", headers=auth_headers(student_ti)
    )
    assert res_self.status_code == 200
    self_data = res_self.json()
    assert self_data["nim"] == student_ti.nim
    assert self_data["email"] == student_ti.email

    # 3. Kaprodi of SAME department views target: NIM and Email visible
    res_kaprodi_ti = client.get(
        f"/api/v1/users/{student_ti.user_id}", headers=auth_headers(kaprodi_ti)
    )
    assert res_kaprodi_ti.status_code == 200
    ti_data = res_kaprodi_ti.json()
    assert ti_data["nim"] == student_ti.nim
    assert ti_data["email"] == student_ti.email

    # 4. Kaprodi of DIFFERENT department views target: NIM and Email MUST be None
    res_kaprodi_si = client.get(
        f"/api/v1/users/{student_ti.user_id}", headers=auth_headers(kaprodi_si)
    )
    assert res_kaprodi_si.status_code == 200
    si_data = res_kaprodi_si.json()
    assert si_data["nim"] is None
    assert si_data["email"] is None

    # 5. Admin views target: NIM and Email visible
    res_admin = client.get(
        f"/api/v1/users/{student_ti.user_id}", headers=auth_headers(admin_campus)
    )
    assert res_admin.status_code == 200
    admin_data = res_admin.json()
    assert admin_data["nim"] == student_ti.nim
    assert admin_data["email"] == student_ti.email


def test_public_profile_blocking_and_friendship(client, db_session: Session):
    user_a = create_unique_user(db_session, nama="User Alice")
    user_b = create_unique_user(db_session, nama="User Bob")

    # Case 1: Bob blocks Alice. Alice tries to view Bob's profile -> 404 USER_NOT_FOUND (no leak)
    block = UserBlock(blocker_id=user_b.user_id, blocked_id=user_a.user_id)
    db_session.add(block)
    db_session.commit()

    res_blocked = client.get(
        f"/api/v1/users/{user_b.user_id}", headers=auth_headers(user_a)
    )
    assert res_blocked.status_code == 404
    assert res_blocked.json()["code"] == "USER_NOT_FOUND"

    # Clean block
    db_session.delete(block)
    db_session.commit()

    # Case 2: Alice blocks Bob. Alice views Bob's profile -> 200 OK restricted (blocked_by_me = True)
    block2 = UserBlock(blocker_id=user_a.user_id, blocked_id=user_b.user_id)
    db_session.add(block2)
    db_session.commit()

    res_viewer_block = client.get(
        f"/api/v1/users/{user_b.user_id}", headers=auth_headers(user_a)
    )
    assert res_viewer_block.status_code == 200
    block_data = res_viewer_block.json()
    assert block_data["blocked_by_me"] is True
    assert block_data["nama"] == "User Bob"
    assert block_data["bio"] is None
    assert block_data["skills"] == []

    # Clean block
    db_session.delete(block2)
    db_session.commit()

    # Case 3: Friendship status 'friends'
    friendship = Friendship(
        requester_id=user_a.user_id, addressee_id=user_b.user_id, status="diterima"
    )
    db_session.add(friendship)
    db_session.commit()

    res_friend = client.get(
        f"/api/v1/users/{user_b.user_id}", headers=auth_headers(user_a)
    )
    assert res_friend.status_code == 200
    assert res_friend.json()["friendship_status"] == "friends"
