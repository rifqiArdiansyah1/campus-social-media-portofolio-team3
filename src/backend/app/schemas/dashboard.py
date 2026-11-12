from datetime import datetime
from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field


class RecentPortfolioItemSummary(BaseModel):
    portfolio_id: int
    judul: str
    kategori: str
    created_at: datetime


class StudentDashboardSummary(BaseModel):
    role: Literal["mahasiswa"] = "mahasiswa"
    total_skpi_poin: int
    total_portofolio_terverifikasi: int
    total_portofolio_menunggu: int
    total_portofolio_perlu_revisi: int
    pending_friend_requests: int
    unread_notifications_count: int
    recent_verified_portfolios: List[RecentPortfolioItemSummary] = []


class ModeratorDashboardSummary(BaseModel):
    role: Literal["moderator"] = "moderator"
    jurusan: Optional[str] = None
    is_jurusan_configured: bool = True
    pending_portfolio_reviews: int
    pending_reports: int
    pending_posts: int


class AdminDashboardSummary(BaseModel):
    role: Literal["admin"] = "admin"
    total_mahasiswa: int
    total_portofolio_terverifikasi: int
    pending_portfolio_reviews: int
    pending_reports: int
    pending_posts: int
    total_takedown: int


class DashboardSummaryResponse(BaseModel):
    summary: Union[StudentDashboardSummary, ModeratorDashboardSummary, AdminDashboardSummary] = Field(
        discriminator="role"
    )
