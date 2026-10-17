from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ModerationRequest(BaseModel):
    post_id: str
    content: str
    user_id: Optional[str] = None

class ModerationResponse(BaseModel):
    post_id: str
    label: Literal["aman", "perlu_review", "berpotensi_melanggar"]
    categories: List[str] = Field(default_factory=list, description="Violation categories (e.g. ujaran_kasar, pelecehan, spam)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    explanation: str = Field(..., description="Explanation of classification")
