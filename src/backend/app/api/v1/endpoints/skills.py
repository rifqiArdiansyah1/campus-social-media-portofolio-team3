from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Skill
from app.schemas.profile import SkillResponse

router = APIRouter()


@router.get("", response_model=List[SkillResponse], summary="Daftar Master Keahlian & Minat")
def get_skills(
    tipe: Optional[Literal["skill", "minat"]] = Query(
        None, description="Filter berdasarkan kategori tag ('skill' atau 'minat')"
    ),
    q: Optional[str] = Query(
        None, description="Pencarian nama keahlian/minat (case-insensitive)"
    ),
    limit: int = Query(
        50, ge=1, le=100, description="Jumlah maksimal item yang dikembalikan"
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Skill)

    if tipe:
        query = query.filter(Skill.tipe == tipe)

    if q:
        clean_q = q.strip()
        if clean_q:
            # Escape % and _ characters for safe ILIKE search
            escaped_q = (
                clean_q.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_")
            )
            query = query.filter(Skill.nama.ilike(f"%{escaped_q}%"))

    skills = query.order_by(Skill.nama.asc()).limit(limit).all()
    return skills
