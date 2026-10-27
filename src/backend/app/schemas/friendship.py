from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

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

class UserBlockRequest(BaseModel):
    blocked_id: int = Field(..., description="User ID yang ingin diblokir")
    alasan: Optional[str] = Field(None, description="Alasan pemblokiran (opsional)")

class UserBlockResponse(BaseModel):
    block_id: int
    blocker_id: int
    blocked_id: int
    alasan: Optional[str]
    created_at: datetime
