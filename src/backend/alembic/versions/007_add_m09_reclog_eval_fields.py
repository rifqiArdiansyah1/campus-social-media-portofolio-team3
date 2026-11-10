"""add_m09_reclog_eval_fields

Revision ID: 007_add_m09_reclog_eval_fields
Revises: 006_add_m08_moderation_notif
Create Date: 2026-11-10 16:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '007_add_m09_reclog_eval_fields'
down_revision: Union[str, None] = '006_add_m08_moderation_notif'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add evaluation and audit columns to recommendation_logs
    op.add_column('recommendation_logs', sa.Column('is_fallback', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('recommendation_logs', sa.Column('sumber', sa.String(length=20), server_default=sa.text("'match'"), nullable=False))
    op.add_column('recommendation_logs', sa.Column('post_id', sa.BigInteger(), sa.ForeignKey('posts.post_id', ondelete='SET NULL'), nullable=True))
    op.add_column('recommendation_logs', sa.Column('model_version', sa.String(length=20), server_default=sa.text("'tfidf-v1'"), nullable=False))

    # 2. Add source check constraint
    op.create_check_constraint(
        'recommendation_logs_sumber_check',
        'recommendation_logs',
        "sumber IN ('match', 'for_post')"
    )

    # 3. Create index for performance and evaluation queries
    op.create_index('idx_reclog_eval', 'recommendation_logs', ['pemohon_id', 'created_at'])
    op.create_index('idx_reclog_post', 'recommendation_logs', ['post_id'])


def downgrade() -> None:
    op.drop_index('idx_reclog_post', table_name='recommendation_logs')
    op.drop_index('idx_reclog_eval', table_name='recommendation_logs')
    op.drop_constraint('recommendation_logs_sumber_check', 'recommendation_logs', type_='check')
    op.drop_column('recommendation_logs', 'model_version')
    op.drop_column('recommendation_logs', 'post_id')
    op.drop_column('recommendation_logs', 'sumber')
    op.drop_column('recommendation_logs', 'is_fallback')
