from fastapi import APIRouter
from app.schemas.moderation import ModerationRequest, ModerationResponse
from app.services.ai_engine.moderator import moderator_engine

router = APIRouter()

@router.post("/check", response_model=ModerationResponse, summary="Klasifikasi Awal Moderasi Postingan (AI-2)")
def check_post_moderation(payload: ModerationRequest):
    """
    Endpoint AI-2: Memindai teks postingan sebelum/sesudah tayang.
    Hasil klasifikasi menentukan apakah postingan langsung tayang (aman),
    ditinjau admin (perlu_review), atau disembunyikan (berpotensi_melanggar).
    """
    return moderator_engine.moderate_text(
        post_id=payload.post_id,
        content=payload.content
    )
