import io
import os
from typing import Optional, Tuple
from uuid import uuid4

from PIL import Image

from app.core.config import settings

# Protect against decompression bomb attacks
Image.MAX_IMAGE_PIXELS = 10_000_000

ALLOWED_IMAGE_FORMATS = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp")
}


class StorageService:
    def __init__(self):
        self.supabase_client = None
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            try:
                from supabase import create_client
                self.supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            except Exception as e:
                if settings.ENV.lower() == "production":
                    raise RuntimeError(f"Failed to initialize Supabase client in production: {e}")
        elif settings.ENV.lower() == "production":
            raise RuntimeError("Production environment requires SUPABASE_URL and SUPABASE_SERVICE_KEY.")

        # Local fallback directory for development only
        self.local_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", settings.STORAGE_LOCAL_FALLBACK_DIR))
        if not self.supabase_client and settings.ENV.lower() != "production":
            os.makedirs(self.local_dir, exist_ok=True)

    @property
    def max_image_size(self) -> int:
        return settings.MAX_IMAGE_SIZE_MB * 1024 * 1024

    @property
    def max_doc_size(self) -> int:
        return settings.MAX_DOC_SIZE_MB * 1024 * 1024

    def validate_and_sanitize_image(self, data: bytes, user_id: Optional[int] = None) -> Tuple[bytes, str, str]:
        """
        Validate image via Pillow, strip EXIF metadata, and enforce size limits.
        Returns: (sanitized_bytes, generated_path, content_type)
        """
        if len(data) > self.max_image_size:
            raise ValueError(f"Ukuran gambar melebihi batas maksimal {settings.MAX_IMAGE_SIZE_MB} MB.")

        try:
            image = Image.open(io.BytesIO(data))
            image.verify()
        except Exception:
            raise ValueError("Berkas gambar tidak valid atau rusak.")

        # Re-open for sanitizing and stripping metadata
        image = Image.open(io.BytesIO(data))
        fmt = image.format.upper() if image.format else ""
        if fmt not in ALLOWED_IMAGE_FORMATS:
            raise ValueError(f"Format gambar {fmt} tidak didukung. Gunakan JPEG, PNG, atau WEBP.")

        content_type, ext = ALLOWED_IMAGE_FORMATS[fmt]
        if user_id is not None:
            filename = f"{user_id}/{uuid4()}{ext}"
        else:
            filename = f"{uuid4()}{ext}"

        # Re-save to clean buffer (strips all EXIF / GPS / device metadata)
        output_buffer = io.BytesIO()
        if fmt == "JPEG":
            # Convert RGBA to RGB for JPEG compatibility
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            image.save(output_buffer, format="JPEG", quality=85, optimize=True)
        elif fmt == "PNG":
            image.save(output_buffer, format="PNG", optimize=True)
        elif fmt == "WEBP":
            image.save(output_buffer, format="WEBP", quality=85)

        sanitized_bytes = output_buffer.getvalue()
        return sanitized_bytes, filename, content_type

    def validate_document_pdf(self, data: bytes) -> Tuple[bytes, str, str]:
        """
        Validate PDF document via magic bytes header %PDF-, enforce size limits.
        Returns: (data, generated_filename, content_type)
        """
        if len(data) > self.max_doc_size:
            raise ValueError(f"Ukuran dokumen PDF melebihi batas maksimal {settings.MAX_DOC_SIZE_MB} MB.")

        # Check magic bytes (ISO 32000-1 §7.5.2 allows header within first 1024 bytes)
        if b"%PDF-" not in data[:1024]:
            raise ValueError("Berkas bukan merupakan dokumen PDF yang valid (magic header mismatch).")

        filename = f"{uuid4()}.pdf"
        return data, filename, "application/pdf"

    def upload_file(self, bucket: str, path: str, data: bytes, content_type: str) -> str:
        """
        Upload file data to Supabase Storage bucket, or local fallback in development.
        Returns the stored file path / key.
        """
        if self.supabase_client:
            self.supabase_client.storage.from_(bucket).upload(
                path=path,
                file=data,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            return path
        elif settings.ENV.lower() != "production":
            bucket_dir = os.path.join(self.local_dir, bucket)
            os.makedirs(bucket_dir, exist_ok=True)
            local_path = os.path.join(bucket_dir, path)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(data)
            return path
        else:
            raise RuntimeError("Storage backend unavailable in production.")

    def get_public_url(self, bucket: str, path: str) -> str:
        """
        Get public URL for public bucket (e.g. post-images).
        """
        if self.supabase_client:
            return self.supabase_client.storage.from_(bucket).get_public_url(path)
        else:
            return f"/static/{bucket}/{path}"

    def get_signed_url(self, bucket: str, path: str, ttl_seconds: int = 3600) -> str:
        """
        Get signed temporary URL for private bucket (e.g. portfolio-docs).
        """
        if self.supabase_client:
            res = self.supabase_client.storage.from_(bucket).create_signed_url(path, ttl_seconds)
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            return str(res)
        else:
            return f"/static/{bucket}/{path}?signed=dev_token&ttl={ttl_seconds}"


storage_service = StorageService()
