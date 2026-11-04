from typing import Any, List, Optional


class AppError(Exception):
    """
    Base application exception for standardized API error handling.
    Produces {"detail": "...", "code": "SNAKE_CASE"} responses.
    """
    def __init__(self, status_code: int, code: str, detail: str, errors: Optional[List[Any]] = None):
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.errors = errors
        super().__init__(detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Sumber daya tidak ditemukan", code: str = "NOT_FOUND"):
        super().__init__(status_code=404, code=code, detail=detail)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Autentikasi gagal atau sesi tidak valid", code: str = "UNAUTHORIZED"):
        super().__init__(status_code=401, code=code, detail=detail)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Anda tidak memiliki hak akses untuk tindakan ini", code: str = "FORBIDDEN"):
        super().__init__(status_code=403, code=code, detail=detail)


class ConflictError(AppError):
    def __init__(self, detail: str = "Konflik data terdeteksi", code: str = "CONFLICT"):
        super().__init__(status_code=409, code=code, detail=detail)


class InvalidInputError(AppError):
    def __init__(self, detail: str = "Data input tidak memenuhi validasi", code: str = "INVALID_INPUT", errors: Optional[List[Any]] = None):
        super().__init__(status_code=422, code=code, detail=detail, errors=errors)
