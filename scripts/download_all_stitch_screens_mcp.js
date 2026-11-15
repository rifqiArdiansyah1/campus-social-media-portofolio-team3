const https = require("https");
const fs = require("fs");
const path = require("path");

const apiKey = process.env.STITCH_API_KEY || "";

function callMcpDownload(fileName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: "download_file",
        arguments: { name: fileName }
      }
    });

    const req = https.request("https://stitch.googleapis.com/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) return reject(new Error(JSON.stringify(parsed.error)));
          const contentText = parsed.result?.content?.[0]?.text;
          const payload = JSON.parse(contentText || "{}");
          resolve(payload);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const screenList = [
  // 00. Registrasi Mahasiswa
  {
    slug: "00_registrasi_mahasiswa",
    title: "Registrasi Akun Mahasiswa",
    htmlFile: "projects/10744711964413240245/files/b3c34ec11b8c4ce8b30f62c6a9166587",
    imgFile: "projects/10744711964413240245/files/8c9d49d656cc41d69e7ebb5cfa30d86c"
  },
  // 00b. Login Mahasiswa
  {
    slug: "00_login_mahasiswa",
    title: "Login Mahasiswa & SSO Kampus",
    htmlFile: "projects/10744711964413240245/files/a2757cc4e13d45ec9ebb8f45a6271c0a",
    imgFile: "projects/10744711964413240245/files/948ad658c17e40c4a1964d1e7911f243"
  },
  // 00c. Onboarding Setup Minat & Skills
  {
    slug: "00_onboarding_minat_skills",
    title: "Onboarding Setup Profil & Minat",
    htmlFile: "projects/10744711964413240245/files/f97ae3a474f847149c0c25dbf58c56ad",
    imgFile: "projects/10744711964413240245/files/c4c8a3c8eaa746f48a6078acff1cfd21"
  },
  // 01. Feed Proyek (sudah ada di Stitch)
  {
    slug: "01_feed_proyek",
    title: "Beranda & Feed Proyek",
    htmlFile: "projects/10744711964413240245/screens/6290df7c6a394fd6b8ac3e03e5411296/fileEntries/html",
    imgFile: "projects/10744711964413240245/screens/6290df7c6a394fd6b8ac3e03e5411296/fileEntries/screenshot"
  },
  // 02. Koleksi Portofolio
  {
    slug: "02_koleksi_portofolio",
    title: "Koleksi Portofolio Mahasiswa",
    htmlFile: "projects/10744711964413240245/screens/b7f1491f2df345eb9049393f36c4d92c/fileEntries/html",
    imgFile: "projects/10744711964413240245/screens/b7f1491f2df345eb9049393f36c4d92c/fileEntries/screenshot"
  },
  // 03. Profil Mahasiswa & Skills
  {
    slug: "03_profil_mahasiswa_skills",
    title: "Profil Mahasiswa & Skills",
    htmlFile: "projects/10744711964413240245/screens/c8ff4cb8186844c3beb115e66152b611/fileEntries/html",
    imgFile: "projects/10744711964413240245/screens/c8ff4cb8186844c3beb115e66152b611/fileEntries/screenshot"
  },
  // 04. Jelajah & Rekomendasi AI
  {
    slug: "04_jelajah_rekomendasi_ai",
    title: "Jelajah & Rekomendasi AI",
    htmlFile: "projects/10744711964413240245/screens/dae967c6aef143b99f1ba4e6d9b1e2b7/fileEntries/html",
    imgFile: "projects/10744711964413240245/screens/dae967c6aef143b99f1ba4e6d9b1e2b7/fileEntries/screenshot"
  },
  // 05. Buat Proyek & Rekrutmen
  {
    slug: "05_buat_proyek_rekrutmen",
    title: "Buat Proyek & Rekrutmen Tim",
    htmlFile: "projects/10744711964413240245/files/faaa43ce7f5340e8ad5978e6829ed733",
    imgFile: "projects/10744711964413240245/files/d42cda23d82349459b0b528aceb0142e"
  },
  // 06. Detail Proyek & Kolaborasi
  {
    slug: "06_detail_proyek_kolaborasi",
    title: "Detail Proyek & Pengajuan Bergabung",
    htmlFile: "projects/10744711964413240245/files/2a42317670814d7d9dba5a4867d78d61",
    imgFile: "projects/10744711964413240245/files/45556cefc13d4123ad72825168a11bff"
  },
  // 07. Tambah Portofolio
  {
    slug: "07_tambah_portofolio",
    title: "Tambah Portofolio Karya Mahasiswa",
    htmlFile: "projects/10744711964413240245/files/54abb9b2c3e6401d9154f8ed32d8d560",
    imgFile: "projects/10744711964413240245/files/99674ba229d4448bada3cb6d5930be84"
  },
  // 08. Detail Showcase Portofolio
  {
    slug: "08_detail_portofolio",
    title: "Detail Showcase Portofolio - EcoTrack IoT",
    htmlFile: "projects/10744711964413240245/files/d0e610e840ca4a7a85d3f8cc8ecf56a0",
    imgFile: "projects/10744711964413240245/files/68bfabf880d24ebb9edfb8e59fd4570f"
  },
  // 09. Notifikasi & Kolaborasi
  {
    slug: "09_notifikasi_kolaborasi",
    title: "Pusat Notifikasi & Permintaan Tim",
    htmlFile: "projects/10744711964413240245/files/4901310f409f40b6bc384bda168cabaa",
    imgFile: "projects/10744711964413240245/files/7e84e90f011c44d8bea90f34fcbdec84"
  }
];

async function main() {
  fs.mkdirSync("ui/stitch/html", { recursive: true });
  fs.mkdirSync("ui/stitch/screenshots", { recursive: true });

  console.log(`Starting download for ${screenList.length} screens using Stitch MCP download_file...`);

  for (const item of screenList) {
    console.log(`\n----------------------------------------`);
    console.log(`[${item.slug}] ${item.title}`);

    // Download HTML
    if (item.htmlFile) {
      try {
        console.log(`  Downloading HTML (${item.htmlFile})...`);
        const res = await callMcpDownload(item.htmlFile);
        if (res.html) {
          const outPath = path.join("ui/stitch/html", `${item.slug}.html`);
          fs.writeFileSync(outPath, res.html, "utf8");
          console.log(`  -> HTML saved: ${outPath} (${res.html.length} chars)`);
        } else {
          console.log(`  -> No html field in response:`, Object.keys(res));
        }
      } catch (err) {
        console.error(`  -> HTML download error:`, err.message);
      }
    }

    // Download Screenshot
    if (item.imgFile) {
      try {
        console.log(`  Downloading Screenshot (${item.imgFile})...`);
        const res = await callMcpDownload(item.imgFile);
        if (res.image) {
          const outPath = path.join("ui/stitch/screenshots", `${item.slug}.png`);
          const buf = Buffer.from(res.image, "base64");
          fs.writeFileSync(outPath, buf);
          console.log(`  -> Screenshot saved: ${outPath} (${buf.length} bytes)`);
        } else {
          console.log(`  -> No image field in response:`, Object.keys(res));
        }
      } catch (err) {
        console.error(`  -> Screenshot download error:`, err.message);
      }
    }

    // brief pause
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("\n========================================");
  console.log("All screen downloads finished successfully!");
  console.log("========================================");
}

main().catch(console.error);
