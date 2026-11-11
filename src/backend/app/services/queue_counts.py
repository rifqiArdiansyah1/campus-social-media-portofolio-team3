import logging
from typing import Dict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import apply_moderation_scope
from app.models.entities import PortfolioItem, Post, Report, User

logger = logging.getLogger(__name__)


def get_staff_queue_counts(db: Session, current_user: User) -> Dict[str, int]:
    """
    Computes queue metrics for moderation and reviews with department scoping.
    Shared implementation across M08 (GET /moderation/summary) and M11 (GET /dashboard/summary).

    Metrics:
    - post_menunggu: Count of posts in 'menunggu_review' or 'direview' (and is_deleted=False)
    - laporan_baru: Count of distinct posts having active reports ('baru' or 'diproses')
    - portofolio_menunggu: Count of portfolio items in 'menunggu_review'
    """
    # 1. Post menunggu review
    post_q = (
        db.query(func.count(Post.post_id))
        .join(User, Post.user_id == User.user_id)
        .filter(
            Post.is_deleted == False,  # noqa: E712
            Post.status.in_(["menunggu_review", "direview"]),
        )
    )
    post_q = apply_moderation_scope(post_q, User, current_user)
    post_menunggu = post_q.scalar() or 0

    # 2. Laporan aktif (distinct posts with reports 'baru' or 'diproses')
    rep_q = (
        db.query(func.count(func.distinct(Report.post_id)))
        .join(Post, Report.post_id == Post.post_id)
        .join(User, Post.user_id == User.user_id)
        .filter(
            Post.is_deleted == False,  # noqa: E712
            Report.status.in_(["baru", "diproses"]),
        )
    )
    rep_q = apply_moderation_scope(rep_q, User, current_user)
    laporan_baru = rep_q.scalar() or 0

    # 3. Portofolio menunggu review
    port_q = (
        db.query(func.count(PortfolioItem.portfolio_id))
        .join(User, PortfolioItem.user_id == User.user_id)
        .filter(PortfolioItem.status_verifikasi == "menunggu_review")
    )
    port_q = apply_moderation_scope(port_q, User, current_user)
    portofolio_menunggu = port_q.scalar() or 0

    return {
        "post_menunggu": post_menunggu,
        "laporan_baru": laporan_baru,
        "portofolio_menunggu": portofolio_menunggu,
    }
