const https = require("https");
const fs = require("fs");

function callMcp(method, params = {}, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: method, arguments: params }
    });

    const req = https.request("https://stitch.googleapis.com/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.STITCH_API_KEY || "",
        "Content-Length": Buffer.byteLength(data)
      },
      timeout: timeoutMs
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Request timeout"));
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function generateWithRetry(item, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Attempt ${attempt}/${maxRetries}] Generating ${item.title} (${item.key})...`);
    try {
      const res = await callMcp("generate_screen_from_text", {
        projectId: "10744711964413240245",
        deviceType: "MOBILE",
        prompt: item.prompt
      });
      if (res.error) {
        throw new Error(JSON.stringify(res.error));
      }
      console.log(`[SUCCESS] ${item.key} generated!`);
      const filename = `scripts/result_${item.key}.json`;
      fs.writeFileSync(filename, JSON.stringify({ item, res }, null, 2));
      return { item, res };
    } catch (err) {
      console.error(`[FAIL attempt ${attempt}] Error:`, err.message);
      if (attempt < maxRetries) {
        console.log("Waiting 5 seconds before retry...");
        await new Promise(r => setTimeout(r, 5000));
      } else {
        throw err;
      }
    }
  }
}

const items = [
  {
    key: "tambah_portofolio",
    title: "Tambah Portofolio Karya Mahasiswa",
    prompt: `Halaman Tambah & Unggah Portofolio Proyek Mahasiswa untuk aplikasi CampusFolio.
Desain antarmuka mobile modern bertema Academic Modernist, bersih dan profesional tanpa emoji kasual, menggunakan ikon Material Symbols Outlined.
Elemen halaman:
- Header dengan tombol Batal dan tombol Simpan Portofolio
- Area Unggah Mockup & Cover Karya: box upload visual dengan ikon add_photo_alternate dan indikator format gambar
- Form input terstruktur:
  * Judul Karya / Proyek (e.g. Sistem Rekomendasi Beasiswa Berbasis Fuzzy Logic)
  * Kategori Portofolio (Dropdown: UI/UX, Web App, Mobile App, AI/ML, IoT, Riset Akademik)
  * Deskripsi Ringkas Proyek (Latar belakang, problem, solusi)
  * Peran Pribadi & Kontribusi dalam Tim (e.g. Lead Backend Developer)
  * Tag Keahlian & Teknologi (Node.js, PostgreSQL, Docker)
  * Tautan Eksternal Bukti Karya:
    - Input GitHub Repository (ikon code)
    - Input Live Demo Web (ikon open_in_new)
    - Input Figma Prototype (ikon brush)
    - Input Dokumen Riset / Paper PDF (ikon article)
  * Waktu Pengerjaan (Bulan & Tahun)
- Checkbox: Publikasikan di Galeri Portofolio Kampus
- Tombol CTA: Publikasikan ke Portofolio Saya.`
  },
  {
    key: "detail_portofolio",
    title: "Detail Showcase Portofolio Mahasiswa",
    prompt: `Halaman Detail Showcase Portofolio Mahasiswa untuk aplikasi CampusFolio.
Desain mobile app elegan bertema Academic Modernist tanpa emoji kasual, menggunakan ikon Material Symbols Outlined.
Elemen halaman:
- Header dengan tombol kembali, bookmark, dan share link
- Hero Visual Carousel: Mockup proyek resolusi tinggi dengan pagination dots
- Judul Karya: EcoTrack - Smart Energy Monitoring System
- Kategori Badge: Web Application & IoT Campus
- Profil Pemilik Portofolio: Foto profil, Rafi Alamsyah (Teknik Elektro 22), badge terverifikasi, tombol Lihat Profil
- Deskripsi & Studi Kasus: Latar belakang masalah, metodologi, dan hasil pencapaian efisiensi energi
- Tech Stack Chips: React, Next.js, Go, MQTT, InfluxDB, Tailwind CSS
- Tautan Bukti Karya Interaktif:
  * Tombol Buka Repositori GitHub (ikon code)
  * Tombol Kunjungi Live Demo (ikon public)
  * Tombol Baca Paper / Laporan PDF (ikon article)
- Kolaborator Proyek: Daftar rekan satu tim dengan avatar dan perannya
- Apresiasi & Komentar Akademik:
  * Tombol Apresiasi / Endorse Skill (ikon thumb_up) dengan counter
  * Kolom diskusi teknis antar mahasiswa.`
  },
  {
    key: "notifikasi_kolaborasi",
    title: "Pusat Notifikasi & Permintaan Tim",
    prompt: `Halaman Pusat Notifikasi & Kelola Permintaan Kolaborasi untuk aplikasi CampusFolio.
Desain mobile modern bertema Academic Modernist tanpa emoji kasual, menggunakan ikon Material Symbols Outlined.
Elemen halaman:
- Header: Judul Notifikasi & Kolaborasi, tombol Tandai Semua Dibaca (ikon done_all)
- Segmented Navigation Tabs:
  * Tab 1: Permintaan Tim (3 Baru) dengan badge aktif
  * Tab 2: Semua Notifikasi
- Daftar Permintaan Masuk (Pending Invitations & Join Requests):
  * Card 1: Farhan Hakim mengajukan diri untuk role Frontend Dev di proyek IoT Waste Management. Menampilkan AI Match (94%), portofolio terlampir, tombol aksi Terima (hijau) dan Tolak / Diskusi (outline).
  * Card 2: Undangan Bergabung dari Tim Gemastik 2026 menawarkan role Lead UI Designer. Tombol Tinjau dan Terima Undangan.
- Daftar Riwayat Notifikasi Aktivitas:
  * Apresiasi portofolio dari Dosen Pembimbing (ikon star)
  * Komentar baru pada postingan proyek (ikon chat_bubble)
  * Status moderasi konten kampus terverifikasi (ikon verified_user)
- Bottom Navigation Bar terpasang konsisten.`
  }
];

async function main() {
  for (const it of items) {
    try {
      await generateWithRetry(it);
      console.log("Waiting 3s before next item...");
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.error(`Failed completely for ${it.key}:`, e);
    }
  }
  console.log("Batch 3 completed!");
}

main();
