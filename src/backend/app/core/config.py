import json
from typing import List, Optional, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusFolio API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"

    # JWT Authentication
    SECRET_KEY: str = "campusfolio-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours (1 day)

    # Security & Reverse Proxy
    TRUSTED_PROXY_COUNT: int = 1

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/campusfolio_db"
    MIGRATION_DATABASE_URL: Optional[str] = None

    # Supabase Storage & Services
    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None
    POST_IMAGES_BUCKET: str = "post-images"
    PORTFOLIO_DOCS_BUCKET: str = "portfolio-docs"
    STORAGE_LOCAL_FALLBACK_DIR: str = "uploads"
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_DOC_SIZE_MB: int = 10

    # Allowed Email Domains for Student Registration (US-01)
    ALLOWED_EMAIL_DOMAINS: List[str] = ["campus.ac.id", "students.campus.ac.id"]

    # Official Academic Departments (Controlled list for students & Kaprodi/moderator)
    ALLOWED_JURUSAN: List[str] = [
        "Teknik Informatika",
        "Sistem Informasi",
        "Ilmu Komputer",
        "Manajemen Bisnis",
        "Teknik Elektro",
        "Teknik Komputer",
    ]

    # CORS (Allows Next.js Web on localhost and hosted domains)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("DATABASE_URL", "MIGRATION_DATABASE_URL", mode="after")
    @classmethod
    def normalize_database_url(cls, v: Optional[str]) -> Optional[str]:
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("ALLOWED_EMAIL_DOMAINS", mode="before")
    @classmethod
    def parse_allowed_domains(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [d.strip() for d in v.split(",") if d.strip()]
        return v

    @field_validator("ALLOWED_JURUSAN", mode="before")
    @classmethod
    def parse_allowed_jurusan(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [j.strip() for j in v.split(",") if j.strip()]
        return v

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.ENV.lower() == "production":
            insecure_keys = {
                "",
                "campusfolio-secret-key-change-in-production-2026",
                "ganti-dengan-secret-key-aman-milik-tim-campusfolio",
            }
            if self.SECRET_KEY in insecure_keys or len(self.SECRET_KEY) < 32:
                raise ValueError("Production environment requires a secure SECRET_KEY of at least 32 characters.")

            if "localhost" in self.DATABASE_URL or "127.0.0.1" in self.DATABASE_URL:
                raise ValueError("Production environment cannot use a localhost DATABASE_URL.")

            if not self.SUPABASE_URL or not self.SUPABASE_SERVICE_KEY:
                raise ValueError("Production environment requires SUPABASE_URL and SUPABASE_SERVICE_KEY.")

            if "*" in self.CORS_ORIGINS:
                raise ValueError("Production environment cannot use wildcard '*' in CORS_ORIGINS with credentials enabled.")

        return self


settings = Settings()
