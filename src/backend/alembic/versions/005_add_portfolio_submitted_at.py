"""add_portfolio_submitted_at

Revision ID: 005_add_portfolio_submitted_at
Revises: 004_add_uq_friendship_pair
Create Date: 2026-11-08 22:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005_add_portfolio_submitted_at'
down_revision: Union[str, None] = '004_add_uq_friendship_pair'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add submitted_at column to portfolio_items
    op.add_column(
        'portfolio_items',
        sa.Column('submitted_at', sa.DateTime(), nullable=True)
    )

    # 2. Add partial index for FIFO review queue
    op.execute(
        "CREATE INDEX idx_portfolio_review_fifo ON portfolio_items (submitted_at ASC) "
        "WHERE status_verifikasi = 'menunggu_review';"
    )


def downgrade() -> None:
    # Drop partial index
    op.execute("DROP INDEX IF EXISTS idx_portfolio_review_fifo;")

    # Drop column submitted_at
    op.drop_column('portfolio_items', 'submitted_at')
