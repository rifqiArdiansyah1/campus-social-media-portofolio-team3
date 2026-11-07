import math
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Friendship, User
from app.schemas.friendship import FriendListResponse, FriendUserSummary
from app.services.visibility import exclude_hidden

router = APIRouter()


@router.get(
    "",
    response_model=FriendListResponse,
    summary="Ambil Daftar Teman Aktif Mahasiswa (US-13)",
)
def list_active_friends(
    q: Optional[str] = Query(None, description="Pencarian nama atau jurusan teman"),
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah item per halaman"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    viewer_id = current_user.user_id

    # Join User with Friendship where friendship is accepted
    friendship_cond = or_(
        and_(
            Friendship.requester_id == viewer_id,
            Friendship.addressee_id == User.user_id,
        ),
        and_(
            Friendship.addressee_id == viewer_id,
            Friendship.requester_id == User.user_id,
        ),
    )

    query = (
        db.query(User)
        .join(Friendship, friendship_cond)
        .filter(Friendship.status == "diterima")
    )

    # Exclude blocked counterparts
    query = exclude_hidden(query, viewer_id, User.user_id)

    # Search filter with escaped SQL LIKE characters
    if q:
        cleaned_q = q.strip()
        if cleaned_q:
            escaped_q = cleaned_q.replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped_q}%"
            query = query.filter(
                or_(
                    User.nama.ilike(pattern),
                    User.jurusan.ilike(pattern),
                )
            )

    total = query.count()
    users = (
        query.order_by(User.nama.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = [
        FriendUserSummary(
            user_id=u.user_id,
            nama=u.nama,
            jurusan=u.jurusan,
            angkatan=u.angkatan,
            role=u.role,
            avatar_url=None,
        )
        for u in users
    ]

    total_pages = math.ceil(total / limit) if total > 0 else 1
    return FriendListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
