from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, Field


class SearchSkillItem(BaseModel):
    skill_id: int
    nama: str
    tipe: str = "skill"


class StudentSearchResult(BaseModel):
    user_id: int
    nama: str
    nim: str
    jurusan: Optional[str] = None
    angkatan: Optional[int] = None
    bio: Optional[str] = None
    kontak_url: Optional[str] = None
    skills: List[SearchSkillItem] = Field(default_factory=list)
    friendship_status: Optional[str] = None  # None, 'menunggu', 'diterima'
    created_at: datetime


class PostSearchResult(BaseModel):
    post_id: int
    user_id: int
    author_nama: str
    author_jurusan: Optional[str] = None
    isi: str
    gambar_url: Optional[str] = None
    tipe: str  # 'umum' / 'cari_anggota'
    skills: List[SearchSkillItem] = Field(default_factory=list)
    created_at: datetime


class PortfolioSearchResult(BaseModel):
    portfolio_id: int
    user_id: int
    author_nama: str
    author_jurusan: Optional[str] = None
    judul: str
    deskripsi: Optional[str] = None
    kategori: str
    tautan_url: Optional[str] = None
    gambar_url: Optional[str] = None
    status_verifikasi: str
    skills: List[SearchSkillItem] = Field(default_factory=list)
    created_at: datetime


class SearchResponse(BaseModel):
    total: int
    limit: int
    offset: int
    tipe: str
    items: Union[List[StudentSearchResult], List[PostSearchResult], List[PortfolioSearchResult]]
