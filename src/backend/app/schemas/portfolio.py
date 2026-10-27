from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, date

class PortfolioCreate(BaseModel):
    judul: str = Field(..., max_length=150)
    deskripsi: Optional[str] = None
    tautan_url: Optional[str] = None
    gambar_url: Optional[str] = None
    kategori: Literal["proyek", "skpi", "sertifikat", "artikel_ilmiah"] = Field("proyek", description="Jenis portofolio/capaian")
    nomor_dokumen: Optional[str] = Field(None, description="Nomor SKPI/Sertifikat/DOI")
    penerbit: Optional[str] = Field(None, description="Penerbit jurnal / penyelenggara kegiatan")
    tanggal_terbit: Optional[date] = None
    file_url: Optional[str] = Field(None, description="Tautan dokumen PDF bukti")
    skill_ids: List[int] = Field(default_factory=list, description="ID keahlian terkait")

class PortfolioReviewRequest(BaseModel):
    status_verifikasi: Literal["terverifikasi", "ditolak"]
    catatan_verifikasi: Optional[str] = Field(None, description="Catatan hasil verifikasi dari Kaprodi/Admin")

class PortfolioResponse(BaseModel):
    portfolio_id: int
    user_id: int
    judul: str
    deskripsi: Optional[str]
    tautan_url: Optional[str]
    gambar_url: Optional[str]
    kategori: str
    nomor_dokumen: Optional[str]
    penerbit: Optional[str]
    tanggal_terbit: Optional[date]
    file_url: Optional[str]
    status_verifikasi: str
    diverifikasi_oleh: Optional[int]
    catatan_verifikasi: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
