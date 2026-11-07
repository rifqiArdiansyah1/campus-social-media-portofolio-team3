"""add_uq_friendship_pair

Revision ID: 004_add_uq_friendship_pair
Revises: 003_add_uq_skills_nama_lower
Create Date: 2026-11-07 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '004_add_uq_friendship_pair'
down_revision: Union[str, None] = '003_add_uq_skills_nama_lower'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Expression-based unique index for pair-level uniqueness in Postgres
    op.execute(
        "CREATE UNIQUE INDEX uq_friendship_pair "
        "ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_friendship_pair;")
