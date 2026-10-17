# ADR-0001: Pilihan Tumpukan Teknologi (Technology Stack) & Strategi Flutter Web-First

- **Status:** DITERIMA (ACCEPTED)
- **Tanggal:** 17 Oktober 2026 (Diperbarui dari Draf 6 Oktober 2026)
- **Pengambil Keputusan:** Rifqi (Hacker), Hakim (Hipster), Rama (Hustler), Project Manager

---

## 1. Konteks & Latar Belakang
Proyek **CampusFolio** membutuhkan tumpukan teknologi (*tech stack*) yang mampu:
1. Mendukung pengembangan antarmuka pengguna yang cepat, menarik, dan responsif.
2. Memudahkan proses validasi dan pengujian kepada 5 responden mahasiswa serta demonstrasi kepada dosen tanpa hambatan instalasi aplikasi.
3. Menyediakan API backend berkinerja tinggi yang terintegrasi secara mulus dengan modul kecerdasan buatan (NLP) berbasis teks.
4. Memiliki kurva belajar yang ramah dan efisien bagi tim mahasiswa beranggotakan 3 orang dengan tenggat waktu sprint yang ketat.

---

## 2. Keputusan yang Disepakati

Tim secara bulat memutuskan tumpukan teknologi berikut:

### A. Frontend: Flutter dengan Pendekatan *Flutter Web-First*
- **Framework:** **Flutter (Dart)**
- **Strategi Rilis:**
  - **Fase 1 (Validasi & MVP Demo):** Dikompilasi dan dijalankan sebagai **Web App** (`flutter run -d chrome` / `flutter build web`). Ini memungkinkan dosen dan responden mahasiswa menguji aplikasi langsung via browser laptop/HP tanpa perlu menginstal file `.apk`.
  - **Fase 2 (Rilis Mobile):** Menggunakan *codebase* yang sama persis untuk dikompilasi menjadi aplikasi Android (`flutter build apk`) dan iOS tanpa menulis ulang kode (*zero-rewrite*).
- **Arsitektur State Management:** Bloc / Cubit atau Riverpod.
- **Networking:** `dio` dengan interceptor autentikasi JWT token.
- **Penyimpanan Sesi:** `flutter_secure_storage` / `shared_preferences`.

### B. Backend: Python FastAPI
- **Framework:** **FastAPI (Python 3.10+)**
- **Justifikasi Utama:**
  - *Unified Stack:* Backend API dan modul pemrosesan AI teks (Scikit-Learn / Transformers) berada dalam satu ekosistem Python yang sama tanpa perlu microservice terpisah.
  - *Auto-generated Documentation:* Otomatis menghasilkan Swagger UI interaktif di `/docs`, memudahkan Hipster (Hakim) menguji payload request/response JSON secara mandiri.
  - Asynchronous murni (`async/await`) dengan performa tinggi.

### C. Database: PostgreSQL (via Supabase Cloud Free Tier)
- **RDBMS:** **PostgreSQL (Hosted di Supabase Cloud)**
- **Justifikasi Utama:**
  - *Zero Resource Overhead:* Tidak membebani RAM/CPU laptop pengembang (tidak membutuhkan instalasi lokal maupun Docker Desktop).
  - *Database Kolaboratif Terpusat:* Hacker (Rifqi) dan Hipster (Hakim) terhubung ke basis data cloud yang sama secara real-time.
  - *Spreadsheet GUI:* Memudahkan tim memasukkan dan meninjau data dummy mahasiswa via browser Table Editor.
  - *Storage Terintegrasi:* Mendukung upload berkas gambar portofolio dan avatar pengguna secara gratis.
- **ORM & Koneksi:** `SQLAlchemy` / `asyncpg` dengan connection string standar PostgreSQL.
- **Ekstensi:** Siap mendukung ekstensi `pgvector` jika diperlukan pencarian embedding vektor di level database.

### D. Layanan AI (NLP & Moderasi Teks)
- **AI-1 (Rekomendasi Kolaborator):**
  - *Tahap Baseline (MVP):* `scikit-learn` (TF-IDF Vectorizer + Cosine Similarity) dengan penyesuaian bobot keahlian komplementer (*complementary skill bonus*).
  - *Tahap Lanjutan (Semantic Enhancement):* Model `sentence-transformers` multibahasa (`paraphrase-multilingual-MiniLM-L12-v2`) atau API embedding untuk menangani sinonim dan bahasa gaul kampus.
- **AI-2 (Moderasi Konten Teks):**
  - Triage awal menggunakan kata kunci kontekstual dan model zero-shot/sentimen.
  - Status klasifikasi: `aman`, `perlu_review`, `berpotensi_melanggar`.
  - Mengikuti prinsip wajib PRD: *Human-in-the-Loop* (keputusan akhir penghapusan konten sensitif selalu oleh admin manusia).

### E. Media & Asset Storage (Portofolio & Avatar)
- **Fase Lokal:** Static file directory mount di FastAPI.
- **Fase Production/Cloud:** Supabase Storage atau Cloudinary (free tier).

---

## 3. Konsekuensi Positif (*Pros*)
1. **Beban Kerja Minimal:** Tim tidak perlu mengulang pembuatan kode UI dua kali (web dan mobile berbagi 100% kode Flutter).
2. **Uji Coba Pengguna Lancar:** Wawancara 5 mahasiswa responden dapat langsung dilakukan dengan membagikan link demo web.
3. **Pemisahan Peran Jelas:** Hacker (Rifqi) fokus pada API & AI di `src/backend`, sedangkan Hipster (Hakim) fokus pada komponen UI di `src/mobile`.

---

## 4. Rencana Tindak Lanjut
1. Melakukan inisialisasi struktur modul `src/backend` (FastAPI starter & engine AI baseline).
2. Melakukan inisialisasi panduan modul `src/mobile` (Flutter setup dengan target Web & Android).
3. Melakukan sinkronisasi repositori ke branch `develop` dan `main`.
