"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { PortfolioStatusBadge } from "@/components/common/PortfolioStatusBadge";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import {
  CheckSquare,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Loader2,
  X,
  FileCheck,
  User as UserIcon,
} from "lucide-react";

interface ReviewQueueItem {
  portfolio_id: number;
  user_id: number;
  judul: string;
  deskripsi?: string | null;
  kategori: string;
  nomor_dokumen?: string | null;
  penerbit?: string | null;
  tanggal_terbit?: string | null;
  file_url?: string | null;
  has_file: boolean;
  status_verifikasi: string;
  submitted_at?: string | null;
  created_at: string;
  author_nama: string;
  author_nim?: string | null;
  author_jurusan?: string | null;
  author_avatar_url?: string | null;
  is_duplicate_dokumen: boolean;
  skills: Array<{ skill_id: number; nama: string; kategori: string }>;
}

export default function PortfolioReviewPage() {
  const toast = useToast();
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [targetJurusan, setTargetJurusan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"terverifikasi" | "ditolak">("terverifikasi");
  const [catatanVerifikasi, setCatatanVerifikasi] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{
        items: ReviewQueueItem[];
        total: number;
        jurusan?: string | null;
      }>("/portfolio/review-queue");
      setQueue(res.data.items);
      setTargetJurusan(res.data.jurusan || null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat antrean review portofolio.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Open Document with Popup Blocker Defense
  const handleViewDocument = async (portfolioId: number) => {
    const win = window.open("about:blank", "_blank");
    try {
      const res = await apiClient.get<{ signed_url: string }>(`/portfolio/${portfolioId}/file`);
      if (win) {
        win.location.href = res.data.signed_url;
      }
    } catch (err: any) {
      if (win) win.close();
      toast.error(err.message || "Gagal membuka berkas bukti.");
    }
  };

  const handleOpenReview = (item: ReviewQueueItem) => {
    setSelectedItem(item);
    setReviewDecision("terverifikasi");
    setCatatanVerifikasi("");
    setModalError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setModalError(null);

    if (reviewDecision === "ditolak") {
      if (!catatanVerifikasi.trim() || catatanVerifikasi.trim().length < 5) {
        setModalError("Catatan perbaikan wajib diisi minimal 5 karakter jika pengajuan ditolak.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiClient.patch(`/portfolio/${selectedItem.portfolio_id}/review`, {
        status_verifikasi: reviewDecision,
        catatan_verifikasi: catatanVerifikasi.trim() || null,
      });

      toast.success(
        reviewDecision === "terverifikasi"
          ? `Capaian "${selectedItem.judul}" berhasil diverifikasi dan poin SKPI dicatat!`
          : `Pengajuan "${selectedItem.judul}" telah ditolak dengan catatan perbaikan.`
      );

      setSelectedItem(null);
      await fetchQueue();
    } catch (err: any) {
      setModalError(err.message || "Gagal menyimpan keputusan verifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGate
      allowedRoles={["moderator", "admin"]}
      fallback={
        <div className="p-8 text-center rounded-2xl bg-white border border-border-subtle">
          <ShieldAlert className="w-10 h-10 text-accent-danger-accessible mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 font-heading">Akses Dibatasi</h2>
          <p className="mt-1 text-xs text-slate-500 font-body">
            Halaman ini hanya dapat diakses oleh Kaprodi / Moderator program studi dan Administrator Kampus.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Antrean Verifikasi Portofolio SKPI
            </h2>
            {targetJurusan && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-primary text-[11px] font-semibold">
                Prodi {targetJurusan}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-body mt-1">
            Validasi dokumen bukti dan capaian portofolio mahasiswa se-program studi untuk pengakuan resmi Surat Keterangan Pendamping Ijazah.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat antrean pengajuan...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-border-subtle">
            <CheckCircle2 className="w-10 h-10 text-accent-emerald-accessible mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Antrean Bersih</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tidak ada pengajuan capaian SKPI yang menunggu review saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.portfolio_id}
                className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {item.kategori.replace("_", " ")}
                    </span>
                    <PortfolioStatusBadge status="menunggu_review" />
                    {item.is_duplicate_dokumen && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-accent-amber-accessible border border-amber-200 text-[11px] font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Duplikasi Terdeteksi</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {item.judul}
                  </h3>

                  {item.deskripsi && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}

                  {/* Student details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">
                      {item.author_nama} {item.author_nim && `(${item.author_nim})`}
                    </span>
                    {item.author_jurusan && <span>{item.author_jurusan}</span>}
                    {item.nomor_dokumen && (
                      <span>
                        <strong className="text-slate-700">No:</strong> {item.nomor_dokumen}
                      </span>
                    )}
                    {item.penerbit && (
                      <span>
                        <strong className="text-slate-700">Penerbit:</strong> {item.penerbit}
                      </span>
                    )}
                    {item.submitted_at && (
                      <span>
                        <strong className="text-slate-700">Diajukan:</strong>{" "}
                        {new Date(item.submitted_at).toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.has_file && (
                    <button
                      type="button"
                      onClick={() => handleViewDocument(item.portfolio_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>Lihat Dokumen</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenReview(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Tinjau Berkas</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Tinjauan Kaprodi */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-border-subtle p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Keputusan Verifikasi SKPI
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                {modalError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-accent-danger-accessible flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">{selectedItem.judul}</p>
                  <p className="mt-1 text-slate-500">
                    Pengusul: {selectedItem.author_nama} ({selectedItem.author_nim || "-"})
                  </p>
                  {selectedItem.nomor_dokumen && (
                    <p className="text-slate-500">No. Dokumen: {selectedItem.nomor_dokumen}</p>
                  )}
                </div>

                {/* Decision radio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Tindakan Keputusan
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewDecision("terverifikasi")}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        reviewDecision === "terverifikasi"
                          ? "border-emerald-500 bg-emerald-50 text-accent-emerald-accessible ring-2 ring-emerald-500/20"
                          : "border-border-subtle bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Setujui Capaian
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewDecision("ditolak")}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        reviewDecision === "ditolak"
                          ? "border-red-500 bg-red-50 text-accent-danger-accessible ring-2 ring-red-500/20"
                          : "border-border-subtle bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Tolak / Minta Revisi
                    </button>
                  </div>
                </div>

                {/* Catatan Verifikasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Verifikasi {reviewDecision === "ditolak" && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={catatanVerifikasi}
                    onChange={(e) => setCatatanVerifikasi(e.target.value)}
                    placeholder={
                      reviewDecision === "ditolak"
                        ? "Jelaskan alasan penolakan atau bagian berkas yang perlu diperbaiki mahasiswa..."
                        : "Catatan opsional apresiasi atau validasi..."
                    }
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50 ${
                      reviewDecision === "terverifikasi"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{reviewDecision === "terverifikasi" ? "Konfirmasi Setujui" : "Kirim Penolakan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
