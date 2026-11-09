from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    blocks,
    friends,
    friendships,
    moderation,
    notifications,
    portfolio,
    posts,
    recommendations,
    reports,
    skills,
    uploads,
    users,
)

api_router = APIRouter()

# Register sub-routers with tags
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC (M02)"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration (M02)"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profiles (M04)"])
api_router.include_router(skills.router, prefix="/skills", tags=["Skills (M04)"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads & Media (M05)"])
api_router.include_router(posts.router, prefix="/posts", tags=["Posts & Feed (M05)"])
api_router.include_router(friendships.router, prefix="/friendships", tags=["Friendships (M06)"])
api_router.include_router(friends.router, prefix="/friends", tags=["Friends (M06)"])
api_router.include_router(blocks.router, prefix="/blocks", tags=["User Blocks (M06)"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio & SKPI (M07)"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["AI Recommendations (AI-1)"])
api_router.include_router(moderation.router, prefix="/moderation", tags=["AI Content Moderation (AI-2)"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Moderation (M08)"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications (M08/US-10)"])
