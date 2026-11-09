from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import ModerationRecord, Notification, Post, Report, User, UserBlock


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


def create_test_post(
    db: Session,
    author: User,
    isi: str = "Konten postingan default pengujian.",
    status: str = "tayang",
    gambar_url: str = None,
    is_deleted: bool = False,
    deleted_by: int = None,
    deleted_at: datetime = None,
    alasan_hapus: str = None,
) -> Post:
    if is_deleted or status == "dihapus":
        is_deleted = True
        status = "dihapus"
        deleted_by = deleted_by if deleted_by is not None else author.user_id
        deleted_at = deleted_at if deleted_at is not None else datetime.utcnow()
        alasan_hapus = alasan_hapus or "Dihapus dalam pengujian"

    post = Post(
        user_id=author.user_id,
        isi=isi,
        tipe="umum",
        status=status,
        gambar_url=gambar_url,
        is_deleted=is_deleted,
        deleted_by=deleted_by,
        deleted_at=deleted_at,
        alasan_hapus=alasan_hapus,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


# -----------------------------------------------------------------------------
# 1. PELAPORAN KONTEN & VISIBILITAS ANTI-LEAK
# -----------------------------------------------------------------------------

def test_report_creation_success_and_post_state_shift(client, db_session: Session):
    student_a = create_user(db_session, nama="Author Student", role="mahasiswa")
    student_b = create_user(db_session, nama="Reporter Student", role="mahasiswa")
    post = create_test_post(db_session, author=student_a, isi="Postingan yang akan dilaporkan", status="tayang")

    resp = client.post(
        "/api/v1/reports",
        json={
            "post_id": post.post_id,
            "alasan": "Konten memuat unsur spam dan promosi ilegal.",
            "kategori_laporan": "spam",
        },
        headers=auth_headers(student_b),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["post_id"] == post.post_id
    assert data["status"] == "baru"
    assert data["kategori_laporan"] == "spam"
    assert data["pelapor_id"] == student_b.user_id

    # Verify post status automatically shifted from 'tayang' to 'direview'
    db_session.refresh(post)
    assert post.status == "direview"


def test_self_report_forbidden(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")
    post = create_test_post(db_session, author=student, status="tayang")

    resp = client.post(
        "/api/v1/reports",
        json={
            "post_id": post.post_id,
            "alasan": "Saya melaporkan postingan saya sendiri.",
            "kategori_laporan": "lainnya",
        },
        headers=auth_headers(student),
    )
    assert resp.status_code == 422
    assert "SELF_REPORT_NOT_ALLOWED" in resp.json()["code"]


def test_duplicate_active_report_conflict_409(client, db_session: Session):
    student_a = create_user(db_session, role="mahasiswa")
    student_b = create_user(db_session, role="mahasiswa")
    post = create_test_post(db_session, author=student_a, status="tayang")

    # First report
    rep1 = client.post(
        "/api/v1/reports",
        json={"post_id": post.post_id, "alasan": "Laporan pertama pelanggaran.", "kategori_laporan": "konten_tidak_pantas"},
        headers=auth_headers(student_b),
    )
    assert rep1.status_code == 201

    # Second active report by same reporter on same post
    rep2 = client.post(
        "/api/v1/reports",
        json={"post_id": post.post_id, "alasan": "Laporan kedua spam ganda.", "kategori_laporan": "spam"},
        headers=auth_headers(student_b),
    )
    assert rep2.status_code == 409
    assert "DUPLICATE_ACTIVE_REPORT" in rep2.json()["code"]


def test_report_on_draft_or_deleted_or_blocked_post_404(client, db_session: Session):
    student_a = create_user(db_session, role="mahasiswa")
    student_b = create_user(db_session, role="mahasiswa")

    # 1. Draft post -> 404
    draft_post = create_test_post(db_session, author=student_a, status="draft")
    res_draft = client.post(
        "/api/v1/reports",
        json={"post_id": draft_post.post_id, "alasan": "Melaporkan draft orang lain.", "kategori_laporan": "spam"},
        headers=auth_headers(student_b),
    )
    assert res_draft.status_code == 404

    # 2. Deleted post -> 404
    deleted_post = create_test_post(
        db_session,
        author=student_a,
        status="dihapus",
        is_deleted=True,
        deleted_by=student_a.user_id,
        alasan_hapus="Test delete",
    )

    res_del = client.post(
        "/api/v1/reports",
        json={"post_id": deleted_post.post_id, "alasan": "Melaporkan post terhapus.", "kategori_laporan": "spam"},
        headers=auth_headers(student_b),
    )
    assert res_del.status_code == 404

    # 3. Blocked user's post -> 404 (anti-leak)
    normal_post = create_test_post(db_session, author=student_a, status="tayang")
    # Student A blocks Student B
    block = UserBlock(blocker_id=student_a.user_id, blocked_id=student_b.user_id)
    db_session.add(block)
    db_session.commit()

    res_block = client.post(
        "/api/v1/reports",
        json={"post_id": normal_post.post_id, "alasan": "Melaporkan post orang yang memblokir.", "kategori_laporan": "spam"},
        headers=auth_headers(student_b),
    )
    assert res_block.status_code == 404


# -----------------------------------------------------------------------------
# 2. PEMBEKUAN EDIT & HAPUS MANDIRI
# -----------------------------------------------------------------------------

def test_author_cannot_edit_post_under_review_409(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")
    post = create_test_post(db_session, author=student, status="direview")

    resp = client.patch(
        f"/api/v1/posts/{post.post_id}",
        json={"isi": "Mencoba mengubah caption saat postingan diselidiki."},
        headers=auth_headers(student),
    )
    assert resp.status_code == 409
    assert "CANNOT_EDIT_POST_UNDER_REVIEW" in resp.json()["code"]


def test_author_cannot_delete_post_under_investigation_409(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")
    post = create_test_post(db_session, author=student, status="direview")

    resp = client.delete(
        f"/api/v1/posts/{post.post_id}",
        headers=auth_headers(student),
    )
    assert resp.status_code == 409
    assert "CANNOT_DELETE_POST_UNDER_INVESTIGATION" in resp.json()["code"]


def test_author_can_delete_own_clean_post(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")
    post = create_test_post(db_session, author=student, status="tayang")

    resp = client.delete(
        f"/api/v1/posts/{post.post_id}",
        headers=auth_headers(student),
    )
    assert resp.status_code == 200
    db_session.refresh(post)
    assert post.is_deleted is True
    assert post.status == "dihapus"
    assert post.deleted_by == student.user_id
    assert post.alasan_hapus is not None


# -----------------------------------------------------------------------------
# 3. ANTREAN MODERASI & PRIORITAS AI
# -----------------------------------------------------------------------------

def test_moderation_queue_prodi_scoping_and_ai_priority(client, db_session: Session):
    kaprodi_ti = create_user(db_session, nama="Kaprodi TI", role="moderator", jurusan="Teknik Informatika")
    student_ti_1 = create_user(db_session, nama="Student TI 1", role="mahasiswa", jurusan="Teknik Informatika")
    student_ti_2 = create_user(db_session, nama="Student TI 2", role="mahasiswa", jurusan="Teknik Informatika")
    student_si = create_user(db_session, nama="Student SI", role="mahasiswa", jurusan="Sistem Informasi")

    # Post 1: TI, flagged by AI as 'berpotensi_melanggar'
    post1 = create_test_post(db_session, author=student_ti_1, isi="Konten berpotensi melanggar TI", status="menunggu_review")
    mod1 = ModerationRecord(post_id=post1.post_id, label_ai="berpotensi_melanggar", confidence=0.92, penjelasan_ai="Ujaran kasar terdeteksi")
    db_session.add(mod1)

    # Post 2: TI, flagged by AI as 'perlu_review'
    post2 = create_test_post(db_session, author=student_ti_2, isi="Konten perlu review TI", status="direview")
    mod2 = ModerationRecord(post_id=post2.post_id, label_ai="perlu_review", confidence=0.65, penjelasan_ai="Perlu konfirmasi konteks")
    db_session.add(mod2)

    # Post 3: SI (different department)
    post3 = create_test_post(db_session, author=student_si, isi="Konten SI perlu review", status="menunggu_review")
    mod3 = ModerationRecord(post_id=post3.post_id, label_ai="berpotensi_melanggar", confidence=0.95)
    db_session.add(mod3)

    db_session.commit()

    # Kaprodi TI inspects queue
    resp = client.get("/api/v1/moderation/queue", headers=auth_headers(kaprodi_ti))
    assert resp.status_code == 200
    queue = resp.json()

    # Must only include TI posts
    post_ids = [item["post_id"] for item in queue]
    assert post1.post_id in post_ids
    assert post2.post_id in post_ids
    assert post3.post_id not in post_ids  # Scoped out!

    # AI Priority check: post1 (berpotensi_melanggar) must come before post2 (perlu_review)
    assert queue[0]["post_id"] == post1.post_id
    assert queue[0]["label_ai"] == "berpotensi_melanggar"


# -----------------------------------------------------------------------------
# 4. KEPUTUSAN MODERASI & AUTO-RESOLVE LAPORAN
# -----------------------------------------------------------------------------

def test_moderation_decision_approve_resolves_reports_as_ignored(client, db_session: Session):
    kaprodi_ti = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    student_author = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    student_reporter = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")

    post = create_test_post(db_session, author=student_author, status="direview")
    report = Report(
        post_id=post.post_id,
        pelapor_id=student_reporter.user_id,
        alasan="Diduga melanggar aturan",
        kategori_laporan="konten_tidak_pantas",
        status="baru",
    )
    db_session.add(report)
    db_session.commit()

    # Kaprodi approves post
    resp = client.post(
        f"/api/v1/moderation/{post.post_id}/decision",
        json={"keputusan": "setujui", "catatan": "Konten aman dan tidak terbukti melanggar aturan."},
        headers=auth_headers(kaprodi_ti),
    )
    assert resp.status_code == 200
    db_session.refresh(post)
    assert post.status == "tayang"

    # Verify report is auto-resolved to 'diabaikan' + 'laporan_ditolak'
    db_session.refresh(report)
    assert report.status == "diabaikan"
    assert report.tindakan_diambil == "laporan_ditolak"
    assert report.resolved_at is not None

    # Verify author received 'moderasi_disetujui' notification
    author_notif = (
        db_session.query(Notification)
        .filter(Notification.user_id == student_author.user_id, Notification.jenis == "moderasi_disetujui")
        .first()
    )
    assert author_notif is not None

    # Verify reporter received 'laporan_diabaikan' neutral notification
    reporter_notif = (
        db_session.query(Notification)
        .filter(Notification.user_id == student_reporter.user_id, Notification.jenis == "laporan_diabaikan")
        .first()
    )
    assert reporter_notif is not None


def test_moderation_decision_requires_catatan_for_reject_or_revision(client, db_session: Session):
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student, status="menunggu_review")

    # Reject without notes -> 422
    resp_no_note = client.post(
        f"/api/v1/moderation/{post.post_id}/decision",
        json={"keputusan": "tolak", "catatan": ""},
        headers=auth_headers(kaprodi),
    )
    assert resp_no_note.status_code == 422

    # Reject with valid note -> 200
    resp_ok = client.post(
        f"/api/v1/moderation/{post.post_id}/decision",
        json={"keputusan": "tolak", "catatan": "Mengandung ujaran kebencian yang dilarang."},
        headers=auth_headers(kaprodi),
    )
    assert resp_ok.status_code == 200
    db_session.refresh(post)
    assert post.status == "ditolak"


# -----------------------------------------------------------------------------
# 5. TAKEDOWN & RESTORE
# -----------------------------------------------------------------------------

def test_post_takedown_endpoint_and_audit_fields(client, db_session: Session):
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student, status="tayang")

    resp = client.post(
        f"/api/v1/posts/{post.post_id}/takedown",
        json={"alasan_hapus": "Konten memuat pelanggaran hak cipta berat."},
        headers=auth_headers(kaprodi),
    )
    assert resp.status_code == 200
    db_session.refresh(post)
    assert post.is_deleted is True
    assert post.status == "dihapus"
    assert post.deleted_by == kaprodi.user_id
    assert post.alasan_hapus == "Konten memuat pelanggaran hak cipta berat."
    assert post.deleted_at is not None


def test_moderator_cannot_takedown_admin_post_403(client, db_session: Session):
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    admin = create_user(db_session, role="admin", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=admin, status="tayang")

    resp = client.post(
        f"/api/v1/posts/{post.post_id}/takedown",
        json={"alasan_hapus": "Mencoba men-takedown akun admin."},
        headers=auth_headers(kaprodi),
    )
    assert resp.status_code == 403
    assert "CANNOT_TAKEDOWN_STAFF" in resp.json()["code"]


def test_admin_restore_takedown_success(client, db_session: Session):
    admin = create_user(db_session, role="admin")
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(
        db_session,
        author=student,
        status="dihapus",
        is_deleted=True,
        deleted_by=admin.user_id,
        alasan_hapus="Takedown awal",
    )

    resp = client.post(
        f"/api/v1/posts/{post.post_id}/restore",
        json={"alasan_pemulihan": "Klarifikasi mahasiswa diterima, bukan plagiarisme."},
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    db_session.refresh(post)
    assert post.is_deleted is False
    assert post.status == "tayang"
    assert post.deleted_by is None
    assert post.alasan_hapus is None
