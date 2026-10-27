# Spesifikasi Desain UI/UX (Google Stitch) — CampusFolio

Dokumen ini mencatat seluruh aset desain, tautan screen, design token, dan pemetaan User Story dari integrasi **Google Stitch Project** untuk CampusFolio (Team 3), yang telah dimutakhirkan berdasarkan revisi fitur klien.

---

## 1. Identitas Proyek Stitch

| Properti | Nilai |
| :--- | :--- |
| **Project Title** | Campus Portfolio Social App |
| **Project ID** | `10744711964413240245` |
| **Design Style** | *Academic Modernist* (Minimalis, modern, kolaboratif akademis) |
| **Viewport Utama** | Mobile Tab Frame (390 x 844 pt / 780 x 1688 px asset render) & Responsif Web Next.js |

---

## 2. Design Tokens & Color Palette

Sistem warna dan tipografi telah diintegrasikan langsung ke dalam `src/web/tailwind.config.ts`:

### A. Palet Warna (Color System)
- **Primary (Identity)**: `#2A14B4` (Main Brand Deep Indigo) & `#4338CA` (Container Indigo)
- **Secondary (Teal)**: `#006A61` & `#86F2E4` (Container Teal)
- **AI Match Accent (Emerald)**: `#10B981` (Menandai persentase kecocokan rekomendasi TF-IDF & badge terverifikasi)
- **Recruitment Alert (Coral)**: `#F43F5E` (Menandai status urgensi pencarian anggota tim)
- **Moderation Warning / Takedown**: `#DC2626` / `#FEE2E2` (Aksen laporan & hapus postingan)
- **Canvas / Background**: `#FAF8FF` (Surface Tinted Canvas), `#F8FAFC` (Card Background)
- **Card / Elevation**: `#FFFFFF` (Solid White Surface)
- **Border Subtle**: `#E2E8F0`

### B. Tipografi
- **Headings & Display**: `Plus Jakarta Sans` (Font weight: 600, 700, 800)
- **Body & Content**: `Plus Jakarta Sans` (Font weight: 400, 500)
- **Labels, Badges, & Metadata**: `Inter` (Font weight: 500, 600)

---

## 3. Katalog Screen & Pemetaan Fitur Baru (Revisi Klien)

Semua aset screenshot resolusi tinggi dan source code HTML/CSS tersimpan di `ui/stitch/`.

### Screen 1: Beranda & Home Dashboard Terpadu (US-04, US-10, US-11, US-13, US-17, US-18)
- **File Screenshot**: `ui/stitch/screenshots/01_feed_proyek.png`
- **File Code**: `ui/stitch/html/01_feed_proyek.html`
- **Pembaruan Fitur Terintegrasi**:
  1. **All-in-One Home Hub:** Menyatukan seluruh aktivitas kampus ke satu linimasa (feed postingan, filter teman, rekrutmen tim, dan notifikasi).
  2. **Fokus Postingan Foto + Teks:** Form postingan cepat mendukung pengunggahan foto/gambar hasil karya atau dokumentasi lomba + teks penjelasan terstruktur.
  3. **Widget Pertemanan (Friend Requests):** Menampilkan permohonan pertemanan baru dengan tombol instan *Terima* / *Tolak*.
  4. **Pelaporan & Hapus Postingan:**
     - Tombol *Laporkan Postingan* (icon flag) bagi mahasiswa untuk menandai konten pelanggar norma.
     - Tombol *Hapus / Takedown Postingan* khusus untuk role **Moderator (Kaprodi)** dan **Admin** dengan input alasan pelanggaran dan audit trail.
  5. **Alert Antrean Review Kaprodi/Admin:** Menampilkan banner pengingat jika ada postingan atau upload SKPI yang menunggu verifikasi di prodi terkait.

---

### Screen 2: Koleksi Portofolio, SKPI, & Artikel Ilmiah (US-03, US-15, US-16)
- **File Screenshot**: `ui/stitch/screenshots/02_koleksi_portofolio.png`
- **File Code**: `ui/stitch/html/02_koleksi_portofolio.html`
- **Pembaruan Fitur Terintegrasi**:
  1. **Kategori Capaian Formal:** Tab filter membedakan antara:
     - *Proyek Aplikasi / Desain*
     - *Capaian SKPI (Surat Keterangan Pendamping Ijazah)*
     - *Sertifikat Pelatihan & Sertifikasi Kompetensi*
     - *Artikel Ilmiah (Publikasi Jurnal / Konferensi)*
  2. **Kelengkapan Dokumen Bukti:** Menampilkan nomor sertifikat/DOI artikel, institusi penerbit, dan tautan berkas dokumen bukti PDF.
  3. **Status Verifikasi Kaprodi:**
     - Badge hijau `Terverifikasi`: Sudah divalidasi oleh Kaprodi dan siap diakui sebagai poin SKPI resmi.
     - Badge kuning `Menunggu Review`: Berkas sedang dalam antrean tinjauan Kaprodi.
     - Badge merah `Perlu Revisi`: Memerlukan perbaikan berkas sesuai catatan validator.
  4. **Tombol Tinjauan Portofolio:** Tampilan khusus bagi Kaprodi untuk memeriksa berkas dan melakukan persetujuan (Approve) atau penolakan dengan catatan perbaikan.

---

### Screen 3: Profil Mahasiswa, Pertemanan, & Blokir Pengguna (US-02, US-06, US-13, US-14)
- **File Screenshot**: `ui/stitch/screenshots/03_profil_mahasiswa_skills.png`
- **File Code**: `ui/stitch/html/03_profil_mahasiswa_skills.html`
- **Pembaruan Fitur Terintegrasi**:
  1. **Tombol Tambah Pertemanan (Friendship Action):**
     - Status: `Tambah Teman`, `Permintaan Terkirim`, atau `Berteman`.
  2. **Fitur Blokir Profil (Block User):**
     - Opsi menu titik tiga di pojok profil untuk memblokir akun yang mengganggu demi kenyamanan privasi.
     - Pengguna yang diblokir otomatis disembunyikan dari linimasa dan tidak dapat mengirim pesan/friend request.
  3. **Tab Rekapitulasi SKPI & Artikel Ilmiah:** Menampilkan daftar publikasi ilmiah dan sertifikat yang telah divalidasi prodi.

---

### Screen 4: Jelajah & Rekomendasi Kolaborator AI (US-05, US-07, US-08)
- **File Screenshot**: `ui/stitch/screenshots/04_jelajah_rekomendasi_ai.png`
- **File Code**: `ui/stitch/html/04_jelajah_rekomendasi_ai.html`
- **Pembaruan Fitur Terintegrasi**:
  1. **Kecocokan Berbasis TF-IDF:** Mencocokkan kebutuhan proyek pada postingan dengan keahlian mahasiswa di basis data profil.
  2. **Persentase Match & Alasan Transparan:** e.g. `92% Match - Skill Flutter & Figma sesuai dengan kebutuhan proyek Lomba Gemastik`.
  3. **Aksi Kolaborasi:** Tombol cepat kirim permintaan pertemanan dan ajakan kolaborasi tim.

---

## 4. Panduan Eksekusi Implementasi (Frontend Web & Mobile)

1. **Web App (Next.js 14 App Router)**:
   - Slicing komponen modular di `src/web/src/components/` (Home Dashboard, Post Card, Friend Request Widget, Portfolio SKPI List, Moderation Review Modal).
   - Akses kontrol dinamis (Conditional rendering untuk menu tinjauan Kaprodi & tombol hapus).
2. **Mobile App (Expo React Native)**:
   - Layout responsif dengan dukungan Material Icons (`@expo/vector-icons`).
   - Feed berkinerja tinggi menggunakan `FlatList` dengan caching gambar foto postingan.
