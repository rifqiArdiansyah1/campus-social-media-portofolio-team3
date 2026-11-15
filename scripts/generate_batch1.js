const https = require("https");
const fs = require("fs");
const path = require("path");

function callMcp(method, params = {}) {
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
      }
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
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const screensToGenerate = [
  {
    key: "login_mahasiswa",
    title: "Login Mahasiswa & SSO Kampus",
    prompt: `Halaman Login Akun Mahasiswa untuk aplikasi CampusFolio.
Desain antarmuka mobile modern bertema Academic Modernist yang profesional, bersih, dan elegan.
Hindari emoji/emote kasual atau tidak relevan, gunakan ikon Material Symbols Outlined.
Elemen halaman:
- Header dengan logo CampusFolio dan info versi kampus terverifikasi
- Judul: "Masuk ke CampusFolio", Subjudul: "Akses portofolio karyamu dan terhubung dengan rekan proyek se-kampus"
- Tombol Utama SSO Kampus: "Masuk dengan SSO / SIAKAD Kampus" dengan ikon key dan badge aman
- Divider elegan: "atau masuk dengan kredensial akun"
- Form input:
  * NIM / Email Mahasiswa Kampus (e.g. mahasiswa@students.ac.id) dengan ikon mail
  * Kata Sandi dengan ikon lock dan tombol toggle visibilitas kata sandi
- Baris opsi: Checkbox "Ingat Saya di Perangkat Ini" dan link "Lupa Kata Sandi?"
- Tombol CTA Primer: "Masuk ke Akun" (warna Indigo #4338ca)
- Bagian bawah: "Belum memiliki akun mahasiswa? Daftar Sekarang" yang mengarah ke registrasi
- Banner jaminan keamanan data akademik berstandar kampus di bagian footer (ikon shield).`
  },
  {
    key: "onboarding_minat_skills",
    title: "Onboarding Setup Profil & Keahlian",
    prompt: `Halaman Onboarding Setup Profil, Minat, dan Keahlian Mahasiswa untuk aplikasi CampusFolio (langkah setelah registrasi akun baru).
Desain mobile modern bertema Academic Modernist tanpa emoji kasual, menggunakan ikon Material Symbols Outlined.
Elemen halaman:
- Progress bar langkah (Langkah 2 dari 3: Personalisasi Profil & Minat)
- Judul: "Atur Keahlian & Minat Proyek", Subjudul: "Bantu algoritma AI merekomendasikan rekan tim dan proyek lomba yang sesuai dengan kompetensimu"
- Foto Profil / Avatar: area upload foto formal/semi-formal kampus dengan badge ikon photo_camera
- Bio Singkat Akademik (textarea: maks 150 karakter)
- Pilihan Role & Minat Utama (chip selector dengan ikon rapi):
  * UI/UX Design, Frontend Development, Mobile Flutter, Backend API, Machine Learning / AI, Data Science, IoT & Embedded Systems, Product Management
- Input Tag Keahlian Spesifik (chips yang bisa ditambahkan: Figma, React, Python, TensorFlow, Tailwind CSS, PostgreSQL)
- Preferensi Kolaborasi (radio/card selection):
  * "Aktif Mencari Tim (Lomba / PKM)"
  * "Terbuka untuk Kolaborasi Proyek"
  * "Fokus Belajar & Showcase Portofolio"
- Tombol navigasi: "Lewati Sementara" dan tombol primer "Simpan & Lanjutkan ke Beranda" (ikon arrow_forward).`
  }
];

async function run() {
  const results = [];
  for (const item of screensToGenerate) {
    console.log(`\n========================================`);
    console.log(`Generating: ${item.title} (${item.key})...`);
    console.log(`========================================`);
    try {
      const res = await callMcp("generate_screen_from_text", {
        projectId: "10744711964413240245",
        deviceType: "MOBILE",
        prompt: item.prompt
      });
      console.log(`Finished ${item.key}!`);
      results.push({ item, res });
      fs.writeFileSync("scripts/batch1_results.json", JSON.stringify(results, null, 2));
    } catch (err) {
      console.error(`Error generating ${item.key}:`, err);
    }
  }
  console.log("\nAll batch 1 generation completed!");
}

run();
