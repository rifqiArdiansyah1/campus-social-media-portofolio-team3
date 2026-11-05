from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    DUMMY_HASH,
    create_access_token,
    get_client_ip,
    get_current_user,
    hash_password,
    rate_limiter,
    verify_password,
)
from app.models.entities import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi Akun Mahasiswa Baru",
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """
    Mendaftarkan akun mahasiswa baru (US-01).
    - Memvalidasi domain email resmi kampus (@campus.ac.id / @students.campus.ac.id)
    - Memvalidasi daftar prodi resmi kampus
    - Membatasi kata sandi antara 8 hingga 72 byte UTF-8
    - Memaksa peran akun selalu menjadi 'mahasiswa' (mencegah eskalasi hak akses)
    - Menangani duplikasi NIM dan email dengan status 409 (NIM_TAKEN / EMAIL_TAKEN)
    """
    # Early duplicate checks
    if db.query(User).filter(User.email == payload.email).first():
        raise ConflictError(detail="Email kampus telah terdaftar", code="EMAIL_TAKEN")

    if db.query(User).filter(User.nim == payload.nim).first():
        raise ConflictError(detail="NIM mahasiswa telah terdaftar", code="NIM_TAKEN")

    # Hash password using native bcrypt (cost 12)
    pw_hash = hash_password(payload.password)

    # Force role to 'mahasiswa'
    new_user = User(
        nim=payload.nim,
        nama=payload.nama,
        email=payload.email,
        password_hash=pw_hash,
        role="mahasiswa",
        jurusan=payload.jurusan,
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
            raise ConflictError(detail="Email kampus telah terdaftar", code="EMAIL_TAKEN")
        elif constraint == "users_nim_key":
            raise ConflictError(detail="NIM mahasiswa telah terdaftar", code="NIM_TAKEN")
        raise

    return UserProfileResponse.model_validate(new_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Masuk / Otentikasi Pengguna",
)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Masuk ke sistem menggunakan email dan kata sandi.
    - Dilindungi rate limiter 2 lapis (IP+Email dan Global Email)
    - Mitigasi timing attack dengan dummy bcrypt hashing saat email tidak ditemukan
    - Menangani kata sandi > 72 byte secara elegan sebagai 401 INVALID_CREDENTIALS
    - Mengembalikan JWT stateless dengan masa berlaku 24 jam
    """
    client_ip = get_client_ip(request)

    # 1. Rate limiter check (prior to bcrypt verification to prevent resource exhaustion)
    rate_limiter.check_rate_limit(client_ip=client_ip, email=payload.email)

    # 2. Query user from database
    user = db.query(User).filter(User.email == payload.email).first()

    # 3. Authenticate with timing attack defense
    if not user:
        # Compute dummy verification to match response timing (~80-100ms)
        verify_password(payload.password, DUMMY_HASH)
        rate_limiter.record_failure(client_ip=client_ip, email=payload.email)
        raise UnauthorizedError(
            detail="Email atau kata sandi tidak valid.",
            code="INVALID_CREDENTIALS",
        )

    if not verify_password(payload.password, user.password_hash):
        rate_limiter.record_failure(client_ip=client_ip, email=payload.email)
        raise UnauthorizedError(
            detail="Email atau kata sandi tidak valid.",
            code="INVALID_CREDENTIALS",
        )

    # 4. Successful login: reset rate limit counters
    rate_limiter.reset_for_user(client_ip=client_ip, email=payload.email)

    # 5. Issue JWT access token (minimal payload: sub, iat, exp)
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserProfileResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Profil Pengguna Sesi Aktif",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    """
    Mengambil data profil pengguna yang sedang login berdasarkan token JWT aktif.
    """
    return UserProfileResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Keluar dari Sesi",
)
def logout() -> Response:
    """
    Keluar dari sesi (stateless JWT).
    Klien diharapkan menghapus token dari storage lokal / cookie.
    """
    return Response(status_code=status.HTTP_204_NO_CONTENT)
