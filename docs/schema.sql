-- CampusFolio — skema basis data awal (PostgreSQL)
-- Sumber: docs/diagrams/erd.svg. Sesuaikan tipe data bila memakai MySQL/SQLite.

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
    role           VARCHAR(10)  NOT NULL DEFAULT 'mahasiswa'
                   CHECK (role IN ('mahasiswa', 'admin')),
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE portfolio_items (
    portfolio_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    judul         VARCHAR(150) NOT NULL,
    deskripsi     TEXT,
    tautan_url    VARCHAR(255),
    gambar_url    VARCHAR(255),
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio_skills (
    portfolio_id  BIGINT NOT NULL REFERENCES portfolio_items(portfolio_id) ON DELETE CASCADE,
    skill_id      BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (portfolio_id, skill_id)
);

CREATE TABLE posts (
    post_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    isi         TEXT NOT NULL,
    tipe        VARCHAR(15) NOT NULL DEFAULT 'umum'
                CHECK (tipe IN ('umum', 'cari_anggota')),
    status      VARCHAR(10) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'tayang', 'direview', 'ditolak', 'revisi')),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_skills (
    post_id   BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    skill_id  BIGINT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, skill_id)
);

CREATE TABLE moderation_records (
    moderation_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id          BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    admin_id         BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    label_ai         VARCHAR(25)
                     CHECK (label_ai IN ('aman', 'perlu_review', 'berpotensi_melanggar')),
    kategori_ai      VARCHAR(60),
    confidence       REAL CHECK (confidence BETWEEN 0 AND 1),
    penjelasan_ai    TEXT,
    keputusan_admin  VARCHAR(15)
                     CHECK (keputusan_admin IN ('setujui', 'tolak', 'minta_revisi')),
    catatan_admin    TEXT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at       TIMESTAMP
);

CREATE TABLE reports (
    report_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    pelapor_id  BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alasan      TEXT NOT NULL,
    status      VARCHAR(10) NOT NULL DEFAULT 'baru'
                CHECK (status IN ('baru', 'diproses', 'selesai')),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Indeks untuk pencarian, antrean moderasi, dan evaluasi rekomendasi
CREATE INDEX idx_user_skills_skill       ON user_skills (skill_id);
CREATE INDEX idx_portfolio_user          ON portfolio_items (user_id);
CREATE INDEX idx_posts_user              ON posts (user_id);
CREATE INDEX idx_posts_status            ON posts (status);
CREATE INDEX idx_moderation_post         ON moderation_records (post_id);
CREATE INDEX idx_moderation_pending      ON moderation_records (created_at) WHERE keputusan_admin IS NULL;
CREATE INDEX idx_reports_post            ON reports (post_id);
CREATE INDEX idx_reclog_pemohon          ON recommendation_logs (pemohon_id);
