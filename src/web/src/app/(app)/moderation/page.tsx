"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { RoleGate } from "@/components/auth/RoleGate";
import {
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Flag,
  FileCheck,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

interface ModerationQueueItem {
  post_id: number;
  user_id: number;
  author_name: string;
  author_jurusan?: string | null;
  isi: string;
  gambar_url?: string | null;
  tipe: string;
  status: string;
  created_at: string;
  label_ai?: string | null;
  kategori_ai?: string | null;
  confidence?: number | null;
  penjelasan_ai?: string | null;
  jumlah_laporan_aktif: number;
  kategori_laporan: string[];
}

interface ReportItem {
  report_id: number;
  post_id: number;
  pelapor_id: number;
  pelapor_nama?: string | null;
  post_isi_snippet?: string | null;
  alasan: string;
  kategori_laporan: string;
  status: string;
  ditinjau_oleh?: number | null;
  tindakan_diambil?: string | null;
  catatan_tinjauan?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

interface SummaryMetrics {
  post_menunggu: number;
  laporan_baru: number;
  portofolio_menunggu: number;
}

export default function ModerationAuditPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"queue" | "reports">("queue");

  // Summary Metrics
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    post_menunggu: 0,
    laporan_baru: 0,
    portofolio_menunggu: 0,
  });

  // Tab 1: AI Triage Queue
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  // Tab 2: User Reports
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>("baru");

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    post: ModerationQueueItem | null;
    action: "setujui" | "tolak" | "minta_revisi" | "hapus_konten" | null;
    note: string;
    isSubmitting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    post: null,
    action: null,
    note: "",
    isSubmitting: false,
    error: null,
  });

  // Fetch summary metrics
  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get<SummaryMetrics>("/moderation/summary");
      setMetrics(res.data);
    } catch {
      // Ignore background summary error
    }
  }, []);

  // Fetch AI triage queue
  const fetchQueue = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      const res = await apiClient.get<ModerationQueueItem[]>("/moderation/queue");
      setQueue(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal memuat antrean tinjauan.");
    } finally {
      setIsLoadingQueue(false);
    }
  }, [toast]);

  // Fetch reports queue
  const fetchReports = useCallback(async () => {
    try {
      setIsLoadingReports(true);
      const res = await apiClient.get<ReportItem[]>("/reports", {
        params: reportFilter ? { status: reportFilter } : {},
      });
      setReports(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal memuat daftar laporan pengguna.");
    } finally {
      setIsLoadingReports(false);
    }
  }, [reportFilter, toast]);

  useEffect(() => {
    fetchSummary();
    if (activeTab === "queue") {
      fetchQueue();
    } else {
      fetchReports();
    }
  }, [activeTab, fetchSummary, fetchQueue, fetchReports]);

  // Handle open decision modal
  const handleOpenDecision = (
    post: ModerationQueueItem,
    action: "setujui" | "tolak" | "minta_revisi" | "hapus_konten"
  ) => {
    setDecisionModal({
      isOpen: true,
      post,
      action,
      note: action === "setujui" ? "Konten telah ditinjau dan dinyatakan memenuhi pedoman komunitas kampus." : "",
      isSubmitting: false,
      error: null,
    });
  };

  // Submit decision
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal.post || !decisionModal.action) return;

    const trimmedNote = decisionModal.note.trim();
    if (decisionModal.action !== "setujui" && trimmedNote.length < 5) {
      setDecisionModal((prev) => ({
        ...prev,
        error: "Catatan pertimbangan minimal 5 karakter.",
      }));
      return;
    }

    try {
      setDecisionModal((prev) => ({ ...prev, isSubmitting: true, error: null }));
      await apiClient.post(`/moderation/${decisionModal.post.post_id}/decision`, {
        keputusan: decisionModal.action,
        catatan: trimmedNote || undefined,
      });

      const actionLabels = {
        setujui: "disetujui tayang",
        tolak: "ditolak",
        minta_revisi: "diminta perbaikan",
        hapus_konten: "di-takedown",
      };

      toast.success(`Postingan #${decisionModal.post.post_id} berhasil ${actionLabels[decisionModal.action]}.`);
      setQueue((prev) => prev.filter((p) => p.post_id !== decisionModal.post?.post_id));
      setDecisionModal((prev) => ({ ...prev, isOpen: false }));
      fetchSummary();
    } catch (err: any) {
      setDecisionModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: err.response?.data?.detail || "Gagal menyimpan keputusan moderasi.",
      }));
    }
  };

  // Handle report inline status transition
  const handleReportAction = async (
    reportId: number,
    status: "diproses" | "selesai" | "diabaikan",
    tindakan: "sedang_investigasi" | "peringatan" | "laporan_ditolak"
  ) => {
    try {
      await apiClient.patch(`/reports/${reportId}`, {
        status,
        tindakan_diambil: tindakan,
      });
      toast.success(`Laporan #${reportId} berhasil diperbarui.`);
      setReports((prev) => prev.filter((r) => r.report_id !== reportId));
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal memperbarui status laporan.");
    }
  };

  return (
    <RoleGate
      allowedRoles={["moderator", "admin"]}
      fallback={
        <div className="p-8 text-center rounded-2xl bg-white border border-border-subtle max-w-xl mx-auto">
          <ShieldAlert className="w-10 h-10 text-accent-danger-accessible mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 font-heading">Akses Dibatasi</h2>
          <p className="mt-1 text-xs text-slate-500 font-body">
            Halaman moderasi hanya dapat diakses oleh Kaprodi / Moderator jurusan dan Administrator Kampus.
          </p>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Tata Kelola & Moderasi Konten
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-body mt-1">
              Audit antrean postingan berisiko dari kecerdasan buatan (AI-2) dan tanggapan laporan pelanggaran sivitas akademika.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchSummary();
              if (activeTab === "queue") fetchQueue();
              else fetchReports();
            }}
            className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Counter Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 font-body uppercase tracking-wider">
                Postingan Tinjauan
              </p>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {metrics.post_menunggu}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 font-body uppercase tracking-wider">
                Laporan Baru
              </p>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {metrics.laporan_baru}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 font-body uppercase tracking-wider">
                Portofolio Menunggu
              </p>
              <h3 className="text-lg font-bold text-slate-900 font-heading">
                {metrics.portofolio_menunggu}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border-subtle pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === "queue"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Antrean Postingan AI Triage</span>
            {metrics.post_menunggu > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "queue" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
              }`}>
                {metrics.post_menunggu}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === "reports"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Laporan Sivitas</span>
            {metrics.laporan_baru > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "reports" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
              }`}>
                {metrics.laporan_baru}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: AI Triage Queue */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {isLoadingQueue ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-slate-500">Memuat antrean tinjauan...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-accent-emerald-accessible mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">Antrean Tinjauan Bersih</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tidak ada postingan yang memerlukan keputusan moderasi saat ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((item) => {
                  const isSevere = item.label_ai === "berpotensi_melanggar";
                  const confidencePct = item.confidence ? Math.round(item.confidence * 100) : 0;

                  return (
                    <article
                      key={item.post_id}
                      data-testid={`moderation-post-${item.post_id}`}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                    >
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* AI Recommendation Banner */}
                          {item.label_ai ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                isSevere
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {isSevere ? (
                                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              <span>
                                Saran AI: {isSevere ? "Berpotensi Melanggar" : "Perlu Tinjauan"}
                                {item.confidence !== null && ` (${confidencePct}%)`}
                              </span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                              Status: {item.status}
                            </span>
                          )}

                          {item.kategori_ai && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Kategori: {item.kategori_ai}
                            </span>
                          )}
                        </div>

                        {item.jumlah_laporan_aktif > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <Flag className="w-3.5 h-3.5" />
                            <span>{item.jumlah_laporan_aktif} Laporan Aktif</span>
                          </span>
                        )}
                      </div>

                      {/* AI Explanation Callout if available */}
                      {item.penjelasan_ai && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                          <span className="font-semibold text-slate-900">Alasan AI: </span>
                          <span>{item.penjelasan_ai}</span>
                        </div>
                      )}

                      {/* Author Info */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div>
                          <span className="font-bold text-slate-800">{item.author_name}</span>
                          {item.author_jurusan && <span> • {item.author_jurusan}</span>}
                        </div>
                        <time dateTime={item.created_at}>
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>

                      {/* Content Body */}
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-body whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        {item.isi}
                      </p>

                      {/* Attached Photo */}
                      {item.gambar_url && (
                        <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <Image
                            src={item.gambar_url}
                            alt="Lampiran postingan yang ditinjau"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 600px"
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(item, "setujui")}
                          className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Setujui Tayang</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDecision(item, "minta_revisi")}
                          className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Minta Revisi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDecision(item, "tolak")}
                          className="px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tolak</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDecision(item, "hapus_konten")}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Takedown</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: User Reports */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {["baru", "diproses", "selesai", "diabaikan"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setReportFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-colors ${
                    reportFilter === st
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {isLoadingReports ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-slate-500">Memuat laporan pengguna...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-accent-emerald-accessible mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">Tidak Ada Laporan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tidak ditemukan laporan pengguna untuk status &quot;{reportFilter}&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((rep) => (
                  <div
                    key={rep.report_id}
                    data-testid={`report-card-${rep.report_id}`}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                          {rep.kategori_laporan.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Laporan #{rep.report_id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rep.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-500">
                        Pelapor: <span className="font-semibold text-slate-800">{rep.pelapor_nama || "Anonim"}</span>
                      </p>
                      <p className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-body">
                        &quot;{rep.alasan}&quot;
                      </p>
                    </div>

                    {rep.post_isi_snippet && (
                      <p className="text-[11px] text-slate-400 italic truncate">
                        Kutipan Post #{rep.post_id}: &quot;{rep.post_isi_snippet}...&quot;
                      </p>
                    )}

                    {/* Report action buttons */}
                    {(rep.status === "baru" || rep.status === "diproses") && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 text-xs">
                        {rep.status === "baru" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleReportAction(rep.report_id, "diproses", "sedang_investigasi")
                            }
                            className="px-3 py-1.5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            Tandai Diproses
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(rep.report_id, "selesai", "peringatan")
                          }
                          className="px-3 py-1.5 rounded-xl font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          Selesaikan (Peringatan)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(rep.report_id, "diabaikan", "laporan_ditolak")
                          }
                          className="px-3 py-1.5 rounded-xl font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
                        >
                          Abaikan Laporan
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DECISION MODAL */}
        <Dialog
          open={decisionModal.isOpen}
          onClose={() => {
            if (!decisionModal.isSubmitting) {
              setDecisionModal((prev) => ({ ...prev, isOpen: false }));
            }
          }}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
            <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <DialogTitle className="text-base font-bold text-slate-900 font-heading capitalize">
                  Konfirmasi Keputusan: {decisionModal.action?.replace("_", " ")}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setDecisionModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={decisionModal.isSubmitting}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  aria-label="Tutup modal"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {decisionModal.error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{decisionModal.error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitDecision} className="space-y-4">
                <div>
                  <label htmlFor="catatan-keputusan" className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Pertimbangan / Instruksi Perbaikan{" "}
                    {decisionModal.action !== "setujui" && <span className="text-rose-500">*</span>}
                  </label>
                  <textarea
                    id="catatan-keputusan"
                    rows={4}
                    value={decisionModal.note}
                    onChange={(e) =>
                      setDecisionModal((prev) => ({ ...prev, note: e.target.value }))
                    }
                    disabled={decisionModal.isSubmitting}
                    placeholder="Tuliskan catatan evaluasi objektif untuk sivitas pembuat konten..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    {decisionModal.action === "setujui"
                      ? "Opsional untuk persetujuan."
                      : "Wajib diisi minimal 5 karakter untuk pertanggungjawaban audit."}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDecisionModal((prev) => ({ ...prev, isOpen: false }))}
                    disabled={decisionModal.isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      decisionModal.isSubmitting ||
                      (decisionModal.action !== "setujui" && decisionModal.note.trim().length < 5)
                    }
                    className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50 ${
                      decisionModal.action === "hapus_konten" || decisionModal.action === "tolak"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : decisionModal.action === "minta_revisi"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {decisionModal.isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Simpan Keputusan</span>
                    )}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    </RoleGate>
  );
}
