# Source Code — CampusFolio (Team 3)

Arsitektur kode aplikasi dibagi menjadi tiga modul utama sesuai kesepakatan pada [ADR-0001: Pilihan Teknologi](../docs/decisions/ADR-0001-pilihan-teknologi.md):

1. **[`backend/`](backend/)**: Backend REST API dan engine pemrosesan teks AI (TF-IDF & Moderasi) menggunakan **FastAPI (Python)** dan **PostgreSQL (Supabase Cloud)**.
2. **[`web/`](web/)**: Aplikasi web portofolio dan feed linimasa menggunakan **Next.js (React + TailwindCSS)** untuk kemudahan demo online dan pengujian responden via tautan web.
3. **[`mobile/`](mobile/)**: Aplikasi mobile mahasiswa menggunakan **Expo (React Native)** untuk pengalaman native smartphone dengan kemudahan demo via **Expo Go**.
