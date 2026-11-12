from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    notification_id: int
    user_id: int
    jenis: str
    judul: str
    isi: str
    tautan: Optional[str] = None
    ref_type: Optional[str] = None
    ref_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int = Field(..., ge=0, description="Jumlah notifikasi yang belum dibaca")


class ReadAllResponse(BaseModel):
    updated_count: int = Field(..., ge=0, description="Jumlah notifikasi yang ditandai sebagai dibaca")
