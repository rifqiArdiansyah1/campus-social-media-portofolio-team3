from sqlalchemy import create_engine, text

from app.core.config import settings

EXPECTED_TABLES = {
    "users",
    "skills",
    "user_skills",
    "friendships",
    "user_blocks",
    "portfolio_items",
    "portfolio_skills",
    "posts",
    "post_skills",
    "moderation_records",
    "reports",
    "recommendation_logs"
}

EXPECTED_INDEXES = {
    "idx_user_skills_skill",
    "idx_portfolio_user",
    "idx_portfolio_kategori",
    "idx_portfolio_verifikasi",
    "idx_posts_user",
    "idx_posts_status",
    "idx_posts_deleted",
    "idx_friendships_requester",
    "idx_friendships_addressee",
    "idx_friendships_status",
    "idx_user_blocks_blocker",
    "idx_user_blocks_blocked",
    "idx_moderation_post",
    "idx_moderation_pending",
    "idx_reports_post",
    "idx_reports_status",
    "idx_reports_kategori",
    "idx_reclog_pemohon",
}

EXPECTED_CONSTRAINTS = {
    "users_email_key",
    "users_nim_key",
    "users_role_check",
    "skills_tipe_check",
    "user_skills_level_check",
    "friendships_status_check",
    "chk_friendship_self",
    "uq_friendship",
    "chk_block_self",
    "uq_user_block",
    "portfolio_items_kategori_check",
    "portfolio_items_status_verifikasi_check",
    "posts_tipe_check",
    "posts_status_check",
    "moderation_records_label_ai_check",
    "moderation_records_confidence_check",
    "moderation_records_keputusan_admin_check",
    "moderation_records_keputusan_moderator_check",
    "reports_kategori_check",
    "reports_status_check",
    "reports_tindakan_diambil_check",
    "recommendation_logs_skor_check",
    "recommendation_logs_umpan_balik_check",
    "chk_recommendation_self",
}


def test_schema_parity_tables_and_indexes():
    db_url = settings.MIGRATION_DATABASE_URL or settings.DATABASE_URL
    engine = create_engine(db_url)

    with engine.connect() as conn:
        # 1. Verify tables
        tables_res = conn.execute(text("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        """)).fetchall()
        existing_tables = {t[0] for t in tables_res}

        missing_tables = EXPECTED_TABLES - existing_tables
        assert not missing_tables, f"Tabel berikut belum ada di basis data: {missing_tables}"

        # 2. Verify indexes
        indexes_res = conn.execute(text("""
            SELECT indexname FROM pg_indexes
            WHERE schemaname = 'public';
        """)).fetchall()
        existing_indexes = {i[0] for i in indexes_res}

        missing_indexes = EXPECTED_INDEXES - existing_indexes
        assert not missing_indexes, f"Indeks berikut belum ada di basis data: {missing_indexes}"

        # 3. Verify partial index definition on moderation_records
        partial_idx = conn.execute(text("""
            SELECT indexdef FROM pg_indexes
            WHERE schemaname = 'public' AND indexname = 'idx_moderation_pending';
        """)).scalar()
        assert partial_idx is not None, "Indeks idx_moderation_pending tidak ditemukan"
        assert "WHERE" in partial_idx, f"Indeks idx_moderation_pending harus berupa partial index: {partial_idx}"

        # 4. Verify check & unique constraints
        constraints_res = conn.execute(text("""
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public';
        """)).fetchall()
        existing_constraints = {c[0] for c in constraints_res}

        missing_constraints = EXPECTED_CONSTRAINTS - existing_constraints
        assert not missing_constraints, f"Constraint berikut belum ada di basis data: {missing_constraints}"
