"""client_revisions

Revision ID: 002_client_revisions
Revises: 001_initial_schema
Create Date: 2026-10-27 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '002_client_revisions'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users: update role column length and check to include 'moderator'
    op.alter_column('users', 'role', type_=sa.String(15), server_default='mahasiswa')
    op.drop_constraint('users_role_check', 'users', type_='check')
    op.create_check_constraint('users_role_check', 'users', "role IN ('mahasiswa', 'moderator', 'admin')")

    # 2. friendships table
    op.create_table(
        'friendships',
        sa.Column('friendship_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('requester_id', sa.BigInteger(), nullable=False),
        sa.Column('addressee_id', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='menunggu', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['addressee_id'], ['users.user_id'], name='friendships_addressee_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.user_id'], name='friendships_requester_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('friendship_id', name='friendships_pkey'),
        sa.UniqueConstraint('requester_id', 'addressee_id', name='uq_friendship'),
        sa.CheckConstraint("status IN ('menunggu', 'diterima', 'ditolak')", name='friendships_status_check'),
        sa.CheckConstraint('requester_id <> addressee_id', name='chk_friendship_self')
    )
    op.create_index('idx_friendships_requester', 'friendships', ['requester_id'], unique=False)
    op.create_index('idx_friendships_addressee', 'friendships', ['addressee_id'], unique=False)
    op.create_index('idx_friendships_status', 'friendships', ['status'], unique=False)

    # 3. user_blocks table
    op.create_table(
        'user_blocks',
        sa.Column('block_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('blocker_id', sa.BigInteger(), nullable=False),
        sa.Column('blocked_id', sa.BigInteger(), nullable=False),
        sa.Column('alasan', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['blocked_id'], ['users.user_id'], name='user_blocks_blocked_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['blocker_id'], ['users.user_id'], name='user_blocks_blocker_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('block_id', name='user_blocks_pkey'),
        sa.UniqueConstraint('blocker_id', 'blocked_id', name='uq_user_block'),
        sa.CheckConstraint('blocker_id <> blocked_id', name='chk_block_self')
    )
    op.create_index('idx_user_blocks_blocker', 'user_blocks', ['blocker_id'], unique=False)
    op.create_index('idx_user_blocks_blocked', 'user_blocks', ['blocked_id'], unique=False)

    # 4. portfolio_items updates
    op.add_column('portfolio_items', sa.Column('kategori', sa.String(length=30), server_default='proyek', nullable=False))
    op.add_column('portfolio_items', sa.Column('nomor_dokumen', sa.String(length=100), nullable=True))
    op.add_column('portfolio_items', sa.Column('penerbit', sa.String(length=150), nullable=True))
    op.add_column('portfolio_items', sa.Column('tanggal_terbit', sa.Date(), nullable=True))
    op.add_column('portfolio_items', sa.Column('file_url', sa.String(length=255), nullable=True))
    op.add_column('portfolio_items', sa.Column('status_verifikasi', sa.String(length=25), server_default='draft', nullable=False))
    op.add_column('portfolio_items', sa.Column('diverifikasi_oleh', sa.BigInteger(), nullable=True))
    op.add_column('portfolio_items', sa.Column('catatan_verifikasi', sa.Text(), nullable=True))
    op.add_column('portfolio_items', sa.Column('verified_at', sa.DateTime(), nullable=True))
    op.create_foreign_key('portfolio_items_diverifikasi_oleh_fkey', 'portfolio_items', 'users', ['diverifikasi_oleh'], ['user_id'], ondelete='SET NULL')
    op.create_check_constraint('portfolio_items_kategori_check', 'portfolio_items', "kategori IN ('proyek', 'skpi', 'sertifikat', 'artikel_ilmiah')")
    op.create_check_constraint('portfolio_items_status_verifikasi_check', 'portfolio_items', "status_verifikasi IN ('draft', 'menunggu_review', 'terverifikasi', 'ditolak')")
    op.create_index('idx_portfolio_kategori', 'portfolio_items', ['kategori'], unique=False)
    op.create_index('idx_portfolio_verifikasi', 'portfolio_items', ['status_verifikasi'], unique=False)

    # 5. posts updates
    op.alter_column('posts', 'status', type_=sa.String(20), server_default='draft')
    op.add_column('posts', sa.Column('gambar_url', sa.String(length=255), nullable=True))
    op.add_column('posts', sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('posts', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column('posts', sa.Column('deleted_by', sa.BigInteger(), nullable=True))
    op.add_column('posts', sa.Column('alasan_hapus', sa.Text(), nullable=True))
    op.create_foreign_key('posts_deleted_by_fkey', 'posts', 'users', ['deleted_by'], ['user_id'], ondelete='SET NULL')
    op.drop_constraint('posts_status_check', 'posts', type_='check')
    op.create_check_constraint('posts_status_check', 'posts', "status IN ('draft', 'tayang', 'menunggu_review', 'direview', 'ditolak', 'revisi', 'dihapus')")
    op.create_index('idx_posts_deleted', 'posts', ['is_deleted'], unique=False)

    # 6. reports updates
    op.alter_column('reports', 'status', type_=sa.String(15), server_default='baru')
    op.add_column('reports', sa.Column('kategori_laporan', sa.String(length=50), server_default='konten_tidak_pantas', nullable=False))
    op.add_column('reports', sa.Column('ditinjau_oleh', sa.BigInteger(), nullable=True))
    op.add_column('reports', sa.Column('tindakan_diambil', sa.String(length=50), nullable=True))
    op.add_column('reports', sa.Column('catatan_tinjauan', sa.Text(), nullable=True))
    op.add_column('reports', sa.Column('resolved_at', sa.DateTime(), nullable=True))
    op.create_foreign_key('reports_ditinjau_oleh_fkey', 'reports', 'users', ['ditinjau_oleh'], ['user_id'], ondelete='SET NULL')
    op.drop_constraint('reports_status_check', 'reports', type_='check')
    op.create_check_constraint('reports_status_check', 'reports', "status IN ('baru', 'diproses', 'selesai', 'diabaikan')")
    op.create_check_constraint('reports_kategori_check', 'reports', "kategori_laporan IN ('spam', 'konten_tidak_pantas', 'ujaran_kebencian', 'misinformasi', 'plagiarisme', 'lainnya')")
    op.create_check_constraint('reports_tindakan_diambil_check', 'reports', "tindakan_diambil IN ('postingan_dihapus', 'peringatan', 'laporan_ditolak', 'sedang_investigasi')")
    op.create_index('idx_reports_status', 'reports', ['status'], unique=False)
    op.create_index('idx_reports_kategori', 'reports', ['kategori_laporan'], unique=False)

    # 7. moderation_records updates
    op.alter_column('moderation_records', 'keputusan_admin', type_=sa.String(20))
    op.add_column('moderation_records', sa.Column('moderator_id', sa.BigInteger(), nullable=True))
    op.add_column('moderation_records', sa.Column('keputusan_moderator', sa.String(length=20), nullable=True))
    op.create_foreign_key('moderation_records_moderator_id_fkey', 'moderation_records', 'users', ['moderator_id'], ['user_id'], ondelete='SET NULL')
    op.drop_constraint('moderation_records_keputusan_admin_check', 'moderation_records', type_='check')
    op.create_check_constraint('moderation_records_keputusan_admin_check', 'moderation_records', "keputusan_admin IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten')")
    op.create_check_constraint('moderation_records_keputusan_moderator_check', 'moderation_records', "keputusan_moderator IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten')")
    op.drop_index('idx_moderation_pending', table_name='moderation_records')
    op.create_index('idx_moderation_pending', 'moderation_records', ['created_at'], unique=False, postgresql_where=sa.text('keputusan_admin IS NULL AND keputusan_moderator IS NULL'))

    # 8. recommendation_logs: add chk_recommendation_self
    op.create_check_constraint('chk_recommendation_self', 'recommendation_logs', 'pemohon_id <> kandidat_id')


def downgrade() -> None:
    # 8. recommendation_logs
    op.drop_constraint('chk_recommendation_self', 'recommendation_logs', type_='check')

    # 7. moderation_records
    op.drop_index('idx_moderation_pending', table_name='moderation_records')
    op.create_index('idx_moderation_pending', 'moderation_records', ['created_at'], unique=False, postgresql_where=sa.text('keputusan_admin IS NULL'))
    op.drop_constraint('moderation_records_keputusan_moderator_check', 'moderation_records', type_='check')
    op.drop_constraint('moderation_records_keputusan_admin_check', 'moderation_records', type_='check')
    op.create_check_constraint('moderation_records_keputusan_admin_check', 'moderation_records', "keputusan_admin IN ('setujui', 'tolak', 'minta_revisi')")
    op.drop_constraint('moderation_records_moderator_id_fkey', 'moderation_records', type_='foreignkey')
    op.drop_column('moderation_records', 'keputusan_moderator')
    op.drop_column('moderation_records', 'moderator_id')
    op.alter_column('moderation_records', 'keputusan_admin', type_=sa.String(15))

    # 6. reports
    op.drop_index('idx_reports_kategori', table_name='reports')
    op.drop_index('idx_reports_status', table_name='reports')
    op.drop_constraint('reports_tindakan_diambil_check', 'reports', type_='check')
    op.drop_constraint('reports_kategori_check', 'reports', type_='check')
    op.drop_constraint('reports_status_check', 'reports', type_='check')
    op.create_check_constraint('reports_status_check', 'reports', "status IN ('baru', 'diproses', 'selesai')")
    op.drop_constraint('reports_ditinjau_oleh_fkey', 'reports', type_='foreignkey')
    op.drop_column('reports', 'resolved_at')
    op.drop_column('reports', 'catatan_tinjauan')
    op.drop_column('reports', 'tindakan_diambil')
    op.drop_column('reports', 'ditinjau_oleh')
    op.drop_column('reports', 'kategori_laporan')
    op.alter_column('reports', 'status', type_=sa.String(10), server_default='baru')

    # 5. posts
    op.drop_index('idx_posts_deleted', table_name='posts')
    op.drop_constraint('posts_status_check', 'posts', type_='check')
    op.create_check_constraint('posts_status_check', 'posts', "status IN ('draft', 'tayang', 'direview', 'ditolak', 'revisi')")
    op.drop_constraint('posts_deleted_by_fkey', 'posts', type_='foreignkey')
    op.drop_column('posts', 'alasan_hapus')
    op.drop_column('posts', 'deleted_by')
    op.drop_column('posts', 'deleted_at')
    op.drop_column('posts', 'is_deleted')
    op.drop_column('posts', 'gambar_url')
    op.alter_column('posts', 'status', type_=sa.String(10), server_default='draft')

    # 4. portfolio_items
    op.drop_index('idx_portfolio_verifikasi', table_name='portfolio_items')
    op.drop_index('idx_portfolio_kategori', table_name='portfolio_items')
    op.drop_constraint('portfolio_items_status_verifikasi_check', 'portfolio_items', type_='check')
    op.drop_constraint('portfolio_items_kategori_check', 'portfolio_items', type_='check')
    op.drop_constraint('portfolio_items_diverifikasi_oleh_fkey', 'portfolio_items', type_='foreignkey')
    op.drop_column('portfolio_items', 'verified_at')
    op.drop_column('portfolio_items', 'catatan_verifikasi')
    op.drop_column('portfolio_items', 'diverifikasi_oleh')
    op.drop_column('portfolio_items', 'status_verifikasi')
    op.drop_column('portfolio_items', 'file_url')
    op.drop_column('portfolio_items', 'tanggal_terbit')
    op.drop_column('portfolio_items', 'penerbit')
    op.drop_column('portfolio_items', 'nomor_dokumen')
    op.drop_column('portfolio_items', 'kategori')

    # 3. user_blocks
    op.drop_table('user_blocks')

    # 2. friendships
    op.drop_table('friendships')

    # 1. users
    op.drop_constraint('users_role_check', 'users', type_='check')
    op.create_check_constraint('users_role_check', 'users', "role IN ('mahasiswa', 'admin')")
    op.alter_column('users', 'role', type_=sa.String(10), server_default='mahasiswa')
