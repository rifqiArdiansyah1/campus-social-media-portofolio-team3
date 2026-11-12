"""add_m08_moderation_notif

Revision ID: 006_add_m08_moderation_notif
Revises: 005_add_portfolio_submitted_at
Create Date: 2026-11-09 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '006_add_m08_moderation_notif'
down_revision: Union[str, None] = '005_add_portfolio_submitted_at'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create notifications table
    op.create_table(
        'notifications',
        sa.Column('notification_id', sa.BigInteger(), sa.Identity(always=True), primary_key=True),
        sa.Column('user_id', sa.BigInteger(), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('jenis', sa.String(length=30), nullable=False),
        sa.Column('judul', sa.String(length=150), nullable=False),
        sa.Column('isi', sa.Text(), nullable=False),
        sa.Column('tautan', sa.String(length=255), nullable=True),
        sa.Column('ref_type', sa.String(length=30), nullable=True),
        sa.Column('ref_id', sa.BigInteger(), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.CheckConstraint(
            "jenis IN ('moderasi_disetujui', 'moderasi_revisi', 'moderasi_ditolak', 'moderasi_takedown', "
            "'laporan_selesai', 'laporan_diabaikan', 'pertemanan_diterima', 'pertemanan_baru', "
            "'skpi_terverifikasi', 'skpi_ditolak')",
            name="notifications_jenis_check"
        ),
        sa.CheckConstraint(
            "tautan IS NULL OR tautan LIKE '/%'",
            name="notifications_tautan_check"
        ),
    )

    # 2. Notification indexes
    op.create_index(
        'idx_notifications_user_created',
        'notifications',
        ['user_id', sa.text('created_at DESC')]
    )
    op.execute(
        "CREATE INDEX idx_notifications_unread ON notifications (user_id, created_at DESC) "
        "WHERE is_read = FALSE;"
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_notifications_ref ON notifications (user_id, jenis, ref_type, ref_id) "
        "WHERE ref_type IS NOT NULL AND ref_id IS NOT NULL;"
    )

    # 3. Add catatan_moderator to moderation_records
    op.add_column(
        'moderation_records',
        sa.Column('catatan_moderator', sa.Text(), nullable=True)
    )

    # 4. Partial unique index on reports to prevent duplicate active reports
    op.execute(
        "CREATE UNIQUE INDEX uq_reports_active_per_user ON reports (post_id, pelapor_id) "
        "WHERE status IN ('baru', 'diproses');"
    )

    # 5. Check constraint for posts soft-delete consistency
    op.create_check_constraint(
        'posts_soft_delete_check',
        'posts',
        "(is_deleted = FALSE) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL AND alasan_hapus IS NOT NULL AND status = 'dihapus')"
    )


def downgrade() -> None:
    # 5. Drop check constraint on posts
    op.drop_constraint('posts_soft_delete_check', 'posts', type_='check')

    # 4. Drop partial unique index on reports
    op.execute("DROP INDEX IF EXISTS uq_reports_active_per_user;")

    # 3. Drop catatan_moderator from moderation_records
    op.drop_column('moderation_records', 'catatan_moderator')

    # 2. Drop notification indexes
    op.execute("DROP INDEX IF EXISTS uq_notifications_ref;")
    op.execute("DROP INDEX IF EXISTS idx_notifications_unread;")
    op.drop_index('idx_notifications_user_created', table_name='notifications')

    # 1. Drop notifications table
    op.drop_table('notifications')
