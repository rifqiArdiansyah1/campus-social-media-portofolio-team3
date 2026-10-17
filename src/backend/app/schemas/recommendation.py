from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateProfile(BaseModel):
    user_id: str
    name: str
    department: str
    bio: str = ""
    skills: List[str] = []
    interests: List[str] = []

class RecommendationItem(BaseModel):
    user_id: str
    name: Optional[str] = None
    department: Optional[str] = None
    score: float = Field(..., ge=0.0, le=1.0, description="Similarity score between 0.0 and 1.0")
    matched_terms: List[str] = Field(default_factory=list, description="Matched skills/interests")
    complementary_skills: List[str] = Field(default_factory=list, description="Skills that complement the seeker")
    reason: str = Field(..., description="Natural language explanation of match")

class RecommendationQuery(BaseModel):
    query_user_id: str
    target_skills: Optional[List[str]] = Field(default_factory=list, description="Skills specifically needed for project")
    project_description: Optional[str] = Field("", description="Optional project requirement text")
    top_k: int = Field(5, ge=1, le=20)

class RecommendationResponse(BaseModel):
    query_user_id: str
    recommendations: List[RecommendationItem]
