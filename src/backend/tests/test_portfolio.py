from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import Skill, User


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


def create_skill(db: Session, nama: str = "Python", tipe: str = "skill") -> Skill:
    uid = uuid4().hex[:6]
    skill = Skill(nama=f"{nama}_{uid}", tipe=tipe)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.user_id)
    return {"Authorization": f"Bearer {token}"}


# -------------------------------------------------------------------------
# TESTS
# -------------------------------------------------------------------------

def test_create_project_portfolio(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")
    skill1 = create_skill(db_session, "React")
    skill2 = create_skill(db_session, "NodeJS")

    payload = {
        "judul": "Aplikasi Portofolio Mahasiswa Modern",
        "deskripsi": "Platform showcase karya dan capaian akademik.",
        "kategori": "proyek",
        "tautan_url": "https://github.com/campus/portfolio",
        "skill_ids": [skill1.skill_id, skill2.skill_id],
    }

    res = client.post("/api/v1/portfolio", json=payload, headers=auth_headers(student))
    assert res.status_code == 201
    data = res.json()
    assert data["judul"] == payload["judul"]
    assert data["kategori"] == "proyek"
    assert data["status_verifikasi"] == "draft"
    assert len(data["skills"]) == 2
    assert data["user_id"] == student.user_id


def test_create_portfolio_invalid_urls_and_dates(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")

    # Invalid URL scheme
    bad_url_payload = {
        "judul": "Test Portofolio",
        "kategori": "proyek",
        "tautan_url": "javascript:alert('xss')",
    }
    res = client.post("/api/v1/portfolio", json=bad_url_payload, headers=auth_headers(student))
    assert res.status_code == 422

    # Future publication date
    future_date = (date.today() + timedelta(days=5)).isoformat()
    bad_date_payload = {
        "judul": "Test Sertifikat",
        "kategori": "sertifikat",
        "tanggal_terbit": future_date,
    }
    res = client.post("/api/v1/portfolio", json=bad_date_payload, headers=auth_headers(student))
    assert res.status_code == 422


def test_doi_validation_and_canonical_normalization(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")

    # Full DOI URL gets canonicalized
    payload = {
        "judul": "Publikasi Ilmiah AI",
        "kategori": "artikel_ilmiah",
        "nomor_dokumen": "https://doi.org/10.1145/1234567.1234568",
        "penerbit": "ACM Transactions",
        "tanggal_terbit": "2024-01-15",
    }
    res = client.post("/api/v1/portfolio", json=payload, headers=auth_headers(student))
    assert res.status_code == 201
    data = res.json()
    assert data["nomor_dokumen"] == "10.1145/1234567.1234568"

    # Invalid DOI
    bad_doi_payload = {
        "judul": "Publikasi Ilmiah Rusak",
        "kategori": "artikel_ilmiah",
        "nomor_dokumen": "not-a-doi-identifier",
    }
    res = client.post("/api/v1/portfolio", json=bad_doi_payload, headers=auth_headers(student))
    assert res.status_code == 422


def test_upload_portfolio_document_pdf_and_ownership(client, db_session: Session):
    student_a = create_user(db_session, nama="Student A", role="mahasiswa")
    student_b = create_user(db_session, nama="Student B", role="mahasiswa")
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")

    # Non-student cannot upload
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    res_forbidden = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("dokumen.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(kaprodi),
    )
    assert res_forbidden.status_code == 403

    # Student A uploads valid PDF
    res_upload = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("sertifikat.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(student_a),
    )
    assert res_upload.status_code == 201
    upload_data = res_upload.json()
    doc_path = upload_data["path"]
    assert doc_path.startswith(f"{student_a.user_id}/")
    assert doc_path.endswith(".pdf")

    # Student B attempts to hijack Student A's doc_path
    res_hijack = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Sertifikat Bajakan",
            "kategori": "sertifikat",
            "file_url": doc_path,
        },
        headers=auth_headers(student_b),
    )
    assert res_hijack.status_code == 422
    assert "INVALID_FILE_OWNERSHIP" in res_hijack.json()["code"]

    # Path traversal attempt
    res_traversal = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Sertifikat Traversal",
            "kategori": "sertifikat",
            "file_url": f"../{doc_path}",
        },
        headers=auth_headers(student_a),
    )
    assert res_traversal.status_code == 422

    # Encrypted PDF rejection
    encrypted_pdf = b"%PDF-1.4\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj\ntrailer\n<<>>\n%%EOF"
    res_enc = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("locked.pdf", encrypted_pdf, "application/pdf")},
        headers=auth_headers(student_a),
    )
    assert res_enc.status_code == 422
    assert "INVALID_DOCUMENT_FILE" in res_enc.json()["code"]


def test_submit_and_withdraw_flow(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa")

    # 1. Proyek cannot be submitted for SKPI
    proj_res = client.post(
        "/api/v1/portfolio",
        json={"judul": "Karya Proyek", "kategori": "proyek"},
        headers=auth_headers(student),
    )
    proj_id = proj_res.json()["portfolio_id"]

    submit_proj = client.post(f"/api/v1/portfolio/{proj_id}/submit", headers=auth_headers(student))
    assert submit_proj.status_code == 422
    assert "PROJECT_CANNOT_BE_SUBMITTED_FOR_SKPI" in submit_proj.json()["code"]

    # 2. Incomplete certificate submit
    cert_res = client.post(
        "/api/v1/portfolio",
        json={"judul": "Sertifikat Lomba", "kategori": "sertifikat"},
        headers=auth_headers(student),
    )
    cert_id = cert_res.json()["portfolio_id"]

    submit_incomplete = client.post(f"/api/v1/portfolio/{cert_id}/submit", headers=auth_headers(student))
    assert submit_incomplete.status_code == 422
    assert "INCOMPLETE_DOCUMENT_FIELDS" in submit_incomplete.json()["code"]

    # Upload document and complete fields
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    up = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("sertifikat.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(student),
    )
    doc_path = up.json()["path"]

    client.patch(
        f"/api/v1/portfolio/{cert_id}",
        json={
            "nomor_dokumen": "CERT-2024-001",
            "penerbit": "Kementerian Kominfo",
            "tanggal_terbit": "2024-05-10",
            "file_url": doc_path,
        },
        headers=auth_headers(student),
    )

    # 3. Successful submit
    submit_ok = client.post(f"/api/v1/portfolio/{cert_id}/submit", headers=auth_headers(student))
    assert submit_ok.status_code == 200
    assert submit_ok.json()["status_verifikasi"] == "menunggu_review"
    assert submit_ok.json()["submitted_at"] is not None

    # Submitting again gives 409
    submit_again = client.post(f"/api/v1/portfolio/{cert_id}/submit", headers=auth_headers(student))
    assert submit_again.status_code == 409

    # 4. Withdraw to draft
    withdraw_ok = client.post(f"/api/v1/portfolio/{cert_id}/withdraw", headers=auth_headers(student))
    assert withdraw_ok.status_code == 200
    assert withdraw_ok.json()["status_verifikasi"] == "draft"
    assert withdraw_ok.json()["submitted_at"] is None

    # Withdraw again gives 409
    withdraw_again = client.post(f"/api/v1/portfolio/{cert_id}/withdraw", headers=auth_headers(student))
    assert withdraw_again.status_code == 409


def test_review_queue_and_fifo_order(client, db_session: Session):
    mhs_ti_1 = create_user(db_session, nama="Mhs TI 1", role="mahasiswa", jurusan="Teknik Informatika")
    mhs_ti_2 = create_user(db_session, nama="Mhs TI 2", role="mahasiswa", jurusan="Teknik Informatika")
    mhs_si = create_user(db_session, nama="Mhs SI", role="mahasiswa", jurusan="Sistem Informasi")

    kaprodi_ti = create_user(db_session, nama="Kaprodi TI", role="moderator", jurusan="Teknik Informatika")
    kaprodi_si = create_user(db_session, nama="Kaprodi SI", role="moderator", jurusan="Sistem Informasi")
    admin = create_user(db_session, nama="Admin", role="admin", jurusan=None)

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    def make_and_submit(user, judul, doc_num):
        up = client.post(
            "/api/v1/uploads/portfolio-doc",
            files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
            headers=auth_headers(user),
        )
        path = up.json()["path"]
        p = client.post(
            "/api/v1/portfolio",
            json={
                "judul": judul,
                "kategori": "sertifikat",
                "nomor_dokumen": doc_num,
                "penerbit": "BNSP",
                "tanggal_terbit": "2024-01-01",
                "file_url": path,
            },
            headers=auth_headers(user),
        )
        pid = p.json()["portfolio_id"]
        client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(user))
        return pid

    # TI Item 1 submitted earlier
    pid1 = make_and_submit(mhs_ti_1, "Sertifikat TI 1", "DOC-001")
    # TI Item 2 submitted later
    pid2 = make_and_submit(mhs_ti_2, "Sertifikat TI 2", "DOC-002")
    # SI Item
    pid_si = make_and_submit(mhs_si, "Sertifikat SI", "DOC-003")

    # 1. Kaprodi TI sees TI items in FIFO order
    res_ti = client.get("/api/v1/portfolio/review-queue", headers=auth_headers(kaprodi_ti))
    assert res_ti.status_code == 200
    queue_ti = res_ti.json()["items"]
    ti_ids = [it["portfolio_id"] for it in queue_ti]
    assert pid1 in ti_ids
    assert pid2 in ti_ids
    assert pid_si not in ti_ids
    assert ti_ids.index(pid1) < ti_ids.index(pid2)  # FIFO: older submitted first

    # 2. Kaprodi SI sees SI item
    res_si = client.get("/api/v1/portfolio/review-queue", headers=auth_headers(kaprodi_si))
    assert res_si.status_code == 200
    queue_si = res_si.json()["items"]
    si_ids = [it["portfolio_id"] for it in queue_si]
    assert pid_si in si_ids
    assert pid1 not in si_ids

    # 3. Admin can view queue
    res_admin = client.get("/api/v1/portfolio/review-queue", headers=auth_headers(admin))
    assert res_admin.status_code == 200
    assert res_admin.json()["total"] >= 3

    # 4. Student cannot view queue
    res_forbidden = client.get("/api/v1/portfolio/review-queue", headers=auth_headers(mhs_ti_1))
    assert res_forbidden.status_code == 403


def test_kaprodi_review_approve_and_reject(client, db_session: Session):
    mhs_ti = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    kaprodi_ti = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    kaprodi_si = create_user(db_session, role="moderator", jurusan="Sistem Informasi")

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    up = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(mhs_ti),
    )
    doc_path = up.json()["path"]

    p = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "SKPI Juara 1 Hackathon",
            "kategori": "skpi",
            "nomor_dokumen": "SKPI-2024-999",
            "penerbit": "Universitas Indonesia",
            "tanggal_terbit": "2024-03-20",
            "file_url": doc_path,
        },
        headers=auth_headers(mhs_ti),
    )
    pid = p.json()["portfolio_id"]
    client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(mhs_ti))

    # 1. Kaprodi of different prodi tries to review -> 403
    diff_review = client.patch(
        f"/api/v1/portfolio/{pid}/review",
        json={"status_verifikasi": "terverifikasi"},
        headers=auth_headers(kaprodi_si),
    )
    assert diff_review.status_code == 403
    assert "FORBIDDEN_DEPARTMENT" in diff_review.json()["code"]

    # 2. Rejection without note or too short (< 5 chars) -> 422
    reject_short = client.patch(
        f"/api/v1/portfolio/{pid}/review",
        json={"status_verifikasi": "ditolak", "catatan_verifikasi": "bad"},
        headers=auth_headers(kaprodi_ti),
    )
    assert reject_short.status_code == 422

    # 3. Valid rejection
    reject_ok = client.patch(
        f"/api/v1/portfolio/{pid}/review",
        json={"status_verifikasi": "ditolak", "catatan_verifikasi": "Tanda tangan penyelenggara belum lengkap."},
        headers=auth_headers(kaprodi_ti),
    )
    assert reject_ok.status_code == 200
    assert reject_ok.json()["status_verifikasi"] == "ditolak"
    assert "Tanda tangan" in reject_ok.json()["catatan_verifikasi"]

    # 4. Student re-submits after fix
    re_submit = client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(mhs_ti))
    assert re_submit.status_code == 200
    assert re_submit.json()["catatan_verifikasi"] is None

    # 5. Kaprodi approves
    approve_ok = client.patch(
        f"/api/v1/portfolio/{pid}/review",
        json={"status_verifikasi": "terverifikasi", "catatan_verifikasi": "Dokumen valid dan sesuai."},
        headers=auth_headers(kaprodi_ti),
    )
    assert approve_ok.status_code == 200
    assert approve_ok.json()["status_verifikasi"] == "terverifikasi"
    assert approve_ok.json()["diverifikasi_oleh"] == kaprodi_ti.user_id
    assert approve_ok.json()["verified_at"] is not None

    # 6. Anti-race conditional update: subsequent review attempt gets 409
    subsequent = client.patch(
        f"/api/v1/portfolio/{pid}/review",
        json={"status_verifikasi": "ditolak", "catatan_verifikasi": "Terlambat menolak."},
        headers=auth_headers(kaprodi_ti),
    )
    assert subsequent.status_code == 409
    assert "ALREADY_REVIEWED" in subsequent.json()["code"]


def test_signed_url_security_and_anti_leak(client, db_session: Session):
    student_a = create_user(db_session, nama="Student A", role="mahasiswa", jurusan="Teknik Informatika")
    student_b = create_user(db_session, nama="Student B", role="mahasiswa", jurusan="Teknik Informatika")
    kaprodi_ti = create_user(db_session, role="moderator", jurusan="Teknik Informatika")
    kaprodi_si = create_user(db_session, role="moderator", jurusan="Sistem Informasi")

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    up = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(student_a),
    )
    doc_path = up.json()["path"]

    p = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Sertifikat A",
            "kategori": "sertifikat",
            "nomor_dokumen": "CERT-A-01",
            "penerbit": "Cisco",
            "tanggal_terbit": "2024-02-01",
            "file_url": doc_path,
        },
        headers=auth_headers(student_a),
    )
    pid = p.json()["portfolio_id"]

    # In draft mode:
    # 1. Owner can get signed url
    url_owner = client.get(f"/api/v1/portfolio/{pid}/file", headers=auth_headers(student_a))
    assert url_owner.status_code == 200
    assert "signed_url" in url_owner.json()
    assert url_owner.json()["expires_in"] == 300

    # 2. Student B gets 404 (anti-leak, NOT 403)
    url_stranger = client.get(f"/api/v1/portfolio/{pid}/file", headers=auth_headers(student_b))
    assert url_stranger.status_code == 404

    # 3. Kaprodi cannot view draft -> 404
    url_kaprodi_draft = client.get(f"/api/v1/portfolio/{pid}/file", headers=auth_headers(kaprodi_ti))
    assert url_kaprodi_draft.status_code == 404

    # Student A submits for review
    client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(student_a))

    # 4. Now Kaprodi TI can view submitted document
    url_kaprodi_ok = client.get(f"/api/v1/portfolio/{pid}/file", headers=auth_headers(kaprodi_ti))
    assert url_kaprodi_ok.status_code == 200

    # 5. Kaprodi of another prodi gets 404
    url_kaprodi_si = client.get(f"/api/v1/portfolio/{pid}/file", headers=auth_headers(kaprodi_si))
    assert url_kaprodi_si.status_code == 404


def test_admin_revoke_verification(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    admin = create_user(db_session, role="admin", jurusan=None)
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    up = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(student),
    )
    doc_path = up.json()["path"]

    p = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Sertifikat Keliru Disetujui",
            "kategori": "sertifikat",
            "nomor_dokumen": "CERT-REVOKE-01",
            "penerbit": "Oracle",
            "tanggal_terbit": "2024-01-01",
            "file_url": doc_path,
        },
        headers=auth_headers(student),
    )
    pid = p.json()["portfolio_id"]
    client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(student))
    client.patch(
        f"/api/v1/portfolio/{pid}/review",
        json={"status_verifikasi": "terverifikasi"},
        headers=auth_headers(kaprodi),
    )

    # Non-admin cannot revoke
    rev_non_admin = client.post(
        f"/api/v1/portfolio/{pid}/revoke",
        json={"alasan": "Pencabutan ilegal"},
        headers=auth_headers(kaprodi),
    )
    assert rev_non_admin.status_code == 403

    # Admin revokes
    rev_admin = client.post(
        f"/api/v1/portfolio/{pid}/revoke",
        json={"alasan": "Ditemukan pemalsuan nomor sertifikat."},
        headers=auth_headers(admin),
    )
    assert rev_admin.status_code == 200
    assert rev_admin.json()["status_verifikasi"] == "ditolak"
    assert "REVOKED by Admin" in rev_admin.json()["catatan_verifikasi"]


def test_department_locking_on_profile_update(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")

    # 1. Without active portfolio, student can update jurusan
    res1 = client.patch(
        "/api/v1/users/me",
        json={"jurusan": "Sistem Informasi"},
        headers=auth_headers(student),
    )
    assert res1.status_code == 200
    assert res1.json()["jurusan"] == "Sistem Informasi"

    # 2. Student creates and submits a portfolio
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    up = client.post(
        "/api/v1/uploads/portfolio-doc",
        files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
        headers=auth_headers(student),
    )
    p = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Sertifikat SI",
            "kategori": "sertifikat",
            "nomor_dokumen": "CERT-LOCK-01",
            "penerbit": "BNSP",
            "tanggal_terbit": "2024-01-01",
            "file_url": up.json()["path"],
        },
        headers=auth_headers(student),
    )
    pid = p.json()["portfolio_id"]
    client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(student))

    # 3. Now department change is locked (409)
    res_locked = client.patch(
        "/api/v1/users/me",
        json={"jurusan": "Teknik Informatika"},
        headers=auth_headers(student),
    )
    assert res_locked.status_code == 409
    assert "DEPARTMENT_LOCKED_ACTIVE_PORTFOLIO" in res_locked.json()["code"]


def test_skpi_summary_calculation_and_masking(client, db_session: Session):
    student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    other_student = create_user(db_session, role="mahasiswa", jurusan="Teknik Informatika")
    kaprodi = create_user(db_session, role="moderator", jurusan="Teknik Informatika")

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"

    def make_verified(judul, kategori, doc_num, doi=False):
        up = client.post(
            "/api/v1/uploads/portfolio-doc",
            files={"file": ("doc.pdf", pdf_bytes, "application/pdf")},
            headers=auth_headers(student),
        )
        p = client.post(
            "/api/v1/portfolio",
            json={
                "judul": judul,
                "kategori": kategori,
                "nomor_dokumen": doc_num,
                "penerbit": "Penerbit Resmi",
                "tanggal_terbit": "2024-01-01",
                "file_url": up.json()["path"],
            },
            headers=auth_headers(student),
        )
        pid = p.json()["portfolio_id"]
        client.post(f"/api/v1/portfolio/{pid}/submit", headers=auth_headers(student))
        client.patch(
            f"/api/v1/portfolio/{pid}/review",
            json={"status_verifikasi": "terverifikasi"},
            headers=auth_headers(kaprodi),
        )
        return pid

    # 1. Proyek (0 SKPI points, direct public)
    client.post(
        "/api/v1/portfolio",
        json={"judul": "Proyek Web", "kategori": "proyek"},
        headers=auth_headers(student),
    )

    # 2. Sertifikat (1 SKPI point)
    make_verified("Sertifikat Coding", "sertifikat", "CERT-12345")

    # 3. SKPI (1 SKPI point)
    make_verified("Juara Debat SKPI", "skpi", "SKPI-67890")

    # 4. Artikel Ilmiah (2 SKPI points)
    make_verified("Paper AI LLM", "artikel_ilmiah", "10.1145/3333333.4444444")

    # 5. Summary viewed by owner
    summary_owner = client.get(f"/api/v1/users/{student.user_id}/skpi-summary", headers=auth_headers(student))
    assert summary_owner.status_code == 200
    s_data = summary_owner.json()
    assert s_data["total_terverifikasi"] == 3
    assert s_data["total_poin"] == 4  # 1 (sertifikat) + 1 (skpi) + 2 (artikel) = 4
    assert s_data["jumlah_per_kategori"]["sertifikat"] == 1
    assert s_data["jumlah_per_kategori"]["skpi"] == 1
    assert s_data["jumlah_per_kategori"]["artikel_ilmiah"] == 1
    assert s_data["poin_per_kategori"]["proyek"] == 0
    assert s_data["poin_per_kategori"]["artikel_ilmiah"] == 2

    # 6. Summary viewed by stranger -> menunggu_review is None (private)
    summary_other = client.get(f"/api/v1/users/{student.user_id}/skpi-summary", headers=auth_headers(other_student))
    assert summary_other.status_code == 200
    assert summary_other.json()["menunggu_review"] is None

    # 7. Masking check on public portfolio detail
    # Fetch list as stranger
    list_other = client.get(f"/api/v1/portfolio?user_id={student.user_id}", headers=auth_headers(other_student))
    assert list_other.status_code == 200
    for item in list_other.json():
        # Stranger must not receive private document URL
        assert "file_url" not in item or item.get("file_url") is None
        assert "catatan_verifikasi" not in item or item.get("catatan_verifikasi") is None
        if item.get("nomor_dokumen"):
            assert item["nomor_dokumen"].startswith("***")


def test_portfolio_gambar_url_validation(client, db_session: Session):
    student = create_user(db_session, "valid_gambar@kampus.ac.id", "mahasiswa", "Informatika")

    # Invalid scheme
    res_invalid = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Proyek Invalid Image",
            "kategori": "proyek",
            "gambar_url": "javascript:alert(1)",
        },
        headers=auth_headers(student),
    )
    assert res_invalid.status_code == 422

    # Valid scheme
    res_valid = client.post(
        "/api/v1/portfolio",
        json={
            "judul": "Proyek Valid Image",
            "kategori": "proyek",
            "gambar_url": "https://example.com/cover.jpg",
        },
        headers=auth_headers(student),
    )
    assert res_valid.status_code == 201
    assert res_valid.json()["gambar_url"] == "https://example.com/cover.jpg"


def test_portfolio_withdraw_atomic_and_safety(client, db_session: Session):
    student = create_user(db_session, "withdraw_owner@kampus.ac.id", "mahasiswa", "Informatika")
    stranger = create_user(db_session, "withdraw_stranger@kampus.ac.id", "mahasiswa", "Informatika")

    create_res = client.post(
        "/api/v1/portfolio",
        json={"judul": "Proyek Withdraw Test", "kategori": "proyek"},
        headers=auth_headers(student),
    )
    item_id = create_res.json()["portfolio_id"]

    # 1. Draft cannot be withdrawn -> 409
    res_draft_withdraw = client.post(f"/api/v1/portfolio/{item_id}/withdraw", headers=auth_headers(student))
    assert res_draft_withdraw.status_code == 409

    # 2. Stranger cannot withdraw -> 403
    res_stranger = client.post(f"/api/v1/portfolio/{item_id}/withdraw", headers=auth_headers(stranger))
    assert res_stranger.status_code == 403
