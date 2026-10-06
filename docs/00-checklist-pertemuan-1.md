# 00 — Checklist & Pelacak Definition of Done (Pertemuan 1)

**Proyek:** CampusFolio (Team 3)  
**Status Sesi:** Pertemuan 1 (Kickoff & Fondasi Proyek)  
**Terakhir Diperbarui:** 6 Oktober 2026  
**Penanggung Jawab:** Project Manager Assistant & Tim  

---

## 1. Status Checklist Langkah Praktikum (Pertemuan 1)

Sesuai panduan modul perkuliahan:

| No | Aktivitas Praktikum | Penanggung Jawab | Status | Catatan / Bukti |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Tentukan akun/organisasi GitHub pemilik repo | Hacker | **SELESAI** | Akun: `rifqiArdiansyah1` |
| **2** | Buat repository dengan nama mudah dikenali | Hacker | **SELESAI** | `campus-social-media-portofolio-team3` |
| **3** | Tambahkan deskripsi singkat berisi problem yang diselesaikan | Hacker | **SELESAI** | Deskripsi repo telah diperbarui di GitHub |
| **4** | Tambahkan anggota tim sebagai collaborator | Hacker | **ONGOING** | Menunggu konfirmasi username GitHub anggota Hipster & Hustler |
| **5** | Buat `README.md` awal komprehensif | Hacker + Hustler | **SELESAI** | Berisi problem statement, susunan tim, tech stack, dan index docs |
| **6** | Buat folder `docs/` lengkap dengan 7 artefak wajib | Hacker + PM | **SELESAI** | Artefak 01 s.d. 07, ADR-0001, dan panduan wawancara siap |
| **7** | Buat issue awal dari backlog yang disepakati | Seluruh Tim | **SELESAI** | 9 Issue telah dibuat di GitHub (#1 s.d. #9) |
| **8** | Buat branch awal sesuai strategi (`main` & `develop`) | Hacker | **SELESAI** | Branch `main` & `develop` telah terdorong ke GitHub |
| **9** | Commit dokumentasi pertama | Seluruh Tim | **SELESAI** | Commit dokumentasi awal berhasil dilakukan |
| **10** | Buat Pull Request untuk menguji alur review | Seluruh Tim | **SELESAI** | PR pengujian alur review siap di branch `develop` |

---

## 2. Matriks 7 Artefak Wajib Pertemuan 1 (Definition of Done)

| Artefak | Lokasi Berkas | Status Dokumen | Keterangan |
| :--- | :--- | :---: | :--- |
| **1. Project Brief** | [`docs/01-project-brief.md`](01-project-brief.md) | ✅ Lengkap | Mencakup masalah, pengguna, tujuan, data awal, scope MVP, dan batasan. |
| **2. Problem Statement** | [`docs/02-problem-statement.md`](02-problem-statement.md) | ✅ Lengkap | Analisis 5 pilar (Pengguna, Situasi, Masalah, Dampak, Kebutuhan) & versi paragraf. |
| **3. Product Goal** | [`docs/03-product-goal.md`](03-product-goal.md) | ✅ Lengkap | 1 kalimat tujuan utama dan 3 pilar keberhasilan. |
| **4. PRD Lengkap** | [`docs/04-prd.md`](04-prd.md) | ✅ Lengkap | Scope MVP, Persona, FR-01 s.d. FR-10, NFR, Model Data, Metrik, Risiko. |
| **5. Initial Backlog** | [`docs/05-initial-backlog.md`](05-initial-backlog.md) | ✅ Lengkap | 12 User Story (MoSCoW) lengkap dengan PIC peran dan Acceptance Criteria. |
| **6. Role Assignment** | [`docs/06-role-assignment.md`](06-role-assignment.md) | ✅ Lengkap | Pembagian peran Hacker, Hipster, Hustler, dan Project Manager. |
| **7. AI Hypothesis** | [`docs/07-ai-hypothesis.md`](07-ai-hypothesis.md) | ✅ Lengkap | AI-1 Rekomendasi & AI-2 Moderasi teks, why not if-else, batasan, dan skema JSON. |

---

## 3. Artefak Pelengkap Tambahan

- **Tata Kelola Kolaborasi:** [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- **Keputusan Arsitektur:** [`docs/decisions/ADR-0001-pilihan-teknologi.md`](decisions/ADR-0001-pilihan-teknologi.md)
- **Riset Pengguna:** [`docs/research/pertanyaan-wawancara.md`](research/pertanyaan-wawancara.md)
- **Skema Validasi AI:**
  - [`ai/schemas/recommendation-output.schema.json`](../ai/schemas/recommendation-output.schema.json)
  - [`ai/schemas/moderation-output.schema.json`](../ai/schemas/moderation-output.schema.json)
- **GitHub Templates:**
  - User Story Issue Template: [`.github/ISSUE_TEMPLATE/user-story.md`](../.github/ISSUE_TEMPLATE/user-story.md)
  - Bug Report Issue Template: [`.github/ISSUE_TEMPLATE/bug-report.md`](../.github/ISSUE_TEMPLATE/bug-report.md)
  - Pull Request Template: [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md)

---

## 4. Tindak Lanjut Tim (Action Items Berikutnya)

1. **Seluruh Tim:** Isi nama lengkap anggota tim untuk peran **Hipster** dan **Hustler** di [`docs/06-role-assignment.md`](06-role-assignment.md).
2. **Hacker:** Tambahkan akun GitHub anggota tim sebagai collaborator di repository setting.
3. **Hipster:** Mulai wawancara dengan 5 responden mahasiswa menggunakan panduan [`docs/research/pertanyaan-wawancara.md`](research/pertanyaan-wawancara.md).
4. **Hustler:** Susun slide deck presentasi ringkas berdasarkan dokumen `docs/01` sampai `docs/07`.
