from pydantic import BaseModel, Field


class UploadImageResponse(BaseModel):
    path: str = Field(..., description="Path relatif dalam storage bucket (e.g. 101/uuid.jpg)")
    url: str = Field(..., description="URL publik berkas gambar yang dapat diakses langsung")
    filename: str = Field(..., description="Nama file unik")
    content_type: str = Field(..., description="Tipe MIME gambar (e.g. image/jpeg)")
    size_bytes: int = Field(..., description="Ukuran berkas dalam byte")


class UploadDocumentResponse(BaseModel):
    path: str = Field(..., description="Path relatif dalam private storage bucket (e.g. 101/uuid.pdf)")
    filename: str = Field(..., description="Nama file unik")
    content_type: str = Field(..., description="Tipe MIME dokumen (e.g. application/pdf)")
    size_bytes: int = Field(..., description="Ukuran berkas dalam byte")
