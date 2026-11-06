import re
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator, model_validator

# Regex for allowed skill custom names: letters, numbers, spaces, and common tech symbols
SKILL_NAME_REGEX = re.compile(r"^[a-zA-Z0-9\s\+\#\.\-\/]+$")


class SkillResponse(BaseModel):
    skill_id: int
    nama: str
    tipe: str

    model_config = ConfigDict(from_attributes=True)


class UserSkillItem(BaseModel):
    skill_id: Optional[int] = Field(default=None, description="ID skill master jika sudah ada")
    nama: Optional[str] = Field(default=None, max_length=60, description="Nama keahlian atau minat kustom")
    tipe: Literal["skill", "minat"] = Field(default="skill", description="Tipe tag: 'skill' atau 'minat'")
    level: Literal["pemula", "menengah", "mahir"] = Field(default="pemula", description="Tingkat kemahiran")

    @field_validator("nama")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = " ".join(v.split()).strip()
        if len(cleaned) < 2:
            raise ValueError("Nama keahlian minimal 2 karakter")
        if len(cleaned) > 60:
            raise ValueError("Nama keahlian maksimal 60 karakter")
        if not SKILL_NAME_REGEX.match(cleaned):
            raise ValueError(
                f"Nama keahlian '{cleaned}' memuat karakter tidak valid. Hanya huruf, angka, spasi, dan simbol (+, #, ., -, /) yang diizinkan."
            )
        return cleaned

    @model_validator(mode="after")
    def check_identifier(self) -> "UserSkillItem":
        if self.skill_id is None and not self.nama:
            raise ValueError("Setiap item keahlian wajib menyertakan 'skill_id' atau 'nama'")
        return self


class UpdateUserSkillsRequest(BaseModel):
    items: List[UserSkillItem] = Field(
        ...,
        max_length=20,
        description="Daftar keahlian & minat maksimal 20 item total per pengguna",
    )

    @field_validator("items")
    @classmethod
    def validate_unique_items(cls, items: List[UserSkillItem]) -> List[UserSkillItem]:
        if len(items) > 20:
            raise ValueError("Maksimal 20 keahlian dan minat yang dapat disimpan per mahasiswa")

        seen_ids = set()
        seen_names = set()

        for item in items:
            if item.skill_id is not None:
                if item.skill_id in seen_ids:
                    raise ValueError(f"Skill dengan ID {item.skill_id} duplikat dalam permintaan")
                seen_ids.add(item.skill_id)

            if item.nama:
                norm_name = item.nama.lower()
                if norm_name in seen_names:
                    raise ValueError(f"Keahlian '{item.nama}' duplikat dalam permintaan")
                seen_names.add(norm_name)

        return items


class UserSkillResponse(BaseModel):
    skill_id: int
    nama: str
    tipe: str
    level: str

    model_config = ConfigDict(from_attributes=True)


class UpdateProfileRequest(BaseModel):
    nama: Optional[str] = Field(None, min_length=1, max_length=100, description="Nama lengkap")
    bio: Optional[str] = Field(None, max_length=1000, description="Biografi singkat mahasiswa")
    kontak_url: Optional[str] = Field(
        None, max_length=255, description="Tautan profil eksternal (LinkedIn, GitHub, Portofolio)"
    )
    jurusan: Optional[str] = Field(None, max_length=100, description="Program studi")
    angkatan: Optional[int] = Field(None, ge=2000, le=2100, description="Tahun angkatan")

    @field_validator("nama")
    @classmethod
    def validate_nama_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if not cleaned:
                raise ValueError("Nama tidak boleh kosong atau hanya berisi spasi")
            return cleaned
        return v

    @field_validator("kontak_url")
    @classmethod
    def validate_kontak_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v != "":
            cleaned = v.strip()
            if not (cleaned.startswith("http://") or cleaned.startswith("https://")):
                raise ValueError("kontak_url harus diawali dengan http:// atau https://")
            return cleaned
        return v


class PublicProfileResponse(BaseModel):
    user_id: int
    nama: str
    jurusan: Optional[str] = None
    angkatan: Optional[int] = None
    bio: Optional[str] = None
    kontak_url: Optional[str] = None
    role: str
    created_at: datetime
    skills: List[UserSkillResponse] = []
    friendship_status: Literal["none", "pending_sent", "pending_received", "friends"] = "none"
    blocked_by_me: bool = False
    nim: Optional[str] = None
    email: Optional[str] = None

    @computed_field
    @property
    def is_visible(self) -> bool:
        return not self.blocked_by_me

    model_config = ConfigDict(from_attributes=True)
