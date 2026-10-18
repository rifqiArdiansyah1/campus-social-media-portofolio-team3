import os
import bcrypt
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.entities import User, Skill, UserSkill, Post, PortfolioItem

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

INITIAL_SKILLS = [
    # Keahlian (Skills)
    {"nama": "Flutter", "tipe": "skill"},
    {"nama": "Dart", "tipe": "skill"},
    {"nama": "Python", "tipe": "skill"},
    {"nama": "FastAPI", "tipe": "skill"},
    {"nama": "PostgreSQL", "tipe": "skill"},
    {"nama": "UI/UX Design", "tipe": "skill"},
    {"nama": "Figma", "tipe": "skill"},
    {"nama": "Machine Learning", "tipe": "skill"},
    {"nama": "Data Science", "tipe": "skill"},
    {"nama": "React", "tipe": "skill"},
    {"nama": "TailwindCSS", "tipe": "skill"},
    {"nama": "Product Management", "tipe": "skill"},
    {"nama": "Business Strategy", "tipe": "skill"},
    {"nama": "Market Research", "tipe": "skill"},
    {"nama": "Git", "tipe": "skill"},

    # Minat (Interests)
    {"nama": "Artificial Intelligence", "tipe": "minat"},
    {"nama": "Mobile Development", "tipe": "minat"},
    {"nama": "Web Development", "tipe": "minat"},
    {"nama": "Hackathon", "tipe": "minat"},
    {"nama": "Start-up & Bisnis", "tipe": "minat"},
    {"nama": "Open Source", "tipe": "minat"},
    {"nama": "Design Thinking", "tipe": "minat"},
]

INITIAL_USERS = [
    {
        "nim": "24060122140001",
        "nama": "Moh. Rifqi Dwi Ardiansyah",
        "email": "rifqi@campus.ac.id",
        "password": "password123",
        "jurusan": "Teknik Informatika",
        "angkatan": 2022,
        "bio": "Hacker / Backend & AI Engineer. Mengembangkan REST API performa tinggi dengan FastAPI, PostgreSQL, dan pipeline NLP.",
        "kontak_url": "https://github.com/rifqiArdiansyah1",
        "role": "mahasiswa",
        "skills": [("Python", "mahir"), ("FastAPI", "mahir"), ("PostgreSQL", "menengah"), ("Git", "mahir"), ("Artificial Intelligence", "menengah")]
    },
    {
        "nim": "24060122140002",
        "nama": "Hakim",
        "email": "hakim@campus.ac.id",
        "password": "password123",
        "jurusan": "Sistem Informasi",
        "angkatan": 2022,
        "bio": "Hipster / UI/UX & Mobile Developer. Merancang antarmuka intuitif dan implementasi Flutter Web/Mobile.",
        "kontak_url": "https://github.com/Hakim-Shareit",
        "role": "mahasiswa",
        "skills": [("Flutter", "mahir"), ("Dart", "mahir"), ("Figma", "mahir"), ("UI/UX Design", "mahir"), ("Mobile Development", "mahir")]
    },
    {
        "nim": "24060122140003",
        "nama": "Ramadhan (Rama)",
        "email": "ramadhan@campus.ac.id",
        "password": "password123",
        "jurusan": "Manajemen Bisnis",
        "angkatan": 2022,
        "bio": "Hustler / Product Lead. Berpengalaman riset pasar, perumusan problem-solution fit, dan presentasi lomba inovasi.",
        "kontak_url": "https://linkedin.com/in/ramadhan-team3",
        "role": "mahasiswa",
        "skills": [("Product Management", "mahir"), ("Business Strategy", "mahir"), ("Market Research", "mahir"), ("Start-up & Bisnis", "mahir")]
    },
    {
        "nim": "24060122140004",
        "nama": "Aisyah Putri",
        "email": "aisyah@campus.ac.id",
        "password": "password123",
        "jurusan": "Teknik Informatika",
        "angkatan": 2023,
        "bio": "Frontend Web enthusiast yang mendalami React, TailwindCSS, dan konsumsi REST API.",
        "kontak_url": "https://github.com/aisyahputri",
        "role": "mahasiswa",
        "skills": [("React", "menengah"), ("TailwindCSS", "mahir"), ("Web Development", "menengah")]
    },
    {
        "nim": "24060122140005",
        "nama": "Dimas Pratama",
        "email": "dimas@campus.ac.id",
        "password": "password123",
        "jurusan": "Ilmu Komputer",
        "angkatan": 2022,
        "bio": "Data Scientist dan NLP Researcher. Tertarik pada sentence transformers, TF-IDF, dan information retrieval.",
        "kontak_url": "https://github.com/dimaspratama",
        "role": "mahasiswa",
        "skills": [("Python", "mahir"), ("Machine Learning", "mahir"), ("Data Science", "menengah"), ("Artificial Intelligence", "mahir")]
    },
    {
        "nim": "199001012020121001",
        "nama": "Admin Moderator Kampus",
        "email": "admin@campus.ac.id",
        "password": "adminpassword123",
        "jurusan": "Biro Kemahasiswaan",
        "angkatan": None,
        "bio": "Administrator dan pengawas konten etika media sosial kampus.",
        "kontak_url": "https://campus.ac.id",
        "role": "admin",
        "skills": []
    }
]

def seed_database():
    db: Session = SessionLocal()
    print("Memulai proses seeding database Supabase PostgreSQL...")

    try:
        # 1. Seed Skills & Interests
        skill_map = {}
        for s in INITIAL_SKILLS:
            existing = db.query(Skill).filter(Skill.nama == s["nama"]).first()
            if not existing:
                new_skill = Skill(nama=s["nama"], tipe=s["tipe"])
                db.add(new_skill)
                db.flush()
                skill_map[s["nama"]] = new_skill.skill_id
            else:
                skill_map[s["nama"]] = existing.skill_id
        
        print(f"[OK] {len(INITIAL_SKILLS)} Keahlian & Minat berhasil diverifikasi/ditambahkan.")

        # 2. Seed Users & User Skills
        for u in INITIAL_USERS:
            existing_user = db.query(User).filter(User.email == u["email"]).first()
            if not existing_user:
                hashed_pw = hash_password(u["password"])
                user = User(
                    nim=u["nim"],
                    nama=u["nama"],
                    email=u["email"],
                    password_hash=hashed_pw,
                    jurusan=u["jurusan"],
                    angkatan=u["angkatan"],
                    bio=u["bio"],
                    kontak_url=u["kontak_url"],
                    role=u["role"]
                )
                db.add(user)
                db.flush()

                # Add user skills
                for skill_name, level in u["skills"]:
                    if skill_name in skill_map:
                        user_skill = UserSkill(
                            user_id=user.user_id,
                            skill_id=skill_map[skill_name],
                            level=level
                        )
                        db.add(user_skill)

                print(f" + User dibuat: {user.nama} ({user.role})")
            else:
                print(f" . User sudah ada: {existing_user.nama}")

        db.commit()
        print("\n[SUCCESS] Seeding selesai dengan sukses! Database Supabase siap digunakan.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] saat seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
