"""
Skrip generator dataset benchmark evaluasi moderasi konten (AI-2).
Menghasilkan ai/eval/eval-moderation-dataset.json yang terpartisi menjadi:
  - dev_set (30 sampel)
  - held_out_test_set (50 sampel)
Lengkap dengan variasi leetspeak, homoglyph, zero-width, pengulangan huruf,
dan jebakan false positive akademik.
"""

import json
from pathlib import Path


def generate_moderation_dataset():
    # 30 Sampel Dev Set (untuk kalibrasi aturan)
    dev_set = [
        {"id": "dev_01", "text": "Selamat pagi rekan-rekan, ada yang berminat ikut lomba hackathon nasional minggu depan?", "expected_label": "aman", "notes": "Pertanyaan kolaborasi normal"},
        {"id": "dev_02", "text": "Bang satu porsi lagi tolong dibungkus ya mas, terima kasih.", "expected_label": "aman", "notes": "False positive trap: frasa 'Bang satu' tidak boleh memicu 'bangsat'"},
        {"id": "dev_03", "text": "Tanaman begonia merah di taman rektorat sedang mekar dengan indah sekali.", "expected_label": "aman", "notes": "False positive trap: kata 'begonia' tidak boleh memicu 'bego'"},
        {"id": "dev_04", "text": "Aamiin ya rabbal alamin, semoga ujian komprehensif kita semua dilancarkan.", "expected_label": "aman", "notes": "Kata sah dengan huruf ganda 'aa'"},
        {"id": "dev_05", "text": "Mohon maaf atas keterlambatan pengumpulan berkas praktikum basis data.", "expected_label": "aman", "notes": "Kata sah dengan 'aa' (maaf)"},
        {"id": "dev_06", "text": "Kucing di kantin teknik lucu banget kalau lagi minta makanan ke mahasiswa.", "expected_label": "aman", "notes": "Informal bahasa Indonesia wajar ('banget')"},
        {"id": "dev_07", "text": "Workshop pengenalan arsitektur microservices dan Docker akan diadakan lusa.", "expected_label": "aman", "notes": "Pengumuman kegiatan kampus"},
        {"id": "dev_08", "text": "Bagi teman-teman yang belum mengisi form evaluasi dosen, batas akhirnya malam ini.", "expected_label": "aman", "notes": "Pengingat administrasi"},
        {"id": "dev_09", "text": "Cari rekan tim yang menguasai React dan Node.js untuk lomba UI/UX dan web dev.", "expected_label": "aman", "notes": "Postingan rekrutmen tim"},
        {"id": "dev_10", "text": "Sistem perwalian KRS kampus lemot banget pas rebutan kelas tadi siang.", "expected_label": "aman", "notes": "Keluhan sistemik tanpa makian"},
        {"id": "dev_11", "text": "Tugas praktikum semester ini parah sih susahnya minta ampun.", "expected_label": "perlu_review", "notes": "Borderline / keluhan mahasiswa ('parah sih')"},
        {"id": "dev_12", "text": "Males banget rasanya besok harus kuliah pengganti jam 7 pagi di hari libur.", "expected_label": "perlu_review", "notes": "Borderline negatif ('males banget')"},
        {"id": "dev_13", "text": "Dosen ga jelas ngasih instruksi tugas besar tapi deadline besok lusa.", "expected_label": "perlu_review", "notes": "Borderline sentimen dosen ('dosen ga jelas')"},
        {"id": "dev_14", "text": "Bete banget nunggu dosen pembimbing dari pagi ga dateng-dateng parah sih.", "expected_label": "perlu_review", "notes": "Borderline keluhan bimbingan"},
        {"id": "dev_15", "text": "Kelompok sebelah males banget ngerjain tugas cuma numpang nama doang.", "expected_label": "perlu_review", "notes": "Borderline keluhan kerja kelompok"},
        {"id": "dev_16", "text": "Dasar lu mahasiswa tolol ga punya otak bisanya cuma nyusahin orang doang!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar eksplisit (tolol)"},
        {"id": "dev_17", "text": "Bangsat bener lu ngerusak barang praktikum kelompok orang lain!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar eksplisit (bangsat)"},
        {"id": "dev_18", "text": "Kurang ajar bener anjing lu ya jangan sok jagoan di kampus ini!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar eksplisit (anjing)"},
        {"id": "dev_19", "text": "Otak lu goblok amat ga bisa mikir algoritma sederhana begini.", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar eksplisit (goblok)"},
        {"id": "dev_20", "text": "Pelecehan verbal: open bo mahasiswa murah minat chat langsung ya kak.", "expected_label": "berpotensi_melanggar", "notes": "Pelecehan seksual ('open bo')"},
        {"id": "dev_21", "text": "Dasar lonte gatel ga usah caper sama cowok orang di organisasi.", "expected_label": "berpotensi_melanggar", "notes": "Pelecehan / cercaan seksual ('lonte')"},
        {"id": "dev_22", "text": "Jasa joki skripsi murah pasti lulus sidang A, garansi revisi sepuasnya.", "expected_label": "berpotensi_melanggar", "notes": "Kecurangan akademik ('joki skripsi murah')"},
        {"id": "dev_23", "text": "Solusi cuan instan: investasi pasti untung 100% modal 100rb jadi 10jt sehari!", "expected_label": "berpotensi_melanggar", "notes": "Penipuan finansial ('investasi pasti untung 100%')"},
        {"id": "dev_24", "text": "Minat saldo gratis 500k klik wa.me/628123456789 sekarang juga kuota terbatas!", "expected_label": "berpotensi_melanggar", "notes": "Spam WhatsApp URL"},
        {"id": "dev_25", "text": "Mau follower gratis bertambah 10k tiap hari? Cek profil dan klik link ini gratis.", "expected_label": "berpotensi_melanggar", "notes": "Spam follower"},
        {"id": "dev_26", "text": "Dasar 4nj1ng lu ga punya adab sama kating!", "expected_label": "berpotensi_melanggar", "notes": "Leetspeak ujaran kasar ('4nj1ng')"},
        {"id": "dev_27", "text": "Mukanya b3g0 banget waktu ditanya dosen penguji.", "expected_label": "berpotensi_melanggar", "notes": "Leetspeak ujaran kasar ('b3g0')"},
        {"id": "dev_28", "text": "Manusia t0l0l mana sih yang naruh sampah di atas meja lab komputer?", "expected_label": "berpotensi_melanggar", "notes": "Leetspeak ujaran kasar ('t0l0l')"},
        {"id": "dev_29", "text": "Anjiiiiiiiing kaget gue ada kucing lompat dari ventilasi atap lab!", "expected_label": "berpotensi_melanggar", "notes": "Pengulangan huruf ('Anjiiiiiiiing')"},
        {"id": "dev_30", "text": "Lu tooolooool amat jadi partner kerja kelompok ga ada kontribusi.", "expected_label": "berpotensi_melanggar", "notes": "Pengulangan huruf ('tooolooool')"}
    ]

    # 50 Sampel Held-Out Test Set (Uji tertutup tanpa bocor ke aturan kamus)
    held_out_test_set = [
        # Academic & Normal Conversations (Aman - Termasuk Traps)
        {"id": "test_01", "text": "Seminar proposal tugas akhir mahasiswa Teknik Informatika dijadwalkan hari Senin pukul 09.00 WIB.", "expected_label": "aman", "notes": "Kalimat formal akademik"},
        {"id": "test_02", "text": "Penelitian ini mengkaji pencegahan kanker serviks pada usia produktif menurut standar medis internasional.", "expected_label": "aman", "notes": "Konteks ilmiah kedokteran ('serviks' bukan pelecehan)"},
        {"id": "test_03", "text": "Analisis aspek hukum pidana terhadap tindak pencurian data pribadi di ranah siber.", "expected_label": "aman", "notes": "Konteks akademik fakultas hukum"},
        {"id": "test_04", "text": "Kajian mendalam tentang upaya universitas meminimalisir praktik curang dalam ujian daring.", "expected_label": "aman", "notes": "Diskusi integritas akademik ('curang' dalam konteks ilmiah)"},
        {"id": "test_05", "text": "Bang satu orang lagi untuk tim hackathon kita butuh yang bisa Flutter.", "expected_label": "aman", "notes": "False positive trap: frasa 'Bang satu'"},
        {"id": "test_06", "text": "Pameran tanaman begonia dan hidroponik fakultas pertanian diadakan besok pagi.", "expected_label": "aman", "notes": "False positive trap: kata 'begonia'"},
        {"id": "test_07", "text": "Aamiin ya rabbal alamin semoga sidang skripsi angkatan 2022 diberikan kelancaran.", "expected_label": "aman", "notes": "Doa dengan kata 'Aamiin'"},
        {"id": "test_08", "text": "Mohon maaf izin tidak dapat menghadiri kelas pengganti dikarenakan kondisi sakit.", "expected_label": "aman", "notes": "Izin sopan santun"},
        {"id": "test_09", "text": "Asosiasi Mahasiswa Sistem Informasi menyelenggarakan donor darah di aula utama.", "expected_label": "aman", "notes": "Kata 'Asosiasi' wajar"},
        {"id": "test_10", "text": "Mata kuliah pemodelan sistem informasi bisnis mempelajari diagram BPMN dan UML.", "expected_label": "aman", "notes": "Istilah perkuliahan umum"},
        {"id": "test_11", "text": "Hasil analisis data spasial menunjukkan sebaran vegetasi hutan mangrove yang meluas.", "expected_label": "aman", "notes": "Konteks ilmiah geografi"},
        {"id": "test_12", "text": "Daftar hadir praktikum jaringan komputer dapat diakses melalui link Google Form resmi.", "expected_label": "aman", "notes": "Administrasi praktikum"},
        {"id": "test_13", "text": "Ada yang punya rekomendasi laptop untuk komputasi deep learning anggaran 15 juta?", "expected_label": "aman", "notes": "Diskusi perangkat perkuliahan"},
        {"id": "test_14", "text": "Bagi perwakilan kelompok tugas rekayasa perangkat lunak harap segera mengambil modul.", "expected_label": "aman", "notes": "Instruksi asisten lab"},
        {"id": "test_15", "text": "Kelompok kami membuka lowongan 1 orang UI/UX designer untuk kolaborasi Gemastik.", "expected_label": "aman", "notes": "Rekrutmen kompetisi kampus"},
        {"id": "test_16", "text": "Selamat sore rekan-rekan, kumpul evaluasi kepanitiaan dies natalis diundur jam 5 sore.", "expected_label": "aman", "notes": "Koordinasi kepanitiaan"},
        {"id": "test_17", "text": "Sertifikat webinar nasional sudah dikirimkan via email masing-masing peserta.", "expected_label": "aman", "notes": "Pengumuman SKPI/sertifikat"},
        {"id": "test_18", "text": "Perpustakaan pusat buka sampai jam 8 malam selama masa pekan ujian akhir semester.", "expected_label": "aman", "notes": "Informasi fasilitas kampus"},

        # Borderline Keluhan & Sentimen Negatif Mahasiswa (Perlu Review)
        {"id": "test_19", "text": "Dosen penguji killer banget pas sidang skripsi tadi, bikin mental down parah sih.", "expected_label": "perlu_review", "notes": "Keluhan ujian ('parah sih')"},
        {"id": "test_20", "text": "Males banget tugas besar mata kuliah ini ga masuk akal revisinya tiap hari.", "expected_label": "perlu_review", "notes": "Keluhan beban kuliah ('males banget')"},
        {"id": "test_21", "text": "Dosen ga jelas ngasih kisi-kisi ujian beda jauh sama soal aslinya di kelas.", "expected_label": "perlu_review", "notes": "Keluhan pedagogi ('dosen ga jelas')"},
        {"id": "test_22", "text": "Capek banget ngurus birokrasi kampus yang dipersulit terus, parah sih pelayanannya.", "expected_label": "perlu_review", "notes": "Keluhan birokrasi ('parah sih')"},
        {"id": "test_23", "text": "Kelompok tugas tai banget ga ada yang respon di grup pas ditanya progres.", "expected_label": "perlu_review", "notes": "Sentimen kesal tugas kelompok ('tugas tai')"},
        {"id": "test_24", "text": "Bete maksimal jadwal ujian tabrakan dua matkul di hari yang sama males banget.", "expected_label": "perlu_review", "notes": "Keluhan jadwal akademik"},
        {"id": "test_25", "text": "Dosen pembimbing ga jelas susah banget ditemuin padahal udah nunggu 4 jam.", "expected_label": "perlu_review", "notes": "Sentimen dosen pembimbing"},
        {"id": "test_26", "text": "Parah sih aturan presensi semester ini telat 5 menit langsung dianggap alpa.", "expected_label": "perlu_review", "notes": "Keluhan regulasi perkuliahan"},
        {"id": "test_27", "text": "Males banget disuruh bayar iuran praktikum tambahan yang ga ada rinciannya.", "expected_label": "perlu_review", "notes": "Keluhan transparansi keuangan"},
        {"id": "test_28", "text": "Dosen ga jelas ngajar materi A pas kuis yang keluar rumus turunan materi Z.", "expected_label": "perlu_review", "notes": "Keluhan evaluasi ujian"},

        # Ujaran Kasar, Pelecehan, Spam & Penipuan (Berpotensi Melanggar)
        {"id": "test_29", "text": "Woy anjing jangan sembarangan tuduh orang nyontek pas ujian kuis!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar langsung ('anjing')"},
        {"id": "test_30", "text": "Dasar manusia bangsat lu mau sabotase proyek tugas akhir kelompok kita ya!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar eksplisit ('bangsat')"},
        {"id": "test_31", "text": "Otak tolol kayak lu ga pantes kuliah di jurusan teknik informatika!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran merendahkan ('tolol')"},
        {"id": "test_32", "text": "Mikir pake otak goblok jangan pake dengkul kalo ngerjain laporan lab!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar ('goblok')"},
        {"id": "test_33", "text": "Kelakuan bego lu bikin alat praktikum laboratorium meledak konslet!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar ('bego')"},
        {"id": "test_34", "text": "Mahasiswa bajingan lu kampret bisanya maling ide start-up orang lain!", "expected_label": "berpotensi_melanggar", "notes": "Ujaran kasar ('kampret')"},
        {"id": "test_35", "text": "Jual akun canva pro dan akun netflix murah legal wa.me/62899887766 langsung chat.", "expected_label": "berpotensi_melanggar", "notes": "Penipuan / spam komersial ilegal ('jual akun', 'wa.me/')"},
        {"id": "test_36", "text": "Pinjol cepat cair tanpa jaminan KTP untuk mahasiswa butuh dana cepat hubungi wa.me/628111222333.", "expected_label": "berpotensi_melanggar", "notes": "Penipuan pinjaman ilegal ('pinjol cepat cair')"},
        {"id": "test_37", "text": "Tawaran open bo mahasiswi cantik area kampus bisa nego halus kak.", "expected_label": "berpotensi_melanggar", "notes": "Pelecehan / prostitusi ('open bo')"},
        {"id": "test_38", "text": "Dasar lonte perebut pacar teman sendiri ga punya malu sama sekali.", "expected_label": "berpotensi_melanggar", "notes": "Cercaan seksual ('lonte')"},

        # Evasion Attacks: Leetspeak, Homoglyphs, Zero-Width, Separators
        {"id": "test_39", "text": "Orang kayak lu mah bener-bener g0bl0kkkkk ga ketulungan.", "expected_label": "berpotensi_melanggar", "notes": "Kombinasi leetspeak dan pengulangan ('g0bl0kkkkk')"},
        {"id": "test_40", "text": "Emang dasar аnjing ga tahu diri ya lu!", "expected_label": "berpotensi_melanggar", "notes": "Homoglif Cyrillic (huruf 'а' \u0430)"},
        {"id": "test_41", "text": "Kelakuan lu beneran kоntоl abis bikin malu satu angkatan.", "expected_label": "berpotensi_melanggar", "notes": "Homoglif Cyrillic (huruf 'о' \u043e)"},
        {"id": "test_42", "text": "Dasar an​jing lu nyelak antrean kantin fakultas!", "expected_label": "berpotensi_melanggar", "notes": "Penyisipan zero-width space (\u200B) di antara karakter"},
        {"id": "test_43", "text": "Woy t.o.l.o.l dengerin kalo dibilangin jangan bebal!", "expected_label": "berpotensi_melanggar", "notes": "Pemisah titik antar huruf ('t.o.l.o.l')"},
        {"id": "test_44", "text": "Kelakuan b-a-n-g-s-a-t kayak gitu jangan dibiasain di lingkungan kampus.", "expected_label": "berpotensi_melanggar", "notes": "Pemisah strip antar huruf ('b-a-n-g-s-a-t')"},
        {"id": "test_45", "text": "Woy 4.n.j.1.n.g lu berani banget fitnah nama baik kelompok gue!", "expected_label": "berpotensi_melanggar", "notes": "Kombinasi leetspeak dan pemisah titik ('4.n.j.1.n.g')"},
        {"id": "test_46", "text": "Dasar b​a​n​g​s​a​t uang kas organisasi dibawa kabur foya-foya!", "expected_label": "berpotensi_melanggar", "notes": "Multi zero-width spaces (\u200B) antar huruf"},
        {"id": "test_47", "text": "Muka lu b33333g00000 banget pas disuruh jelasin rumus kalkulus.", "expected_label": "berpotensi_melanggar", "notes": "Kombinasi leet dan pengulangan ganda ('b33333g00000')"},
        {"id": "test_48", "text": "Joki skripsi murah garansi lulus tanpa revisi wa.me/628555666777 terpercaya.", "expected_label": "berpotensi_melanggar", "notes": "Joki skripsi dan URL WhatsApp"},
        {"id": "test_49", "text": "Dosen penguji t0l0lll amat materi tahun lalu malah ditanyain lagi.", "expected_label": "berpotensi_melanggar", "notes": "Leetspeak dan pengulangan ('t0l0lll')"},
        {"id": "test_50", "text": "Tukang fitnah b4ng54t lu awas ketemu di parkiran kampus nanti!", "expected_label": "berpotensi_melanggar", "notes": "Leetspeak ganda ('b4ng54t')"}
    ]

    payload = {
        "metadata": {
            "dataset_name": "CampusFolio AI-2 Content Moderation Benchmark",
            "version": "2.0",
            "description": "Dataset benchmark klasifikasi awal moderasi konten kampus dengan pemisahan Dev Set dan Held-out Test Set.",
            "classes": ["aman", "perlu_review", "berpotensi_melanggar"],
            "dev_set_count": len(dev_set),
            "held_out_test_set_count": len(held_out_test_set),
            "total_samples": len(dev_set) + len(held_out_test_set)
        },
        "dev_set": dev_set,
        "held_out_test_set": held_out_test_set
    }

    out_path = Path(__file__).resolve().parent / "eval-moderation-dataset.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Dataset moderasi benchmark berhasil diperbarui di: {out_path}")
    print(f"Dev Set: {len(dev_set)} sampel | Held-out Test Set: {len(held_out_test_set)} sampel | Total: {len(dev_set) + len(held_out_test_set)} sampel")


if __name__ == "__main__":
    generate_moderation_dataset()
