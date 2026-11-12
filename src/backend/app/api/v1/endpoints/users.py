from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictError, ForbiddenError, InvalidInputError, NotFoundError
from app.core.normalizers import normalize_jurusan
from app.core.security import can_moderate, get_current_user
from app.models.entities import PortfolioItem, PortfolioSkill, Skill, User, UserSkill
from app.schemas.portfolio import (
    PortfolioPublicResponse,
    SkillBriefResponse,
    SkpiSummaryResponse,
    mask_document_number,
)
from app.schemas.profile import (
    MyProfileResponse,
    PublicProfileResponse,
    UpdateProfileRequest,
    UpdateUserSkillsRequest,
    UserSkillResponse,
)
from app.services.friendship import get_friendship_relation
from app.services.skpi_calculator import calculate_skpi_summary
from app.services.visibility import is_target_blocking_viewer, is_viewer_blocking_target

router = APIRouter()


def get_user_skills(db: Session, user_id: int) -> List[UserSkillResponse]:
    rows = (
        db.query(UserSkill, Skill)
        .join(Skill, UserSkill.skill_id == Skill.skill_id)
        .filter(UserSkill.user_id == user_id)
        .all()
    )
    return [
        UserSkillResponse(
            skill_id=s.skill_id,
            nama=s.nama,
            tipe=s.tipe,
            level=us.level or "pemula",
        )
        for us, s in rows
    ]


@router.get("/me", response_model=MyProfileResponse, summary="Ambil Profil Pengguna Aktif Beserta Skills")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skills = get_user_skills(db, current_user.user_id)
    return MyProfileResponse(
        user_id=current_user.user_id,
        nim=current_user.nim,
        nama=current_user.nama,
        email=current_user.email,
        role=current_user.role,
        jurusan=current_user.jurusan,
        angkatan=current_user.angkatan,
        bio=current_user.bio,
        kontak_url=current_user.kontak_url,
        created_at=current_user.created_at,
        skills=skills,
    )


@router.patch("/me", response_model=MyProfileResponse, summary="Perbarui Data Profil Mandiri")
def update_my_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)

    if "jurusan" in data:
        # RBAC Protection: Moderator and Admin cannot change their own department via profile
        if current_user.role in ("moderator", "admin"):
            raise ForbiddenError(
                code="FORBIDDEN_OPERATION",
                detail="Moderator dan Admin tidak diizinkan mengubah jurusan sendiri melalui profil. Perubahan harus dilakukan oleh Administrator melalui manajemen staf.",
            )

        if data["jurusan"] is not None:
            norm_jurusan = normalize_jurusan(data["jurusan"], "mahasiswa")
            if not norm_jurusan:
                raise InvalidInputError(
                    code="INVALID_DEPARTMENT",
                    detail=f"Jurusan '{data['jurusan']}' tidak terdaftar dalam program studi resmi kampus",
                )
            data["jurusan"] = norm_jurusan

        # Department locking if student has active or verified portfolios (M07)
        if data.get("jurusan") != current_user.jurusan:
            has_locked_portfolio = (
                db.query(PortfolioItem.portfolio_id)
                .filter(
                    PortfolioItem.user_id == current_user.user_id,
                    PortfolioItem.status_verifikasi.in_(["menunggu_review", "terverifikasi"]),
                )
                .first()
            )
            if has_locked_portfolio:
                raise ConflictError(
                    code="DEPARTMENT_LOCKED_ACTIVE_PORTFOLIO",
                    detail="Jurusan tidak dapat diubah karena Anda memiliki portofolio yang sedang dalam antrean review atau telah terverifikasi resmi.",
                )

    if "nama" in data and not data["nama"]:
        raise InvalidInputError(code="INVALID_NAME", detail="Nama tidak boleh kosong")

    for field, value in data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    skills = get_user_skills(db, current_user.user_id)
    return MyProfileResponse(
        user_id=current_user.user_id,
        nim=current_user.nim,
        nama=current_user.nama,
        email=current_user.email,
        role=current_user.role,
        jurusan=current_user.jurusan,
        angkatan=current_user.angkatan,
        bio=current_user.bio,
        kontak_url=current_user.kontak_url,
        created_at=current_user.created_at,
        skills=skills,
    )


@router.put("/me/skills", response_model=List[UserSkillResponse], summary="Perbarui Seluruh Keahlian & Minat Mahasiswa")
def update_my_skills(
    payload: UpdateUserSkillsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_skills = []
    seen_skill_ids = set()

    for item in payload.items:
        skill = None
        if item.skill_id is not None:
            skill = db.query(Skill).filter(Skill.skill_id == item.skill_id).first()
            if not skill:
                raise NotFoundError(
                    code="SKILL_NOT_FOUND",
                    detail=f"Keahlian dengan ID {item.skill_id} tidak ditemukan di master data",
                )
        elif item.nama:
            # Case-insensitive lookup
            skill = (
                db.query(Skill)
                .filter(func.lower(Skill.nama) == func.lower(item.nama))
                .first()
            )
            if not skill:
                try:
                    with db.begin_nested():
                        skill = Skill(nama=item.nama, tipe=item.tipe)
                        db.add(skill)
                        db.flush()
                except IntegrityError:
                    # Handled concurrent creation
                    skill = (
                        db.query(Skill)
                        .filter(func.lower(Skill.nama) == func.lower(item.nama))
                        .first()
                    )

        if skill:
            if skill.skill_id in seen_skill_ids:
                raise InvalidInputError(
                    code="DUPLICATE_SKILL",
                    detail=f"Keahlian '{skill.nama}' duplikat dalam permintaan",
                )
            seen_skill_ids.add(skill.skill_id)
            target_skills.append((skill.skill_id, skill.nama, skill.tipe, item.level))

    # Atomic Replacement
    db.query(UserSkill).filter(UserSkill.user_id == current_user.user_id).delete()

    for sid, _, _, lvl in target_skills:
        db.add(UserSkill(user_id=current_user.user_id, skill_id=sid, level=lvl))

    db.commit()

    return [
        UserSkillResponse(skill_id=sid, nama=snama, tipe=stipe, level=lvl)
        for sid, snama, stipe, lvl in target_skills
    ]


@router.get("/{id}", response_model=PublicProfileResponse, summary="Ambil Profil Publik Mahasiswa")
def get_user_public_profile(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = db.query(User).filter(User.user_id == id).first()
    if not target_user:
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan")

    is_staff_viewer = current_user.role in ("moderator", "admin")

    # If target has blocked viewer, return 404 to avoid leaking block status (anti-leak)
    # Exemption: Staff (moderator/admin) can always view profiles for verification/moderation
    if not is_staff_viewer and is_target_blocking_viewer(db, viewer_id=current_user.user_id, target_id=id):
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan")

    # If viewer has blocked target, return restricted profile so viewer can unblock
    blocked_by_me = is_viewer_blocking_target(db, viewer_id=current_user.user_id, target_id=id)
    if blocked_by_me and not is_staff_viewer:
        return PublicProfileResponse(
            user_id=target_user.user_id,
            nama=target_user.nama,
            role=target_user.role,
            created_at=target_user.created_at,
            friendship_status="none",
            friendship_id=None,
            friendship_direction=None,
            blocked_by_me=True,
            skills=[],
            bio=None,
            kontak_url=None,
            jurusan=None,
            angkatan=None,
            nim=None,
            email=None,
        )

    # Fetch skills
    skills = get_user_skills(db, id)

    friendship_status, friendship_id, friendship_direction = get_friendship_relation(
        db, viewer_id=current_user.user_id, target_id=id
    )

    # Privacy Protection:
    # NIM & Email are ONLY visible to the owner themselves, Kaprodi of the same department, or Admin
    can_view_sensitive = (current_user.user_id == target_user.user_id) or can_moderate(
        current_user, target_user.jurusan
    )

    return PublicProfileResponse(
        user_id=target_user.user_id,
        nama=target_user.nama,
        jurusan=target_user.jurusan,
        angkatan=target_user.angkatan,
        bio=target_user.bio,
        kontak_url=target_user.kontak_url,
        role=target_user.role,
        created_at=target_user.created_at,
        skills=skills,
        friendship_status=friendship_status,
        friendship_id=friendship_id,
        friendship_direction=friendship_direction,
        blocked_by_me=blocked_by_me,
        nim=target_user.nim if can_view_sensitive else None,
        email=target_user.email if can_view_sensitive else None,
    )


@router.get("/{id}/skpi-summary", response_model=SkpiSummaryResponse, summary="Ambil Ringkasan Poin SKPI Resmi & Capaian Mahasiswa")
def get_user_skpi_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = db.query(User).filter(User.user_id == id).first()
    if not target_user:
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan")

    is_staff_viewer = current_user.role in ("moderator", "admin")

    # Anti-leak mutual block
    if not is_staff_viewer and is_target_blocking_viewer(db, viewer_id=current_user.user_id, target_id=id):
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan")

    is_owner = current_user.user_id == target_user.user_id
    can_view_private = is_owner or (is_staff_viewer and can_moderate(current_user, target_user.jurusan))

    # Fetch portfolios of target user
    items_query = (
        db.query(PortfolioItem)
        .options(
            selectinload(PortfolioItem.skills).joinedload(PortfolioSkill.skill),
        )
        .filter(PortfolioItem.user_id == id)
        .order_by(PortfolioItem.created_at.desc())
    )

    all_items = items_query.all()
    skpi_calc = calculate_skpi_summary(all_items)

    public_items = []
    for item in all_items:
        if item.status_verifikasi == "terverifikasi" or (item.kategori == "proyek" and item.status_verifikasi != "menunggu_review"):
            skills = [
                SkillBriefResponse(
                    skill_id=ps.skill.skill_id,
                    nama=ps.skill.nama,
                    kategori=ps.skill.tipe,
                )
                for ps in item.skills
                if ps.skill is not None
            ]
            public_items.append(
                PortfolioPublicResponse(
                    portfolio_id=item.portfolio_id,
                    user_id=item.user_id,
                    judul=item.judul,
                    deskripsi=item.deskripsi,
                    tautan_url=item.tautan_url,
                    gambar_url=item.gambar_url,
                    kategori=item.kategori,
                    nomor_dokumen=mask_document_number(item.nomor_dokumen) if item.kategori != "proyek" else None,
                    penerbit=item.penerbit,
                    tanggal_terbit=item.tanggal_terbit,
                    has_file=bool(item.file_url),
                    status_verifikasi=item.status_verifikasi,
                    created_at=item.created_at,
                    skills=skills,
                )
            )

    return SkpiSummaryResponse(
        user_id=id,
        total_poin=skpi_calc["total_poin"],
        total_terverifikasi=skpi_calc["total_terverifikasi"],
        menunggu_review=skpi_calc["total_menunggu"] if can_view_private else None,
        jumlah_per_kategori=skpi_calc["jumlah_per_kategori"],
        poin_per_kategori=skpi_calc["poin_per_kategori"],
        items=public_items,
    )
