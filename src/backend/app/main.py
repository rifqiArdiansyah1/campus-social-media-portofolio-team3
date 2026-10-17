from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
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
