from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class ReportCreate(BaseModel):
    post_id: int
    alasan: str = Field(..., description="Penjelasan detail pelanggaran")
    kategori_laporan: Literal[
        "spam", "konten_tidak_pantas", "ujaran_kebencian", "misinformasi", "plagiarisme", "lainnya"
    ] = Field("konten_tidak_pantas", description="Kategori pelanggaran")

class ReportActionRequest(BaseModel):
    tindakan_diambil: Literal["postingan_dihapus", "peringatan", "laporan_ditolak", "sedang_investigasi"]
    catatan_tinjauan: Optional[str] = Field(None, description="Catatan tindakan moderator/admin")

class ReportResponse(BaseModel):
    report_id: int
    post_id: int
    pelapor_id: int
    alasan: str
    kategori_laporan: str
    status: str
    ditinjau_oleh: Optional[int]
    tindakan_diambil: Optional[str]
    catatan_tinjauan: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
