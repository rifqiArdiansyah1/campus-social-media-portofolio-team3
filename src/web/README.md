# CampusFolio Web App (Next.js + TailwindCSS)

Aplikasi web portofolio dan feed sosial media mahasiswa untuk platform **CampusFolio** (Team 3), dibangun menggunakan **Next.js (App Router)** dan **TailwindCSS**.

---

## 🚀 Panduan Menjalankan Web App (Lokal)

1. **Masuk ke direktori web:**
   ```bash
   cd src/web
   ```

2. **Install dependensi (npm):**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```

4. **Akses di browser:**
   - Buka [http://localhost:3000](http://localhost:3000)
   - Tampilan responsif untuk desktop maupun smartphone.

---

## 🌐 Koneksi ke Backend FastAPI
Secara default, aplikasi mengarah ke `http://localhost:8000/api/v1`.
Untuk mengubah target API, buat berkas `.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

---

## 🚢 Deploy ke Vercel (Produksi / Demo Online)
Aplikasi ini 100% kompatibel dengan **Vercel**:
1. Push branch ke GitHub.
2. Buka [vercel.com](https://vercel.com) dan impor repositori ini.
3. Tentukan Root Directory: `src/web`.
4. Klik **Deploy**. Tautan web langsung aktif untuk dibagikan ke responden wawancara dan dosen!
