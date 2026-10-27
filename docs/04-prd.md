# 04 — Product Requirements Document (PRD)

**Proyek:** CampusFolio — Campus Social Media & Portfolio  
**Versi:** 1.1 (Revisi Klien: Role Moderator/Kaprodi, Pertemanan, Blokir Profil, SKPI/Sertifikat/Artikel Ilmiah, Moderasi Konten & Dashboard Home Terpadu)  
**Tanggal:** 27 Oktober 2026  

---

## 1. Persona Pengguna

- **Persona 1: Mahasiswa Aktif (Pencari Tim & Pemilik Portofolio)**
  - *Karakteristik:* Mahasiswa yang ingin memamerkan karya proyek perkuliahan, sertifikat pelatihan, capaian SKPI, dan artikel ilmiah yang telah dipublikasikan.
  - *Tujuan:* Membangun jejaring pertemanan antar mahasiswa, mencari rekan kolaborasi lomba/tugas akhir dengan rekomendasi AI, dan mengajukan bukti portofolio untuk validasi SKPI prodi.
- **Persona 2: Moderator / Kepala Program Studi (Kaprodi)**
  - *Karakteristik:* Ketua Program Studi atau dosen/staf yang ditugaskan sebagai pengawas akademik dan etika pada tingkat prodi.
  - *Tujuan:* Memoderasi postingan mahasiswa prodinya, meninjau dan memvalidasi keabsahan dokumen portofolio (SKPI, sertifikat kompetensi, dan artikel ilmiah), serta menerima laporan pelanggaran dan melakukan *takedown* (hapus postingan) jika melanggar ketentuan.
- **Persona 3: Administrator Kemahasiswaan (Super Admin)**
  - *Karakteristik:* Staf Biro Kemahasiswaan & Alumni tingkat universitas.
  - *Tujuan:* Mengawasi ekosistem kampus secara menyeluruh lintas prodi, memantau antrean laporan eskalasi, mengelola pengguna, dan memastikan keamanan platform.

---

## 2. Batasan Ruang Lingkup (Scope Boundaries)

### In-Scope:
1. **Autentikasi & Akun Multi-Role:** Mahasiswa, Moderator (Kaprodi), dan Admin.
2. **Sistem Pertemanan Mahasiswa (Networking):** Kirim permohonan teman, terima/tolak, daftar teman, dan filter feed teman.
3. **Fitur Privasi & Blokir Profil:** Mahasiswa dapat memblokir profil pengguna lain demi keamanan dan kenyamanan privasi.
4. **Portofolio Terintegrasi SKPI, Sertifikat, & Artikel Ilmiah:**
   - Kategori karya: Proyek Aplikasi/Desain, Bukti SKPI, Sertifikat Pelatihan/Kompetensi, dan Publikasi Artikel Ilmiah (Jurnal/Konferensi).
   - Form unggah menyertakan nomor dokumen/DOI, nama penerbit/institusi, tanggal terbit, dan tautan berkas dokumen bukti (PDF).
   - Antrean **Tinjauan Upload Portofolio** oleh Kaprodi / Admin untuk persetujuan status terverifikasi.
5. **Feed Postingan (Fokus Foto & Teks):** Mahasiswa dapat mengunggah postingan linimasa yang berfokus pada foto kegiatan/hasil karya + teks caption informatif.
6. **Sistem Pelaporan Konten (Report System):** Mahasiswa dapat melaporkan postingan yang melanggar norma dengan kategori (spam, ujaran kebencian, konten tidak pantas, plagiarisme).
7. **Tinjauan Konten & Hak Hapus (Moderasi & Takedown):** Moderator (Kaprodi) dan Admin dapat meninjau antrean postingan, menerima laporan masuk, dan mengeksekusi penghapusan postingan (*soft-delete* dengan audit trail).
8. **Dashboard Sentral / Menu Home Terpadu:** Menu Home merangkum seluruh aktivitas sentral:
   - Feed linimasa (semua, teman, rekrutmen tim).
   - Widget pertemanan & permintaan pertemanan tertunda.
   - Widget portofolio SKPI & karya ilmiah terbaru.
   - Rekomendasi kolaborator AI (TF-IDF & Cosine Similarity Matcher).
   - *Quick Action Alert* bagi Moderator/Admin (jumlah postingan pending, laporan masuk, & tinjauan SKPI).

### Out-of-Scope:
- Fitur chat real-time direct message berbasis socket (komunikasi kolaborasi tetap diarahkan ke kontak profil/WhatsApp/LinkedIn).
- Video hosting berdurasi panjang (fokus media pada foto + teks ringan).
- Integrasi otomatis payment gateway untuk pembelian sertifikat.

---

## 3. Kebutuhan Fungsional (Functional Requirements)

| Kode | Kebutuhan Fungsional | Aktor | User Story |
| :--- | :--- | :--- | :--- |
| **FR-01** | Autentikasi multi-role (Mahasiswa, Moderator/Kaprodi, Admin). | Semua Pengguna | US-01, US-12 |
| **FR-02** | Pengelolaan profil, bio, dan tag keahlian & minat. | Mahasiswa | US-02, US-06 |
| **FR-03** | Unggah portofolio dengan kategori Proyek, SKPI, Sertifikat, & Artikel Ilmiah. | Mahasiswa | US-03, US-15 |
| **FR-04** | Tinjauan & validasi berkas portofolio/SKPI oleh Kaprodi dan Admin. | Moderator, Admin | US-15 |
| **FR-05** | Publikasi postingan feed berfokus pada kombinasi Foto + Teks. | Mahasiswa | US-04 |
| **FR-06** | Kirim, terima, dan batalkan permintaan pertemanan mahasiswa. | Mahasiswa | US-13 |
| **FR-07** | Fitur blokir profil untuk menyembunyikan interaksi & aktivitas pengguna yang diblokir. | Mahasiswa | US-14 |
| **FR-08** | Pelaporan postingan melanggar oleh mahasiswa. | Mahasiswa | US-11 |
| **FR-09** | Tinjauan konten postingan dan antrean laporan oleh Moderator & Admin. | Moderator, Admin | US-10, US-16 |
| **FR-10** | Fitur hapus/takedown postingan pelanggar oleh Moderator & Admin. | Moderator, Admin | US-17 |
| **FR-11** | Rekomendasi kolaborator tim cerdas dengan algoritma TF-IDF & Cosine Similarity. | Mahasiswa | US-07, US-08 |
| **FR-12** | Tampilan Home Dashboard terpadu yang memadukan seluruh aktivitas linimasa, jaringan, dan verifikasi. | Semua Pengguna | US-18 |

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

- **Keamanan (Security & Access Control):** Role-Based Access Control (RBAC) ketat antara Mahasiswa, Moderator prodi, dan Admin. Password di-hash menggunakan `bcrypt`.
- **Integritas Moderasi:** Tindakan takedown/hapus postingan wajib mencatat siapa moderator yang menghapus (`deleted_by`), waktu penghapusan (`deleted_at`), dan alasan pelanggaran (`alasan_hapus`).
- **Explainability Rekomendasi:** Skor kecocokan kolaborator ditampilkan dalam bentuk persentase (e.g. 88% Match) beserta highlight skill yang beririsan.
- **Kinerja Basis Data:** Pencarian feed dan dashboard aktivitas teragregasi < 1 detik dengan pemanfaatan indeks basis data yang tepat.
