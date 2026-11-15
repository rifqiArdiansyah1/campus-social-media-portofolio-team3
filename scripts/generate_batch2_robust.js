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
    key: "buat_postingan_proyek",
    title: "Buat Proyek & Rekrutmen Tim",
    prompt: `Halaman Buat Proyek & Rekrutmen Anggota Tim untuk aplikasi CampusFolio.
Desain antarmuka mobile modern bergaya Academic Modernist tanpa emoji kasual, menggunakan ikon Material Symbols Outlined.
Elemen halaman:
- Header dengan tombol Batal dan tombol utama Publikasikan Post
- Tab segmented: Cari Anggota Tim (Open Recruitment), Showcase Karya, Diskusi Kampus
- Form input terstruktur:
  * Judul Proyek / Lomba (e.g. IoT Waste Management System Gemastik 2026)
  * Kategori (Lomba/Hackathon, Tugas Akhir, Riset Dosen, Proyek Mandiri)
  * Deskripsi Proyek & Sasaran (textarea)
  * Kebutuhan Anggota Tim (Role: 1 Frontend Dev, 1 UI/UX Designer, dengan skill tags dan deadline pendaftaran)
  * Durasi Pengerjaan Proyek (e.g. 2 Bulan)
  * Tautan Pitch Deck / Dokumen Konsep
- Status AI Content Moderation:
  * Kartu Lolos Moderasi Otomatis AI (konten aman sesuai kode etik kampus) berikon check_circle hijau emerald (#10B981)
- Tombol CTA: Publikasikan Lowongan Tim.`
  },
  {
    key: "detail_postingan_kolaborasi",
    title: "Detail Proyek & Pengajuan Bergabung",
    prompt: `Halaman Detail Postingan Proyek & Pengajuan Kolaborasi Tim Mahasiswa untuk aplikasi CampusFolio.
Desain mobile app modern bergaya Academic Modernist tanpa emoji kasual, menggunakan ikon Material Symbols Outlined.
Elemen halaman:
- Header dengan tombol kembali, bookmark, dan laporkan post (ikon flag)
- Info Inisiator Proyek: Nadia Pramudita (Informatika 23), status Open Recruitment (Sisa 2 Slot) warna recruiting-coral (#F43F5E)
- Konten Proyek: Judul proyek Gemastik, deskripsi lengkap, diagram arsitektur
- Daftar Kebutuhan Role:
  * UI/UX Designer (Terisi - Arya)
  * Mobile Flutter Developer (Terbuka - 1 Orang Dibutuhkan) beserta skill tags
  * Backend / IoT Engineer (Terbuka - 1 Orang Dibutuhkan)
- Kartu Rekomendasi Kecocokan AI (AI Match: 92% Sangat Cocok dengan skill Flutter pengguna)
- Form/Card Pengajuan Bergabung:
  * Dropdown pilih role yang dilamar
  * Pesan singkat ke tim
  * Checkbox lampirkan portofolio relevan
  * Tombol CTA: Kirim Permintaan Bergabung.`
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
  console.log("Batch completed!");
}

main();
