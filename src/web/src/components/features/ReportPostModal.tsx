"use client";

import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  AlertTriangle,
  Flag,
  Loader2,
  X,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  MegaphoneOff,
  UserX,
  FileWarning,
  Info,
  HelpCircle,
  Check,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { REPORT_CATEGORIES, ReportCategoryValue } from "@/lib/reportCategories";

export interface ReportPostModalProps {
  isOpen: boolean;
  postId: number | null;
  postAuthorName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_ICONS: Record<ReportCategoryValue, React.ComponentType<{ className?: string }>> = {
  konten_tidak_pantas: AlertOctagon,
  spam: MegaphoneOff,
  ujaran_kebencian: UserX,
  misinformasi: Info,
  plagiarisme: FileWarning,
  lainnya: HelpCircle,
};

export function ReportPostModal({
  isOpen,
  postId,
  postAuthorName,
  onClose,
  onSuccess,
}: ReportPostModalProps) {
  const toast = useToast();
  const [kategori, setKategori] = useState<ReportCategoryValue>("konten_tidak_pantas");
  const [alasan, setAlasan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedCategoryItem = REPORT_CATEGORIES.find((c) => c.value === kategori);
  const isReasonRequired = selectedCategoryItem?.requiresReason ?? false;
  const trimmedAlasan = alasan.trim();

  // Validasi: Wajib min 5 karakter jika kategori 'lainnya', atau jika user sudah mengetik teks pada kategori lain
  const isTooShort = isReasonRequired
    ? trimmedAlasan.length < 5
    : alasan.length > 0 && trimmedAlasan.length < 5;
  const isTooLong = alasan.length > 1000;
  const isSubmitDisabled = isSubmitting || isTooShort || isTooLong;

  const resetForm = () => {
    setKategori("konten_tidak_pantas");
    setAlasan("");
    setErrorMessage(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || isSubmitDisabled) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await apiClient.post("/reports", {
        post_id: postId,
        kategori_laporan: kategori,
        alasan: trimmedAlasan || undefined,
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
      toast.success("Laporan berhasil dikirim ke tim moderasi prodi.");
    } catch (err: any) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      const detail = err.response?.data?.detail;

      if (code === "DUPLICATE_ACTIVE_REPORT" || status === 409) {
        setErrorMessage(
          "Anda sudah memiliki laporan aktif untuk postingan ini yang sedang ditinjau."
        );
        if (onSuccess) onSuccess();
      } else if (code === "REPORT_RATE_LIMIT_EXCEEDED" || status === 429) {
        setErrorMessage(
          "Batas pelaporan maksimal (20 laporan per 24 jam) tercapai. Silakan coba lagi besok."
        );
      } else if (code === "SELF_REPORT_NOT_ALLOWED" || status === 422) {
        setErrorMessage(detail || "Anda tidak dapat melaporkan postingan milik sendiri.");
      } else if (code === "POST_NOT_FOUND" || status === 404) {
        setErrorMessage("Postingan ini telah dihapus atau tidak tersedia lagi.");
      } else if (status === 401) {
        setErrorMessage("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
      } else {
        setErrorMessage(
          detail || "Gagal mengirimkan laporan. Periksa koneksi internet Anda dan coba lagi."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIndex = REPORT_CATEGORIES.findIndex((c) => c.value === kategori);
      const nextIndex = (currentIndex + 1) % REPORT_CATEGORIES.length;
      setKategori(REPORT_CATEGORIES[nextIndex].value);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const currentIndex = REPORT_CATEGORIES.findIndex((c) => c.value === kategori);
      const prevIndex = (currentIndex - 1 + REPORT_CATEGORIES.length) % REPORT_CATEGORIES.length;
      setKategori(REPORT_CATEGORIES[prevIndex].value);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      {/* Backdrop with subtle blur */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
        <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all border border-slate-200">
          {/* Header */}
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
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            /* In-Modal Success State */
            <div
              className="py-6 flex flex-col items-center text-center space-y-3"
              aria-live="polite"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Laporan Berhasil Dikirim
              </h3>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed font-body">
                Laporan Anda telah masuk ke antrean moderasi program studi. Anda akan menerima
                notifikasi di lonceng saat tim moderasi menyelesaikan evaluasi. Postingan ini telah
                disembunyikan dari linimasa Anda.
              </p>
              <p className="text-[11px] text-slate-400 font-body">
                Ingin membatasi interaksi dengan akun ini? Anda dapat mengatur blokir melalui profil
                pengguna.
              </p>
              <div className="pt-3 w-full">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition shadow-xs"
                >
                  Kembali ke Linimasa
                </button>
              </div>
            </div>
          ) : (
            /* Report Form */
            <>
              {postAuthorName && (
                <p className="mt-3 text-xs text-slate-600 font-body">
                  Melaporkan postingan dari{" "}
                  <span className="font-semibold text-slate-900">{postAuthorName}</span>.
                </p>
              )}

              {/* Factual Privacy Reassurance Callout */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Kerahasiaan Pelaporan</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-body">
                  Identitas Anda <strong>tidak ditampilkan</strong> kepada pemilik postingan.
                  Moderator program studi (Kaprodi) dan admin kampus dapat melihat identitas pelapor
                  guna verifikasi dan penegakan tata tertib akademik. Postingan tetap dapat dilihat
                  orang lain sampai proses peninjauan selesai.
                </p>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div
                  className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2"
                  aria-live="polite"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* 6 Radio Cards Categories */}
                <div className="space-y-2">
                  <label
                    id="category-heading"
                    className="block text-xs font-semibold text-slate-700 font-heading"
                  >
                    Pilih Kategori Pelanggaran <span className="text-rose-500">*</span>
                  </label>
                  <div
                    role="radiogroup"
                    aria-labelledby="category-heading"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    onKeyDown={handleKeyDown}
                  >
                    {REPORT_CATEGORIES.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.value];
                      const isSelected = kategori === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setKategori(cat.value);
                            setErrorMessage(null);
                          }}
                          className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 focus:outline-none focus:ring-2 focus:ring-primary ${
                            isSelected
                              ? "border-primary bg-indigo-50/60 ring-1 ring-primary shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-semibold ${
                                  isSelected ? "text-primary font-heading" : "text-slate-800"
                                }`}
                              >
                                {cat.label}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-body">
                              {cat.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional/Required Reason Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="alasan-laporan"
                      className="block text-xs font-semibold text-slate-700 font-body"
                    >
                      Alasan / Keterangan Pelanggaran{" "}
                      {isReasonRequired ? (
                        <span className="text-rose-500 font-semibold">* (Wajib, min 5 karakter)</span>
                      ) : (
                        <span className="text-slate-400 font-normal text-[11px]">(Opsional)</span>
                      )}
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        isTooLong || (isReasonRequired && alasan.length > 0 && trimmedAlasan.length < 5)
                          ? "text-rose-600 font-semibold"
                          : "text-slate-400"
                      }`}
                    >
                      {alasan.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="alasan-laporan"
                    rows={3}
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    disabled={isSubmitting}
                    maxLength={1000}
                    placeholder={
                      selectedCategoryItem?.placeholder ||
                      "Jelaskan secara spesifik bagian konten yang melanggar pedoman etika kampus..."
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none font-body"
                  />
                  {isReasonRequired && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Kategori &quot;Lainnya&quot; membutuhkan keterangan minimal 5 karakter agar
                      dapat dievaluasi oleh Kaprodi.
                    </p>
                  )}
                </div>

                {/* Footer Action Buttons */}
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
                    disabled={isSubmitDisabled}
                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs flex items-center gap-1.5"
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
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
