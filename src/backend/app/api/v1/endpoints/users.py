from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ForbiddenError, InvalidInputError, NotFoundError
from app.core.normalizers import normalize_jurusan
from app.core.security import can_moderate, get_current_user
from app.models.entities import Skill, User, UserSkill
from app.schemas.auth import UserProfileResponse
from app.schemas.profile import (
    PublicProfileResponse,
    UpdateProfileRequest,
    UpdateUserSkillsRequest,
    UserSkillResponse,
)
from app.services.friendship import get_friendship_status
from app.services.visibility import is_target_blocking_viewer, is_viewer_blocking_target

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse, summary="Ambil Profil Pengguna Aktif")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return UserProfileResponse.model_validate(current_user)


@router.patch("/me", response_model=UserProfileResponse, summary="Perbarui Data Profil Mandiri")
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

    if "nama" in data and not data["nama"]:
        raise InvalidInputError(code="INVALID_NAME", detail="Nama tidak boleh kosong")

    for field, value in data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return UserProfileResponse.model_validate(current_user)


@router.put("/me/skills", response_model=List[UserSkillResponse], summary="Perbarui Seluruh Keahlian & Minat Mahasiswa")
def update_my_skills(
    payload: UpdateUserSkillsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_skills = []

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
                skill = Skill(nama=item.nama, tipe=item.tipe)
                db.add(skill)
                try:
                    db.flush()
                except IntegrityError:
                    db.rollback()
                    # Handled concurrent creation
                    skill = (
                        db.query(Skill)
                        .filter(func.lower(Skill.nama) == func.lower(item.nama))
                        .first()
                    )

        if skill:
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

    # If target has blocked viewer, return 404 to avoid leaking block status
    if is_target_blocking_viewer(db, viewer_id=current_user.user_id, target_id=id):
        raise NotFoundError(code="USER_NOT_FOUND", detail="Pengguna tidak ditemukan")

    # If viewer has blocked target, return restricted profile so viewer can unblock
    blocked_by_me = is_viewer_blocking_target(db, viewer_id=current_user.user_id, target_id=id)
    if blocked_by_me:
        return PublicProfileResponse(
            user_id=target_user.user_id,
            nama=target_user.nama,
            role=target_user.role,
            created_at=target_user.created_at,
            friendship_status="none",
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
    user_skills_rows = (
        db.query(UserSkill, Skill)
        .join(Skill, UserSkill.skill_id == Skill.skill_id)
        .filter(UserSkill.user_id == id)
        .all()
    )
    skills = [
        UserSkillResponse(
            skill_id=s.skill_id,
            nama=s.nama,
            tipe=s.tipe,
            level=us.level or "pemula",
        )
        for us, s in user_skills_rows
    ]

    friendship_status = get_friendship_status(
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
        blocked_by_me=False,
        nim=target_user.nim if can_view_sensitive else None,
        email=target_user.email if can_view_sensitive else None,
    )
