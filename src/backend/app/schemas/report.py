from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ReportCreate(BaseModel):
    post_id: int
    alasan: str = Field(..., description="Penjelasan detail pelanggaran (minimal 5 karakter)")
    kategori_laporan: Literal[
        "spam", "konten_tidak_pantas", "ujaran_kebencian", "misinformasi", "plagiarisme", "lainnya"
    ] = Field("konten_tidak_pantas", description="Kategori pelanggaran")

    @field_validator("alasan")
    @classmethod
    def validate_alasan(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if len(cleaned) < 5:
            raise ValueError("Alasan pelaporan minimal 5 karakter.")
        if len(cleaned) > 1000:
            raise ValueError("Alasan pelaporan maksimal 1000 karakter.")
        return cleaned


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

    model_config = ConfigDict(from_attributes=True)
