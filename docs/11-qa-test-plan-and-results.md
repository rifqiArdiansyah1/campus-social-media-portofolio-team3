# 11 — Laporan Rencana Uji, QA, & Hasil Eksekusi Monorepo

**Proyek:** CampusFolio — Academic Capstone Platform  
**Rilis:** v1.0.0 (Academic Capstone Release)  
**Tanggal Eksekusi:** 12 November 2026  
**Status QA:** 100% Passed (Monorepo Automated Test Suite)  
**Penguji:** Hacker (Tech Lead & Engineering), Hipster (Frontend & Mobile), Hustler (QA & Product Owner)  

---

## 1. Strategi & Ruang Lingkup Pengujian (QA Strategy)

Pengujian kualitas perangkat lunak (*Quality Assurance*) untuk rilis final **v1.0.0** mencakup seluruh 18 User Stories resmi (**US-01 s.d. US-18**) yang disepakati pada [docs/04-prd.md](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/docs/04-prd.md) dan [docs/05-initial-backlog.md](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/docs/05-initial-backlog.md).

Pengujian dieksekusi secara bertingkat (*multi-layer testing pyramid*):
1. **Automated Unit & Integration Testing (Backend):** Pengujian endpoint REST API, otorisasi peran (*RBAC*), mitigasi timing attack, isolasi pemblokiran (*anti-leak*), dan keandalan AI (*Graceful Degradation*) menggunakan `pytest` dan PostgreSQL transaction rollback.
2. **Automated Component & Page Integration Testing (Web Frontend):** Pengujian komponen Next.js, state management, role-gating, form interaksi, dan integrasi API mock menggunakan `vitest`, `@testing-library/react`, dan `@testing-library/user-event`.
3. **Automated Unit & Formatting Tests (Mobile Expo):** Pengujian fungsi utilitas, formatting tanggal relatif, resolusi URL media dinamis, dan strict TypeScript typechecking pada React Native/Expo.
4. **Production Build Integrity:** Kompilasi bundle Next.js 14 (`npm run build`) untuk memverifikasi nol kesalahan kompilasi tipe atau SSR mismatch.
5. **Security & Boundary Auditing:** Audit dependensi (`npm audit`, `pip-audit`), verifikasi Production Gate Guard, dan isolasi program studi Kaprodi.

---

## 2. Matriks Keterlacakan Kebutuhan (Requirements Traceability Matrix / RTM)

Seluruh 18 User Stories resmi telah diverifikasi secara empiris melalui rangkaian tes otomatis dan pengujian fungsional:

| User Story | Modul | Kriteria Penerimaan (Acceptance Criteria) | Endpoint API Terkait | File Tes Otomatis | Status QA |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **US-01: Autentikasi Mahasiswa** | M01 | Registrasi domain `@campus.ac.id`, login NIM/email, mitigasi timing attack, JWT minimal payload | `POST /api/v1/auth/register`<br>`POST /api/v1/auth/login` | `test_auth.py`<br>`Register.test.tsx`<br>`Login.test.tsx` | **Verified** |
| **US-02: Manajemen Profil** | M02 | Edit biodata, kontak URL, angkatan, foto profil, dan info akademik mahasiswa | `GET /api/v1/auth/me`<br>`PUT /api/v1/profile` | `test_profile_skills.py`<br>`Profile.test.tsx` | **Verified** |
| **US-03: Tag Keahlian & Minat** | M02 | Pemilihan multi-skill berjenjang (`pemula`, `menengah`, `mahir`) dan minat kolaborasi | `GET /api/v1/skills`<br>`POST /api/v1/profile/skills` | `test_profile_skills.py`<br>`Profile.test.tsx` | **Verified** |
| **US-04: Pencarian Mahasiswa** | M03 | Pencarian teks bebas mahasiswa berfilter prodi dan keterampilan dengan proteksi blokir | `GET /api/v1/search?tipe=mahasiswa` | `test_search.py`<br>`Explore.test.tsx` | **Verified** |
| **US-05: Detail Profil Publik** | M03 | Tampilan portofolio publik, status pertemanan, dan sensor profil terblokir (*anti-leak*) | `GET /api/v1/users/{id}` | `test_profile_skills.py`<br>`test_blocks.py`<br>`Profile.test.tsx` | **Verified** |
| **US-06: Linimasa Feed Kampus** | M05 | Feed publik terurut kronologis dengan paginasi, filter blokir dua arah, dan badge tipe | `GET /api/v1/posts` | `test_posts_feed.py`<br>`Feed.test.tsx` | **Verified** |
| **US-07: Buat Postingan Feed** | M05 | Unggah postingan teks + gambar (opsional), tipe `umum` atau `cari_anggota`, sanitasi input | `POST /api/v1/posts` | `test_posts_feed.py`<br>`Feed.test.tsx` | **Verified** |
| **US-08: Rekomendasi Kolaborator AI**| M09 | Rekomendasi rekan otomatis untuk post `cari_anggota` berbasis kesesuaian keahlian TF-IDF | `POST /api/v1/recommendations/for-post/{id}` | `test_recommendations.py`<br>`test_ai_engine.py`<br>`Explore.test.tsx` | **Verified** |
| **US-09: Transparansi Alasan AI** | M09 | Penjelasan rasional transparan pada rekomendasi dan tombol feedback pengguna | `POST /api/v1/recommendations/feedback` | `test_recommendations.py`<br>`Explore.test.tsx` | **Verified** |
| **US-10: Eksplorasi Rekan Proyek**| M10 | Pencarian calon partner berdasarkan deskripsi proyek bebas via Cosine Similarity | `POST /api/v1/recommendations/match` | `test_recommendations.py`<br>`Explore.test.tsx` | **Verified** |
| **US-11: Manajemen Portofolio** | M07 | Unggah karya/sertifikat/artikel ilmiah dengan metadata resmi dan dokumen bukti | `GET /api/v1/portfolio`<br>`POST /api/v1/portfolio` | `test_portfolio.py`<br>`Portfolio.test.tsx` | **Verified** |
| **US-12: Verifikasi SKPI Kaprodi** | M07 | Validasi dokumen portofolio oleh Kaprodi se-prodi dan kalkulasi kumulatif poin SKPI | `PATCH /api/v1/portfolio/{id}/review`<br>`GET /api/v1/users/{id}/skpi-summary` | `test_portfolio.py`<br>`Portfolio.test.tsx` | **Verified** |
| **US-13: Jejaring Pertemanan** | M06 | Kirim, terima, tolak pertemanan mahasiswa dengan proteksi self-friend & blocked pair | `POST /api/v1/friendships`<br>`PATCH /api/v1/friendships/{id}` | `test_friendships.py`<br>`FriendshipActions.test.tsx` | **Verified** |
| **US-14: Blokir Pengguna & Anti-Leak**| M06 | Blokir pengguna, pemutusan pertemanan otomatis, dan penyembunyian simetris di 8 permukaan | `POST /api/v1/blocks`<br>`DELETE /api/v1/blocks/{id}` | `test_blocks.py`<br>`test_block_isolation_8_surfaces.py` | **Verified** |
| **US-15: Prescreening Moderasi AI**| M08 | Penapisan otomatis teks feed via Advanced Heuristic Pipeline, tahan leetspeak & homoglyphs | `POST /api/v1/posts` | `test_moderation.py`<br>`test_ai_engine.py`<br>`test_ai_graceful_degradation.py` | **Verified** |
| **US-16: Pelaporan Pelanggaran** | M08 | Pelaporan postingan melanggar oleh mahasiswa dengan opsi alasan dan status pelacakan | `POST /api/v1/reports`<br>`GET /api/v1/reports` | `test_moderation.py`<br>`Moderation.test.tsx` | **Verified** |
| **US-17: Triase Moderasi & Takedown**| M08 | Triase antrean laporan oleh Kaprodi/Admin, eksekusi takedown berkarantina, dan notifikasi | `POST /api/v1/posts/{id}/takedown`<br>`POST /api/v1/moderation/decide` | `test_moderation.py`<br>`test_block_isolation_8_surfaces.py`<br>`Moderation.test.tsx` | **Verified** |
| **US-18: Dasbor Terpadu Beranda** | M11 | Agregasi data beranda berdasarkan peran: poin SKPI, triase moderasi, antrean portofolio | `GET /api/v1/dashboard/summary` | `test_dashboard.py`<br>`HomeDashboard.test.tsx` | **Verified** |

---

## 3. Hasil Eksekusi Uji Otomatis Monorepo (Automated Test Execution)

### 3.1 Backend Test Suite (FastAPI + Pytest)
- **Framework:** Pytest 9.2.0, Python 3.11.9
- **Kondisi:** Eksekusi terhadap PostgreSQL terisolasi transaksi per-test (*Rollback Savepoint*)
- **Hasil:**
  - Total Pengujian Terdaftar: **166 Test Cases**
  - Total Pengujian Lolos: **166 Passed (100%)**
  - Total Pengujian Gagal: **0 Failed**
  - Durasi Eksekusi: ~4.5 Menit

### 3.2 Web Frontend Test Suite (Next.js 14 + Vitest)
- **Framework:** Vitest 2.1.9, React Testing Library
- **Hasil:**
  - Total File Pengujian: **13 Test Files Passed (13/13)**
  - Total Unit/Integration Tests: **64 Tests Passed (64/64 - 100%)**
  - Cakupan:
    - `Explore.test.tsx` (6 tests passed)
    - `Moderation.test.tsx` (6 tests passed)
    - `HomeDashboard.test.tsx` (5 tests passed)
    - `Portfolio.test.tsx` (4 tests passed)
    - `FriendshipActions.test.tsx` (6 tests passed)
    - `Feed.test.tsx` (7 tests passed)
    - `Profile.test.tsx` (8 tests passed)
    - `NotificationDropdown.test.tsx` (6 tests passed)
    - `PostDetail.test.tsx` (3 tests passed)
    - `ProtectedRoute.test.tsx` (3 tests passed)
    - `RoleGate.test.tsx` (3 tests passed)
    - `PortfolioStatusBadge.test.tsx` (4 tests passed)
    - `utils.test.ts` (3 tests passed)
  - Durasi Eksekusi: 65.55 detik

### 3.3 Mobile Expo Test Suite (React Native + Vitest + TSC)
- **Framework:** Vitest 5.1.0, TypeScript 5.8
- **Hasil:**
  - Unit Tests: **16 Tests Passed (16/16 - 100%)** (`formatting.test.ts`)
  - Strict Typecheck (`tsc --noEmit`): **0 Errors**
  - Durasi Eksekusi: 1.21 detik

### 3.4 Production Build Verification (Next.js 14)
- **Perintah:** `npm --prefix src/web run build`
- **Hasil:**
  - Kompilasi: **Compiled successfully**
  - Linting & Typecheck: **Passed**
  - Static Page Generation: **14/14 Pages Generated (100%)**
  - SSR / Hydration Errors: **0 Errors**

---

## 4. Log Cacat & Tindakan Korektif (Defect Log)

Berikut adalah rekam jejak cacat (*defects*) yang teridentifikasi selama siklus pengujian intensif M13 dan resolusi teknis yang telah diterapkan:

| ID Cacat | Tingkat Keparahan | Komponen | Deskripsi Cacat | Tindakan Korektif & Resolusi | Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **DEF-01** | **S1 (Kritis)** | Mobile CI | CI GitHub Actions gagal pada job `mobile` karena dependensi Vitest 5.1 & React Native membutuhkan Node 22+. | Memperbarui `.github/workflows/ci.yml` job `mobile` menggunakan Node 22 dan fallback `npm install`. | **Closed** |
| **DEF-02** | **S2 (Mayor)** | Backend Security | Startup backend belum memvalidasi keberadaan wildcard CORS `*` dengan credentials aktif saat running di environment produksi. | Menambahkan `startup_production_gate_guard` di `main.py` dan validasi Pydantic di `config.py` yang menolak startup secara fail-fast. | **Closed** |
| **DEF-03** | **S2 (Mayor)** | Backend Privacy | Isolasi pemblokiran US-14 berpotensi membocorkan eksistensi postingan dan profil melalui error message berbeda. | Menerapkan *Zero-Leakage Principle*: mengembalikan HTTP 404 identik (`POST_NOT_FOUND` / `USER_NOT_FOUND`) pada 8 permukaan aplikasi. | **Closed** |
| **DEF-04** | **S3 (Sedang)** | Backend AI | Batasan AI #4 (Graceful Degradation) belum memiliki automated test formal untuk menjamin ketahanan saat engine AI mengalami timeout. | Membuat test suite `test_ai_graceful_degradation.py` dengan simulasi injeksi error timeout 3.000 ms. | **Closed** |
| **DEF-05** | **S3 (Sedang)** | Database Seeder | Seeder menggunakan timestamp statis (`2026-08-15`) sehingga linimasa terlihat kadaluwarsa saat dipresentasikan di hadapan penguji. | Mengubah seluruh tanggal aktivitas menjadi relative timestamp dinamis (`now - timedelta(...)`) dan menambahkan argumen `--reset`. | **Closed** |
| **DEF-06** | **S4 (Minor)** | Mobile UI | Tautan gambar linimasa berformat path relatif (`/static/...`) gagal dimuat pada antarmuka Expo Android/iOS. | Menambahkan helper `resolveMediaUrl()` yang memetakan path relatif ke backend base URL secara otomatis. | **Closed** |

> [!IMPORTANT]
> **Kriteria Kelulusan QA (Exit Criteria):**  
> Seluruh cacat dengan tingkat keparahan **S1 (Kritis)** dan **S2 (Mayor)** berstatus **0 Open Defects (100% Resolved)**. Platform dinyatakan memenuhi standar mutu akademik untuk dirilis ke versi produksi `v1.0.0`.
