# CampusFolio Mobile App (Expo / React Native)

Aplikasi klien mobile untuk **CampusFolio** dibangun menggunakan framework **Expo (React Native)** dengan TypeScript untuk memberikan pengalaman aplikasi native smartphone yang responsif, modern, dan dapat diuji secara langsung oleh dosen serta penilai menggunakan **Expo Go** (tanpa perlu build APK mandiri).

---

## 📱 Arsitektur & Teknologi

- **Framework**: Expo SDK 58 (React Native 0.88 & React 19)
- **Bahasa**: TypeScript (Strict mode)
- **Navigasi**: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- **Manajemen State & Network Cache**: `@tanstack/react-query` v5
- **HTTP Client**: Axios dengan interceptor otomatis dan penanganan token JWT
- **Penyimpanan Kredensial Aman**: `expo-secure-store` (Hardware Keychain terenkripsi)
- **Interaksi Native & Hardware**:
  - `expo-image`: Caching memori & disk untuk gambar feed linimasa
  - `expo-image-picker`: Kamera & pemilihan foto galeri (maks 5MB)
  - `expo-document-picker`: Pengunggahan dokumen bukti sertifikat / SKPI format PDF
- **Ikonografi & Desain**: `lucide-react-native`, `react-native-svg`, Academic Modernist Design Tokens

---

## 🎨 Paritas Fitur Inti (Mobile Core Features)

1. **Autentikasi & RBAC (US-01 / M02)**:
   - Login menggunakan Email Kampus & Kata Sandi.
   - Pendaftaran Mahasiswa Baru dengan validasi domain resmi kampus (`@campus.ac.id`).
   - Sesi token tersimpan aman via `expo-secure-store` dengan auto-refresh profile `/auth/me`.
   - Tombol 1-klik Akun Pengujian Cepat untuk dosen/evaluator.
2. **Beranda & Linimasa Kampus (US-04, US-18 / M05, M11)**:
   - Feed linimasa mahasiswa dengan *keyset cursor pagination* responsif.
   - Filter cakupan (Scope): **Semua**, **Prodi Saya**, **Teman**, dan **Rekrutmen Tim**.
   - Widget ringkasan Poin SKPI Resmi untuk Mahasiswa.
   - Quick Action Alert Moderasi & Laporan untuk Staf/Kaprodi.
   - Pelaporan pelanggaran konten (Spam, Ujaran Kebencian, Konten Tidak Pantas) via modal interaktif.
3. **Pencarian Terpadu & AI Matchmaker (US-05, US-07 / M10, M09)**:
   - Kolom pencarian terpadu mahasiswa, postingan, dan portofolio kampus.
   - AI Matchmaker (AI-1) dengan skor kemiripan semantik (Match %), keahlian komplementer, tombol "Tambah Teman", dan umpan balik "Kurang Relevan".
4. **Portofolio & Verifikasi SKPI (US-03, US-15 / M07)**:
   - Ringkasan poin SKPI, total karya terverifikasi, dan status menunggu review.
   - Formulir tambah portofolio dengan pengunggahan dokumen PDF langsung dari penyimpanan smartphone via `expo-document-picker`.
   - Pengajuan verifikasi SKPI ke Kaprodi.
5. **Profil Mahasiswa & Interaksi Sosial (US-02, US-13, US-14 / M04, M06)**:
   - Kartu profil lengkap: Nama, NIM, Jurusan, Angkatan, Bio, Kontak Web, dan daftar Keahlian (*Skills*).
   - Aksi pertemanan: Kirim Permintaan, Batalkan Permintaan, Terima Pertemanan, dan Hapus Teman.
   - Tombol **Blokir Pengguna** dengan proteksi timbal balik.
6. **Panel Moderasi & SKPI Staf (US-16, US-10 / M08)**:
   - Antrean Postingan AI Triage (Setujui / Tolak Konten).
   - Antrean Laporan Masuk Komunitas (Takedown Pelanggaran).
   - Antrean Tinjauan Portofolio & Dokumen Bukti Mahasiswa Se-Prodi (Verifikasi SKPI / Tolak).

---

## 🚀 Panduan Menjalankan Aplikasi Mobile

### 1. Prasyarat:
- Komputer pengembang dan smartphone terhubung ke **jaringan Wi-Fi lokal yang sama**.
- Instal aplikasi **Expo Go** pada smartphone fisik:
  - [Expo Go di Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [Expo Go di App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
- Backend FastAPI aktif dan berjalan di port `8000` (`python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`).

### 2. Konfigurasi Endpoint API (`.env`):
Buat berkas `src/mobile/.env` (atau salin dari `.env.example`):
```env
# Ganti dengan alamat IP lokal Wi-Fi laptop Anda (cek via `ipconfig` di Windows)
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api/v1
```
*(Catatan: Jika menguji menggunakan Android Emulator di laptop yang sama, default otomatis mengarah ke `http://10.0.2.2:8000/api/v1`).*

### 3. Menjalankan Server Pengembangan Expo:
```bash
cd src/mobile
npm run start
```
- **Di Smartphone Fisik**: Buka aplikasi **Expo Go**, lalu scan QR code yang muncul di layar terminal command prompt.
- **Di Android Emulator**: Tekan tombol `a` pada keyboard.
- **Di Web Browser**: Tekan tombol `w` pada keyboard.

---

## 🧪 Pengujian & Pemeriksaan Kode (Testing)

```bash
# Menjalankan typecheck TypeScript
npm run typecheck

# Menjalankan pengujian unit mobile
npm test

# Sinkronisasi tipe kontrak TypeScript dengan docs/openapi.json
npm run generate:types
```

---

## 🔑 Kredensial Pengujian Cepat (1-Klik di Layar Login)

| Peran | Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Mahasiswa TI** | `rifqi@campus.ac.id` | `password123` | Mahasiswa Teknik Informatika (Hacker / AI) |
| **Mahasiswa SI** | `hakim@campus.ac.id` | `password123` | Mahasiswa Sistem Informasi (Hipster / Mobile) |
| **Kaprodi TI** | `kaprodi.ti@campus.ac.id` | `kaprodipassword123` | Moderator prodi TI (Antrean moderasi & review SKPI) |
| **Admin Kampus** | `admin@campus.ac.id` | `adminpassword123` | Administrator Pusat Kemahasiswaan |
