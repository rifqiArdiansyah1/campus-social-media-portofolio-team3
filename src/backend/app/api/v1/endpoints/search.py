import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import InvalidInputError
from app.core.security import get_current_user
from app.models.entities import (
    Friendship,
    PortfolioItem,
    PortfolioSkill,
    Post,
    PostSkill,
    Skill,
    User,
    UserSkill,
)
from app.schemas.search import (
    PortfolioSearchResult,
    PostSearchResult,
    SearchResponse,
    SearchSkillItem,
    StudentSearchResult,
)
from app.services.storage import storage_service
from app.services.visibility import exclude_hidden

logger = logging.getLogger(__name__)

router = APIRouter()


def _format_post_image_url(path: Optional[str]) -> Optional[str]:
    """Helper to generate public URL for post image if relative path is stored."""
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return storage_service.get_public_url(settings.POST_IMAGES_BUCKET, path)


@router.get(
    "",
    response_model=SearchResponse,
    summary="Pencarian Terpadu Mahasiswa, Postingan, dan Portofolio (US-05, UC-10)",
)
def search_entities(
    q: Optional[str] = Query(None, max_length=100, description="Kata kunci teks pencarian"),
    tipe: str = Query("mahasiswa", pattern="^(mahasiswa|postingan|portofolio)$", description="Tipe entitas yang dicari"),
    skill_id: Optional[int] = Query(None, description="Filter berdasarkan ID keahlian"),
    jurusan: Optional[str] = Query(None, max_length=100, description="Filter program studi"),
    limit: int = Query(20, ge=1, le=50, description="Jumlah data per halaman (1-50)"),
    offset: int = Query(0, ge=0, description="Offset data untuk pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint Pencarian Terpadu:
    - Mahasiswa: Mencocokkan nama, bio, dan keahlian/minat. Mendukung filter jurusan & skill_id.
    - Postingan: Hanya postingan tayang dan belum dihapus. Mencocokkan teks narasi (isi) & post_skills.
    - Portofolio: Hanya karya publik berstatus terverifikasi. Mencocokkan judul, deskripsi, & skill.
    - Proteksi Blokir Timbal Balik: Seluruh entitas menyaring akun yang diblokir dua arah (exclude_hidden).
    - Validasi: q kosong dengan filter tetap valid; q dan filter kosong semua menghasilkan 422.
    """
    clean_q = q.strip() if q else None
    clean_jurusan = jurusan.strip() if jurusan else None

    # Validasi: Minimal salah satu dari q, skill_id, atau jurusan harus terisi
    if not clean_q and skill_id is None and not clean_jurusan:
        raise InvalidInputError(
            code="QUERY_OR_FILTER_REQUIRED",
            detail="Kata kunci pencarian (q), filter skill_id, atau filter jurusan wajib diisi minimal satu.",
        )

    # =========================================================================
    # 1. TIPE: MAHASISWA
    # =========================================================================
    if tipe == "mahasiswa":
        query = (
            db.query(User)
            .options(
                selectinload(User.skills).joinedload(UserSkill.skill),
            )
            .filter(
                User.role == "mahasiswa",
            )
        )

        # Proteksi blokir timbal balik (M06)
        query = exclude_hidden(query, current_user.user_id, User.user_id)

        if clean_jurusan:
            query = query.filter(User.jurusan.ilike(f"%{clean_jurusan}%"))

        if skill_id is not None:
            query = query.filter(User.skills.any(UserSkill.skill_id == skill_id))

        if clean_q:
            query = query.filter(
                or_(
                    User.nama.ilike(f"%{clean_q}%"),
                    User.bio.ilike(f"%{clean_q}%"),
                    User.skills.any(UserSkill.skill.has(Skill.nama.ilike(f"%{clean_q}%"))),
                )
            )

        total = query.count()

        # Urutan: kecocokan nama diutamakan jika q ada, lalu created_at DESC, user_id DESC
        if clean_q:
            query = query.order_by(
                case((User.nama.ilike(f"%{clean_q}%"), 0), else_=1).asc(),
                User.created_at.desc(),
                User.user_id.desc(),
            )
        else:
            query = query.order_by(User.created_at.desc(), User.user_id.desc())

        users = query.offset(offset).limit(limit).all()

        # Ambil status pertemanan dalam satu kueri batch efisien
        student_ids = [u.user_id for u in users]
        friendship_map = {}
        if student_ids:
            friendships = (
                db.query(Friendship)
                .filter(
                    or_(
                        and_(
                            Friendship.requester_id == current_user.user_id,
                            Friendship.addressee_id.in_(student_ids),
                        ),
                        and_(
                            Friendship.addressee_id == current_user.user_id,
                            Friendship.requester_id.in_(student_ids),
                        ),
                    )
                )
                .all()
            )
            for f in friendships:
                other_id = f.addressee_id if f.requester_id == current_user.user_id else f.requester_id
                friendship_map[other_id] = f.status

        student_items = []
        for u in users:
            skills_list = []
            if u.skills:
                for us in u.skills:
                    if us.skill:
                        skills_list.append(
                            SearchSkillItem(
                                skill_id=us.skill.skill_id,
                                nama=us.skill.nama,
                                tipe=us.skill.tipe or "skill",
                            )
                        )
            student_items.append(
                StudentSearchResult(
                    user_id=u.user_id,
                    nama=u.nama,
                    nim=u.nim,
                    jurusan=u.jurusan,
                    angkatan=u.angkatan,
                    bio=u.bio,
                    kontak_url=u.kontak_url,
                    skills=skills_list,
                    friendship_status=friendship_map.get(u.user_id),
                    created_at=u.created_at,
                )
            )

        return SearchResponse(
            total=total,
            limit=limit,
            offset=offset,
            tipe="mahasiswa",
            items=student_items,
        )

    # =========================================================================
    # 2. TIPE: POSTINGAN
    # =========================================================================
    elif tipe == "postingan":
        query = (
            db.query(Post)
            .options(
                joinedload(Post.user),
                selectinload(Post.skills).joinedload(PostSkill.skill),
            )
            .filter(
                Post.status == "tayang",
                Post.is_deleted == False,  # noqa: E712
            )
        )

        # Proteksi blokir timbal balik terhadap penulis post
        query = exclude_hidden(query, current_user.user_id, Post.user_id)

        if clean_jurusan:
            query = query.filter(Post.user.has(User.jurusan.ilike(f"%{clean_jurusan}%")))

        if skill_id is not None:
            query = query.filter(Post.skills.any(PostSkill.skill_id == skill_id))

        if clean_q:
            query = query.filter(Post.isi.ilike(f"%{clean_q}%"))

        total = query.count()
        posts = query.order_by(Post.created_at.desc(), Post.post_id.desc()).offset(offset).limit(limit).all()

        post_items = []
        for p in posts:
            skills_list = []
            if p.skills:
                for ps in p.skills:
                    if ps.skill:
                        skills_list.append(
                            SearchSkillItem(
                                skill_id=ps.skill.skill_id,
                                nama=ps.skill.nama,
                                tipe=ps.skill.tipe or "skill",
                            )
                        )
            post_items.append(
                PostSearchResult(
                    post_id=p.post_id,
                    user_id=p.user_id,
                    author_nama=p.user.nama if p.user else "Anonim",
                    author_jurusan=p.user.jurusan if p.user else None,
                    isi=p.isi,
                    gambar_url=_format_post_image_url(p.gambar_url),
                    tipe=p.tipe,
                    skills=skills_list,
                    created_at=p.created_at,
                )
            )

        return SearchResponse(
            total=total,
            limit=limit,
            offset=offset,
            tipe="postingan",
            items=post_items,
        )

    # =========================================================================
    # 3. TIPE: PORTOFOLIO
    # =========================================================================
    else:  # portofolio
        query = (
            db.query(PortfolioItem)
            .options(
                joinedload(PortfolioItem.user),
                selectinload(PortfolioItem.skills).joinedload(PortfolioSkill.skill),
            )
            .filter(
                PortfolioItem.status_verifikasi == "terverifikasi",
            )
        )

        # Proteksi blokir timbal balik terhadap pemilik portofolio
        query = exclude_hidden(query, current_user.user_id, PortfolioItem.user_id)

        if clean_jurusan:
            query = query.filter(PortfolioItem.user.has(User.jurusan.ilike(f"%{clean_jurusan}%")))

        if skill_id is not None:
            query = query.filter(PortfolioItem.skills.any(PortfolioSkill.skill_id == skill_id))

        if clean_q:
            query = query.filter(
                or_(
                    PortfolioItem.judul.ilike(f"%{clean_q}%"),
                    PortfolioItem.deskripsi.ilike(f"%{clean_q}%"),
                )
            )

        total = query.count()
        portfolios = (
            query.order_by(PortfolioItem.created_at.desc(), PortfolioItem.portfolio_id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        portfolio_items = []
        for item in portfolios:
            skills_list = []
            if item.skills:
                for p_skill in item.skills:
                    if p_skill.skill:
                        skills_list.append(
                            SearchSkillItem(
                                skill_id=p_skill.skill.skill_id,
                                nama=p_skill.skill.nama,
                                tipe=p_skill.skill.tipe or "skill",
                            )
                        )
            portfolio_items.append(
                PortfolioSearchResult(
                    portfolio_id=item.portfolio_id,
                    user_id=item.user_id,
                    author_nama=item.user.nama if item.user else "Anonim",
                    author_jurusan=item.user.jurusan if item.user else None,
                    judul=item.judul,
                    deskripsi=item.deskripsi,
                    kategori=item.kategori,
                    tautan_url=item.tautan_url,
                    gambar_url=item.gambar_url,
                    status_verifikasi=item.status_verifikasi,
                    skills=skills_list,
                    created_at=item.created_at,
                )
            )

        return SearchResponse(
            total=total,
            limit=limit,
            offset=offset,
            tipe="portofolio",
            items=portfolio_items,
        )
