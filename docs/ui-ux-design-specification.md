# Dokumen Spesifikasi UI/UX Desain — CampusFolio (Team 3)

Disusun oleh: **Lead UI/UX Designer**  
Platform: **Mobile Web & Native Application**  
Tema Desain: **Academic Modernist**  
Perangkat Bantu: **Google Stitch via Model Context Protocol (MCP)**

---

## 1. Ringkasan Eksekutif Desain

Aplikasi **CampusFolio** dirancang untuk menyelesaikan masalah terfragmentasinya portofolio mahasiswa dan sulitnya menemukan rekan kolaborasi yang memiliki keahlian saling melengkapi di lingkungan perguruan tinggi.

Sebagai perancang UI/UX, prinsip dasar yang diterapkan dalam keseluruhan desain adalah **"Academic Modernist"**:
- **Formal, Bersih, dan Berwibawa:** Mempertahankan standar kredibilitas perguruan tinggi.
- **Bebas dari Emote/Emoji Kasual:** Menghindari penggunaan emoji media sosial santai yang tidak relevan. Seluruh representasi visual memanfaatkan **Material Symbols Outlined** berstandar Google Fonts.
- **Keterbukaan Berbasis AI (Explainable AI):** Setiap rekomendasi kolaborator atau proyek selalu menyertakan label persentase kecocokan semantik (*match score*) dan penjelasan singkat mengapa kedua mahasiswa cocok.
- **Etika & Moderasi Kampus:** Fitur pembuatan konten dilengkapi indikator visual verifikasi kepatuhan konten (*Campus Ethics Check*).

---

## 2. Design System Tokens (Academic Modernist)

### 2.1 Palet Warna Utama
| Token | Nilai Hex | Fungsi / Filosofi |
| :--- | :--- | :--- |
| `primary` | `#2A14B4` | Warna identitas akademis mendalam (Deep Indigo). |
| `primary-container` | `#4338CA` | Aksen tombol primer, banner highlight, dan status aktif. |
| `surface` | `#FAF8FF` | Latar belakang kanvas aplikasi yang lembut di mata. |
| `surface-card` | `#FFFFFF` | Latar kartu informasi konten dengan kontras tinggi. |
| `surface-container-low`| `#F2F3FF` | Aksen kontainer lembut untuk input form & chip filter. |
| `match-emerald` | `#10B981` | Indikator keberhasilan, verifikasi identitas, dan skor kecocokan AI tinggi. |
| `recruiting-coral` | `#F43F5E` | Penanda urgensi kebutuhan anggota tim (*Open Recruitment*). |
| `border-subtle` | `#E2E8F0` | Garis pembatas kartu yang elegan dan tidak mendominasi. |
| `on-surface` | `#131B2E` | Teks judul utama berbobot tebal dengan keterbacaan tajam. |
| `on-surface-variant` | `#464554` | Teks sekunder, label atribut, dan metadata. |

### 2.2 Tipografi
- **Display & Headings:** `Plus Jakarta Sans` (Weight: 600, 700, 800) untuk nuansa modern, dinamis, dan terstruktur.
- **Body & Labels:** `Inter` & `Plus Jakarta Sans` (Weight: 400, 500, 600) untuk kenyamanan membaca teks panjang, deskripsi proyek, dan form input.
- **Data & Identitas (NIM / Token):** `Inter Monospace` untuk keterbacaan data numerik akademik.

### 2.3 Ikonografi
- Menggunakan **Google Material Symbols Outlined** (tanpa icon emoji).
- Contoh pemetaan simbol:
  - Identitas Akun: `school`, `badge`, `person`, `mail`, `lock`
  - Aksi Kolaborasi: `group_add`, `handshake`, `rocket_launch`, `send`
  - Rekomendasi AI: `auto_awesome`, `psychology`, `verified_user`
  - Bukti Karya: `code` (GitHub), `open_in_new` (Live Demo), `brush` (Figma), `article` (Paper/PDF)

---

## 3. Peta Alur Layar Mahasiswa (User Journey)

Seluruh 12 halaman mobile mahasiswa telah dirancang dan diekspor dalam format HTML Tailwind CSS serta Screenshot PNG beresolusi tinggi:

```
[Mulai]
   │
   ├── (1) 00_registrasi_mahasiswa.html  (Pendaftaran Mahasiswa Baru)
   │        │
   │        ├── (2) 00_login_mahasiswa.html  (Login & SSO Kampus)
   │        │
   │        └── (3) 00_onboarding_minat_skills.html  (Setup Minat & Tag Skill)
   │                 │
   ▼                 ▼
[Dashboard Utama Mahasiswa]
   │
   ├── (4) 01_feed_proyek.html  (Beranda & Feed Kolaborasi Proyek)
   │        ├── (5) 05_buat_proyek_rekrutmen.html  (Buat Lowongan Tim Baru)
   │        └── (6) 06_detail_proyek_kolaborasi.html  (Detail Proyek & Join Request)
   │
   ├── (7) 02_koleksi_portofolio.html  (Galeri Karya Mahasiswa)
   │        ├── (8) 07_tambah_portofolio.html  (Unggah Karya & Bukti Link)
   │        └── (9) 08_detail_portofolio.html  (Showcase Karya Lengkap)
   │
   ├── (10) 04_jelajah_rekomendasi_ai.html  (Pencari Kolaborator AI)
   ├── (11) 03_profil_mahasiswa_skills.html  (Profil & Pengaturan Portofolio Saya)
   └── (12) 09_notifikasi_kolaborasi.html  (Kelola Permintaan Tim & Undangan)
```

---

## 4. Rincian Antarmuka Layar yang Dirancang

### 1. Registrasi Akun Mahasiswa (`00_registrasi_mahasiswa.html`)
- **Tujuan:** Verifikasi identitas akademik mahasiswa dan pendaftaran akun aman.
- **Elemen UX Kunci:**
  - Opsi *Single Sign-On* (SSO Kampus) satu klik.
  - Validasi email domain kampus berakhiran `@*.ac.id`.
  - Input field NIM (Nomor Induk Mahasiswa) dengan format terstandarisasi.
  - Pengelompokan Fakultas dan Program Studi (*optgroup*).
  - Checkbox persetujuan Etika Akademik & Privasi Data Kampus.

### 2. Login Mahasiswa & SSO Kampus (`00_login_mahasiswa.html`)
- **Tujuan:** Akses masuk cepat dan terenkripsi bagi mahasiswa yang telah terdaftar.
- **Elemen UX Kunci:**
  - Tombol masuk SSO SIAKAD Kampus sebagai prioritas atas.
  - Input NIM / Email Kampus dan Kata Sandi dengan tombol toggle visibilitas gembok.
  - Opsi "Ingat Perangkat Ini" dan "Lupa Kata Sandi?".
  - Banner jaminan kepatuhan keamanan data akademik di bagian bawah.

### 3. Onboarding Minat & Keahlian Mahasiswa (`00_onboarding_minat_skills.html`)
- **Tujuan:** Melengkapi data profil untuk input algoritma pencocokan semantik AI.
- **Elemen UX Kunci:**
  - Progress indicator langkah (Langkah 2 dari 3).
  - Unggah foto profil formal/semi-formal kampus.
  - Bio singkat akademik yang dianalisis oleh modul NLP AI.
  - Grid chip selector untuk Role & Minat (UI/UX, Frontend, Flutter, Backend, AI/ML, IoT).
  - Card selector preferensi kolaborasi: *Aktif Mencari Tim (Lomba)*, *Terbuka Kolaborasi*, atau *Fokus Belajar*.

### 4. Beranda & Feed Proyek Mahasiswa (`01_feed_proyek.html`)
- **Tujuan:** Pusat interaksi komunitas, berbagi kabar proyek, dan posting lowongan tim lomba/tugas.
- **Elemen UX Kunci:**
  - Tombol aksi cepat: "Cari Tim" dan "Showcase Karya".
  - Filter horizontal: *Semua*, *Mencari Anggota (Urgent)*, *Showcase Portofolio*, *Diskusi Jurusan*.
  - Kartu posting proyek terstruktur dengan badge role yang dicari dan chip skill.
  - Kartu evaluasi cepat **AI Match Score** (e.g. "88% Kompatibel dengan Profil Anda").

### 5. Buat Proyek & Rekrutmen Anggota Tim (`05_buat_proyek_rekrutmen.html`)
- **Tujuan:** Mempublikasikan kebutuhan kolaborator tim dengan detail terarah.
- **Elemen UX Kunci:**
  - Segmented control: *Cari Anggota Tim*, *Showcase Hasil Karya*, *Diskusi Akademik*.
  - Pemilihan kategori: Lomba/Hackathon, Tugas Akhir, Riset Dosen, Proyek Mandiri.
  - Form dinamis penambahan posisi/role yang dicari beserta tag teknologi dan batas kuota.
  - **AI Content Moderation Card:** Memberikan umpan balik langsung bahwa narasi posting memenuhi standar kode etik kampus sebelum diterbitkan.

### 6. Detail Proyek & Pengajuan Bergabung ke Tim (`06_detail_proyek_kolaborasi.html`)
- **Tujuan:** Menampilkan detail spesifikasi proyek dan formulir pelamaran tim.
- **Elemen UX Kunci:**
  - Ringkasan inisiator proyek dan badge status slot (e.g. "Sisa 2 Slot").
  - Breakdown slot anggota tim (posisi yang telah terisi vs posisi yang masih terbuka).
  - **Explainable AI Match Card (92%):** Merinci secara spesifik mengapa skill pelamar selaras dengan deskripsi proyek.
  - Form pengajuan kolaborasi instan: Pilih role target, tulis pesan kontribusi, dan centang portofolio unggulan untuk dilampirkan.

### 7. Galeri & Koleksi Portofolio Mahasiswa (`02_koleksi_portofolio.html`)
- **Tujuan:** Wadah penemuan karya-karya unggulan mahasiswa se-universitas.
- **Elemen UX Kunci:**
  - Search bar cerdas dengan filter kategori teknologi (Figma, React, Flutter, Python, IoT).
  - Banner proyek unggulan (*Featured University Project*).
  - Grid kartu portofolio visual dengan metrik apresiasi dan daftar kolaborator mahasiswa.

### 8. Tambah & Unggah Portofolio Baru (`07_tambah_portofolio.html`)
- **Tujuan:** Dokumentasi dan publikasi karya mahasiswa ke etalase publik kampus.
- **Elemen UX Kunci:**
  - Area drag-and-drop unggah mockup visual beresolusi tinggi.
  - Form peran individu dalam tim (*Role Contribution*) untuk transparansi portofolio.
  - Multi-input tautan bukti otentik karya: Repositori GitHub, Live Demo Web, Desain Figma, dan Paper/Laporan Riset PDF.

### 9. Detail Showcase Portofolio Mahasiswa (`08_detail_portofolio.html`)
- **Tujuan:** Presentasi komprehensif sebuah proyek (*case study showcase*).
- **Elemen UX Kunci (Contoh Proyek: EcoTrack IoT Smart Energy):**
  - Hero carousel mockup produk.
  - Metrik dampak nyata proyek (e.g. 18.4% Reduksi Daya, 14 Sensor Nodes).
  - Struktur studi kasus: Latar Belakang Masalah, Metodologi/Solusi Teknis, dan Hasil Uji Coba.
  - Badge verifikasi review dosen pembimbing.
  - Tech stack terkelompok (*Frontend*, *Backend*, *Hardware*).
  - Utas diskusi teknis akademik antar mahasiswa dan counter apresiasi/endorse skill.

### 10. Jelajah & Rekomendasi Mahasiswa AI (`04_jelajah_rekomendasi_ai.html`)
- **Tujuan:** *Talent discovery* untuk menemukan teman yang memiliki kemampuan saling melengkapi.
- **Elemen UX Kunci:**
  - Filter ketersediaan kolaborasi, jurusan, dan angkatan.
  - Kartu calon kolaborator dengan skor kemiripan semantik AI (e.g. 94% Match).
  - Rincian skill yang dimiliki vs skill komplementer yang dibutuhkan pengguna.
  - Tombol aksi langsung "Ajak Kolaborasi" atau "Lihat Portofolio".

### 11. Profil Mahasiswa & Skills (`03_profil_mahasiswa_skills.html`)
- **Tujuan:** Identitas digital mahasiswa dan manajemen portofolio pribadi.
- **Elemen UX Kunci:**
  - Header profil akademik lengkap (Nama, NIM, Program Studi, Angkatan, IPK opsional, Bio).
  - Statistik pencapaian: Total Portofolio, Kolaborasi Selesai, dan Apresiasi Rekan.
  - Tab navigasi internal: *Portofolio Saya*, *Riwayat Proyek Tim*, dan *Aktivitas Diskusi*.
  - Badge keahlian terverifikasi oleh proyek kampus.

### 12. Pusat Notifikasi & Ajakan Kolaborasi (`09_notifikasi_kolaborasi.html`)
- **Tujuan:** Pengelolaan komunikasi masuk seputar ajakan tim dan aktivitas portofolio.
- **Elemen UX Kunci:**
  - Tab pemisah: *Permintaan Tim Masuk (Inbox Kolaborasi)* dan *Semua Notifikasi*.
  - Kartu undangan masuk dengan opsi satu ketukan: "Terima Kolaborasi" (hijau) atau "Tinjau / Tolak" (outline).
  - Riwayat notifikasi akademik (apresiasi dosen, komentar mahasiswa, status kelolosan moderasi).

---

## 5. Cara Menjalankan & Menguji Prototipe Interaktif

Semua layar telah diintegrasikan ke dalam simulator mobile interaktif:
1. Buka berkas [ui/stitch/index.html](file:///d:/shenzen/campus-social-media-portofolio-team3/ui/stitch/index.html) atau [ui/index.html](file:///d:/shenzen/campus-social-media-portofolio-team3/ui/index.html) menggunakan browser Anda.
2. Pada panel navigasi kiri, klik salah satu dari 12 alur layar untuk langsung melihat tampilannya di dalam frame smartphone di panel kanan.
3. Anda dapat menekan tombol **"Buka Tab Penuh"** (`open_in_new`) untuk menguji interaksi responsif pada layar penuh, atau mengklik tombol **"HD PNG"** untuk mengunduh tangkapan layar desain beresolusi tinggi.
