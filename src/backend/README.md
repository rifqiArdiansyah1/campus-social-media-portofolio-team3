# CampusFolio Backend API & AI Engine

Backend layanan REST API dan pipeline AI untuk platform **CampusFolio** (Team 3), dibangun menggunakan **FastAPI**, **PostgreSQL**, dan **Scikit-Learn NLP**.

---

## 🛠️ Persyaratan Lingkungan
- Python 3.10 atau lebih baru
- PostgreSQL 14+ (opsional jika menggunakan SQLite/mock saat awal pengembangan)

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

3. **Install dependensi:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Jalankan server pengembangan FastAPI:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Akses Dokumentasi Interaktif (Swagger UI):**
   - Buka browser di: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Uji coba endpoint AI-1 Rekomendasi di `/api/v1/recommendations/match`
   - Uji coba endpoint AI-2 Moderasi di `/api/v1/moderation/check`

---

## 📂 Struktur Modul Backend
```text
src/backend/
├── app/
│   ├── api/v1/endpoints/   # Router endpoint API
│   │   ├── recommendations.py
│   │   └── moderation.py
│   ├── core/               # Konfigurasi aplikasi & security
│   ├── schemas/            # Pydantic schema request/response
│   ├── services/
│   │   └── ai_engine/      # recommender.py (TF-IDF) & moderator.py
│   └── main.py             # Entrypoint FastAPI & CORS setup
├── requirements.txt
└── README.md
```
