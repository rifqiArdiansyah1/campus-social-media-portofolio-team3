"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
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
  ExternalLink,
  Search,
  Filter,
  FileText,
  User as UserIcon,
  Award,
  History,
  X,
  Download,
  BookOpen,
} from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { apiClient } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { TakedownPostModal } from "@/components/features/TakedownPostModal";
import { PortfolioStatusBadge } from "@/components/common/PortfolioStatusBadge";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

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

interface ReportedPostAuthor {
  user_id: number;
  nama: string;
  nim?: string | null;
  jurusan?: string | null;
  avatar_url?: string | null;
}

interface ReportedPostBrief {
  post_id: number;
  isi: string;
  gambar_url?: string | null;
  status: string;
  created_at: string;
  author: ReportedPostAuthor;
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
  post?: ReportedPostBrief | null;
}

interface PortfolioQueueItem {
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
  status_verifikasi: "draft" | "menunggu_review" | "terverifikasi" | "ditolak";
  catatan_verifikasi?: string | null;
  submitted_at?: string | null;
  verified_at?: string | null;
  created_at: string;
  author_nama: string;
  author_nim?: string | null;
  author_jurusan?: string | null;
  author_avatar_url?: string | null;
  is_duplicate_dokumen: boolean;
  skills: Array<{ skill_id: number; nama: string; kategori: string }>;
}

interface DuplicateMatchItem {
  portfolio_id: number;
  judul: string;
  nomor_dokumen?: string | null;
  penerbit?: string | null;
  kategori: string;
  status_verifikasi: string;
  tanggal_terbit?: string | null;
  created_at: string;
  author_nama: string;
  author_nim?: string | null;
  author_jurusan?: string | null;
}

interface DuplicateCheckResult {
  is_duplicate: boolean;
  duplicate_count: number;
  matches_same_department: DuplicateMatchItem[];
  has_cross_department_matches: boolean;
  cross_department_count: number;
  cross_department_message?: string | null;
  is_coauthor_doi: boolean;
  notice?: string | null;
}

interface SummaryMetrics {
  post_menunggu: number;
  laporan_baru: number;
  portofolio_menunggu: number;
}

const REPORT_CATEGORIES = [
  { id: "all", label: "Semua Kategori" },
  { id: "konten_tidak_pantas", label: "Konten Tidak Pantas" },
  { id: "spam", label: "Spam & Penipuan" },
  { id: "pelecehan", label: "Pelecehan / Kebencian" },
  { id: "misinformasi", label: "Misinformasi" },
  { id: "plagiarisme", label: "Plagiarisme" },
  { id: "lainnya", label: "Lainnya" },
];

// Helper to escape formula injection in CSV exports
function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

// ==========================================
// MAIN AUDIT PAGE CONTENT
// ==========================================

function ModerationAuditPageContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab Deep-linking from URL
  const tabParam = searchParams?.get("tab");
  const initialTab: "queue" | "reports" | "portfolio" =
    tabParam === "reports"
      ? "reports"
      : tabParam === "portfolio" || tabParam === "skpi"
      ? "portfolio"
      : "queue";

  const [activeTab, setActiveTab] = useState<"queue" | "reports" | "portfolio">(initialTab);

  // Synchronize activeTab when tabParam in URL changes externally
  useEffect(() => {
    if (tabParam === "reports" && activeTab !== "reports") {
      setActiveTab("reports");
    } else if ((tabParam === "portfolio" || tabParam === "skpi") && activeTab !== "portfolio") {
      setActiveTab("portfolio");
    } else if (tabParam === "queue" && activeTab !== "queue") {
      setActiveTab("queue");
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (newTab: "queue" | "reports" | "portfolio") => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  // Summary Metrics
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    post_menunggu: 0,
    laporan_baru: 0,
    portofolio_menunggu: 0,
  });

  // ------------------------------------------
  // TAB 1: AI Triage Queue State
  // ------------------------------------------
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);

  // Decision Modal for AI Triage Queue
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

  // ------------------------------------------
  // TAB 2: User Reports State
  // ------------------------------------------
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportOffset, setReportOffset] = useState<number>(0);
  const [hasMoreReports, setHasMoreReports] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const REPORT_LIMIT = 20;
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("baru");
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>("all");

  // Takedown Modal State (for reports tab)
  const [takedownModal, setTakedownModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    authorName?: string;
  }>({
    isOpen: false,
    postId: null,
    authorName: undefined,
  });

  // ------------------------------------------
  // TAB 3: Portfolio SKPI Reviews State
  // ------------------------------------------
  const [portfolioTab, setPortfolioTab] = useState<"antrean" | "riwayat">("antrean");
  const [portfolioList, setPortfolioList] = useState<PortfolioQueueItem[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(false);
  const [targetJurusan, setTargetJurusan] = useState<string | null>(null);

  // In-App Document Viewer & Verification Review Modal
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioQueueItem | null>(null);
  const [portfolioFileUrl, setPortfolioFileUrl] = useState<string | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);
  const [isLoadingDupCheck, setIsLoadingDupCheck] = useState<boolean>(false);

  // Review / Revoke Action State
  const [portfolioActionType, setPortfolioActionType] = useState<
    "terverifikasi" | "ditolak" | "revoke" | null
  >(null);
  const [verificationNote, setVerificationNote] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // ==========================================
  // DATA FETCHING HANDLERS
  // ==========================================

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiClient.get<SummaryMetrics>("/moderation/summary");
      setMetrics(res.data);
    } catch {
      // Ignore background summary error
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      setIsLoadingQueue(true);
      const res = await apiClient.get<ModerationQueueItem[]>("/moderation/queue");
      setQueue(res.data);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Gagal memuat antrean tinjauan."));
    } finally {
      setIsLoadingQueue(false);
    }
  }, [toast]);

  const fetchReports = useCallback(
    async (offset = 0, isAppend = false) => {
      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsLoadingReports(true);
        }

        const params: any = {
          limit: REPORT_LIMIT,
          offset,
        };
        if (reportStatusFilter && reportStatusFilter !== "all") {
          params.status = reportStatusFilter;
        }
        if (reportCategoryFilter && reportCategoryFilter !== "all") {
          params.kategori = reportCategoryFilter;
        }

        const res = await apiClient.get<ReportItem[]>("/reports", { params });
        if (isAppend) {
          setReports((prev) => [...prev, ...res.data]);
        } else {
          setReports(res.data);
        }
        setHasMoreReports(res.data.length === REPORT_LIMIT);
        setReportOffset(offset);
      } catch (err: any) {
        toast.error(getApiErrorMessage(err, "Gagal memuat daftar laporan pengguna."));
      } finally {
        setIsLoadingReports(false);
        setIsLoadingMore(false);
      }
    },
    [reportStatusFilter, reportCategoryFilter, toast]
  );

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoadingPortfolio(true);
      const statusQuery = portfolioTab === "antrean" ? "menunggu_review" : "terverifikasi";
      const res = await apiClient.get<{
        items: PortfolioQueueItem[];
        total: number;
        jurusan?: string | null;
      }>("/portfolio/reviews", {
        params: { status: statusQuery, limit: 50 },
      });
      setPortfolioList(res.data.items);
      setTargetJurusan(res.data.jurusan || null);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, "Gagal memuat data tinjauan SKPI."));
    } finally {
      setIsLoadingPortfolio(false);
    }
  }, [portfolioTab, toast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === "queue") {
      fetchQueue();
    } else if (activeTab === "reports") {
      fetchReports(0, false);
    } else if (activeTab === "portfolio") {
      fetchPortfolio();
    }
  }, [activeTab, fetchQueue, fetchReports, fetchPortfolio]);

  const handleRefreshCurrentTab = () => {
    fetchSummary();
    if (activeTab === "queue") fetchQueue();
    if (activeTab === "reports") fetchReports(0, false);
    if (activeTab === "portfolio") fetchPortfolio();
  };

  // ==========================================
  // TAB 1 ACTIONS (AI TRIAGE)
  // ==========================================

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
      setReports((prev) => prev.filter((r) => r.post_id !== decisionModal.post?.post_id));
      setDecisionModal((prev) => ({ ...prev, isOpen: false }));
      fetchSummary();
      if (activeTab === "reports") {
        fetchReports(0, false);
      }
    } catch (err: any) {
      setDecisionModal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: getApiErrorMessage(err, "Gagal menyimpan keputusan moderasi."),
      }));
    }
  };

  // ==========================================
  // TAB 2 ACTIONS (REPORTS & TAKEDOWN)
  // ==========================================

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
      toast.error(getApiErrorMessage(err, "Gagal memperbarui status laporan."));
    }
  };

  const handleOpenTakedownForReport = (report: ReportItem) => {
    setTakedownModal({
      isOpen: true,
      postId: report.post_id,
      authorName: report.post?.author?.nama || "Penulis",
    });
  };

  const handleTakedownSuccess = (takedownPostId: number) => {
    setQueue((prev) => prev.filter((p) => p.post_id !== takedownPostId));
    if (reportStatusFilter === "baru" || reportStatusFilter === "diproses") {
      setReports((prev) => prev.filter((r) => r.post_id !== takedownPostId));
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.post_id === takedownPostId
            ? {
                ...r,
                status: "selesai",
                tindakan_diambil: "postingan_dihapus",
                post: r.post ? { ...r.post, status: "dihapus", gambar_url: null } : null,
              }
            : r
        )
      );
    }
    fetchSummary();
    fetchReports(0, false);
  };

  // ==========================================
  // TAB 3 ACTIONS (PORTFOLIO SKPI VERIFICATION)
  // ==========================================

  const handleSelectPortfolioItem = async (item: PortfolioQueueItem) => {
    setSelectedPortfolio(item);
    setPortfolioActionType(null);
    setVerificationNote("");
    setReviewError(null);
    setPortfolioFileUrl(null);
    setDuplicateCheck(null);

    // 1. Fetch document signed url for in-app viewer
    if (item.has_file) {
      setIsLoadingDoc(true);
      try {
        const fileRes = await apiClient.get<{ signed_url: string }>(`/portfolio/${item.portfolio_id}/file`);
        setPortfolioFileUrl(fileRes.data.signed_url);
      } catch {
        toast.error("Tidak dapat memuat berkas dokumen bukti.");
      } finally {
        setIsLoadingDoc(false);
      }
    }

    // 2. Fetch duplicate check
    if (item.nomor_dokumen) {
      setIsLoadingDupCheck(true);
      try {
        const dupRes = await apiClient.get<DuplicateCheckResult>(
          `/portfolio/${item.portfolio_id}/duplicate-check`
        );
        setDuplicateCheck(dupRes.data);
      } catch {
        // Silently handle if duplicate check fails
      } finally {
        setIsLoadingDupCheck(false);
      }
    }
  };

  const handleSubmitPortfolioReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio || !portfolioActionType) return;

    const trimmedNote = verificationNote.trim();
    const isRejectionOrRevoke =
      portfolioActionType === "ditolak" || portfolioActionType === "revoke";

    if (isRejectionOrRevoke && trimmedNote.length < 5) {
      setReviewError("Catatan verifikasi / alasan koreksi wajib diisi minimal 5 karakter.");
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewError(null);

      // Mutate status via atomic conditional update endpoint
      const targetStatus = portfolioActionType === "revoke" ? "ditolak" : portfolioActionType;
      await apiClient.patch(`/portfolio/${selectedPortfolio.portfolio_id}/review`, {
        status_verifikasi: targetStatus,
        catatan_verifikasi: trimmedNote || undefined,
      });

      const labelMsg =
        targetStatus === "terverifikasi"
          ? "berhasil diverifikasi resmi."
          : portfolioActionType === "revoke"
          ? "berhasil dicabut (direvoke) dan dicatat di log audit."
          : "berhasil ditolak dengan catatan evaluasi.";

      toast.success(`Portofolio #${selectedPortfolio.portfolio_id} ${labelMsg}`);
      setSelectedPortfolio(null);
      fetchPortfolio();
      fetchSummary();
    } catch (err: any) {
      setReviewError(err.response?.data?.detail || "Gagal menyimpan hasil verifikasi portofolio.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Safe CSV export for staff records
  const handleExportCsv = () => {
    if (portfolioList.length === 0) {
      toast.warning("Tidak ada data portofolio untuk diekspor.");
      return;
    }

    const headers = [
      "ID Portofolio",
      "Nama Mahasiswa",
      "NIM",
      "Program Studi",
      "Judul Portofolio",
      "Kategori",
      "No Dokumen",
      "Penerbit",
      "Status Verifikasi",
      "Tanggal Terbit",
      "Tanggal Pengajuan",
    ];

    const rows = portfolioList.map((item) => [
      sanitizeCsvCell(item.portfolio_id),
      sanitizeCsvCell(item.author_nama),
      sanitizeCsvCell(item.author_nim || "-"),
      sanitizeCsvCell(item.author_jurusan || targetJurusan || "-"),
      sanitizeCsvCell(item.judul),
      sanitizeCsvCell(item.kategori),
      sanitizeCsvCell(item.nomor_dokumen || "-"),
      sanitizeCsvCell(item.penerbit || "-"),
      sanitizeCsvCell(item.status_verifikasi),
      sanitizeCsvCell(item.tanggal_terbit || "-"),
      sanitizeCsvCell(item.submitted_at || item.created_at),
    ]);

    // UTF-8 with BOM and semicolon delimiter for Indonesian/Excel compatibility
    const csvContent =
      "\uFEFF" +
      headers.map(sanitizeCsvCell).join(";") +
      "\n" +
      rows.map((row) => row.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `SKPI_Staf_Audit_${targetJurusan || "All"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Berkas rekapitulasi CSV berhasil diunduh.");
  };

  // ==========================================
  // RENDER INTERFACE
  // ==========================================

  return (
    <RoleGate
      allowedRoles={["moderator", "admin"]}
      fallback={
        <div className="max-w-xl mx-auto mt-16 p-8 bg-white rounded-2xl border border-border-subtle shadow-sm text-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">Akses Dibatasi</h2>
          <p className="text-slate-600 text-sm">
            Halaman moderasi hanya dapat diakses oleh Kaprodi (Moderator) dan Administrator kampus.
          </p>
        </div>
      }
    >
      <div className="space-y-6 pb-16">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold font-heading text-slate-900">
                Tata Kelola & Moderasi Konten
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pusat terpadu verifikasi capaian SKPI, audit konten linimasa, dan penanganan laporan sivitas akademika.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefreshCurrentTab}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Perbarui Data</span>
          </button>
        </div>

        {/* 1. INTERACTIVE SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Antrean AI */}
          <button
            type="button"
            aria-label="Ringkasan Antrean AI"
            onClick={() => handleTabChange("queue")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeTab === "queue"
                ? "bg-indigo-50/70 border-primary ring-2 ring-primary/20 shadow-sm"
                : "bg-white border-border-subtle hover:border-primary/40 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">
                Antrean AI & Triage
              </span>
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-heading text-slate-900">
                {metrics.post_menunggu}
              </span>
              <span className="text-[11px] font-medium text-slate-500">Postingan Pending</span>
            </div>
          </button>

          {/* Card 2: Laporan Sivitas */}
          <button
            type="button"
            aria-label="Ringkasan Laporan Masuk"
            onClick={() => handleTabChange("reports")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeTab === "reports"
                ? "bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
                : "bg-white border-border-subtle hover:border-rose-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 group-hover:text-rose-600 transition-colors">
                Laporan Sivitas
              </span>
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <Flag className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-heading text-slate-900">
                {metrics.laporan_baru}
              </span>
              <span className="text-[11px] font-medium text-slate-500">Laporan Baru</span>
            </div>
          </button>

          {/* Card 3: Verifikasi SKPI */}
          <button
            type="button"
            aria-label="Ringkasan Capaian SKPI"
            onClick={() => handleTabChange("portfolio")}
            className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              activeTab === "portfolio"
                ? "bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/20 shadow-sm"
                : "bg-white border-border-subtle hover:border-emerald-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">
                Verifikasi SKPI Staf
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-heading text-slate-900">
                {metrics.portofolio_menunggu}
              </span>
              <span className="text-[11px] font-medium text-slate-500">Berkas Pending</span>
            </div>
          </button>
        </div>

        {/* 2. TAB CONTROLS */}
        <div className="flex items-center gap-2 border-b border-border-subtle pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange("queue")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "queue"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Antrean AI & Triage ({queue.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("reports")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "reports"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Laporan Sivitas ({activeTab === "reports" ? reports.length : metrics.laporan_baru})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("portfolio")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "portfolio"
                ? "bg-primary text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Verifikasi SKPI ({portfolioList.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: AI TRIAGE QUEUE                                   */}
        {/* ======================================================== */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {isLoadingQueue ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-xs">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Memuat antrean moderasi AI...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 font-heading">Antrean Triage Bersih</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Seluruh postingan mahasiswa yang ditandai oleh AI telah ditinjau tuntas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {queue.map((item) => (
                  <div
                    key={item.post_id}
                    className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                          {item.author_name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 font-heading">
                              {item.author_name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              Post #{item.post_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {item.author_jurusan || "Program Studi Mahasiswa"} •{" "}
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* AI Tag */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            Saran AI: {item.label_ai === "berpotensi_melanggar" ? "Berpotensi Melanggar" : "Perlu Review"}{" "}
                            ({Math.round((item.confidence ?? 0.8) * 100)}%)
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <div className="space-y-2">
                      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-body">
                        {item.isi}
                      </p>

                      {item.gambar_url && (
                        <div className="relative w-full max-w-md h-48 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mt-2">
                          <Image
                            src={item.gambar_url}
                            alt="Lampiran postingan"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Explanation & Report Context */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Penjelasan Analisis Model AI:</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {item.penjelasan_ai || "Konten terdeteksi memerlukan verifikasi manusia berdasarkan analisis etika kampus."}
                      </p>
                      {item.jumlah_laporan_aktif > 0 && (
                        <div className="pt-1 flex items-center gap-1 text-rose-700 font-medium text-[11px]">
                          <Flag className="w-3 h-3" />
                          <span>{item.jumlah_laporan_aktif} Laporan Aktif</span>
                        </div>
                      )}
                    </div>

                    {/* Action Decision Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenDecision(item, "setujui")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui Tayang</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(item, "minta_revisi")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Minta Perbaikan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(item, "tolak")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDecision(item, "hapus_konten")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors ml-auto"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Takedown Postingan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: USER REPORTS (LAPORAN SIVITAS)                    */}
        {/* ======================================================== */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-border-subtle shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {["baru", "diproses", "selesai", "diabaikan"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setReportStatusFilter(st);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                      reportStatusFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="report-cat-select" className="text-xs font-medium text-slate-500">
                  Kategori:
                </label>
                <select
                  id="report-cat-select"
                  value={reportCategoryFilter}
                  onChange={(e) => setReportCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {REPORT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reports List */}
            {isLoadingReports ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-xs">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Memuat laporan sivitas...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 font-heading">Tidak Ada Laporan</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Tidak ditemukan laporan dengan filter status & kategori saat ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.report_id}
                    className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    {/* Header Report Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                          <Flag className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-sm font-bold text-slate-900 font-heading">
                            Laporan #{report.report_id}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">
                            • Post #{report.post_id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 capitalize">
                          {report.kategori_laporan.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            report.status === "baru"
                              ? "bg-rose-100 text-rose-800"
                              : report.status === "diproses"
                              ? "bg-amber-100 text-amber-800"
                              : report.status === "selesai"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>

                    {/* Reporter Context */}
                    <div className="p-3 rounded-xl bg-slate-50 text-xs border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">
                          Pelapor: <span>{report.pelapor_nama || "Sivitas Terproteksi"}</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(report.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">Alasan Laporan:</p>
                      <p className="text-slate-600 text-xs leading-relaxed italic">
                        &quot;{report.alasan}&quot;
                      </p>
                    </div>

                    {/* Takedown Post Banner or Full Context Post Preview */}
                    {report.post?.status === "dihapus" || report.tindakan_diambil === "postingan_dihapus" ? (
                      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                            <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            <span>Konten Postingan Telah Di-takedown</span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 self-start sm:self-auto">
                            Status Post: dihapus
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          Konten postingan ini telah di-takedown oleh tim moderasi kampus dan disembunyikan secara permanen dari linimasa publik. Berkas media terkait telah dicabut dari penyimpanan.
                        </p>

                        {report.catatan_tinjauan && (
                          <div className="p-2.5 rounded-lg bg-white/80 border border-rose-100 text-xs text-slate-700">
                            <span className="font-semibold text-slate-800">Catatan Tindakan: </span>
                            <span className="italic">{report.catatan_tinjauan}</span>
                          </div>
                        )}

                        <details className="text-[11px] text-slate-500 cursor-pointer pt-1">
                          <summary className="hover:text-slate-800 font-medium select-none">
                            Lihat kutipan teks terarsip
                          </summary>
                          <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 italic">
                            &quot;{report.post?.isi || report.post_isi_snippet || "Kutipan tidak tersedia."}&quot;
                          </div>
                        </details>
                      </div>
                    ) : report.post ? (
                      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                              {report.post.author?.nama?.slice(0, 2) || "M"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {report.post.author?.nama}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {report.post.author?.nim || "-"} •{" "}
                                {report.post.author?.jurusan || "Program Studi"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              report.post.status === "tayang"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Status Post: {report.post.status}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                          {report.post.isi}
                        </p>

                        {report.post.gambar_url && (
                          <div className="relative w-full max-w-sm h-36 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                            <Image
                              src={report.post.gambar_url}
                              alt="Foto lampiran postingan"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      report.post_isi_snippet && (
                        <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-600 italic">
                          Kutipan: &quot;{report.post_isi_snippet}&quot;
                        </div>
                      )
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      {report.status !== "selesai" && report.post?.status !== "dihapus" && report.tindakan_diambil !== "postingan_dihapus" && (
                        <button
                          type="button"
                          onClick={() => handleOpenTakedownForReport(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Tinjau & Takedown</span>
                        </button>
                      )}

                      {(report.post?.status === "dihapus" || report.tindakan_diambil === "postingan_dihapus") && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Konten Sudah Di-takedown</span>
                        </span>
                      )}

                      {report.status === "baru" && report.post?.status !== "dihapus" && report.tindakan_diambil !== "postingan_dihapus" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(report.report_id, "diproses", "sedang_investigasi")
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Tandai Diproses</span>
                        </button>
                      )}

                      {report.status !== "diabaikan" && report.status !== "selesai" && report.post?.status !== "dihapus" && report.tindakan_diambil !== "postingan_dihapus" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleReportAction(report.report_id, "diabaikan", "laporan_ditolak")
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors ml-auto"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Abaikan Laporan</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {hasMoreReports && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => fetchReports(reportOffset + REPORT_LIMIT, true)}
                      disabled={isLoadingMore}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center gap-2 shadow-xs"
                    >
                      {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Muat Laporan Lainnya</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PORTFOLIO SKPI VERIFICATION (VERIFIKASI SKPI STAF) */}
        {/* ======================================================== */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            {/* Top Sub-Tabs & Export Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-border-subtle shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPortfolioTab("antrean")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    portfolioTab === "antrean"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Antrean Verifikasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPortfolioTab("riwayat")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    portfolioTab === "riwayat"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat Putusan</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {targetJurusan && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-primary font-semibold border border-indigo-100">
                    Prodi: {targetJurusan}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                  title="Unduh Rekapitulasi CSV (Formula-Injection Safe)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Portfolio Items List */}
            {isLoadingPortfolio ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-xs">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Memuat berkas portofolio SKPI...</p>
              </div>
            ) : portfolioList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-xs">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {portfolioTab === "antrean" ? "Antrean Tinjauan Kosong" : "Belum Ada Riwayat"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {portfolioTab === "antrean"
                    ? "Seluruh berkas capaian SKPI mahasiswa program studi ini telah diverifikasi."
                    : "Belum ada berkas portofolio yang diproses pada kategori riwayat ini."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolioList.map((item) => (
                  <div
                    key={item.portfolio_id}
                    className="p-5 rounded-2xl bg-white border border-border-subtle shadow-xs space-y-3.5 hover:border-slate-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Author Info & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                            {item.author_nama.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 font-heading">
                              {item.author_nama}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.author_nim || "NIM Tidak Tercatat"} •{" "}
                              {item.author_jurusan || targetJurusan || "Program Studi"}
                            </p>
                          </div>
                        </div>

                        <PortfolioStatusBadge status={item.status_verifikasi} />
                      </div>

                      {/* Title & Metadata */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-primary border border-indigo-100">
                            {item.kategori.replace(/_/g, " ")}
                          </span>
                          {item.nomor_dokumen && (
                            <span className="text-[11px] font-mono text-slate-500">
                              No: {item.nomor_dokumen}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 font-heading line-clamp-2">
                          {item.judul}
                        </h4>
                        {item.deskripsi && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                            {item.deskripsi}
                          </p>
                        )}
                      </div>

                      {/* Publisher & Date */}
                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                        {item.penerbit && <p>Penerbit: <span className="text-slate-700 font-medium">{item.penerbit}</span></p>}
                        {item.tanggal_terbit && (
                          <p>
                            Tanggal Rilis:{" "}
                            {new Date(item.tanggal_terbit).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Diajukan:{" "}
                        {new Date(item.submitted_at || item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSelectPortfolioItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Periksa Dokumen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: AI TRIAGE DECISION CONFIRMATION                   */}
        {/* ======================================================== */}
        <Dialog
          open={decisionModal.isOpen}
          onClose={() =>
            !decisionModal.isSubmitting &&
            setDecisionModal((prev) => ({ ...prev, isOpen: false }))
          }
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 flex items-center justify-center">
            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <DialogTitle className="text-base font-bold text-slate-900 font-heading">
                  Konfirmasi Keputusan: {decisionModal.action}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setDecisionModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={decisionModal.isSubmitting}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitDecision} className="mt-4 space-y-4">
                {decisionModal.error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {decisionModal.error}
                  </div>
                )}

                <div>
                  <label htmlFor="decision-note" className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Pertimbangan {decisionModal.action !== "setujui" && <span className="text-rose-500">* (Min 5 Karakter)</span>}
                  </label>
                  <textarea
                    id="decision-note"
                    rows={3}
                    value={decisionModal.note}
                    onChange={(e) =>
                      setDecisionModal((prev) => ({ ...prev, note: e.target.value, error: null }))
                    }
                    placeholder="Tuliskan catatan akademik atau alasan tindakan..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecisionModal((prev) => ({ ...prev, isOpen: false }))}
                    disabled={decisionModal.isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={decisionModal.isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                  >
                    {decisionModal.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan Keputusan</span>
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL: IN-APP DOCUMENT VIEWER & VERIFICATION AUDIT       */}
        {/* ======================================================== */}
        {selectedPortfolio && (
          <Dialog
            open={!!selectedPortfolio}
            onClose={() => !isSubmittingReview && setSelectedPortfolio(null)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
              <DialogPanel className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100 flex-shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-primary border border-indigo-100">
                        {selectedPortfolio.kategori.replace(/_/g, " ")}
                      </span>
                      <PortfolioStatusBadge status={selectedPortfolio.status_verifikasi} />
                    </div>
                    <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                      {selectedPortfolio.judul}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pengunggah: <span className="font-semibold text-slate-700">{selectedPortfolio.author_nama}</span> (NIM: {selectedPortfolio.author_nim || "-"}) • {selectedPortfolio.author_jurusan || "Program Studi"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPortfolio(null)}
                    disabled={isSubmittingReview}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Scrollable Body */}
                <div className="overflow-y-auto space-y-4 py-4 pr-1 flex-1">
                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nomor Dokumen</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {selectedPortfolio.nomor_dokumen || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Institusi Penerbit</span>
                      <span className="font-semibold text-slate-800">
                        {selectedPortfolio.penerbit || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tanggal Terbit</span>
                      <span className="font-semibold text-slate-800">
                        {selectedPortfolio.tanggal_terbit || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pengajuan</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedPortfolio.submitted_at || selectedPortfolio.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Privacy-Preserving Duplicate Check Banner */}
                  {isLoadingDupCheck ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Memeriksa kemiripan dan integritas berkas di pangkalan data universitas...</span>
                    </div>
                  ) : duplicateCheck && duplicateCheck.is_duplicate ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>Peringatan Orisinalitas Dokumen: Terdeteksi Kemiripan Berkas</span>
                      </div>

                      {duplicateCheck.matches_same_department.length > 0 && (
                        <div className="space-y-1 pl-6">
                          <p className="font-semibold">Kecocokan pada program studi Anda:</p>
                          <ul className="list-disc space-y-1">
                            {duplicateCheck.matches_same_department.map((m) => (
                              <li key={m.portfolio_id} className="text-[11px]">
                                <span className="font-semibold">{m.judul}</span> oleh {m.author_nama} (NIM: {m.author_nim}) — Status: {m.status_verifikasi}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {duplicateCheck.has_cross_department_matches && (
                        <p className="pl-6 text-[11px] leading-relaxed italic text-amber-900">
                          {duplicateCheck.cross_department_message}
                        </p>
                      )}

                      {duplicateCheck.is_coauthor_doi && (
                        <p className="pl-6 text-[11px] leading-relaxed text-indigo-900 bg-indigo-50/50 p-2 rounded-lg border border-indigo-200">
                          ℹ️ {duplicateCheck.notice}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* IN-APP DOCUMENT VIEWER (No popup blocker) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-primary" />
                        <span>Pratinjau Berkas Bukti Resmi</span>
                      </span>

                      {portfolioFileUrl && (
                        <a
                          href={portfolioFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>Buka di Tab Baru</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="w-full h-80 sm:h-96 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center relative">
                      {isLoadingDoc ? (
                        <div className="text-center text-xs text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                          <span>Mengambil berkas bukti terenkripsi...</span>
                        </div>
                      ) : portfolioFileUrl ? (
                        portfolioFileUrl.includes(".pdf") ? (
                          <iframe
                            src={portfolioFileUrl}
                            className="w-full h-full"
                            title="Dokumen Bukti PDF"
                          />
                        ) : (
                          // Fallback to image tag for image proofs
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={portfolioFileUrl}
                            alt="Dokumen Bukti"
                            className="max-h-full max-w-full object-contain mx-auto"
                          />
                        )
                      ) : (
                        <div className="text-center text-xs text-slate-400 p-4">
                          <FileText className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                          <span>Mahasiswa belum mengunggah dokumen bukti terlampir.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit Decision Section */}
                  <form onSubmit={handleSubmitPortfolioReview} className="space-y-3 pt-2 border-t border-slate-100">
                    {reviewError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                        {reviewError}
                      </div>
                    )}

                    {portfolioActionType && (
                      <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <label htmlFor="verification-note" className="block text-xs font-bold text-slate-800">
                          Catatan Sidang / Alasan Keputusan ({portfolioActionType}){" "}
                          {(portfolioActionType === "ditolak" || portfolioActionType === "revoke") && (
                            <span className="text-rose-500">* (Min 5 Karakter)</span>
                          )}
                        </label>
                        <textarea
                          id="verification-note"
                          rows={2}
                          value={verificationNote}
                          onChange={(e) => {
                            setVerificationNote(e.target.value);
                            setReviewError(null);
                          }}
                          placeholder={
                            portfolioActionType === "terverifikasi"
                              ? "Catatan opsional (e.g. Dokumen terverifikasi sesuai standar lomba nasional)."
                              : "Wajib: Jelaskan alasan penolakan atau pencabutan status SKPI..."
                          }
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPortfolioActionType(null)}
                            disabled={isSubmittingReview}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
                          >
                            Batal Aksi
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-xs ${
                              portfolioActionType === "terverifikasi"
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-rose-600 hover:bg-rose-700"
                            }`}
                          >
                            {isSubmittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Konfirmasi Putusan</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!portfolioActionType && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        {/* Pending Review Actions */}
                        {selectedPortfolio.status_verifikasi === "menunggu_review" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPortfolioActionType("terverifikasi");
                                setVerificationNote("Disetujui oleh verifikator prodi.");
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verifikasi & Terbitkan SKPI</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPortfolioActionType("ditolak");
                                setVerificationNote("");
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Tolak dengan Catatan</span>
                            </button>
                          </div>
                        )}

                        {/* Verified Item: Support Revoke / Re-evaluate */}
                        {selectedPortfolio.status_verifikasi === "terverifikasi" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPortfolioActionType("revoke");
                                setVerificationNote("");
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors shadow-xs"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Koreksi Putusan / Revoke</span>
                            </button>
                          </div>
                        )}

                        {/* Rejected Item: Support Re-acceptance */}
                        {selectedPortfolio.status_verifikasi === "ditolak" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPortfolioActionType("terverifikasi");
                                setVerificationNote("Disetujui kembali setelah verifikasi berkas susulan.");
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Setujui Ulang</span>
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedPortfolio(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 ml-auto"
                        >
                          Tutup
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        )}

        {/* ======================================================== */}
        {/* MODAL: DIRECT TAKEDOWN POST                              */}
        {/* ======================================================== */}
        <TakedownPostModal
          isOpen={takedownModal.isOpen}
          postId={takedownModal.postId}
          postAuthorName={takedownModal.authorName}
          onClose={() => setTakedownModal({ isOpen: false, postId: null })}
          onSuccess={handleTakedownSuccess}
        />
      </div>
    </RoleGate>
  );
}

// Wrapper with Suspense boundary for Next.js useSearchParams
export default function ModerationAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Memuat modul tata kelola staf...</p>
        </div>
      }
    >
      <ModerationAuditPageContent />
    </Suspense>
  );
}
