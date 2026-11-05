from fastapi import APIRouter, Depends, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ConflictError, InvalidInputError
from app.core.normalizers import normalize_jurusan
from app.core.security import hash_password, require_roles
from app.models.entities import User
from app.schemas.auth import AdminCreateUserRequest, UserProfileResponse

router = APIRouter()


@router.post(
    "/users",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Pembuatan Akun Staf/Moderator/Admin (Khusus Administrator)",
)
def admin_create_user(
    payload: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_roles("admin")),
) -> UserProfileResponse:
    """
    Endpoint khusus administrator untuk membuat akun baru berwenang (moderator/admin).
    - Menolak pembuatan moderator tanpa jurusan spesifik (422 MODERATOR_JURUSAN_REQUIRED)
    - Memvalidasi jurusan moderator terhadap daftar prodi resmi kampus (422 INVALID_JURUSAN)
    - Mengizinkan unit administratif untuk akun role 'admin'
    - Menangani duplikasi email dan identitas unik
    """
    norm_jurusan = None
    if payload.role == "moderator":
        if not payload.jurusan or not payload.jurusan.strip():
            raise InvalidInputError(
                detail="Jurusan wajib ditentukan untuk akun moderator (Kaprodi).",
                code="MODERATOR_JURUSAN_REQUIRED",
            )
        norm_jurusan = normalize_jurusan(payload.jurusan, "moderator")
        if not norm_jurusan:
            raise InvalidInputError(
                detail=f"Jurusan '{payload.jurusan}' tidak terdaftar dalam program studi resmi kampus.",
                code="INVALID_JURUSAN",
            )
    elif payload.role == "admin":
        if payload.jurusan:
            norm_jurusan = normalize_jurusan(payload.jurusan, "admin")

    # Early duplicate checks
    if db.query(User).filter(User.email == payload.email).first():
        raise ConflictError(detail="Email telah terdaftar di sistem.", code="EMAIL_TAKEN")

    if db.query(User).filter(User.nim == payload.nim).first():
        raise ConflictError(detail="NIM/Identitas telah terdaftar di sistem.", code="NIM_TAKEN")

    pw_hash = hash_password(payload.password)

    new_user = User(
        nim=payload.nim,
        nama=payload.nama,
        email=payload.email,
        password_hash=pw_hash,
        role=payload.role,
        jurusan=norm_jurusan,
        angkatan=payload.angkatan,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError as e:
        db.rollback()
        diag = getattr(getattr(e, "orig", None), "diag", None)
        constraint = getattr(diag, "constraint_name", None)
        if constraint == "users_email_key":
            raise ConflictError(detail="Email telah terdaftar di sistem.", code="EMAIL_TAKEN")
        elif constraint == "users_nim_key":
            raise ConflictError(detail="NIM/Identitas telah terdaftar di sistem.", code="NIM_TAKEN")
        raise

    return UserProfileResponse.model_validate(new_user)
