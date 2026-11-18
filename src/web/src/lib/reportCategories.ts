export type ReportCategoryValue =
  | "konten_tidak_pantas"
  | "spam"
  | "ujaran_kebencian"
  | "misinformasi"
  | "plagiarisme"
  | "lainnya";

export interface ReportCategoryItem {
  value: ReportCategoryValue;
  label: string;
  description: string;
  placeholder: string;
  requiresReason: boolean;
}

export const REPORT_CATEGORIES: ReportCategoryItem[] = [
  {
    value: "konten_tidak_pantas",
    label: "Konten Tidak Pantas / Vulgar",
    description: "Materi pornografi, ketelanjangan, kekerasan, atau pelanggaran norma kesopanan umum.",
    placeholder: "Jelaskan secara spesifik bagian konten yang melanggar kesopanan (opsional)...",
    requiresReason: false,
  },
  {
    value: "spam",
    label: "Spam / Promosi Ilegal",
    description: "Iklan komersial tanpa izin, promosi pinjol/judi, atau postingan berulang yang mengganggu linimasa.",
    placeholder: "Keterangan promosi atau pola spam yang ditemukan (opsional)...",
    requiresReason: false,
  },
  {
    value: "ujaran_kebencian",
    label: "Pelecehan / Ujaran Kebencian",
    description: "Serangan personal, perundungan siber (bullying), diskriminasi, atau intimidasi antarmahasiswa.",
    placeholder: "Jelaskan sasaran pelecehan atau perundungan yang terjadi (opsional)...",
    requiresReason: false,
  },
  {
    value: "misinformasi",
    label: "Misinformasi / Berita Menyesatkan",
    description: "Penyebaran hoaks, manipulasi fakta akademik, atau pengumuman palsu perkuliahan.",
    placeholder: "Klarifikasi fakta yang keliru atau sumber informasi resmi jika ada (opsional)...",
    requiresReason: false,
  },
  {
    value: "plagiarisme",
    label: "Plagiarisme / Pelanggaran Hak Cipta",
    description: "Mengklaim karya ilmiah, tugas, kode, atau portofolio orang lain tanpa atribusi yang sah.",
    placeholder: "Sebutkan sumber asli atau tautan karya jika Anda mengetahuinya (opsional)...",
    requiresReason: false,
  },
  {
    value: "lainnya",
    label: "Pelanggaran Etika Lainnya",
    description: "Pelanggaran tata tertib dan pedoman etika sivitas akademika kampus lainnya.",
    placeholder: "Jelaskan secara spesifik mengapa konten ini melanggar pedoman etika kampus (wajib, min 5 karakter)...",
    requiresReason: true,
  },
];
