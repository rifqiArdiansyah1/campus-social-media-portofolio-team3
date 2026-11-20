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


def test_moderation_decision_state_guard_anti_race(client, db_session: Session):
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student, status="tayang")

    # Trying to approve/reject an already published post should fail with 409 ALREADY_REVIEWED
    resp = client.post(
        f"/api/v1/moderation/{post.post_id}/decision",
        json={"keputusan": "tolak", "catatan": "Catatan penolakan telat"},
        headers=auth_headers(kaprodi),
    )
    assert resp.status_code == 409
    assert resp.json()["code"] == "ALREADY_REVIEWED"


def test_report_resolve_reverts_post_status_to_tayang(client, db_session: Session):
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    student1 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    student2 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student1, status="tayang")

    # Student 2 reports post -> shifts to 'direview'
    client.post(
        "/api/v1/reports",
        json={"post_id": post.post_id, "alasan": "Laporan salah sasaran", "kategori_laporan": "spam"},
        headers=auth_headers(student2),
    )
    db_session.refresh(post)
    assert post.status == "direview"

    # Kaprodi dismisses the report from reports tab
    rep = db_session.query(Report).filter(Report.post_id == post.post_id).first()
    patch_resp = client.patch(
        f"/api/v1/reports/{rep.report_id}",
        json={"status": "diabaikan", "tindakan_diambil": "laporan_ditolak"},
        headers=auth_headers(kaprodi),
    )
    assert patch_resp.status_code == 200

    # Post status should automatically revert to 'tayang'
    db_session.refresh(post)
    assert post.status == "tayang"


def test_moderation_note_includes_catatan_moderator(client, db_session: Session):
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student, status="menunggu_review")

    # Kaprodi requests revision
    client.post(
        f"/api/v1/moderation/{post.post_id}/decision",
        json={"keputusan": "minta_revisi", "catatan": "Perbaiki sitasi dan sumber referensi."},
        headers=auth_headers(kaprodi),
    )

    # Student checks post detail
    resp = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(student))
    assert resp.status_code == 200
    assert resp.json()["moderation_note"] == "Perbaiki sitasi dan sumber referensi."


def test_can_report_flag_false_when_active_report_exists(client, db_session: Session):
    student1 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    student2 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student1, status="tayang")

    # Before reporting, can_report is True for student2
    resp = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(student2))
    assert resp.status_code == 200
    assert resp.json()["can_report"] is True

    # Student 2 reports the post
    client.post(
        "/api/v1/reports",
        json={"post_id": post.post_id, "alasan": "Spam iklan terdeteksi", "kategori_laporan": "spam"},
        headers=auth_headers(student2),
    )

    # After reporting, can_report must be False
    resp_after = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(student2))
    assert resp_after.status_code == 200
    assert resp_after.json()["can_report"] is False
    assert resp_after.json()["reported_by_me"] is True


def test_reported_by_me_and_optional_alasan(client, db_session: Session):
    student1 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    student2 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    student3 = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    post = create_test_post(db_session, author=student1, status="tayang")

    # Before reporting: reported_by_me is False for student2
    resp_before = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(student2))
    assert resp_before.status_code == 200
    assert resp_before.json()["reported_by_me"] is False
    assert resp_before.json()["can_report"] is True

    # 1. Reporting without alasan (optional) for standard category succeeds
    res_rep = client.post(
        "/api/v1/reports",
        json={"post_id": post.post_id, "kategori_laporan": "konten_tidak_pantas"},
        headers=auth_headers(student2),
    )
    assert res_rep.status_code == 201
    assert "Konten Tidak Pantas" in res_rep.json()["alasan"]

    # 2. After reporting: reported_by_me is True for student2, can_report is False
    resp_after = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(student2))
    assert resp_after.status_code == 200
    assert resp_after.json()["reported_by_me"] is True
    assert resp_after.json()["can_report"] is False

    # But for student3 (who hasn't reported), reported_by_me is False and can_report is True
    resp_s3 = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(student3))
    assert resp_s3.status_code == 200
    assert resp_s3.json()["reported_by_me"] is False
    assert resp_s3.json()["can_report"] is True

    # 3. Reporting with category 'lainnya' without reason fails with 422
    post2 = create_test_post(db_session, author=student1, status="tayang")
    res_fail = client.post(
        "/api/v1/reports",
        json={"post_id": post2.post_id, "kategori_laporan": "lainnya"},
        headers=auth_headers(student2),
    )
    assert res_fail.status_code == 422


def test_get_reports_with_post_preview_and_category_filter(client, db_session: Session):
    admin = create_user(db_session, role="admin")
    student1 = create_user(db_session, nama="Penulis Post", role="mahasiswa", jurusan="Teknik Informatika")
    student2 = create_user(db_session, nama="Pelapor 1", role="mahasiswa", jurusan="Teknik Informatika")
    student3 = create_user(db_session, nama="Pelapor 2", role="mahasiswa", jurusan="Teknik Informatika")

    post_spam = create_test_post(
        db_session,
        author=student1,
        isi="Promo judi online dan pinjol tanpa agunan!",
        gambar_url="https://storage.kampus.ac.id/promo.jpg",
        status="tayang",
    )
    post_sara = create_test_post(
        db_session,
        author=student1,
        isi="Konten provokatif bernuansa kebencian.",
        gambar_url=None,
        status="tayang",
    )

    # Student 2 reports post_spam as spam
    r1 = client.post(
        "/api/v1/reports",
        json={"post_id": post_spam.post_id, "kategori_laporan": "spam"},
        headers=auth_headers(student2),
    )
    assert r1.status_code == 201

    # Student 3 reports post_sara as konten_tidak_pantas
    r2 = client.post(
        "/api/v1/reports",
        json={"post_id": post_sara.post_id, "kategori_laporan": "konten_tidak_pantas"},
        headers=auth_headers(student3),
    )
    assert r2.status_code == 201

    # Admin fetches reports without filter
    all_reports = client.get("/api/v1/reports", headers=auth_headers(admin))
    assert all_reports.status_code == 200
    reports_data = all_reports.json()
    assert len(reports_data) >= 2

    # Check post preview brief on post_spam report
    spam_rep = next(r for r in reports_data if r["post_id"] == post_spam.post_id)
    assert spam_rep["post"] is not None
    assert spam_rep["post"]["post_id"] == post_spam.post_id
    assert "Promo judi online" in spam_rep["post"]["isi"]
    assert spam_rep["post"]["gambar_url"] == "https://storage.kampus.ac.id/promo.jpg"
    assert spam_rep["post"]["author"]["user_id"] == student1.user_id
    assert spam_rep["post"]["author"]["nama"] == student1.nama

    # Admin filters by category: spam
    spam_filtered = client.get("/api/v1/reports?kategori=spam", headers=auth_headers(admin))
    assert spam_filtered.status_code == 200
    spam_list = spam_filtered.json()
    assert any(r["post_id"] == post_spam.post_id for r in spam_list)
    assert not any(r["post_id"] == post_sara.post_id for r in spam_list)

    # Admin filters by category: konten_tidak_pantas
    ktp_filtered = client.get("/api/v1/reports?kategori=konten_tidak_pantas", headers=auth_headers(admin))
    assert ktp_filtered.status_code == 200
    ktp_list = ktp_filtered.json()
    assert any(r["post_id"] == post_sara.post_id for r in ktp_list)
    assert not any(r["post_id"] == post_spam.post_id for r in ktp_list)

