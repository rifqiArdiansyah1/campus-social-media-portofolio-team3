# CampusFolio Backend API & AI Engine

Backend layanan REST API dan pipeline AI untuk platform **CampusFolio** (Team 3), dibangun menggunakan **FastAPI**, **SQLAlchemy 2.x**, **PostgreSQL Supabase**, dan **Scikit-Learn NLP**.

---

## 🛠️ Persyaratan Lingkungan
- Python 3.11 atau lebih baru
- PostgreSQL 15 (Supabase Cloud Free Tier dengan Session Pooler IPv4)
- Git & npm (untuk web client)

---

## 🚀 Panduan Menjalankan Backend (Lokal)

1. **Masuk ke direktori backend:**
   ```bash
   cd src/backend
   ```

2. **Buat virtual environment & aktifkan:**
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependensi aplikasi & development:**
   ```bash
   pip install -r requirements.txt -r requirements-dev.txt
   ```

4. **Siapkan konfigurasi `.env`:**
   Salin `.env.example` ke `.env` dan sesuaikan koneksi basis data Supabase:
   ```bash
   cp .env.example .env
   ```

---

## 🗄️ Runbook Migrasi Basis Data (Alembic)

Sistem migrasi database resmi dikelola menggunakan **Alembic** yang terhubung langsung ke model `entities.py`.

### Skenario A: Menyiapkan Database Bersih / Kosong (Lokal & CI)
Gunakan skenario ini jika Anda menjalankan database lokal PostgreSQL baru atau service container CI:
```bash
cd src/backend
python -m alembic upgrade head
```

### Skenario B: Menghubungkan ke Database Supabase Tim yang Sudah Ada
Karena database Supabase bersama tim sudah memiliki tabel awal dari perkuliahan:
1. Tandai baseline awal skema v1.0:
   ```bash
   cd src/backend
   python -m alembic stamp 001_initial_schema
   ```
2. Jalankan pembaruan revisi klien v1.1 secara aman:
   ```bash
   python -m alembic upgrade head
   ```

### Skenario C: Mengembangkan Migrasi Skema Baru
Jika ada perubahan pada model di `app/models/entities.py`:
1. Buat revisi migrasi baru dengan deteksi otomatis:
   ```bash
   cd src/backend
   python -m alembic revision --autogenerate -m "deskripsi_perubahan"
   ```
2. Periksa berkas baru di `alembic/versions/` dan terapkan:
   ```bash
   python -m alembic upgrade head
   ```
3. Ekspor kembali kontrak OpenAPI jika ada rute baru:
   ```bash
   python ../../scripts/export_openapi.py
   ```

---

## 🌱 Seeding Data Pengguna & Data Demo

1. **Seeding Master Data (Keahlian & Akun Tim):**
   ```bash
   cd src/backend
   python -m app.db.seed
   ```

2. **Seeding Data Demo Lengkap (Linimasa, SKPI, Pertemanan, Blokir):**
   ```bash
   cd src/backend
   python -m app.db.seed --demo
   ```
   > [!NOTE]
   > Proses seeding ini bersifat idempoten (aman dijalankan berulang kali tanpa menduplikasi baris). Seeding otomatis ditolak jika `ENV=production`.

---

## 🧪 Pengujian & Linting Kode

1. **Jalankan Linter Ruff:**
   ```bash
   python -m ruff check src/backend
   ```

2. **Jalankan Test Suite (Pytest):**
   ```bash
   cd src/backend
   python -m pytest tests/
   ```
   *Mencakup pengujian validasi storage, sanitasi EXIF, deteksi magic bytes, kontrak format error, dan verifikasi kesetaraan skema (schema parity).*

---

## 🏃 Menjalankan Server API

```bash
cd src/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check Database:** [http://localhost:8000/api/v1/health/db](http://localhost:8000/api/v1/health/db)
- **Health Check Storage:** [http://localhost:8000/api/v1/health/storage](http://localhost:8000/api/v1/health/storage)

---

## 📂 Struktur Direktori Backend
```text
src/backend/
├── alembic/                # Lingkungan migrasi database Alembic
│   ├── versions/           # Skrip revisi migrasi (001_initial, 002_client_revisions)
│   └── env.py              # Konfigurasi koneksi migrasi & NullPool
├── alembic.ini             # Konfigurasi Alembic
├── app/
│   ├── api/v1/
│   │   ├── endpoints/      # Sub-router per fitur
│   │   └── router.py       # Pengumpul router terpusat
│   ├── core/
│   │   ├── config.py       # Pydantic v2 Settings & fail-fast validation
│   │   ├── database.py     # SQLAlchemy engine & get_db dependency
│   │   └── exceptions.py   # AppError & standardized error contract
│   ├── db/
│   │   └── seed.py         # Seeding idempoten dengan opsi --demo
│   ├── models/
│   │   └── entities.py     # 12 tabel SQLAlchemy 2.x sinkron dengan schema.sql
│   ├── schemas/            # Pydantic schemas untuk I/O API
│   ├── services/
│   │   ├── ai_engine/      # Recommender TF-IDF & Content Moderator
│   │   └── storage.py      # Layanan Supabase Storage aman & sanitasi EXIF
│   └── main.py             # Entrypoint FastAPI, CORS, & Exception Handlers
├── tests/                  # Test suite Pytest & Schema Parity
├── requirements.txt        # Dependensi produksi aplikasi
├── requirements-dev.txt    # Dependensi pengujian & linting
└── README.md
```
