"""initial_schema

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-10-06 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('user_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('nim', sa.String(length=20), nullable=False),
        sa.Column('nama', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('jurusan', sa.String(length=100), nullable=True),
        sa.Column('angkatan', sa.Integer(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('kontak_url', sa.String(length=255), nullable=True),
        sa.Column('role', sa.String(length=15), server_default='mahasiswa', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('user_id', name='users_pkey'),
        sa.UniqueConstraint('email', name='users_email_key'),
        sa.UniqueConstraint('nim', name='users_nim_key'),
        sa.CheckConstraint("role IN ('mahasiswa', 'admin')", name='users_role_check')
    )

    # 2. skills
    op.create_table(
        'skills',
        sa.Column('skill_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('nama', sa.String(length=60), nullable=False),
        sa.Column('tipe', sa.String(length=10), nullable=False),
        sa.PrimaryKeyConstraint('skill_id', name='skills_pkey'),
        sa.UniqueConstraint('nama', name='skills_nama_key'),
        sa.CheckConstraint("tipe IN ('skill', 'minat')", name='skills_tipe_check')
    )

    # 3. user_skills
    op.create_table(
        'user_skills',
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('skill_id', sa.BigInteger(), nullable=False),
        sa.Column('level', sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id'], name='user_skills_skill_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='user_skills_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'skill_id', name='user_skills_pkey'),
        sa.CheckConstraint("level IN ('pemula', 'menengah', 'mahir')", name='user_skills_level_check')
    )
    op.create_index('idx_user_skills_skill', 'user_skills', ['skill_id'], unique=False)

    # 4. portfolio_items (v1.0 baseline)
    op.create_table(
        'portfolio_items',
        sa.Column('portfolio_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('judul', sa.String(length=150), nullable=False),
        sa.Column('deskripsi', sa.Text(), nullable=True),
        sa.Column('tautan_url', sa.String(length=255), nullable=True),
        sa.Column('gambar_url', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='portfolio_items_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('portfolio_id', name='portfolio_items_pkey')
    )
    op.create_index('idx_portfolio_user', 'portfolio_items', ['user_id'], unique=False)

    # 5. portfolio_skills
    op.create_table(
        'portfolio_skills',
        sa.Column('portfolio_id', sa.BigInteger(), nullable=False),
        sa.Column('skill_id', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['portfolio_id'], ['portfolio_items.portfolio_id'], name='portfolio_skills_portfolio_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id'], name='portfolio_skills_skill_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('portfolio_id', 'skill_id', name='portfolio_skills_pkey')
    )

    # 6. posts (v1.0 baseline)
    op.create_table(
        'posts',
        sa.Column('post_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('isi', sa.Text(), nullable=False),
        sa.Column('tipe', sa.String(length=15), server_default='umum', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name='posts_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('post_id', name='posts_pkey'),
        sa.CheckConstraint("tipe IN ('umum', 'cari_anggota')", name='posts_tipe_check'),
        sa.CheckConstraint("status IN ('draft', 'tayang', 'direview', 'ditolak', 'revisi')", name='posts_status_check')
    )
    op.create_index('idx_posts_user', 'posts', ['user_id'], unique=False)
    op.create_index('idx_posts_status', 'posts', ['status'], unique=False)

    # 7. post_skills
    op.create_table(
        'post_skills',
        sa.Column('post_id', sa.BigInteger(), nullable=False),
        sa.Column('skill_id', sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.post_id'], name='post_skills_post_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id'], name='post_skills_skill_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('post_id', 'skill_id', name='post_skills_pkey')
    )

    # 8. moderation_records (v1.0 baseline)
    op.create_table(
        'moderation_records',
        sa.Column('moderation_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('post_id', sa.BigInteger(), nullable=False),
        sa.Column('admin_id', sa.BigInteger(), nullable=True),
        sa.Column('label_ai', sa.String(length=25), nullable=True),
        sa.Column('kategori_ai', sa.String(length=60), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('penjelasan_ai', sa.Text(), nullable=True),
        sa.Column('keputusan_admin', sa.String(length=20), nullable=True),
        sa.Column('catatan_admin', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['admin_id'], ['users.user_id'], name='moderation_records_admin_id_fkey', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['post_id'], ['posts.post_id'], name='moderation_records_post_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('moderation_id', name='moderation_records_pkey'),
        sa.CheckConstraint("label_ai IN ('aman', 'perlu_review', 'berpotensi_melanggar')", name='moderation_records_label_ai_check'),
        sa.CheckConstraint('confidence >= 0 AND confidence <= 1', name='moderation_records_confidence_check'),
        sa.CheckConstraint("keputusan_admin IN ('setujui', 'tolak', 'minta_revisi')", name='moderation_records_keputusan_admin_check')
    )
    op.create_index('idx_moderation_post', 'moderation_records', ['post_id'], unique=False)
    op.create_index('idx_moderation_pending', 'moderation_records', ['created_at'], unique=False, postgresql_where=sa.text('keputusan_admin IS NULL'))

    # 9. reports (v1.0 baseline)
    op.create_table(
        'reports',
        sa.Column('report_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('post_id', sa.BigInteger(), nullable=False),
        sa.Column('pelapor_id', sa.BigInteger(), nullable=False),
        sa.Column('alasan', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=15), server_default='baru', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['pelapor_id'], ['users.user_id'], name='reports_pelapor_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['post_id'], ['posts.post_id'], name='reports_post_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('report_id', name='reports_pkey'),
        sa.CheckConstraint("status IN ('baru', 'diproses', 'selesai')", name='reports_status_check')
    )
    op.create_index('idx_reports_post', 'reports', ['post_id'], unique=False)

    # 10. recommendation_logs
    op.create_table(
        'recommendation_logs',
        sa.Column('rec_id', sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column('pemohon_id', sa.BigInteger(), nullable=False),
        sa.Column('kandidat_id', sa.BigInteger(), nullable=False),
        sa.Column('kebutuhan_teks', sa.Text(), nullable=True),
        sa.Column('skor', sa.Float(), nullable=False),
        sa.Column('alasan', sa.Text(), nullable=True),
        sa.Column('umpan_balik', sa.String(length=15), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['kandidat_id'], ['users.user_id'], name='recommendation_logs_kandidat_id_fkey', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pemohon_id'], ['users.user_id'], name='recommendation_logs_pemohon_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('rec_id', name='recommendation_logs_pkey'),
        sa.CheckConstraint('pemohon_id <> kandidat_id', name='chk_recommendation_self'),
        sa.CheckConstraint('skor >= 0 AND skor <= 1', name='recommendation_logs_skor_check'),
        sa.CheckConstraint("umpan_balik IN ('relevan', 'tidak_relevan')", name='recommendation_logs_umpan_balik_check')
    )
    op.create_index('idx_reclog_pemohon', 'recommendation_logs', ['pemohon_id'], unique=False)


def downgrade() -> None:
    op.drop_table('recommendation_logs')
    op.drop_table('reports')
    op.drop_table('moderation_records')
    op.drop_table('post_skills')
    op.drop_table('posts')
    op.drop_table('portfolio_skills')
    op.drop_table('portfolio_items')
    op.drop_table('user_skills')
    op.drop_table('skills')
    op.drop_table('users')
