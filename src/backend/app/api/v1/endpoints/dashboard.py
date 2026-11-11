import logging

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenError
from app.core.security import get_current_user
from app.models.entities import (
    Friendship,
    Notification,
    PortfolioItem,
    Post,
    User,
)
from app.schemas.dashboard import (
    AdminDashboardSummary,
    DashboardSummaryResponse,
    ModeratorDashboardSummary,
    RecentPortfolioItemSummary,
    StudentDashboardSummary,
)
from app.services.queue_counts import get_staff_queue_counts
from app.services.skpi_calculator import calculate_skpi_summary

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Ringkasan Dashboard Beranda Terpadu Berdasarkan Peran (US-18, UC-04)",
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint agregasi terpadu untuk Dashboard Home (US-18).
    Menghitung seluruh ringkasan aktivitas dalam satu panggilan API efisien:
    - Mahasiswa: Poin SKPI, item portofolio, item perlu revisi, permohonan teman masuk, dan unread notifikasi.
    - Moderator (Kaprodi): Antrean review portofolio, antrean postingan, dan antrean laporan se-prodi.
    - Admin (Kemahasiswaan): Ringkasan metrik moderasi, review portofolio seluruh kampus, dan total mahasiswa.
    """
    if current_user.role not in ("mahasiswa", "moderator", "admin"):
        raise ForbiddenError(code="INVALID_ROLE", detail="Peran pengguna tidak dikenali.")

    if current_user.role == "mahasiswa":
        # 1. Portofolio & SKPI resmi
        portfolios = (
            db.query(PortfolioItem)
            .filter(PortfolioItem.user_id == current_user.user_id)
            .order_by(PortfolioItem.created_at.desc())
            .all()
        )
        skpi_calc = calculate_skpi_summary(portfolios)

        recent_verified = [
            RecentPortfolioItemSummary(
                portfolio_id=p.portfolio_id,
                judul=p.judul,
                kategori=p.kategori,
                created_at=p.created_at,
            )
            for p in portfolios
            if p.status_verifikasi == "terverifikasi"
        ][:3]

        # 2. Permohonan pertemanan masuk berstatus menunggu
        pending_friends = (
            db.query(func.count(Friendship.friendship_id))
            .filter(
                Friendship.addressee_id == current_user.user_id,
                Friendship.status == "menunggu",
            )
            .scalar()
            or 0
        )

        # 3. Notifikasi belum dibaca
        unread_notifs = (
            db.query(func.count(Notification.notification_id))
            .filter(
                Notification.user_id == current_user.user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .scalar()
            or 0
        )

        return DashboardSummaryResponse(
            summary=StudentDashboardSummary(
                role="mahasiswa",
                total_skpi_poin=skpi_calc["total_poin"],
                total_portofolio_terverifikasi=skpi_calc["total_terverifikasi"],
                total_portofolio_menunggu=skpi_calc["total_menunggu"],
                total_portofolio_perlu_revisi=skpi_calc["total_perlu_revisi"],
                pending_friend_requests=pending_friends,
                unread_notifications_count=unread_notifs,
                recent_verified_portfolios=recent_verified,
            )
        )

    elif current_user.role == "moderator":
        # Penanganan null-safe jika akun Kaprodi belum dikonfigurasi jurusannya
        if not current_user.jurusan:
            return DashboardSummaryResponse(
                summary=ModeratorDashboardSummary(
                    role="moderator",
                    jurusan=None,
                    is_jurusan_configured=False,
                    pending_portfolio_reviews=0,
                    pending_reports=0,
                    pending_posts=0,
                )
            )

        queue_counts = get_staff_queue_counts(db, current_user)

        return DashboardSummaryResponse(
            summary=ModeratorDashboardSummary(
                role="moderator",
                jurusan=current_user.jurusan,
                is_jurusan_configured=True,
                pending_portfolio_reviews=queue_counts["portofolio_menunggu"],
                pending_reports=queue_counts["laporan_baru"],
                pending_posts=queue_counts["post_menunggu"],
            )
        )

    else:  # role == "admin"
        queue_counts = get_staff_queue_counts(db, current_user)

        total_mhs = (
            db.query(func.count(User.user_id))
            .filter(User.role == "mahasiswa")
            .scalar()
            or 0
        )

        total_verified_port = (
            db.query(func.count(PortfolioItem.portfolio_id))
            .filter(PortfolioItem.status_verifikasi == "terverifikasi")
            .scalar()
            or 0
        )

        total_takedown = (
            db.query(func.count(Post.post_id))
            .filter(
                Post.status == "dihapus",
                Post.is_deleted == True,  # noqa: E712
            )
            .scalar()
            or 0
        )

        return DashboardSummaryResponse(
            summary=AdminDashboardSummary(
                role="admin",
                total_mahasiswa=total_mhs,
                total_portofolio_terverifikasi=total_verified_port,
                pending_portfolio_reviews=queue_counts["portofolio_menunggu"],
                pending_reports=queue_counts["laporan_baru"],
                pending_posts=queue_counts["post_menunggu"],
                total_takedown=total_takedown,
            )
        )
