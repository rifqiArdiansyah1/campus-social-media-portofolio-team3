# ADR-0001: Pilihan Tumpukan Teknologi (Technology Stack)

- **Status:** Diusulkan (Proposed)
- **Tanggal:** 6 Oktober 2026
- **Pengambil Keputusan:** Seluruh Anggota Tim 3

---

## Konteks & Masalah
Proyek CampusFolio membutuhkan tumpukan teknologi (tech stack) yang mendukung pengembangan aplikasi mobile/web responsif, backend API yang cepat, penyimpanan relasional yang terstruktur, dan pipeline pemrosesan teks AI yang efisien dengan kurva belajar yang ramah bagi tim mahasiswa.

---

## Pilihan yang Dipertimbangkan

### Opsi A (Mobile Flutter + Supabase/Node.js)
- **Frontend:** Flutter (Dart) — Multiplatform (Android & iOS) dengan performa native tinggi.
- **Backend / Database:** Supabase (PostgreSQL) — Autentikasi bawaan, REST/GraphQL API otomatis, pgvector untuk embedding AI.
- **AI Processing:** Python FastAPI microservice atau Edge Functions dengan integrasi model embedding / LLM.

### Opsi B (React Native / Expo + Express.js + PostgreSQL)
- **Frontend:** React Native (Expo) — Ekosistem JavaScript yang luas dan cepat untuk prototipe.
- **Backend:** Node.js (Express / NestJS) + Prisma ORM.
- **Database:** PostgreSQL.
- **AI Processing:** Python backend atau Node.js client API.

### Opsi C (Next.js PWA + SQLite/PostgreSQL)
- **Frontend & Backend Fullstack:** Next.js (React) diformat sebagai Progressive Web App (PWA) agar bisa dipasang di ponsel mahasiswa tanpa proses rilis store yang rumit.
- **Database:** PostgreSQL / Supabase.

---

## Usulan Keputusan
Mengingat batas waktu sprint perkuliahan dan kebutuhan demonstrasi MVP yang cepat:
- **Rekomendasi Utama:** Memilih arsitektur berbasis REST API dengan frontend terpisah agar Hacker dan Hipster dapat bekerja secara paralel.
- **Baseline AI:** Python service ringan (FastAPI) dengan Scikit-learn (TF-IDF) untuk prototipe lokal awal, disusul integrasi API LLM jika diperlukan.

---

## Konsekuensi & Rencana Tindak Lanjut
- Tim 3 perlu menyepakati pilihan akhir dalam pertemuan internal (Pertemuan 1).
- Setelah disepakati, dokumen ADR ini akan diperbarui statusnya menjadi **Accepted**.
