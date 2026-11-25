from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class FriendUserSummary(BaseModel):
    user_id: int
    nama: str
    jurusan: Optional[str] = None
    angkatan: Optional[int] = None
    role: str
    avatar_url: Optional[str] = None
    friendship_id: Optional[int] = None


class FriendshipCreate(BaseModel):
    addressee_id: int = Field(..., description="User ID calon teman yang dituju")


class FriendshipStatusUpdate(BaseModel):
    status: Literal["diterima", "ditolak"] = Field(..., description="Keputusan penerimaan pertemanan")


class FriendshipResponse(BaseModel):
    friendship_id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class FriendshipDetailResponse(BaseModel):
    friendship_id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    counterpart: FriendUserSummary


class FriendshipListResponse(BaseModel):
    items: list[FriendshipDetailResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class FriendListResponse(BaseModel):
    items: list[FriendUserSummary]
    total: int
    page: int
    limit: int
    total_pages: int


class UserBlockRequest(BaseModel):
    blocked_id: int = Field(..., description="User ID yang ingin diblokir")
    alasan: Optional[str] = Field(None, max_length=500, description="Alasan pemblokiran (opsional, maks 500 karakter)")

    @model_validator(mode="before")
    @classmethod
    def normalize_block_payload(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "blocked_id" not in data or data["blocked_id"] is None:
                for alt in ("blocked_user_id", "user_id", "target_user_id"):
                    if alt in data and data[alt] is not None:
                        data["blocked_id"] = data[alt]
                        break
            if "blocked_id" in data and isinstance(data["blocked_id"], str) and data["blocked_id"].isdigit():
                data["blocked_id"] = int(data["blocked_id"])
            if "alasan" in data and isinstance(data["alasan"], str):
                data["alasan"] = data["alasan"].strip() or None
        return data


class UserBlockResponse(BaseModel):
    block_id: int
    blocker_id: int
    blocked_id: int
    alasan: Optional[str]
    created_at: datetime


class BlockedUserSummary(BaseModel):
    block_id: int
    blocked_id: int
    nama: str
    jurusan: Optional[str] = None
    angkatan: Optional[int] = None
    alasan: Optional[str] = None
    created_at: datetime


class BlockedListResponse(BaseModel):
    items: list[BlockedUserSummary]
    total: int
    page: int
    limit: int
    total_pages: int
