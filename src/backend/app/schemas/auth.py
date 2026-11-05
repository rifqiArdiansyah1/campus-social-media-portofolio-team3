from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.core.normalizers import normalize_email, normalize_jurusan, validate_email_domain


class RegisterRequest(BaseModel):
    nim: str = Field(..., min_length=5, max_length=20, description="Nomor Induk Mahasiswa")
    nama: str = Field(..., min_length=2, max_length=100, description="Nama lengkap mahasiswa")
    email: str = Field(..., max_length=100, description="Email resmi kampus")
    password: str = Field(..., description="Kata sandi (minimal 8 karakter, maksimal 72 byte UTF-8)")
    jurusan: str = Field(..., max_length=100, description="Program studi / Jurusan resmi")
    angkatan: int = Field(..., ge=2015, description="Tahun angkatan masuk")
    role: Optional[str] = Field(default=None, description="Diabaikan untuk registrasi mandiri, selalu dipaksa 'mahasiswa'")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        norm = normalize_email(v)
        if not validate_email_domain(norm):
            raise ValueError("Email harus menggunakan domain resmi kampus (misal: @campus.ac.id atau @students.campus.ac.id)")
        return norm

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Kata sandi minimal 8 karakter")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Kata sandi tidak boleh melebihi 72 byte")
        return v

    @field_validator("jurusan")
    @classmethod
    def validate_department(cls, v: str) -> str:
        norm = normalize_jurusan(v, "mahasiswa")
        if not norm:
            raise ValueError(f"Jurusan '{v}' tidak terdaftar dalam program studi resmi kampus")
        return norm

    @field_validator("angkatan")
    @classmethod
    def validate_admission_year(cls, v: int) -> int:
        current_year = datetime.now().year
        if v > current_year + 1:
            raise ValueError(f"Tahun angkatan tidak boleh lebih dari {current_year + 1}")
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=100, description="Email kampus terdaftar")
    password: str = Field(..., description="Kata sandi akun")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return normalize_email(v)


class UserProfileResponse(BaseModel):
    user_id: int
    nim: Optional[str] = None
    nama: str
    email: str
    role: str
    jurusan: Optional[str] = None
    angkatan: Optional[int] = None
    bio: Optional[str] = None
    kontak_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def id(self) -> int:
        return self.user_id


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfileResponse


class AdminCreateUserRequest(BaseModel):
    email: str = Field(..., max_length=100, description="Email resmi staf/admin")
    nama: str = Field(..., min_length=2, max_length=100, description="Nama staf/admin")
    password: str = Field(..., description="Kata sandi sementara (minimal 8 karakter, maksimal 72 byte UTF-8)")
    role: str = Field(..., description="Peran akun baru: 'moderator' atau 'admin'")
    jurusan: Optional[str] = Field(default=None, max_length=100, description="Program studi binaan (wajib untuk moderator)")
    nim: Optional[str] = Field(default=None, max_length=20, description="Nomor identitas/NIP opsional")
    angkatan: Optional[int] = Field(default=None, description="Tahun angkatan opsional")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return normalize_email(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Kata sandi minimal 8 karakter")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Kata sandi tidak boleh melebihi 72 byte")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed_roles = ("moderator", "admin")
        v_clean = v.strip().lower()
        if v_clean not in allowed_roles:
            raise ValueError(f"Peran harus salah satu dari: {', '.join(allowed_roles)}")
        return v_clean
