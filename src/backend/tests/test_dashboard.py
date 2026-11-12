from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_current_user
from app.main import app
from app.models.entities import (
    Friendship,
    Notification,
    PortfolioItem,
    Post,
    Report,
    User,
)


def create_user(
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


def test_student_dashboard_summary(client: TestClient, db_session: Session):
    student = create_user(db_session, nama="Student One", role="mahasiswa")
    other_student = create_user(db_session, nama="Student Two", role="mahasiswa")

    # 1 verified portfolio: artikel_ilmiah (2 points)
    p_verif1 = PortfolioItem(
        user_id=student.user_id,
        judul="Publikasi Jurnal Scopus",
        deskripsi="Deskripsi prestasi jurnal",
        kategori="artikel_ilmiah",
        status_verifikasi="terverifikasi",
    )
    # 1 verified portfolio: sertifikat (1 point)
    p_verif2 = PortfolioItem(
        user_id=student.user_id,
        judul="Sertifikasi AWS Cloud",
        deskripsi="Sertifikat resmi",
        kategori="sertifikat",
        status_verifikasi="terverifikasi",
    )
    # 1 pending portfolio
    p_pending = PortfolioItem(
        user_id=student.user_id,
        judul="Proyek Capstone",
        deskripsi="Menunggu validasi",
        kategori="proyek",
        status_verifikasi="menunggu_review",
    )
    # 1 rejected portfolio (needs revision)
    p_revisi = PortfolioItem(
        user_id=student.user_id,
        judul="Sertifikat Kadaluwarsa",
        deskripsi="Perlu revisi",
        kategori="skpi",
        status_verifikasi="ditolak",
        catatan_verifikasi="Harap sertakan bukti tanda tangan",
    )
    db_session.add_all([p_verif1, p_verif2, p_pending, p_revisi])

    # Pending incoming friend request
    friendship = Friendship(
        requester_id=other_student.user_id,
        addressee_id=student.user_id,
        status="menunggu",
    )
    db_session.add(friendship)

    # Unread notification (valid jenis: pertemanan_baru)
    notif = Notification(
        user_id=student.user_id,
        jenis="pertemanan_baru",
        judul="Permintaan Pertemanan",
        isi="Permintaan pertemanan baru",
        is_read=False,
    )
    db_session.add(notif)
    db_session.commit()

    resp = client.get("/api/v1/dashboard/summary", headers=auth_headers(student))
    assert resp.status_code == 200
    data = resp.json()["summary"]

    assert data["role"] == "mahasiswa"
    assert data["total_skpi_poin"] == 3  # artikel_ilmiah(2) + sertifikat(1)
    assert data["total_portofolio_terverifikasi"] == 2
    assert data["total_portofolio_menunggu"] == 1
    assert data["total_portofolio_perlu_revisi"] == 1
    assert data["pending_friend_requests"] == 1
    assert data["unread_notifications_count"] == 1
    assert len(data["recent_verified_portfolios"]) == 2
    recent_ids = [item["portfolio_id"] for item in data["recent_verified_portfolios"]]
    assert p_verif1.portfolio_id in recent_ids
    assert p_verif2.portfolio_id in recent_ids


def test_moderator_dashboard_summary_isolation(client: TestClient, db_session: Session):
    uid = uuid4().hex[:6]
    jurusan_ti = f"Teknik Informatika {uid}"
    jurusan_si = f"Sistem Informasi {uid}"

    mod_ti = create_user(db_session, nama="Kaprodi TI", role="moderator", jurusan=jurusan_ti)
    mhs_ti = create_user(db_session, nama="Mhs TI", role="mahasiswa", jurusan=jurusan_ti)
    mhs_si = create_user(db_session, nama="Mhs SI", role="mahasiswa", jurusan=jurusan_si)

    # TI items
    post_ti = Post(user_id=mhs_ti.user_id, isi="Post pending TI", status="menunggu_review")
    port_ti = PortfolioItem(
        user_id=mhs_ti.user_id,
        judul="Portofolio TI",
        deskripsi="Review me",
        kategori="skpi",
        status_verifikasi="menunggu_review",
    )
    db_session.add_all([post_ti, port_ti])
    db_session.commit()

    # Add active report for post_ti
    rep_ti = Report(
        post_id=post_ti.post_id,
        pelapor_id=mhs_ti.user_id,
        alasan="Spam",
        kategori_laporan="spam",
        status="baru",
    )
    db_session.add(rep_ti)

    # SI items (should not be counted for mod_ti)
    post_si = Post(user_id=mhs_si.user_id, isi="Post pending SI", status="menunggu_review")
    port_si = PortfolioItem(
        user_id=mhs_si.user_id,
        judul="Portofolio SI",
        deskripsi="Review me SI",
        kategori="skpi",
        status_verifikasi="menunggu_review",
    )
    db_session.add_all([post_si, port_si])
    db_session.commit()

    rep_si = Report(
        post_id=post_si.post_id,
        pelapor_id=mhs_si.user_id,
        alasan="Konten tidak pantas",
        kategori_laporan="konten_tidak_pantas",
        status="baru",
    )
    db_session.add(rep_si)
    db_session.commit()

    resp = client.get("/api/v1/dashboard/summary", headers=auth_headers(mod_ti))
    assert resp.status_code == 200
    data = resp.json()["summary"]

    assert data["role"] == "moderator"
    assert data["jurusan"] == jurusan_ti
    assert data["is_jurusan_configured"] is True
    assert data["pending_posts"] == 1
    assert data["pending_reports"] == 1
    assert data["pending_portfolio_reviews"] == 1


def test_moderator_without_jurusan_safe(client: TestClient, db_session: Session):
    mod_unassigned = create_user(db_session, nama="Kaprodi Unassigned", role="moderator", jurusan=None)

    resp = client.get("/api/v1/dashboard/summary", headers=auth_headers(mod_unassigned))
    assert resp.status_code == 200
    data = resp.json()["summary"]

    assert data["role"] == "moderator"
    assert data["jurusan"] is None
    assert data["is_jurusan_configured"] is False
    assert data["pending_posts"] == 0
    assert data["pending_reports"] == 0
    assert data["pending_portfolio_reviews"] == 0


def test_admin_dashboard_summary(client: TestClient, db_session: Session):
    admin = create_user(db_session, nama="Admin Kemahasiswaan", role="admin")

    mhs_1 = create_user(db_session, nama="Mhs 1", role="mahasiswa", jurusan="Teknik Informatika")
    mhs_2 = create_user(db_session, nama="Mhs 2", role="mahasiswa", jurusan="Sistem Informasi")

    p1 = PortfolioItem(
        user_id=mhs_1.user_id,
        judul="Port 1",
        deskripsi="Desc",
        kategori="skpi",
        status_verifikasi="terverifikasi",
    )
    p2 = PortfolioItem(
        user_id=mhs_2.user_id,
        judul="Port 2",
        deskripsi="Desc",
        kategori="skpi",
        status_verifikasi="menunggu_review",
    )
    post_takedown = Post(
        user_id=mhs_1.user_id,
        isi="Takedown post",
        status="dihapus",
        is_deleted=True,
        deleted_by=admin.user_id,
        deleted_at=datetime.now(timezone.utc),
        alasan_hapus="Pelanggaran berat",
    )
    db_session.add_all([p1, p2, post_takedown])
    db_session.commit()

    resp = client.get("/api/v1/dashboard/summary", headers=auth_headers(admin))
    assert resp.status_code == 200
    data = resp.json()["summary"]

    assert data["role"] == "admin"
    assert data["total_mahasiswa"] >= 2
    assert data["total_portofolio_terverifikasi"] >= 1
    assert data["pending_portfolio_reviews"] >= 1
    assert data["total_takedown"] >= 1


def test_dashboard_summary_parity_with_moderation_summary(client: TestClient, db_session: Session):
    uid = uuid4().hex[:6]
    jurusan = f"Teknik Informatika {uid}"
    mod = create_user(db_session, nama="Kaprodi Parity", role="moderator", jurusan=jurusan)
    mhs = create_user(db_session, nama="Mhs Parity", role="mahasiswa", jurusan=jurusan)

    post = Post(user_id=mhs.user_id, isi="Post pending parity", status="menunggu_review")
    port = PortfolioItem(
        user_id=mhs.user_id,
        judul="Portofolio Parity",
        deskripsi="Desc",
        kategori="skpi",
        status_verifikasi="menunggu_review",
    )
    db_session.add_all([post, port])
    db_session.commit()

    rep = Report(
        post_id=post.post_id,
        pelapor_id=mhs.user_id,
        alasan="Spam",
        kategori_laporan="spam",
        status="baru",
    )
    db_session.add(rep)
    db_session.commit()

    dash_resp = client.get("/api/v1/dashboard/summary", headers=auth_headers(mod))
    mod_resp = client.get("/api/v1/moderation/summary", headers=auth_headers(mod))

    assert dash_resp.status_code == 200
    assert mod_resp.status_code == 200

    dash_data = dash_resp.json()["summary"]
    mod_data = mod_resp.json()

    assert dash_data["pending_posts"] == mod_data["post_menunggu"]
    assert dash_data["pending_reports"] == mod_data["laporan_baru"]
    assert dash_data["pending_portfolio_reviews"] == mod_data["portofolio_menunggu"]


def test_dashboard_summary_unauthorized_and_invalid_role(client: TestClient, db_session: Session):
    # 1. Unauthenticated
    resp_unauth = client.get("/api/v1/dashboard/summary")
    assert resp_unauth.status_code == 401

    # 2. Invalid role via mocked current_user
    user = create_user(db_session, nama="Invalid Role User", role="mahasiswa")
    user.role = "alumni"  # mutate in-memory

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        resp_invalid = client.get("/api/v1/dashboard/summary", headers={"Authorization": "Bearer dummy"})
        assert resp_invalid.status_code == 403
        assert resp_invalid.json()["code"] == "INVALID_ROLE"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
