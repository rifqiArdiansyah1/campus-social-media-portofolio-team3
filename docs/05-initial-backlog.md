# 05 — Product Backlog

**Proyek:** CampusFolio  
**Standar Format:** *"Sebagai [pengguna], saya ingin [tindakan], sehingga [manfaat]."*  
**Prioritas:** MoSCoW (*Must Have, Should Have, Could Have, Won't Have*)  
**Versi:** v1.1 (Diperbarui dengan Penambahan Fitur & Revisi Klien)  

---

## Tabel Backlog Utama (US-01 s.d. US-18)

| ID | User Story | Prioritas | PIC Utama | Acceptance Criteria Singkat |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Sebagai mahasiswa, saya ingin login ke akun saya agar data dan portofolio saya dapat dikaitkan dengan identitas saya. | **Must** | Hacker | Pengguna dapat masuk dengan email kampus dan kata sandi terenkripsi. |
| **US-02** | Sebagai mahasiswa, saya ingin membuat dan mengedit profil (nama, jurusan, bio, skill, minat) agar orang lain mengetahui keahlian saya. | **Must** | Hacker / Hipster | Form edit profil dapat menyimpan teks bio, jurusan, pemilihan tag skill, dan minat. |
| **US-03** | Sebagai mahasiswa, saya ingin menambahkan item portofolio proyek karya agar karya saya dapat dinilai orang lain. | **Must** | Hacker | Pengguna dapat menambahkan karya baru, mengunggah/menautkan gambar cover, dan menyematkan tag keahlian. |
| **US-04** | Sebagai mahasiswa, saya ingin membuat postingan linimasa yang memuat foto dan teks agar dapat berbagi progres karya atau mencari rekan tim. | **Must** | Hacker | Form posting menyediakan opsi unggah gambar/foto, teks caption, tag skill yang dicari, dan jenis postingan. |
| **US-05** | Sebagai mahasiswa, saya ingin mencari mahasiswa lain berdasarkan skill atau minat agar menemukan rekan kolaborasi yang sesuai. | **Must** | Hustler / Hacker | Kolom pencarian mendukung filter kata kunci, tag keahlian, dan jurusan dengan hasil yang relevan. |
| **US-06** | Sebagai mahasiswa, saya ingin melihat halaman detail profil dan portofolio mahasiswa lain agar dapat mengevaluasi kecocokan kerja sama. | **Must** | Hipster | Tampilan profil publik menampilkan identitas, badge keahlian, riwayat karya, dan tombol aksi interaksi. |
| **US-07** | Sebagai mahasiswa, saya ingin melihat rekomendasi teman dengan skill/minat yang saling melengkapi agar proses pencarian lebih cepat. | **Should** | Hustler / Hacker | Modul AI menampilkan kartu rekomendasi dilengkapi persentase kecocokan dan penjelasan alasan. |
| **US-08** | Sebagai mahasiswa, saya ingin menulis kebutuhan proyek pada postingan dan mendapat rekomendasi kandidat tim yang relevan secara otomatis. | **Should** | Hustler / Hacker | Algoritma mencocokkan teks deskripsi proyek dengan basis data profil pengguna lain via TF-IDF matcher. |
| **US-09** | Sebagai sistem, saya ingin konten postingan diklasifikasikan secara awal oleh sistem AI agar proses moderasi lebih efisien. | **Should** | Hustler / Hacker | Setiap postingan dipindai AI dan diberi label status (`aman`, `perlu_review`, `berpotensi_melanggar`). |
| **US-10** | Sebagai admin / moderator, saya ingin meninjau antrean postingan yang ditandai agar keputusan moderasi akhir tetap di tangan manusia. | **Should** | Hacker | Halaman khusus menampilkan antrean review dengan tombol Setujui, Tolak, atau Minta Revisi. |
| **US-11** | Sebagai mahasiswa, saya ingin melaporkan postingan yang melanggar aturan kampus agar lingkungan kampus tetap sehat dan aman. | **Should** | Hipster | Tersedia modal/tombol aksi 'Laporkan Postingan' dengan pilihan kategori pelanggaran (spam, ujaran kebencian, dll). |
| **US-12** | Sebagai mahasiswa, saya ingin keluar dari akun (logout) agar sesi perangkat saya dapat diamankan. | **Should** | Hacker / Hipster | Tombol logout menghapus token autentikasi lokal dan mengarahkan kembali ke halaman login. |
| **US-13** | Sebagai mahasiswa, saya ingin mengirim dan menerima permintaan pertemanan agar dapat memperluas jaringan koneksi sesama mahasiswa. | **Must** | Hacker / Hipster | Pengguna dapat mengirim pertemanan (Friend Request), menerima, menolak, dan melihat daftar teman. |
| **US-14** | Sebagai mahasiswa, saya ingin memblokir profil pengguna lain agar tidak dapat berinteraksi atau melihat aktivitas saya demi privasi. | **Should** | Hacker | Terdapat tombol 'Blokir Pengguna' di profil; akun yang diblokir tidak muncul di feed dan pencarian timbal balik. |
| **US-15** | Sebagai mahasiswa, saya ingin mengunggah dokumen capaian SKPI, sertifikat, dan artikel ilmiah agar dapat diverifikasi oleh Kaprodi / Admin. | **Must** | Hacker / Hustler | Form upload mendukung kategori SKPI/Sertifikat/Artikel Ilmiah, no. dokumen, penerbit, tanggal, dan berkas PDF bukti pendukung. |
| **US-16** | Sebagai Kaprodi (Moderator), saya ingin meninjau pengajuan upload portofolio SKPI mahasiswa di prodi saya agar dapat divalidasi keabsahannya. | **Must** | Hacker | Panel verifikasi menampilkan berkas bukti dan tombol persetujuan (Terverifikasi) atau penolakan dengan catatan revisi. |
| **US-17** | Sebagai Moderator (Kaprodi) dan Admin, saya ingin dapat menghapus/takedown postingan yang melanggar larangan agar konten terlarang segera dibersihkan. | **Must** | Hacker | Moderator & Admin memiliki tombol aksi 'Hapus Postingan' yang mewajibkan pengisian alasan hapus dan melakukan soft-delete. |
| **US-18** | Sebagai pengguna, saya ingin seluruh ringkasan aktivitas (feed, pertemanan, capaian, dan antrean review) terintegrasi di Dashboard/Home agar mudah dipantau. | **Must** | Hipster / Hacker | Halaman Dashboard Home memadukan feed utama, friend requests, rekomendasi AI, dan alert ringkasan moderasi bagi Kaprodi/Admin. |

---

## Matriks Pemetaan Role

| Fitur / Backlog | Mahasiswa | Moderator (Kaprodi) | Admin (Kemahasiswaan) |
| :--- | :---: | :---: | :---: |
| Buat Postingan Foto + Teks (US-04) | V | V | V |
| Pertemanan & Jaringan (US-13) | V | - | - |
| Blokir Profil (US-14) | V | - | - |
| Upload Portofolio SKPI & Artikel Ilmiah (US-15) | V | - | - |
| Tinjau Upload Portofolio / SKPI (US-16) | - | V (Khusus Prodi) | V (Seluruh Prodi) |
| Tinjau Konten & Terima Laporan (US-10, US-11) | - | V (Khusus Prodi) | V (Seluruh Prodi) |
| Hapus / Takedown Postingan (US-17) | - | V | V |
| Dashboard Home Sentral (US-18) | V (Versi Mhs) | V (Versi Moderator) | V (Versi Admin) |
