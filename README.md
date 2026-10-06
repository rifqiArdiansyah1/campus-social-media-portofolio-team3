# CampusFolio — Campus Social Media & Portfolio (Team 3)

[![Status](https://img.shields.io/badge/Status-Sprint%200%20%2F%20Pertemuan%201-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

Aplikasi sosial media dan portofolio terpadu mahasiswa untuk memamerkan karya, menemukan rekan kolaborasi dengan keahlian yang saling melengkapi menggunakan rekomendasi berbasis AI teks, serta berinteraksi dalam lingkungan kampus yang aman dengan moderasi cerdas berprinsip *human-in-the-loop*.

---

## 🎯 Problem Statement

> *"Mahasiswa yang ingin membentuk tim proyek membutuhkan cara yang lebih mudah untuk menemukan teman dengan skill dan minat yang saling melengkapi, karena keahlian dan portofolio mereka saat ini tersebar di berbagai tempat dan sulit ditelusuri. Kondisi tersebut membuat tim terbentuk tanpa komposisi kemampuan yang sesuai dengan kebutuhan proyek. Aplikasi **CampusFolio** hadir menyediakan wadah profil, portofolio, feed posting, dan pencarian, serta rekomendasi kolaborator berbasis AI teks agar mahasiswa dapat menemukan rekan yang relevan secara cepat, tepat, dan dalam ruang interaksi kampus yang aman."*

---

## 👥 Tim Pengembang (Team 3)

| Peran | Nama Anggota | Tanggung Jawab Utama |
| --- | --- | --- |
| **Hacker** | **Moh. Rifqi Dwi Ardiansyah** | Git repository lead, Backend, Data architecture, Pipeline AI |
| **Hipster** | *(Dikonfirmasi Tim)* | UI/UX Design, Wireframe/Mockup, User Research |
| **Hustler** | *(Dikonfirmasi Tim)* | Product Strategy, Backlog prioritization, AI Hypothesis, Pitching |
| **Project Manager** | **Antigravity AI (PM Assistant) & Tim** | Sprint Tracking, Backlog Grooming, Governance & DoD Checklist |

---

## 🛠️ Rencana Tumpukan Teknologi (Tech Stack)

Berdasarkan usulan pada [ADR-0001: Pilihan Teknologi](docs/decisions/ADR-0001-pilihan-teknologi.md):
- **Frontend / Client:** Mobile App (Flutter / React Native Expo) atau Web PWA
- **Backend / API:** RESTful API (Node.js / Python FastAPI / Supabase)
- **Database:** PostgreSQL (Relational schema + Full-text search / pgvector)
- **Modul AI:** 
  - *Baseline Rekomendasi:* TF-IDF + Cosine Similarity / Text Embedding (NLP)
  - *Moderasi Teks:* Contextual Text Classifier / LLM API dengan format output JSON terstruktur

---

## ⚠️ Batasan Penggunaan AI (Penting)

1. **Rekomendasi bersifat saran**, bukan keputusan mutlak. Pengguna memegang kendali penuh.
2. **Moderasi konten sensitif wajib ditinjau manusia** (*Human-in-the-Loop*). AI tidak menghapus postingan secara permanen tanpa verifikasi admin.
3. Algoritma dapat mengalami bias pada variasi istilah keahlian; pengguna dapat menyunting tag kapan saja.
4. **Prinsip Graceful Degradation:** Kegagalan layanan AI tidak akan melumpuhkan fungsi inti (CRUD profil, portofolio, dan postingan tetap berjalan normal).

---

## 📁 Struktur Repositori & Dokumentasi

Dokumentasi lengkap proyek tersusun rapi di direktori [`docs/`](docs/):

```text
campus-social-media-portofolio-team3/
├── README.md                          # Informasi umum & ringkasan proyek
├── CONTRIBUTING.md                    # Aturan branching, commit conventions, dan PR
├── .gitignore                         # Pengabaian file build, env, dan cache
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── user-story.md              # Template pembuatan User Story issue
│   │   └── bug-report.md              # Template pelaporan bug
│   └── PULL_REQUEST_TEMPLATE.md       # Standar deskripsi Pull Request
├── docs/                              # Artefak resmi perkuliahan
│   ├── 01-project-brief.md            # Brief proyek, scope, dan batasan
│   ├── 02-problem-statement.md        # Formula analisis masalah pengguna
│   ├── 03-product-goal.md             # Tujuan produk & pilar keberhasilan
│   ├── 04-prd.md                      # Product Requirements Document lengkap
│   ├── 05-initial-backlog.md          # 12 User Story dengan prioritas MoSCoW
│   ├── 06-role-assignment.md          # Pembagian peran & tanggung jawab tim
│   ├── 07-ai-hypothesis.md            # Hipotesis, why not if-else, & output schema
│   ├── decisions/
│   │   └── ADR-0001-pilihan-teknologi.md
│   └── research/
│       └── pertanyaan-wawancara.md    # Panduan wawancara 5 responden
├── ai/
│   ├── prompts/                       # Template prompt sistem
│   ├── schemas/                       # JSON Schema output AI
│   └── eval/                          # Dataset evaluasi dan uji akurasi
└── src/                               # Implementasi kode aplikasi (Sprint 1)
```

---

## 🚦 Alur Berkontribusi

Silakan baca [`CONTRIBUTING.md`](CONTRIBUTING.md) sebelum mulai mengerjakan fitur atau membuka branch baru.
1. Buat branch baru dari `develop` (`feature/US-xx-<nama>` atau `docs/<topik>`).
2. Tulis commit dengan konvensi standar (`docs: ...`, `feat: ...`, `fix: ...`).
3. Ajukan Pull Request ke `develop` dan hubungkan dengan issue terkait.