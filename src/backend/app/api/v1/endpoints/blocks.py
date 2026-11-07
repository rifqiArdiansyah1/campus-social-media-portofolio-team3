import math

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import InvalidInputError, NotFoundError
from app.core.security import get_current_user
from app.models.entities import Friendship, User, UserBlock
from app.schemas.friendship import (
    BlockedListResponse,
    BlockedUserSummary,
    UserBlockRequest,
    UserBlockResponse,
)

router = APIRouter()


@router.post(
    "",
    response_model=UserBlockResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Blokir Profil Pengguna (US-14 / FR-07)",
)
def block_user(
    payload: UserBlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocker_id = current_user.user_id
    blocked_id = payload.blocked_id

    # 1. Self block validation
    if blocker_id == blocked_id:
        raise InvalidInputError(
            code="CANNOT_BLOCK_SELF",
            detail="Tidak dapat memblokir profil sendiri.",
        )

    # 2. Target user existence check
    target_user = db.query(User).filter(User.user_id == blocked_id).first()
    if not target_user:
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan.")

    # 3. Staff immunity: students cannot block Kaprodi (moderator) or Admin
    if target_user.role in ("moderator", "admin"):
        raise InvalidInputError(
            code="CANNOT_BLOCK_STAFF",
            detail="Akun staf pengajar (Kaprodi) atau administrator universitas tidak dapat diblokir demi kelancaran pengawasan dan verifikasi.",
        )

    # 4. Idempotency: Check if already blocked
    existing = (
        db.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_id == blocked_id,
        )
        .first()
    )
    if existing:
        return existing

    # 5. Atomic single-transaction block creation & friendship severance
    new_block = UserBlock(
        blocker_id=blocker_id,
        blocked_id=blocked_id,
        alasan=payload.alasan,
    )
    db.add(new_block)

    # Delete any friendship or pending request in both directions
    db.query(Friendship).filter(
        or_(
            and_(
                Friendship.requester_id == blocker_id,
                Friendship.addressee_id == blocked_id,
            ),
            and_(
                Friendship.requester_id == blocked_id,
                Friendship.addressee_id == blocker_id,
            ),
        )
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(new_block)
    return new_block


@router.delete(
    "/{blocked_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Buka Blokir Pengguna (US-14)",
)
def unblock_user(
    blocked_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocker_id = current_user.user_id

    block_record = (
        db.query(UserBlock)
        .filter(
            UserBlock.blocker_id == blocker_id,
            UserBlock.blocked_id == blocked_id,
        )
        .first()
    )
    if not block_record:
        raise NotFoundError(
            code="BLOCK_NOT_FOUND",
            detail="Pengguna ini tidak sedang berada dalam daftar blokir Anda.",
        )

    db.delete(block_record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "",
    response_model=BlockedListResponse,
    summary="Ambil Daftar Pengguna yang Diblokir (US-14)",
)
def list_blocked_users(
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah item per halaman"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blocker_id = current_user.user_id

    query = (
        db.query(UserBlock, User)
        .join(User, UserBlock.blocked_id == User.user_id)
        .filter(UserBlock.blocker_id == blocker_id)
        .order_by(UserBlock.created_at.desc())
    )

    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()

    items = [
        BlockedUserSummary(
            block_id=ub.block_id,
            blocked_id=ub.blocked_id,
            nama=u.nama,
            jurusan=u.jurusan,
            angkatan=u.angkatan,
            alasan=ub.alasan,
            created_at=ub.created_at,
        )
        for ub, u in rows
    ]

    total_pages = math.ceil(total / limit) if total > 0 else 1
    return BlockedListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
