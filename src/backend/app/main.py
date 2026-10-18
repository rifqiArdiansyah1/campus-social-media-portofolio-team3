from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.api.v1.endpoints import recommendations, moderation

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API & Layanan AI untuk CampusFolio — Campus Social Media & Portfolio (Team 3)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Setup CORS middleware for Flutter Web & Mobile Client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(recommendations.router, prefix=f"{settings.API_V1_STR}/recommendations", tags=["AI Recommendations (AI-1)"])
app.include_router(moderation.router, prefix=f"{settings.API_V1_STR}/moderation", tags=["AI Content Moderation (AI-2)"])

@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "project": "CampusFolio API",
        "team": "Team 3",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION
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
