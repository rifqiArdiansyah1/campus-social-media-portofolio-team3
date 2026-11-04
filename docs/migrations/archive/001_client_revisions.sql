-- ==============================================================================
-- Migration: 001_client_revisions.sql
-- Proyek: CampusFolio (Team 3)
-- Tanggal: 27 Oktober 2026
-- Deskripsi:
--   1. Penambahan role 'moderator' (digunakan oleh Kaprodi).
--   2. Tabel 'friendships' untuk sistem pertemanan mahasiswa.
--   3. Tabel 'user_blocks' untuk fitur blokir profil antar mahasiswa.
--   4. Pembaruan tabel 'portfolio_items' untuk kategori SKPI, Sertifikat, & Artikel Ilmiah
--      beserta alur verifikasi (status_verifikasi, diverifikasi_oleh, catatan).
--   5. Pembaruan tabel 'posts' untuk fokus foto + teks, dan soft-delete/takedown audit.
--   6. Pembaruan tabel 'reports' & 'moderation_records' untuk penerimaan laporan,
--      tinjauan konten, dan tindakan hapus oleh moderator/admin.
-- ==============================================================================

-- 1. Pembaruan Role pada tabel users (tambah 'moderator')
DO $$
BEGIN
    -- Drop constraint role lama jika ada
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    -- Tambah constraint baru dengan 'moderator'
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('mahasiswa', 'moderator', 'admin'));
END $$;

-- 2. Buat tabel friendships (Sistem Pertemanan Mahasiswa)
CREATE TABLE IF NOT EXISTS friendships (
    friendship_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requester_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    addressee_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'menunggu'
                    CHECK (status IN ('menunggu', 'diterima', 'ditolak')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP,
    CONSTRAINT uq_friendship UNIQUE (requester_id, addressee_id),
    CONSTRAINT chk_friendship_self CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- 3. Buat tabel user_blocks (Fitur Blokir Profil)
CREATE TABLE IF NOT EXISTS user_blocks (
    block_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    blocker_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alasan          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_block_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- 4. Pembaruan tabel portfolio_items (SKPI, Sertifikat, & Artikel Ilmiah + Tinjauan Portofolio)
ALTER TABLE portfolio_items 
    ADD COLUMN IF NOT EXISTS kategori VARCHAR(30) NOT NULL DEFAULT 'proyek',
    ADD COLUMN IF NOT EXISTS nomor_dokumen VARCHAR(100),
    ADD COLUMN IF NOT EXISTS penerbit VARCHAR(150),
    ADD COLUMN IF NOT EXISTS tanggal_terbit DATE,
    ADD COLUMN IF NOT EXISTS file_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS status_verifikasi VARCHAR(25) NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS diverifikasi_oleh BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS catatan_verifikasi TEXT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

DO $$
BEGIN
    ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_kategori_check;
    ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_kategori_check
        CHECK (kategori IN ('proyek', 'skpi', 'sertifikat', 'artikel_ilmiah'));

    ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_status_verifikasi_check;
    ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_status_verifikasi_check
        CHECK (status_verifikasi IN ('draft', 'menunggu_review', 'terverifikasi', 'ditolak'));
END $$;

CREATE INDEX IF NOT EXISTS idx_portfolio_kategori ON portfolio_items(kategori);
CREATE INDEX IF NOT EXISTS idx_portfolio_verifikasi ON portfolio_items(status_verifikasi);

-- 5. Pembaruan tabel posts (Fokus Foto + Teks, Soft-Delete / Takedown Audit)
ALTER TABLE posts 
    ADD COLUMN IF NOT EXISTS gambar_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS alasan_hapus TEXT;

DO $$
BEGIN
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
    ALTER TABLE posts ADD CONSTRAINT posts_status_check
        CHECK (status IN ('draft', 'tayang', 'menunggu_review', 'direview', 'ditolak', 'revisi', 'dihapus'));
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(is_deleted);

-- 6. Pembaruan tabel reports (Penerimaan Laporan & Tinjauan Laporan)
ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS kategori_laporan VARCHAR(50) NOT NULL DEFAULT 'konten_tidak_pantas',
    ADD COLUMN IF NOT EXISTS ditinjau_oleh BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS tindakan_diambil VARCHAR(50),
    ADD COLUMN IF NOT EXISTS catatan_tinjauan TEXT,
    ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

DO $$
BEGIN
    ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
    ALTER TABLE reports ADD CONSTRAINT reports_status_check
        CHECK (status IN ('baru', 'diproses', 'selesai', 'diabaikan'));

    ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_kategori_check;
    ALTER TABLE reports ADD CONSTRAINT reports_kategori_check
        CHECK (kategori_laporan IN ('spam', 'konten_tidak_pantas', 'ujaran_kebencian', 'misinformasi', 'plagiarisme', 'lainnya'));
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_kategori ON reports(kategori_laporan);

-- 7. Pembaruan tabel moderation_records (Moderator / Kaprodi review)
ALTER TABLE moderation_records
    ADD COLUMN IF NOT EXISTS moderator_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS keputusan_moderator VARCHAR(20);

DO $$
BEGIN
    ALTER TABLE moderation_records DROP CONSTRAINT IF EXISTS moderation_records_keputusan_moderator_check;
    ALTER TABLE moderation_records ADD CONSTRAINT moderation_records_keputusan_moderator_check
        CHECK (keputusan_moderator IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten'));
END $$;
