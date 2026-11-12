from datetime import timedelta
from unittest.mock import patch

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    can_moderate,
    create_access_token,
    hash_password,
)
from app.models.entities import User

# ============================================================================
# 1. REGISTRATION TESTS (US-01)
# ============================================================================

def test_register_student_success(client, db_session: Session):
    payload = {
        "nim": "1234567890",
        "nama": "Ahmad Dani",
        "email": "ahmad.dani@campus.ac.id",
        "password": "Password123!",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "ahmad.dani@campus.ac.id"
    assert data["nim"] == "1234567890"
    assert data["role"] == "mahasiswa"
    assert data["jurusan"] == "Teknik Informatika"
    assert "password" not in data
    assert "password_hash" not in data

    # Verify user exists in database
    user = db_session.query(User).filter(User.email == payload["email"]).first()
    assert user is not None
    assert user.role == "mahasiswa"


def test_register_student_duplicate_email(client, db_session: Session):
    payload = {
        "nim": "1234567891",
        "nama": "Budi Santoso",
        "email": "budi.santoso@campus.ac.id",
        "password": "Password123!",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
    }
    # Pre-create user with same email
    user = User(
        nim="9999999999",
        nama="Existing User",
        email=payload["email"],
        password_hash=hash_password("DummyPass123!"),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    db_session.add(user)
    db_session.commit()

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "EMAIL_TAKEN"


def test_register_student_duplicate_nim(client, db_session: Session):
    payload = {
        "nim": "1234567892",
        "nama": "Citra Lestari",
        "email": "citra.lestari@campus.ac.id",
        "password": "Password123!",
        "jurusan": "Sistem Informasi",
        "angkatan": 2023,
    }
    # Pre-create user with same NIM
    user = User(
        nim=payload["nim"],
        nama="Existing NIM User",
        email="existing.nim@campus.ac.id",
        password_hash=hash_password("DummyPass123!"),
        role="mahasiswa",
        jurusan="Sistem Informasi",
        angkatan=2021,
    )
    db_session.add(user)
    db_session.commit()

    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "NIM_TAKEN"


def test_register_student_invalid_email_domain(client):
    payload = {
        "nim": "1234567893",
        "nama": "Dedi Kurniawan",
        "email": "dedi@gmail.com",
        "password": "Password123!",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["code"] in ("VALIDATION_ERROR", "INVALID_INPUT")

    # Test domain spoofing (evilcampus.ac.id)
    payload["email"] = "dedi@evilcampus.ac.id"
    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 422


def test_register_student_password_limits(client):
    # Too short (< 8 chars)
    payload_short = {
        "nim": "1234567894",
        "nama": "Eka Saputra",
        "email": "eka.saputra@campus.ac.id",
        "password": "short",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
    }
    res_short = client.post("/api/v1/auth/register", json=payload_short)
    assert res_short.status_code == 422
    assert "8 karakter" in str(res_short.json())

    # Too long (> 72 bytes)
    payload_long = {
        "nim": "1234567895",
        "nama": "Fajar Hidayat",
        "email": "fajar.hidayat@campus.ac.id",
        "password": "A" * 73,
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
    }
    res_long = client.post("/api/v1/auth/register", json=payload_long)
    assert res_long.status_code == 422
    assert "72 byte" in str(res_long.json())


def test_register_student_role_injection_ignored(client, db_session: Session):
    # Attacker tries to register directly as 'admin'
    payload = {
        "nim": "1234567896",
        "nama": "Gilang Pratama",
        "email": "gilang.pratama@campus.ac.id",
        "password": "Password123!",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
        "role": "admin",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "mahasiswa"

    user = db_session.query(User).filter(User.email == payload["email"]).first()
    assert user.role == "mahasiswa"


def test_register_student_email_normalized(client, db_session: Session):
    payload = {
        "nim": "1234567897",
        "nama": "Hani Wijaya",
        "email": "  HANI.WIJAYA@CAMPUS.AC.ID  ",
        "password": "Password123!",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "hani.wijaya@campus.ac.id"


def test_register_student_invalid_jurusan(client):
    payload = {
        "nim": "1234567898",
        "nama": "Indah Permata",
        "email": "indah.permata@campus.ac.id",
        "password": "Password123!",
        "jurusan": "Jurusan Tidak Terdaftar",
        "angkatan": 2023,
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_concurrency_race_condition(client):
    class FakeDiag:
        def __init__(self, constraint_name):
            self.constraint_name = constraint_name

    class FakeOrig:
        def __init__(self, constraint_name):
            self.diag = FakeDiag(constraint_name)

    # Test race condition where users_email_key triggers IntegrityError
    with patch("sqlalchemy.orm.Session.commit") as mock_commit:
        err = IntegrityError("statement", "params", "orig")
        err.orig = FakeOrig("users_email_key")
        mock_commit.side_effect = err

        payload = {
            "nim": "1234567899",
            "nama": "Joko Widodo",
            "email": "joko.widodo@campus.ac.id",
            "password": "Password123!",
            "jurusan": "Teknik Informatika",
            "angkatan": 2023,
        }
        res = client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 409
        assert res.json()["code"] == "EMAIL_TAKEN"

    # Test race condition where users_nim_key triggers IntegrityError
    with patch("sqlalchemy.orm.Session.commit") as mock_commit:
        err = IntegrityError("statement", "params", "orig")
        err.orig = FakeOrig("users_nim_key")
        mock_commit.side_effect = err

        payload["email"] = "joko2.widodo@campus.ac.id"
        res2 = client.post("/api/v1/auth/register", json=payload)
        assert res2.status_code == 409
        assert res2.json()["code"] == "NIM_TAKEN"


# ============================================================================
# 2. LOGIN TESTS & TIMING ATTACK MITIGATION
# ============================================================================

def test_login_success(client, db_session: Session):
    raw_pass = "RahasiaBanget123!"
    user = User(
        nim="220101001",
        nama="Kiki Amalia",
        email="kiki.amalia@campus.ac.id",
        password_hash=hash_password(raw_pass),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    db_session.add(user)
    db_session.commit()

    payload = {"email": "kiki.amalia@campus.ac.id", "password": raw_pass}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    assert data["user"]["email"] == "kiki.amalia@campus.ac.id"


def test_login_invalid_password(client, db_session: Session):
    user = User(
        nim="220101002",
        nama="Lina Marlina",
        email="lina.marlina@campus.ac.id",
        password_hash=hash_password("CorrectPass123!"),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    db_session.add(user)
    db_session.commit()

    payload = {"email": "lina.marlina@campus.ac.id", "password": "WrongPassword123!"}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


def test_login_user_not_found(client):
    payload = {"email": "nonexistent@campus.ac.id", "password": "AnyPassword123!"}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


def test_login_timing_attack_mitigation(client):
    # Verify that bcrypt.checkpw is invoked even when the user is not found
    with patch("bcrypt.checkpw", return_value=False) as mock_checkpw:
        payload = {"email": "ghost.user@campus.ac.id", "password": "SomePassword123!"}
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401
        assert response.json()["code"] == "INVALID_CREDENTIALS"
        assert mock_checkpw.called, "bcrypt.checkpw must be called against DUMMY_HASH to prevent timing attacks"


def test_login_password_too_long(client, db_session: Session):
    # Passwords > 72 bytes should gracefully return 401 INVALID_CREDENTIALS without 500 error
    payload = {"email": "dummy@campus.ac.id", "password": "B" * 80}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


# ============================================================================
# 3. DUAL-LAYER RATE LIMITING TESTS
# ============================================================================

def test_rate_limiter_layer1_ip_email(client):
    target_email = "target.user@campus.ac.id"
    payload = {"email": target_email, "password": "WrongPassword!"}
    headers = {"X-Forwarded-For": "203.0.113.10"}

    # 5 failed attempts are processed
    for i in range(5):
        res = client.post("/api/v1/auth/login", json=payload, headers=headers)
        assert res.status_code == 401, f"Attempt {i+1} should return 401"

    # 6th failed attempt is blocked by Layer 1 (HTTP 429)
    res_blocked = client.post("/api/v1/auth/login", json=payload, headers=headers)
    assert res_blocked.status_code == 429
    assert res_blocked.json()["code"] == "TOO_MANY_REQUESTS"
    assert "Retry-After" in res_blocked.headers
    retry_after = int(res_blocked.headers["Retry-After"])
    assert 1 <= retry_after <= 60


def test_rate_limiter_layer1_reset_on_success(client, db_session: Session):
    email = "reset.user@campus.ac.id"
    password = "CorrectPassword123!"
    user = User(
        nim="220101003",
        nama="Reset User",
        email=email,
        password_hash=hash_password(password),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    db_session.add(user)
    db_session.commit()

    headers = {"X-Forwarded-For": "203.0.113.20"}

    # 4 failed attempts
    for _ in range(4):
        client.post("/api/v1/auth/login", json={"email": email, "password": "Wrong"}, headers=headers)

    # Successful login resets the counter
    res_success = client.post("/api/v1/auth/login", json={"email": email, "password": password}, headers=headers)
    assert res_success.status_code == 200

    # User can attempt again without being locked out on 5th failure
    res_after = client.post("/api/v1/auth/login", json={"email": email, "password": "Wrong"}, headers=headers)
    assert res_after.status_code == 401  # Not 429


def test_rate_limiter_layer1_ip_isolation(client):
    email = "isolated.user@campus.ac.id"
    payload = {"email": email, "password": "Wrong"}

    # Exhaust limit for IP A
    for _ in range(5):
        client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": "198.51.100.1"})

    res_ip_a = client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": "198.51.100.1"})
    assert res_ip_a.status_code == 429

    # IP B should NOT be blocked yet by Layer 1
    res_ip_b = client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": "198.51.100.2"})
    assert res_ip_b.status_code == 401


def test_rate_limiter_layer2_global_email(client):
    target_email = "distributed.target@campus.ac.id"
    payload = {"email": target_email, "password": "Wrong"}

    # Simulate distributed brute-force attack from 5 different IPs (4 attempts each = 20 attempts)
    for ip_suffix in range(1, 6):
        ip = f"198.51.100.{ip_suffix}"
        for _ in range(4):
            res = client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": ip})
            assert res.status_code == 401

    # 21st attempt from a brand new IP (IP 6) triggers Layer 2 lockout
    res_l2 = client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": "198.51.100.6"})
    assert res_l2.status_code == 429
    assert res_l2.json()["code"] == "TOO_MANY_REQUESTS"
    assert "Retry-After" in res_l2.headers
    retry_after = int(res_l2.headers["Retry-After"])
    assert 1 <= retry_after <= 600


def test_trusted_proxy_header_evaluation(client):
    # Setting TRUSTED_PROXY_COUNT = 1 means taking ips[-1] from X-Forwarded-For
    email = "spoofed.ip@campus.ac.id"
    payload = {"email": email, "password": "Wrong"}

    # Attacker tries to bypass by changing leftmost spoofed IP: "spoofed_ip, real_proxy_ip"
    for i in range(5):
        headers = {"X-Forwarded-For": f"10.0.0.{i}, 203.0.113.99"}
        client.post("/api/v1/auth/login", json=payload, headers=headers)

    # 6th attempt with another spoofed IP but same real proxy IP is blocked!
    headers_blocked = {"X-Forwarded-For": "10.0.0.99, 203.0.113.99"}
    res = client.post("/api/v1/auth/login", json=payload, headers=headers_blocked)
    assert res.status_code == 429


# ============================================================================
# 4. TOKEN & SESSION TESTS (/auth/me, /auth/logout)
# ============================================================================

def test_get_me_success(client, db_session: Session):
    user = User(
        nim="220101004",
        nama="Maudy Ayunda",
        email="maudy.ayunda@campus.ac.id",
        password_hash=hash_password("ValidPassword123!"),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2021,
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.id)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "maudy.ayunda@campus.ac.id"
    assert data["nama"] == "Maudy Ayunda"
    assert data["role"] == "mahasiswa"


def test_get_me_unauthenticated(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"
    assert "WWW-Authenticate" in response.headers


def test_get_me_invalid_token(client):
    headers = {"Authorization": "Bearer not.a.valid.jwt.token"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"
    assert "WWW-Authenticate" in response.headers


def test_get_me_expired_token(client, db_session: Session):
    user = User(
        nim="220101005",
        nama="Nadia Vega",
        email="nadia.vega@campus.ac.id",
        password_hash=hash_password("ValidPassword123!"),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2021,
    )
    db_session.add(user)
    db_session.commit()

    expired_token = create_access_token(subject=user.id, expires_delta=timedelta(seconds=-10))
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["code"] == "TOKEN_EXPIRED"
    assert "WWW-Authenticate" in response.headers


def test_get_me_nonexistent_user(client):
    token = create_access_token(subject=9999999)
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


def test_logout_stateless(client):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 204


# ============================================================================
# 5. ADMIN ENDPOINTS & RBAC TESTS (/admin/users)
# ============================================================================

def test_admin_create_moderator_success(client, db_session: Session):
    admin = User(
        nim="ADM001",
        nama="Super Admin",
        email="super.admin@campus.ac.id",
        password_hash=hash_password("AdminPass123!"),
        role="admin",
        jurusan="Biro Kemahasiswaan & Alumni",
    )
    db_session.add(admin)
    db_session.commit()

    admin_token = create_access_token(subject=admin.id)
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "email": "kaprodi.baru@campus.ac.id",
        "nama": "Dr. Ir. Kaprodi Baru, M.Kom",
        "password": "KaprodiPassword123!",
        "role": "moderator",
        "jurusan": "Teknik Informatika",
        "nim": "KAP001",
    }
    response = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "kaprodi.baru@campus.ac.id"
    assert data["role"] == "moderator"
    assert data["jurusan"] == "Teknik Informatika"


def test_admin_create_moderator_missing_jurusan(client, db_session: Session):
    admin = User(
        nim="ADM002",
        nama="Super Admin 2",
        email="super.admin2@campus.ac.id",
        password_hash=hash_password("AdminPass123!"),
        role="admin",
        jurusan="Biro Kemahasiswaan & Alumni",
    )
    db_session.add(admin)
    db_session.commit()

    admin_token = create_access_token(subject=admin.id)
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "email": "kaprodi.nojurusan@campus.ac.id",
        "nama": "Kaprodi Tanpa Jurusan",
        "password": "KaprodiPassword123!",
        "role": "moderator",
        "nim": "KAP002",
    }
    response = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert response.status_code == 422
    assert response.json()["code"] == "MODERATOR_JURUSAN_REQUIRED"


def test_admin_create_moderator_invalid_jurusan(client, db_session: Session):
    admin = User(
        nim="ADM003",
        nama="Super Admin 3",
        email="super.admin3@campus.ac.id",
        password_hash=hash_password("AdminPass123!"),
        role="admin",
        jurusan="Biro Kemahasiswaan & Alumni",
    )
    db_session.add(admin)
    db_session.commit()

    admin_token = create_access_token(subject=admin.id)
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "email": "kaprodi.invalid@campus.ac.id",
        "nama": "Kaprodi Invalid",
        "password": "KaprodiPassword123!",
        "role": "moderator",
        "jurusan": "Jurusan Fiktif",
        "nim": "KAP003",
    }
    response = client.post("/api/v1/admin/users", json=payload, headers=headers)
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_JURUSAN"


def test_admin_create_user_forbidden_for_student_and_moderator(client, db_session: Session):
    student = User(
        nim="220101006",
        nama="Student User",
        email="student.user@campus.ac.id",
        password_hash=hash_password("Pass123!"),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    moderator = User(
        nim="KAP002",
        nama="Moderator User",
        email="moderator.user@campus.ac.id",
        password_hash=hash_password("Pass123!"),
        role="moderator",
        jurusan="Teknik Informatika",
    )
    db_session.add_all([student, moderator])
    db_session.commit()

    payload = {
        "email": "another.user@campus.ac.id",
        "nama": "Another User",
        "password": "AnotherPassword123!",
        "role": "moderator",
        "jurusan": "Teknik Informatika",
        "nim": "KAP004",
    }

    # Student forbidden
    student_token = create_access_token(subject=student.id)
    res_student = client.post("/api/v1/admin/users", json=payload, headers={"Authorization": f"Bearer {student_token}"})
    assert res_student.status_code == 403
    assert res_student.json()["code"] == "FORBIDDEN_ROLE"

    # Moderator forbidden
    moderator_token = create_access_token(subject=moderator.id)
    res_mod = client.post("/api/v1/admin/users", json=payload, headers={"Authorization": f"Bearer {moderator_token}"})
    assert res_mod.status_code == 403
    assert res_mod.json()["code"] == "FORBIDDEN_ROLE"


# ============================================================================
# 6. CAN_MODERATE TRUTH TABLE TESTS
# ============================================================================

def test_can_moderate_truth_table():
    admin = User(id=1, email="admin@campus.ac.id", nama="Admin", role="admin", jurusan="Biro")
    mod_ti = User(id=2, email="mod.ti@campus.ac.id", nama="Mod TI", role="moderator", jurusan="Teknik Informatika")
    mod_si = User(id=3, email="mod.si@campus.ac.id", nama="Mod SI", role="moderator", jurusan="Sistem Informasi")
    mod_none = User(id=4, email="mod.none@campus.ac.id", nama="Mod None", role="moderator", jurusan=None)
    mhs = User(id=5, email="mhs@campus.ac.id", nama="Mhs", role="mahasiswa", jurusan="Teknik Informatika")

    # Admin: always True
    assert can_moderate(admin, "Teknik Informatika") is True
    assert can_moderate(admin, "Sistem Informasi") is True
    assert can_moderate(admin, None) is True

    # Moderator TI
    assert can_moderate(mod_ti, "Teknik Informatika") is True
    assert can_moderate(mod_ti, "teknik informatika") is True  # case-insensitive
    assert can_moderate(mod_ti, "  Teknik Informatika  ") is True  # trimmed
    assert can_moderate(mod_ti, "Sistem Informasi") is False  # different dept
    assert can_moderate(mod_ti, None) is False  # target None

    # Moderator SI
    assert can_moderate(mod_si, "Sistem Informasi") is True
    assert can_moderate(mod_si, "Teknik Informatika") is False

    # Moderator with no assigned dept
    assert can_moderate(mod_none, "Teknik Informatika") is False

    # Mahasiswa: always False
    assert can_moderate(mhs, "Teknik Informatika") is False
    assert can_moderate(mhs, "Sistem Informasi") is False
    assert can_moderate(mhs, None) is False

def test_login_success_with_nim(client, db_session: Session):
    raw_pass = "RahasiaNim123!"
    user = User(
        nim="220101099",
        nama="Student Login NIM",
        email="student.nim@campus.ac.id",
        password_hash=hash_password(raw_pass),
        role="mahasiswa",
        jurusan="Teknik Informatika",
        angkatan=2022,
    )
    db_session.add(user)
    db_session.commit()

    payload = {"email": "220101099", "password": raw_pass}
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "student.nim@campus.ac.id"
    assert data["user"]["nim"] == "220101099"


def test_trusted_proxy_zero_setting(client):
    with patch.object(settings, "TRUSTED_PROXY_COUNT", 0):
        email = "proxy0@campus.ac.id"
        payload = {"email": email, "password": "Wrong"}
        for _ in range(5):
            client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": "1.2.3.4"})
        res = client.post("/api/v1/auth/login", json=payload, headers={"X-Forwarded-For": "5.6.7.8"})
        assert res.status_code == 429

