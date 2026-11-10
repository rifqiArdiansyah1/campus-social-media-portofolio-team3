import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import get_current_user
from app.models.entities import Post, PostSkill, RecommendationLog, User, UserSkill
from app.schemas.recommendation import (
    CandidateProfile,
    RecommendationFeedbackRequest,
    RecommendationItem,
    RecommendationMatchRequest,
    RecommendationResponse,
)
from app.services.ai_engine.recommender import (
    TFIDFRecommender,
    get_recommender_engine,
)
from app.services.ai_engine.validator import validate_recommendation_output
from app.services.visibility import exclude_hidden

logger = logging.getLogger(__name__)

router = APIRouter()


def _extract_candidate_profile(user: User) -> CandidateProfile:
    """Helper to convert a User entity with preloaded skills into CandidateProfile."""
    skills_list: List[str] = []
    skill_ids_list: List[int] = []
    interests_list: List[str] = []

    if user.skills:
        for us in user.skills:
            if us.skill:
                skill_ids_list.append(int(us.skill_id))
                if us.skill.tipe == "skill":
                    skills_list.append(us.skill.nama)
                elif us.skill.tipe == "minat":
                    interests_list.append(us.skill.nama)

    return CandidateProfile(
        user_id=str(user.user_id),
        name=user.nama,
        department=user.jurusan or "",
        bio=user.bio or "",
        skills=skills_list,
        skill_ids=skill_ids_list,
        interests=interests_list,
    )


def _safe_log_recommendations(
    db: Session,
    pemohon_id: int,
    recommendations: List[RecommendationItem],
    kebutuhan_teks: str,
    sumber: str,
    is_fallback: bool,
    post_id: Optional[int] = None,
    model_version: str = "tfidf-v1",
) -> None:
    """
    Mencatat luaran rekomendasi ke database secara non-blocking.
    Menerapkan debounce 1 jam untuk mencegah penumpukan baris duplikat.
    Debounce memperhitungkan konteks pencarian:
    - sumber 'for_post': dibedakan berdasarkan (pemohon_id, kandidat_id, sumber, post_id).
    - sumber 'match': dibedakan berdasarkan (pemohon_id, kandidat_id, sumber, kebutuhan_teks).
    Kegagalan logging tidak membatalkan atau memicu error HTTP ke pengguna.
    """
    if not recommendations:
        return

    try:
        cutoff = datetime.utcnow() - timedelta(hours=1)
        for item in recommendations:
            cand_id = int(item.user_id)
            if cand_id == pemohon_id:
                continue

            existing_query = (
                db.query(RecommendationLog)
                .filter(
                    RecommendationLog.pemohon_id == pemohon_id,
                    RecommendationLog.kandidat_id == cand_id,
                    RecommendationLog.sumber == sumber,
                    RecommendationLog.created_at >= cutoff,
                )
            )
            if post_id is not None:
                existing_query = existing_query.filter(RecommendationLog.post_id == post_id)
            else:
                existing_query = existing_query.filter(RecommendationLog.kebutuhan_teks == kebutuhan_teks)

            existing = existing_query.first()

            if existing:
                existing.skor = item.score
                existing.alasan = item.reason
                existing.kebutuhan_teks = kebutuhan_teks
                existing.is_fallback = is_fallback
                existing.sumber = sumber
                existing.post_id = post_id
                existing.model_version = model_version
                item.rec_id = existing.rec_id
            else:
                new_log = RecommendationLog(
                    pemohon_id=pemohon_id,
                    kandidat_id=cand_id,
                    kebutuhan_teks=kebutuhan_teks,
                    skor=item.score,
                    alasan=item.reason,
                    is_fallback=is_fallback,
                    sumber=sumber,
                    post_id=post_id,
                    model_version=model_version,
                )
                db.add(new_log)
                db.flush()
                item.rec_id = new_log.rec_id

        db.commit()
    except Exception as exc:
        logger.warning(f"Gagal mencatat log rekomendasi kolaborator: {exc}")
        db.rollback()


@router.post(
    "/match",
    response_model=RecommendationResponse,
    summary="Rekomendasi Kolaborator Mahasiswa Berdasarkan Kebutuhan (AI-1)",
)
async def get_collaborator_recommendations(
    payload: RecommendationMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    recommender: TFIDFRecommender = Depends(get_recommender_engine),
):
    """
    Endpoint AI-1: Menganalisis kemiripan semantik dan keahlian komplementer
    untuk merekomendasikan rekan proyek/lomba mahasiswa.
    Pemohon selalu berasal dari token JWT (current_user).
    """
    # 1. Bangun profil pemohon dari DB dengan eager loading relasi skills
    seeker_user = (
        db.query(User)
        .options(selectinload(User.skills).joinedload(UserSkill.skill))
        .filter(User.user_id == current_user.user_id)
        .first()
    )
    query_user_profile = _extract_candidate_profile(seeker_user or current_user)

    # 2. Pre-filter kandidat dari database (SQL)
    candidate_query = (
        db.query(User)
        .options(
            selectinload(User.skills).joinedload(UserSkill.skill),
        )
        .filter(
            User.role == "mahasiswa",
            User.user_id != current_user.user_id,
        )
    )

    # Filter blokir timbal balik (M06)
    candidate_query = exclude_hidden(candidate_query, current_user.user_id, User.user_id)

    # Ambil maksimal 500 kandidat dengan urutan deterministik
    db_candidates = candidate_query.order_by(User.user_id.asc()).limit(500).all()

    # Ekstrak profil kandidat ke memori
    candidate_pool = [_extract_candidate_profile(u) for u in db_candidates]

    # 3. Eksekusi kalkulasi AI dengan batas waktu 3 detik
    kebutuhan_teks = f"{payload.project_description or ''} {' '.join(payload.target_skills or [])}".strip()
    is_fallback = False

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(
                recommender.recommend,
                query_user=query_user_profile,
                candidates=candidate_pool,
                target_skills=payload.target_skills,
                target_skill_ids=payload.target_skill_ids,
                project_description=payload.project_description,
                top_k=payload.top_k,
            ),
            timeout=settings.AI_TIMEOUT_SECONDS,
        )
        # Validasi formal terhadap JSON Schema ai/schemas/recommendation-output.schema.json
        validate_recommendation_output(response.model_dump())
    except (asyncio.TimeoutError, Exception) as exc:
        logger.warning(f"Rekomendasi TF-IDF mengalami timeout/galat/skema tidak valid ({exc}), mengalihkan ke mode fallback.")
        is_fallback = True
        try:
            response = recommender.keyword_fallback_recommend(
                query_user=query_user_profile,
                candidates=candidate_pool,
                target_skills=payload.target_skills,
                top_k=payload.top_k,
            )
            validate_recommendation_output(response.model_dump())
        except Exception as fallback_exc:
            logger.error(f"Fallback rekomendasi juga gagal: {fallback_exc}")
            response = RecommendationResponse(
                query_user_id=str(current_user.user_id),
                fallback=True,
                recommendations=[],
            )

    # 4. Catat log rekomendasi secara aman
    _safe_log_recommendations(
        db=db,
        pemohon_id=current_user.user_id,
        recommendations=response.recommendations,
        kebutuhan_teks=kebutuhan_teks,
        sumber="match",
        is_fallback=is_fallback,
    )

    return response


@router.post(
    "/for-post/{post_id}",
    response_model=RecommendationResponse,
    summary="Rekomendasi Rekan untuk Postingan Cari Anggota (US-08)",
)
async def get_recommendations_for_post(
    post_id: int,
    top_k: int = Query(5, ge=1, le=20, description="Jumlah rekomendasi maksimal"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    recommender: TFIDFRecommender = Depends(get_recommender_engine),
):
    """
    Rekomendasi kolaborator spesifik untuk postingan bertipe 'cari_anggota'.
    Hanya dapat diakses oleh penulis postingan (author) yang bersangkutan.
    Mengembalikan 404 jika postingan tidak ditemukan, bukan cari_anggota, atau bukan milik pemohon.
    """
    post = (
        db.query(Post)
        .options(
            selectinload(Post.skills).joinedload(PostSkill.skill),
        )
        .filter(
            Post.post_id == post_id,
            Post.is_deleted == False,  # noqa: E712
        )
        .first()
    )

    if not post:
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    # Guard Otorisasi: Hanya pemilik post yang berhak meminta rekomendasi untuk postingannya
    if post.user_id != current_user.user_id:
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    # Guard Tipe Post: Hanya untuk tipe 'cari_anggota'
    if post.tipe != "cari_anggota":
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    target_skills = [ps.skill.nama for ps in post.skills if ps.skill]
    target_skill_ids = [ps.skill_id for ps in post.skills if ps.skill]
    project_description = post.isi

    # Bangun profil pemohon dari DB dengan eager loading relasi skills
    seeker_user = (
        db.query(User)
        .options(selectinload(User.skills).joinedload(UserSkill.skill))
        .filter(User.user_id == current_user.user_id)
        .first()
    )
    query_user_profile = _extract_candidate_profile(seeker_user or current_user)

    # Query kandidat dari database
    candidate_query = (
        db.query(User)
        .options(
            selectinload(User.skills).joinedload(UserSkill.skill),
        )
        .filter(
            User.role == "mahasiswa",
            User.user_id != current_user.user_id,
        )
    )
    candidate_query = exclude_hidden(candidate_query, current_user.user_id, User.user_id)
    db_candidates = candidate_query.order_by(User.user_id.asc()).limit(500).all()
    candidate_pool = [_extract_candidate_profile(u) for u in db_candidates]

    kebutuhan_teks = f"{project_description} {' '.join(target_skills)}".strip()
    is_fallback = False

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(
                recommender.recommend,
                query_user=query_user_profile,
                candidates=candidate_pool,
                target_skills=target_skills,
                target_skill_ids=target_skill_ids,
                project_description=project_description,
                top_k=top_k,
            ),
            timeout=settings.AI_TIMEOUT_SECONDS,
        )
        # Validasi formal terhadap JSON Schema ai/schemas/recommendation-output.schema.json
        validate_recommendation_output(response.model_dump())
    except (asyncio.TimeoutError, Exception) as exc:
        logger.warning(f"Rekomendasi for-post #{post_id} timeout/galat/skema tidak valid ({exc}), mengalihkan ke mode fallback.")
        is_fallback = True
        try:
            response = recommender.keyword_fallback_recommend(
                query_user=query_user_profile,
                candidates=candidate_pool,
                target_skills=target_skills,
                top_k=top_k,
            )
            validate_recommendation_output(response.model_dump())
        except Exception as fallback_exc:
            logger.error(f"Fallback rekomendasi for-post juga gagal: {fallback_exc}")
            response = RecommendationResponse(
                query_user_id=str(current_user.user_id),
                fallback=True,
                recommendations=[],
            )

    _safe_log_recommendations(
        db=db,
        pemohon_id=current_user.user_id,
        recommendations=response.recommendations,
        kebutuhan_teks=kebutuhan_teks,
        sumber="for_post",
        is_fallback=is_fallback,
        post_id=post.post_id,
    )

    return response


@router.post(
    "/{rec_id}/feedback",
    status_code=status.HTTP_200_OK,
    summary="Kirim Umpan Balik Relevansi Rekomendasi (Idempoten)",
)
def submit_recommendation_feedback(
    rec_id: int,
    payload: RecommendationFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Menyimpan umpan balik pengguna ('relevan' / 'tidak_relevan') untuk baris log rekomendasi.
    Memeriksa kepemilikan log (404 jika bukan pemohon log untuk proteksi IDOR).
    Operasi ini bersifat idempoten (dapat diubah kembali oleh pemohon).
    """
    log_entry = (
        db.query(RecommendationLog)
        .filter(RecommendationLog.rec_id == rec_id)
        .first()
    )

    if not log_entry:
        raise NotFoundError(
            code="RECOMMENDATION_NOT_FOUND",
            detail="Catatan rekomendasi tidak ditemukan.",
        )

    # Validasi kepemilikan log (IDOR Protection)
    if log_entry.pemohon_id != current_user.user_id:
        raise NotFoundError(
            code="RECOMMENDATION_NOT_FOUND",
            detail="Catatan rekomendasi tidak ditemukan.",
        )

    log_entry.umpan_balik = payload.umpan_balik
    db.commit()

    return {
        "detail": "Umpan balik berhasil disimpan.",
        "rec_id": rec_id,
        "umpan_balik": payload.umpan_balik,
    }
