# CampusFolio — Campus Social Media & Portfolio Platform

[![Release](https://img.shields.io/badge/Release-v1.0.0%20(Academic%20Capstone)-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)
[![Monorepo](https://img.shields.io/badge/Architecture-Monorepo%20(FastAPI%20%2B%20Next.js%20%2B%20Expo)-orange.svg)](#)
[![QA Tests](https://img.shields.io/badge/QA%20Tests-100%25%20Passing-brightgreen.svg)](#)
[![AI Spec](https://img.shields.io/badge/AI%20Pillars-4%20Pillars%20Verified-blueviolet.svg)](#)

Aplikasi sosial media dan portofolio terpadu mahasiswa untuk memamerkan karya, menemukan rekan kolaborasi dengan keahlian yang saling melengkapi menggunakan rekomendasi berbasis AI teks, memvalidasi capaian SKPI prodi, serta berinteraksi dalam lingkungan kampus yang aman dengan moderasi cerdas berprinsip *human-in-the-loop*.

---

## 👥 Tim Pengembang (Team 3)

| Peran | Nama Anggota | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Hacker** | **Moh. Rifqi Dwi Ardiansyah** | Git repository lead, Backend FastAPI, Data architecture, Pipeline AI |
| **Hipster** | **Hakim** | UI/UX Design (Stitch & Figma), Web Next.js, Mobile Expo App |
| **Hustler** | **Ramadhan (Rama)** | Product Strategy, Backlog prioritization, Evaluasi AI, Pitching & Sidang |
| **PM Assistant**| **Antigravity AI** | Sprint Governance, QA Traceability Matrix, & Final DoD Verification |

---

## 🎯 4 Pilar Penggunaan AI Perkuliahan

1. **Tugas AI Jelas:**
   - **AI-1 (Recommender System):** Pencocokan profil mahasiswa dan kebutuhan proyek kolaboratif berbasis kemiripan semantik teks.
   - **AI-2 (Content Moderation):** Penapisan awal konten teks linimasa secara proaktif sebelum dipublikasikan.
2. **Justifikasi Kuat (*Why not if-else?*) & Evaluasi Empiris:**
   - **AI-1:** TF-IDF terbukti mengungguli Exact Tag Matcher (HR@1: **100.00% vs 66.67%**, Precision@3: **83.33% vs 66.67%**, MRR: **1.0 vs 0.8194**).
   - **AI-2:** Advanced Heuristic Pipeline terbukti mengungguli Naive Blacklist pada Held-out Test Set (Akurasi: **98.00% vs 72.00%**, False Negative Pelanggaran Lolos: **0.00% vs 59.09%**).
   - *Catatan Kejujuran Ilmiah:* AI-2 diimplementasikan sebagai *Advanced Heuristic Rule-Based Baseline* (bukan ML probabilistik), dengan rencana model Transformer pada rilis berikutnya.
3. **Struktur Input-Output JSON Terdefinisi:** Divalidasi otomatis menggunakan skema formal (`ai/schemas/recommendation-output.schema.json` dan `ai/schemas/moderation-output.schema.json`).
4. **Independensi Fitur & Pengawasan Manusia (*Graceful Degradation & Human-in-the-Loop*):**
   - *Graceful Degradation:* Layanan beralih ke keyword fallback jika AI timeout (> 3.000 ms) tanpa memicu crash 500.
   - *Human-in-the-Loop:* AI tidak pernah menghapus postingan secara permanen; seluruh sanksi diputuskan oleh Kaprodi / Admin.

---

## 🛠️ Tumpukan Teknologi Monorepo (Tech Stack)

- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, Scikit-Learn (TF-IDF + Cosine Similarity).
- **Web Frontend:** Next.js 14 (App Router), React 18, TailwindCSS, Lucide Icons, Vitest.
- **Mobile Client:** Expo SDK 52, React Native 0.76/0.88, TypeScript strict mode, Vitest.
- **Basis Data:** PostgreSQL (Supabase Cloud Free Tier dengan 13 tabel resmi sesuai `docs/schema.sql`).
- **Media Storage:** Supabase Storage (dengan local disk fallback untuk pengembangan lokal).

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### 1. Prasyarat Sistem
- Python >= 3.11
- Node.js >= 22 (untuk kompatibilitas Next.js 14, Vitest, dan React Native)
- PostgreSQL (Lokal atau Supabase Cloud)

### 2. Instalasi & Setup Dependensi
```bash
# Clone repositori
git clone https://github.com/campusfolio/campus-social-media-portofolio-team3.git
cd campus-social-media-portofolio-team3

# Backend Setup
python -m venv .venv
# Aktifkan virtual environment:
# Windows: .venv\Scripts\activate | Linux/macOS: source .venv/bin/activate
pip install -r src/backend/requirements.txt

# Web Setup
npm --prefix src/web install

# Mobile Setup
npm --prefix src/mobile install
```

### 3. Reset Database & Muat Data Demo Sidang
```bash
python src/backend/app/db/seed.py --reset --demo
```

### 4. Menjalankan Aplikasi
```bash
# Terminal 1: Backend API (http://localhost:8000/docs)
uvicorn app.main:app --app-dir src/backend --reload --port 8000

# Terminal 2: Web Client (http://localhost:3000)
npm --prefix src/web run dev

# Terminal 3: Mobile Expo (Expo Go)
npm --prefix src/mobile run start
```

---

## 🔑 Kredensial Akun Demo Sidang (Demo Personas)

| Peran Akun | Nama Akun | Email Login | Kata Sandi | Skenario Uji |
| :--- | :--- | :--- | :--- | :--- |
| **Mahasiswa (Hacker)** | Moh. Rifqi Dwi Ardiansyah | `rifqi@campus.ac.id` | `password123` | Profil teknis, feed cari partner, AI recommender match |
| **Mahasiswa (Hipster)** | Hakim | `hakim@campus.ac.id` | `password123` | Portofolio SKPI terverifikasi, desain antarmuka Stitch |
| **Mahasiswa (Hustler)** | Ramadhan (Rama) | `ramadhan@campus.ac.id` | `password123` | Permintaan teman masuk, konten feed contoh pelaporan |
| **Kaprodi TI** | Dr. Ir. Budi Santoso, M.Kom | `kaprodi.ti@campus.ac.id` | `kaprodipassword123` | Verifikasi berkas SKPI TI & moderasi feed prodi TI |
| **Kaprodi SI** | Dr. Sri Wahyuni, S.Kom., M.T.| `kaprodi.si@campus.ac.id` | `kaprodipassword123` | Uji isolasi akses prodi (HTTP 403 Forbidden) |
| **Admin Kampus** | Super Admin Kemahasiswaan | `admin@campus.ac.id` | `adminpassword123` | Triase laporan aduan pengguna & takedown pelanggaran |

---

## 📚 Indeks Dokumentasi Resmi (`docs/`)

Dokumentasi lengkap proyek tersusun rapi pada direktori [`docs/`](docs/):

1. [`docs/00-checklist-pertemuan-1.md`](docs/00-checklist-pertemuan-1.md) — Catatan historis sprint 0 pertemuan pertama.
2. [`docs/01-project-brief.md`](docs/01-project-brief.md) — Ringkasan latar belakang proyek dan batasan ruang lingkup.
3. [`docs/02-problem-statement.md`](docs/02-problem-statement.md) — Analisis masalah dan validasi kebutuhan mahasiswa.
4. [`docs/03-product-goal.md`](docs/03-product-goal.md) — Tujuan produk dan indikator keberhasilan.
5. [`docs/04-prd.md`](docs/04-prd.md) — Dokumen Kebutuhan Produk (PRD) multi-role dan aturan bisnis.
6. [`docs/05-initial-backlog.md`](docs/05-initial-backlog.md) — Product Backlog 18 User Stories resmi (US-01 s.d. US-18).
7. [`docs/06-role-assignment.md`](docs/06-role-assignment.md) — Pembagian peran Hacker, Hipster, & Hustler.
8. [`docs/07-ai-hypothesis.md`](docs/07-ai-hypothesis.md) — Hipotesis AI, *Why not if-else?*, dan 4 batasan AI wajib.
9. [`docs/08-system-design.md`](docs/08-system-design.md) — Arsitektur sistem: ERD 13 tabel, Activity Diagram, & Use Case.
10. [`docs/09-ui-ux-stitch-designs.md`](docs/09-ui-ux-stitch-designs.md) — Panduan desain Google Stitch UI/UX & Academic Modernist.
11. [`docs/10-ai-evaluation-report.md`](docs/10-ai-evaluation-report.md) — **Laporan Evaluasi Kuantitatif AI (AI-1 & AI-2)**, benchmarking, confusion matrix, error analysis, dan latensi.
12. [`docs/11-qa-test-plan-and-results.md`](docs/11-qa-test-plan-and-results.md) — **Laporan QA Monorepo & Bukti Paritas**, Traceability Matrix US-01..18, dan Defect Log (0 Open Defect).
13. [`docs/12-demo-walkthrough.md`](docs/12-demo-walkthrough.md) — **Panduan Skenario Sidang (7–10 Menit)**, 4 segmen demonstrasi, dan rencana kontingensi.
14. [`docs/13-final-dod-checklist.md`](docs/13-final-dod-checklist.md) — **Checklist Akhir Kelulusan & Definition of Done (DoD)** (100% Lulus).
15. [`docs/schema.sql`](docs/schema.sql) — Skema DDL PostgreSQL produksi (13 tabel aktif + indeks performa).
16. [`docs/openapi.json`](docs/openapi.json) — Spesifikasi OpenAPI 3.0 / Swagger REST API backend.

---

## 🧪 Eksekusi Rangkaian Pengujian (Automated Test Execution)

```bash
# 1. Jalankan pengujian backend (Pytest: 166 tests)
python -m pytest src/backend/tests/ -v

# 2. Jalankan pengujian web client (Vitest: 64 tests)
npm --prefix src/web test -- --run

# 3. Jalankan pengujian mobile client (Vitest: 16 tests)
npm --prefix src/mobile test -- --run

# 4. Jalankan strict typecheck mobile
npm --prefix src/mobile run typecheck

# 5. Jalankan kompilasi Next.js production build
npm --prefix src/web run build
```
