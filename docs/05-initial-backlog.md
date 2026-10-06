# 05 — Initial Product Backlog

**Proyek:** CampusFolio  
**Standar Format:** *"Sebagai [pengguna], saya ingin [tindakan], sehingga [manfaat]."*  
**Prioritas:** MoSCoW (*Must Have, Should Have, Could Have, Won't Have*)  

---

## Tabel Backlog MVP (US-01 s.d. US-12)

| ID | User Story | Prioritas | PIC Utama | Acceptance Criteria Singkat |
| --- | --- | --- | --- | --- |
| **US-01** | Sebagai mahasiswa, saya ingin login ke akun saya agar data dan portofolio saya dapat dikaitkan dengan identitas saya. | **Must** | Hacker | Pengguna dapat mendaftar dan masuk dengan validasi format email & password aman. |
| **US-02** | Sebagai mahasiswa, saya ingin membuat dan mengedit profil (nama, jurusan, bio, skill, minat) agar orang lain mengetahui keahlian saya. | **Must** | Hacker / Hipster | Form edit profil dapat menyimpan teks bio, pemilihan tag skill, dan minat secara real-time. |
| **US-03** | Sebagai mahasiswa, saya ingin menambahkan item portofolio (judul, deskripsi, tautan proyek, gambar) agar karya saya dapat dinilai orang lain. | **Must** | Hacker | Pengguna dapat menambahkan karya baru, mengunggah/menautkan gambar, dan menyematkan tag keahlian. |
| **US-04** | Sebagai mahasiswa, saya ingin membuat postingan feed agar dapat membagikan kabar atau pengumuman pencarian anggota proyek. | **Must** | Hacker | Form posting menyediakan opsi jenis konten (umum vs cari anggota) dan muncul di feed linimasa. |
| **US-05** | Sebagai mahasiswa, saya ingin mencari mahasiswa lain berdasarkan skill atau minat agar menemukan rekan kolaborasi yang sesuai. | **Must** | Hustler / Hacker | Kolom pencarian mendukung filter kata kunci, tag keahlian, dan jurusan dengan hasil yang relevan. |
| **US-06** | Sebagai mahasiswa, saya ingin melihat halaman detail profil dan portofolio mahasiswa lain agar dapat mengevaluasi kecocokan kerja sama. | **Must** | Hipster | Tampilan profil publik menampilkan identitas, badge keahlian, daftar kartu portofolio, dan kontak. |
| **US-07** | Sebagai mahasiswa, saya ingin melihat rekomendasi teman dengan skill/minat yang saling melengkapi agar proses pencarian lebih cepat. | **Should** | Hustler / Hacker | Modul AI menampilkan kartu rekomendasi dilengkapi persentase kecocokan dan penjelasan alasan. |
| **US-08** | Sebagai mahasiswa, saya ingin menulis kebutuhan proyek pada postingan dan mendapat rekomendasi kandidat tim yang relevan secara otomatis. | **Should** | Hustler / Hacker | Algoritma mencocokkan teks deskripsi proyek dengan basis data profil pengguna lain. |
| **US-09** | Sebagai admin, saya ingin konten postingan diklasifikasikan secara awal oleh sistem AI agar proses moderasi lebih efisien. | **Should** | Hustler / Hacker | Setiap postingan dipindai AI dan diberi label status (`aman`, `perlu_review`, `berpotensi_melanggar`). |
| **US-10** | Sebagai admin, saya ingin meninjau antrean postingan yang ditandai agar keputusan moderasi akhir tetap di tangan manusia. | **Should** | Hacker | Halaman khusus admin menampilkan antrean review dengan tombol Setujui, Tolak, atau Minta Revisi. |
| **US-11** | Sebagai mahasiswa, saya ingin melaporkan postingan yang tidak pantas agar lingkungan kampus tetap sehat dan aman. | **Should** | Hipster | Tersedia modal/tombol aksi 'Laporkan Postingan' dengan pilihan alasan laporan. |
| **US-12** | Sebagai mahasiswa, saya ingin keluar dari akun (logout) agar sesi perangkat saya dapat diamankan. | **Should** | Hacker / Hipster | Tombol logout menghapus token autentikasi lokal dan mengarahkan kembali ke halaman login. |

---

## Backlog Cadangan (Could Have — Pasca-MVP)
- **US-13:** Integrasi tautan sosial eksternal (GitHub, Behance, LinkedIn, Portofolio pribadi).
- **US-14:** Filter pencarian lanjutan berdasarkan angkatan, fakultas, dan ketersediaan waktu (*availability*).
- **US-15:** Fitur simpan/bookmark profil atau portofolio mahasiswa favorit.
