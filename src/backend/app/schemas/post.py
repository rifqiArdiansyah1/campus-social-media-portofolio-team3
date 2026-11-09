from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class PostAuthorResponse(BaseModel):
    user_id: int
    nama: str
    jurusan: Optional[str] = None
    angkatan: Optional[int] = None
    role: str


class PostSkillTagResponse(BaseModel):
    skill_id: int
    nama: str
    tipe: str


class PostCreate(BaseModel):
    isi: str = Field(..., description="Isi caption atau teks postingan")
    gambar_url: Optional[str] = Field(None, description="Tautan atau path foto pendukung dari bucket post-images")
    tipe: Literal["umum", "cari_anggota"] = "umum"
    skill_ids: List[int] = Field(default_factory=list, description="Daftar ID keahlian relevan (maksimal 10)")

    @field_validator("isi")
    @classmethod
    def validate_isi(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError("Konten postingan tidak boleh kosong.")
        if len(cleaned) > 2000:
            raise ValueError("Konten postingan maksimal 2000 karakter.")
        return cleaned

    @field_validator("skill_ids")
    @classmethod
    def validate_and_dedupe_skills(cls, v: List[int]) -> List[int]:
        deduped = list(dict.fromkeys(v))
        if len(deduped) > 10:
            raise ValueError("Maksimal hanya dapat memilih 10 tag keahlian.")
        return deduped

    @model_validator(mode="after")
    def validate_recruiting_requires_skills(self) -> "PostCreate":
        if self.tipe == "cari_anggota" and len(self.skill_ids) == 0:
            raise ValueError("Postingan rekrutmen tim wajib menyertakan minimal 1 tag keahlian.")
        return self


class PostUpdate(BaseModel):
    isi: Optional[str] = Field(None, description="Caption teks yang diperbarui")
    gambar_url: Optional[str] = Field(None, description="Path atau URL gambar baru")
    tipe: Optional[Literal["umum", "cari_anggota"]] = None
    skill_ids: Optional[List[int]] = None

    @field_validator("isi")
    @classmethod
    def validate_isi_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Konten postingan tidak boleh kosong.")
            if len(cleaned) > 2000:
                raise ValueError("Konten postingan maksimal 2000 karakter.")
            return cleaned
        return None

    @field_validator("skill_ids")
    @classmethod
    def validate_and_dedupe_skills_optional(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is not None:
            deduped = list(dict.fromkeys(v))
            if len(deduped) > 10:
                raise ValueError("Maksimal hanya dapat memilih 10 tag keahlian.")
            return deduped
        return None


class PostDeleteRequest(BaseModel):
    alasan_hapus: str = Field(..., description="Alasan penghapusan/takedown postingan oleh moderator/admin")


class PostTakedownRequest(BaseModel):
    alasan_hapus: str = Field(..., description="Alasan penegakan takedown oleh staf kampus (minimal 5 karakter)")

    @field_validator("alasan_hapus")
    @classmethod
    def validate_alasan(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if len(cleaned) < 5:
            raise ValueError("Alasan takedown minimal 5 karakter.")
        if len(cleaned) > 1000:
            raise ValueError("Alasan takedown maksimal 1000 karakter.")
        return cleaned


class PostRestoreRequest(BaseModel):
    alasan_pemulihan: str = Field(..., description="Alasan pemulihan takedown oleh Admin kampus (minimal 5 karakter)")

    @field_validator("alasan_pemulihan")
    @classmethod
    def validate_alasan(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if len(cleaned) < 5:
            raise ValueError("Alasan pemulihan minimal 5 karakter.")
        if len(cleaned) > 1000:
            raise ValueError("Alasan pemulihan maksimal 1000 karakter.")
        return cleaned


class PostResponse(BaseModel):
    post_id: int
    user_id: int
    isi: str
    gambar_url: Optional[str] = None
    tipe: str
    status: str
    is_deleted: bool
    created_at: datetime


class PostDetailResponse(BaseModel):
    post_id: int
    user_id: int
    author: PostAuthorResponse
    isi: str
    gambar_url: Optional[str] = None
    tipe: Literal["umum", "cari_anggota"]
    status: str
    is_deleted: bool
    created_at: datetime
    skills: List[PostSkillTagResponse] = []
    moderation_note: Optional[str] = None
    is_owner: bool = False
    can_takedown: bool = False
    can_report: bool = False
    can_edit: bool = False


class PostFeedResponse(BaseModel):
    items: List[PostDetailResponse]
    has_more: bool
    next_cursor: Optional[str] = Field(None, description="Opaque cursor string base4 untuk pagination keyset stabil")
