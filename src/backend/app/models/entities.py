from sqlalchemy import Column, BigInteger, String, Integer, Text, Float, DateTime, Date, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, index=True)
    nim = Column(String(20), unique=True, nullable=False, index=True)
    nama = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    jurusan = Column(String(100), nullable=True)
    angkatan = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    kontak_url = Column(String(255), nullable=True)
    role = Column(String(15), nullable=False, default="mahasiswa")  # 'mahasiswa', 'moderator', 'admin'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    portfolio_items = relationship("PortfolioItem", foreign_keys="[PortfolioItem.user_id]", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", foreign_keys="[Post.user_id]", back_populates="user", cascade="all, delete-orphan")
    reports_submitted = relationship("Report", foreign_keys="[Report.pelapor_id]", back_populates="reporter", cascade="all, delete-orphan")
    
    # Friendships
    sent_friendships = relationship("Friendship", foreign_keys="[Friendship.requester_id]", back_populates="requester", cascade="all, delete-orphan")
    received_friendships = relationship("Friendship", foreign_keys="[Friendship.addressee_id]", back_populates="addressee", cascade="all, delete-orphan")
    
    # Blocks
    blocks_initiated = relationship("UserBlock", foreign_keys="[UserBlock.blocker_id]", back_populates="blocker", cascade="all, delete-orphan")
    blocks_received = relationship("UserBlock", foreign_keys="[UserBlock.blocked_id]", back_populates="blocked", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(BigInteger, primary_key=True, index=True)
    nama = Column(String(60), unique=True, nullable=False, index=True)
    tipe = Column(String(10), nullable=False)  # 'skill' or 'minat'

    # Relationships
    user_skills = relationship("UserSkill", back_populates="skill", cascade="all, delete-orphan")

class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(BigInteger, ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True)
    level = Column(String(10), nullable=True)  # 'pemula', 'menengah', 'mahir'

    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")

class Friendship(Base):
    __tablename__ = "friendships"

    friendship_id = Column(BigInteger, primary_key=True, index=True)
    requester_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    addressee_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="menunggu", index=True)  # 'menunggu', 'diterima', 'ditolak'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('requester_id', 'addressee_id', name='uq_friendship'),
    )

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_friendships")
    addressee = relationship("User", foreign_keys=[addressee_id], back_populates="received_friendships")

class UserBlock(Base):
    __tablename__ = "user_blocks"

    block_id = Column(BigInteger, primary_key=True, index=True)
    blocker_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    alasan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('blocker_id', 'blocked_id', name='uq_user_block'),
    )

    blocker = relationship("User", foreign_keys=[blocker_id], back_populates="blocks_initiated")
    blocked = relationship("User", foreign_keys=[blocked_id], back_populates="blocks_received")

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    portfolio_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    judul = Column(String(150), nullable=False)
    deskripsi = Column(Text, nullable=True)
    tautan_url = Column(String(255), nullable=True)
    gambar_url = Column(String(255), nullable=True)
    kategori = Column(String(30), nullable=False, default="proyek", index=True)  # 'proyek', 'skpi', 'sertifikat', 'artikel_ilmiah'
    nomor_dokumen = Column(String(100), nullable=True)
    penerbit = Column(String(150), nullable=True)
    tanggal_terbit = Column(Date, nullable=True)
    file_url = Column(String(255), nullable=True)
    status_verifikasi = Column(String(25), nullable=False, default="draft", index=True)  # 'draft', 'menunggu_review', 'terverifikasi', 'ditolak'
    diverifikasi_oleh = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    catatan_verifikasi = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

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

    post_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    isi = Column(Text, nullable=False)
    gambar_url = Column(String(255), nullable=True)  # Fokus Foto + Teks
    tipe = Column(String(15), nullable=False, default="umum")  # 'umum', 'cari_anggota'
    status = Column(String(20), nullable=False, default="draft", index=True)  # 'draft', 'tayang', 'menunggu_review', 'direview', 'ditolak', 'revisi', 'dihapus'
    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    alasan_hapus = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

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

    moderation_id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(BigInteger, ForeignKey("posts.post_id", ondelete="CASCADE"), nullable=False, index=True)
    admin_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    moderator_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    label_ai = Column(String(25), nullable=True)  # 'aman', 'perlu_review', 'berpotensi_melanggar'
    kategori_ai = Column(String(60), nullable=True)
    confidence = Column(Float, nullable=True)
    penjelasan_ai = Column(Text, nullable=True)
    keputusan_admin = Column(String(20), nullable=True)  # 'setujui', 'tolak', 'minta_revisi', 'hapus_konten'
    keputusan_moderator = Column(String(20), nullable=True)  # 'setujui', 'tolak', 'minta_revisi', 'hapus_konten'
    catatan_admin = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    decided_at = Column(DateTime, nullable=True)

    # Relationships
    post = relationship("Post", back_populates="moderation_records")
    admin = relationship("User", foreign_keys=[admin_id])
    moderator = relationship("User", foreign_keys=[moderator_id])

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(BigInteger, ForeignKey("posts.post_id", ondelete="CASCADE"), nullable=False, index=True)
    pelapor_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    alasan = Column(Text, nullable=False)
    kategori_laporan = Column(String(50), nullable=False, default="konten_tidak_pantas", index=True)  # 'spam', 'konten_tidak_pantas', 'ujaran_kebencian', 'misinformasi', 'plagiarisme', 'lainnya'
    status = Column(String(15), nullable=False, default="baru", index=True)  # 'baru', 'diproses', 'selesai', 'diabaikan'
    ditinjau_oleh = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    tindakan_diambil = Column(String(50), nullable=True)  # 'postingan_dihapus', 'peringatan', 'laporan_ditolak', 'sedang_investigasi'
    catatan_tinjauan = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    post = relationship("Post", back_populates="reports")
    reporter = relationship("User", foreign_keys=[pelapor_id], back_populates="reports_submitted")
    reviewer = relationship("User", foreign_keys=[ditinjau_oleh])

class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    rec_id = Column(BigInteger, primary_key=True, index=True)
    pemohon_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    kandidat_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    kebutuhan_teks = Column(Text, nullable=True)
    skor = Column(Float, nullable=False)
    alasan = Column(Text, nullable=True)
    umpan_balik = Column(String(15), nullable=True)  # 'relevan', 'tidak_relevan'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
