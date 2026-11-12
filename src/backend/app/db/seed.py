import argparse
import os
import sys
from datetime import date, datetime, timedelta

import bcrypt
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import Session

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.entities import (
    Friendship,
    ModerationRecord,
    Notification,
    PortfolioItem,
    Post,
    PostSkill,
    Report,
    Skill,
    User,
    UserBlock,
    UserSkill,
)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


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
    {"nama": "Next.js", "tipe": "skill"},
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
    {"nama": "Riset Ilmiah", "tipe": "minat"},
]

INITIAL_USERS = [
    # Mahasiswa (Team 3 & Demo Users)
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
        "bio": "Hipster / UI/UX & Mobile Developer. Merancang antarmuka intuitif dan implementasi Flutter & Next.js.",
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
        "bio": "Frontend Web enthusiast yang mendalami React, Next.js, TailwindCSS, dan konsumsi REST API.",
        "kontak_url": "https://github.com/aisyahputri",
        "role": "mahasiswa",
        "skills": [("React", "menengah"), ("Next.js", "menengah"), ("TailwindCSS", "mahir"), ("Web Development", "menengah")]
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

    # Moderator (Kaprodi TI & SI)
    {
        "nim": "198005122005011001",
        "nama": "Dr. Ir. Budi Santoso, M.Kom (Kaprodi TI)",
        "email": "kaprodi.ti@campus.ac.id",
        "password": "kaprodipassword123",
        "jurusan": "Teknik Informatika",
        "angkatan": None,
        "bio": "Ketua Program Studi Teknik Informatika. Bertanggung jawab memoderasi postingan mahasiswa dan validasi pencatatan SKPI & Artikel Ilmiah prodi TI.",
        "kontak_url": "https://ti.campus.ac.id",
        "role": "moderator",
        "skills": []
    },
    {
        "nim": "198307202008022002",
        "nama": "Dr. Sri Wahyuni, S.Kom., M.T. (Kaprodi SI)",
        "email": "kaprodi.si@campus.ac.id",
        "password": "kaprodipassword123",
        "jurusan": "Sistem Informasi",
        "angkatan": None,
        "bio": "Ketua Program Studi Sistem Informasi. Mengelola moderasi konten mahasiswa SI dan verifikasi portofolio sertifikasi kompetensi.",
        "kontak_url": "https://si.campus.ac.id",
        "role": "moderator",
        "skills": []
    },

    # Admin Kampus (Biro Kemahasiswaan)
    {
        "nim": "199001012020121001",
        "nama": "Super Admin Kemahasiswaan",
        "email": "admin@campus.ac.id",
        "password": "adminpassword123",
        "jurusan": "Biro Kemahasiswaan & Alumni",
        "angkatan": None,
        "bio": "Administrator pusat kampus dan pengawas etika media sosial serta pengelola sanksi & takedown.",
        "kontak_url": "https://campus.ac.id",
        "role": "admin",
        "skills": []
    }
]


def reset_database(db: Session):
    print("-> Mereset seluruh tabel data (mode --reset)...")
    tables = [
        "notifications",
        "reports",
        "moderation_records",
        "post_skills",
        "posts",
        "user_skills",
        "portfolio_items",
        "friendships",
        "user_blocks",
        "recommendation_logs",
        "users",
        "skills",
    ]
    for tbl in tables:
        try:
            db.execute(text(f"DELETE FROM {tbl};"))
        except Exception as e:
            print(f"   ! Warning membersihkan tabel {tbl}: {e}")
    db.commit()
    print("   [OK] Seluruh data lama berhasil dibersihkan secara aman.")


def seed_core_data(db: Session):
    print("-> Seeding Master Skills & Interests...")
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

    print(f"   [OK] {len(INITIAL_SKILLS)} Keahlian & Minat terverifikasi.")

    print("-> Seeding Akun Pengguna & Role...")
    user_map = {}
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
            user_map[u["email"]] = user.user_id

            for skill_name, level in u["skills"]:
                if skill_name in skill_map:
                    user_skill = UserSkill(
                        user_id=user.user_id,
                        skill_id=skill_map[skill_name],
                        level=level
                    )
                    db.add(user_skill)
            print(f"   + User dibuat: {user.nama} ({user.role} - {user.jurusan})")
        else:
            user_map[u["email"]] = existing_user.user_id
            print(f"   . User sudah ada: {existing_user.nama} ({existing_user.role})")

    db.commit()
    return user_map, skill_map


def seed_demo_data(db: Session, user_map: dict, skill_map: dict):
    print("\n-> Seeding Demo Activities (--demo mode) dengan Relative Timestamps...")
    now = datetime.utcnow()

    # 1. Demo Friendships
    rifqi_id = user_map.get("rifqi@campus.ac.id")
    hakim_id = user_map.get("hakim@campus.ac.id")
    rama_id = user_map.get("ramadhan@campus.ac.id")
    aisyah_id = user_map.get("aisyah@campus.ac.id")
    dimas_id = user_map.get("dimas@campus.ac.id")

    if rifqi_id and hakim_id:
        f1 = db.query(Friendship).filter(Friendship.requester_id == rifqi_id, Friendship.addressee_id == hakim_id).first()
        if not f1:
            db.add(Friendship(requester_id=rifqi_id, addressee_id=hakim_id, status="diterima", created_at=now - timedelta(days=5)))
            print("   + Pertemanan aktif: Rifqi <-> Hakim")

    if rama_id and rifqi_id:
        f2 = db.query(Friendship).filter(Friendship.requester_id == rama_id, Friendship.addressee_id == rifqi_id).first()
        if not f2:
            db.add(Friendship(requester_id=rama_id, addressee_id=rifqi_id, status="menunggu", created_at=now - timedelta(hours=3)))
            print("   + Permintaan teman: Rama -> Rifqi (menunggu)")

    # 2. Demo User Block (Aisyah memblokir Dimas untuk demo privacy filter US-14)
    if aisyah_id and dimas_id:
        b1 = db.query(UserBlock).filter(UserBlock.blocker_id == aisyah_id, UserBlock.blocked_id == dimas_id).first()
        if not b1:
            db.add(UserBlock(blocker_id=aisyah_id, blocked_id=dimas_id, alasan="Akun spam di linimasa", created_at=now - timedelta(days=2)))
            print("   + Blokir demo: Aisyah memblokir Dimas")

    # 3. Demo Portfolio Items
    kaprodi_ti_id = user_map.get("kaprodi.ti@campus.ac.id")
    kaprodi_si_id = user_map.get("kaprodi.si@campus.ac.id")

    demo_portfolios = [
        {
            "user_id": rifqi_id,
            "judul": "Sistem Rekomendasi Kolaborator Proyek Kampus",
            "deskripsi": "Pengembangan modul NLP cerdas menggunakan Cosine Similarity dan TF-IDF untuk mencocokkan keterampilan mahasiswa secara otomatis.",
            "tautan_url": "https://github.com/campusfolio/ai-recommender",
            "kategori": "proyek",
            "nomor_dokumen": None,
            "penerbit": None,
            "status_verifikasi": "draft",
            "diverifikasi_oleh": None,
            "submitted_at": None,
            "verified_at": None,
        },
        {
            "user_id": rifqi_id,
            "judul": "Sertifikasi Kompetensi Associate Data Scientist (BNSP)",
            "deskripsi": "Sertifikat resmi kompetensi bidang Data Science dan Machine Learning berskala nasional.",
            "tautan_url": "https://bnsp.go.id/cert/2026-DS-01",
            "kategori": "sertifikat",
            "nomor_dokumen": "BNSP-DS-2026-9912",
            "penerbit": "Badan Nasional Sertifikasi Profesi (BNSP)",
            "status_verifikasi": "terverifikasi",
            "diverifikasi_oleh": kaprodi_ti_id,
            "submitted_at": now - timedelta(days=10),
            "verified_at": now - timedelta(days=8),
        },
        {
            "user_id": rifqi_id,
            "judul": "Analisis Efektivitas Algoritma Cosine Similarity pada Perekrutan Tim Proyek Kampus",
            "deskripsi": "Publikasi artikel ilmiah pada Jurnal Nasional Terakreditasi SINTA 2 mengenai information retrieval.",
            "tautan_url": "https://doi.org/10.1234/campusfolio.demo.5678",
            "kategori": "artikel_ilmiah",
            "nomor_dokumen": "10.1234/campusfolio.demo.5678",
            "penerbit": "Jurnal Teknologi Informasi dan Sistem Komputer",
            "status_verifikasi": "menunggu_review",
            "diverifikasi_oleh": None,
            "submitted_at": now - timedelta(hours=6),
            "verified_at": None,
        },
        {
            "user_id": hakim_id,
            "judul": "Desain Sistem UI/UX Aplikasi CampusFolio",
            "deskripsi": "Perancangan wireframe, interaksi, dan token desain mobile Academic Modernist menggunakan Figma dan Google Stitch.",
            "tautan_url": "https://stitch.withgoogle.com",
            "kategori": "skpi",
            "nomor_dokumen": "SKPI-SI-2026-0042",
            "penerbit": "Fakultas Sains dan Matematika",
            "status_verifikasi": "terverifikasi",
            "diverifikasi_oleh": kaprodi_si_id,
            "submitted_at": now - timedelta(days=14),
            "verified_at": now - timedelta(days=12),
        }
    ]

    for p in demo_portfolios:
        if p["user_id"]:
            existing_p = db.query(PortfolioItem).filter(
                PortfolioItem.user_id == p["user_id"],
                PortfolioItem.judul == p["judul"]
            ).first()
            if not existing_p:
                port = PortfolioItem(
                    user_id=p["user_id"],
                    judul=p["judul"],
                    deskripsi=p["deskripsi"],
                    tautan_url=p["tautan_url"],
                    kategori=p["kategori"],
                    nomor_dokumen=p["nomor_dokumen"],
                    penerbit=p["penerbit"],
                    tanggal_terbit=(now - timedelta(days=30)).date(),
                    status_verifikasi=p["status_verifikasi"],
                    diverifikasi_oleh=p["diverifikasi_oleh"],
                    submitted_at=p["submitted_at"],
                    verified_at=p["verified_at"],
                    created_at=now - timedelta(days=20),
                )
                db.add(port)
                print(f"   + Portofolio: {p['judul']} [{p['kategori']} - {p['status_verifikasi']}]")

    # 4. Demo Posts
    demo_posts = [
        {
            "user_id": rifqi_id,
            "isi": "Halo rekan-rekan! Kami dari Team 3 sedang mencari 1 anggota Frontend Engineer yang menguasai Next.js dan TailwindCSS untuk kolaborasi proyek Hackathon Inovasi Kampus 2026. Yuk join!",
            "tipe": "cari_anggota",
            "status": "tayang",
            "created_at": now - timedelta(hours=2),
            "skills": ["Next.js", "TailwindCSS"],
        },
        {
            "user_id": hakim_id,
            "isi": "Eksplorasi komponen desain Stitch UI/UX baru saja rampung. Menggabungkan palet Academic Modernist dengan navigasi mobile Expo. Bagaimana menurut kalian?",
            "tipe": "umum",
            "status": "tayang",
            "created_at": now - timedelta(hours=5),
            "skills": ["UI/UX Design", "Figma", "Flutter"],
        },
        {
            "user_id": dimas_id,
            "isi": "Testing postingan dengan potensi kata kunci sensitif untuk pengujian modul AI moderasi teks kampus.",
            "tipe": "umum",
            "status": "menunggu_review",
            "created_at": now - timedelta(minutes=45),
            "skills": [],
        },
        {
            "user_id": rama_id,
            "isi": "Postingan ini berpotensi dilaporkan untuk mendemonstrasikan antrean triase laporan pelanggaran admin pada sesi sidang.",
            "tipe": "umum",
            "status": "tayang",
            "created_at": now - timedelta(hours=8),
            "skills": [],
        }
    ]

    for post_data in demo_posts:
        if post_data["user_id"]:
            existing_post = db.query(Post).filter(
                Post.user_id == post_data["user_id"],
                Post.isi == post_data["isi"]
            ).first()
            if not existing_post:
                new_post = Post(
                    user_id=post_data["user_id"],
                    isi=post_data["isi"],
                    tipe=post_data["tipe"],
                    status=post_data["status"],
                    created_at=post_data["created_at"],
                )
                db.add(new_post)
                db.flush()

                # Hubungkan skills ke post
                for sk_name in post_data["skills"]:
                    if sk_name in skill_map:
                        db.add(PostSkill(post_id=new_post.post_id, skill_id=skill_map[sk_name]))

                # Catatan moderasi AI untuk post menunggu review
                if post_data["status"] == "menunggu_review":
                    mod_rec = ModerationRecord(
                        post_id=new_post.post_id,
                        label_ai="perlu_review",
                        kategori_ai="konten_sensitif_kampus",
                        confidence=0.78,
                        penjelasan_ai="Teks mengandung istilah sensitif yang memerlukan verifikasi manual oleh Kaprodi/Admin.",
                        created_at=post_data["created_at"],
                    )
                    db.add(mod_rec)

                # Laporan demo untuk post Rama
                if post_data["user_id"] == rama_id and aisyah_id:
                    rep = Report(
                        post_id=new_post.post_id,
                        reporter_id=aisyah_id,
                        kategori_laporan="konten_tidak_pantas",
                        alasan="Demo pengujian alur penanganan laporan pelanggaran feed kampus.",
                        status="pending",
                        created_at=now - timedelta(hours=1),
                    )
                    db.add(rep)

                print(f"   + Postingan: [{post_data['tipe']}] {post_data['isi'][:60]}... ({post_data['status']})")

    # 5. Demo Notifications
    if rifqi_id and rama_id:
        notif1 = Notification(
            user_id=rifqi_id,
            actor_id=rama_id,
            jenis="pertemanan_baru",
            judul="Permohonan Pertemanan Masuk",
            isi="Ramadhan (Rama) mengirimkan permohonan pertemanan kepada Anda.",
            ref_type="friendship",
            ref_id=1,
            is_read=False,
            created_at=now - timedelta(hours=3),
        )
        db.add(notif1)

    db.commit()
    print("   [OK] Data aktivitas demo berhasil dimuat.")


def main():
    parser = argparse.ArgumentParser(description="Seeding database CampusFolio")
    parser.add_argument("--demo", action="store_true", help="Muat data demo linimasa, portofolio, dan pertemanan")
    parser.add_argument("--reset", action="store_true", help="Bersihkan seluruh data lama sebelum seeding (idempoten)")
    args = parser.parse_args()

    # Fail-fast security check for production
    if settings.ENV.lower() in ("production", "prod"):
        print("[ABORT] Seeding dilarang keras berjalan pada environment 'production' demi keamanan data.")
        sys.exit(1)

    print(f"=== Memulai Seeding CampusFolio DB [Environment: {settings.ENV}] ===")
    db: Session = SessionLocal()

    try:
        if args.reset:
            reset_database(db)

        user_map, skill_map = seed_core_data(db)
        if args.demo:
            seed_demo_data(db, user_map, skill_map)

        print("\n" + "=" * 60)
        print(" [SUCCESS] Seeding database selesai dengan sukses!")
        print("=" * 60)
        print(" Kredensial Akun Demo Sidang:")
        print(" 1. Mahasiswa (Hacker):  rifqi@campus.ac.id     / password123")
        print(" 2. Mahasiswa (Hipster): hakim@campus.ac.id     / password123")
        print(" 3. Mahasiswa (Hustler): ramadhan@campus.ac.id  / password123")
        print(" 4. Kaprodi TI:          kaprodi.ti@campus.ac.id/ kaprodipassword123")
        print(" 5. Kaprodi SI:          kaprodi.si@campus.ac.id/ kaprodipassword123")
        print(" 6. Admin Kampus:        admin@campus.ac.id     / adminpassword123")
        print("=" * 60)
    except Exception as e:
        db.rollback()
        print(f"\n[FATAL ERROR] Terjadi kegagalan saat proses seeding: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
