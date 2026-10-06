# 07 — AI Hypothesis & Design

**Proyek:** CampusFolio  
**Penyusun:** Hustler, Hacker, & Tim 3  

---

## Prinsip Penggunaan AI

Integrasi AI dalam proyek ini mematuhi 4 pilar utama perkuliahan:
1. **Tugas AI Jelas:** Terfokus pada pemahaman bahasa alami (Natural Language Processing / Text Matching) dan klasifikasi teks kontekstual.
2. **Justifikasi Kuat (Why not if-else?):** AI hanya digunakan ketika pendekatan kondisional biasa (*rule-based/if-else*) terbukti tidak memadai atau rapuh.
3. **Struktur Input-Output Terdefinisi:** Setiap model AI menerima input teks bersih dan menghasilkan respons berformat JSON terstruktur yang dapat divalidasi skema.
4. **Penanganan Kegagalan & Human Oversight:** Kegagalan AI tidak boleh menyebabkan crash pada aplikasi; keputusan sensitif wajib diverifikasi oleh manusia (*Human-in-the-Loop*).

---

## AI-1: Rekomendasi Kemiripan Skill & Minat Kolaborator

### 1. Masalah yang Diselesaikan
Mencocokkan keahlian, minat, dan deskripsi kebutuhan proyek antar-mahasiswa yang ditulis dalam bahasa bebas dan sangat beragam.

### 2. Mengapa Bukan If-Else / Rule-Based?
Setiap mahasiswa memiliki variasi istilah yang berbeda untuk keahlian yang sama (misalnya: *"React dev"*, *"Frontend Web"*, *"Bikin UI Web"*, *"Next.js"*). Pencocokan string secara kaku (`if skill == 'frontend'`) akan melewatkan sinonim, kemiripan semantik, dan keahlian komplementer (*complementary skills* seperti Designer membutuhkan Frontend Developer).

### 3. Spesifikasi Input
- Profil Pengguna Pencari: Bio, daftar tag skill, minat, dan/atau teks deskripsi kebutuhan proyek.
- Korpus Data Mahasiswa: Koleksi profil mahasiswa lain yang berstatus aktif.

### 4. Spesifikasi Output
Format JSON terstruktur memuat skor relevansi, istilah yang cocok, dan penjelasan rasional.
```json
{
  "query_user_id": "u_102",
  "recommendations": [
    {
      "user_id": "u_245",
      "score": 0.82,
      "matched_terms": ["flutter", "backend"],
      "complementary_skills": ["ui design"],
      "reason": "Memiliki keahlian backend yang melengkapi kebutuhan desain antarmuka Anda."
    }
  ]
}
```

### 5. Strategi Implementasi & Penanganan Kegagalan (*Failure Handling*)
- **Baseline Implementasi:** TF-IDF + Cosine Similarity berbasis token skill dan bio untuk prototipe lokal awal tanpa latensi/biaya tinggi.
- **Tahap Lanjutan:** Text Embedding / LLM API untuk pemahaman semantik mendalam.
- **Fallback:** Jika layanan AI gagal merespons dalam waktu 3 detik, sistem otomatis beralih ke pencarian pencocokan kata kunci dan tag persis (*keyword match*).
- **Keterbukaan:** Setiap rekomendasi dilengkapi alasan transparan dan tombol umpan balik ("Kurang Relevan") bagi pengguna.

---

## AI-2: Klasifikasi Awal Konten untuk Moderasi Feed

### 1. Masalah yang Diselesaikan
Penyaringan proaktif atas postingan teks mahasiswa untuk mencegah ujaran kebencian, perundungan (*bullying*), pelecehan, dan penipuan sebelum menyebar luas.

### 2. Mengapa Bukan If-Else / Blacklist Kata?
Daftar kata terlarang (*bad words blacklist*) sangat mudah dikelabui (menggunakan singkatan, plesetan karakter alfanumerik) dan sering menimbulkan *false positive* terhadap diskusi akademik normal (misal konteks diskusi medis atau hukum). AI mampu menganalisis sentimen dan konteks kalimat secara utuh.

### 3. Spesifikasi Input
Teks postingan pengguna beserta laporan aduan (jika berasal dari laporan pengguna).

### 4. Spesifikasi Output
Format JSON terstruktur dengan label klasifikasi, tingkat kepercayaan (*confidence score*), kategori, dan keterangan ringkas.
```json
{
  "post_id": "p_881",
  "label": "perlu_review",
  "categories": ["ujaran_kasar"],
  "confidence": 0.74,
  "explanation": "Mengandung indikasi kata kasar atau bernada merendahkan yang ditujukan kepada individu."
}
```

### 5. Penanganan Kegagalan & Etika Moderasi
- **Label Status:**
  - `aman` (Confidence aman tinggi): Konten langsung tayang.
  - `perlu_review`: Konten ditahan sementara di antrean moderator manusia.
  - `berpotensi_melanggar`: Konten disembunyikan dan diprioritaskan di antrean admin.
- **Prinsip Human-in-the-Loop:** AI tidak pernah menghapus postingan secara permanen tanpa review admin kampus.
- **Log Keputusan:** Seluruh riwayat keputusan moderasi disimpan di database untuk audit.

---

## 4 Batasan AI Wajib (Must-Have AI Constraints)

1. **Rekomendasi Bersifat Saran:** Hasil rekomendasi rekan bukanlah penugasan atau keputusan mutlak; pengguna memiliki kebebasan penuh memilih partner.
2. **Review Manusia pada Konten Sensitif:** Sistem moderasi AI hanya berperan sebagai asisten penyaring awal (*first-line triage*). Keputusan sanksi atau penghapusan permanen berada di tangan admin manusia.
3. **Transparansi & Koreksi Manual:** Algoritma dapat mengalami bias pada penulisan istilah tertentu. Mahasiswa selalu diberi keleluasaan mengubah dan menyesuaikan tag keahlian mereka sendiri.
4. **Independensi Fitur Inti (Graceful Degradation):** Kegagalan atau pemadaman pada layanan AI tidak boleh melumpuhkan fitur CRUD profil, posting feed, dan pencarian dasar.
