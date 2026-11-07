import math
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.exceptions import (
    ConflictError,
    InvalidInputError,
    NotFoundError,
    RateLimitError,
)
from app.core.security import get_current_user
from app.models.entities import Friendship, User
from app.schemas.friendship import (
    FriendshipCreate,
    FriendshipDetailResponse,
    FriendshipListResponse,
    FriendshipResponse,
    FriendshipStatusUpdate,
    FriendUserSummary,
)
from app.services.visibility import (
    exclude_hidden,
    is_target_blocking_viewer,
    is_viewer_blocking_target,
)

router = APIRouter()


def get_system_now() -> datetime:
    """Injectable/mockable system time provider for deterministic testing."""
    return datetime.utcnow()


@router.post(
    "",
    response_model=FriendshipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Kirim Permohonan Pertemanan (US-13)",
)
def create_friendship_request(
    payload: FriendshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_id = payload.addressee_id
    viewer_id = current_user.user_id

    # 1. Self-friendship validation
    if viewer_id == target_id:
        raise InvalidInputError(
            code="CANNOT_FRIEND_SELF",
            detail="Tidak dapat mengirimkan permohonan pertemanan ke diri sendiri.",
        )

    # 2. Student role validation
    if current_user.role != "mahasiswa":
        raise InvalidInputError(
            code="STUDENT_ONLY",
            detail="Jejaring pertemanan hanya tersedia untuk mahasiswa.",
        )

    target_user = db.query(User).filter(User.user_id == target_id).first()
    if not target_user:
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan.")

    if target_user.role != "mahasiswa":
        raise InvalidInputError(
            code="STUDENT_ONLY",
            detail="Jejaring pertemanan hanya dapat dilakukan antar-sesama mahasiswa.",
        )

    # 3. Privacy & Block checks (Anti-Leak)
    if is_target_blocking_viewer(db, viewer_id=viewer_id, target_id=target_id):
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan.")

    if is_viewer_blocking_target(db, viewer_id=viewer_id, target_id=target_id):
        raise InvalidInputError(
            code="BLOCKED_USER",
            detail="Anda telah memblokir pengguna ini. Buka blokir terlebih dahulu untuk mengirim permohonan pertemanan.",
        )

    now = get_system_now()

    # 4. Check existing relationship pair using LEAST and GREATEST
    existing = (
        db.query(Friendship)
        .filter(
            func.least(Friendship.requester_id, Friendship.addressee_id)
            == min(viewer_id, target_id),
            func.greatest(Friendship.requester_id, Friendship.addressee_id)
            == max(viewer_id, target_id),
        )
        .first()
    )

    if existing:
        if existing.status == "diterima":
            raise ConflictError(
                code="ALREADY_FRIENDS",
                detail="Anda sudah berteman dengan pengguna ini.",
            )

        if existing.status == "menunggu":
            if existing.requester_id == viewer_id:
                raise ConflictError(
                    code="PENDING_REQUEST_EXISTS",
                    detail="Permohonan pertemanan sudah dikirimkan sebelumnya dan masih menunggu respon.",
                )
            else:
                raise ConflictError(
                    code="INCOMING_REQUEST_EXISTS",
                    detail="Pengguna ini telah mengirimkan permohonan pertemanan kepada Anda. Anda dapat langsung menerimanya.",
                    extra={"friendship_id": existing.friendship_id},
                )

        if existing.status == "ditolak":
            # Cooldown check: 24 hours
            ref_time = existing.updated_at or existing.created_at
            elapsed = (now - ref_time).total_seconds()
            if elapsed < 86400:
                remaining_seconds = max(1, int(86400 - elapsed))
                raise RateLimitError(
                    code="COOLDOWN_ACTIVE",
                    detail="Permohonan pertemanan ke pengguna ini belum dapat diajukan kembali saat ini. Harap menunggu masa tenggang.",
                    headers={"Retry-After": str(remaining_seconds)},
                )

            # Re-request after cooldown: update existing row
            existing.requester_id = viewer_id
            existing.addressee_id = target_id
            existing.status = "menunggu"
            existing.updated_at = now
            db.commit()
            db.refresh(existing)
            return existing

    # 5. Check pending outgoing requests quota limit (100)
    pending_count = (
        db.query(Friendship)
        .filter(
            Friendship.requester_id == viewer_id,
            Friendship.status == "menunggu",
        )
        .count()
    )
    if pending_count >= 100:
        raise RateLimitError(
            code="QUOTA_EXCEEDED",
            detail="Batas maksimal permohonan pertemanan tertunda (100) telah tercapai. Harap tunggu hingga permohonan sebelumnya direspon.",
        )

    # 6. Insert new friendship
    new_friendship = Friendship(
        requester_id=viewer_id,
        addressee_id=target_id,
        status="menunggu",
        created_at=now,
        updated_at=None,
    )
    try:
        db.add(new_friendship)
        db.commit()
        db.refresh(new_friendship)
        return new_friendship
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            code="DUPLICATE_REQUEST",
            detail="Permohonan pertemanan sedang diproses atau sudah ada.",
        )


@router.patch(
    "/{id}",
    response_model=FriendshipResponse,
    summary="Terima atau Tolak Permohonan Pertemanan (US-13)",
)
def update_friendship_status(
    id: int,
    payload: FriendshipStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    viewer_id = current_user.user_id

    # 1. Fetch friendship
    friendship = (
        db.query(Friendship).filter(Friendship.friendship_id == id).first()
    )
    if not friendship:
        raise NotFoundError(
            code="FRIENDSHIP_NOT_FOUND",
            detail="Permohonan pertemanan tidak ditemukan.",
        )

    # 2. Strict IDOR protection: only addressee can accept or reject
    if friendship.addressee_id != viewer_id:
        raise NotFoundError(
            code="FRIENDSHIP_NOT_FOUND",
            detail="Permohonan pertemanan tidak ditemukan.",
        )

    # 3. State transition check: only from 'menunggu'
    if friendship.status != "menunggu":
        raise ConflictError(
            code="INVALID_STATE",
            detail="Permohonan pertemanan sudah tidak dalam status menunggu.",
        )

    # 4. Check mutual blocking before accepting
    if payload.status == "diterima":
        if is_target_blocking_viewer(
            db, viewer_id, friendship.requester_id
        ) or is_viewer_blocking_target(db, viewer_id, friendship.requester_id):
            raise ConflictError(
                code="CANNOT_ACCEPT_BLOCKED",
                detail="Tidak dapat menerima pertemanan karena terdapat relasi pemblokiran aktif.",
            )

    now = get_system_now()

    # 5. Atomic conditional update
    rows_updated = (
        db.query(Friendship)
        .filter(
            Friendship.friendship_id == id,
            Friendship.addressee_id == viewer_id,
            Friendship.status == "menunggu",
        )
        .update(
            {Friendship.status: payload.status, Friendship.updated_at: now},
            synchronize_session=False,
        )
    )

    if rows_updated == 0:
        raise ConflictError(
            code="INVALID_STATE",
            detail="Permohonan pertemanan sudah tidak dalam status menunggu.",
        )

    db.commit()
    db.refresh(friendship)
    return friendship


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Batalkan Permintaan atau Putus Pertemanan (US-13 / FR-06)",
)
def delete_friendship(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    viewer_id = current_user.user_id

    friendship = (
        db.query(Friendship).filter(Friendship.friendship_id == id).first()
    )
    if not friendship:
        raise NotFoundError(
            code="FRIENDSHIP_NOT_FOUND",
            detail="Permohonan pertemanan tidak ditemukan.",
        )

    # Anti-IDOR: only requester or addressee can delete
    if viewer_id not in (friendship.requester_id, friendship.addressee_id):
        raise NotFoundError(
            code="FRIENDSHIP_NOT_FOUND",
            detail="Permohonan pertemanan tidak ditemukan.",
        )

    if friendship.status == "menunggu":
        if viewer_id == friendship.addressee_id:
            raise InvalidInputError(
                code="USE_PATCH_TO_REJECT",
                detail="Penerima permohonan harus menolak permohonan melalui PATCH, bukan menghapus.",
            )
        # Requester cancels pending request
        db.delete(friendship)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    elif friendship.status == "diterima":
        # Either party unfriends
        db.delete(friendship)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    else:
        # 'ditolak' records cannot be manually deleted by users
        raise NotFoundError(
            code="FRIENDSHIP_NOT_FOUND",
            detail="Permohonan pertemanan tidak ditemukan.",
        )


@router.get(
    "",
    response_model=FriendshipListResponse,
    summary="Ambil Daftar Permohonan Pertemanan Masuk / Keluar (US-13)",
)
def list_friendship_requests(
    direction: Literal["incoming", "outgoing"] = Query(
        "incoming", description="Arah permohonan: incoming (masuk) atau outgoing (keluar)"
    ),
    page: int = Query(1, ge=1, description="Nomor halaman"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah item per halaman"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    viewer_id = current_user.user_id

    query = db.query(Friendship)

    if direction == "incoming":
        # Incoming pending requests
        query = (
            query.options(joinedload(Friendship.requester))
            .filter(
                Friendship.addressee_id == viewer_id,
                Friendship.status == "menunggu",
            )
        )
        # Exclude blocked counterparts
        query = exclude_hidden(query, viewer_id, Friendship.requester_id)
        query = query.order_by(Friendship.created_at.desc())
    else:
        # Outgoing pending requests (never display 'ditolak' to sender)
        query = (
            query.options(joinedload(Friendship.addressee))
            .filter(
                Friendship.requester_id == viewer_id,
                Friendship.status == "menunggu",
            )
        )
        query = exclude_hidden(query, viewer_id, Friendship.addressee_id)
        query = query.order_by(Friendship.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    result_items = []
    for item in items:
        counterpart_user = (
            item.requester if direction == "incoming" else item.addressee
        )
        summary = FriendUserSummary(
            user_id=counterpart_user.user_id,
            nama=counterpart_user.nama,
            jurusan=counterpart_user.jurusan,
            angkatan=counterpart_user.angkatan,
            role=counterpart_user.role,
            avatar_url=None,
        )
        result_items.append(
            FriendshipDetailResponse(
                friendship_id=item.friendship_id,
                requester_id=item.requester_id,
                addressee_id=item.addressee_id,
                status=item.status,
                created_at=item.created_at,
                updated_at=item.updated_at,
                counterpart=summary,
            )
        )

    total_pages = math.ceil(total / limit) if total > 0 else 1
    return FriendshipListResponse(
        items=result_items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )
