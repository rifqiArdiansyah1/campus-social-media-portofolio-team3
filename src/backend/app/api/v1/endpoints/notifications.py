from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Notification, User
from app.schemas.notification import (
    NotificationResponse,
    ReadAllResponse,
    UnreadCountResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[NotificationResponse],
    summary="Daftar Notifikasi Pengguna",
    description="Mengambil daftar riwayat notifikasi milik pengguna terautentikasi (terurut dari yang terbaru).",
)
def get_user_notifications(
    unread_only: bool = Query(False, description="Filter hanya notifikasi yang belum dibaca"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah data per halaman"),
    offset: int = Query(0, ge=0, description="Offset data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.user_id)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    return notifications


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Hitung Notifikasi Belum Dibaca",
    description="Mengembalikan jumlah notifikasi aktif pengguna yang belum dibaca.",
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/read-all",
    response_model=ReadAllResponse,
    summary="Tandai Semua Notifikasi Sudah Dibaca",
    description="Menandai semua notifikasi pengguna yang belum dibaca menjadi sudah dibaca.",
)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.user_id,
            Notification.is_read.is_(False),
        )
        .update({Notification.is_read: True}, synchronize_session=False)
    )
    db.commit()
    return ReadAllResponse(updated_count=updated)


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Tandai Satu Notifikasi Sudah Dibaca",
    description="Menandai satu notifikasi spesifik sebagai sudah dibaca (HTTP 404 anti-leak jika bukan pemilik).",
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == current_user.user_id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notifikasi tidak ditemukan.",
        )

    if not notif.is_read:
        notif.is_read = True
        db.commit()
        db.refresh(notif)

    return notif
