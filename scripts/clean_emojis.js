const fs = require('fs');

let f2 = fs.readFileSync('ui/stitch/html/02_koleksi_portofolio.html', 'utf8');
f2 = f2.replace(/Karya dibagikan ke Beranda Kampus! 🎉/g, 'Karya berhasil dibagikan ke Beranda Kampus.');
fs.writeFileSync('ui/stitch/html/02_koleksi_portofolio.html', f2, 'utf8');

let f3 = fs.readFileSync('ui/stitch/html/03_profil_mahasiswa_skills.html', 'utf8');
f3 = f3.replace(/Pencocokan rekomendasi AI diaktifkan ✨/g, 'Pencocokan rekomendasi AI diaktifkan.');
f3 = f3.replace(/Tautan profil disalin ke papan klip! 📋/g, 'Tautan profil berhasil disalin ke papan klip.');
fs.writeFileSync('ui/stitch/html/03_profil_mahasiswa_skills.html', f3, 'utf8');

let f8 = fs.readFileSync('ui/stitch/html/08_detail_portofolio.html', 'utf8');
f8 = f8.replace("btnEndorseCard.textContent = 'Terapresiasi ✓';", "btnEndorseCard.textContent = 'Terapresiasi';");
fs.writeFileSync('ui/stitch/html/08_detail_portofolio.html', f8, 'utf8');

console.log('Successfully sanitized all emoji occurrences!');
