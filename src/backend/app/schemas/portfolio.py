import re
from datetime import date, datetime
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Regex for DOI: 10.xxxx/... or https://doi.org/10.xxxx/...
DOI_REGEX = re.compile(r"^(?:https?://(?:dx\.)?doi\.org/)?(10\.\d{4,9}/\S+)$", re.IGNORECASE)


def normalize_doi(doi: str) -> str:
    m = DOI_REGEX.match(doi.strip())
    if not m:
        raise ValueError("Format DOI tidak valid. Gunakan format '10.xxxx/...' atau 'https://doi.org/10.xxxx/...'.")
    return m.group(1)


def mask_document_number(doc_num: Optional[str]) -> Optional[str]:
    if not doc_num:
        return None
    s = doc_num.strip()
    if len(s) <= 4:
        return "***"
    return f"***{s[-4:]}"


class SkillBriefResponse(BaseModel):
    skill_id: int
    nama: str
    kategori: str

    model_config = ConfigDict(from_attributes=True)


class PortfolioAuthorResponse(BaseModel):
    user_id: int
    nama_lengkap: str
    nim: Optional[str] = None
    jurusan: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PortfolioCreate(BaseModel):
    judul: str = Field(..., min_length=3, max_length=150)
    deskripsi: Optional[str] = None
    tautan_url: Optional[str] = Field(None, max_length=255)
    gambar_url: Optional[str] = Field(None, max_length=255)
    kategori: Literal["proyek", "skpi", "sertifikat", "artikel_ilmiah"] = Field("proyek", description="Jenis portofolio/capaian")
    nomor_dokumen: Optional[str] = Field(None, max_length=100, description="Nomor SKPI/Sertifikat/DOI")
    penerbit: Optional[str] = Field(None, max_length=150, description="Penerbit jurnal / penyelenggara kegiatan")
    tanggal_terbit: Optional[date] = None
    file_url: Optional[str] = Field(None, max_length=255, description="Path berkas dokumen PDF bukti")
    skill_ids: List[int] = Field(default_factory=list, description="ID keahlian terkait (maksimal 10)")

    @field_validator("tautan_url")
    @classmethod
    def validate_tautan_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError("tautan_url harus menggunakan skema http:// atau https://")
        return v

    @field_validator("tanggal_terbit")
    @classmethod
    def validate_tanggal_terbit(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("tanggal_terbit tidak boleh berada di masa depan.")
        return v

    @field_validator("skill_ids")
    @classmethod
    def validate_skills(cls, v: List[int]) -> List[int]:
        deduped = list(dict.fromkeys(v))
        if len(deduped) > 10:
            raise ValueError("Maksimal 10 keahlian yang dapat dikaitkan dengan satu portofolio.")
        return deduped

    @model_validator(mode="after")
    def validate_kategori_fields(self):
        if self.kategori == "artikel_ilmiah" and self.nomor_dokumen:
            self.nomor_dokumen = normalize_doi(self.nomor_dokumen)
        return self


class PortfolioUpdate(BaseModel):
    judul: Optional[str] = Field(None, min_length=3, max_length=150)
    deskripsi: Optional[str] = None
    tautan_url: Optional[str] = Field(None, max_length=255)
    gambar_url: Optional[str] = Field(None, max_length=255)
    kategori: Optional[Literal["proyek", "skpi", "sertifikat", "artikel_ilmiah"]] = None
    nomor_dokumen: Optional[str] = Field(None, max_length=100)
    penerbit: Optional[str] = Field(None, max_length=150)
    tanggal_terbit: Optional[date] = None
    file_url: Optional[str] = Field(None, max_length=255)
    skill_ids: Optional[List[int]] = None

    @field_validator("tautan_url")
    @classmethod
    def validate_tautan_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError("tautan_url harus menggunakan skema http:// atau https://")
        return v

    @field_validator("tanggal_terbit")
    @classmethod
    def validate_tanggal_terbit(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("tanggal_terbit tidak boleh berada di masa depan.")
        return v

    @field_validator("skill_ids")
    @classmethod
    def validate_skills(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is not None:
            deduped = list(dict.fromkeys(v))
            if len(deduped) > 10:
                raise ValueError("Maksimal 10 keahlian yang dapat dikaitkan dengan satu portofolio.")
            return deduped
        return v

    @model_validator(mode="after")
    def validate_kategori_fields(self):
        if self.kategori == "artikel_ilmiah" and self.nomor_dokumen:
            self.nomor_dokumen = normalize_doi(self.nomor_dokumen)
        return self


class PortfolioReviewRequest(BaseModel):
    status_verifikasi: Literal["terverifikasi", "ditolak"]
    catatan_verifikasi: Optional[str] = Field(None, description="Catatan hasil verifikasi dari Kaprodi/Admin")

    @model_validator(mode="after")
    def validate_catatan(self):
        if self.status_verifikasi == "ditolak":
            if not self.catatan_verifikasi or len(self.catatan_verifikasi.strip()) < 5:
                raise ValueError("Catatan verifikasi wajib diisi minimal 5 karakter saat menolak pengajuan.")
        return self


class PortfolioRevokeRequest(BaseModel):
    alasan: str = Field(..., min_length=5, description="Alasan pencabutan verifikasi portofolio untuk audit trail")


class PortfolioDetailResponse(BaseModel):
    """Lengkap untuk Pemilik, Kaprodi se-prodi, dan Admin"""
    portfolio_id: int
    user_id: int
    judul: str
    deskripsi: Optional[str] = None
    tautan_url: Optional[str] = None
    gambar_url: Optional[str] = None
    kategori: str
    nomor_dokumen: Optional[str] = None
    penerbit: Optional[str] = None
    tanggal_terbit: Optional[date] = None
    file_url: Optional[str] = None
    has_file: bool = False
    status_verifikasi: str
    diverifikasi_oleh: Optional[int] = None
    catatan_verifikasi: Optional[str] = None
    verified_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    skills: List[SkillBriefResponse] = []
    author: Optional[PortfolioAuthorResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PortfolioPublicResponse(BaseModel):
    """Masked untuk pengguna lain / publik"""
    portfolio_id: int
    user_id: int
    judul: str
    deskripsi: Optional[str] = None
    tautan_url: Optional[str] = None
    gambar_url: Optional[str] = None
    kategori: str
    nomor_dokumen: Optional[str] = None  # Masked e.g. ***1234
    penerbit: Optional[str] = None
    tanggal_terbit: Optional[date] = None
    has_file: bool = False
    status_verifikasi: str
    created_at: datetime
    skills: List[SkillBriefResponse] = []
    author: Optional[PortfolioAuthorResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewQueueItemResponse(BaseModel):
    portfolio_id: int
    user_id: int
    judul: str
    deskripsi: Optional[str] = None
    kategori: str
    nomor_dokumen: Optional[str] = None
    penerbit: Optional[str] = None
    tanggal_terbit: Optional[date] = None
    file_url: Optional[str] = None
    has_file: bool = False
    status_verifikasi: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    author_nama: str
    author_nim: Optional[str] = None
    author_jurusan: Optional[str] = None
    author_avatar_url: Optional[str] = None
    is_duplicate_dokumen: bool = False
    skills: List[SkillBriefResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ReviewQueueListResponse(BaseModel):
    items: List[ReviewQueueItemResponse]
    total: int
    jurusan: Optional[str] = None


class SkpiSummaryResponse(BaseModel):
    user_id: int
    total_poin: int
    total_terverifikasi: int
    menunggu_review: Optional[int] = None
    jumlah_per_kategori: Dict[str, int]
    poin_per_kategori: Dict[str, int]
    items: List[PortfolioPublicResponse] = []


class SignedUrlResponse(BaseModel):
    signed_url: str
    expires_in: int
