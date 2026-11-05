from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, moderation, recommendations

api_router = APIRouter()

# Register sub-routers with tags
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC (M02)"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration (M02)"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["AI Recommendations (AI-1)"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["AI Content Moderation (AI-2)"])
