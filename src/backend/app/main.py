import logging
import os

from fastapi import Depends, FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AppError
from app.services.storage import storage_service

logger = logging.getLogger("campusfolio")
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API & Layanan AI untuk CampusFolio — Campus Social Media & Portfolio (Team 3)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS middleware for Next.js Web Client & Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_production_gate_guard():
    """
    Production Gate Guard: Memastikan platform menolak startup apabila konfigurasi
    keamanan kritis (SECRET_KEY atau CORS_ORIGINS) masih dalam konfigurasi default tidak aman.
    """
    logger.info(f"Starting CampusFolio API v{settings.VERSION} [Environment: {settings.ENV}]")
    if settings.ENV.lower() in ("production", "prod"):
        if "*" in settings.CORS_ORIGINS:
            raise RuntimeError(
                "CRITICAL SECURITY ERROR: Wildcard '*' in CORS_ORIGINS is strictly forbidden in production with credentials enabled."
            )
        insecure_keys = {
            "",
            "campusfolio-secret-key-change-in-production-2026",
            "ganti-dengan-secret-key-aman-milik-tim-campusfolio",
        }
        if settings.SECRET_KEY in insecure_keys or len(settings.SECRET_KEY) < 32:
            raise RuntimeError(
                "CRITICAL SECURITY ERROR: Production environment requires a secure custom SECRET_KEY (min 32 chars)."
            )

# Exception Handlers
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    content = {"detail": exc.detail, "code": exc.code}
    if exc.errors is not None:
        content["errors"] = exc.errors
    if exc.extra:
        content.update(exc.extra)
    return JSONResponse(status_code=exc.status_code, content=content, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validasi input gagal",
            "code": "VALIDATION_ERROR",
            "errors": jsonable_encoder(exc.errors())
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        408: "REQUEST_TIMEOUT",
        409: "CONFLICT",
        422: "UNPROCESSABLE_ENTITY",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_SERVER_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE"
    }
    code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": code}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error at {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Terjadi kesalahan internal pada server",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )


# Include unified API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount local storage directory for static file serving in development
if settings.ENV.lower() != "production":
    os.makedirs(storage_service.local_dir, exist_ok=True)
    app.mount("/static", StaticFiles(directory=storage_service.local_dir), name="static")


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "project": "CampusFolio API",
        "team": "Team 3",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENV
    }


@app.get(f"{settings.API_V1_STR}/health/db", tags=["Health Check"])
def database_health_check(db: Session = Depends(get_db)):
    """
    Verifikasi koneksi aktif ke PostgreSQL di Supabase Cloud.
    """
    try:
        db.execute(text("SELECT 1;"))
        user_count = db.execute(text("SELECT COUNT(*) FROM users;")).scalar()
        skill_count = db.execute(text("SELECT COUNT(*) FROM skills;")).scalar()
        return {
            "database": "connected",
            "provider": "Supabase PostgreSQL",
            "stats": {
                "users": user_count,
                "skills": skill_count
            }
        }
    except Exception as e:
        return {
            "database": "disconnected",
            "error": str(e)
        }


@app.get(f"{settings.API_V1_STR}/health/storage", tags=["Health Check"])
def storage_health_check():
    """
    Verifikasi status storage backend.
    """
    is_supabase = storage_service.supabase_client is not None
    return {
        "storage": "connected" if is_supabase or settings.ENV != "production" else "error",
        "provider": "Supabase Storage" if is_supabase else "Local Fallback (Dev Only)",
        "buckets": {
            "post_images": settings.POST_IMAGES_BUCKET,
            "portfolio_docs": settings.PORTFOLIO_DOCS_BUCKET
        }
    }
