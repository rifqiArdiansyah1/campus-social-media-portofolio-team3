import os

def create_use_case_svg():
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1220" viewBox="0 0 1600 1220" font-family="'DejaVu Sans','Segoe UI',Arial,sans-serif">
  <title>Use Case Diagram CampusFolio v1.1</title>
  <defs>
    <marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" orient="auto">
      <path d="M1,1 L11,6 L1,11" fill="none" stroke="#333" stroke-width="1.4"/>
    </marker>
    <filter id="sh" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="800" y="32" font-size="20" text-anchor="middle" font-weight="bold" fill="#111">Use Case Diagram — CampusFolio (Campus Social Media &amp; Portfolio v1.1)</text>

  <!-- System Boundary -->
  <rect x="250" y="65" width="1080" height="1035" rx="10" fill="#FAFBFC" stroke="#555" stroke-width="2"/>
  <text x="790" y="88" font-size="15" text-anchor="middle" font-weight="bold" fill="#333">Sistem CampusFolio</text>

  <!-- Left Actor: Mahasiswa -->
  <g fill="none" stroke="#222" stroke-width="2" stroke-linecap="round">
    <circle cx="110" cy="480" r="10" fill="#fff"/>
    <line x1="110" y1="490" x2="110" y2="522"/>
    <line x1="90" y1="504" x2="130" y2="504"/>
    <line x1="110" y1="522" x2="94" y2="550"/>
    <line x1="110" y1="522" x2="126" y2="550"/>
  </g>
  <text x="110" y="570" font-size="13" text-anchor="middle" font-weight="bold" fill="#111">Mahasiswa</text>
  <text x="110" y="588" font-size="10.5" text-anchor="middle" fill="#555" font-style="italic">(Aktor Utama)</text>

  <!-- Right Top Actor: Moderator / Kaprodi -->
  <g fill="none" stroke="#222" stroke-width="2" stroke-linecap="round">
    <circle cx="1470" cy="220" r="10" fill="#fff"/>
    <line x1="1470" y1="230" x2="1470" y2="262"/>
    <line x1="1450" y1="244" x2="1490" y2="244"/>
    <line x1="1470" y1="262" x2="1454" y2="290"/>
    <line x1="1470" y1="262" x2="1486" y2="290"/>
  </g>
  <text x="1470" y="310" font-size="13" text-anchor="middle" font-weight="bold" fill="#111">Moderator (Kaprodi)</text>
  <text x="1470" y="328" font-size="10.5" text-anchor="middle" fill="#555" font-style="italic">&amp; Admin Kemahasiswaan</text>

  <!-- Right Bottom Actor: Layanan AI -->
  <g fill="none" stroke="#222" stroke-width="2" stroke-linecap="round">
    <circle cx="1470" cy="800" r="10" fill="#fff"/>
    <line x1="1470" y1="810" x2="1470" y2="842"/>
    <line x1="1450" y1="824" x2="1490" y2="824"/>
    <line x1="1470" y1="842" x2="1454" y2="870"/>
    <line x1="1470" y1="842" x2="1486" y2="870"/>
  </g>
  <text x="1470" y="890" font-size="13" text-anchor="middle" font-weight="bold" fill="#111">Layanan AI</text>
  <text x="1470" y="908" font-size="10.5" text-anchor="middle" fill="#555" font-style="italic">(NLP &amp; Matcher)</text>

  <!-- Mahasiswa Ellipses (Blue) -->
  <ellipse cx="430" cy="130" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="130" font-size="12" text-anchor="middle" dominant-baseline="central">UC-01: Registrasi &amp; Login</text>

  <ellipse cx="430" cy="195" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="195" font-size="12" text-anchor="middle" dominant-baseline="central">UC-04: Akses Home Dashboard</text>

  <ellipse cx="430" cy="260" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="260" font-size="12" text-anchor="middle" dominant-baseline="central">UC-03: Kelola Profil &amp; Skills</text>

  <ellipse cx="430" cy="325" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="325" font-size="12" text-anchor="middle" dominant-baseline="central">UC-05: Kelola Pertemanan</text>

  <ellipse cx="430" cy="390" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="390" font-size="12" text-anchor="middle" dominant-baseline="central">UC-06: Blokir Profil Pengguna</text>

  <ellipse cx="430" cy="460" rx="125" ry="28" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="453" font-size="11.5" text-anchor="middle">UC-07: Upload Portofolio</text>
  <text x="430" y="469" font-size="10" text-anchor="middle" fill="#333">(SKPI / Sertifikat / Artikel Ilmiah)</text>

  <ellipse cx="430" cy="540" rx="125" ry="28" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="533" font-size="11.5" text-anchor="middle">UC-08: Buat Postingan Feed</text>
  <text x="430" y="549" font-size="10" text-anchor="middle" fill="#333">(Fokus Foto + Teks)</text>

  <ellipse cx="430" cy="620" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="620" font-size="11.5" text-anchor="middle" dominant-baseline="central">UC-10: Cari Mahasiswa / Karya</text>

  <ellipse cx="430" cy="685" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="685" font-size="11.5" text-anchor="middle" dominant-baseline="central">UC-11: Lihat Detail Profil</text>

  <ellipse cx="430" cy="755" rx="125" ry="28" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="748" font-size="11.5" text-anchor="middle">UC-12: Rekomendasi Kolaborator</text>
  <text x="430" y="764" font-size="10" text-anchor="middle" fill="#333">(Kecocokan AI)</text>

  <ellipse cx="430" cy="830" rx="120" ry="26" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.6" filter="url(#sh)"/>
  <text x="430" y="830" font-size="11.5" text-anchor="middle" dominant-baseline="central">UC-14: Laporkan Postingan</text>

  <!-- Secondary & Included Cases (Center) -->
  <ellipse cx="780" cy="540" rx="125" ry="28" fill="#E6DBFF" stroke="#6B46C1" stroke-width="1.6" filter="url(#sh)"/>
  <text x="780" y="533" font-size="11.5" text-anchor="middle">UC-09: Klasifikasi Konten Awal</text>
  <text x="780" y="549" font-size="10" text-anchor="middle" fill="#444">(Layanan AI Text Screening)</text>

  <ellipse cx="780" cy="755" rx="125" ry="28" fill="#E6DBFF" stroke="#6B46C1" stroke-width="1.6" filter="url(#sh)"/>
  <text x="780" y="748" font-size="11.5" text-anchor="middle">UC-13: Hitung Kemiripan TF-IDF</text>
  <text x="780" y="764" font-size="10" text-anchor="middle" fill="#444">&amp; Cosine Similarity</text>

  <!-- Moderator / Admin Ellipses (Right/Orange) -->
  <ellipse cx="1120" cy="220" rx="140" ry="30" fill="#FFE8C7" stroke="#C05621" stroke-width="1.6" filter="url(#sh)"/>
  <text x="1120" y="213" font-size="12" text-anchor="middle">UC-15: Tinjau Antrean Konten</text>
  <text x="1120" y="229" font-size="10" text-anchor="middle" fill="#333">&amp; Terima Laporan Pelanggaran</text>

  <ellipse cx="1120" cy="340" rx="140" ry="30" fill="#FFE8C7" stroke="#C05621" stroke-width="1.6" filter="url(#sh)"/>
  <text x="1120" y="333" font-size="12" text-anchor="middle">UC-16: Tinjau Upload Portofolio</text>
  <text x="1120" y="349" font-size="10" text-anchor="middle" fill="#333">(Validasi SKPI &amp; Artikel Ilmiah)</text>

  <ellipse cx="1120" cy="460" rx="140" ry="30" fill="#FFE8C7" stroke="#C05621" stroke-width="1.6" filter="url(#sh)"/>
  <text x="1120" y="453" font-size="12" text-anchor="middle">UC-17: Hapus / Takedown Post</text>
  <text x="1120" y="469" font-size="10" text-anchor="middle" fill="#333">(Soft Delete &amp; Audit Trail)</text>

  <!-- Lines -->
  <line x1="140" y1="480" x2="300" y2="480" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="130" x2="300" y2="830" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="130" x2="310" y2="130" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="195" x2="310" y2="195" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="260" x2="310" y2="260" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="325" x2="310" y2="325" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="390" x2="310" y2="390" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="460" x2="305" y2="460" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="540" x2="305" y2="540" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="620" x2="310" y2="620" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="685" x2="310" y2="685" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="755" x2="305" y2="755" stroke="#333" stroke-width="1.5"/>
  <line x1="300" y1="830" x2="310" y2="830" stroke="#333" stroke-width="1.5"/>

  <line x1="1440" y1="250" x2="1260" y2="220" stroke="#333" stroke-width="1.5"/>
  <line x1="1440" y1="250" x2="1260" y2="340" stroke="#333" stroke-width="1.5"/>
  <line x1="1440" y1="250" x2="1260" y2="460" stroke="#333" stroke-width="1.5"/>

  <line x1="1440" y1="830" x2="905" y2="540" stroke="#333" stroke-width="1.5"/>
  <line x1="1440" y1="830" x2="905" y2="755" stroke="#333" stroke-width="1.5"/>

  <!-- Include & Extend relationships -->
  <line x1="555" y1="540" x2="655" y2="540" stroke="#333" stroke-width="1.5" stroke-dasharray="6,4" marker-end="url(#open)"/>
  <rect x="580" y="525" width="55" height="15" fill="#fff" opacity="0.9"/>
  <text x="607" y="534" font-size="9" text-anchor="middle" font-style="italic">«include»</text>

  <line x1="555" y1="755" x2="655" y2="755" stroke="#333" stroke-width="1.5" stroke-dasharray="6,4" marker-end="url(#open)"/>
  <rect x="580" y="740" width="55" height="15" fill="#fff" opacity="0.9"/>
  <text x="607" y="749" font-size="9" text-anchor="middle" font-style="italic">«include»</text>

  <line x1="1120" y1="430" x2="1120" y2="250" stroke="#333" stroke-width="1.5" stroke-dasharray="6,4" marker-end="url(#open)"/>
  <rect x="1095" y="340" width="50" height="15" fill="#fff" opacity="0.9"/>
  <text x="1120" y="349" font-size="9" text-anchor="middle" font-style="italic">«extend»</text>

  <!-- Legend -->
  <rect x="250" y="1120" width="1080" height="70" rx="6" fill="#fff" stroke="#999" stroke-width="1"/>
  <text x="270" y="1140" font-size="11" font-weight="bold" fill="#111">Keterangan Peran &amp; Simbol:</text>
  <ellipse cx="330" cy="1165" rx="14" ry="7" fill="#CDE8FF" stroke="#2B6CB0" stroke-width="1.2"/>
  <text x="350" y="1165" font-size="10.5" dominant-baseline="central">Fitur Mahasiswa</text>
  <ellipse cx="480" cy="1165" rx="14" ry="7" fill="#FFE8C7" stroke="#C05621" stroke-width="1.2"/>
  <text x="500" y="1165" font-size="10.5" dominant-baseline="central">Fitur Kaprodi &amp; Admin</text>
  <ellipse cx="670" cy="1165" rx="14" ry="7" fill="#E6DBFF" stroke="#6B46C1" stroke-width="1.2"/>
  <text x="690" y="1165" font-size="10.5" dominant-baseline="central">Modul Layanan AI (Screening &amp; Matcher)</text>
</svg>"""
    with open("docs/diagrams/use-case.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("[OK] docs/diagrams/use-case.svg generated.")

def create_activity_posting_moderasi_svg():
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1000" viewBox="0 0 1500 1000" font-family="'DejaVu Sans','Segoe UI',Arial,sans-serif">
  <title>Activity Diagram AD-01: Posting, Tinjauan Konten &amp; Moderasi</title>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0,1 L10,5 L0,9 Z" fill="#333"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="750" y="32" font-size="18" text-anchor="middle" font-weight="bold" fill="#111">Activity Diagram AD-01: Pembuatan Postingan (Foto + Teks), Pelaporan, &amp; Moderasi/Takedown</text>

  <!-- Swimlanes -->
  <rect x="40" y="60" width="360" height="900" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="40" y="60" width="360" height="35" fill="#2563EB"/>
  <text x="220" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Mahasiswa</text>

  <rect x="400" y="60" width="400" height="900" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="400" y="60" width="400" height="35" fill="#0D9488"/>
  <text x="600" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Sistem CampusFolio</text>

  <rect x="800" y="60" width="320" height="900" fill="#FAF5FF" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="800" y="60" width="320" height="35" fill="#7C3AED"/>
  <text x="960" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Layanan AI (Screening)</text>

  <rect x="1120" y="60" width="340" height="900" fill="#FFFBEB" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="1120" y="60" width="340" height="35" fill="#D97706"/>
  <text x="1290" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Moderator (Kaprodi) / Admin</text>

  <!-- Start Node -->
  <circle cx="220" cy="130" r="14" fill="#111"/>

  <!-- Action: M1 Tulis Posting -->
  <rect x="100" y="170" width="240" height="50" rx="8" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="220" y="190" font-size="11" text-anchor="middle" font-weight="bold">Tulis caption teks &amp; unggah foto</text>
  <text x="220" y="206" font-size="10" text-anchor="middle" fill="#555">(Pilih tipe: umum / cari anggota)</text>

  <!-- Action: S1 Validasi -->
  <rect x="480" y="170" width="240" height="50" rx="8" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="600" y="190" font-size="11" text-anchor="middle" font-weight="bold">Validasi input teks &amp; foto</text>
  <text x="600" y="206" font-size="10" text-anchor="middle" fill="#555">Simpan sebagai draft</text>

  <!-- Action: A1 AI Screening -->
  <rect x="840" y="170" width="240" height="50" rx="8" fill="#fff" stroke="#7C3AED" stroke-width="1.5"/>
  <text x="960" y="190" font-size="11" text-anchor="middle" font-weight="bold">Klasifikasi Teks Otomatis</text>
  <text x="960" y="206" font-size="10" text-anchor="middle" fill="#555">Label, Confidence &amp; Kategori</text>

  <!-- Decision: D1 Aman? -->
  <polygon points="960,260 1020,290 960,320 900,290" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
  <text x="960" y="293" font-size="10.5" text-anchor="middle" font-weight="bold">Aman?</text>

  <!-- Action: S4 Tayangkan Posting -->
  <rect x="480" y="265" width="240" height="50" rx="8" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>
  <text x="600" y="285" font-size="11" text-anchor="middle" font-weight="bold" fill="#166534">Tayangkan di Feed &amp; Home</text>
  <text x="600" y="301" font-size="10" text-anchor="middle" fill="#166534">(Status: tayang)</text>

  <!-- Pelaporan Postingan Flow -->
  <rect x="100" y="370" width="240" height="50" rx="8" fill="#fff" stroke="#EF4444" stroke-width="1.5"/>
  <text x="220" y="390" font-size="11" text-anchor="middle" font-weight="bold" fill="#DC2626">Mahasiswa Lain Temukan</text>
  <text x="220" y="406" font-size="10" text-anchor="middle" fill="#DC2626">Kirim Laporan Pelanggaran</text>

  <!-- S_REP Tangani Laporan -->
  <rect x="480" y="370" width="240" height="50" rx="8" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="600" y="390" font-size="11" text-anchor="middle" font-weight="bold">Tandai Status: direview</text>
  <text x="600" y="406" font-size="10" text-anchor="middle" fill="#555">Masukkan ke Antrean Laporan</text>

  <!-- S3 Antrean Moderasi -->
  <rect x="480" y="480" width="240" height="50" rx="8" fill="#fff" stroke="#D97706" stroke-width="1.5"/>
  <text x="600" y="500" font-size="11" text-anchor="middle" font-weight="bold">Antrean Moderasi Kaprodi</text>
  <text x="600" y="516" font-size="10" text-anchor="middle" fill="#555">Status: menunggu_review</text>

  <!-- MOD AD1 Buka Antrean -->
  <rect x="1170" y="480" width="240" height="50" rx="8" fill="#fff" stroke="#D97706" stroke-width="1.5"/>
  <text x="1290" y="500" font-size="11" text-anchor="middle" font-weight="bold">Kaprodi / Admin Tinjau Konten</text>
  <text x="1290" y="516" font-size="10" text-anchor="middle" fill="#555">Evaluasi Alasan &amp; Laporan</text>

  <!-- Decision: D2 Keputusan Moderator -->
  <polygon points="1290,570 1370,610 1290,650 1210,610" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
  <text x="1290" y="613" font-size="10.5" text-anchor="middle" font-weight="bold">Keputusan?</text>

  <!-- MOD AD3 Hapus Postingan (Takedown) -->
  <rect x="1170" y="700" width="240" height="50" rx="8" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.5"/>
  <text x="1290" y="720" font-size="11" text-anchor="middle" font-weight="bold" fill="#991B1B">Takedown / Hapus Postingan</text>
  <text x="1290" y="736" font-size="10" text-anchor="middle" fill="#991B1B">Isi Alasan Pelanggaran</text>

  <!-- S6 Soft Delete -->
  <rect x="480" y="700" width="240" height="50" rx="8" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="600" y="720" font-size="11" text-anchor="middle" font-weight="bold">Soft-Delete (is_deleted = TRUE)</text>
  <text x="600" y="736" font-size="10" text-anchor="middle" fill="#555">Catat deleted_by &amp; deleted_at</text>

  <!-- Notifikasi ke Pembuat Post -->
  <rect x="100" y="700" width="240" height="50" rx="8" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="220" y="720" font-size="11" text-anchor="middle" font-weight="bold">Terima Notifikasi</text>
  <text x="220" y="736" font-size="10" text-anchor="middle" fill="#555">Alasan Takedown / Revisi</text>

  <!-- End Node -->
  <circle cx="220" cy="810" r="14" fill="#fff" stroke="#111" stroke-width="2"/>
  <circle cx="220" cy="810" r="8" fill="#111"/>

  <!-- Connecting Lines -->
  <line x1="220" y1="144" x2="220" y2="170" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="340" y1="195" x2="480" y2="195" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="720" y1="195" x2="840" y2="195" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="960" y1="220" x2="960" y2="260" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="900" y1="290" x2="720" y2="290" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="810" y="280" font-size="9" fill="#166534" font-weight="bold">Ya (Aman)</text>

  <line x1="960" y1="320" x2="960" y2="505" stroke="#333" stroke-width="1.5"/>
  <line x1="960" y1="505" x2="720" y2="505" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="965" y="420" font-size="9" fill="#DC2626" font-weight="bold">Perlu Review / Ragu</text>

  <line x1="340" y1="395" x2="480" y2="395" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="720" y1="395" x2="1290" y2="395" stroke="#333" stroke-width="1.5"/>
  <line x1="1290" y1="395" x2="1290" y2="480" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="720" y1="505" x2="1170" y2="505" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1290" y1="530" x2="1290" y2="570" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="1210" y1="610" x2="600" y2="610" stroke="#333" stroke-width="1.5"/>
  <line x1="600" y1="610" x2="600" y2="315" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="850" y="600" font-size="9" fill="#166534" font-weight="bold">Setujui (Tayangkan)</text>

  <line x1="1290" y1="650" x2="1290" y2="700" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="1295" y="675" font-size="9" fill="#DC2626" font-weight="bold">Hapus Postingan</text>

  <line x1="1170" y1="725" x2="720" y2="725" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="480" y1="725" x2="340" y2="725" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="220" y1="750" x2="220" y2="796" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>"""
    with open("docs/diagrams/activity-posting-moderasi.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("[OK] docs/diagrams/activity-posting-moderasi.svg generated.")

def create_activity_pencarian_rekomendasi_svg():
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="980" viewBox="0 0 1500 980" font-family="'DejaVu Sans','Segoe UI',Arial,sans-serif">
  <title>Activity Diagram AD-02: Dashboard Home, Pertemanan, Blokir &amp; Rekomendasi AI</title>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0,1 L10,5 L0,9 Z" fill="#333"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="750" y="32" font-size="18" text-anchor="middle" font-weight="bold" fill="#111">Activity Diagram AD-02: Home Dashboard Terpadu, Pertemanan, Blokir Profil, &amp; Rekomendasi AI</text>

  <!-- Swimlanes -->
  <rect x="40" y="60" width="440" height="880" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="40" y="60" width="440" height="35" fill="#2563EB"/>
  <text x="260" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Mahasiswa (Pengguna)</text>

  <rect x="480" y="60" width="540" height="880" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="480" y="60" width="540" height="35" fill="#0D9488"/>
  <text x="750" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Sistem CampusFolio (Home Hub &amp; DB)</text>

  <rect x="1020" y="60" width="440" height="880" fill="#FAF5FF" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="1020" y="60" width="440" height="35" fill="#7C3AED"/>
  <text x="1240" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Layanan AI (TF-IDF Matcher)</text>

  <!-- Start -->
  <circle cx="260" cy="120" r="14" fill="#111"/>

  <!-- Action: Buka Home Dashboard -->
  <rect x="120" y="160" width="280" height="50" rx="8" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="260" y="180" font-size="11" text-anchor="middle" font-weight="bold">Buka Menu Home / Dashboard</text>
  <text x="260" y="196" font-size="10" text-anchor="middle" fill="#555">Pusat Seluruh Aktivitas Kampus</text>

  <!-- S_HOME Agregasi -->
  <rect x="560" y="160" width="380" height="50" rx="8" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="750" y="180" font-size="11" text-anchor="middle" font-weight="bold">Agregasi Feed Teman, Proyek, SKPI, &amp; Rekomendasi</text>
  <text x="750" y="196" font-size="10" text-anchor="middle" fill="#555">Saring konten berdasarkan daftar blokir &amp; prodi</text>

  <!-- AI Inference -->
  <rect x="1080" y="160" width="320" height="50" rx="8" fill="#fff" stroke="#7C3AED" stroke-width="1.5"/>
  <text x="1240" y="180" font-size="11" text-anchor="middle" font-weight="bold">Hitung TF-IDF &amp; Cosine Similarity</text>
  <text x="1240" y="196" font-size="10" text-anchor="middle" fill="#555">Kesesuaian Skill Pengguna vs Kandidat</text>

  <!-- Tampilan Home Terpadu -->
  <rect x="120" y="270" width="280" height="50" rx="8" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.5"/>
  <text x="260" y="290" font-size="11" text-anchor="middle" font-weight="bold">Akses Home: Eksplorasi Profil</text>
  <text x="260" y="306" font-size="10" text-anchor="middle" fill="#555">Lihat Card Rekomendasi &amp; Feed</text>

  <!-- Decision: Pilihan Aksi Mahasiswa -->
  <polygon points="260,370 360,410 260,450 160,410" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
  <text x="260" y="413" font-size="10.5" text-anchor="middle" font-weight="bold">Pilihan Aksi?</text>

  <!-- Branch 1: Tambah Pertemanan -->
  <rect x="80" y="520" width="160" height="45" rx="6" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="160" y="540" font-size="10.5" text-anchor="middle" font-weight="bold">Kirim Permintaan</text>
  <text x="160" y="554" font-size="9.5" text-anchor="middle" fill="#555">Pertemanan</text>

  <!-- Branch 2: Blokir Profil -->
  <rect x="280" y="520" width="160" height="45" rx="6" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.5"/>
  <text x="360" y="540" font-size="10.5" text-anchor="middle" font-weight="bold" fill="#991B1B">Blokir Profil</text>
  <text x="360" y="554" font-size="9.5" text-anchor="middle" fill="#991B1B">Privasi Terganggu</text>

  <!-- Branch 3: Kolaborasi -->
  <rect x="120" y="630" width="280" height="45" rx="6" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>
  <text x="260" y="650" font-size="10.5" text-anchor="middle" font-weight="bold" fill="#166534">Ajak Kolaborasi Proyek</text>
  <text x="260" y="664" font-size="9.5" text-anchor="middle" fill="#166534">Hubungi via Kontak Profil</text>

  <!-- System Handling: Simpan Pertemanan -->
  <rect x="560" y="520" width="380" height="45" rx="6" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="750" y="540" font-size="10.5" text-anchor="middle" font-weight="bold">Simpan ke friendships (Status: menunggu)</text>
  <text x="750" y="554" font-size="9.5" text-anchor="middle" fill="#555">Kirim notifikasi &amp; update widget Home calon teman</text>

  <!-- System Handling: Simpan Blokir -->
  <rect x="560" y="590" width="380" height="45" rx="6" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="750" y="610" font-size="10.5" text-anchor="middle" font-weight="bold">Simpan ke user_blocks</text>
  <text x="750" y="624" font-size="9.5" text-anchor="middle" fill="#555">Sembunyikan profil &amp; postingan timbal balik di feed</text>

  <!-- Terima / Tolak Pertemanan di Home -->
  <rect x="120" y="740" width="280" height="45" rx="6" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="260" y="760" font-size="10.5" text-anchor="middle" font-weight="bold">Terima / Tolak di Widget Home</text>
  <text x="260" y="774" font-size="9.5" text-anchor="middle" fill="#555">Status Pertemanan Diperbarui</text>

  <!-- End Node -->
  <circle cx="260" cy="860" r="14" fill="#fff" stroke="#111" stroke-width="2"/>
  <circle cx="260" cy="860" r="8" fill="#111"/>

  <!-- Lines -->
  <line x1="260" y1="134" x2="260" y2="160" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="400" y1="185" x2="560" y2="185" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="940" y1="185" x2="1080" y2="185" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1240" y1="210" x2="1240" y2="295" stroke="#333" stroke-width="1.5"/>
  <line x1="1240" y1="295" x2="400" y2="295" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="260" y1="320" x2="260" y2="370" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="210" y1="430" x2="160" y2="520" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="310" y1="430" x2="360" y2="520" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="260" y1="450" x2="260" y2="630" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="240" y1="542" x2="560" y2="542" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="440" y1="542" x2="500" y2="542" stroke="#333" stroke-width="1.5"/>
  <line x1="500" y1="542" x2="500" y2="612" stroke="#333" stroke-width="1.5"/>
  <line x1="500" y1="612" x2="560" y2="612" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="750" y1="565" x2="750" y2="762" stroke="#333" stroke-width="1.5"/>
  <line x1="750" y1="762" x2="400" y2="762" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="260" y1="785" x2="260" y2="846" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>"""
    with open("docs/diagrams/activity-pencarian-rekomendasi.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("[OK] docs/diagrams/activity-pencarian-rekomendasi.svg generated.")

def create_activity_portofolio_skpi_svg():
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="900" viewBox="0 0 1500 900" font-family="'DejaVu Sans','Segoe UI',Arial,sans-serif">
  <title>Activity Diagram AD-03: Unggah &amp; Tinjauan Portofolio SKPI / Artikel Ilmiah</title>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0,1 L10,5 L0,9 Z" fill="#333"/>
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="750" y="32" font-size="18" text-anchor="middle" font-weight="bold" fill="#111">Activity Diagram AD-03: Unggah &amp; Tinjauan Validasi Portofolio (SKPI, Sertifikat, &amp; Artikel Ilmiah)</text>

  <!-- Swimlanes -->
  <rect x="40" y="60" width="440" height="800" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="40" y="60" width="440" height="35" fill="#2563EB"/>
  <text x="260" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Mahasiswa (Pengunggah)</text>

  <rect x="480" y="60" width="500" height="800" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="480" y="60" width="500" height="35" fill="#0D9488"/>
  <text x="730" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Sistem CampusFolio</text>

  <rect x="980" y="60" width="480" height="800" fill="#FFFBEB" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="980" y="60" width="480" height="35" fill="#D97706"/>
  <text x="1220" y="82" font-size="14" text-anchor="middle" font-weight="bold" fill="#fff">Moderator (Kaprodi Jurusan) / Admin</text>

  <!-- Start -->
  <circle cx="260" cy="120" r="14" fill="#111"/>

  <!-- Action: Form Upload -->
  <rect x="120" y="160" width="280" height="55" rx="8" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="260" y="180" font-size="11" text-anchor="middle" font-weight="bold">Pilih Kategori Portofolio</text>
  <text x="260" y="196" font-size="10" text-anchor="middle" fill="#555">Proyek / SKPI / Sertifikat / Artikel Ilmiah</text>

  <!-- Action: Unggah Dokumen Bukti -->
  <rect x="120" y="250" width="280" height="55" rx="8" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="260" y="270" font-size="11" text-anchor="middle" font-weight="bold">Unggah Dokumen PDF Bukti</text>
  <text x="260" y="286" font-size="10" text-anchor="middle" fill="#555">Isi Nomor Sertifikat/DOI &amp; Penerbit</text>

  <!-- S1 Validasi & Simpan -->
  <rect x="560" y="250" width="340" height="55" rx="8" fill="#fff" stroke="#0D9488" stroke-width="1.5"/>
  <text x="730" y="270" font-size="11" text-anchor="middle" font-weight="bold">Validasi Format &amp; Simpan Portofolio</text>
  <text x="730" y="286" font-size="10" text-anchor="middle" fill="#555">Status: menunggu_review (sesuai prodi mahasiswa)</text>

  <!-- V1 Kaprodi Buka Antrean -->
  <rect x="1060" y="250" width="320" height="55" rx="8" fill="#fff" stroke="#D97706" stroke-width="1.5"/>
  <text x="1220" y="270" font-size="11" text-anchor="middle" font-weight="bold">Buka Antrean Tinjauan Portofolio</text>
  <text x="1220" y="286" font-size="10" text-anchor="middle" fill="#555">Periksa keaslian berkas SKPI / Naskah Artikel</text>

  <!-- Decision: D_VERIF Kelayakan -->
  <polygon points="1220,360 1320,405 1220,450 1120,405" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
  <text x="1220" y="408" font-size="10.5" text-anchor="middle" font-weight="bold">Memenuhi Syarat?</text>

  <!-- V_ACC Setujui -->
  <rect x="1060" y="510" width="140" height="50" rx="8" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>
  <text x="1130" y="530" font-size="11" text-anchor="middle" font-weight="bold" fill="#166534">Setujui &amp;</text>
  <text x="1130" y="546" font-size="10" text-anchor="middle" fill="#166534">Verifikasi</text>

  <!-- V_REJ Tolak -->
  <rect x="1240" y="510" width="140" height="50" rx="8" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.5"/>
  <text x="1310" y="530" font-size="11" text-anchor="middle" font-weight="bold" fill="#991B1B">Tolak / Minta</text>
  <text x="1310" y="546" font-size="10" text-anchor="middle" fill="#991B1B">Revisi Dokumen</text>

  <!-- S_OK Status Terverifikasi -->
  <rect x="560" y="510" width="340" height="50" rx="8" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5"/>
  <text x="730" y="530" font-size="11" text-anchor="middle" font-weight="bold" fill="#166534">Status: terverifikasi</text>
  <text x="730" y="546" font-size="10" text-anchor="middle" fill="#166534">Beri Badge Validasi Kampus &amp; Poin SKPI</text>

  <!-- S_REJ Status Ditolak -->
  <rect x="560" y="590" width="340" height="50" rx="8" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.5"/>
  <text x="730" y="610" font-size="11" text-anchor="middle" font-weight="bold" fill="#991B1B">Status: ditolak</text>
  <text x="730" y="626" font-size="10" text-anchor="middle" fill="#991B1B">Simpan catatan perbaikan dari Kaprodi</text>

  <!-- Notifikasi ke Mahasiswa -->
  <rect x="120" y="550" width="280" height="50" rx="8" fill="#fff" stroke="#2563EB" stroke-width="1.5"/>
  <text x="260" y="570" font-size="11" text-anchor="middle" font-weight="bold">Terima Hasil Verifikasi di Home</text>
  <text x="260" y="586" font-size="10" text-anchor="middle" fill="#555">Portofolio Siap untuk Transkrip SKPI</text>

  <!-- End Node -->
  <circle cx="260" cy="680" r="14" fill="#fff" stroke="#111" stroke-width="2"/>
  <circle cx="260" cy="680" r="8" fill="#111"/>

  <!-- Lines -->
  <line x1="260" y1="134" x2="260" y2="160" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="260" y1="215" x2="260" y2="250" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="400" y1="277" x2="560" y2="277" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="900" y1="277" x2="1060" y2="277" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1220" y1="305" x2="1220" y2="360" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="1170" y1="428" x2="1130" y2="510" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="1110" y="465" font-size="9" fill="#166534" font-weight="bold">Ya (Valid)</text>

  <line x1="1270" y1="428" x2="1310" y2="510" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="1315" y="465" font-size="9" fill="#DC2626" font-weight="bold">Tidak Valid</text>

  <line x1="1060" y1="535" x2="900" y2="535" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="1240" y1="545" x2="1000" y2="545" stroke="#333" stroke-width="1.5"/>
  <line x1="1000" y1="545" x2="1000" y2="615" stroke="#333" stroke-width="1.5"/>
  <line x1="1000" y1="615" x2="900" y2="615" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="560" y1="535" x2="480" y2="535" stroke="#333" stroke-width="1.5"/>
  <line x1="560" y1="615" x2="480" y2="615" stroke="#333" stroke-width="1.5"/>
  <line x1="480" y1="535" x2="480" y2="575" stroke="#333" stroke-width="1.5"/>
  <line x1="480" y1="615" x2="480" y2="575" stroke="#333" stroke-width="1.5"/>
  <line x1="480" y1="575" x2="400" y2="575" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>

  <line x1="260" y1="600" x2="260" y2="666" stroke="#333" stroke-width="1.5" marker-end="url(#arrow)"/>
</svg>"""
    with open("docs/diagrams/activity-portofolio-skpi.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("[OK] docs/diagrams/activity-portofolio-skpi.svg generated.")

def create_erd_svg():
    svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1850" height="1400" viewBox="0 0 1850 1400" font-family="'DejaVu Sans','Segoe UI',Arial,sans-serif">
  <title>ERD CampusFolio v1.1</title>
  <defs>
    <filter id="sh" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="1.5" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="925" y="32" font-size="20" text-anchor="middle" font-weight="bold" fill="#111">Entity Relationship Diagram — CampusFolio (Notasi Crow's Foot v1.1 - Revisi Klien)</text>

  <!-- TABLE: users -->
  <rect x="550" y="380" width="290" height="290" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M550,408 L550,385 Q550,380 555,380 L835,380 Q840,380 840,385 L840,408 Z" fill="#2D3E50"/>
  <text x="695" y="394" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">users</text>
  <rect x="556" y="413" width="22" height="13" rx="3" fill="#D69E2E"/><text x="567" y="420" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="600" y="420" font-size="10.5" font-weight="bold">user_id</text><text x="830" y="420" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="551" y="430" width="288" height="18" fill="#F3F6F9"/>
  <rect x="556" y="432" width="22" height="13" rx="3" fill="#718096"/><text x="567" y="439" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">UK</text>
  <text x="600" y="439" font-size="10.5">nim</text><text x="830" y="439" font-size="9" text-anchor="end" fill="#777">VARCHAR(20)</text>
  <text x="600" y="458" font-size="10.5">nama</text><text x="830" y="458" font-size="9" text-anchor="end" fill="#777">VARCHAR(100)</text>
  <rect x="551" y="468" width="288" height="18" fill="#F3F6F9"/>
  <rect x="556" y="470" width="22" height="13" rx="3" fill="#718096"/><text x="567" y="477" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">UK</text>
  <text x="600" y="477" font-size="10.5">email</text><text x="830" y="477" font-size="9" text-anchor="end" fill="#777">VARCHAR(100)</text>
  <text x="600" y="496" font-size="10.5">password_hash</text><text x="830" y="496" font-size="9" text-anchor="end" fill="#777">VARCHAR(255)</text>
  <rect x="551" y="506" width="288" height="18" fill="#F3F6F9"/>
  <text x="600" y="515" font-size="10.5">jurusan (Prodi)</text><text x="830" y="515" font-size="9" text-anchor="end" fill="#777">VARCHAR(100)</text>
  <text x="600" y="534" font-size="10.5">angkatan</text><text x="830" y="534" font-size="9" text-anchor="end" fill="#777">INT</text>
  <rect x="551" y="544" width="288" height="18" fill="#F3F6F9"/>
  <text x="600" y="553" font-size="10.5">bio</text><text x="830" y="553" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <text x="600" y="572" font-size="10.5">kontak_url</text><text x="830" y="572" font-size="9" text-anchor="end" fill="#777">VARCHAR(255)</text>
  <rect x="551" y="582" width="288" height="18" fill="#FEF3C7"/>
  <text x="600" y="591" font-size="10.5" font-weight="bold" fill="#B45309">role (mhs/moderator/admin)</text><text x="830" y="591" font-size="9" text-anchor="end" fill="#B45309">ENUM</text>
  <text x="600" y="610" font-size="10.5">created_at</text><text x="830" y="610" font-size="9" text-anchor="end" fill="#777">TIMESTAMP</text>
  <line x1="550" y1="408" x2="840" y2="408" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: friendships -->
  <rect x="550" y="80" width="290" height="180" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M550,108 L550,85 Q550,80 555,80 L835,80 Q840,80 840,85 L840,108 Z" fill="#2D3E50"/>
  <text x="695" y="94" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">friendships (Pertemanan Mhs)</text>
  <rect x="556" y="113" width="22" height="13" rx="3" fill="#D69E2E"/><text x="567" y="120" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="600" y="120" font-size="10.5" font-weight="bold">friendship_id</text><text x="830" y="120" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="551" y="130" width="288" height="18" fill="#F3F6F9"/>
  <rect x="556" y="132" width="22" height="13" rx="3" fill="#3182CE"/><text x="567" y="139" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="600" y="139" font-size="10.5">requester_id</text><text x="830" y="139" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="556" y="151" width="22" height="13" rx="3" fill="#3182CE"/><text x="567" y="158" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="600" y="158" font-size="10.5">addressee_id</text><text x="830" y="158" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="551" y="168" width="288" height="18" fill="#F3F6F9"/>
  <text x="600" y="177" font-size="10.5">status (menunggu/diterima/ditolak)</text><text x="830" y="177" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <text x="600" y="196" font-size="10.5">created_at</text><text x="830" y="196" font-size="9" text-anchor="end" fill="#777">TIMESTAMP</text>
  <line x1="550" y1="108" x2="840" y2="108" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: user_blocks -->
  <rect x="150" y="80" width="290" height="160" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M150,108 L150,85 Q150,80 155,80 L435,80 Q440,80 440,85 L440,108 Z" fill="#2D3E50"/>
  <text x="295" y="94" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">user_blocks (Blokir Profil)</text>
  <rect x="156" y="113" width="22" height="13" rx="3" fill="#D69E2E"/><text x="167" y="120" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="200" y="120" font-size="10.5" font-weight="bold">block_id</text><text x="430" y="120" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="151" y="130" width="288" height="18" fill="#F3F6F9"/>
  <rect x="156" y="132" width="22" height="13" rx="3" fill="#3182CE"/><text x="167" y="139" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="200" y="139" font-size="10.5">blocker_id</text><text x="430" y="139" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="156" y="151" width="22" height="13" rx="3" fill="#3182CE"/><text x="167" y="158" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="200" y="158" font-size="10.5">blocked_id</text><text x="430" y="158" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="151" y="168" width="288" height="18" fill="#F3F6F9"/>
  <text x="200" y="177" font-size="10.5">alasan</text><text x="430" y="177" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <text x="200" y="196" font-size="10.5">created_at</text><text x="430" y="196" font-size="9" text-anchor="end" fill="#777">TIMESTAMP</text>
  <line x1="150" y1="108" x2="440" y2="108" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: portfolio_items -->
  <rect x="100" y="380" width="340" height="330" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M100,408 L100,385 Q100,380 105,380 L435,380 Q440,380 440,385 L440,408 Z" fill="#2D3E50"/>
  <text x="270" y="394" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">portfolio_items (SKPI &amp; Artikel)</text>
  <rect x="106" y="413" width="22" height="13" rx="3" fill="#D69E2E"/><text x="117" y="420" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="150" y="420" font-size="10.5" font-weight="bold">portfolio_id</text><text x="430" y="420" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="101" y="430" width="338" height="18" fill="#F3F6F9"/>
  <rect x="106" y="432" width="22" height="13" rx="3" fill="#3182CE"/><text x="117" y="439" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="150" y="439" font-size="10.5">user_id</text><text x="430" y="439" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <text x="150" y="458" font-size="10.5">judul</text><text x="430" y="458" font-size="9" text-anchor="end" fill="#777">VARCHAR(150)</text>
  <rect x="101" y="468" width="338" height="18" fill="#FEF3C7"/>
  <text x="150" y="477" font-size="10.5" font-weight="bold" fill="#B45309">kategori (proyek/skpi/sertif/artikel)</text><text x="430" y="477" font-size="9" text-anchor="end" fill="#B45309">ENUM</text>
  <text x="150" y="496" font-size="10.5">nomor_dokumen (No Sertif/DOI)</text><text x="430" y="496" font-size="9" text-anchor="end" fill="#777">VARCHAR(100)</text>
  <rect x="101" y="506" width="338" height="18" fill="#F3F6F9"/>
  <text x="150" y="515" font-size="10.5">penerbit (Jurnal/Instansi)</text><text x="430" y="515" font-size="9" text-anchor="end" fill="#777">VARCHAR(150)</text>
  <text x="150" y="534" font-size="10.5">tanggal_terbit</text><text x="430" y="534" font-size="9" text-anchor="end" fill="#777">DATE</text>
  <rect x="101" y="544" width="338" height="18" fill="#F3F6F9"/>
  <text x="150" y="553" font-size="10.5">file_url (Bukti PDF)</text><text x="430" y="553" font-size="9" text-anchor="end" fill="#777">VARCHAR(255)</text>
  <rect x="101" y="563" width="338" height="18" fill="#DCFCE7"/>
  <text x="150" y="572" font-size="10.5" font-weight="bold" fill="#166534">status_verifikasi (review/valid/reject)</text><text x="430" y="572" font-size="9" text-anchor="end" fill="#166534">ENUM</text>
  <rect x="106" y="583" width="22" height="13" rx="3" fill="#3182CE"/><text x="117" y="590" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="150" y="590" font-size="10.5">diverifikasi_oleh (Kaprodi)</text><text x="430" y="590" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="101" y="600" width="338" height="18" fill="#F3F6F9"/>
  <text x="150" y="609" font-size="10.5">catatan_verifikasi</text><text x="430" y="609" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <text x="150" y="628" font-size="10.5">verified_at</text><text x="430" y="628" font-size="9" text-anchor="end" fill="#777">TIMESTAMP</text>
  <line x1="100" y1="408" x2="440" y2="408" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: posts -->
  <rect x="950" y="380" width="320" height="290" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M950,408 L950,385 Q950,380 955,380 L1265,380 Q1270,380 1270,385 L1270,408 Z" fill="#2D3E50"/>
  <text x="1110" y="394" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">posts (Fokus Foto + Teks)</text>
  <rect x="956" y="413" width="22" height="13" rx="3" fill="#D69E2E"/><text x="967" y="420" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="1000" y="420" font-size="10.5" font-weight="bold">post_id</text><text x="1260" y="420" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="951" y="430" width="318" height="18" fill="#F3F6F9"/>
  <rect x="956" y="432" width="22" height="13" rx="3" fill="#3182CE"/><text x="967" y="439" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1000" y="439" font-size="10.5">user_id</text><text x="1260" y="439" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <text x="1000" y="458" font-size="10.5">isi (Caption Teks)</text><text x="1260" y="458" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <rect x="951" y="468" width="318" height="18" fill="#F3F6F9"/>
  <text x="1000" y="477" font-size="10.5">gambar_url (Media Foto)</text><text x="1260" y="477" font-size="9" text-anchor="end" fill="#777">VARCHAR(255)</text>
  <text x="1000" y="496" font-size="10.5">tipe (umum / cari_anggota)</text><text x="1260" y="496" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <rect x="951" y="506" width="318" height="18" fill="#F3F6F9"/>
  <text x="1000" y="515" font-size="10.5">status (tayang/direview/ditolak)</text><text x="1260" y="515" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <rect x="951" y="525" width="318" height="18" fill="#FEE2E2"/>
  <text x="1000" y="534" font-size="10.5" font-weight="bold" fill="#991B1B">is_deleted (Soft Delete)</text><text x="1260" y="534" font-size="9" text-anchor="end" fill="#991B1B">BOOLEAN</text>
  <text x="1000" y="553" font-size="10.5">deleted_at</text><text x="1260" y="553" font-size="9" text-anchor="end" fill="#777">TIMESTAMP</text>
  <rect x="951" y="563" width="318" height="18" fill="#F3F6F9"/>
  <rect x="956" y="565" width="22" height="13" rx="3" fill="#3182CE"/><text x="967" y="572" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1000" y="572" font-size="10.5">deleted_by (Kaprodi/Admin)</text><text x="1260" y="572" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <text x="1000" y="591" font-size="10.5">alasan_hapus</text><text x="1260" y="591" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <line x1="950" y1="408" x2="1270" y2="408" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: reports -->
  <rect x="1380" y="380" width="340" height="270" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M1380,408 L1380,385 Q1380,380 1385,380 L1715,380 Q1720,380 1720,385 L1720,408 Z" fill="#2D3E50"/>
  <text x="1550" y="394" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">reports (Laporan Pelanggaran)</text>
  <rect x="1386" y="413" width="22" height="13" rx="3" fill="#D69E2E"/><text x="1397" y="420" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="1430" y="420" font-size="10.5" font-weight="bold">report_id</text><text x="1710" y="420" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="1381" y="430" width="338" height="18" fill="#F3F6F9"/>
  <rect x="1386" y="432" width="22" height="13" rx="3" fill="#3182CE"/><text x="1397" y="439" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1430" y="439" font-size="10.5">post_id</text><text x="1710" y="439" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="1386" y="451" width="22" height="13" rx="3" fill="#3182CE"/><text x="1397" y="458" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1430" y="458" font-size="10.5">pelapor_id</text><text x="1710" y="458" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="1381" y="468" width="338" height="18" fill="#F3F6F9"/>
  <text x="1430" y="477" font-size="10.5">alasan</text><text x="1710" y="477" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <text x="1430" y="496" font-size="10.5">kategori_laporan (spam/ujaran/dll)</text><text x="1710" y="496" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <rect x="1381" y="506" width="338" height="18" fill="#F3F6F9"/>
  <text x="1430" y="515" font-size="10.5">status (baru/diproses/selesai)</text><text x="1710" y="515" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <rect x="1386" y="527" width="22" height="13" rx="3" fill="#3182CE"/><text x="1397" y="534" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1430" y="534" font-size="10.5">ditinjau_oleh (Kaprodi/Admin)</text><text x="1710" y="534" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="1381" y="544" width="338" height="18" fill="#F3F6F9"/>
  <text x="1430" y="553" font-size="10.5">tindakan_diambil (takedown/warning)</text><text x="1710" y="553" font-size="9" text-anchor="end" fill="#777">VARCHAR(50)</text>
  <text x="1430" y="572" font-size="10.5">catatan_tinjauan</text><text x="1710" y="572" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <line x1="1380" y1="408" x2="1720" y2="408" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: moderation_records -->
  <rect x="950" y="740" width="320" height="220" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M950,768 L950,745 Q950,740 955,740 L1265,740 Q1270,740 1270,745 L1270,768 Z" fill="#2D3E50"/>
  <text x="1110" y="754" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">moderation_records</text>
  <rect x="956" y="773" width="22" height="13" rx="3" fill="#D69E2E"/><text x="967" y="780" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="1000" y="780" font-size="10.5" font-weight="bold">moderation_id</text><text x="1260" y="780" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="951" y="790" width="318" height="18" fill="#F3F6F9"/>
  <rect x="956" y="792" width="22" height="13" rx="3" fill="#3182CE"/><text x="967" y="799" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1000" y="799" font-size="10.5">post_id</text><text x="1260" y="799" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="956" y="811" width="22" height="13" rx="3" fill="#3182CE"/><text x="967" y="818" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="1000" y="818" font-size="10.5">moderator_id (Kaprodi)</text><text x="1260" y="818" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="951" y="828" width="318" height="18" fill="#F3F6F9"/>
  <text x="1000" y="837" font-size="10.5">label_ai (aman/review/flagged)</text><text x="1260" y="837" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <text x="1000" y="856" font-size="10.5">confidence</text><text x="1260" y="856" font-size="9" text-anchor="end" fill="#777">FLOAT</text>
  <rect x="951" y="866" width="318" height="18" fill="#F3F6F9"/>
  <text x="1000" y="875" font-size="10.5">keputusan_moderator</text><text x="1260" y="875" font-size="9" text-anchor="end" fill="#777">ENUM</text>
  <text x="1000" y="894" font-size="10.5">catatan_admin</text><text x="1260" y="894" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <line x1="950" y1="768" x2="1270" y2="768" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- TABLE: recommendation_logs -->
  <rect x="550" y="740" width="290" height="200" rx="5" fill="#fff" stroke="#2D3E50" stroke-width="1.6" filter="url(#sh)"/>
  <path d="M550,768 L550,745 Q550,740 555,740 L835,740 Q840,740 840,745 L840,768 Z" fill="#2D3E50"/>
  <text x="695" y="754" font-size="13" text-anchor="middle" font-weight="bold" fill="#fff">recommendation_logs</text>
  <rect x="556" y="773" width="22" height="13" rx="3" fill="#D69E2E"/><text x="567" y="780" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">PK</text>
  <text x="600" y="780" font-size="10.5" font-weight="bold">rec_id</text><text x="830" y="780" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="551" y="790" width="288" height="18" fill="#F3F6F9"/>
  <rect x="556" y="792" width="22" height="13" rx="3" fill="#3182CE"/><text x="567" y="799" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="600" y="799" font-size="10.5">pemohon_id</text><text x="830" y="799" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="556" y="811" width="22" height="13" rx="3" fill="#3182CE"/><text x="567" y="818" font-size="8" text-anchor="middle" font-weight="bold" fill="#fff">FK</text>
  <text x="600" y="818" font-size="10.5">kandidat_id</text><text x="830" y="818" font-size="9" text-anchor="end" fill="#777">BIGINT</text>
  <rect x="551" y="828" width="288" height="18" fill="#F3F6F9"/>
  <text x="600" y="837" font-size="10.5">skor (Cosine Similarity)</text><text x="830" y="837" font-size="9" text-anchor="end" fill="#777">FLOAT</text>
  <text x="600" y="856" font-size="10.5">alasan (Skill Match)</text><text x="830" y="856" font-size="9" text-anchor="end" fill="#777">TEXT</text>
  <line x1="550" y1="768" x2="840" y2="768" stroke="#2D3E50" stroke-width="1.2"/>

  <!-- Lines -->
  <line x1="550" y1="460" x2="440" y2="460" stroke="#333" stroke-width="1.6"/>
  <line x1="840" y1="460" x2="950" y2="460" stroke="#333" stroke-width="1.6"/>
  <line x1="1270" y1="460" x2="1380" y2="460" stroke="#333" stroke-width="1.6"/>
  <line x1="1110" y1="670" x2="1110" y2="740" stroke="#333" stroke-width="1.6"/>
  <line x1="695" y1="380" x2="695" y2="260" stroke="#333" stroke-width="1.6"/>
  <line x1="550" y1="395" x2="360" y2="395" stroke="#333" stroke-width="1.6"/>
  <line x1="360" y1="395" x2="360" y2="240" stroke="#333" stroke-width="1.6"/>

  <!-- Notes & Legend -->
  <rect x="100" y="1030" width="1620" height="280" rx="8" fill="#FFFBEB" stroke="#B7791F" stroke-width="1.2" stroke-dasharray="4,3"/>
  <text x="130" y="1060" font-size="14" font-weight="bold" fill="#B45309">Catatan Desain Skema &amp; Nilai ENUM (v1.1):</text>
  <text x="130" y="1090" font-size="11" fill="#111">• users.role: 'mahasiswa' | 'moderator' (digunakan oleh masing-masing Kaprodi) | 'admin' (Kemahasiswaan universitas)</text>
  <text x="130" y="1115" font-size="11" fill="#111">• friendships.status: 'menunggu' | 'diterima' | 'ditolak'</text>
  <text x="130" y="1140" font-size="11" fill="#111">• portfolio_items.kategori: 'proyek' | 'skpi' | 'sertifikat' | 'artikel_ilmiah'</text>
  <text x="130" y="1165" font-size="11" fill="#111">• portfolio_items.status_verifikasi: 'draft' | 'menunggu_review' | 'terverifikasi' | 'ditolak' (oleh Kaprodi / Admin)</text>
  <text x="130" y="1190" font-size="11" fill="#111">• posts: fokus posting foto + teks, dilengkapi audit trail takedown (is_deleted, deleted_by, deleted_at, alasan_hapus)</text>
  <text x="130" y="1215" font-size="11" fill="#111">• reports.kategori_laporan: 'spam' | 'konten_tidak_pantas' | 'ujaran_kebencian' | 'misinformasi' | 'plagiarisme' | 'lainnya'</text>
  <text x="130" y="1240" font-size="11" fill="#111">• user_blocks: mencegah interaksi timbal balik &amp; menyembunyikan profil serta postingan di Dashboard Home</text>
  <text x="130" y="1265" font-size="11" fill="#111">• Dashboard Home terpadu: memadukan feed terkini, friend requests, capaian SKPI terverifikasi, dan antrean review Kaprodi</text>
</svg>"""
    with open("docs/diagrams/erd.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    print("[OK] docs/diagrams/erd.svg generated.")

def generate_all():
    create_use_case_svg()
    create_erd_svg()
    create_activity_posting_moderasi_svg()
    create_activity_pencarian_rekomendasi_svg()
    create_activity_portofolio_skpi_svg()
    print("All diagrams generated successfully!")

if __name__ == "__main__":
    generate_all()
