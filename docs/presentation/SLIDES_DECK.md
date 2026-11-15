# SLIDE DECK: DESAIN APLIKASI CAMPUSFOLIO (TEAM 3)
## Alur Lengkap Pengguna: Registrasi hingga Logout

> **Mata Kuliah / Program:** Desain & Pengembangan Aplikasi  
> **Nama Tim:** Team 3 — CampusFolio  
> **Anggota Tim:**
> - **Moh. Rifqi Dwi Ardiansyah (Rifqi)** — Hacker (Backend, Data Architecture & AI Pipeline)
> - **Hakim** — Hipster (UI/UX Designer, Wireframe/Mockup & User Experience)
> - **Ramadhan (Rama)** — Hustler (Product Strategy, AI Hypothesis & Pitching)
> - **Antigravity AI (PM Assistant) & Tim** — Project Management & Governance  
> **Versi Desain:** v1.1 (Revisi Integrasi: Role Moderator Kaprodi, Pertemanan, Blokir Profil, SKPI/Sertifikat/Artikel Ilmiah, & Dashboard Home Terpadu)  
> **Tanggal:** 27 - 30 Oktober 2026

---

## DAFTAR ISI SLIDE

1. **Slide 1:** Judul Presentasi & Profil Tim
2. **Slide 2:** Latar Belakang & Problem Statement
3. **Slide 3:** Solusi Produk & Value Proposition
4. **Slide 4:** Arsitektur Sistem & Pilihan Teknologi (Tech Stack)
5. **Slide 5:** Analisis Aktor & Role-Based Access Control (RBAC)
6. **Slide 6:** Peta Perjalanan Pengguna (User Journey Overview: Registrasi → Logout)
7. **Slide 7:** Alur 1 — Registrasi Akun, Validasi & Login Sesi
8. **Slide 8:** Alur 2 — Onboarding Profil, Tag Keahlian & Minat
9. **Slide 9:** Alur 3 — Home Dashboard Terpadu (Pusat Aktivitas Mahasiswa)
10. **Slide 10:** Alur 4 — Manajemen Pertemanan & Fitur Keamanan Privasi (Blokir Profil)
11. **Slide 11:** Alur 5 — Unggah Portofolio Multi-Kategori (Proyek, SKPI, Sertifikat, Artikel Ilmiah)
12. **Slide 12:** Alur 6 — Verifikasi Portofolio & Validasi SKPI oleh Kaprodi
13. **Slide 13:** Alur 7 — Pembuatan Postingan (Foto + Teks) & Moderasi Konten Cerdas (AI-2)
14. **Slide 14:** Alur 8 — Pencarian & Rekomendasi Kolaborator Cerdas (AI-1: TF-IDF & Cosine Similarity)
15. **Slide 15:** Alur 9 — Pelaporan Konten Pelanggar & Takedown oleh Moderator/Admin
16. **Slide 16:** Alur 10 — Terminasi Sesi & Logout Aman
17. **Slide 17:** Desain Basis Data Relasional (ERD 10 Tabel)
18. **Slide 18:** Showcase Desain Antarmuka Pengguna (UI Mockup Stitch)
19. **Slide 19:** Kesimpulan & Roadmap Pengembangan Sprint

---

### SLIDE 1: JUDUL & PROFIL TIM
- **Header:** CampusFolio — Campus Social Media & Portfolio
- **Subheader:** Desain Arsitektur Aplikasi & Alur Pengguna Terintegrasi (Registrasi hingga Logout)
- **Informasi Tim (Team 3):**
  - **Moh. Rifqi Dwi Ardiansyah** (Hacker — Lead Backend, Database, AI Pipeline)
  - **Hakim** (Hipster — UI/UX Lead, Design System, User Research)
  - **Ramadhan** (Hustler — Product Strategy, AI Evaluation, Business Logic)
- **Tagline:** *"Menghubungkan Talenta Kampus, Memvalidasi Prestasi, dan Menciptakan Kolaborasi Tanpa Batas."*
- **Speaker Notes:** "Selamat pagi/siang rekan-rekan dan dosen pengampu. Hari ini kami dari Team 3 mempresentasikan desain aplikasi CampusFolio, platform jejaring sosial dan portofolio akademik khusus mahasiswa yang mengintegrasikan kecerdasan buatan dan sistem validasi resmi kampus."

---

### SLIDE 2: LATAR BELAKANG & PROBLEM STATEMENT
- **Poin Masalah Utama:**
  1. **Keahlian & Karya Tersebar:** Mahasiswa menyimpan karya proyek di GitHub, Behance, Google Drive, atau flashdisk pribadi tanpa wadah terpusat.
  2. **Sulit Menemukan Rekan Tim:** Mahasiswa kesulitan mencari partner tugas akhir atau lomba yang memiliki keahlian komplementer (contoh: Designer mencari Developer).
  3. **Pencarian Global Terlalu Luas:** Platform seperti LinkedIn terlalu luas secara global, tidak mencerminkan ekosistem dan kebutuhan internal universitas.
  4. **Klaim SKPI Belum Terpadu:** Pengumpulan bukti Surat Keterangan Pendamping Ijazah (SKPI) dan artikel ilmiah masih bersifat manual dan lambat diverifikasi.
- **Problem Statement Resmi:**
  > *"Mahasiswa yang ingin membentuk tim proyek membutuhkan cara yang lebih mudah untuk menemukan rekan se-universitas dengan skill dan minat saling melengkapi. Ketiadaan wadah terpusat membuat tim terbentuk seadanya tanpa komposisi yang tepat. CampusFolio hadir menjawab permasalahan ini dengan profil terpusat, feed foto & teks, rekomendasi kolaborator berbasis AI, serta validasi portofolio SKPI resmi oleh Kaprodi."*
- **Speaker Notes:** "Fokus masalah kami berasal dari sudut pandang nyata mahasiswa: kesulitan membentuk tim yang solid di tingkat kampus karena minimnya visibilitas skill antar-jurusan."

---

### SLIDE 3: SOLUSI PRODUK & VALUE PROPOSITION
- **Pilar Solusi CampusFolio:**
  - **Pilar 1: Digital Portfolio & SKPI Vault:** Satu wadah untuk memamerkan proyek, sertifikat pelatihan, bukti SKPI, dan publikasi artikel ilmiah yang diverifikasi resmi oleh Ketua Program Studi (Kaprodi).
  - **Pilar 2: Smart AI Matcher (AI-1):** Rekomendasi kolaborator berbasis NLP (TF-IDF & Cosine Similarity) yang mampu memahami variasi bahasa dan memasangkan keahlian yang saling melengkapi (*complementary skills*).
  - **Pilar 3: Safe Campus Feed & Moderasi (AI-2):** Linimasa foto & teks dengan perlindungan konten otomatis (*AI contextual triage*) dan kendali penuh verifikasi manusia (*Human-in-the-Loop*).
  - **Pilar 4: Integrated Home Dashboard:** Pusat kontrol terpadu yang merangkum feed pertemanan, status verifikasi SKPI, friend requests, dan kartu rekomendasi AI dalam satu layar.
- **Speaker Notes:** "CampusFolio bukan sekadar sosial media biasa, melainkan ekosistem akademik yang aman, terverifikasi, dan membantu mahasiswa berkembang secara profesional."

---

### SLIDE 4: ARSITEKTUR SISTEM & PILIHAN TEKNOLOGI (TECH STACK)
- **Frontend Layer:**
  - **Web Client:** Next.js (React 18/19, TypeScript, TailwindCSS, Lucide Icons) — Responsif, performa tinggi, SEO-friendly.
  - **Mobile Client:** Expo React Native (iOS & Android) — Akses fleksibel dalam genggaman mahasiswa.
- **Backend & Service Layer:**
  - **API Engine:** Python FastAPI — Asynchronous, ultra-cepat, dokumentasi OpenAPI/Swagger bawaan di `/docs`.
- **Database & Storage Layer:**
  - **Database:** PostgreSQL (Supabase Cloud Free Tier) — 10 Tabel relasional dengan integritas relasi referensial kuat.
  - **Media Storage:** Supabase Cloud Storage — Penyimpanan berkas foto feed, dokumen sertifikat (PDF), dan avatar.
- **AI & NLP Pipeline:**
  - **Baseline Rekomendasi:** Scikit-Learn TF-IDF Vectorizer + Cosine Similarity Matcher.
  - **Moderasi Teks:** Rule-based fallback + Text Classifier Contextual Pipeline (*Graceful Degradation*).
- **Speaker Notes:** "Kami memilih arsitektur decoupled antara frontend Next.js dan backend FastAPI agar pemrosesan algoritma AI Python dapat berjalan optimal tanpa membebani rendering antarmuka."

---

### SLIDE 5: ANALISIS AKTOR & ROLE-BASED ACCESS CONTROL (RBAC)
- **Tiga Aktor Utama + Satu Aktor Sistem:**
  1. **Mahasiswa (Main User):**
     - Registrasi, kelola profil, buat postingan foto + teks.
     - Tambah pertemanan, kirim pesan kolaborasi, blokir akun pengganggu.
     - Unggah portofolio (karya, sertifikat, SKPI, artikel ilmiah).
     - Mencari dan menerima rekomendasi kolaborator AI.
  2. **Moderator / Kepala Program Studi (Kaprodi):**
     - Memoderasi postingan mahasiswa prodinya.
     - Meninjau, memvalidasi keabsahan dokumen bukti SKPI dan artikel ilmiah.
     - Melakukan *takedown* (penghapusan) postingan yang melanggar norma kampus.
  3. **Administrator Kemahasiswaan (Super Admin):**
     - Kontrol universitas lintas program studi.
     - Menangani eskalasi laporan pelanggaran berat dan audit sistem.
  4. **Layanan AI (System Actor):**
     - Komputasi skor kemiripan teks & klasifikasi awal konten postingan.
- **Speaker Notes:** "Pembedaan role ini sangat krusial, terutama peran Kaprodi yang menjembatani aktivitas mahasiswa dengan pengakuan resmi akademik tingkat program studi."

---

### SLIDE 6: PETA PERJALANAN PENGGUNA (USER JOURNEY OVERVIEW)
- **Visualisasi Alur Lengkap Pengguna (Registrasi → Logout):**
  ```text
  [1. REGISTRASI & VALIDASI]
             │
             ▼
  [2. LOGIN & AUTENTIKASI SESI]
             │
             ▼
  [3. ONBOARDING PROFIL & SKILLS]
             │
             ▼
  [4. EKSPLORASI HOME DASHBOARD TERPADU]
             │
      ┌──────┴──────────────────────────────────────┐
      ▼                                             ▼
  [5. PERTEMANAN & PRIVASI]             [6. UNGGAH PORTOFOLIO / SKPI]
  • Kirim/Terima Pertemanan             • Proyek, Sertifikat, Artikel Ilmiah
  • Blokir Pengguna (Mutual Hide)       • Verifikasi Resmi oleh Kaprodi
      │                                             │
      └──────────────────────┬──────────────────────┘
                             │
      ┌──────────────────────┴──────────────────────┐
      ▼                                             ▼
  [7. POSTING FOTO/TEKS & AI-2]         [8. CARI REKAN & REKOMENDASI AI-1]
  • Caption + Foto Karya/Lomba          • Filter Keahlian / Jurusan
  • Scan Otomatis Teks Aman             • Rekomendasi Kolaborator 88% Match
      │                                             │
      └──────────────────────┬──────────────────────┘
                             │
                             ▼
  [9. LAPORAN PELANGGARAN & MODERASI TAKEDOWN]
  • Pengaduan Konten Melanggar -> Soft-delete oleh Kaprodi
                             │
                             ▼
  [10. TERMINASI SESI & LOGOUT AMAN]
  ```
- **Speaker Notes:** "Ini adalah peta 10 langkah perjalanan pengguna yang akan kita bedah satu per satu, memperlihatkan bagaimana data mengalir dari sisi front-end, backend, hingga basis data."

---

### SLIDE 7: ALUR 1 — REGISTRASI AKUN, VALIDASI & LOGIN SESI
- **Langkah-Langkah Registrasi:**
  1. Mahasiswa membuka form Sign Up, mengisi: **NIM**, **Nama Lengkap**, **Email Kampus** (`@kampus.ac.id`), **Password**, **Program Studi/Jurusan**, dan **Tahun Angkatan**.
  2. Sistem Frontend memvalidasi format email institusi dan kompleksitas password.
  3. Backend FastAPI memeriksa keunikan NIM dan email pada tabel `users`.
  4. Password dienkripsi menggunakan algoritma `bcrypt` salt hashing.
  5. Akun tersimpan dengan role default `mahasiswa`.
- **Langkah-Langkah Login:**
  1. Mahasiswa memasukkan kredensial (NIM/Email + Password).
  2. Backend memverifikasi hash dan menerbitkan **JWT Access Token**.
  3. Client menyimpan token aman pada local state / secure cookie.
  4. Pengguna diarahkan ke Dashboard Home atau halaman onboarding profil.
- **Tabel Basis Data Terkait:** `users` (kolom: `user_id`, `nim`, `email`, `password_hash`, `role`).
- **Speaker Notes:** "Keamanan diawali dari pintu masuk. Penggunaan email kampus dan validasi NIM memastikan bahwa seluruh entitas yang berinteraksi di dalam platform adalah mahasiswa aktif yang sah."

---

### SLIDE 8: ALUR 2 — ONBOARDING PROFIL, TAG KEAHLIAN & MINAT
- **Kelola Profil Pribadi:**
  - Pengunggahan foto profil (Avatar) ke Supabase Storage.
  - Pengisian bio informatif (ringkasan ketertarikan akademik dan karier).
  - Penambahan tautan kontak eksternal: GitHub, LinkedIn, Behance, WhatsApp.
- **Manajemen Skill & Minat:**
  - Mahasiswa memilih atau mengetik tag keahlian teknis (contoh: *React, Python, Figma, UI/UX, Data Mining*).
  - Menentukan tingkat kemahiran: `pemula`, `menengah`, atau `mahir`.
  - Menentukan minat spesifik: Lomba Gemastik, Hackathon, Proyek Skripsi, atau Open Source.
- **Tabel Basis Data Terkait:** `skills`, `user_skills` (relasi Many-to-Many antara pengguna dan daftar skill).
- **Nilai Penting:** Profil yang lengkap menjadi korpus data utama bagi model rekomendasi AI untuk mencocokkan rekan kolaborasi.
- **Speaker Notes:** "Data skill dan bio yang diisi mahasiswa pada tahap ini bukan hanya sekadar pajangan, tetapi menjadi bahan baku ekstraksi fitur teks untuk sistem rekomendasi kolaborasi."

---

### SLIDE 9: ALUR 3 — HOME DASHBOARD TERPADU (PUSAT AKTIVITAS)
- **Konsep All-in-One Centralized Hub:**
  - **Feed Linimasa Terpadu:** Melihat postingan progres karya, kegiatan kampus, dan poster rekrutmen tim.
  - **Widget Jaringan Pertemanan:** Menampilkan pertemanan aktif dan notifikasi *Friend Request* yang butuh respon cepat.
  - **Widget Capaian Portofolio & SKPI:** Menampilkan ringkasan portofolio terverifikasi dan poin SKPI yang telah disetujui Kaprodi.
  - **Widget Rekomendasi AI:** Menampilkan kartu-kartu mahasiswa dengan keahlian komplementer secara otomatis tanpa perlu dicari manual.
  - **Quick Alert Khusus Kaprodi/Admin:** Notifikasi antrean dokumen portofolio yang menunggu review dan laporan konten baru.
- **Desain Layar:** Mengacu pada UI Stitch `01_feed_proyek.png`.
- **Speaker Notes:** "Home Dashboard dirancang agar mahasiswa langsung mendapatkan insight lengkap dalam sekali pandang tanpa harus berpindah-pindah menu."

---

### SLIDE 10: ALUR 4 — MANAJEMEN PERTEMANAN & PRIVASI (BLOKIR PROFIL)
- **Alur Networking Mahasiswa:**
  1. Mahasiswa mengunjungi profil mahasiswa lain atau melihat tombol tambah teman di kartu rekomendasi.
  2. Klik **"Kirim Permintaan Pertemanan"** (`friendships.status = 'menunggu'`).
  3. Penerima mendapatkan notifikasi di dashboard dan dapat memilih: **Terima** (`diterima`) atau **Tolak** (`ditolak`).
  4. Pengguna dapat memfilter feed hanya untuk melihat konten dari lingkar pertemanannya.
- **Alur Keamanan & Privasi (Blokir Profil):**
  - Jika seorang mahasiswa merasa privasinya terganggu atau mengalami perundungan:
  - Klik **"Blokir Pengguna"** pada profil yang bersangkutan (tersimpan di `user_blocks`).
  - Efek Sistem: *Mutual Invisible* — Kedua pengguna tidak lagi dapat saling melihat profil, postingan feed, maupun muncul di hasil rekomendasi AI.
- **Speaker Notes:** "Kenyamanan dan keamanan psikologis mahasiswa adalah prioritas. Fitur blokir menjamin ruang gerak pengguna tetap terlindungi dari interaksi yang tidak diinginkan."

---

### SLIDE 11: ALUR 5 — UNGGAH PORTOFOLIO MULTI-KATEGORI
- **4 Kategori Portofolio:**
  1. **Proyek Karya:** Web app, mobile app, desain UI/UX, hardware IoT, karya kreatif.
  2. **Bukti SKPI:** Kegiatan organisasi, kepanitiaan universitas, prestasi lomba resmi.
  3. **Sertifikat Kompetensi:** Sertifikat keahlian industri (BNSP, Coursera, Dicoding, Google).
  4. **Artikel Ilmiah:** Publikasi pada seminar nasional/internasional, jurnal terindeks SINTA/Scopus.
- **Formulir Pengunggahan Terstruktur:**
  - Judul portofolio, deskripsi teknis, tautan demonstrasi/repository.
  - Nomor Sertifikat / DOI Dokumen Ilmiah, Nama Lembaga Penerbit, Tanggal Terbit.
  - Unggah Berkas Dokumen Bukti (PDF / Gambar resolusi tinggi).
  - Tag keahlian terkait (`portfolio_skills`).
  - Status awal saat disubmit: `menunggu_review`.
- **Speaker Notes:** "Berbeda dari media sosial umum, CampusFolio memfasilitasi pengunggahan dokumen formal seperti SKPI dan jurnal ilmiah dengan struktur metadata akademik yang lengkap."

---

### SLIDE 12: ALUR 6 — VERIFIKASI PORTOFOLIO & VALIDASI SKPI OLEH KAPRODI
- **Alur Kerja Verifikasi (Kaprodi / Moderator):**
  1. Kaprodi masuk ke panel **"Tinjauan Portofolio & SKPI Prodi"**.
  2. Sistem hanya menampilkan antrean pengajuan dari mahasiswa yang jurusannya sesuai dengan prodi Kaprodi.
  3. Kaprodi membuka dokumen bukti PDF dan memeriksa keabsahan nomor dokumen / DOI artikel.
  4. **Keputusan Kaprodi:**
     - **Setujui & Verifikasi:** Status berubah menjadi `terverifikasi`, portofolio mendapatkan badge resmi (*Verified Academic Badge*), dan poin SKPI tercatat di transkrip pendamping mahasiswa.
     - **Tolak / Minta Revisi:** Kaprodi wajib menyertakan catatan perbaikan (contoh: *"Lampiran sertifikat buram, mohon unggah ulang versi asli"*). Mahasiswa menerima notifikasi revisi.
- **Tabel Basis Data Terkait:** `portfolio_items` (`status_verifikasi`, `diverifikasi_oleh`, `catatan_verifikasi`, `verified_at`).
- **Speaker Notes:** "Di sinilah nilai akademik CampusFolio bersinar. Sertifikat dan karya mahasiswa memiliki legitimasi nyata karena telah divalidasi langsung oleh pihak program studi."

---

### SLIDE 13: ALUR 7 — PEMBUATAN POSTINGAN & MODERASI KONTEN CERDAS (AI-2)
- **Pembuatan Postingan Feed:**
  - Mahasiswa menulis teks caption dan memilih foto dokumentasi proyek/kegiatan.
  - Memilih jenis postingan: **Umum** atau **"Mencari Anggota Tim"** (disertai tag kriteria keahlian).
- **Inspeksi Teks Cerdas (AI-2 Text Moderation):**
  - Backend mengirim teks postingan ke modul NLP Classifier.
  - Model mengevaluasi sentimen, indikasi ujaran kebencian, kata kasar, atau penipuan.
  - Output AI berupa JSON: `label` (`aman`, `perlu_review`, `berpotensi_melanggar`), `confidence`, dan `explanation`.
- **Prinsip Human-in-the-Loop & Graceful Degradation:**
  - Jika `aman` (skor confidence tinggi) → Postingan langsung tayang di linimasa.
  - Jika `perlu_review` → Postingan ditahan sementara di antrean moderator Kaprodi. AI tidak menghapus konten secara permanen; keputusan takedown mutlak di tangan dosen/admin manusia!
  - Jika layanan AI offline → Sistem tetap mengizinkan posting (tidak crash), menandainya untuk antrean audit reguler.
- **Speaker Notes:** "AI bertindak sebagai asisten penyaring awal, bukan hakim akhir. Hal ini mencegah terjadinya false positive dan memastikan asas keadilan akademik."

---

### SLIDE 14: ALUR 8 — PENCARIAN & REKOMENDASI KOLABORATOR (AI-1)
- **Dua Metode Menemukan Partner Kolaborasi:**
  1. **Pencarian Eksploratif:** Mahasiswa mencari manual dengan filter kata kunci, jurusan, angkatan, dan tag spesifik di menu Jelajah.
  2. **Smart AI Recommendation Engine (AI-1):**
     - Menggunakan algoritma **TF-IDF Vectorizer + Cosine Similarity** untuk menghitung kedekatan semantik profil pengguna dan kebutuhan proyek.
     - Mendeteksi **Complementary Skills**: Jika pengguna adalah seorang *UI/UX Designer*, sistem memprioritaskan rekomendasi mahasiswa dengan skill *Frontend / Backend Developer*.
- **Explainable AI (Transparansi Rekomendasi):**
  - Kartu rekomendasi menampilkan persentase kecocokan (e.g. **88% Match**).
  - Menyajikan alasan rasional: *"Memiliki keahlian Flutter & FastAPI yang melengkapi keahlian desain antarmuka Anda."*
  - Opsi aksi cepat: Tombol "Kirim Pertemanan" atau "Ajak Kolaborasi".
- **Speaker Notes:** "Mengapa kami tidak memakai pencocokan if-else sederhana? Karena mahasiswa menulis istilah dengan sangat bervariasi. Pendekatan vector space model menjamin kecocokan semantik yang jauh lebih akurat dan relevan."

---

### SLIDE 15: ALUR 9 — PELAPORAN KONTEN & MODERASI TAKEDOWN
- **Alur Pelaporan oleh Komunitas Mahasiswa:**
  1. Mahasiswa menemukan postingan yang melanggar etika kampus pada feed.
  2. Klik ikon opsi `...` → Pilih **"Laporkan Postingan"**.
  3. Memilih kategori: *Spam*, *Konten Tidak Pantas*, *Ujaran Kebencian / SARA*, *Plagiarisme*.
  4. Laporan tersimpan di tabel `reports` dan memicu alert di Dashboard Kaprodi/Admin.
- **Eksekusi Takedown oleh Kaprodi / Admin:**
  1. Moderator membuka **Antrean Laporan & Moderasi**.
  2. Meninjau teks postingan, foto bukti, dan riwayat klasifikasi AI.
  3. Jika terbukti melanggar: Moderator menekan **"Hapus Postingan"** dan wajib mengisi form alasan penindakan.
  4. **Mekanisme Soft-Delete:** Postingan tidak dihapus permanen dari basis data, melainkan ditandai `is_deleted = TRUE` serta mencatat `deleted_by`, `deleted_at`, dan `alasan_hapus` untuk menjaga integritas jejak audit akademik.
- **Speaker Notes:** "Kombinasi antara laporan aktif mahasiswa dan wewenang takedown Kaprodi menciptakan lingkungan digital kampus yang beradab dan beretika."

---

### SLIDE 16: ALUR 10 — TERMINASI SESI & LOGOUT AMAN
- **Alur Selesai Sesi:**
  1. Mahasiswa mengklik menu avatar / profil pada header navigasi.
  2. Memilih tombol aksi **"Logout"**.
  3. Sistem memunculkan modal dialog konfirmasi keluar.
  4. Client menghapus JWT Access Token dari penyimpanan lokal (Local Storage / State).
  5. Sesi di backend di-invalidate untuk mencegah session replay attack.
  6. Aplikasi otomatis melakukan pengalihan (*redirect*) kembali ke halaman Landing / Login.
  7. *Protected Route Middleware* memastikan halaman-halaman internal tidak dapat diakses kembali menggunakan tombol 'Back' peramban tanpa melakukan login ulang.
- **Speaker Notes:** "Logout mengunci kembali seluruh hak akses perangkat, menutup siklus lengkap interaksi pengguna dengan standar keamanan modern."

---

### SLIDE 17: DESAIN BASIS DATA RELASIONAL (ERD 10 TABEL)
- **Ringkasan Arsitektur Data PostgreSQL (10 Tabel Terhubung):**
  1. `users` : Data akun, NIM unik, email kampus, password hash, role (mahasiswa, moderator, admin).
  2. `skills` : Kamus data keahlian dan minat standar kampus.
  3. `user_skills` : Relasi Many-to-Many keahlian mahasiswa beserta level kemahiran.
  4. `friendships` : Manajemen pertemanan antar mahasiswa (status: menunggu, diterima, ditolak).
  5. `user_blocks` : Tabel isolasi privasi pemblokiran akun.
  6. `portfolio_items` : Katalog karya, bukti SKPI, sertifikat, artikel ilmiah, dan status verifikasi.
  7. `portfolio_skills` : Tag keahlian yang disematkan pada setiap karya portofolio.
  8. `posts` : Postingan feed linimasa foto + teks, status audit, dan flag soft-delete.
  9. `post_skills` : Kategori keahlian yang dicari pada postingan rekrutmen tim.
  10. `moderation_records` & `reports` : Jejak audit klasifikasi AI, laporan aduan, dan keputusan moderator.
  11. `recommendation_logs` : Log pencatatan performa rekomendasi AI dan feedback kecocokan.
- **Integritas Referensial:** Penggunaan `Foreign Key` berindeks dan penanganan integritas relasional yang solid.
- **Speaker Notes:** "Seluruh skema database telah dioptimalkan dengan indexing pada foreign key utama sehingga pencarian feed dan komputasi rekomendasi tetap responsif di bawah 1 detik."

---

### SLIDE 18: SHOWCASE DESAIN ANTARMUKA PENGGUNA (UI MOCKUP)
- **4 Layar Kunci Antarmuka (Desain Stitch):**
  1. **Layar 1 — Feed Proyek & Linimasa (`01_feed_proyek.png`):** Tampilan linimasa interaktif, postingan foto proyek, tombol aksi apresiasi, dan tombol laporkan konten.
  2. **Layar 2 — Koleksi Portofolio & Capaian (`02_koleksi_portofolio.png`):** Grid portofolio dengan filter kategori (Proyek, SKPI, Sertifikat, Artikel Ilmiah) dan badge verifikasi Kaprodi.
  3. **Layar 3 — Profil Mahasiswa & Skills (`03_profil_mahasiswa_skills.png`):** Kartu identitas mahasiswa, bio, badge kemahiran skill, tautan portofolio eksternal, dan tombol aksi tambah teman.
  4. **Layar 4 — Jelajah & Rekomendasi AI (`04_jelajah_rekomendasi_ai.png`):** Bilah pencarian multi-filter dan kartu rekomendasi kolaborator cerdas dengan skor persentase match dan penjelasan rasional.
- **Speaker Notes:** "Desain antarmuka memprioritaskan tipografi yang bersih, tata letak modern, dan kemudahan navigasi agar mahasiswa nyaman berlama-lama membangun portofolionya."

---

### SLIDE 19: KESIMPULAN & ROADMAP PENGEMBANGAN SPRINT
- **Kesimpulan Desain:**
  - CampusFolio sukses memadukan 3 fungsi vital: Media Sosial Kampus, Manajemen Portofolio Terverifikasi SKPI, dan Smart AI Collaborator Matcher.
  - Alur end-to-end dari Registrasi hingga Logout dirancang intuitif, aman, dan mematuhi etika akademik berprinsip *Human-in-the-Loop*.
- **Roadmap Pengembangan Sprint (Metodologi Agile/Scrum):**
  - **Sprint 0 (Current):** Desain Sistem, PRD v1.1, Arsitektur Database, Diagram Alur, dan Wireframe UI Stitch.
  - **Sprint 1 (Minggu 1-2):** Implementasi Modul Autentikasi (Registrasi/Login/Logout), Profil Pengguna & Manajemen Skill.
  - **Sprint 2 (Minggu 3-4):** Modul Portofolio Multi-Kategori & Dashboard Panel Verifikasi SKPI untuk Kaprodi.
  - **Sprint 3 (Minggu 5-6):** Linimasa Feed Foto/Teks, Integrasi AI-1 (Rekomendasi TF-IDF), dan AI-2 (Moderasi Teks).
  - **Sprint 4 (Minggu 7-8):** Sistem Pelaporan & Takedown, Pengujian Menyeluruh (UAT), dan Peluncuran Beta Kampus.
- **Slide Penutup:** *"Terima Kasih — Tanya Jawab & Diskusi Terbuka."*
- **Speaker Notes:** "Demikian presentasi desain aplikasi CampusFolio dari Team 3. Kami membuka sesi tanya jawab dan masukan dari dosen serta rekan-rekan sekalian. Terima kasih!"
