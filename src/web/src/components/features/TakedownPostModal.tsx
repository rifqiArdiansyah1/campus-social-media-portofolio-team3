"use client";

import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertOctagon, Loader2, ShieldAlert, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export interface TakedownPostModalProps {
  isOpen: boolean;
  postId: number | null;
  postAuthorName?: string;
  onClose: () => void;
  onSuccess?: (postId: number) => void;
}

export function TakedownPostModal({
  isOpen,
  postId,
  postAuthorName,
  onClose,
  onSuccess,
}: TakedownPostModalProps) {
  const toast = useToast();
  const [alasan, setAlasan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setAlasan("");
      setErrorMessage(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId) return;

    const trimmedAlasan = alasan.trim();
    if (trimmedAlasan.length < 5) {
      setErrorMessage("Alasan takedown minimal 5 karakter.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await apiClient.post(`/posts/${postId}/takedown`, {
        alasan_hapus: trimmedAlasan,
      });

      toast.success(`Postingan #${postId} berhasil di-takedown.`);
      setAlasan("");
      if (onSuccess) onSuccess(postId);
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMessage(detail || "Gagal melakukan takedown postingan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
        <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                Takedown Postingan
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

          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <p className="font-semibold mb-1">Peringatan Tindakan Takedown:</p>
            <p className="leading-relaxed">
              Tindakan ini akan menyembunyikan postingan dari seluruh feed publik, memutus akses berkas gambar terkait, dan menyelesaikan seluruh laporan aktif.
            </p>
          </div>

          {postAuthorName && (
            <p className="mt-3 text-xs text-slate-500 font-body">
              Penulis postingan: <span className="font-semibold text-slate-800">{postAuthorName}</span>
            </p>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="alasan-takedown" className="block text-xs font-semibold text-slate-700 font-body">
                  Alasan Penegakan Takedown <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {alasan.length}/1000
                </span>
              </div>
              <textarea
                id="alasan-takedown"
                rows={4}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                disabled={isSubmitting}
                maxLength={1000}
                placeholder="Tuliskan pelanggaran pasal/pedoman komunitas kampus sebagai catatan audit..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none font-body"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Wajib diisi minimal 5 karakter untuk rekam jejak audit kampus.
              </p>
            </div>

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
                    <span>Memproses Takedown...</span>
                  </>
                ) : (
                  <span>Takedown Sekarang</span>
                )}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
