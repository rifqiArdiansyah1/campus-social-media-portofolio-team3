const fs = require("fs");
const path = require("path");

function getEntry(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const data = raw.res ? raw.res : raw;
  const structured = data?.result?.structuredContent?.outputComponents?.[0]?.design?.screens?.[0];
  if (structured) return structured;
  const textObj = JSON.parse(data?.result?.content?.[0]?.text || "{}");
  return textObj?.outputComponents?.[0]?.design?.screens?.[0] || null;
}

const manifest = [
  // Task 66: Registrasi Mahasiswa
  {
    slug: "00_registrasi_mahasiswa",
    title: "Registrasi Akun Mahasiswa",
    htmlFileName: "projects/10744711964413240245/files/b3c34ec11b8c4ce8b30f62c6a9166587",
    screenshotFileName: "projects/10744711964413240245/files/8c9d49d656cc41d69e7ebb5cfa30d86c"
  }
];

// Batch 1 (Login & Onboarding)
if (fs.existsSync("scripts/batch1_results.json")) {
  const b1 = JSON.parse(fs.readFileSync("scripts/batch1_results.json", "utf8"));
  for (const entry of b1) {
    const textObj = JSON.parse(entry.res?.result?.content?.[0]?.text || "{}");
    const screen = textObj?.outputComponents?.[0]?.design?.screens?.[0];
    if (screen) {
      if (entry.item.key === "login_mahasiswa") {
        manifest.push({
          slug: "00_login_mahasiswa",
          title: "Login Mahasiswa & SSO Kampus",
          htmlFileName: screen.htmlCode?.name,
          screenshotFileName: screen.screenshot?.name
        });
      } else if (entry.item.key === "onboarding_minat_skills") {
        manifest.push({
          slug: "00_onboarding_minat_skills",
          title: "Onboarding Setup Profil & Keahlian",
          htmlFileName: screen.htmlCode?.name,
          screenshotFileName: screen.screenshot?.name
        });
      }
    }
  }
}

// Batch 2
const b2Files = [
  { file: "scripts/result_buat_postingan_proyek.json", slug: "05_buat_proyek_rekrutmen", title: "Buat Proyek & Rekrutmen Tim" },
  { file: "scripts/result_detail_postingan_kolaborasi.json", slug: "06_detail_proyek_kolaborasi", title: "Detail Proyek & Pengajuan Bergabung" }
];
for (const b of b2Files) {
  const s = getEntry(b.file);
  if (s) {
    manifest.push({
      slug: b.slug,
      title: b.title,
      htmlFileName: s.htmlCode?.name,
      screenshotFileName: s.screenshot?.name
    });
  }
}

// Batch 3
const b3Files = [
  { file: "scripts/result_tambah_portofolio.json", slug: "07_tambah_portofolio", title: "Tambah Portofolio Karya Mahasiswa" },
  { file: "scripts/result_detail_portofolio.json", slug: "08_detail_portofolio", title: "Detail Showcase Portofolio Mahasiswa" },
  { file: "scripts/result_notifikasi_kolaborasi.json", slug: "09_notifikasi_kolaborasi", title: "Pusat Notifikasi & Permintaan Tim" }
];
for (const b of b3Files) {
  const s = getEntry(b.file);
  if (s) {
    manifest.push({
      slug: b.slug,
      title: b.title,
      htmlFileName: s.htmlCode?.name,
      screenshotFileName: s.screenshot?.name
    });
  }
}

console.log("Manifest items to download:", JSON.stringify(manifest, null, 2));
fs.writeFileSync("scripts/screen_manifest.json", JSON.stringify(manifest, null, 2));
