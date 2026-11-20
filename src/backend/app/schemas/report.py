from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


CATEGORY_DEFAULT_REASONS = {
    "konten_tidak_pantas": "Laporan Konten Tidak Pantas / Vulgar",
    "spam": "Laporan Spam / Promosi Ilegal",
    "ujaran_kebencian": "Laporan Pelecehan / Ujaran Kebencian",
    "misinformasi": "Laporan Misinformasi / Berita Menyesatkan",
    "plagiarisme": "Laporan Plagiarisme / Pelanggaran Hak Cipta",
    "lainnya": "Laporan Pelanggaran Etika Lainnya",
}


class ReportCreate(BaseModel):
    post_id: int
    alasan: Optional[str] = Field(None, description="Penjelasan detail pelanggaran (opsional kecuali kategori lainnya)")
    kategori_laporan: Literal[
        "spam", "konten_tidak_pantas", "ujaran_kebencian", "misinformasi", "plagiarisme", "lainnya"
    ] = Field("konten_tidak_pantas", description="Kategori pelanggaran")

    @model_validator(mode="after")
    def validate_alasan_and_category(self) -> "ReportCreate":
        cleaned = (self.alasan or "").strip()
        if self.kategori_laporan == "lainnya":
            if len(cleaned) < 5:
                raise ValueError("Untuk kategori 'lainnya', alasan wajib diisi minimal 5 karakter.")
            if len(cleaned) > 1000:
                raise ValueError("Alasan pelaporan maksimal 1000 karakter.")
            self.alasan = cleaned
        else:
            if not cleaned:
                self.alasan = CATEGORY_DEFAULT_REASONS.get(self.kategori_laporan, "Laporan Pelanggaran Konten")
            else:
                if len(cleaned) > 1000:
                    raise ValueError("Alasan pelaporan maksimal 1000 karakter.")
                self.alasan = cleaned
        return self


class ReportActionRequest(BaseModel):
    status: Literal["diproses", "selesai", "diabaikan"] = Field(..., description="Status baru laporan")
    tindakan_diambil: Optional[
        Literal["postingan_dihapus", "peringatan", "laporan_ditolak", "sedang_investigasi"]
    ] = Field(None, description="Tindakan yang diambil")
    catatan_tinjauan: Optional[str] = Field(None, description="Catatan tindakan moderator/admin")

    @field_validator("catatan_tinjauan")
    @classmethod
    def validate_catatan(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 5:
                raise ValueError("Catatan tinjauan minimal 5 karakter.")
            return cleaned
        return None

    @model_validator(mode="after")
    def validate_status_and_tindakan(self) -> "ReportActionRequest":
        if self.status == "diabaikan":
            if self.tindakan_diambil is None:
                self.tindakan_diambil = "laporan_ditolak"
            elif self.tindakan_diambil != "laporan_ditolak":
                raise ValueError("Untuk status 'diabaikan', tindakan_diambil harus 'laporan_ditolak'.")
        elif self.status == "selesai":
            if self.tindakan_diambil not in ("postingan_dihapus", "peringatan"):
                raise ValueError("Untuk status 'selesai', tindakan_diambil harus 'postingan_dihapus' atau 'peringatan'.")
        elif self.status == "diproses":
            if self.tindakan_diambil is None:
                self.tindakan_diambil = "sedang_investigasi"
            elif self.tindakan_diambil != "sedang_investigasi":
                raise ValueError("Untuk status 'diproses', tindakan_diambil harus 'sedang_investigasi'.")
        return self


class ReportedPostAuthor(BaseModel):
    user_id: int
    nama: str
    nim: Optional[str] = None
    jurusan: Optional[str] = None
    role: str

    model_config = ConfigDict(from_attributes=True)


class ReportedPostBrief(BaseModel):
    post_id: int
    isi: str
    gambar_url: Optional[str] = None
    tipe: str
    status: str
    created_at: datetime
    author: Optional[ReportedPostAuthor] = None

    model_config = ConfigDict(from_attributes=True)


class ReportResponse(BaseModel):
    report_id: int
    post_id: int
    pelapor_id: int
    pelapor_nama: Optional[str] = None
    post_isi_snippet: Optional[str] = None
    alasan: str
    kategori_laporan: str
    status: str
    ditinjau_oleh: Optional[int] = None
    tindakan_diambil: Optional[str] = None
    catatan_tinjauan: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    post: Optional[ReportedPostBrief] = None

    model_config = ConfigDict(from_attributes=True)
