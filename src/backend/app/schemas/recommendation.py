from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class CandidateProfile(BaseModel):
    user_id: str
    name: str
    department: str
    bio: str = ""
    skills: List[str] = Field(default_factory=list)
    skill_ids: List[int] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)


class RecommendationItem(BaseModel):
    user_id: str
    rec_id: Optional[int] = Field(default=None, description="ID log rekomendasi untuk feedback")
    name: Optional[str] = None
    department: Optional[str] = None
    match_level: Optional[str] = Field(default=None, description="Tingkat kecocokan (Sangat Cocok, Cukup Cocok, Potensial)")
    score: float = Field(..., ge=0.0, le=1.0, description="Skor kemiripan/kecocokan (0.0 s.d. 1.0)")
    matched_terms: List[str] = Field(default_factory=list, description="Tag keahlian yang memiliki irisan")
    complementary_skills: List[str] = Field(default_factory=list, description="Keahlian kandidat yang melengkapi kebutuhan")
    reason: str = Field(..., description="Penjelasan bahasa alami mengenai alasan kecocokan")


class RecommendationMatchRequest(BaseModel):
    target_skills: Optional[List[str]] = Field(
        default=None,
        max_length=10,
        description="Daftar keahlian spesifik yang dibutuhkan (maks 10)"
    )
    target_skill_ids: Optional[List[int]] = Field(
        default=None,
        max_length=10,
        description="Daftar ID keahlian spesifik jika diketahui (maks 10)"
    )
    project_description: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Deskripsi kebutuhan proyek (maks 1000 karakter)"
    )
    top_k: int = Field(5, ge=1, le=20, description="Jumlah rekomendasi maksimal (1 s.d. 20)")


class RecommendationFeedbackRequest(BaseModel):
    umpan_balik: Literal["relevan", "tidak_relevan"] = Field(
        ...,
        description="Evaluasi relevansi hasil rekomendasi"
    )


class RecommendationResponse(BaseModel):
    query_user_id: str
    fallback: bool = Field(default=False, description="Menandai apakah hasil berasal dari mode fallback")
    recommendations: List[RecommendationItem]
