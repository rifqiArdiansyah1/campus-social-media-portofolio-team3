# Spesifikasi Desain UI/UX (Google Stitch) — CampusFolio

Dokumen ini mencatat seluruh aset desain, tautan screen, design token, dan pemetaan User Story dari integrasi **Google Stitch Project** untuk CampusFolio (Team 3).

---

## 1. Identitas Proyek Stitch

| Properti | Nilai |
| :--- | :--- |
| **Project Title** | Campus Portfolio Social App |
| **Project ID** | `10744711964413240245` |
| **Design Style** | *Academic Modernist* (Minimalis, modern, kolaboratif akademis) |
| **Viewport Utama** | Mobile Tab Frame (390 x 844 pt / 780 x 1688 px asset render) & Responsif Web |

---

## 2. Design Tokens & Color Palette

Sistem warna dan tipografi telah diintegrasikan langsung ke dalam `src/web/tailwind.config.ts`:

### A. Palet Warna (Color System)
- **Primary (Identity)**: `#2A14B4` (Main Brand Deep Indigo) & `#4338CA` (Container Indigo)
- **Secondary (Teal)**: `#006A61` & `#86F2E4` (Container Teal)
- **AI Match Accent (Emerald)**: `#10B981` (Menandai persentase kecocokan rekomendasi TF-IDF)
- **Recruitment Alert (Coral)**: `#F43F5E` (Menandai status urgensi pencarian anggota tim)
- **Canvas / Background**: `#FAF8FF` (Surface Tinted Canvas), `#F8FAFC` (Card Background)
- **Card / Elevation**: `#FFFFFF` (Solid White Surface)
- **Border Subtle**: `#E2E8F0`
- **Text / Typography**:
  - Primary text (`on-surface`): `#131B2E`
  - Secondary / Muted (`on-surface-variant`): `#464554`

### B. Tipografi
- **Headings & Display**: `Plus Jakarta Sans` (Font weight: 600, 700, 800)
- **Body & Content**: `Plus Jakarta Sans` (Font weight: 400, 500)
- **Labels, Badges, & Metadata**: `Inter` (Font weight: 500, 600)

---

## 3. Katalog Screen & Pemetaan User Story

Semua aset screenshot resolusi tinggi dan source code HTML/CSS telah diunduh ke repository lokal pada folder `ui/stitch/`.

### Screen 1: Beranda & Feed Proyek
- **Screen ID**: `6290df7c6a394fd6b8ac3e03e5411296`
- **File Screenshot**: `ui/stitch/screenshots/01_feed_proyek.png`
- **File Code**: `ui/stitch/html/01_feed_proyek.html`
- **Fitur Utama**:
  - Header dengan logo CampusFolio, search bar, notifikasi lonceng dengan dot counter, dan foto profil pengguna.
  - Quick post launcher ("Bagikan progres proyek atau cari anggota tim...").
  - Filter chips interaktif: *Semua*, *Mencari Anggota (Urgent)*, *Showcase Portofolio*, *Diskusi Jurusan*.
  - Post Card kolaborasi: Info mahasiswa, badge `Open Recruitment`, deskripsi proyek, required skills pills (`Figma`, `Flutter`, `REST API`), dan **AI Match Card** (`AI Match: 88% Kompatibel!`).
  - Action buttons: Like, Comment, Bookmark, Share.
- **Relasi Backlog**: **US-04** (Feed Proyek), **US-05** (AI Match Indicator), **US-09** (Flagging / Moderasi).

---

### Screen 2: Koleksi Portofolio Mahasiswa
- **Screen ID**: `b7f1491f2df345eb9049393f36c4d92c`
- **File Screenshot**: `ui/stitch/screenshots/02_koleksi_portofolio.png`
- **File Code**: `ui/stitch/html/02_koleksi_portofolio.html`
- **Fitur Utama**:
  - Segmented tab controller (*Portofolio Saya* vs *Eksplorasi Kampus*).
  - Quick Stats Card: Proyek Aktif (4), Kolaborasi (12), Total Apresiasi/Likes (186).
  - Primary CTA Button: `+ Tambah Karya / Portofolio Baru`.
  - Grid Card Portofolio: Thumbnail visual cover, judul proyek, role kontribusi, tech stack badges, tautan GitHub/Demo, serta metrics view & likes.
- **Relasi Backlog**: **US-03** (Manajemen Portofolio Karya), **US-07** (Bookmark & Koleksi).

---

### Screen 3: Profil Mahasiswa & Skills
- **Screen ID**: `c8ff4cb8186844c3beb115e66152b611`
- **File Screenshot**: `ui/stitch/screenshots/03_profil_mahasiswa_skills.png`
- **File Code**: `ui/stitch/html/03_profil_mahasiswa_skills.html`
- **Fitur Utama**:
  - Hero Header: Foto profil avatar, status badge ketersediaan (`Tersedia untuk Kolaborasi`), nama, NIM/Jurusan/Angkatan, bio singkat, tautan LinkedIn & GitHub.
  - Statistik Profil: Total portofolio, total tim diikuti, rekomendasi diterima.
  - Seksi Skill & Keahlian: Pill tags dengan level keahlian (contoh: Python, FastAPI, React, UI/UX, PostgreSQL).
  - Riwayat Kolaborasi Proyek & Tab Verifikasi Prestasi/Sertifikat.
- **Relasi Backlog**: **US-01** (Autentikasi & Akun), **US-02** (Profil Mahasiswa), **US-06** (Skill Tagging).

---

### Screen 4: Jelajah & Rekomendasi AI
- **Screen ID**: `dae967c6aef143b99f1ba4e6d9b1e2b7`
- **File Screenshot**: `ui/stitch/screenshots/04_jelajah_rekomendasi_ai.png`
- **File Code**: `ui/stitch/html/04_jelajah_rekomendasi_ai.html`
- **Fitur Utama**:
  - AI Recommender Banner ("Ditenagai TF-IDF & Cosine Similarity Matcher").
  - Search & filter berdasarkan topik lomba, jurusan, dan kebutuhan keahlian.
  - Ranked Recommendations List: Kartu kandidat/proyek dengan skor kesesuaian persentase (e.g. `94% Match`, `88% Match`) dan highlight kata kunci skill yang beririsan.
  - One-click CTA: "Ajak Kolaborasi" dan "Kirim Pesan".
- **Relasi Backlog**: **US-05** (Sistem Rekomendasi AI Kolaborator), **US-08** (Pencarian & Filter Proyek).

---

### Screen 5: PRD & Paket Pertemuan 1 (Documentation Reference)
- **Screen ID**: `1082489741570845153`
- **File Code**: `ui/stitch/html/00_prd_pertemuan_1.md`
- **Deskripsi**: File acuan spesifikasi PRD & backlog yang tersimpan pada Stitch workspace.

---

## 4. Panduan Eksekusi Implementasi (Frontend Web & Mobile)

1. **Web App (Next.js 14)**:
   - Komponen UI modular dibuat di `src/web/src/components/` mengambil referensi markup dari `ui/stitch/html/`.
   - Tailwind tokens sudah tersedia (`bg-primary`, `bg-primary-container`, `text-match-emerald`, dll).
2. **Mobile App (Expo React Native)**:
   - Menggunakan warna hex dan rasio padding/typography yang sama agar UI seragam di Android & iOS.
   - Menggunakan `@expo/vector-icons` (MaterialIcons / Ionicons) yang berpasangan 1:1 dengan Material Symbols di Stitch.
