# 10 — Laporan Evaluasi Komprehensif AI (AI-1 & AI-2)

**Proyek:** CampusFolio — Academic Capstone Platform  
**Rilis:** v1.0.0 (Academic Capstone Release)  
**Penyusun:** Hacker (Tech Lead & Engineering) & Hustler (Product Owner & Strategy)  
**Tanggal Evaluasi:** 12 November 2026  
**Status Audit:** Verified & Empirically Benchmarked  

---

## 1. Ringkasan Eksekutif & Prinsip Integritas Ilmiah

Dokumen ini menyajikan hasil evaluasi empiris menyeluruh terhadap dua komponen kecerdasan buatan (*Artificial Intelligence*) pada platform **CampusFolio**, yang dibangun selaras dengan spesifikasi [docs/07-ai-hypothesis.md](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/docs/07-ai-hypothesis.md) dan 4 pilar wajib perkuliahan:

1. **Tugas AI Jelas:** 
   - **AI-1 (Recommender System):** Pencocokan profil mahasiswa dan kebutuhan proyek kolaboratif berbasis kemiripan semantik teks.
   - **AI-2 (Content Moderation Pipeline):** Penapisan proaktif konten teks mahasiswa sebelum tayang untuk mencegah penyebaran ujaran kebencian, perundungan, dan penipuan di lingkungan kampus.
2. **Justifikasi Kuat (*Why not if-else?*):** Diuji secara *head-to-head* terhadap *baseline naive* (pencocokan tag kaku dan daftar hitam kata mentah) untuk membuktikan keunggulan pendekatan pemrosesan bahasa alami.
3. **Struktur Input-Output Terstandarisasi:** Divalidasi secara otomatis menggunakan JSON Schema resmi (`ai/schemas/recommendation-output.schema.json` dan `ai/schemas/moderation-output.schema.json`).
4. **Penanganan Kegagalan & Pengawasan Manusia (*Graceful Degradation & Human-in-the-Loop*):** Sistem tidak boleh mengalami gangguan (*500 Internal Server Error*) saat engine AI mengalami kendala atau *timeout*; keputusan sanksi dan moderasi akhir sepenuhnya berada di tangan civitas akademika (Kaprodi dan Admin Kampus).

> [!IMPORTANT]
> **Catatan Kejujuran Ilmiah (Scientific Honesty):**  
> Komponen **AI-2** pada rilis v1.0.0 diimplementasikan sebagai ***Advanced Heuristic Pipeline Baseline*** (pipeline pra-pemrosesan multi-tahap dengan normalisasi Unicode NFKC, pembersihan *zero-width spaces*, restorasi *Cyrillic homoglyphs*, dekoding *leetspeak*, perataan repetisi karakter, dan evaluasi *regex boundary* berbobot keparahan). Komponen ini secara tegas didokumentasikan sebagai **aturan heuristik deterministik tingkat lanjut**, bukan model pembelajaran mesin probabilistik (*Probabilistic ML/Deep Learning/LLM*). Perbandingan kinerja dilakukan terhadap *Naive Blacklist* konvensional untuk mengukur ketahanan terhadap teknik pengelabuan (*evasion attacks*). Model klasifikasi teks probabilistik (misal Fine-Tuned IndoBERT atau LLM API) diposisikan secara transparan sebagai *Future Work* pasca-v1.0.0.

---

## 2. Metodologi Evaluasi & Protokol Pelabelan

Untuk menghindari bias sirkular (*circular bias*), dataset benchmark disusun dengan protokol standar industri:

### 2.1 Protokol Pelabelan AI-1 (Rekomendasi Rekan Kolaborasi)
- **Dataset Korpus:** 50 profil mahasiswa multidisiplin (Teknik Informatika, Sistem Informasi, Desain Komunikasi Visual, Manajemen Bisnis, Teknik Elektro) yang memuat variasi penulisan bio, daftar keterampilan, dan minat (`ai/eval/eval-recommendation-dataset.json`).
- **Kueri Uji:** 12 skenario proyek riil (misal: *Pengembangan Aplikasi Mobile*, *Platform Data Analytics Spasial*, *Proyek UI/UX Desain Produk*, *Inkubasi Startup*, dsb.).
- **Protokol Dual-Annotator:** Setiap pasang (Kueri, Mahasiswa) dievaluasi secara independen oleh dua penilai dengan perspektif berbeda:
  - **Annotator 1 (Hustler):** Fokus pada relevansi bisnis, kecocokan portofolio, dan kebutuhan tim multidisiplin.
  - **Annotator 2 (Hacker):** Fokus pada kecocokan tumpukan teknologi teknis (*tech stack*) dan keterampilan komplementer.
- **Tingkat Kesepakatan (Inter-Annotator Agreement):**
  - Total Pasangan Evaluasi: 600 pasangan evaluasi.
  - Persentase Kesepakatan (*Observed Agreement* $P_o$): **97.67%**.
  - **Cohen's Kappa ($\kappa$): 0.8246** (Mengindikasikan kategori *Almost Perfect Agreement* / Kesepakatan Sangat Kuat).
  - Label *Ground Truth* ditetapkan saat kedua annotator sepakat, atau melalui konsensus terpandu.

### 2.2 Protokol Partisi AI-2 (Moderasi Konten Teks)
- **Dataset Total:** 80 sampel teks berbahasa Indonesia dengan variasi linguistik kampus (`ai/eval/eval-moderation-dataset.json`).
- **Partisi Data Bebas Kontaminasi:**
  - **Development Set (30 sampel):** Digunakan secara terbuka selama pengembangan Modul M09 untuk penyetelan kamus dan aturan normalisasi.
  - **Held-out Test Set (50 sampel):** Kumpulan data tertutup (*blind test set*) yang **tidak pernah dilihat** atau digunakan untuk tuning regex/kamus kata. Seluruh metrik evaluasi AI-2 yang dilaporkan di bawah ini dihitung secara eksklusif pada Held-out Test Set ini.
- **Kategori Pengujian:**
  - *Clean / Academic Discussions* (diskusi skripsi, proposal, matakuliah, pujian, istilah umum).
  - *Hard False Positive Traps* ("begonia", "bang satu orang lagi", "Aamiin", "analisis", "pembahasan").
  - *Adversarial Evasion Violations* (leetspeak `4nj1ng`, Cyrillic homoglyph `аnјіng`, zero-width spaces `b\u200ba\u200bn\u200bg\u200bs\u200ba\u200bt`, pemisah tanda baca `a.n.j.i.n.g`, repetisi karakter berlebihan `toooloooolll`).
  - *Borderline / Campus Friction* (keluhan fasilitas, sindiran dosen pembimbing, perdebatan tugas kelompok).

---

## 3. Evaluasi Kuantitatif AI-1: Engine Rekomendasi Kolaborator

### 3.1 Skema Pengujian Komparatif (Head-to-Head Benchmark)
Evaluasi dijalankan menggunakan skrip resmi reproduksibel [`ai/eval/evaluate_recommendation.py`](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/ai/eval/evaluate_recommendation.py) dengan membandingkan tiga metode:
1. **Random Baseline:** Pemilihan acak dari korpus mahasiswa aktif (seed tetap: `42`).
2. **Exact Tag Matching:** Pencocokan kaku (*if-else/set intersection*) berdasarkan kesamaan persis nama tag keterampilan.
3. **TF-IDF Proposed Model:** Representasi teks multibidang (gabungan bio, interest, skills) dibobot dengan *Term Frequency-Inverse Document Frequency* dan dihitung kemiripannya via *Cosine Similarity* plus deteksi keterampilan komplementer.

### 3.2 Hasil Evaluasi Metrik Retrieval & Ranking

| Metrik Evaluasi | Random Baseline | Exact Tag Matcher | TF-IDF Proposed Model | Peningkatan vs Exact Tag |
| :--- | :---: | :---: | :---: | :---: |
| **Hit Rate@1 (HR@1)** | 8.33% | 66.67% | **100.00%** | **+33.33%** |
| **Hit Rate@3 (HR@3)** | 8.33% | 100.00% | **100.00%** | 0.00% |
| **Hit Rate@5 (HR@5)** | 25.00% | 100.00% | **100.00%** | 0.00% |
| **Precision@3 (P@3)** | 2.78% | 66.67% | **83.33%** | **+16.66%** |
| **Precision@5 (P@5)** | 6.67% | 53.33% | **65.00%** | **+11.67%** |
| **Mean Reciprocal Rank (MRR)** | 0.1208 | 0.8194 | **1.0000** | **+0.1806** |
| **Complementary Precision@3** | 19.44% | 72.22% | **88.89%** | **+16.67%** |

> [!NOTE]
> **Analisis Hasil AI-1:**  
> - **Mengapa TF-IDF Mengungguli Exact Tag Matcher pada HR@1 (100% vs 66.67%)?**  
>   Pada skenario kueri yang menggunakan frasa deskriptif (contoh: kueri `"membangun arsitektur serverless dan API scalable"`), mahasiswa yang menuliskan `"FastAPI"`, `"PostgreSQL"`, dan deskripsi `"cloud computing"` di dalam bio tidak memiliki tag persis `"serverless"`. Exact Matcher menghasilkan skor 0 atau peringkat yang salah, sedangkan TF-IDF berhasil mengekstrak bobot kata dari teks deskriptif dan menempatkan kandidat yang tepat di posisi peringkat #1.
> - **Definisi & Akurasi Keahlian Komplementer (*Complementary Skills*):**  
>   Keahlian komplementer dievaluasi berdasarkan kesesuaian profil pasangan (misal: kueri membutuhkan *Desainer UI/UX* dan menyarankan kandidat yang juga menguasai *Frontend React* untuk memudahkan jembatan teknis). TF-IDF mencapai **88.89% Complementary Precision@3**, melampaui Exact Tag Matcher (72.22%).

### 3.3 Uji Skalabilitas & Pengukuran Latensi End-to-End
Pengukuran latensi dilakukan end-to-end (termasuk komputasi vektorisasi teks dan perangkingan) pada korpus sintetis yang diskalakan:

| Skala Korpus Mahasiswa | Rata-rata Latensi | Median Latensi (p50) | 95th Percentile (p95) | 99th Percentile (p99) |
| :--- | :---: | :---: | :---: | :---: |
| **$N = 50$ (Kondisi Nyata Demo)** | 6.58 ms | **5.81 ms** | 9.25 ms | 9.37 ms |
| **$N = 500$ (Skala Program Studi)** | 30.21 ms | **30.07 ms** | 32.70 ms | 32.87 ms |
| **$N = 5.000$ (Skala Seluruh Kampus)** | 284.69 ms | **271.95 ms** | 345.99 ms | 389.82 ms |

**Kesimpulan Kinerja:**  
Pada skala penuh 5.000 mahasiswa aktif, latensi $p95 = 345.99\text{ ms}$ berada jauh di bawah ambang batas timeout sistem ($3.000\text{ ms}$ / $3.0\text{ detik}$), membuktikan efisiensi memori dan kelayakan komputasi algoritma pada *single worker production*.

---

## 4. Evaluasi Kuantitatif AI-2: Pipeline Moderasi Konten Teks

### 4.1 Skema Pengujian Komparatif (Held-out Test Set)
Evaluasi dijalankan menggunakan skrip resmi reproduksibel [`ai/eval/evaluate_moderation.py`](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/ai/eval/evaluate_moderation.py) pada 50 sampel data uji tertutup (*Held-out Test Set*):
1. **Naive Blacklist Baseline:** Menggunakan string matching biasa (`word in text.lower()`) tanpa pra-pemrosesan lanjutan (merepresentasikan pendekatan *if-else* konvensional).
2. **Advanced Heuristic Pipeline:** Pipeline multi-tahap produksi dengan normalisasi Unicode NFKC, pembersihan karakter tersembunyi (*zero-width*), pemulihan homoglif Cyrillic, decoding leetspeak selektif, pemadatan pengulangan karakter ($\ge 3 \to 2$), tokenisasi berbatas kata (*word boundary*), dan skor keparahan kontekstual.

### 4.2 Matriks Kinerja & Confusion Matrix

| Metrik Evaluasi | Naive Blacklist Baseline | Advanced Heuristic Pipeline | Selisih Performa |
| :--- | :---: | :---: | :---: |
| **Akurasi Keseluruhan (*Overall Accuracy*)** | 72.00% | **98.00%** | **+26.00%** |
| **Macro-Averaged F1-Score** | 74.93% | **97.35%** | **+22.42%** |
| **False Positive Rate (Konten Aman Terblokir)** | 0.00% | **0.00%** | 0.00% (Identik) |
| **False Negative Rate (Pelanggaran Lolos)** | **59.09%** | **0.00%** | **-59.09% (Sempurna)** |

#### Rincian Kinerja Per-Kelas (Per-Class Breakdown)
- **Kelas `aman` (18 sampel):**
  - *Naive Blacklist:* Precision = 56.25%, Recall = 100.0%, F1 = 72.00% (Mengalami 14 False Positives karena kata-kata pelanggaran lolos diidentifikasi sebagai aman).
  - *Advanced Pipeline:* Precision = 94.74%, Recall = 100.0%, **F1 = 97.30%**.
- **Kelas `perlu_review` (10 sampel):**
  - *Naive Blacklist:* Precision = 100.0%, Recall = 90.0%, F1 = 94.74%.
  - *Advanced Pipeline:* Precision = 100.0%, Recall = 90.0%, **F1 = 94.74%**.
- **Kelas `berpotensi_melanggar` (22 sampel):**
  - *Naive Blacklist:* Precision = 100.0%, Recall = 40.91%, **F1 = 58.06%** (Gagal mendeteksi 13 dari 22 kasus pelanggaran!).
  - *Advanced Pipeline:* Precision = 100.0%, Recall = 100.0%, **F1 = 100.00%** (Seluruh serangan evasif berhasil dicegat).

### 4.3 Analisis Ketahanan Terhadap Serangan Evasif (Adversarial Evasion)
Tabel berikut mendemonstrasikan kegagalan *Naive Blacklist* konvensional dibandingkan keberhasilan *Advanced Heuristic Pipeline* saat diuji dengan teknik pengelabuan:

| ID Uji | Teks Masukan | Teknik Evasif | Naive Blacklist | Advanced Pipeline | Status Deteksi |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `test_04` | `"Dasar 4nj1ng lu ga guna!"` | Leetspeak (`4` $\to$ `a`, `1` $\to$ `i`) | `aman` (LOLOS!) | `berpotensi_melanggar` | **Dicegat** |
| `test_05` | `"Lu b.a.n.g.s.a.t bgt sumpah"` | Pemisah Tanda Baca Titik | `aman` (LOLOS!) | `berpotensi_melanggar` | **Dicegat** |
| `test_06` | `"Kelakuan kayak аnјіng liar"` | Homoglif Cyrillic (`а`, `ј`, `і`) | `aman` (LOLOS!) | `berpotensi_melanggar` | **Dicegat** |
| `test_07` | `"Dasar b\u200ba\u200bn\u200bg\u200bs\u200ba\u200bt lo"` | Zero-Width Space Injection | `aman` (LOLOS!) | `berpotensi_melanggar` | **Dicegat** |
| `test_08` | `"Dasar toooloooolll bangeet"` | Repetisi Huruf Ekstrem | `aman` (LOLOS!) | `berpotensi_melanggar` | **Dicegat** |
| `test_19` | `"Taman kampus ditanami bunga begonia"` | Jebakan Substring False Positive | `aman` | `aman` | **Aman (Tidak Terjebak)** |
| `test_20` | `"Bang satu porsi nasi goreng lagi ya"` | Jebakan False Positive "bangsat" | `aman` | `aman` | **Aman (Tidak Terjebak)** |

### 4.4 Analisis Kesalahan (Error Analysis & Mismatch)
Dari 50 sampel uji tertutup (*Held-out Test Set*), terdapat **1 kasus mismatch (2.0%)**:
- **Kasus Uji `test_25`:**
  - *Teks:* `"Dosen pembimbing ga jelas susah banget ditemuin padahal udah nunggu 4 jam."`
  - *Target Ekspektasi:* `perlu_review` (Kritik tajam terhadap staf akademik).
  - *Prediksi Model:* `aman` (Confidence: 0.95).
  - *Rasional & Pembahasan:*  
    Teks ini tidak mengandung kata kasar eksplisit atau ancaman, melainkan kekecewaan emosional mahasiswa terkait bimbingan skripsi. Karena model produksi saat ini bekerja berbasis aturan linguistik leksikal dan belum dilengkapi model *Deep Sentiment Analysis* atau LLM, kalimat tersebut diklasifikasikan sebagai `aman`. Ini adalah temuan valid yang menegaskan batas kemampuan sistem berbasis aturan dan menjadi landasan rekomendasi adopsi model probabilistik untuk pengembangan masa depan.

---

## 5. Verifikasi 4 Batasan AI Wajib (Must-Have AI Constraints)

Seluruh 4 batasan AI yang tercantum pada [docs/07-ai-hypothesis.md](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/docs/07-ai-hypothesis.md) telah diuji dan diverifikasi secara otomatis:

### Batasan 1: Rekomendasi Bersifat Saran
- Setiap luaran JSON menyertakan atribut `reason` yang transparan (contoh: *"Memiliki keahlian backend yang melengkapi kebutuhan desain antarmuka Anda"*).
- Platform menyediakan aksi umpan balik eksplisit (`POST /api/v1/recommendations/feedback`) dengan opsi alasan `"kurang_relevan"`, `"sudah_kontak"`, dsb., yang tersimpan di basis data untuk kalibrasi berkelanjutan.

### Batasan 2: Review Manusia pada Konten Sensitif (*Human-in-the-Loop*)
- Sistem AI **TIDAK PERNAH** menghapus konten atau memblokir akun pengguna secara otomatis tanpa campur tangan manusia.
- Konten dengan label `perlu_review` atau `berpotensi_melanggar` otomatis dialihkan ke status `menunggu_review` dan masuk ke antrean dasbor Kaprodi/Moderator.
- Penghapusan konten hanya sah dilakukan melalui tindakan formal pejabat berwenang dengan mencantumkan alasan penindakan (`alasan_hapus`) yang terisolasi per program studi.

### Batasan 3: Transparansi & Koreksi Manual
- Mahasiswa memiliki kontrol penuh atas daftar keterampilan mereka di menu *Edit Profil* (`POST /api/v1/profile/skills`). Mahasiswa dapat menambah, mengubah, atau menghapus keterampilan secara mandiri jika merasa inferensi sistem tidak akurat.

### Batasan 4: Independensi Fitur Inti (*Graceful Degradation*)
Telah diverifikasi secara formal melalui automated integration test [`src/backend/tests/test_ai_graceful_degradation.py`](file:///d:/shenzen/project%20kampus/campus-social-media-portofolio-team3/src/backend/tests/test_ai_graceful_degradation.py) (Hasil: **3 passed in 100%**):
1. **Kegagalan / Timeout Engine Rekomendasi:**  
   Saat `TFIDFRecommender.recommend` disuntikkan kegagalan simulasi (*injected TimeoutError > 3.000 ms*), endpoint `POST /api/v1/recommendations/match` tidak menghasilkan crash HTTP 500, melainkan mengembalikan HTTP 200 OK dengan tanda `fallback: true` dan hasil rekomendasi berbasis pencocokan kata kunci dasar (*keyword fallback*).
2. **Kegagalan / Crash Engine Moderasi Konten:**  
   Saat `ContentModerator.moderate_text` disuntikkan error kritis (*simulated internal crash*), pembuatan postingan feed `POST /api/v1/posts` **tetap berhasil (HTTP 201 Created)**. Konten tidak hilang dan otomatis dialihkan ke status `menunggu_review` untuk diverifikasi oleh moderator manusia secara aman.
3. **Independensi Fitur Inti:**  
   Fitur pencarian mahasiswa (`GET /api/v1/search`) dan pengelolaan profil (`GET /api/v1/auth/me`) berjalan independen 100% tanpa bergantung pada layanan AI.

---

## 6. Rekomendasi & Rencana Pengembangan Lanjutan (*Future Roadmap*)

Berdasarkan temuan evaluasi empiris di atas, berikut adalah peta jalan pengembangan pasca-v1.0.0:
1. **Adopsi Text Embedding Lokal (AI-1):** Mengganti TF-IDF dengan model embedding representasi kalimat (seperti `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`) untuk menangkap sinonim lintas-bahasa yang lebih kaya.
2. **Model Probabilistik / Fine-Tuned LLM (AI-2):** Mengintegrasikan classifier probabilistik berbasis transformer (seperti `IndoBERT-sentiment`) untuk mendeteksi sarkasme, sentimen kritik halus (seperti kasus `test_25`), dan ujaran kebencian implisit yang tidak memuat kata kasar eksplisit.
3. **Penyimpanan Matriks Sparse Terdistribusi:** Menerapkan pengindeksan vektor (misal pgvector pada PostgreSQL) saat jumlah mahasiswa aktif melampaui 50.000 pengguna untuk mempertahankan latensi di bawah 50 ms.
