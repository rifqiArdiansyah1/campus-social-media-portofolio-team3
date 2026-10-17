# Source Code — CampusFolio (Team 3)

Arsitektur kode aplikasi dibagi menjadi dua modul utama sesuai kesepakatan pada [ADR-0001: Pilihan Teknologi](../docs/decisions/ADR-0001-pilihan-teknologi.md):

1. **[`backend/`](backend/)**: Backend API menggunakan **FastAPI (Python)**, **PostgreSQL**, serta engine pemrosesan teks AI (TF-IDF & Moderasi).
2. **[`mobile/`](mobile/)**: Frontend klien menggunakan **Flutter (Dart)** dengan pendekatan **Flutter Web-First** untuk pengujian dan demo instan sebelum rilis APK Android.
