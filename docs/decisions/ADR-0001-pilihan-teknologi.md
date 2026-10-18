# ADR-0001: Pilihan Tumpukan Teknologi — Next.js (Web), Expo (Mobile), FastAPI (Backend) & Supabase

- **Status:** DITERIMA (ACCEPTED — Direvisi 18 Oktober 2026)
- **Tanggal:** 18 Oktober 2026 (Diperbarui dari draf awal 6 Oktober 2026)
- **Pengambil Keputusan:** Rifqi (Hacker), Hakim (Hipster), Rama (Hustler), Project Manager

---

## 1. Konteks & Latar Belakang
Proyek **CampusFolio** membutuhkan tumpukan teknologi (*tech stack*) yang mendukung:
1. Pengembangan aplikasi mobile dan web secara cepat oleh tim mahasiswa beranggotakan 3 orang.
2. Memaksimalkan keakraban (*familiarity*) tim terhadap bahasa dan alat pengembangan (ekosistem **JavaScript/TypeScript**).
3. Kemudahan demonstrasi ke dosen dan pengujian kepada 5 responden mahasiswa tanpa hambatan instalasi file APK.
4. Backend API berkinerja tinggi yang terintegrasi secara alami dengan modul pemrosesan teks AI (NLP).
5. Database cloud terpusat yang tidak membebani perangkat laptop lokal mahasiswa.

---

## 2. Keputusan yang Disepakati

Tim secara bulat menyetujui arsitektur gabungan berikut:

### A. Frontend Web: Next.js (React + TailwindCSS)
- **Direktori:** `src/web/`
- **Framework:** **Next.js (App Router)** + **TailwindCSS**
- **Justifikasi Utama:**
  - *Familiaritas Tinggi:* Tim telah terbiasa dengan React dan ekosistem JavaScript/TypeScript.
  - *Mobile-Responsive Web:* Halaman feed, profil, portofolio, dan pencarian dapat langsung diuji coba dengan responsivitas tinggi baik di browser desktop maupun smartphone.
  - *Kemudahan Uji Coba & Demo:* Dapat dideploy secara online dan gratis di **Vercel** hanya dalam 1 klik, memudahkan wawancara 5 responden mahasiswa via tautan web.

### B. Frontend Mobile: Expo (React Native)
- **Direktori:** `src/mobile/`
- **Framework:** **Expo (React Native)**
- **Justifikasi Utama:**
  - *Demo Instan via Expo Go:* Dosen dan mahasiswa tidak perlu mengunduh file `.apk` yang rumit. Cukup unduh aplikasi Expo Go di Play Store/App Store, lalu scan QR code dari terminal untuk menjalankan aplikasi secara native di ponsel.
  - *Berbagi Kode dengan Next.js:* Logika pemanggilan API, skema validasi, tipe TypeScript, dan *state management* dapat diselaraskan dengan versi web.

### C. Backend: Python FastAPI
- **Direktori:** `src/backend/`
- **Framework:** **FastAPI (Python 3.10+)**
- **Justifikasi Utama:**
  - *Pusat Layanan Tunggal (Single Source of Truth):* Menyediakan REST API yang dikonsumsi secara bersamaan oleh Next.js (Web) dan Expo (Mobile).
  - *Integrasi Alami AI:* Engine pemrosesan AI teks (TF-IDF Scikit-Learn dan Moderasi) berjalan langsung di Python tanpa overhead komunikasi antar-layanan (*microservice*).
  - *Swagger UI Otomatis:* Dokumentasi interaktif di `/docs` mempermudah pengembang frontend (Hakim & Rifqi) menguji endpoint.

### D. Database: PostgreSQL (via Supabase Cloud Free Tier)
- **RDBMS:** **PostgreSQL (Hosted di Supabase Cloud)**
- **Justifikasi Utama:**
  - *Zero Resource Overhead:* Tidak membebani laptop pengembang (tidak perlu instalasi PostgreSQL lokal / Docker).
  - *Database Kolaboratif:* Seluruh anggota tim terhubung ke basis data cloud terpusat yang sama (10 tabel relasional aktif).
  - *Supabase Storage:* Terintegrasi langsung untuk mengunggah dan menyajikan gambar portofolio dan avatar pengguna.

### E. Layanan AI (NLP & Moderasi Teks)
- **AI-1 (Rekomendasi Kolaborator):** Baseline TF-IDF + Cosine Similarity dengan pembobotan *complementary skills*.
- **AI-2 (Moderasi Konten Teks):** Klasifikasi teks awal (*aman*, *perlu_review*, *berpotensi_melanggar*) dengan prinsip *Human-in-the-Loop*.

---

## 3. Konsekuensi Positif (*Pros*)
1. **Kecepatan Pengembangan Maksimal (*High Developer Velocity*):** Menghilangkan kurva belajar bahasa Dart/Flutter, sehingga tim bisa langsung fokus menyelesaikan User Story Sprint 1.
2. **Fleksibilitas Platform:** Mendukung Web (Next.js) untuk portofolio luas dan Mobile (Expo) untuk interaksi aplikasi harian mahasiswa.
3. **Penyelarasan Beban Kerja:**
   - **Rifqi (Hacker):** Mengawal FastAPI backend, Supabase database, dan pipeline AI.
   - **Hakim (Hipster):** Mengembangkan UI Next.js Web dan Expo Mobile berbasis mockup `ui/Model UI.webp`.
   - **Rama (Hustler):** Melakukan riset pengguna via web demo dan menyusun metrik validasi.

---

## 4. Rencana Tindak Lanjut
1. Inisialisasi modul frontend Next.js di `src/web/`.
2. Perbarui panduan Expo di `src/mobile/`.
3. Sinkronisasi seluruh perubahan ke branch `develop` dan `main`.
