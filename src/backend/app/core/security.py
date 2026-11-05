import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple, Union

import bcrypt
import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import (
    ForbiddenError,
    RateLimitError,
    UnauthorizedError,
)
from app.models.entities import User

# Precomputed dummy hash for timing attack mitigation (cost 12)
# Computed once at module initialization
DUMMY_HASH: str = bcrypt.hashpw(b"campusfolio_timing_mitigation_secret_2026", bcrypt.gensalt(rounds=12)).decode("utf-8")


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using native bcrypt with salt rounds = 12.
    """
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a bcrypt hashed password.
    Catches any ValueError if the password exceeds bcrypt's 72-byte limit
    and returns False without throwing unhandled exceptions.
    """
    try:
        pw_bytes = plain_password.encode("utf-8")
        if len(pw_bytes) > 72:
            return False
        return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a signed JSON Web Token (JWT) containing minimal payload (sub, exp, iat).
    Does NOT store role or jurusan claims; authorization is queried fresh from DB.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    Raises UnauthorizedError with code 'TOKEN_EXPIRED' or 'INVALID_TOKEN'
    and RFC-compliant WWW-Authenticate header.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(
            detail="Token telah kedaluwarsa. Silakan masuk kembali.",
            code="TOKEN_EXPIRED",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token", error_description="Token expired"'},
        )
    except jwt.PyJWTError:
        raise UnauthorizedError(
            detail="Token autentikasi tidak valid.",
            code="INVALID_TOKEN",
            headers={"WWW-Authenticate": 'Bearer error="invalid_token", error_description="Invalid token"'},
        )


def get_client_ip(request: Request) -> str:
    """
    Extract trusted client IP address considering reverse proxies.
    Evaluates X-Forwarded-For from right to left based on TRUSTED_PROXY_COUNT.
    If TRUSTED_PROXY_COUNT <= 0, ignores X-Forwarded-For and returns direct client host.
    Falls back to request.client.host if no header is present.
    """
    if settings.TRUSTED_PROXY_COUNT > 0:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            ips = [ip.strip() for ip in xff.split(",") if ip.strip()]
            if ips:
                if len(ips) >= settings.TRUSTED_PROXY_COUNT:
                    return ips[-settings.TRUSTED_PROXY_COUNT]
                return ips[0]

    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


class DualLayerRateLimiter:
    """
    In-memory dual-layer rate limiter for authentication endpoints:
    - Layer 1 (IP + Email): Max 5 failed attempts per 60 seconds.
    - Layer 2 (Global Email): Max 20 failed attempts per 600 seconds (10 minutes).
    Tracks ONLY failed attempts. Resets on successful authentication.
    """
    LAYER1_MAX_FAILURES: int = 5
    LAYER1_WINDOW_SECONDS: float = 60.0

    LAYER2_MAX_FAILURES: int = 20
    LAYER2_WINDOW_SECONDS: float = 600.0

    def __init__(self) -> None:
        self._ip_email_failures: Dict[Tuple[str, str], List[float]] = {}
        self._email_failures: Dict[str, List[float]] = {}

    def _prune(self, timestamps: List[float], window: float, now: float) -> List[float]:
        cutoff = now - window
        return [t for t in timestamps if t > cutoff]

    def check_rate_limit(self, client_ip: str, email: str, now: Optional[float] = None) -> None:
        """
        Check if the request exceeds rate limits.
        Raises RateLimitError (HTTP 429) with dynamic Retry-After header.
        Evaluated BEFORE password verification to prevent resource exhaustion.
        """
        current_time = time.time() if now is None else now
        ip_email_key = (client_ip, email.strip().lower())
        norm_email = email.strip().lower()

        # Check Layer 1: IP + Email
        if ip_email_key in self._ip_email_failures:
            active_attempts = self._prune(self._ip_email_failures[ip_email_key], self.LAYER1_WINDOW_SECONDS, current_time)
            if not active_attempts:
                self._ip_email_failures.pop(ip_email_key, None)
            else:
                self._ip_email_failures[ip_email_key] = active_attempts
                if len(active_attempts) >= self.LAYER1_MAX_FAILURES:
                    oldest = active_attempts[0]
                    retry_after = max(1, int(oldest + self.LAYER1_WINDOW_SECONDS - current_time))
                    raise RateLimitError(
                        detail="Terlalu banyak percobaan login gagal untuk kombinasi IP dan akun ini. Coba lagi nanti.",
                        code="TOO_MANY_REQUESTS",
                        headers={"Retry-After": str(retry_after)},
                    )

        # Check Layer 2: Global Email
        if norm_email in self._email_failures:
            active_attempts = self._prune(self._email_failures[norm_email], self.LAYER2_WINDOW_SECONDS, current_time)
            if not active_attempts:
                self._email_failures.pop(norm_email, None)
            else:
                self._email_failures[norm_email] = active_attempts
                if len(active_attempts) >= self.LAYER2_MAX_FAILURES:
                    oldest = active_attempts[0]
                    retry_after = max(1, int(oldest + self.LAYER2_WINDOW_SECONDS - current_time))
                    raise RateLimitError(
                        detail="Terlalu banyak percobaan login gagal untuk akun ini. Akun dikunci sementara demi keamanan.",
                        code="TOO_MANY_REQUESTS",
                        headers={"Retry-After": str(retry_after)},
                    )

    def record_failure(self, client_ip: str, email: str, now: Optional[float] = None) -> None:
        """
        Record a failed login attempt for both rate limit layers.
        """
        current_time = time.time() if now is None else now
        ip_email_key = (client_ip, email.strip().lower())
        norm_email = email.strip().lower()

        # Layer 1
        current_l1 = self._prune(
            self._ip_email_failures.get(ip_email_key, []),
            self.LAYER1_WINDOW_SECONDS,
            current_time,
        )
        current_l1.append(current_time)
        self._ip_email_failures[ip_email_key] = current_l1

        # Layer 2
        current_l2 = self._prune(
            self._email_failures.get(norm_email, []),
            self.LAYER2_WINDOW_SECONDS,
            current_time,
        )
        current_l2.append(current_time)
        self._email_failures[norm_email] = current_l2

    def reset_for_user(self, client_ip: str, email: str) -> None:
        """
        Reset failed attempt counters on successful authentication.
        """
        ip_email_key = (client_ip, email.strip().lower())
        norm_email = email.strip().lower()
        self._ip_email_failures.pop(ip_email_key, None)
        self._email_failures.pop(norm_email, None)

    def reset(self) -> None:
        """
        Clear all rate limit entries (for testing purposes).
        """
        self._ip_email_failures.clear()
        self._email_failures.clear()


# Global rate limiter instance
rate_limiter = DualLayerRateLimiter()

oauth2_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency to authenticate requests using JWT Bearer token.
    Always retrieves the user from the database to guarantee fresh authorization state.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedError(
            detail="Header Authorization Bearer diperlukan.",
            code="NOT_AUTHENTICATED",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id_str: Optional[str] = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError(
            detail="Token autentikasi tidak memuat subjek yang valid.",
            code="INVALID_TOKEN",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise UnauthorizedError(
            detail="Format subjek token tidak valid.",
            code="INVALID_TOKEN",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise UnauthorizedError(
            detail="Pengguna pemilik sesi tidak ditemukan.",
            code="INVALID_TOKEN",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_roles(*allowed_roles: str):
    """
    Dependency factory to enforce Role-Based Access Control (RBAC).
    Checks the user's role retrieved fresh from the database.
    Raises ForbiddenError (403 FORBIDDEN_ROLE) if unauthorized.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                detail=f"Peran '{current_user.role}' tidak memiliki izin untuk mengakses sumber daya ini.",
                code="FORBIDDEN_ROLE",
            )
        return current_user

    return role_checker


def can_moderate(current_user: User, jurusan_target: Optional[str]) -> bool:
    """
    Evaluate content moderation authority:
    - Admin: Has global moderation authority across all departments (returns True).
    - Moderator (Kaprodi): Can only moderate items matching their assigned department
      (case-insensitive, whitespace-trimmed comparison).
    - Mahasiswa / Others: Cannot moderate (returns False).
    """
    if current_user.role == "admin":
        return True

    if current_user.role == "moderator":
        if not current_user.jurusan or not jurusan_target:
            return False
        return current_user.jurusan.strip().lower() == jurusan_target.strip().lower()

    return False
