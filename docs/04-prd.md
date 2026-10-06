# 04 — Product Requirements Document (PRD)

**Proyek:** CampusFolio — Campus Social Media & Portfolio  
**Versi:** 1.0 (MVP Scope)  
**Tanggal:** 6 Oktober 2026  

---

## 1. Persona Pengguna

- **Persona 1: Mahasiswa Pencari Tim (Pengguna Utama)**
  - *Karakteristik:* Memiliki ide proyek atau keahlian spesifik (misal UI/UX Designer atau Data Analyst), butuh rekan pelengkap (Developer, Hustler) untuk kompetisi.
  - *Tujuan:* Cepat melihat rekam jejak portofolio calon rekan dan alasan relevansi kecocokan.
- **Persona 2: Mahasiswa Pemilik Portofolio**
  - *Karakteristik:* Memiliki karya proyek perkuliahan atau tugas mandiri yang ingin dipamerkan.
  - *Tujuan:* Mendapatkan pengakuan karya, networking, dan tawaran kolaborasi yang kredibel.
- **Persona 3: Administrator / Moderator Kampus**
  - *Karakteristik:* Staf kampus atau perwakilan BEM/Himpunan yang bertugas menjaga etika media sosial kampus.
  - *Tujuan:* Memantau antrean laporan konten bermasalah yang telah dipilah secara otomatis oleh AI untuk ditindaklanjuti secara akurat.

---

## 2. Batasan Ruang Lingkup (Scope Boundaries)

### In-Scope (MVP):
- Autentikasi Pengguna (Registrasi, Login, Logout berbasis email & password terenkripsi).
- Profil Mahasiswa (Nama, jurusan, angkatan, bio, tag skill, dan minat).
- Portofolio Interaktif (Judul, deskripsi, tautan repositori/file/gambar, tag kompetensi).
- Feed Posting & Pengumuman (Teks bebas & tipe khusus *"Mencari Anggota Proyek"*).
- Fitur Pencarian Global (Berdasarkan kata kunci, nama, keahlian, dan tag minat).
- Modul AI Teks 1: Rekomendasi kolaborator berdasarkan kecocokan skill & kebutuhan proyek.
- Modul AI Teks 2: Klasifikasi awal teks postingan untuk moderasi otomatis (*safe*, *review*, *flagged*).
- Panel Moderasi Admin: Tinjauan konten terlapor dengan aksi Setujui, Tolak, atau Minta Revisi.

### Out-of-Scope (Pasca-MVP):
- Fitur direct message (chat) real-time atau panggilan video (cukup tautan kontak/WhatsApp/email).
- Integrasi Single Sign-On (SSO) LDAP/SIAKAD kampus penuh.
- Moderasi gambar/video otomatis (fokus awal pada analisis teks).
- Fitur monetisasi, endorsement, atau sistem job recruitment profesional.

---

## 3. Kebutuhan Fungsional (Functional Requirements)

| Kode | Kebutuhan Fungsional | User Story Terkait |
| --- | --- | --- |
| **FR-01** | Sistem mendukung pendaftaran akun, autentikasi login, sesi aman, dan logout. | US-01, US-12 |
| **FR-02** | Pengguna dapat membuat dan memperbarui data profil (bio, jurusan, skills, interests). | US-02 |
| **FR-03** | Pengguna dapat membuat, mengedit, melihat detail, dan menghapus item portofolio (CRUD). | US-03, US-06 |
| **FR-04** | Pengguna dapat mempublikasikan postingan feed (tipe umum atau 'cari rekan'). | US-04, US-08 |
| **FR-05** | Sistem menyediakan fitur pencarian berdasarkan query teks, keahlian, dan minat. | US-05 |
| **FR-06** | Pengguna dapat melihat profil lengkap dan portofolio mahasiswa lain. | US-06 |
| **FR-07** | Sistem menampilkan daftar rekomendasi rekan kolaborator lengkap dengan skor & alasan relevansi. | US-07, US-08 |
| **FR-08** | Sistem melakukan inspeksi teks postingan otomatis menggunakan AI klasifikasi konten. | US-09 |
| **FR-09** | Antarmuka moderator untuk menyetujui, menolak, atau menghapus postingan yang ditandai. | US-10 |
| **FR-10** | Pengguna dapat melaporkan postingan yang dianggap melanggar norma kampus. | US-11 |

---

## 4. Kebutuhan Non-Fungsional (Non-Functional Requirements)

- **Keamanan (Security):** Password wajib di-hash menggunakan algoritma kuat (e.g. bcrypt/Argon2); komunikasi melalui HTTPS; validasi input ketat terhadap XSS dan SQL Injection.
- **Privasi Data:** Hanya data publik yang diekspos ke model AI; data sensitif tidak diteruskan ke layanan pihak ketiga; pengguna memiliki hak menghapus akun beserta seluruh jejak data.
- **Kinerja (Performance):** Latensi pencarian data awal < 2 detik; waktu inferensi rekomendasi AI < 3 detik.
- **Keandalan & Fallback (Reliability):** Kegagalan API AI tidak boleh menghentikan fungsi inti (fallback ke deterministic keyword matching).
- **Explainability (Transparansi):** Rekomendasi AI wajib menyertakan atribut `reason` yang menjelaskan mengapa pengguna tersebut direkomendasikan.
- **Responsivitas & Aksesibilitas:** Antarmuka responsif dan kontras warna memenuhi standar WCAG 2.1 AA.

---

## 5. Model Data Awal (Entity-Relationship Overview)

- **User**: `id`, `name`, `email`, `password_hash`, `department`, `batch_year`, `bio`, `role` (student/admin), `created_at`
- **Skill / Interest**: `id`, `name`, `category` (skill/interest)
- **UserSkillInterest**: `user_id`, `skill_interest_id`, `proficiency_level`
- **PortfolioItem**: `id`, `user_id`, `title`, `description`, `project_url`, `image_url`, `tags`, `created_at`
- **Post**: `id`, `user_id`, `content`, `post_type` (general/looking_for_team), `status` (published/flagged/rejected), `created_at`
- **ModerationRecord**: `id`, `post_id`, `ai_label`, `confidence_score`, `ai_explanation`, `admin_decision`, `reviewed_by`, `reviewed_at`
- **Report**: `id`, `post_id`, `reporter_id`, `reason`, `status`, `created_at`

---

## 6. Metrik Keberhasilan (Success Metrics)

1. **Adopsi Profil:** 70% pengguna uji melengkapi profil mereka (minimal 3 skill dan 1 item portofolio).
2. **Efisiensi Kolaborasi:** Waktu rata-rata menemukan rekan proyek yang relevan < 3 menit dalam sesi pengujian.
3. **Akurasi Rekomendasi:** Minimal 60% pengguna uji menilai 3 rekomendasi teratas relevan dengan kebutuhan mereka.
4. **Efektivitas Moderasi:** Minimal 80% konten kasar/tidak pantas pada dataset uji tertangkap oleh filter AI awal.
5. **Human Oversight:** 100% konten dengan label berisiko tinggi wajib diputuskan oleh admin manusia.

---

## 7. Manajemen Risiko & Mitigasi

| Risiko | Dampak | Strategi Mitigasi |
| --- | --- | --- |
| *Cold Start Data* (data profil mahasiswa awal minim) | Skor rekomendasi AI tidak akurat | Injeksi seed data dummy 30–50 variasi mahasiswa; fallback pencarian keyword. |
| *Scope Creep* (keinginan menambah fitur chat, video call) | Waktu rilis molor, MVP gagal | Disiplin pada batasan Scope MVP; fitur tambahan dicatat di Product Backlog cadangan (Could Have). |
| *AI False Positive* pada moderasi teks gaul kampus | Postingan wajar terblokir otomatis | Set ambang batas moderasi: hanya tandai untuk *review*, jangan hapus otomatis tanpa persetujuan manusia. |
| *Ketergantungan Kuota/Biaya API Eksternal* | Service error jika token habis | Siapkan implementasi lokal baseline (TF-IDF / Cosine Similarity) dan caching response. |
