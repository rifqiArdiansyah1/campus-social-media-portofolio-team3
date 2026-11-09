import logging
from datetime import datetime
from typing import List, Optional, Union

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, update
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ConflictError, ForbiddenError, InvalidInputError, NotFoundError
from app.core.security import can_moderate, get_current_user
from app.models.entities import PortfolioItem, PortfolioSkill, Skill, User
from app.schemas.portfolio import (
    PortfolioAuthorResponse,
    PortfolioCreate,
    PortfolioDetailResponse,
    PortfolioPublicResponse,
    PortfolioReviewRequest,
    PortfolioRevokeRequest,
    PortfolioUpdate,
    ReviewQueueItemResponse,
    ReviewQueueListResponse,
    SignedUrlResponse,
    SkillBriefResponse,
    mask_document_number,
)
from app.services.notification import create_notification
from app.services.storage import storage_service
from app.services.visibility import exclude_hidden, is_target_blocking_viewer

logger = logging.getLogger(__name__)

router = APIRouter()


def _serialize_detail(item: PortfolioItem) -> PortfolioDetailResponse:
    skills = [
        SkillBriefResponse(
            skill_id=ps.skill.skill_id,
            nama=ps.skill.nama,
            kategori=ps.skill.tipe,
        )
        for ps in item.skills
        if ps.skill is not None
    ]
    author = None
    if item.user:
        author = PortfolioAuthorResponse(
            user_id=item.user.user_id,
            nama_lengkap=item.user.nama,
            nim=item.user.nim,
            jurusan=item.user.jurusan,
            avatar_url=getattr(item.user, "avatar_url", None),
        )
    return PortfolioDetailResponse(
        portfolio_id=item.portfolio_id,
        user_id=item.user_id,
        judul=item.judul,
        deskripsi=item.deskripsi,
        tautan_url=item.tautan_url,
        gambar_url=item.gambar_url,
        kategori=item.kategori,
        nomor_dokumen=item.nomor_dokumen,
        penerbit=item.penerbit,
        tanggal_terbit=item.tanggal_terbit,
        file_url=item.file_url,
        has_file=bool(item.file_url),
        status_verifikasi=item.status_verifikasi,
        diverifikasi_oleh=item.diverifikasi_oleh,
        catatan_verifikasi=item.catatan_verifikasi,
        verified_at=item.verified_at,
        submitted_at=item.submitted_at,
        created_at=item.created_at,
        skills=skills,
        author=author,
    )


def _serialize_public(item: PortfolioItem) -> PortfolioPublicResponse:
    skills = [
        SkillBriefResponse(
            skill_id=ps.skill.skill_id,
            nama=ps.skill.nama,
            kategori=ps.skill.tipe,
        )
        for ps in item.skills
        if ps.skill is not None
    ]
    author = None
    if item.user:
        author = PortfolioAuthorResponse(
            user_id=item.user.user_id,
            nama_lengkap=item.user.nama,
            nim=None,
            jurusan=item.user.jurusan,
            avatar_url=getattr(item.user, "avatar_url", None),
        )
    return PortfolioPublicResponse(
        portfolio_id=item.portfolio_id,
        user_id=item.user_id,
        judul=item.judul,
        deskripsi=item.deskripsi,
        tautan_url=item.tautan_url,
        gambar_url=item.gambar_url,
        kategori=item.kategori,
        nomor_dokumen=mask_document_number(item.nomor_dokumen),
        penerbit=item.penerbit,
        tanggal_terbit=item.tanggal_terbit,
        has_file=bool(item.file_url),
        status_verifikasi=item.status_verifikasi,
        created_at=item.created_at,
        skills=skills,
        author=author,
    )


# -------------------------------------------------------------------------
# 1. REVIEW QUEUE (DECLARED BEFORE /{id} TO AVOID ROUTE COLLISION)
# -------------------------------------------------------------------------
@router.get(
    "/review-queue",
    response_model=ReviewQueueListResponse,
    summary="Antrean Verifikasi Portofolio FIFO Kaprodi & Admin",
)
def get_review_queue(
    jurusan: Optional[str] = Query(None, description="Filter jurusan (khusus Admin)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("moderator", "admin"):
        raise ForbiddenError(
            code="FORBIDDEN_OPERATION",
            detail="Hanya Kaprodi (Moderator) dan Administrator yang dapat mengakses antrean review portofolio.",
        )

    target_jurusan = None
    if current_user.role == "moderator":
        if not current_user.jurusan:
            raise ForbiddenError(
                code="MODERATOR_WITHOUT_DEPARTMENT",
                detail="Akun moderator tidak memiliki data jurusan resmi.",
            )
        target_jurusan = current_user.jurusan
    elif current_user.role == "admin" and jurusan:
        target_jurusan = jurusan

    query = (
        db.query(PortfolioItem)
        .join(User, PortfolioItem.user_id == User.user_id)
        .filter(PortfolioItem.status_verifikasi == "menunggu_review")
    )

    if target_jurusan:
        query = query.filter(User.jurusan == target_jurusan)

    total = query.count()
    items = (
        query.options(
            joinedload(PortfolioItem.user),
            selectinload(PortfolioItem.skills).joinedload(PortfolioSkill.skill),
        )
        .order_by(PortfolioItem.submitted_at.asc(), PortfolioItem.created_at.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Batch duplicate document detection in a single query
    doc_numbers = [it.nomor_dokumen.strip().lower() for it in items if it.nomor_dokumen]
    dup_set = set()
    if doc_numbers:
        dup_counts = (
            db.query(func.lower(PortfolioItem.nomor_dokumen), func.count(PortfolioItem.portfolio_id))
            .filter(
                func.lower(PortfolioItem.nomor_dokumen).in_(doc_numbers),
                PortfolioItem.status_verifikasi.in_(["terverifikasi", "menunggu_review"]),
            )
            .group_by(func.lower(PortfolioItem.nomor_dokumen))
            .all()
        )
        dup_set = {doc for doc, cnt in dup_counts if cnt > 1}

    queue_items: List[ReviewQueueItemResponse] = []
    for it in items:
        is_dup = False
        if it.nomor_dokumen:
            is_dup = it.nomor_dokumen.strip().lower() in dup_set

        skills = [
            SkillBriefResponse(
                skill_id=ps.skill.skill_id,
                nama=ps.skill.nama,
                kategori=ps.skill.tipe,
            )
            for ps in it.skills
            if ps.skill is not None
        ]

        queue_items.append(
            ReviewQueueItemResponse(
                portfolio_id=it.portfolio_id,
                user_id=it.user_id,
                judul=it.judul,
                deskripsi=it.deskripsi,
                kategori=it.kategori,
                nomor_dokumen=it.nomor_dokumen,
                penerbit=it.penerbit,
                tanggal_terbit=it.tanggal_terbit,
                file_url=it.file_url,
                has_file=bool(it.file_url),
                status_verifikasi=it.status_verifikasi,
                submitted_at=it.submitted_at,
                created_at=it.created_at,
                author_nama=it.user.nama if it.user else "Mahasiswa",
                author_nim=it.user.nim if it.user else None,
                author_jurusan=it.user.jurusan if it.user else None,
                author_avatar_url=getattr(it.user, "avatar_url", None) if it.user else None,
                is_duplicate_dokumen=is_dup,
                skills=skills,
            )
        )

    return ReviewQueueListResponse(
        items=queue_items,
        total=total,
        jurusan=target_jurusan,
    )


# -------------------------------------------------------------------------
# 2. CREATE PORTFOLIO
# -------------------------------------------------------------------------
@router.post(
    "",
    response_model=PortfolioDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Unggah/Buat Portofolio Baru (Draft atau Proyek)",
)
def create_portfolio_item(
    payload: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "mahasiswa":
        raise ForbiddenError(
            code="STUDENT_ONLY",
            detail="Hanya mahasiswa yang diizinkan membuat portofolio dan capaian SKPI.",
        )

    # Validate file_url ownership and safety
    if payload.file_url:
        if ".." in payload.file_url or "//" in payload.file_url or "\\" in payload.file_url:
            raise InvalidInputError(
                code="INVALID_FILE_PATH",
                detail="Jalur berkas tidak valid atau memuat path traversal.",
            )
        if not payload.file_url.startswith(f"{current_user.user_id}/"):
            raise InvalidInputError(
                code="INVALID_FILE_OWNERSHIP",
                detail="file_url harus berada dalam direktori pengguna Anda.",
            )
        if not storage_service.object_exists(settings.PORTFOLIO_DOCS_BUCKET, payload.file_url):
            raise InvalidInputError(
                code="FILE_NOT_FOUND_IN_STORAGE",
                detail="Berkas dokumen bukti tidak ditemukan di penyimpanan privat. Silakan unggah terlebih dahulu.",
            )

    # Validate skills existence
    valid_skill_ids = []
    if payload.skill_ids:
        found_skills = db.query(Skill).filter(Skill.skill_id.in_(payload.skill_ids)).all()
        found_ids = {s.skill_id for s in found_skills}
        missing_ids = set(payload.skill_ids) - found_ids
        if missing_ids:
            raise InvalidInputError(
                code="SKILL_NOT_FOUND",
                detail=f"Satu atau lebih skill_id tidak ditemukan: {list(missing_ids)}",
            )
        valid_skill_ids = payload.skill_ids

    # Create portfolio item
    item = PortfolioItem(
        user_id=current_user.user_id,
        judul=payload.judul.strip(),
        deskripsi=payload.deskripsi.strip() if payload.deskripsi else None,
        tautan_url=payload.tautan_url,
        gambar_url=payload.gambar_url,
        kategori=payload.kategori,
        nomor_dokumen=payload.nomor_dokumen.strip() if payload.nomor_dokumen else None,
        penerbit=payload.penerbit.strip() if payload.penerbit else None,
        tanggal_terbit=payload.tanggal_terbit,
        file_url=payload.file_url,
        status_verifikasi="draft",
        created_at=datetime.utcnow(),
    )
    db.add(item)
    db.flush()

    for sid in valid_skill_ids:
        db.add(PortfolioSkill(portfolio_id=item.portfolio_id, skill_id=sid))

    db.commit()
    db.refresh(item)

    return _serialize_detail(item)


# -------------------------------------------------------------------------
# 3. LIST PORTFOLIOS
# -------------------------------------------------------------------------
@router.get(
    "",
    response_model=List[Union[PortfolioDetailResponse, PortfolioPublicResponse]],
    summary="Daftar Portofolio (Milik Sendiri / Rekan / Publik)",
)
def list_portfolios(
    user_id: Optional[int] = Query(None, description="Filter ID mahasiswa"),
    kategori: Optional[str] = Query(None, description="Filter kategori (proyek, skpi, sertifikat, artikel_ilmiah)"),
    status_verifikasi: Optional[str] = Query(None, description="Filter status verifikasi"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_staff = current_user.role in ("moderator", "admin")

    query = db.query(PortfolioItem)

    # Exclude mutual blocked users
    if not is_staff:
        query = exclude_hidden(query, viewer_id=current_user.user_id, user_id_column=PortfolioItem.user_id)

    if user_id is not None:
        if not is_staff and is_target_blocking_viewer(db, viewer_id=current_user.user_id, target_id=user_id):
            return []
        query = query.filter(PortfolioItem.user_id == user_id)

    if kategori:
        query = query.filter(PortfolioItem.kategori == kategori)

    is_viewing_own = user_id == current_user.user_id

    # Non-staff viewing other students can ONLY see proyek or terverifikasi
    if not is_staff and not is_viewing_own:
        query = query.filter(
            (PortfolioItem.kategori == "proyek") | (PortfolioItem.status_verifikasi == "terverifikasi")
        )
    elif status_verifikasi:
        query = query.filter(PortfolioItem.status_verifikasi == status_verifikasi)

    items = (
        query.options(
            joinedload(PortfolioItem.user),
            selectinload(PortfolioItem.skills).joinedload(PortfolioSkill.skill),
        )
        .order_by(PortfolioItem.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for it in items:
        if it.user_id == current_user.user_id or current_user.role == "admin":
            results.append(_serialize_detail(it))
        elif current_user.role == "moderator" and it.user and can_moderate(current_user, it.user.jurusan):
            results.append(_serialize_detail(it))
        else:
            results.append(_serialize_public(it))

    return results


# -------------------------------------------------------------------------
# 4. GET SINGLE PORTFOLIO DETAIL
# -------------------------------------------------------------------------
@router.get(
    "/{id}",
    response_model=Union[PortfolioDetailResponse, PortfolioPublicResponse],
    summary="Ambil Detail Satu Portofolio",
)
def get_portfolio_item(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
    if not item:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    is_staff = current_user.role in ("moderator", "admin")
    if not is_staff and is_target_blocking_viewer(db, viewer_id=current_user.user_id, target_id=item.user_id):
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    if item.user_id == current_user.user_id or current_user.role == "admin":
        return _serialize_detail(item)

    if current_user.role == "moderator" and item.user and can_moderate(current_user, item.user.jurusan):
        return _serialize_detail(item)

    # For other students:
    if item.kategori == "proyek" or item.status_verifikasi == "terverifikasi":
        return _serialize_public(item)

    # Anti-leak: Draft/pending review of others return 404
    raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")


# -------------------------------------------------------------------------
# 5. EDIT PORTFOLIO (OWNER ONLY, DRAFT / DITOLAK ONLY)
# -------------------------------------------------------------------------
@router.patch(
    "/{id}",
    response_model=PortfolioDetailResponse,
    summary="Perbarui Portofolio (Hanya saat status draft atau ditolak)",
)
def update_portfolio_item(
    id: int,
    payload: PortfolioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
    if not item:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    if item.user_id != current_user.user_id:
        raise ForbiddenError(code="FORBIDDEN_OPERATION", detail="Hanya pemilik yang dapat mengubah portofolio ini.")

    # Status check
    if item.status_verifikasi == "menunggu_review":
        raise ConflictError(
            code="CANNOT_EDIT_UNDER_REVIEW",
            detail="Portofolio sedang dalam antrean review. Tarik pengajuan terlebih dahulu jika ingin mengubah berkas.",
        )
    if item.status_verifikasi == "terverifikasi":
        raise ConflictError(
            code="CANNOT_EDIT_VERIFIED",
            detail="Portofolio yang telah terverifikasi resmi tidak dapat diubah.",
        )

    data = payload.model_dump(exclude_unset=True)

    # If file_url is being updated
    if "file_url" in data and data["file_url"]:
        new_file = data["file_url"]
        if ".." in new_file or "//" in new_file or "\\" in new_file:
            raise InvalidInputError(code="INVALID_FILE_PATH", detail="Jalur berkas tidak valid.")
        if not new_file.startswith(f"{current_user.user_id}/"):
            raise InvalidInputError(
                code="INVALID_FILE_OWNERSHIP",
                detail="file_url harus berada dalam direktori pengguna Anda.",
            )
        if not storage_service.object_exists(settings.PORTFOLIO_DOCS_BUCKET, new_file):
            raise InvalidInputError(
                code="FILE_NOT_FOUND_IN_STORAGE",
                detail="Berkas dokumen bukti tidak ditemukan di penyimpanan privat.",
            )

    # If skill_ids are updated
    if "skill_ids" in data:
        skill_ids = data.pop("skill_ids")
        if skill_ids is not None:
            found_skills = db.query(Skill).filter(Skill.skill_id.in_(skill_ids)).all()
            found_ids = {s.skill_id for s in found_skills}
            missing_ids = set(skill_ids) - found_ids
            if missing_ids:
                raise InvalidInputError(
                    code="SKILL_NOT_FOUND",
                    detail=f"Satu atau lebih skill_id tidak ditemukan: {list(missing_ids)}",
                )
            # Replace skills
            db.query(PortfolioSkill).filter(PortfolioSkill.portfolio_id == id).delete()
            for sid in skill_ids:
                db.add(PortfolioSkill(portfolio_id=id, skill_id=sid))

    for field, val in data.items():
        setattr(item, field, val)

    db.commit()
    db.refresh(item)
    return _serialize_detail(item)


# -------------------------------------------------------------------------
# 6. DELETE PORTFOLIO (OWNER ONLY, DRAFT / DITOLAK ONLY)
# -------------------------------------------------------------------------
@router.delete(
    "/{id}",
    summary="Hapus Portofolio (Hanya saat status draft atau ditolak)",
)
def delete_portfolio_item(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
    if not item:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    if item.user_id != current_user.user_id:
        raise ForbiddenError(code="FORBIDDEN_OPERATION", detail="Hanya pemilik yang dapat menghapus portofolio ini.")

    if item.status_verifikasi == "menunggu_review":
        raise ConflictError(
            code="CANNOT_DELETE_UNDER_REVIEW",
            detail="Portofolio sedang dalam antrean review. Tarik pengajuan terlebih dahulu untuk menghapus.",
        )
    if item.status_verifikasi == "terverifikasi":
        raise ConflictError(
            code="CANNOT_DELETE_VERIFIED",
            detail="Portofolio yang telah terverifikasi resmi tidak dapat dihapus.",
        )

    db.delete(item)
    db.commit()
    return {"message": "Portofolio berhasil dihapus", "portfolio_id": id}


# -------------------------------------------------------------------------
# 7. SUBMIT PORTFOLIO FOR REVIEW
# -------------------------------------------------------------------------
@router.post(
    "/{id}/submit",
    response_model=PortfolioDetailResponse,
    summary="Ajukan Portofolio untuk Verifikasi SKPI oleh Kaprodi",
)
def submit_portfolio_for_review(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
    if not item:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    if item.user_id != current_user.user_id:
        raise ForbiddenError(code="FORBIDDEN_OPERATION", detail="Hanya pemilik yang dapat mengajukan portofolio ini.")

    if item.kategori == "proyek":
        raise InvalidInputError(
            code="PROJECT_CANNOT_BE_SUBMITTED_FOR_SKPI",
            detail="Kategori proyek merupakan karya mandiri publik dan tidak diajukan untuk verifikasi SKPI.",
        )

    if item.status_verifikasi == "menunggu_review":
        raise ConflictError(code="ALREADY_SUBMITTED", detail="Portofolio sudah berada dalam antrean review.")
    if item.status_verifikasi == "terverifikasi":
        raise ConflictError(code="ALREADY_VERIFIED", detail="Portofolio sudah berstatus terverifikasi.")

    # Re-validate mandatory fields per category
    if item.kategori in ("skpi", "sertifikat"):
        missing = []
        if not item.nomor_dokumen:
            missing.append("nomor_dokumen")
        if not item.penerbit:
            missing.append("penerbit")
        if not item.tanggal_terbit:
            missing.append("tanggal_terbit")
        if not item.file_url:
            missing.append("file_url")
        if missing:
            raise InvalidInputError(
                code="INCOMPLETE_DOCUMENT_FIELDS",
                detail=f"Field berikut wajib diisi untuk kategori {item.kategori}: {', '.join(missing)}.",
            )
    elif item.kategori == "artikel_ilmiah":
        missing = []
        if not item.nomor_dokumen:
            missing.append("nomor_dokumen (DOI)")
        if not item.penerbit:
            missing.append("penerbit (jurnal/konferensi)")
        if not item.tanggal_terbit:
            missing.append("tanggal_terbit")
        if not item.file_url:
            missing.append("file_url")
        if missing:
            raise InvalidInputError(
                code="INCOMPLETE_DOCUMENT_FIELDS",
                detail=f"Field berikut wajib diisi untuk artikel ilmiah: {', '.join(missing)}.",
            )

    item.status_verifikasi = "menunggu_review"
    item.submitted_at = datetime.utcnow()
    item.catatan_verifikasi = None
    item.diverifikasi_oleh = None
    item.verified_at = None

    db.commit()
    db.refresh(item)
    return _serialize_detail(item)


# -------------------------------------------------------------------------
# 8. WITHDRAW PORTFOLIO FROM QUEUE
# -------------------------------------------------------------------------
@router.post(
    "/{id}/withdraw",
    response_model=PortfolioDetailResponse,
    summary="Tarik Kembali Portofolio dari Antrean Review ke Draft",
)
def withdraw_portfolio_from_review(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Atomic conditional update
    stmt = (
        update(PortfolioItem)
        .where(
            PortfolioItem.portfolio_id == id,
            PortfolioItem.user_id == current_user.user_id,
            PortfolioItem.status_verifikasi == "menunggu_review",
        )
        .values(
            status_verifikasi="draft",
            submitted_at=None,
        )
    )
    result = db.execute(stmt)
    if result.rowcount == 0:
        item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
        if not item:
            raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")
        if item.user_id != current_user.user_id:
            raise ForbiddenError(code="FORBIDDEN_OPERATION", detail="Hanya pemilik yang dapat menarik portofolio ini.")
        raise ConflictError(
            code="CANNOT_WITHDRAW",
            detail=f"Portofolio dengan status '{item.status_verifikasi}' tidak dapat ditarik dari antrean.",
        )

    db.commit()
    item = (
        db.query(PortfolioItem)
        .options(
            joinedload(PortfolioItem.user),
            selectinload(PortfolioItem.skills).joinedload(PortfolioSkill.skill),
        )
        .filter(PortfolioItem.portfolio_id == id)
        .first()
    )
    return _serialize_detail(item)


# -------------------------------------------------------------------------
# 9. REVIEW PORTFOLIO (KAPRODI SE-PRODI & ADMIN, ATOMIC CONDITIONAL UPDATE)
# -------------------------------------------------------------------------
@router.patch(
    "/{id}/review",
    response_model=PortfolioDetailResponse,
    summary="Verifikasi atau Tolak Pengajuan Portofolio SKPI (Kaprodi & Admin)",
)
def review_portfolio_item(
    id: int,
    payload: PortfolioReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("moderator", "admin"):
        raise ForbiddenError(
            code="FORBIDDEN_OPERATION",
            detail="Hanya Kaprodi (Moderator) dan Administrator yang berhak meninjau portofolio.",
        )

    if current_user.role == "moderator" and not current_user.jurusan:
        raise ForbiddenError(
            code="MODERATOR_WITHOUT_DEPARTMENT",
            detail="Akun moderator tidak memiliki data jurusan resmi.",
        )

    # Initial check for proper HTTP status reporting
    target_item = (
        db.query(PortfolioItem)
        .join(User, PortfolioItem.user_id == User.user_id)
        .filter(PortfolioItem.portfolio_id == id)
        .first()
    )
    if not target_item:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    if current_user.role == "moderator" and not can_moderate(current_user, target_item.user.jurusan):
        raise ForbiddenError(
            code="FORBIDDEN_DEPARTMENT",
            detail="Anda hanya dapat meninjau portofolio mahasiswa dari program studi Anda.",
        )

    if target_item.status_verifikasi != "menunggu_review":
        raise ConflictError(
            code="ALREADY_REVIEWED",
            detail="Portofolio telah ditinjau atau ditarik sebelumnya.",
        )

    # Atomic conditional update against race conditions
    now = datetime.utcnow()
    stmt = (
        update(PortfolioItem)
        .where(
            PortfolioItem.portfolio_id == id,
            PortfolioItem.status_verifikasi == "menunggu_review",
        )
        .values(
            status_verifikasi=payload.status_verifikasi,
            catatan_verifikasi=payload.catatan_verifikasi.strip() if payload.catatan_verifikasi else None,
            diverifikasi_oleh=current_user.user_id,
            verified_at=now,
        )
    )
    result = db.execute(stmt)
    if result.rowcount == 0:
        db.rollback()
        raise ConflictError(
            code="ALREADY_REVIEWED",
            detail="Portofolio telah ditinjau secara bersamaan oleh peninjau lain.",
        )

    db.commit()
    try:
        if payload.status_verifikasi == "terverifikasi":
            create_notification(
                db,
                target_item.user_id,
                "skpi_terverifikasi",
                "Capaian SKPI Terverifikasi",
                f"Capaian '{target_item.judul}' telah diverifikasi oleh tim peninjau.",
                tautan="/portfolio",
                ref_type="portfolio",
                ref_id=target_item.portfolio_id,
            )
        elif payload.status_verifikasi == "ditolak":
            create_notification(
                db,
                target_item.user_id,
                "skpi_ditolak",
                "Pengajuan SKPI Ditolak",
                f"Pengajuan '{target_item.judul}' ditolak. Catatan: {payload.catatan_verifikasi or '-'}",
                tautan="/portfolio",
                ref_type="portfolio",
                ref_id=target_item.portfolio_id,
            )
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create notification for portfolio review: {e}")

    db.refresh(target_item)
    return _serialize_detail(target_item)


# -------------------------------------------------------------------------
# 10. REVOKE VERIFICATION (ADMIN ONLY)
# -------------------------------------------------------------------------
@router.post(
    "/{id}/revoke",
    response_model=PortfolioDetailResponse,
    summary="Cabut Status Verifikasi Portofolio Resmi (Admin Only)",
)
def revoke_portfolio_verification(
    id: int,
    payload: PortfolioRevokeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise ForbiddenError(
            code="ADMIN_ONLY",
            detail="Hanya administrator yang dapat mencabut status verifikasi portofolio.",
        )

    item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
    if not item:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Portofolio tidak ditemukan.")

    if item.status_verifikasi != "terverifikasi":
        raise ConflictError(
            code="NOT_VERIFIED",
            detail="Hanya portofolio yang berstatus terverifikasi yang dapat dicabut.",
        )

    item.status_verifikasi = "ditolak"
    item.catatan_verifikasi = f"[REVOKED by Admin {current_user.nama}]: {payload.alasan.strip()}"
    item.diverifikasi_oleh = current_user.user_id
    item.verified_at = datetime.utcnow()

    logger.info(
        f"[PORTFOLIO_REVOKE_AUDIT] Admin {current_user.user_id} revoked verification for portfolio {item.portfolio_id} of user {item.user_id}. Reason: {payload.alasan.strip()}"
    )

    db.commit()
    db.refresh(item)
    return _serialize_detail(item)


# -------------------------------------------------------------------------
# 11. GET SHORT-LIVED SIGNED URL FOR PRIVATE DOCUMENT (WITH AUDIT LOG & 404 ANTI-LEAK)
# -------------------------------------------------------------------------
@router.get(
    "/{id}/file",
    response_model=SignedUrlResponse,
    summary="Dapatkan Signed URL Berumur Pendek (120-300 detik) untuk Berkas Bukti Privat",
)
def get_portfolio_file_signed_url(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(PortfolioItem).filter(PortfolioItem.portfolio_id == id).first()
    if not item or not item.file_url:
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Dokumen portofolio tidak ditemukan.")

    is_staff = current_user.role in ("moderator", "admin")

    # Anti-leak mutual block
    if not is_staff and is_target_blocking_viewer(db, viewer_id=current_user.user_id, target_id=item.user_id):
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Dokumen portofolio tidak ditemukan.")

    # Authorization Check
    is_owner = item.user_id == current_user.user_id
    is_admin = current_user.role == "admin"
    is_authorized_moderator = (
        current_user.role == "moderator"
        and item.user is not None
        and can_moderate(current_user, item.user.jurusan)
        and item.status_verifikasi != "draft"
    )

    if not (is_owner or is_admin or is_authorized_moderator):
        # Anti-leak: Return 404 instead of 403 to prevent enumeration
        raise NotFoundError(code="PORTFOLIO_NOT_FOUND", detail="Dokumen portofolio tidak ditemukan.")

    # Re-validate file_url path isolation
    if ".." in item.file_url or not item.file_url.startswith(f"{item.user_id}/"):
        raise NotFoundError(code="INVALID_FILE_PATH", detail="Berkas tidak valid.")

    # Audit Trail for staff access to student private academic evidence
    if current_user.user_id != item.user_id:
        logger.info(
            f"[PORTFOLIO_AUDIT] Staff user_id={current_user.user_id} role={current_user.role} "
            f"accessed document '{item.file_url}' of student user_id={item.user_id} (portfolio_id={item.portfolio_id})"
        )

    signed_url = storage_service.get_signed_url(settings.PORTFOLIO_DOCS_BUCKET, item.file_url, ttl_seconds=300)

    return SignedUrlResponse(
        signed_url=signed_url,
        expires_in=300,
    )
