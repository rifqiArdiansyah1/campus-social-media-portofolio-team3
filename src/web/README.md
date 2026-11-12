# CampusFolio Web Client (M03)

Kerangka antarmuka klien web modern untuk **CampusFolio** berbasis **Next.js 14 App Router**, **Tailwind CSS**, sistem desain **Stitch "Academic Modernist"**, **Client-Side Auth Guard**, dan pustaka komponen modular aksesibel (WCAG AA).

---

## 🚀 Memulai (Quick Start)

### 1. Prasyarat
- Node.js $\ge$ 20.x
- Backend FastAPI running di `http://localhost:8000` (atau sesuaikan variabel `NEXT_PUBLIC_API_URL`)

### 2. Instalasi Dependensi
```bash
cd src/web
npm install
```

### 3. Generate OpenAPI Types
```bash
npm run generate:types
```
Perintah ini akan membaca kontrak `../../docs/openapi.json` dan menghasilkan definisi tipe TypeScript di `src/types/api.generated.ts`.

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses antarmuka web di [http://localhost:3000](http://localhost:3000).

---

## 🎨 Token Desain Stitch & Aksesibilitas WCAG AA

Sistem warna mengacu pada tema *Stitch "Academic Modernist"* dengan penyesuaian kontras tinggi untuk teks:

| Kategori Token | Nama Token | Nilai Hex | Penggunaan & Kontras |
| :--- | :--- | :--- | :--- |
| **Primary** | `primary` | `#2a14b4` | Warna identitas utama, tombol primer, logo |
| **Primary Container** | `primary-container` | `#4338ca` | Aksen gradien banner dan fokus |
| **Secondary** | `secondary` | `#006a61` | Aksen teal untuk badge dan sorotan |
| **Surface** | `surface` | `#faf8ff` | Latar belakang kanvas aplikasi |
| **Border Subtle** | `border-subtle` | `#E2E8F0` | Batas kartu dan pembatas konten |
| **Emerald Text (AA)** | `accent-emerald-accessible` | `#047857` | Teks status terverifikasi / sukses ($\ge 4.5:1$) |
| **Coral Text (AA)** | `accent-coral-accessible` | `#BE123C` | Teks sorotan recruiting / love ($\ge 4.5:1$) |
| **Danger Text (AA)** | `accent-danger-accessible` | `#B91C1C` | Teks error / takedown / hapus ($\ge 4.5:1$) |
| **Amber Text (AA)** | `accent-amber-accessible` | `#B45309` | Teks status menunggu review ($\ge 4.5:1$) |

### Tipografi
- **Headings & Body:** Font Google `Plus Jakarta Sans` diimpor via `next/font/google` (`--font-plus-jakarta`).
- **Labels & Numbers:** Font Google `Inter` (`--font-inter`).

---

## 🔐 Arsitektur Keamanan & Auth Guard

1. **Client-Side Guard Murni (`ProtectedRoute`):**
   - Token JWT disimpan di `localStorage` klien.
   - Tidak menggunakan mirroring ke cookie biasa tanpa perlindungan `httpOnly` untuk meminimalkan paparan token terhadap eksploitasi script pihak ketiga.
   - Komponen `ProtectedRoute` menyertakan status `isLoading` anti-flicker: jika status sesi masih diverifikasi (`GET /auth/me`), skeleton shimmer ditampilkan tanpa redirect prematur.
2. **Pembersihan Cache Otomatis (`queryClient.clear()`):**
   - Saat pengguna logout atau saat `apiClient` mendeteksi respons `401 Unauthorized`, seluruh cache TanStack Query langsung dibersihkan (`queryClient.clear()`) demi mencegah kebocoran data pengguna sebelumnya pada komputer laboratorium kampus yang dipakai bersama.
3. **Role-Based UX Guard (`RoleGate`):**
   - Menyaring elemen antarmuka khusus (misalnya Kaprodi/Moderator atau Admin). Penegakan otorisasi sebenarnya tetap berada di level backend FastAPI.

---

## 🧩 Katalog 9 Komponen Dasar Modular

1. **`AppShell`** (`src/components/layout/AppShell.tsx`):
   - Desktop ($\ge 1024$px / `lg`): Sidebar tetap di kiri dengan profil pengguna dan tombol keluar.
   - Mobile & Tablet ($< 1024$px): Topbar ramping + Bottom Navigation 4 slot (`Beranda`, `Jelajah`, `Portofolio`, `Lainnya`). Tombol "Lainnya" memunculkan sheet drawer untuk menu moderasi bagi Kaprodi/Admin.
2. **`PostCard`** (`src/components/features/PostCard.tsx`):
   - View-model driven (`PostViewModel`) menerima izin granular dari API (`can_takedown`, `can_report`, `can_delete`).
3. **`FriendRequestWidget`** (`src/components/features/FriendRequestWidget.tsx`):
   - Widget sidebar interaktif dengan tombol instan Terima / Tolak koneksi.
4. **`PortfolioStatusBadge`** (`src/components/common/PortfolioStatusBadge.tsx`):
   - Mendukung 4 varian status lengkap sesuai enum database: `draft` (Abu-abu), `menunggu_review` (Kuning/Amber), `terverifikasi` (Hijau/Emerald SKPI), dan `ditolak` (Merah/Danger).
5. **`ConfirmDialog`** (`src/components/common/ConfirmDialog.tsx`):
   - Modal konfirmasi berbasis `@headlessui/react` dengan focus trap dan transisi halus.
6. **`ModerationReviewModal`** (`src/components/common/ModerationReviewModal.tsx`):
   - Dialog keputusan moderasi dinamis yang mewajibkan pengisian catatan tinjauan ketika memilih tindakan penolakan/takedown.
7. **`EmptyState`** (`src/components/common/EmptyState.tsx`):
   - Placeholder bersih saat linimasa, antrean, atau hasil pencarian kosong.
8. **`Skeleton`** (`src/components/common/Skeleton.tsx`):
   - Loading placeholder shimmer untuk kartu (`SkeletonCard`), avatar, dan baris teks.
9. **`Toast` & `ToastContainer`** (`src/components/common/Toast.tsx`):
   - Notifikasi mengambang dengan atribut aksesibilitas `role="status"` dan `aria-live="polite"`.

---

## 🧪 Pengujian & Showcase Visual

### Menjalankan Unit Test (Vitest)
```bash
npm run test
```
Menguji:
- `RoleGate.test.tsx`: Validasi rendering kondisional berdasarkan role (mahasiswa vs moderator/admin).
- `ProtectedRoute.test.tsx`: Validasi loading anti-flicker dan redirect `/login?next=...`.
- `PortfolioStatusBadge.test.tsx`: Validasi ke-4 varian status portofolio SKPI.

### Menjalankan Linting
```bash
npm run lint
```

### Menjalankan Production Build
```bash
npm run build
```

### Halaman Galeri Komponen
Kunjungi rute **/demo** di browser untuk melihat dan menguji interaksi ke-9 komponen dasar secara langsung di resolusi layar mobile (390px) maupun desktop (1280px).
