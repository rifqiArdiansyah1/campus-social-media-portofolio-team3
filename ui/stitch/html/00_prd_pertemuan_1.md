# PRD & Paket Pertemuan 1 — Campus Social Media/Portfolio (Team 3)

Disusun oleh: Project Management Assistant • Pertemuan 1 • 6 Oktober 2026 • Status: **Draft v0.1** (untuk didiskusikan dan disepakati tim)

> Catatan: semua isian bertanda **\[ISI\]** atau **(usulan)** adalah placeholder yang harus dikonfirmasi tim. Nama proyek, teknologi, dan nama anggota belum diketahui dari materi kelas.

## 1. Ringkasan Eksekutif

Mahasiswa memiliki keahlian dan portofolio yang tersebar di banyak tempat, sehingga sulit menemukan teman dengan minat atau kemampuan yang saling melengkapi. Aplikasi ini menyediakan profil, portofolio, posting, dan pencarian. AI berbasis teks dipakai untuk (1) merekomendasikan teman/kolaborator berdasarkan kemiripan skill dan minat, dan (2) membantu klasifikasi awal konten posting untuk moderasi, dengan **human review** sebagai keputusan akhir.

## 2. Project Brief

| Elemen | Isi |
| --- | --- |
| Nama proyek | **CampusFolio** (usulan, bisa diganti) |
| Kasus | Kasus 3 — Campus Social Media/Portfolio |
| Masalah | Keahlian dan portofolio mahasiswa tersebar; sulit menemukan rekan proyek dengan skill/minat yang saling melengkapi; konten buatan pengguna perlu dimoderasi |
| Pengguna utama | Mahasiswa |
| Pengguna pendukung | Admin/moderator kampus atau organisasi |
| Tujuan | Mahasiswa dapat menampilkan profil dan portofolio, menemukan kolaborator yang relevan, dan berinteraksi lewat posting dengan konten yang tetap aman |
| Data awal | Profil, skill, minat, portofolio, posting |
| Scope MVP | Profil, portofolio, posting, dan pencarian (+ prototipe AI sederhana) |
| Batasan | Rekomendasi bukan keputusan mutlak; moderasi sensitif wajib review manusia |

## 3. Problem Statement

Menggunakan pola dari kelas:

| Bagian | Pertanyaan pemicu | Isian untuk proyek ini |
| --- | --- | --- |
| Pengguna | Siapa yang mengalami masalah? | Mahasiswa yang punya skill/portofolio dan ingin mencari rekan proyek |
| Situasi | Kapan masalah terjadi? | Saat membentuk tim tugas, lomba, atau proyek kampus |
| Masalah | Apa hambatan yang dialami? | Skill dan portofolio tersebar, tidak ada tempat terpusat, sulit tahu siapa yang cocok |
| Dampak | Apa akibatnya? | Tim terbentuk seadanya, skill tidak saling melengkapi, peluang kolaborasi terlewat |
| Kebutuhan | Apa hasil yang dibutuhkan? | Profil/portofolio terpusat dan pencarian + rekomendasi kolaborator yang relevan |

**Problem statement (versi paragraf):**

> "Mahasiswa yang ingin membentuk tim proyek membutuhkan cara yang lebih mudah untuk menemukan teman dengan skill dan minat yang saling melengkapi, karena keahlian dan portofolio mereka tersebar di berbagai tempat dan sulit ditelusuri. Kondisi tersebut membuat tim terbentuk tanpa komposisi kemampuan yang sesuai dengan kebutuhan proyek. Aplikasi akan menyediakan profil, portofolio, posting, dan pencarian, serta rekomendasi kolaborator berbasis teks agar mahasiswa menemukan rekan yang relevan dengan lebih cepat."

Pengingat dari dosen: tulis masalah dari **sudut pandang pengguna**, bukan dari teknologi. Fitur dan kebutuhan AI diputuskan setelah masalah jelas.

## 4. Product Goal

> Membantu mahasiswa menampilkan keahlian mereka dan menemukan kolaborator yang tepat dengan cepat, dalam lingkungan kampus yang aman.

## 5. Pengguna dan Persona

**Persona 1 — Mahasiswa pencari tim (utama).** Punya skill (misal UI design), butuh developer untuk lomba. Ingin cepat melihat portofolio calon rekan dan alasan mengapa seseorang cocok.

**Persona 2 — Mahasiswa pemilik portofolio.** Ingin karyanya terlihat, mendapat tawaran kolaborasi, dan membangun reputasi.

**Persona 3 — Admin/moderator.** Ingin antrean konten bermasalah yang sudah dipilah awal, sehingga review lebih cepat tanpa kehilangan kendali.

## 6. Scope

**In scope (MVP):**

- Autentikasi (login/logout) dan profil mahasiswa (nama, jurusan, bio, skill, minat)
- Portofolio (judul, deskripsi, tautan/gambar, tag skill)
- Posting (teks, opsi "mencari anggota proyek")
- Pencarian mahasiswa/portofolio/posting berdasarkan kata kunci dan tag
- Prototipe AI: rekomendasi kemiripan dan klasifikasi awal konten
- Antrean moderasi sederhana untuk admin

**Out of scope (MVP):**

- Chat real-time, video call, notifikasi push kompleks
- Integrasi SSO kampus penuh (dipertimbangkan setelah MVP)
- Sistem follow/like/komentar kompleks, monetisasi
- Moderasi gambar/video otomatis

## 7. Initial Backlog (User Story)

Format: *Sebagai \[jenis pengguna\], saya ingin \[kebutuhan\], sehingga \[manfaat\].* Prioritas memakai MoSCoW.

| ID | User Story | Prioritas | Pemilik awal |
| --- | --- | --- | --- |
| US-01 | Sebagai mahasiswa, saya ingin login agar data saya dapat dikaitkan dengan akun. | Must | Hacker |
| US-02 | Sebagai mahasiswa, saya ingin membuat dan mengedit profil (skill, minat, bio) agar orang lain tahu kemampuan saya. | Must | Hacker/Hipster |
| US-03 | Sebagai mahasiswa, saya ingin menambahkan portofolio agar karya saya dapat dilihat orang lain. | Must | Hacker |
| US-04 | Sebagai mahasiswa, saya ingin membuat posting agar dapat berbagi informasi atau mencari anggota proyek. | Must | Hacker |
| US-05 | Sebagai mahasiswa, saya ingin mencari mahasiswa berdasarkan skill atau minat agar menemukan rekan yang sesuai. | Must | Hustler |
| US-06 | Sebagai mahasiswa, saya ingin melihat detail profil dan portofolio mahasiswa lain agar dapat menilai kecocokan. | Must | Hipster |
| US-07 | Sebagai mahasiswa, saya ingin melihat rekomendasi teman yang skill/minatnya melengkapi saya agar pencarian lebih cepat. | Should | Hustler |
| US-08 | Sebagai mahasiswa, saya ingin menulis kebutuhan proyek dan mendapat rekomendasi calon anggota agar tim terbentuk lebih cepat. | Should | Hustler |
| US-09 | Sebagai admin, saya ingin konten diberi klasifikasi awal oleh sistem agar review lebih efisien. | Should | Hustler/Hacker |
| US-10 | Sebagai admin, saya ingin meninjau antrean konten yang ditandai agar keputusan akhir tetap di tangan manusia. | Should | Hacker |
| US-11 | Sebagai mahasiswa, saya ingin melaporkan konten yang tidak pantas agar lingkungan tetap aman. | Should | Hipster |
| US-12 | Sebagai mahasiswa, saya ingin keluar dari akun agar akses di perangkat dapat dihentikan. | Should | Hipster/Hacker |

Cadangan (Could): tautan eksternal (GitHub, Behance, LinkedIn), filter jurusan/angkatan, bookmark profil.

## 8. Functional Requirements

| Kode | Requirement | Story terkait |
| --- | --- | --- |
| FR-01 | Sistem mendukung registrasi/login dan logout | US-01, US-12 |
| FR-02 | Pengguna dapat membuat, mengubah profil dengan field skill dan minat | US-02 |
| FR-03 | Pengguna dapat membuat, mengubah, menghapus item portofolio | US-03 |
| FR-04 | Pengguna dapat membuat posting bertipe umum atau "cari anggota" | US-04, US-08 |
| FR-05 | Pencarian berdasarkan kata kunci, skill, minat | US-05 |
| FR-06 | Halaman detail profil dan portofolio | US-06 |
| FR-07 | Rekomendasi kolaborator dengan skor dan alasan | US-07, US-08 |
| FR-08 | Klasifikasi awal posting sebelum/sesudah tayang | US-09 |
| FR-09 | Antrean moderasi dengan aksi setujui, tolak, minta revisi | US-10 |
| FR-10 | Tombol laporkan konten | US-11 |

## 9. Non-Functional Requirements

- **Keamanan:** password di-hash, token sesi aman, validasi input
- **Privasi:** hanya data profil yang dipublikasikan pengguna yang dipakai AI; pengguna dapat menghapus akun dan datanya
- **Kinerja (usulan):** pencarian kurang dari 2 detik pada data awal; rekomendasi kurang dari 3 detik
- **Ketersediaan AI:** aplikasi tetap berfungsi penuh jika layanan AI gagal (fallback)
- **Keterjelasan:** setiap rekomendasi menampilkan alasan singkat
- **Aksesibilitas:** kontras dan ukuran teks memadai, navigasi sederhana

## 10. AI Hypothesis

Prinsip dari kelas: AI harus punya tugas jelas, alasan kuat mengapa bukan if-else, input dan output terdefinisi, serta penanganan jika AI salah.

### AI-1: Rekomendasi kemiripan skill/minat

| Pertanyaan | Jawaban |
| --- | --- |
| Masalah apa yang dibantu AI? | Pemahaman bahasa: mencocokkan teks skill/minat/kebutuhan proyek antar mahasiswa |
| Mengapa bukan if-else? | Skill ditulis bebas dan bervariasi ("ngoding web", "frontend", "React", "UI dev"). Pencocokan kata persis melewatkan sinonim dan konteks |
| Input AI | Teks: bio, daftar skill, minat, deskripsi portofolio, teks kebutuhan proyek |
| Output yang diharapkan | JSON terstruktur dan dapat divalidasi (contoh di bawah) |
| Jika AI salah? | Fallback ke pencarian kata kunci/tag; ambang skor minimum; tombol "tidak relevan"; rekomendasi hanya saran, bukan keputusan |

Contoh output:

```json
{
  "query_user_id": "u_102",
  "recommendations": [
    {
      "user_id": "u_245",
      "score": 0.82,
      "matched_terms": ["flutter", "backend"],
      "complementary_skills": ["ui design"],
      "reason": "Memiliki skill backend yang melengkapi profil Anda"
    }
  ]
}
```

Pendekatan awal (usulan, bertahap): TF-IDF + cosine similarity untuk baseline, lalu embedding teks atau LLM untuk kemiripan semantik dan alasan.

### AI-2: Klasifikasi awal konten untuk moderasi

| Pertanyaan | Jawaban |
| --- | --- |
| Masalah apa yang dibantu AI? | Klasifikasi teks posting menjadi aman / perlu review / berpotensi melanggar |
| Mengapa bukan if-else? | Daftar kata terlarang mudah dikelabui dan salah menandai konteks yang wajar; bahasa gaul dan campuran bahasa sulit ditangani aturan sederhana |
| Input AI | Teks posting (dan laporan pengguna) |
| Output yang diharapkan | Label, kategori, confidence, penjelasan singkat |
| Jika AI salah? | Confidence rendah masuk review manusia; AI tidak pernah menghapus konten otomatis untuk kasus sensitif; admin bisa membalik keputusan; log keputusan disimpan |

Contoh output:

```json
{
  "post_id": "p_881",
  "label": "perlu_review",
  "categories": ["ujaran_kasar"],
  "confidence": 0.64,
  "explanation": "Mengandung kata kasar yang ditujukan ke individu"
}
```

### Batasan AI (wajib dicantumkan di README)

1. Rekomendasi bukan keputusan mutlak
2. Moderasi sensitif memerlukan review manusia
3. AI dapat bias terhadap penulisan skill tertentu; pengguna bisa mengedit tag sendiri
4. Kegagalan AI tidak boleh menghentikan fitur inti

## 11. Model Data Awal

- **User**: id, nama, email, jurusan, angkatan, bio, peran (mahasiswa/admin)
- **Skill/Interest**: id, nama, tipe; relasi many-to-many ke User
- **PortfolioItem**: id, user\_id, judul, deskripsi, tautan/gambar, tag
- **Post**: id, user\_id, isi, tipe (umum/cari\_anggota), status (tayang/direview/ditolak)
- **ModerationRecord**: id, post\_id, label\_ai, confidence, keputusan\_admin, catatan
- **Report**: id, post\_id, pelapor\_id, alasan

## 12. Role Assignment

Peran mengikuti model Hacker–Hipster–Hustler. Isi nama anggota pada kolom kedua.

| Peran | Nama | Ruang lingkup utama |
| --- | --- | --- |
| **Hacker** | \[ISI\] | GitHub repository (README, docs, issue, branch, commit), arsitektur, backend/autentikasi, integrasi AI |
| **Hipster** | \[ISI\] | Riset pengguna, UI/UX, wireframe, alur layar, konsistensi desain |
| **Hustler** | \[ISI\] | Problem statement, nilai produk, prioritas backlog, AI hypothesis, metrik, presentasi |
| Seluruh tim | — | Project brief, product goal, initial backlog, role assignment |

Jika tim berisi empat orang, tambahkan satu **Project Manager/Scrum Master** untuk memantau backlog, jadwal sprint, dan kelengkapan artefak.

## 13. Struktur Direktori Repository

Nama repo mengikuti contoh dosen: `mobile-<nama-proyek>-team<no>` (usulan: **mobile-campus-portfolio-team3**).

```text
mobile-campus-portfolio-team3/
├── README.md                      # nama proyek, problem statement sementara, anggota, teknologi
├── CONTRIBUTING.md                # aturan branch, commit, pull request
├── .gitignore
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── user-story.md
│   │   └── bug-report.md
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                          # project brief, diagram, dokumentasi keputusan
│   ├── 01-project-brief.md
│   ├── 02-problem-statement.md
│   ├── 03-product-goal.md
│   ├── 04-prd.md
│   ├── 05-initial-backlog.md
│   ├── 06-role-assignment.md
│   ├── 07-ai-hypothesis.md
│   ├── decisions/
│   │   └── ADR-0001-pilihan-teknologi.md
│   ├── diagrams/                  # use case, ERD, alur layar
│   └── research/
│       └── pertanyaan-wawancara.md
├── ai/
│   ├── prompts/
│   ├── schemas/                   # JSON schema output rekomendasi dan moderasi
│   └── eval/                      # contoh data uji dan hasil evaluasi
└── src/                           # kode aplikasi (diisi mulai sprint berikutnya)
```

**Strategi branch (usulan):**

- `main` — selalu stabil, tidak boleh commit langsung
- `develop` — integrasi
- `docs/<topik>`, `feature/US-xx-<nama>`, `fix/<nama>`

**Konvensi commit:** `docs: tambah project brief`, `feat: halaman profil (US-02)`, `fix: ...`

**Template README.md awal:**

```markdown
# CampusFolio — Campus Social Media/Portfolio (Team 3)
## Problem Statement (sementara)
[tempel paragraf problem statement]
## Anggota Tim
- [Nama] — Hacker
- [Nama] — Hipster
- [Nama] — Hustler
## Teknologi yang Direncanakan
[ISI: framework, backend, database, layanan AI]
## Dokumentasi
Lihat folder docs/
```

## 14. Checklist Langkah Praktikum (Pertemuan 1)

| # | Langkah | PJ | Status |
| --- | --- | --- | --- |
| 1 | Tentukan akun/organisasi GitHub pemilik repo sesuai kebijakan kelas | Hacker | ☐ |
| 2 | Buat repository dengan nama mudah dikenali | Hacker | ☐ |
| 3 | Tambahkan deskripsi singkat berisi problem yang diselesaikan | Hacker | ☐ |
| 4 | Tambahkan tiga anggota tim sebagai collaborator | Hacker | ☐ |
| 5 | Buat README.md awal (nama proyek, problem statement sementara, anggota, teknologi) | Hacker + Hustler | ☐ |
| 6 | Buat folder docs/ (project brief, diagram, keputusan) | Hacker | ☐ |
| 7 | Buat beberapa issue awal dari backlog yang disepakati | Seluruh tim | ☐ |
| 8 | Buat branch awal sesuai strategi; hindari kerja langsung di main | Hacker | ☐ |
| 9 | Commit dokumentasi pertama | Seluruh tim | ☐ |
| 10 | Pull request kecil untuk menguji alur review | Seluruh tim | ☐ |

**Issue awal yang disarankan:** satu issue per US-01 s.d. US-06 (label `must`), ditambah `docs: lengkapi AI hypothesis`, `design: wireframe profil & pencarian`, `research: wawancara 5 mahasiswa`.

## 15. Artefak yang Wajib Dikumpulkan

| Artefak | Isi minimal | PJ utama | Lokasi | Status |
| --- | --- | --- | --- | --- |
| Project Brief | Nama proyek, masalah, pengguna, tujuan, scope MVP | Seluruh tim | docs/01 (bagian 2 dokumen ini) | Draft siap |
| Problem Statement | 1 paragraf spesifik berorientasi pengguna | Hustler + seluruh tim | docs/02 (bagian 3) | Draft siap |
| Product Goal | 1 kalimat hasil utama | Seluruh tim | docs/03 (bagian 4) | Draft siap |
| Initial Backlog | 8–12 user story terurut prioritas | Seluruh tim | docs/05 (bagian 7) | 12 story siap |
| Role Assignment | Hacker, Hipster, Hustler dan ruang lingkupnya | Seluruh tim | docs/06 (bagian 12) | Perlu nama |
| GitHub Repository | README, docs, issue, branch, minimal commit | Hacker | GitHub | Belum dibuat |
| AI Hypothesis | Masalah AI, input, output, batasan, failure handling | Hustler | docs/07 (bagian 10) | Draft siap |

**Definition of Done Pertemuan 1:** ketujuh artefak ada **di repository** (bukan hanya di presentasi), ada minimal satu commit dokumentasi dan satu PR. Dosen dapat menolak status "selesai" jika hanya ada presentasi tanpa bukti kerja di repository.

## 16. Pertanyaan yang Perlu Dikumpulkan

### A. Pertanyaan pemicu problem statement (jawab sebagai tim)

1. **Pengguna:** Siapa yang paling sering kesulitan mencari rekan proyek? Semua mahasiswa, atau angkatan/jurusan tertentu?
2. **Situasi:** Kapan tepatnya? Tugas kelompok, lomba, magang, proyek organisasi?
3. **Masalah:** Apa hambatan konkret saat ini (grup WhatsApp, Instagram, LinkedIn, tanya teman)?
4. **Dampak:** Apa akibat nyata? Waktu terbuang, tim tidak seimbang, peluang terlewat?
5. **Kebutuhan:** Hasil seperti apa yang dianggap berhasil oleh pengguna?

### B. Pertanyaan hipotesis AI (jawab sebagai tim)

1. Tugas AI apa yang jelas (klasifikasi, ekstraksi, generasi, pemahaman bahasa)?
2. Mengapa pencarian kata kunci/if-else saja tidak cukup untuk kasus ini?
3. Teks apa saja yang menjadi input? Apakah ada data pribadi yang sensitif?
4. Output apa yang diharapkan, dan apakah bisa divalidasi lewat skema JSON?
5. Apa yang terjadi jika AI salah, dan siapa yang bertanggung jawab meninjau?
6. Layanan/model AI apa yang dipakai, berapa biaya dan batas pemakaiannya?

### C. Pertanyaan wawancara untuk mahasiswa (minimal 5 responden)

1. Bagaimana cara Anda mencari teman satu tim untuk tugas atau lomba terakhir?
2. Apa yang paling menyulitkan dalam proses itu?
3. Informasi apa tentang calon rekan yang Anda perlukan sebelum setuju (skill, portofolio, ketersediaan, gaya kerja)?
4. Di mana portofolio Anda saat ini disimpan? Apakah Anda mau menampilkannya di aplikasi kampus?
5. Apakah Anda nyaman jika skill dan minat Anda dipakai sistem untuk rekomendasi?
6. Seberapa Anda percaya pada rekomendasi otomatis? Apa yang membuat Anda mau mengikutinya?
7. Konten apa di media sosial kampus yang menurut Anda perlu dimoderasi?
8. Siapa yang menurut Anda pantas menjadi moderator?
9. Fitur apa yang pasti Anda pakai setiap minggu, dan fitur apa yang tidak perlu?

### D. Pertanyaan untuk dosen/pihak kampus

1. Akun/organisasi GitHub mana yang menjadi owner repository sesuai kebijakan kelas?
2. Apakah platform wajib mobile? Adakah batasan teknologi?
3. Apakah boleh memakai layanan AI berbayar/API eksternal? Bagaimana dengan batas biaya?
4. Apakah data mahasiswa sungguhan boleh dipakai, atau cukup data dummy?
5. Apakah ada kebijakan kampus tentang konten dan moderasi yang harus diikuti?
6. Format dan tenggat pengumpulan artefak, serta rubrik penilaiannya?

### E. Pertanyaan internal tim (keputusan terbuka)

1. Nama proyek final?
2. Tumpukan teknologi (framework mobile, backend, database)?
3. Apakah posting dimoderasi sebelum tayang atau sesudah tayang?
4. Apakah login memakai email kampus saja?
5. Siapa yang menjadi admin pada tahap demo?
6. Hari dan jam pertemuan rutin tim, serta kanal komunikasi?

## 17. Metrik Keberhasilan (usulan, divalidasi tim)

| Metrik | Target awal |
| --- | --- |
| Profil terisi lengkap (skill + minat + 1 portofolio) | 70% pengguna uji |
| Waktu menemukan calon rekan relevan | kurang dari 3 menit pada uji pengguna |
| Rekomendasi dinilai relevan oleh pengguna uji | minimal 60% (3 dari 5 teratas) |
| Konten bermasalah tertangkap sebagai "perlu review" | minimal 80% pada data uji |
| Keputusan moderasi akhir oleh manusia | 100% untuk kategori sensitif |

## 18. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Data awal terlalu sedikit untuk rekomendasi | Rekomendasi tidak bermakna | Seed data dummy 30–50 profil; fallback pencarian |
| Ruang lingkup membengkak | MVP tidak selesai | Pegang scope: profil, portofolio, posting, pencarian |
| AI salah menandai konten | Pengguna kesal, bias | Human review, ambang confidence, mekanisme banding |
| Privasi data mahasiswa | Pelanggaran kepercayaan | Data minimal, persetujuan eksplisit, opsi hapus akun |
| Anggota tidak aktif di repo | Dosen menolak status selesai | Aturan PR wajib, review bergilir, pantau commit |
| Biaya/batas API AI | Fitur AI terhenti | Mulai dengan baseline TF-IDF; batasi pemanggilan |

## 19. Rencana Sprint Awal (usulan)

- **Pertemuan 1 (sekarang):** problem statement, backlog, role, AI hypothesis, repo + 1 PR
- **Sprint 1:** wireframe profil/pencarian, wawancara 5 mahasiswa, setup proyek, US-01 s.d. US-03
- **Sprint 2:** US-04 s.d. US-06, seed data, baseline rekomendasi (US-07)
- **Sprint 3:** moderasi (US-09 s.d. US-11), evaluasi AI, polishing dan demo

## 20. Langkah Berikutnya (Action Items)

1. Tim sepakati nama proyek dan isi nama pada Role Assignment (semua)
2. Hacker membuat repo dan menambahkan collaborator (hari ini)
3. Salin isi dokumen ini ke `docs/` sesuai struktur bagian 13
4. Hustler memfinalkan AI hypothesis setelah menjawab pertanyaan bagian 16B
5. Hipster menyiapkan wawancara (bagian 16C) dan wireframe awal
6. Buat issue dari backlog, lalu commit dan PR pertama untuk bukti kerja
