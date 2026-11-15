const fs = require("fs");
const path = require("path");
const https = require("https");

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

async function collectAllScreens() {
  const screens = [];

  // 1. Initial screens
  screens.push({
    slug: "01_feed_proyek",
    title: "Beranda & Feed Proyek",
    screenshot_url: "https://lh3.googleusercontent.com/aida/AEtjO1VOGqRqotfl8bVhw6h4KeUuxWlYuPNVhdshIwiVg51Wh6qS26g7OCwM_YNHDiqNjcZlW0XlQCsO5vfqdDT5TlivsEy2_bldyM_2TNJBgVyTtpI2bs4yDDtKCrOZmUXe9240RCmAl-YmVbMr5RUxJzq2X5LB6hP1IuxWw7K5gOGMJt5xsmh5V7WiGepDXhHV-7gVYnG3Kn-4580ZAV81Ye5qdREy-YeeYFqpdabf5e1NYn3ipg6fBNnZjarS",
    html_url: "https://stitch.googleapis.com/v1/projects/10744711964413240245/files/6290df7c6a394fd6b8ac3e03e5411296:download"
  });
  screens.push({
    slug: "02_koleksi_portofolio",
    title: "Koleksi Portofolio Mahasiswa",
    screenshot_url: "https://lh3.googleusercontent.com/aida/AEtjO1WO330U-yo2a4eRN-xJNrAGA7qa0Ho_0lJF-3lGTLdOEdLL3JUz2MTZ6UbI2dOpDJ-p-XLhlA4RcqyaP5G4XeDRxdsuXjhAjTPXqLzzVlb3SYJNcKVvPD7BMuqS11KdzfLP5cEZxn0i6wWzXWSbFToYJSqGGF1Szipt73cXYTY1ZColnTxgsYXa8zs5E6QYiNAQOSKpmws9-Yh7AYHj8O6Zpr_pWoP5acGlSVVxyjxGY7xseuI1Pfntx7Er",
    html_url: "https://stitch.googleapis.com/v1/projects/10744711964413240245/files/b7f1491f2df345eb9049393f36c4d92c:download"
  });
  screens.push({
    slug: "03_profil_mahasiswa_skills",
    title: "Profil Mahasiswa & Skills",
    screenshot_url: "https://lh3.googleusercontent.com/aida/AEtjO1VJdH7hYQInlMKbox3GLA67hIUhalMLh-SV6A1OOkyH7vYuq4vtJusGueMaBQ9ztyzKO4_1F6MXIz2R_JYcK3r1nHu0HQdeBcNss2Iu7XjYBuSN6wD-5oANIcLB93vIy6MUqP5vZE_bBZorC9MaXyHUR2nJK-xezg-4NsW3vQl6WF5SFSjNNtBj0hIfAPGdV9YZZtadfM4eUfAhP19PxcTFFIvfgN3ZvhcHEOw38GQwUblP3LWk77TcNyEM",
    html_url: "https://stitch.googleapis.com/v1/projects/10744711964413240245/files/c8ff4cb8186844c3beb115e66152b611:download"
  });
  screens.push({
    slug: "04_jelajah_rekomendasi_ai",
    title: "Jelajah & Rekomendasi AI",
    screenshot_url: "https://lh3.googleusercontent.com/aida/AEtjO1XNdBSiCn6fEw4KKMA8aqi2HO3GSARIHtmpPNoqs_h05Ye1O2GNOHPnFg-eGbaMIKy86ALvEMlP9krRKXyw30vTb8FwohOl8nadnMnAvapCGBou1Ftzsxg1e4J3HgBEDkGNqD9U-22hVFLKU7GUO_J9uQ5y8xRcs_N3AcqIrNMXjPnNqXqRGq5gTc0Ktj_VBS1sBncwCf_2PEAPksEc_rpZo73LrQ51C8bfFvBZyNc8hRwp2tQE3_PIvOUT",
    html_url: "https://stitch.googleapis.com/v1/projects/10744711964413240245/files/dae967c6aef143b99f1ba4e6d9b1e2b7:download"
  });

  // 2. Registrasi (from task-66)
  screens.push({
    slug: "00_registrasi_mahasiswa",
    title: "Registrasi Akun Mahasiswa",
    screenshot_url: "https://stitch.googleapis.com/v1/projects/10744711964413240245/files/8c9d49d656cc41d69e7ebb5cfa30d86c:download",
    html_url: "https://stitch.googleapis.com/v1/projects/10744711964413240245/files/b3c34ec11b8c4ce8b30f62c6a9166587:download"
  });

  // 3. Batch 1 (Login & Onboarding)
  if (fs.existsSync("scripts/batch1_results.json")) {
    const b1 = JSON.parse(fs.readFileSync("scripts/batch1_results.json", "utf8"));
    for (const entry of b1) {
      const designScreen = entry.res?.result?.structuredContent?.outputComponents?.[0]?.design?.screens?.[0] ||
        JSON.parse(entry.res?.result?.content?.[0]?.text || "{}")?.outputComponents?.[0]?.design?.screens?.[0];
      if (designScreen) {
        const slug = entry.item.key === "login_mahasiswa" ? "00_login_mahasiswa" : "00_onboarding_minat_skills";
        screens.push({
          slug: slug,
          title: designScreen.title || entry.item.title,
          screenshot_url: designScreen.screenshot?.downloadUrl,
          html_url: designScreen.htmlCode?.downloadUrl
        });
      }
    }
  }

  // 4. Batch 2 (buat_postingan & detail_postingan)
  const b2Keys = [
    { file: "scripts/result_buat_postingan_proyek.json", slug: "05_buat_proyek_rekrutmen", title: "Buat Proyek & Rekrutmen Tim" },
    { file: "scripts/result_detail_postingan_kolaborasi.json", slug: "06_detail_proyek_kolaborasi", title: "Detail Proyek & Permintaan Bergabung" }
  ];
  for (const b of b2Keys) {
    if (fs.existsSync(b.file)) {
      const data = JSON.parse(fs.readFileSync(b.file, "utf8"));
      const designScreen = data.res?.result?.structuredContent?.outputComponents?.[0]?.design?.screens?.[0] ||
        JSON.parse(data.res?.result?.content?.[0]?.text || "{}")?.outputComponents?.[0]?.design?.screens?.[0];
      if (designScreen) {
        screens.push({
          slug: b.slug,
          title: designScreen.title || b.title,
          screenshot_url: designScreen.screenshot?.downloadUrl,
          html_url: designScreen.htmlCode?.downloadUrl
        });
      }
    }
  }

  // 5. Batch 3 (tambah_portofolio, detail_portofolio, notifikasi_kolaborasi)
  const b3Keys = [
    { file: "scripts/result_tambah_portofolio.json", slug: "07_tambah_portofolio", title: "Tambah Portofolio Karya Mahasiswa" },
    { file: "scripts/result_detail_portofolio.json", slug: "08_detail_portofolio", title: "Detail Showcase Portofolio Mahasiswa" },
    { file: "scripts/result_notifikasi_kolaborasi.json", slug: "09_notifikasi_kolaborasi", title: "Pusat Notifikasi & Permintaan Tim" }
  ];
  for (const b of b3Keys) {
    if (fs.existsSync(b.file)) {
      const data = JSON.parse(fs.readFileSync(b.file, "utf8"));
      const designScreen = data.res?.result?.structuredContent?.outputComponents?.[0]?.design?.screens?.[0] ||
        JSON.parse(data.res?.result?.content?.[0]?.text || "{}")?.outputComponents?.[0]?.design?.screens?.[0];
      if (designScreen) {
        screens.push({
          slug: b.slug,
          title: designScreen.title || b.title,
          screenshot_url: designScreen.screenshot?.downloadUrl,
          html_url: designScreen.htmlCode?.downloadUrl
        });
      }
    }
  }

  return screens;
}

async function run() {
  const screens = await collectAllScreens();
  console.log(`Found ${screens.length} screens to sync.`);

  fs.mkdirSync("ui/stitch/html", { recursive: true });
  fs.mkdirSync("ui/stitch/screenshots", { recursive: true });

  for (const s of screens) {
    console.log(`\nSyncing [${s.slug}] ${s.title}...`);
    if (s.html_url) {
      const htmlPath = path.join("ui/stitch/html", `${s.slug}.html`);
      try {
        await downloadFile(s.html_url, htmlPath);
        console.log(`  HTML saved -> ${htmlPath}`);
      } catch (err) {
        console.error(`  Error downloading HTML:`, err.message);
      }
    }
    if (s.screenshot_url) {
      const imgPath = path.join("ui/stitch/screenshots", `${s.slug}.png`);
      try {
        await downloadFile(s.screenshot_url, imgPath);
        console.log(`  Screenshot saved -> ${imgPath}`);
      } catch (err) {
        console.error(`  Error downloading Screenshot:`, err.message);
      }
    }
  }

  console.log("\nAll assets synced successfully!");
}

run();
