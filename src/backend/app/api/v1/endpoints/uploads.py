import os

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.core.config import settings
from app.core.exceptions import InvalidInputError
from app.core.security import get_current_user
from app.models.entities import User
from app.schemas.upload import UploadImageResponse
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
