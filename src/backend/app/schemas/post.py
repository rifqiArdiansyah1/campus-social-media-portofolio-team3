from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

class PostCreate(BaseModel):
    isi: str = Field(..., description="Isi caption atau teks postingan")
    gambar_url: Optional[str] = Field(None, description="Tautan gambar/foto pendukung")
    tipe: Literal["umum", "cari_anggota"] = "umum"
    skill_ids: List[int] = Field(default_factory=list, description="Tag keahlian terkait")

class PostDeleteRequest(BaseModel):
    alasan_hapus: str = Field(..., description="Alasan penghapusan/takedown postingan oleh moderator/admin")

class PostResponse(BaseModel):
    post_id: int
    user_id: int
    isi: str
    gambar_url: Optional[str]
    tipe: str
    status: str
    is_deleted: bool
    created_at: datetime
