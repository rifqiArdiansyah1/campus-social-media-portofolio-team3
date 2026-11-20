"""add_portfolio_review_logs

Revision ID: 008_add_portfolio_review_logs
Revises: 007_add_m09_reclog_eval_fields
Create Date: 2026-11-20 20:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '008_add_portfolio_review_logs'
down_revision: Union[str, None] = '007_add_m09_reclog_eval_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'portfolio_review_logs',
        sa.Column('log_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('portfolio_id', sa.BigInteger(), sa.ForeignKey('portfolio_items.portfolio_id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewer_id', sa.BigInteger(), sa.ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False),
        sa.Column('status_sebelumnya', sa.String(length=25), nullable=False),
        sa.Column('status_baru', sa.String(length=25), nullable=False),
        sa.Column('catatan_verifikasi', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index('idx_portfolio_review_logs_item', 'portfolio_review_logs', ['portfolio_id', 'created_at'])
    op.create_index('idx_portfolio_review_logs_reviewer', 'portfolio_review_logs', ['reviewer_id', 'created_at'])


def downgrade() -> None:
    op.drop_index('idx_portfolio_review_logs_reviewer', table_name='portfolio_review_logs')
    op.drop_index('idx_portfolio_review_logs_item', table_name='portfolio_review_logs')
    op.drop_table('portfolio_review_logs')
