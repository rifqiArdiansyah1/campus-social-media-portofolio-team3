from sqlalchemy import Column, BigInteger, String, Integer, Text, Float, DateTime, ForeignKey, CheckConstraint
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
    role = Column(String(10), nullable=False, default="mahasiswa")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    portfolio_items = relationship("PortfolioItem", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reporter", cascade="all, delete-orphan")

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

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    portfolio_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    judul = Column(String(150), nullable=False)
    deskripsi = Column(Text, nullable=True)
    tautan_url = Column(String(255), nullable=True)
    gambar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="portfolio_items")
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
    tipe = Column(String(15), nullable=False, default="umum")  # 'umum' or 'cari_anggota'
    status = Column(String(10), nullable=False, default="draft", index=True)  # 'draft', 'tayang', 'direview', 'ditolak', 'revisi'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="posts")
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
    label_ai = Column(String(25), nullable=True)  # 'aman', 'perlu_review', 'berpotensi_melanggar'
    kategori_ai = Column(String(60), nullable=True)
    confidence = Column(Float, nullable=True)
    penjelasan_ai = Column(Text, nullable=True)
    keputusan_admin = Column(String(15), nullable=True)  # 'setujui', 'tolak', 'minta_revisi'
    catatan_admin = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    decided_at = Column(DateTime, nullable=True)

    # Relationships
    post = relationship("Post", back_populates="moderation_records")
    admin = relationship("User")

class Report(Base):
    __tablename__ = "reports"

    report_id = Column(BigInteger, primary_key=True, index=True)
    post_id = Column(BigInteger, ForeignKey("posts.post_id", ondelete="CASCADE"), nullable=False, index=True)
    pelapor_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    alasan = Column(Text, nullable=False)
    status = Column(String(10), nullable=False, default="baru")  # 'baru', 'diproses', 'selesai'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    post = relationship("Post", back_populates="reports")
    reporter = relationship("User", back_populates="reports")

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
