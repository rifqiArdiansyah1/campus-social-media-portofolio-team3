"""add_uq_skills_nama_lower

Revision ID: 003_add_uq_skills_nama_lower
Revises: 002_client_revisions
Create Date: 2026-11-06 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '003_add_uq_skills_nama_lower'
down_revision: Union[str, None] = '002_client_revisions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Expression-based unique index for case-insensitive unique skill names in Postgres
    op.execute("CREATE UNIQUE INDEX uq_skills_nama_lower ON skills (LOWER(nama));")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_skills_nama_lower;")
