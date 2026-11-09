from datetime import datetime

from sqlalchemy import (
    REAL,
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import relationship, synonym

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, Identity(always=True), primary_key=True)
    id = synonym("user_id")
    nim = Column(String(20), unique=True, nullable=False)
    nama = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    jurusan = Column(String(100), nullable=True)
    angkatan = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    kontak_url = Column(String(255), nullable=True)
    role = Column(String(15), nullable=False, server_default="mahasiswa")
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('mahasiswa', 'moderator', 'admin')", name="users_role_check"),
    )

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    portfolio_items = relationship("PortfolioItem", foreign_keys="[PortfolioItem.user_id]", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", foreign_keys="[Post.user_id]", back_populates="user", cascade="all, delete-orphan")
    reports_submitted = relationship("Report", foreign_keys="[Report.pelapor_id]", back_populates="reporter", cascade="all, delete-orphan")
    notifications = relationship("Notification", foreign_keys="[Notification.user_id]", back_populates="user", cascade="all, delete-orphan")

    # Friendships
    sent_friendships = relationship("Friendship", foreign_keys="[Friendship.requester_id]", back_populates="requester", cascade="all, delete-orphan")
    received_friendships = relationship("Friendship", foreign_keys="[Friendship.addressee_id]", back_populates="addressee", cascade="all, delete-orphan")

    # Blocks
    blocks_initiated = relationship("UserBlock", foreign_keys="[UserBlock.blocker_id]", back_populates="blocker", cascade="all, delete-orphan")
    blocks_received = relationship("UserBlock", foreign_keys="[UserBlock.blocked_id]", back_populates="blocked", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(BigInteger, Identity(always=True), primary_key=True)
    nama = Column(String(60), unique=True, nullable=False)
    tipe = Column(String(10), nullable=False)  # 'skill' or 'minat'

    __table_args__ = (
        CheckConstraint("tipe IN ('skill', 'minat')", name="skills_tipe_check"),
        Index("uq_skills_nama_lower", text("LOWER(nama)"), unique=True),
    )

    # Relationships
    user_skills = relationship("UserSkill", back_populates="skill", cascade="all, delete-orphan")


class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(BigInteger, ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True)
    level = Column(String(10), nullable=True)  # 'pemula', 'menengah', 'mahir'

    __table_args__ = (
        CheckConstraint("level IN ('pemula', 'menengah', 'mahir')", name="user_skills_level_check"),
        Index("idx_user_skills_skill", "skill_id"),
    )

    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")


class Friendship(Base):
    __tablename__ = "friendships"

    friendship_id = Column(BigInteger, Identity(always=True), primary_key=True)
    requester_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    addressee_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, server_default="menunggu")  # 'menunggu', 'diterima', 'ditolak'
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("requester_id", "addressee_id", name="uq_friendship"),
        Index("uq_friendship_pair", text("LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id)"), unique=True),
        CheckConstraint("status IN ('menunggu', 'diterima', 'ditolak')", name="friendships_status_check"),
        CheckConstraint("requester_id <> addressee_id", name="chk_friendship_self"),
        Index("idx_friendships_requester", "requester_id"),
        Index("idx_friendships_addressee", "addressee_id"),
        Index("idx_friendships_status", "status"),
    )

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_friendships")
    addressee = relationship("User", foreign_keys=[addressee_id], back_populates="received_friendships")


class UserBlock(Base):
    __tablename__ = "user_blocks"

    block_id = Column(BigInteger, Identity(always=True), primary_key=True)
    blocker_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    blocked_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    alasan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_user_block"),
        CheckConstraint("blocker_id <> blocked_id", name="chk_block_self"),
        Index("idx_user_blocks_blocker", "blocker_id"),
        Index("idx_user_blocks_blocked", "blocked_id"),
    )

    blocker = relationship("User", foreign_keys=[blocker_id], back_populates="blocks_initiated")
    blocked = relationship("User", foreign_keys=[blocked_id], back_populates="blocks_received")


class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    portfolio_id = Column(BigInteger, Identity(always=True), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    judul = Column(String(150), nullable=False)
    deskripsi = Column(Text, nullable=True)
    tautan_url = Column(String(255), nullable=True)
    gambar_url = Column(String(255), nullable=True)
    kategori = Column(String(30), nullable=False, server_default="proyek")  # 'proyek', 'skpi', 'sertifikat', 'artikel_ilmiah'
    nomor_dokumen = Column(String(100), nullable=True)
    penerbit = Column(String(150), nullable=True)
    tanggal_terbit = Column(Date, nullable=True)
    file_url = Column(String(255), nullable=True)
    status_verifikasi = Column(String(25), nullable=False, server_default="draft")  # 'draft', 'menunggu_review', 'terverifikasi', 'ditolak'
    diverifikasi_oleh = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    catatan_verifikasi = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    __table_args__ = (
        CheckConstraint("kategori IN ('proyek', 'skpi', 'sertifikat', 'artikel_ilmiah')", name="portfolio_items_kategori_check"),
        CheckConstraint("status_verifikasi IN ('draft', 'menunggu_review', 'terverifikasi', 'ditolak')", name="portfolio_items_status_verifikasi_check"),
        Index("idx_portfolio_user", "user_id"),
        Index("idx_portfolio_kategori", "kategori"),
        Index("idx_portfolio_verifikasi", "status_verifikasi"),
        Index(
            "idx_portfolio_review_fifo",
            "submitted_at",
            postgresql_where=text("status_verifikasi = 'menunggu_review'"),
        ),
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="portfolio_items")
    verifier = relationship("User", foreign_keys=[diverifikasi_oleh])
    skills = relationship("PortfolioSkill", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioSkill(Base):
    __tablename__ = "portfolio_skills"

    portfolio_id = Column(BigInteger, ForeignKey("portfolio_items.portfolio_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(BigInteger, ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True)

    portfolio = relationship("PortfolioItem", back_populates="skills")
    skill = relationship("Skill")


class Post(Base):
    __tablename__ = "posts"

    post_id = Column(BigInteger, Identity(always=True), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    isi = Column(Text, nullable=False)
    gambar_url = Column(String(255), nullable=True)  # Fokus Foto + Teks
    tipe = Column(String(15), nullable=False, server_default="umum")  # 'umum', 'cari_anggota'
    status = Column(String(20), nullable=False, server_default="draft")  # 'draft', 'tayang', 'menunggu_review', 'direview', 'ditolak', 'revisi', 'dihapus'
    is_deleted = Column(Boolean, nullable=False, server_default=text("false"))
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    alasan_hapus = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    __table_args__ = (
        CheckConstraint("tipe IN ('umum', 'cari_anggota')", name="posts_tipe_check"),
        CheckConstraint("status IN ('draft', 'tayang', 'menunggu_review', 'direview', 'ditolak', 'revisi', 'dihapus')", name="posts_status_check"),
        Index("idx_posts_user", "user_id"),
        Index("idx_posts_status", "status"),
        Index("idx_posts_deleted", "is_deleted"),
        CheckConstraint("(is_deleted = FALSE) OR (deleted_at IS NOT NULL AND deleted_by IS NOT NULL AND alasan_hapus IS NOT NULL AND status = 'dihapus')", name="posts_soft_delete_check"),
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="posts")
    deleter = relationship("User", foreign_keys=[deleted_by])
    skills = relationship("PostSkill", back_populates="post", cascade="all, delete-orphan")
    moderation_records = relationship("ModerationRecord", back_populates="post", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="post", cascade="all, delete-orphan")


class PostSkill(Base):
    __tablename__ = "post_skills"

    post_id = Column(BigInteger, ForeignKey("posts.post_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(BigInteger, ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True)

    post = relationship("Post", back_populates="skills")
    skill = relationship("Skill")


class ModerationRecord(Base):
    __tablename__ = "moderation_records"

    moderation_id = Column(BigInteger, Identity(always=True), primary_key=True)
    post_id = Column(BigInteger, ForeignKey("posts.post_id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    moderator_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    label_ai = Column(String(25), nullable=True)  # 'aman', 'perlu_review', 'berpotensi_melanggar'
    kategori_ai = Column(String(60), nullable=True)
    confidence = Column(REAL, nullable=True)
    penjelasan_ai = Column(Text, nullable=True)
    keputusan_admin = Column(String(20), nullable=True)  # 'setujui', 'tolak', 'minta_revisi', 'hapus_konten'
    keputusan_moderator = Column(String(20), nullable=True)  # 'setujui', 'tolak', 'minta_revisi', 'hapus_konten'
    catatan_admin = Column(Text, nullable=True)
    catatan_moderator = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    decided_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("label_ai IN ('aman', 'perlu_review', 'berpotensi_melanggar')", name="moderation_records_label_ai_check"),
        CheckConstraint("confidence BETWEEN 0 AND 1", name="moderation_records_confidence_check"),
        CheckConstraint("keputusan_admin IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten')", name="moderation_records_keputusan_admin_check"),
        CheckConstraint("keputusan_moderator IN ('setujui', 'tolak', 'minta_revisi', 'hapus_konten')", name="moderation_records_keputusan_moderator_check"),
        Index("idx_moderation_post", "post_id"),
        Index(
            "idx_moderation_pending",
            "created_at",
            postgresql_where=text("keputusan_admin IS NULL AND keputusan_moderator IS NULL")
        ),
    )

    # Relationships
    post = relationship("Post", back_populates="moderation_records")
    admin = relationship("User", foreign_keys=[admin_id])
    moderator = relationship("User", foreign_keys=[moderator_id])


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(BigInteger, Identity(always=True), primary_key=True)
    post_id = Column(BigInteger, ForeignKey("posts.post_id", ondelete="CASCADE"), nullable=False)
    pelapor_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    alasan = Column(Text, nullable=False)
    kategori_laporan = Column(String(50), nullable=False, server_default="konten_tidak_pantas")
    status = Column(String(15), nullable=False, server_default="baru")
    ditinjau_oleh = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    tindakan_diambil = Column(String(50), nullable=True)
    catatan_tinjauan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("kategori_laporan IN ('spam', 'konten_tidak_pantas', 'ujaran_kebencian', 'misinformasi', 'plagiarisme', 'lainnya')", name="reports_kategori_check"),
        CheckConstraint("status IN ('baru', 'diproses', 'selesai', 'diabaikan')", name="reports_status_check"),
        CheckConstraint("tindakan_diambil IN ('postingan_dihapus', 'peringatan', 'laporan_ditolak', 'sedang_investigasi')", name="reports_tindakan_diambil_check"),
        Index("idx_reports_post", "post_id"),
        Index("idx_reports_status", "status"),
        Index("idx_reports_kategori", "kategori_laporan"),
        Index("uq_reports_active_per_user", "post_id", "pelapor_id", unique=True, postgresql_where=text("status IN ('baru', 'diproses')")),
    )

    post = relationship("Post", back_populates="reports")
    reporter = relationship("User", foreign_keys=[pelapor_id], back_populates="reports_submitted")
    reviewer = relationship("User", foreign_keys=[ditinjau_oleh])


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    rec_id = Column(BigInteger, Identity(always=True), primary_key=True)
    pemohon_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    kandidat_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    kebutuhan_teks = Column(Text, nullable=True)
    skor = Column(REAL, nullable=False)
    alasan = Column(Text, nullable=True)
    umpan_balik = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    __table_args__ = (
        CheckConstraint("pemohon_id <> kandidat_id", name="chk_recommendation_self"),
        CheckConstraint("skor BETWEEN 0 AND 1", name="recommendation_logs_skor_check"),
        CheckConstraint("umpan_balik IN ('relevan', 'tidak_relevan')", name="recommendation_logs_umpan_balik_check"),
        Index("idx_reclog_pemohon", "pemohon_id"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, Identity(always=True), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    jenis = Column(String(30), nullable=False)
    judul = Column(String(150), nullable=False)
    isi = Column(Text, nullable=False)
    tautan = Column(String(255), nullable=True)
    ref_type = Column(String(30), nullable=True)
    ref_id = Column(BigInteger, nullable=True)
    is_read = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "jenis IN ('moderasi_disetujui', 'moderasi_revisi', 'moderasi_ditolak', 'moderasi_takedown', "
            "'laporan_selesai', 'laporan_diabaikan', 'pertemanan_diterima', 'pertemanan_baru', "
            "'skpi_terverifikasi', 'skpi_ditolak')",
            name="notifications_jenis_check",
        ),
        CheckConstraint("tautan IS NULL OR tautan LIKE '/%'", name="notifications_tautan_check"),
        Index("idx_notifications_user_created", "user_id", text("created_at DESC")),
        Index(
            "idx_notifications_unread",
            "user_id",
            text("created_at DESC"),
            postgresql_where=text("is_read = FALSE"),
        ),
        Index(
            "uq_notifications_ref",
            "user_id",
            "jenis",
            "ref_type",
            "ref_id",
            unique=True,
            postgresql_where=text("ref_type IS NOT NULL AND ref_id IS NOT NULL"),
        ),
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
