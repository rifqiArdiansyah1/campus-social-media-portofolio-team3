"use client";

import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertTriangle, Flag, Loader2, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export interface ReportPostModalProps {
  isOpen: boolean;
  postId: number | null;
  postAuthorName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_CATEGORIES = [
  { value: "konten_tidak_pantas", label: "Konten Tidak Pantas / Vulgar" },
  { value: "spam", label: "Spam / Iklan Komersial Ilegal" },
  { value: "ujaran_kebencian", label: "Ujaran Kebencian / SARA / Pelecehan" },
  { value: "misinformasi", label: "Misinformasi / Berita Bohong" },
  { value: "plagiarisme", label: "Plagiarisme / Pelanggaran Hak Cipta" },
  { value: "lainnya", label: "Lainnya" },
];

export function ReportPostModal({
  isOpen,
  postId,
  postAuthorName,
  onClose,
  onSuccess,
}: ReportPostModalProps) {
  const toast = useToast();
  const [kategori, setKategori] = useState("konten_tidak_pantas");
  const [alasan, setAlasan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setKategori("konten_tidak_pantas");
    setAlasan("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    const trimmedAlasan = alasan.trim();
    if (trimmedAlasan.length < 5) {
      setErrorMessage("Alasan pelaporan minimal 5 karakter.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await apiClient.post("/reports", {
        post_id: postId,
        kategori_laporan: kategori,
        alasan: trimmedAlasan,
      });

      toast.success(
        "Laporan Anda telah berhasil dikirim dan akan segera ditinjau oleh tim moderasi kampus."
      );
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const code = err.response?.data?.code;
      const detail = err.response?.data?.detail;

      if (code === "DUPLICATE_ACTIVE_REPORT" || err.response?.status === 409) {
        setErrorMessage("Anda sudah memiliki laporan aktif untuk postingan ini yang sedang ditinjau.");
      } else if (code === "REPORT_RATE_LIMIT_EXCEEDED" || err.response?.status === 429) {
        setErrorMessage("Batas pelaporan harian tercapai (maksimal 20 laporan per 24 jam).");
      } else if (code === "SELF_REPORT_NOT_ALLOWED") {
        setErrorMessage("Anda tidak dapat melaporkan postingan milik sendiri.");
      } else {
        setErrorMessage(detail || "Terjadi kesalahan saat mengirimkan laporan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
        <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-600">
              <Flag className="w-5 h-5 flex-shrink-0" />
              <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                Laporkan Postingan
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {postAuthorName && (
            <p className="mt-3 text-xs text-slate-500 font-body">
              Melaporkan postingan dari <span className="font-semibold text-slate-800">{postAuthorName}</span>. Laporan ini bersifat anonim dan tidak akan diketahui oleh pemilik postingan.
            </p>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Kategori Pelanggaran */}
            <div>
              <label htmlFor="kategori-laporan" className="block text-xs font-semibold text-slate-700 mb-1.5 font-body">
                Kategori Pelanggaran <span className="text-rose-500">*</span>
              </label>
              <select
                id="kategori-laporan"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-body"
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Penjelasan Alasan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="alasan-laporan" className="block text-xs font-semibold text-slate-700 font-body">
                  Alasan / Keterangan Pelanggaran <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {alasan.length}/1000
                </span>
              </div>
              <textarea
                id="alasan-laporan"
                rows={4}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                disabled={isSubmitting}
                maxLength={1000}
                placeholder="Jelaskan secara spesifik mengapa konten ini melanggar pedoman etika/akademik kampus..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none font-body"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Minimal 5 karakter. Berikan konteks yang objektif untuk mempermudah investigasi Kaprodi.
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || alasan.trim().length < 5}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <span>Kirim Laporan</span>
                )}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
