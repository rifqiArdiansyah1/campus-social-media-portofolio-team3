-- CampusFolio — Skema Basis Data (PostgreSQL)
-- Versi: v1.1 (Revisi Klien: Role Moderator/Kaprodi, Pertemanan, Blokir Profil, SKPI/Sertifikat/Artikel Ilmiah, Moderasi Konten & Takedown)
-- Sumber Perancangan: docs/08-system-design.md & docs/diagrams/erd.svg

-- 1. TABEL PENGGUNA (USERS)
-- Role mencakup: 'mahasiswa', 'moderator' (digunakan oleh masing-masing Kaprodi), dan 'admin'.
CREATE TABLE users (
    user_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nim            VARCHAR(20)  NOT NULL UNIQUE,
    nama           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    jurusan        VARCHAR(100),
    angkatan       INT,
    bio            TEXT,
    kontak_url     VARCHAR(255),
    role           VARCHAR(15)  NOT NULL DEFAULT 'mahasiswa'
                   CHECK (role IN ('mahasiswa', 'moderator', 'admin')),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL KEAHLIAN & MINAT (SKILLS)
CREATE TABLE skills (
    skill_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nama      VARCHAR(60) NOT NULL UNIQUE,
    tipe      VARCHAR(10) NOT NULL CHECK (tipe IN ('skill', 'minat'))
);

CREATE TABLE user_skills (
    user_id   BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    skill_id  BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    level     VARCHAR(10) CHECK (level IN ('pemula', 'menengah', 'mahir')),
    PRIMARY KEY (user_id, skill_id)
);

-- 3. TABEL PERTEMANAN MAHASISWA (FRIENDSHIPS)
CREATE TABLE friendships (
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

-- 4. TABEL BLOKIR PROFIL (USER_BLOCKS)
CREATE TABLE user_blocks (
    block_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    blocker_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    blocked_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alasan          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_block_self CHECK (blocker_id <> blocked_id)
);

-- 5. TABEL PORTOFOLIO, SKPI, SERTIFIKAT, & ARTIKEL ILMIAH (PORTFOLIO_ITEMS)
-- Memfasilitasi validasi pencatatan SKPI & karya ilmiah oleh Moderator (Kaprodi) / Admin.
CREATE TABLE portfolio_items (
    portfolio_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    judul               VARCHAR(150) NOT NULL,
    deskripsi           TEXT,
    tautan_url          VARCHAR(255),
    gambar_url          VARCHAR(255),
    kategori            VARCHAR(30) NOT NULL DEFAULT 'proyek'
                        CHECK (kategori IN ('proyek', 'skpi', 'sertifikat', 'artikel_ilmiah')),
    nomor_dokumen       VARCHAR(100),
    penerbit            VARCHAR(150),
    tanggal_terbit      DATE,
    file_url            VARCHAR(255),
    status_verifikasi   VARCHAR(25) NOT NULL DEFAULT 'draft'
                        CHECK (status_verifikasi IN ('draft', 'menunggu_review', 'terverifikasi', 'ditolak')),
    diverifikasi_oleh   BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    catatan_verifikasi  TEXT,
    verified_at         TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio_skills (
    portfolio_id  BIGINT NOT NULL REFERENCES portfolio_items(portfolio_id) ON DELETE CASCADE,
    skill_id      BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (portfolio_id, skill_id)
);

-- 6. TABEL POSTINGAN FEED (POSTS)
-- Fokus pada konten Foto + Teks serta jejak audit penghapusan/takedown.
CREATE TABLE posts (
    post_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    isi           TEXT NOT NULL,
    gambar_url    VARCHAR(255),
    tipe          VARCHAR(15) NOT NULL DEFAULT 'umum'
                  CHECK (tipe IN ('umum', 'cari_anggota')),
    status        VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'tayang', 'menunggu_review', 'direview', 'ditolak', 'revisi', 'dihapus')),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at    TIMESTAMP,
    deleted_by    BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    alasan_hapus  TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_skills (
    post_id   BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    skill_id  BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, skill_id)
);

-- 7. TABEL REKAMAN MODERASI (MODERATION_RECORDS)
CREATE TABLE moderation_records (
    moderation_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id             BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    admin_id            BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    moderator_id        BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    label_ai            VARCHAR(25)
                        CHECK (label_ai IN ('aman', 'perlu_review', 'berpotensi_melanggar')),
    kategori_ai         VARCHAR(60),
    confidence          REAL CHECK (confidence BETWEEN 0 AND 1),
    penjelasan_ai       TEXT,
    keputusan_admin     VARCHAR(20)
                        CHECK (keputusan_admin IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten')),
    keputusan_moderator VARCHAR(20)
                        CHECK (keputusan_moderator IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten')),
    catatan_admin       TEXT,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at          TIMESTAMP
);

-- 8. TABEL LAPORAN POSTINGAN (REPORTS)
CREATE TABLE reports (
    report_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id          BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    pelapor_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alasan           TEXT NOT NULL,
    kategori_laporan VARCHAR(50) NOT NULL DEFAULT 'konten_tidak_pantas'
                     CHECK (kategori_laporan IN ('spam', 'konten_tidak_pantas', 'ujaran_kebencian', 'misinformasi', 'plagiarisme', 'lainnya')),
    status           VARCHAR(15) NOT NULL DEFAULT 'baru'
                     CHECK (status IN ('baru', 'diproses', 'selesai', 'diabaikan')),
    ditinjau_oleh    BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    tindakan_diambil VARCHAR(50)
                     CHECK (tindakan_diambil IN ('postingan_dihapus', 'peringatan', 'laporan_ditolak', 'sedang_investigasi')),
    catatan_tinjauan TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at      TIMESTAMP
);

-- 9. TABEL LOG REKOMENDASI (RECOMMENDATION_LOGS)
CREATE TABLE recommendation_logs (
    rec_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pemohon_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    kandidat_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    kebutuhan_teks  TEXT,
    skor            REAL NOT NULL CHECK (skor BETWEEN 0 AND 1),
    alasan          TEXT,
    umpan_balik     VARCHAR(15) CHECK (umpan_balik IN ('relevan', 'tidak_relevan')),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (pemohon_id <> kandidat_id)
);

-- 10. INDEKS PERFORMA & FILTER
CREATE INDEX idx_user_skills_skill       ON user_skills (skill_id);
CREATE INDEX idx_portfolio_user          ON portfolio_items (user_id);
CREATE INDEX idx_portfolio_kategori      ON portfolio_items (kategori);
CREATE INDEX idx_portfolio_verifikasi    ON portfolio_items (status_verifikasi);
CREATE INDEX idx_posts_user              ON posts (user_id);
CREATE INDEX idx_posts_status            ON posts (status);
CREATE INDEX idx_posts_deleted           ON posts (is_deleted);
CREATE INDEX idx_friendships_requester   ON friendships (requester_id);
CREATE INDEX idx_friendships_addressee   ON friendships (addressee_id);
CREATE INDEX idx_friendships_status      ON friendships (status);
CREATE INDEX idx_user_blocks_blocker     ON user_blocks (blocker_id);
CREATE INDEX idx_user_blocks_blocked     ON user_blocks (blocked_id);
CREATE INDEX idx_moderation_post         ON moderation_records (post_id);
CREATE INDEX idx_moderation_pending      ON moderation_records (created_at) WHERE keputusan_admin IS NULL AND keputusan_moderator IS NULL;
CREATE INDEX idx_reports_post            ON reports (post_id);
CREATE INDEX idx_reports_status          ON reports (status);
CREATE INDEX idx_reclog_pemohon          ON recommendation_logs (pemohon_id);
