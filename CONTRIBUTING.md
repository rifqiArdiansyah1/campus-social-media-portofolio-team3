# Panduan Kontribusi (Contributing Guide) — CampusFolio (Team 3)

Selamat datang di repositori **CampusFolio**! Panduan ini dirancang untuk memastikan kolaborasi tim berjalan rapi, terstandarisasi, dan memenuhi rubrik penilaian perkuliahan.

---

## 1. Strategi Percabangan (Branching Strategy)

Kami menerapkan model kolaborasi berbasis **GitFlow sederhana**:

- **`main`**: Branch produksi/rilis yang selalu stabil. **DILARANG commit langsung ke `main`**. Semua perubahan masuk melalui Pull Request dari `develop` atau branch rilis.
- **`develop`**: Branch integrasi utama tempat penggabungan fitur-fitur baru.
- **`feature/US-<nomor>-<nama-singkat>`**: Untuk pengerjaan User Story atau fitur baru (contoh: `feature/US-01-auth-login`).
- **`docs/<topik>`**: Untuk penambahan atau pembaruan dokumentasi (contoh: `docs/project-brief`).
- **`fix/<nama-bug>`**: Untuk perbaikan bug atau error (contoh: `fix/profile-avatar-upload`).

---

## 2. Konvensi Pesan Commit (Conventional Commits)

Format commit:
```text
<tipe>(<lingkup-opsional>): <deskripsi singkat dalam bahasa Indonesia atau Inggris>
```

### Tipe yang Diizinkan:
- `docs`: Pembaruan dokumentasi (PRD, brief, README, diagram).
  - Contoh: `docs: lengkapi AI hypothesis pada docs/07`
- `feat`: Penambahan fitur atau fungsi baru.
  - Contoh: `feat: halaman profil pengguna (US-02)`
- `fix`: Perbaikan bug atau kesalahan logic.
  - Contoh: `fix: perbaiki validasi format email kampus`
- `style`: Format kode (whitespace, semi-colon, perapian tanpa ubah logika).
- `refactor`: Refactoring kode tanpa mengubah fungsionalitas.
- `test`: Penambahan atau perbaikan unit test / integration test.
- `chore`: Konfigurasi build tool, depedensi, template, atau perapian repo.

---

## 3. Alur Kerja Pull Request (PR)

1. Buat branch baru dari `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/US-01-auth-login
   ```
2. Kerjakan kode dan lakukan commit teratur dengan pesan yang jelas.
3. Push branch ke repositori GitHub:
   ```bash
   git push origin feature/US-01-auth-login
   ```
4. Buka Pull Request di GitHub mengarah ke branch `develop`.
5. Isi template Pull Request dengan lengkap (hubungkan dengan Issue terkait menggunakan kata kunci `Closes #nomor_issue`).
6. Minta review minimal dari 1 anggota tim lainnya (Hacker/Hipster/Hustler).
7. Setelah di-approve dan CI/test lolos, lakukan **Squash and Merge** atau **Rebase and Merge**.

---

## 4. Standar Kode & Etika Kolaborasi

- Setiap commit harus lolos linting dan tidak merusak build.
- Dilarang mengunggah kredensial, API key, atau file `.env` ke repository.
- Selalu komunikasikan blocker atau kendala di grup tim atau issue tracker.
