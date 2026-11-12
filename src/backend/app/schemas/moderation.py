from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ModerationRequest(BaseModel):
    post_id: str
    content: str
    user_id: Optional[str] = None


class ModerationResponse(BaseModel):
    post_id: str
    label: Literal["aman", "perlu_review", "berpotensi_melanggar"]
    categories: List[str] = Field(default_factory=list, description="Violation categories (e.g. ujaran_kasar, pelecehan, spam)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    explanation: str = Field(..., description="Explanation of classification")


class ModerationDecisionRequest(BaseModel):
    keputusan: Literal["setujui", "tolak", "minta_revisi", "hapus_konten"] = Field(
        ..., description="Keputusan manusia atas konten"
    )
    catatan: Optional[str] = Field(None, description="Catatan pertimbangan (wajib untuk tolak, minta_revisi, hapus_konten)")

    @field_validator("catatan")
    @classmethod
    def clean_catatan(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return None

    @model_validator(mode="after")
    def validate_catatan_for_rejection_or_revision(self) -> "ModerationDecisionRequest":
        if self.keputusan in ("tolak", "minta_revisi", "hapus_konten"):
            if not self.catatan or len(self.catatan) < 5:
                raise ValueError(
                    f"Catatan wajib diisi minimal 5 karakter untuk keputusan '{self.keputusan}'."
                )
        return self


class ModerationQueueItemResponse(BaseModel):
    post_id: int
    user_id: int
    author_name: str
    author_jurusan: Optional[str] = None
    isi: str
    gambar_url: Optional[str] = None
    tipe: str
    status: str
    created_at: datetime
    label_ai: Optional[str] = None
    kategori_ai: Optional[str] = None
    confidence: Optional[float] = None
    penjelasan_ai: Optional[str] = None
    jumlah_laporan_aktif: int = 0
    kategori_laporan: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ModerationSummaryResponse(BaseModel):
    post_menunggu: int
    laporan_baru: int
    portofolio_menunggu: int
