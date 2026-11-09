from datetime import datetime, timedelta
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.exceptions import (
    ConflictError,
    ForbiddenError,
    InvalidInputError,
    NotFoundError,
    RateLimitError,
)
from app.core.security import apply_moderation_scope, can_moderate, get_current_user, require_roles
from app.models.entities import Post, Report, User
from app.schemas.report import ReportActionRequest, ReportCreate, ReportResponse
from app.services.notification import create_notification
from app.services.visibility import is_target_blocking_viewer, is_viewer_blocking_target

router = APIRouter()


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Laporkan Postingan Melanggar (Mahasiswa)",
)
def create_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Fetch target post with locking
    post = (
        db.query(Post)
        .filter(Post.post_id == payload.post_id)
        .with_for_update()
        .first()
    )

    # Anti-leak / Anti-enumeration: Return 404 for deleted, draft, or nonexistent post
    if not post or post.is_deleted or post.status in ("draft", "dihapus"):
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    # Mutual block check (anti-leak)
    if is_target_blocking_viewer(db, current_user.user_id, post.user_id) or is_viewer_blocking_target(
        db, current_user.user_id, post.user_id
    ):
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    # 2. Anti-self-report guard
    if post.user_id == current_user.user_id:
        raise InvalidInputError(
            code="SELF_REPORT_NOT_ALLOWED",
            detail="Anda tidak dapat melaporkan postingan milik sendiri.",
        )

    # 3. Rate limiting (max 20 reports per user per 24 hours)
    since_24h = datetime.utcnow() - timedelta(hours=24)
    daily_count = (
        db.query(func.count(Report.report_id))
        .filter(
            Report.pelapor_id == current_user.user_id,
            Report.created_at >= since_24h,
        )
        .scalar()
        or 0
    )
    if daily_count >= 20:
        raise RateLimitError(
            code="REPORT_RATE_LIMIT_EXCEEDED",
            detail="Batas pelaporan maksimal 20 laporan per 24 jam tercapai. Silakan coba lagi nanti.",
        )

    # 4. Anti-duplicate active report check
    existing_report = (
        db.query(Report)
        .filter(
            Report.post_id == payload.post_id,
            Report.pelapor_id == current_user.user_id,
            Report.status.in_(["baru", "diproses"]),
        )
        .first()
    )
    if existing_report:
        raise ConflictError(
            code="DUPLICATE_ACTIVE_REPORT",
            detail="Anda sudah memiliki laporan aktif untuk postingan ini yang sedang menunggu tinjauan.",
        )

    # 5. Shift post status to 'direview' if currently 'tayang'
    if post.status == "tayang":
        post.status = "direview"

    # 6. Save report
    new_report = Report(
        post_id=post.post_id,
        pelapor_id=current_user.user_id,
        alasan=payload.alasan,
        kategori_laporan=payload.kategori_laporan,
        status="baru",
    )
    db.add(new_report)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            code="DUPLICATE_ACTIVE_REPORT",
            detail="Anda sudah memiliki laporan aktif untuk postingan ini yang sedang menunggu tinjauan.",
        )

    db.refresh(new_report)

    return ReportResponse(
        report_id=new_report.report_id,
        post_id=new_report.post_id,
        pelapor_id=new_report.pelapor_id,
        pelapor_nama=current_user.nama,
        post_isi_snippet=post.isi[:100],
        alasan=new_report.alasan,
        kategori_laporan=new_report.kategori_laporan,
        status=new_report.status,
        ditinjau_oleh=new_report.ditinjau_oleh,
        tindakan_diambil=new_report.tindakan_diambil,
        catatan_tinjauan=new_report.catatan_tinjauan,
        created_at=new_report.created_at,
        resolved_at=new_report.resolved_at,
    )


@router.get(
    "",
    response_model=List[ReportResponse],
    summary="Daftar Antrean Laporan Pelanggaran (Kaprodi Se-Prodi & Admin)",
)
def get_reports(
    status_filter: Optional[Literal["baru", "diproses", "selesai", "diabaikan"]] = Query(
        None, alias="status", description="Filter berdasarkan status laporan"
    ),
    limit: int = Query(20, ge=1, le=50, description="Jumlah data per halaman (maksimal 50)"),
    offset: int = Query(0, ge=0, description="Offset pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("moderator", "admin")),
):
    query = (
        db.query(Report)
        .join(Post, Report.post_id == Post.post_id)
        .join(User, Post.user_id == User.user_id)
        .options(
            joinedload(Report.post).joinedload(Post.user),
            joinedload(Report.reporter),
        )
    )

    # Scoping by jurusan
    query = apply_moderation_scope(query, User, current_user)

    if status_filter:
        query = query.filter(Report.status == status_filter)

    reports = (
        query.order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    results = []
    for r in reports:
        pelapor_nama = r.reporter.nama if r.reporter else None
        post_snippet = r.post.isi[:100] if r.post else None
        results.append(
            ReportResponse(
                report_id=r.report_id,
                post_id=r.post_id,
                pelapor_id=r.pelapor_id,
                pelapor_nama=pelapor_nama,
                post_isi_snippet=post_snippet,
                alasan=r.alasan,
                kategori_laporan=r.kategori_laporan,
                status=r.status,
                ditinjau_oleh=r.ditinjau_oleh,
                tindakan_diambil=r.tindakan_diambil,
                catatan_tinjauan=r.catatan_tinjauan,
                created_at=r.created_at,
                resolved_at=r.resolved_at,
            )
        )

    return results


@router.patch(
    "/{id}",
    response_model=ReportResponse,
    summary="Tindak Lanjut Laporan Individu (Kaprodi Se-Prodi & Admin)",
)
def update_report_action(
    id: int,
    payload: ReportActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("moderator", "admin")),
):
    report = (
        db.query(Report)
                .filter(Report.report_id == id)
        .with_for_update()
        .first()
    )

    if not report:
        raise NotFoundError(code="REPORT_NOT_FOUND", detail="Laporan tidak ditemukan.")

    post_author_jurusan = (
        report.post.user.jurusan if (report.post and report.post.user) else None
    )
    if not can_moderate(current_user, post_author_jurusan):
        raise ForbiddenError(
            code="FORBIDDEN_MODERATION",
            detail="Anda tidak memiliki izin memoderasi laporan dari program studi ini.",
        )

    now = datetime.utcnow()
    report.status = payload.status
    report.tindakan_diambil = payload.tindakan_diambil
    report.catatan_tinjauan = payload.catatan_tinjauan
    report.ditinjau_oleh = current_user.user_id

    if payload.status in ("selesai", "diabaikan"):
        report.resolved_at = now
        jenis_notif = "laporan_selesai" if payload.status == "selesai" else "laporan_diabaikan"
        isi_notif = (
            "Laporan Anda terhadap sebuah postingan telah ditinjau oleh tim moderasi kampus. "
            "Terima kasih telah berpartisipasi menjaga kenyamanan komunitas CampusFolio."
        )
        create_notification(
            db=db,
            user_id=report.pelapor_id,
            jenis=jenis_notif,
            judul="Laporan Selesai Ditinjau",
            isi=isi_notif,
            ref_type="report",
            ref_id=report.report_id,
        )
    else:
        report.resolved_at = None

    db.commit()
    db.refresh(report)

    pelapor_nama = report.reporter.nama if report.reporter else None
    post_snippet = report.post.isi[:100] if report.post else None

    return ReportResponse(
        report_id=report.report_id,
        post_id=report.post_id,
        pelapor_id=report.pelapor_id,
        pelapor_nama=pelapor_nama,
        post_isi_snippet=post_snippet,
        alasan=report.alasan,
        kategori_laporan=report.kategori_laporan,
        status=report.status,
        ditinjau_oleh=report.ditinjau_oleh,
        tindakan_diambil=report.tindakan_diambil,
        catatan_tinjauan=report.catatan_tinjauan,
        created_at=report.created_at,
        resolved_at=report.resolved_at,
    )
