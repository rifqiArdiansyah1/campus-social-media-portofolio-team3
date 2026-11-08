import os

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.core.config import settings
from app.core.exceptions import ForbiddenError, InvalidInputError
from app.core.security import get_current_user
from app.models.entities import User
from app.schemas.upload import UploadDocumentResponse, UploadImageResponse
from app.services.storage import storage_service

router = APIRouter()


@router.post(
    "/post-image",
    response_model=UploadImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Unggah Foto untuk Postingan Linimasa",
)
async def upload_post_image(
    file: UploadFile = File(..., description="Berkas foto (JPEG, PNG, WEBP maks 5MB)"),
    current_user: User = Depends(get_current_user),
):
    try:
        data = await file.read()
        sanitized_bytes, storage_path, content_type = storage_service.validate_and_sanitize_image(
            data=data,
            user_id=current_user.user_id,
        )
    except ValueError as exc:
        raise InvalidInputError(
            code="INVALID_IMAGE_FILE",
            detail=str(exc),
        )

    saved_path = storage_service.upload_file(
        bucket=settings.POST_IMAGES_BUCKET,
        path=storage_path,
        data=sanitized_bytes,
        content_type=content_type,
    )
    public_url = storage_service.get_public_url(settings.POST_IMAGES_BUCKET, saved_path)

    return UploadImageResponse(
        path=saved_path,
        url=public_url,
        filename=os.path.basename(saved_path),
        content_type=content_type,
        size_bytes=len(sanitized_bytes),
    )


@router.post(
    "/portfolio-doc",
    response_model=UploadDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Unggah Dokumen Bukti Portofolio / SKPI (Private)",
)
async def upload_portfolio_document(
    file: UploadFile = File(..., description="Berkas bukti SKPI (PDF maks 10MB atau Gambar maks 5MB)"),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "mahasiswa":
        raise ForbiddenError(
            code="STUDENT_ONLY",
            detail="Hanya mahasiswa yang diizinkan mengunggah dokumen bukti portofolio.",
        )

    # Chunked stream read to avoid memory exhaustion
    max_allowed = settings.MAX_DOC_SIZE_MB * 1024 * 1024
    chunks = []
    total_bytes = 0
    while True:
        chunk = await file.read(65536)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_allowed:
            raise InvalidInputError(
                code="FILE_TOO_LARGE",
                detail=f"Ukuran berkas melebihi batas maksimal {settings.MAX_DOC_SIZE_MB} MB.",
            )
        chunks.append(chunk)

    data = b"".join(chunks)

    try:
        sanitized_bytes, storage_path, content_type = storage_service.validate_and_sanitize_document(
            data=data,
            user_id=current_user.user_id,
        )
    except ValueError as exc:
        raise InvalidInputError(
            code="INVALID_DOCUMENT_FILE",
            detail=str(exc),
        )

    saved_path = storage_service.upload_file(
        bucket=settings.PORTFOLIO_DOCS_BUCKET,
        path=storage_path,
        data=sanitized_bytes,
        content_type=content_type,
    )

    return UploadDocumentResponse(
        path=saved_path,
        filename=os.path.basename(saved_path),
        content_type=content_type,
        size_bytes=len(sanitized_bytes),
    )
