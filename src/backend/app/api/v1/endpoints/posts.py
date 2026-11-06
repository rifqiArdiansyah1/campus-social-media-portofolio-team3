import asyncio
import base64
import json
import logging
import os
from datetime import datetime
from typing import Literal, Optional, Tuple
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import ConflictError, ForbiddenError, InvalidInputError, NotFoundError
from app.core.security import can_moderate, get_current_user
from app.models.entities import Friendship, ModerationRecord, Post, PostSkill, Skill, User, UserBlock
from app.schemas.post import (
    PostAuthorResponse,
    PostCreate,
    PostDetailResponse,
    PostFeedResponse,
    PostSkillTagResponse,
    PostUpdate,
)
from app.services.ai_engine.moderator import ContentModerator, get_moderator_engine
from app.services.storage import storage_service
from app.services.visibility import is_target_blocking_viewer, is_viewer_blocking_target

logger = logging.getLogger("campusfolio.posts")
router = APIRouter()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def encode_cursor(created_at: datetime, post_id: int) -> str:
    """Encodes created_at and post_id into an opaque URL-safe base64 string."""
    payload = json.dumps({"t": created_at.isoformat(), "id": post_id})
    return base64.urlsafe_b64encode(payload.encode()).decode()


def decode_cursor(cursor_str: str) -> Optional[Tuple[datetime, int]]:
    """Decodes opaque URL-safe base64 cursor string into (created_at, post_id)."""
    try:
        raw = base64.urlsafe_b64decode(cursor_str.encode()).decode()
        data = json.loads(raw)
        dt = datetime.fromisoformat(data["t"])
        if dt.tzinfo is not None:
            dt = dt.replace(tzinfo=None)
        return dt, int(data["id"])
    except Exception:
        return None


def validate_and_canonicalize_image_path(gambar_url: Optional[str], user_id: int) -> Optional[str]:
    """
    Validates image path or URL ownership and prevents hotlinking external domains.
    Canonicalizes to the relative path within post-images bucket (e.g. '{user_id}/{uuid}.jpg').
    """
    if not gambar_url:
        return None

    cleaned = gambar_url.strip()
    if not cleaned:
        return None

    expected_prefix = f"{user_id}/"

    # If it's a full URL
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        parsed = urlparse(cleaned)
        # Check against allowed storage paths
        path_parts = parsed.path.split(f"/{settings.POST_IMAGES_BUCKET}/")
        if len(path_parts) > 1:
            rel_path = path_parts[1].lstrip("/")
        elif f"/static/{settings.POST_IMAGES_BUCKET}/" in parsed.path:
            rel_path = parsed.path.split(f"/static/{settings.POST_IMAGES_BUCKET}/")[1].lstrip("/")
        else:
            raise InvalidInputError(
                code="INVALID_IMAGE_OWNERSHIP",
                detail="URL gambar harus berasal dari penyimpanan resmi CampusFolio bucket post-images.",
            )

        norm_path = os.path.normpath(rel_path).replace("\\", "/")
        if ".." in norm_path.split("/") or not norm_path.startswith(expected_prefix):
            raise InvalidInputError(
                code="INVALID_IMAGE_OWNERSHIP",
                detail="Anda hanya dapat menggunakan foto yang diunggah oleh akun Anda sendiri.",
            )
        return norm_path

    # If it's already a relative path
    rel_path = cleaned.lstrip("/")
    norm_path = os.path.normpath(rel_path).replace("\\", "/")
    if ".." in norm_path.split("/") or not norm_path.startswith(expected_prefix):
        raise InvalidInputError(
            code="INVALID_IMAGE_OWNERSHIP",
            detail="Path gambar tidak valid atau bukan milik akun Anda.",
        )
    return norm_path


def build_image_public_url(path: Optional[str]) -> Optional[str]:
    """Generates a full public URL for an image path."""
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return storage_service.get_public_url(settings.POST_IMAGES_BUCKET, path)


def format_post_detail(post: Post, current_user: User) -> PostDetailResponse:
    """
    Formats a Post model into PostDetailResponse.
    Implements status masking and moderation notes privacy protection.
    """
    is_owner = (current_user.user_id == post.user_id)
    is_staff = can_moderate(current_user, post.user.jurusan if post.user else None)

    # 1. Status Masking for public viewers:
    # If a post has status 'direview' (currently reported), mask as 'tayang' for general public
    display_status = post.status
    if not (is_owner or is_staff) and display_status == "direview":
        display_status = "tayang"

    # 2. Moderation Note & AI Explanation Privacy:
    # Only owner or authorized staff can view the moderation note
    moderation_note = None
    if is_owner or is_staff:
        if post.moderation_records:
            # Sort by created_at descending to get the latest record
            latest_rec = sorted(post.moderation_records, key=lambda r: r.created_at, reverse=True)[0]
            moderation_note = latest_rec.catatan_admin or latest_rec.penjelasan_ai

    # 3. Action permissions
    can_edit = is_owner and (post.status in ("draft", "revisi", "ditolak"))
    can_takedown = is_staff and not is_owner
    can_report = not is_owner and not is_staff

    # 4. Author detail
    author_info = PostAuthorResponse(
        user_id=post.user.user_id,
        nama=post.user.nama,
        jurusan=post.user.jurusan,
        angkatan=post.user.angkatan,
        role=post.user.role,
    )

    # 5. Skills tags
    skill_tags = [
        PostSkillTagResponse(
            skill_id=ps.skill.skill_id,
            nama=ps.skill.nama,
            tipe=ps.skill.tipe,
        )
        for ps in post.skills
        if ps.skill is not None
    ]

    return PostDetailResponse(
        post_id=post.post_id,
        user_id=post.user_id,
        author=author_info,
        isi=post.isi,
        gambar_url=build_image_public_url(post.gambar_url),
        tipe=post.tipe,
        status=display_status,
        is_deleted=post.is_deleted,
        created_at=post.created_at,
        skills=skill_tags,
        moderation_note=moderation_note,
        is_owner=is_owner,
        can_takedown=can_takedown,
        can_report=can_report,
        can_edit=can_edit,
    )


async def execute_ai_prescreening(
    post_id: int,
    content: str,
    moderator: ContentModerator,
) -> Tuple[str, Optional[str], Optional[str], Optional[float], Optional[str]]:
    """
    Executes AI text classification outside of DB transactions with timeout protection.
    Returns: (target_status, label_ai, kategori_ai, confidence, penjelasan_ai)
    """
    try:
        # Run synchronous moderate_text in async thread pool with timeout
        result = await asyncio.wait_for(
            asyncio.to_thread(moderator.moderate_text, post_id=str(post_id), content=content),
            timeout=settings.AI_TIMEOUT_SECONDS,
        )

        label_ai = result.label
        kategori_ai = ", ".join(result.categories) if result.categories else None
        confidence = result.confidence
        penjelasan_ai = result.explanation

        # Decision threshold check (AD-01)
        if label_ai == "aman" and (confidence is not None and confidence >= settings.AI_SAFE_THRESHOLD):
            target_status = "tayang"
        else:
            target_status = "menunggu_review"

        return target_status, label_ai, kategori_ai, confidence, penjelasan_ai

    except asyncio.TimeoutError:
        logger.warning(f"AI moderation timed out for post #{post_id} after {settings.AI_TIMEOUT_SECONDS}s.")
        return (
            "menunggu_review",
            None,
            "timeout",
            None,
            f"AI classification timed out (> {settings.AI_TIMEOUT_SECONDS}s); routed to human review.",
        )
    except Exception as exc:
        logger.exception(f"AI moderation failed unexpectedly for post #{post_id}: {exc}")
        return (
            "menunggu_review",
            None,
            "error",
            None,
            f"AI evaluation failed: {exc}; routed to human review.",
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post(
    "",
    response_model=PostDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat Postingan Baru dengan Moderasi Otomatis AI (AD-01)",
)
async def create_post(
    payload: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    moderator: ContentModerator = Depends(get_moderator_engine),
):
    # 1. Validate image ownership & canonicalize path
    canonical_image_path = validate_and_canonicalize_image_path(
        payload.gambar_url, current_user.user_id
    )

    # 2. Validate skill IDs existence in DB
    valid_skills = []
    if payload.skill_ids:
        valid_skills = db.query(Skill).filter(Skill.skill_id.in_(payload.skill_ids)).all()
        if len(valid_skills) != len(payload.skill_ids):
            found_ids = {s.skill_id for s in valid_skills}
            missing = set(payload.skill_ids) - found_ids
            raise InvalidInputError(
                code="INVALID_SKILL_ID",
                detail=f"Tag keahlian dengan ID {list(missing)} tidak ditemukan.",
            )

    # -------------------------------------------------------------------------
    # PHASE 1: Save Initial Post as 'draft' and Release DB Connection
    # -------------------------------------------------------------------------
    new_post = Post(
        user_id=current_user.user_id,
        isi=payload.isi,
        gambar_url=canonical_image_path,
        tipe=payload.tipe,
        status="draft",
    )
    db.add(new_post)
    db.flush()  # Generate post_id

    # Associate post skills
    for skill in valid_skills:
        db.add(PostSkill(post_id=new_post.post_id, skill_id=skill.skill_id))

    db.commit()
    db.refresh(new_post)
    post_id = new_post.post_id

    # -------------------------------------------------------------------------
    # PHASE 2: Execute AI Pre-screening Outside DB Transaction
    # -------------------------------------------------------------------------
    target_status, label_ai, kategori_ai, confidence, penjelasan_ai = await execute_ai_prescreening(
        post_id=post_id,
        content=new_post.isi,
        moderator=moderator,
    )

    # -------------------------------------------------------------------------
    # PHASE 3: Update Post Status and Record Audit Trail
    # -------------------------------------------------------------------------
    post = db.query(Post).filter(Post.post_id == post_id).first()
    if not post:
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    post.status = target_status

    mod_record = ModerationRecord(
        post_id=post.post_id,
        label_ai=label_ai,
        kategori_ai=kategori_ai,
        confidence=confidence,
        penjelasan_ai=penjelasan_ai,
    )
    db.add(mod_record)
    db.commit()
    db.refresh(post)

    return format_post_detail(post, current_user)


@router.get(
    "/me",
    response_model=PostFeedResponse,
    summary="Ambil Seluruh Postingan Milik Sendiri (Draft, Menunggu Review, Tayang, Revisi)",
)
def get_my_posts(
    limit: int = Query(10, ge=1, le=50, description="Jumlah postingan per halaman"),
    cursor: Optional[str] = Query(None, description="Opaque cursor untuk pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Post)
        .options(
            joinedload(Post.user),
            selectinload(Post.skills).joinedload(PostSkill.skill),
            selectinload(Post.moderation_records),
        )
        .filter(
            Post.user_id == current_user.user_id,
            Post.is_deleted == False,  # noqa: E712
        )
    )

    # Apply keyset pagination if cursor provided
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            cursor_time, cursor_id = decoded
            query = query.filter(
                or_(
                    Post.created_at < cursor_time,
                    and_(Post.created_at == cursor_time, Post.post_id < cursor_id),
                )
            )

    query = query.order_by(Post.created_at.desc(), Post.post_id.desc())
    posts_batch = query.limit(limit + 1).all()

    has_more = len(posts_batch) > limit
    items_to_return = posts_batch[:limit]

    next_cursor = None
    if has_more and items_to_return:
        last_item = items_to_return[-1]
        next_cursor = encode_cursor(last_item.created_at, last_item.post_id)

    formatted_items = [format_post_detail(p, current_user) for p in items_to_return]

    return PostFeedResponse(
        items=formatted_items,
        has_more=has_more,
        next_cursor=next_cursor,
    )


@router.get(
    "",
    response_model=PostFeedResponse,
    summary="Linimasa Feed Postingan Kampus (Keyset Pagination & Scope Filtering)",
)
def get_posts_feed(
    scope: Literal["all", "friends", "recruiting"] = Query("all", description="Cakupan linimasa"),
    skill_id: Optional[int] = Query(None, description="Filter berdasarkan ID keahlian"),
    limit: int = Query(10, ge=1, le=50, description="Batas jumlah item"),
    cursor: Optional[str] = Query(None, description="Opaque keyset cursor untuk navigasi"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    viewer_id = current_user.user_id

    # 1. Base Query: Public visible posts (status 'tayang' or 'direview') and not deleted
    query = (
        db.query(Post)
        .options(
            joinedload(Post.user),
            selectinload(Post.skills).joinedload(PostSkill.skill),
            selectinload(Post.moderation_records),
        )
        .filter(
            Post.is_deleted == False,  # noqa: E712
            Post.status.in_(["tayang", "direview"]),
        )
    )

    # 2. Mutual Block Exclusion using NOT EXISTS
    block_subquery = (
        db.query(UserBlock.block_id)
        .filter(
            or_(
                and_(UserBlock.blocker_id == viewer_id, UserBlock.blocked_id == Post.user_id),
                and_(UserBlock.blocker_id == Post.user_id, UserBlock.blocked_id == viewer_id),
            )
        )
    )
    query = query.filter(~block_subquery.exists())

    # 3. Scope Filtering
    if scope == "recruiting":
        query = query.filter(Post.tipe == "cari_anggota")
    elif scope == "friends":
        # Two-way friendship check: status must be 'diterima'
        friend_subquery = (
            db.query(Friendship.friendship_id)
            .filter(
                Friendship.status == "diterima",
                or_(
                    and_(Friendship.requester_id == viewer_id, Friendship.addressee_id == Post.user_id),
                    and_(Friendship.addressee_id == viewer_id, Friendship.requester_id == Post.user_id),
                ),
            )
        )
        # Include friends' posts OR current user's own posts
        query = query.filter(or_(Post.user_id == viewer_id, friend_subquery.exists()))

    # 4. Optional Skill Filter
    if skill_id is not None:
        query = query.join(PostSkill, Post.post_id == PostSkill.post_id).filter(
            PostSkill.skill_id == skill_id
        )

    # 5. Keyset Cursor Filter (created_at DESC, post_id DESC)
    if cursor:
        decoded = decode_cursor(cursor)
        if decoded:
            cursor_time, cursor_id = decoded
            query = query.filter(
                or_(
                    Post.created_at < cursor_time,
                    and_(Post.created_at == cursor_time, Post.post_id < cursor_id),
                )
            )

    query = query.order_by(Post.created_at.desc(), Post.post_id.desc())
    posts_batch = query.limit(limit + 1).all()

    has_more = len(posts_batch) > limit
    items_to_return = posts_batch[:limit]

    next_cursor = None
    if has_more and items_to_return:
        last_item = items_to_return[-1]
        next_cursor = encode_cursor(last_item.created_at, last_item.post_id)

    formatted_items = [format_post_detail(p, current_user) for p in items_to_return]

    return PostFeedResponse(
        items=formatted_items,
        has_more=has_more,
        next_cursor=next_cursor,
    )


@router.get(
    "/{id}",
    response_model=PostDetailResponse,
    summary="Ambil Detail Satu Postingan",
)
def get_post_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = (
        db.query(Post)
        .options(
            joinedload(Post.user),
            selectinload(Post.skills).joinedload(PostSkill.skill),
            selectinload(Post.moderation_records),
        )
        .filter(Post.post_id == id, Post.is_deleted == False)  # noqa: E712
        .first()
    )
    if not post:
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    # Mutual block check (anti-leak)
    if is_target_blocking_viewer(db, current_user.user_id, post.user_id) or is_viewer_blocking_target(
        db, current_user.user_id, post.user_id
    ):
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    is_owner = (current_user.user_id == post.user_id)
    is_staff = can_moderate(current_user, post.user.jurusan if post.user else None)

    # If post is not published/public, only owner or authorized staff can access
    if post.status not in ("tayang", "direview") and not (is_owner or is_staff):
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    return format_post_detail(post, current_user)


@router.patch(
    "/{id}",
    response_model=PostDetailResponse,
    summary="Perbarui Postingan (Hanya untuk Status Draft, Revisi, atau Ditolak)",
)
async def update_post(
    id: int,
    payload: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    moderator: ContentModerator = Depends(get_moderator_engine),
):
    post = db.query(Post).filter(Post.post_id == id, Post.is_deleted == False).first()  # noqa: E712
    if not post:
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan.")

    # 1. Author-only permission
    if post.user_id != current_user.user_id:
        raise ForbiddenError(code="FORBIDDEN_POST_EDIT", detail="Anda tidak memiliki izin mengedit postingan ini.")

    # 2. Status guard: only draft, revisi, or ditolak can be updated
    if post.status in ("tayang", "menunggu_review"):
        raise ConflictError(
            code="POST_STATE_CONFLICT",
            detail=f"Postingan dengan status '{post.status}' tidak dapat diedit.",
        )

    # 3. Update text content
    if payload.isi is not None:
        post.isi = payload.isi

    # 4. Update image
    if payload.gambar_url is not None:
        post.gambar_url = validate_and_canonicalize_image_path(
            payload.gambar_url, current_user.user_id
        )

    # 5. Update type
    if payload.tipe is not None:
        post.tipe = payload.tipe

    # 6. Update skills if provided
    if payload.skill_ids is not None:
        if post.tipe == "cari_anggota" and len(payload.skill_ids) == 0:
            raise InvalidInputError(
                code="SKILL_REQUIRED_FOR_RECRUITMENT",
                detail="Postingan rekrutmen tim wajib menyertakan minimal 1 tag keahlian.",
            )

        valid_skills = db.query(Skill).filter(Skill.skill_id.in_(payload.skill_ids)).all()
        if len(valid_skills) != len(payload.skill_ids):
            found_ids = {s.skill_id for s in valid_skills}
            missing = set(payload.skill_ids) - found_ids
            raise InvalidInputError(
                code="INVALID_SKILL_ID",
                detail=f"Tag keahlian dengan ID {list(missing)} tidak ditemukan.",
            )

        # Clear old post skills and re-add
        db.query(PostSkill).filter(PostSkill.post_id == post.post_id).delete()
        for skill in valid_skills:
            db.add(PostSkill(post_id=post.post_id, skill_id=skill.skill_id))

    # Commit phase 1 changes as draft before re-running AI
    post.status = "draft"
    db.commit()
    db.refresh(post)

    # Re-run AI Pre-screening
    target_status, label_ai, kategori_ai, confidence, penjelasan_ai = await execute_ai_prescreening(
        post_id=post.post_id,
        content=post.isi,
        moderator=moderator,
    )

    post.status = target_status
    mod_record = ModerationRecord(
        post_id=post.post_id,
        label_ai=label_ai,
        kategori_ai=kategori_ai,
        confidence=confidence,
        penjelasan_ai=penjelasan_ai,
    )
    db.add(mod_record)
    db.commit()
    db.refresh(post)

    return format_post_detail(post, current_user)
