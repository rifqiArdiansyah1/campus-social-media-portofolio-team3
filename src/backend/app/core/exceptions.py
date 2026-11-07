from typing import Any, List, Optional


class AppError(Exception):
    """
    Base application exception for standardized API error handling.
    Produces {"detail": "...", "code": "SNAKE_CASE"} responses.
    Supports optional custom HTTP response headers (e.g., WWW-Authenticate, Retry-After)
    and extra payload fields (e.g., friendship_id).
    """
    def __init__(
        self,
        status_code: int,
        code: str,
        detail: str,
        errors: Optional[List[Any]] = None,
        headers: Optional[dict] = None,
        extra: Optional[dict] = None,
    ):
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.errors = errors
        self.headers = headers
        self.extra = extra or {}
        super().__init__(detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Sumber daya tidak ditemukan", code: str = "NOT_FOUND", headers: Optional[dict] = None, extra: Optional[dict] = None):
        super().__init__(status_code=404, code=code, detail=detail, headers=headers, extra=extra)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Autentikasi gagal atau sesi tidak valid", code: str = "UNAUTHORIZED", headers: Optional[dict] = None, extra: Optional[dict] = None):
        super().__init__(status_code=401, code=code, detail=detail, headers=headers, extra=extra)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Anda tidak memiliki hak akses untuk tindakan ini", code: str = "FORBIDDEN", headers: Optional[dict] = None, extra: Optional[dict] = None):
        super().__init__(status_code=403, code=code, detail=detail, headers=headers, extra=extra)


class ConflictError(AppError):
    def __init__(self, detail: str = "Konflik data terdeteksi", code: str = "CONFLICT", headers: Optional[dict] = None, extra: Optional[dict] = None):
        super().__init__(status_code=409, code=code, detail=detail, headers=headers, extra=extra)


class InvalidInputError(AppError):
    def __init__(
        self,
        detail: str = "Data input tidak memenuhi validasi",
        code: str = "INVALID_INPUT",
        errors: Optional[List[Any]] = None,
        headers: Optional[dict] = None,
        extra: Optional[dict] = None,
    ):
        super().__init__(status_code=422, code=code, detail=detail, errors=errors, headers=headers, extra=extra)


class RateLimitError(AppError):
    def __init__(
        self,
        detail: str = "Terlalu banyak percobaan. Silakan coba beberapa saat lagi.",
        code: str = "TOO_MANY_REQUESTS",
        headers: Optional[dict] = None,
        extra: Optional[dict] = None,
    ):
        super().__init__(status_code=429, code=code, detail=detail, headers=headers, extra=extra)
