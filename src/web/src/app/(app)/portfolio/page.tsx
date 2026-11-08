"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { PortfolioStatusBadge, PortfolioStatus } from "@/components/common/PortfolioStatusBadge";
import { SkillSelector, SelectedSkill } from "@/components/features/SkillSelector";
import {
  FolderKanban,
  Plus,
  ExternalLink,
  Eye,
  Trash2,
  Edit3,
  Send,
  RotateCcw,
  Award,
  BookOpen,
  FileCheck,
  AlertCircle,
  Loader2,
  X,
  Upload,
} from "lucide-react";

interface SkillBrief {
  skill_id: number;
  nama: string;
  kategori: string;
}

interface PortfolioItem {
  portfolio_id: number;
  user_id: number;
  judul: string;
  deskripsi?: string | null;
  tautan_url?: string | null;
  gambar_url?: string | null;
  kategori: "proyek" | "skpi" | "sertifikat" | "artikel_ilmiah";
  nomor_dokumen?: string | null;
  penerbit?: string | null;
  tanggal_terbit?: string | null;
  file_url?: string | null;
  has_file: boolean;
  status_verifikasi: PortfolioStatus;
  diverifikasi_oleh?: number | null;
  catatan_verifikasi?: string | null;
  verified_at?: string | null;
  submitted_at?: string | null;
  created_at: string;
  skills: SkillBrief[];
}

interface SkpiSummary {
  user_id: number;
  total_poin: number;
  total_terverifikasi: number;
  menunggu_review: number | null;
  jumlah_per_kategori: Record<string, number>;
  poin_per_kategori: Record<string, number>;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<string>("semua");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<SkpiSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form State
  const [judul, setJudul] = useState<string>("");
  const [deskripsi, setDeskripsi] = useState<string>("");
  const [kategori, setKategori] = useState<"proyek" | "skpi" | "sertifikat" | "artikel_ilmiah">("proyek");
  const [tautanUrl, setTautanUrl] = useState<string>("");
  const [nomorDokumen, setNomorDokumen] = useState<string>("");
  const [penerbit, setPenerbit] = useState<string>("");
  const [tanggalTerbit, setTanggalTerbit] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [resItems, resSummary] = await Promise.all([
        apiClient.get<PortfolioItem[]>(`/portfolio?user_id=${user.user_id}`),
        apiClient.get<SkpiSummary>(`/users/${user.user_id}/skpi-summary`),
      ]);
      setItems(resItems.data);
      setSummary(resSummary.data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data portofolio.");
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      toast.error(err.message || "Gagal membuka dokumen bukti.");
    }
  };

  // Submit to Review Queue
  const handleSubmitReview = async (item: PortfolioItem) => {
    setActionLoadingId(item.portfolio_id);
    try {
      await apiClient.post(`/portfolio/${item.portfolio_id}/submit`);
      toast.success("Portofolio berhasil diajukan untuk verifikasi Kaprodi!");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengajukan verifikasi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Withdraw from Review Queue
  const handleWithdrawReview = async (item: PortfolioItem) => {
    setActionLoadingId(item.portfolio_id);
    try {
      await apiClient.post(`/portfolio/${item.portfolio_id}/withdraw`);
      toast.info("Pengajuan ditarik kembali ke draf.");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menarik pengajuan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Portfolio
  const handleDelete = async (item: PortfolioItem) => {
    if (!confirm(`Hapus portofolio "${item.judul}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setActionLoadingId(item.portfolio_id);
    try {
      await apiClient.delete(`/portfolio/${item.portfolio_id}`);
      toast.success("Portofolio berhasil dihapus.");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus portofolio.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Create/Edit Modal
  const handleOpenModal = (item?: PortfolioItem) => {
    setFormError(null);
    setUploadProgress(null);
    if (item) {
      setEditingItem(item);
      setJudul(item.judul);
      setDeskripsi(item.deskripsi || "");
      setKategori(item.kategori);
      setTautanUrl(item.tautan_url || "");
      setNomorDokumen(item.nomor_dokumen || "");
      setPenerbit(item.penerbit || "");
      setTanggalTerbit(item.tanggal_terbit || "");
      setFileUrl(item.file_url || "");
      setSelectedSkills(
        item.skills.map((s) => ({
          skill_id: s.skill_id,
          nama: s.nama,
          tipe: s.kategori as any,
          level: "menengah",
        }))
      );
    } else {
      setEditingItem(null);
      setJudul("");
      setDeskripsi("");
      setKategori("proyek");
      setTautanUrl("");
      setNomorDokumen("");
      setPenerbit("");
      setTanggalTerbit("");
      setFileUrl("");
      setSelectedSkills([]);
    }
    setIsModalOpen(true);
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(20);
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(60);
      const res = await apiClient.post<{ path: string }>("/uploads/portfolio-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadProgress(100);
      setFileUrl(res.data.path);
      toast.success("Dokumen bukti berhasil diunggah!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah dokumen.");
    } finally {
      setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  // Save Portfolio
  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!judul.trim() || judul.trim().length < 3) {
      setFormError("Judul portofolio minimal 3 karakter.");
      return;
    }

    if (kategori !== "proyek") {
      if (!nomorDokumen.trim()) {
        setFormError(kategori === "artikel_ilmiah" ? "Nomor DOI wajib diisi." : "Nomor dokumen/sertifikat wajib diisi.");
        return;
      }
      if (!penerbit.trim()) {
        setFormError(kategori === "artikel_ilmiah" ? "Nama jurnal/konferensi wajib diisi." : "Penyelenggara/Penerbit wajib diisi.");
        return;
      }
      if (!tanggalTerbit) {
        setFormError("Tanggal terbit wajib diisi.");
        return;
      }
      if (!fileUrl && !editingItem) {
        setFormError("Berkas dokumen bukti wajib diunggah.");
        return;
      }
    }

    setIsSaving(true);
    const payload: any = {
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || null,
      kategori,
      tautan_url: tautanUrl.trim() || null,
      nomor_dokumen: nomorDokumen.trim() || null,
      penerbit: penerbit.trim() || null,
      tanggal_terbit: tanggalTerbit || null,
      file_url: fileUrl || null,
      skill_ids: selectedSkills.map((s) => s.skill_id).filter(Boolean),
    };

    try {
      if (editingItem) {
        await apiClient.patch(`/portfolio/${editingItem.portfolio_id}`, payload);
        toast.success("Portofolio berhasil diperbarui.");
      } else {
        await apiClient.post("/portfolio", payload);
        toast.success(
          kategori === "proyek"
            ? "Proyek karya berhasil diterbitkan ke portofolio publik!"
            : "Draf capaian berhasil dibuat. Ajukan verifikasi setelah berkas lengkap."
        );
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan portofolio.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter items by category tab
  const filteredItems = items.filter((it) => {
    if (activeTab === "semua") return true;
    return it.kategori === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            Portofolio & Rekam SKPI
          </h2>
          <p className="text-xs text-slate-500 font-body mt-1">
            Kelola rekam karya, sertifikasi kompetensi, dan capaian akademik untuk verifikasi SKPI Program Studi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Portofolio</span>
        </button>
      </div>

      {/* SKPI Summary Card */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-accent-emerald-accessible flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Poin SKPI Resmi</span>
              <p className="text-xl font-black text-slate-900 font-heading">{summary.total_poin} Poin</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Capaian Terverifikasi</span>
              <p className="text-xl font-black text-slate-900 font-heading">{summary.total_terverifikasi} Berkas</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-accent-amber-accessible flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500">Dalam Antrean Review</span>
              <p className="text-xl font-black text-slate-900 font-heading">
                {summary.menunggu_review ?? 0} Pengajuan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 overflow-x-auto">
        {[
          { id: "semua", label: "Semua Kategori" },
          { id: "proyek", label: "Proyek Karya" },
          { id: "skpi", label: "Capaian SKPI" },
          { id: "sertifikat", label: "Sertifikat" },
          { id: "artikel_ilmiah", label: "Artikel Ilmiah" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Item List */}
      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-slate-500">Memuat koleksi portofolio...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-border-subtle">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Belum Ada Portofolio</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === "semua"
              ? "Unggah karya proyek atau ajukan sertifikat capaian untuk diverifikasi Kaprodi."
              : `Belum ada berkas pada kategori ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.portfolio_id}
              className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {item.kategori.replace("_", " ")}
                  </span>
                  <PortfolioStatusBadge status={item.status_verifikasi} />
                </div>

                <h3 className="text-sm font-bold text-slate-900 font-heading leading-snug">
                  {item.judul}
                </h3>

                {item.deskripsi && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed font-body">
                    {item.deskripsi}
                  </p>
                )}

                {/* Metadata Details */}
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  {item.nomor_dokumen && (
                    <p>
                      <span className="font-semibold text-slate-700">
                        {item.kategori === "artikel_ilmiah" ? "DOI:" : "No. Dokumen:"}
                      </span>{" "}
                      {item.nomor_dokumen}
                    </p>
                  )}
                  {item.penerbit && (
                    <p>
                      <span className="font-semibold text-slate-700">Penerbit:</span> {item.penerbit}
                    </p>
                  )}
                  {item.tanggal_terbit && (
                    <p>
                      <span className="font-semibold text-slate-700">Tanggal Terbit:</span> {item.tanggal_terbit}
                    </p>
                  )}
                  {item.tautan_url && (
                    <p className="flex items-center gap-1 text-primary truncate">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <a href={item.tautan_url} target="_blank" rel="noreferrer" className="hover:underline">
                        {item.tautan_url}
                      </a>
                    </p>
                  )}
                </div>

                {/* Skills tags */}
                {item.skills && item.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.skills.map((s) => (
                      <span
                        key={s.skill_id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {s.nama}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rejected Revision Banner */}
                {item.status_verifikasi === "ditolak" && item.catatan_verifikasi && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-accent-danger-accessible flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Catatan Perbaikan Kaprodi:</p>
                      <p className="mt-0.5">{item.catatan_verifikasi}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {item.has_file && (
                    <button
                      type="button"
                      onClick={() => handleViewDocument(item.portfolio_id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      title="Lihat dokumen bukti privat"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat Dokumen</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Draft Actions */}
                  {item.status_verifikasi === "draft" && (
                    <>
                      {item.kategori !== "proyek" && (
                        <button
                          type="button"
                          disabled={actionLoadingId === item.portfolio_id}
                          onClick={() => handleSubmitReview(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Ajukan SKPI</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Edit draf"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === item.portfolio_id}
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Hapus draf"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Under Review Actions */}
                  {item.status_verifikasi === "menunggu_review" && (
                    <button
                      type="button"
                      disabled={actionLoadingId === item.portfolio_id}
                      onClick={() => handleWithdrawReview(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-accent-amber-accessible text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Tarik Pengajuan</span>
                    </button>
                  )}

                  {/* Rejected Actions */}
                  {item.status_verifikasi === "ditolak" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Revisi</span>
                      </button>
                      <button
                        type="button"
                        disabled={actionLoadingId === item.portfolio_id}
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-border-subtle p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {editingItem ? "Ubah Portofolio" : "Tambah Portofolio Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePortfolio} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-accent-danger-accessible flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Kategori Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Capaian
                </label>
                <select
                  value={kategori}
                  disabled={Boolean(editingItem)}
                  onChange={(e) => setKategori(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="proyek">Proyek Karya Mandiri (0 Poin SKPI - Langsung Publik)</option>
                  <option value="skpi">Capaian SKPI Resmi (Verifikasi Kaprodi)</option>
                  <option value="sertifikat">Sertifikat Pelatihan / Kejuaraan (Verifikasi Kaprodi)</option>
                  <option value="artikel_ilmiah">Artikel Ilmiah / Jurnal DOI (Verifikasi Kaprodi)</option>
                </select>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Portofolio / Capaian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Aplikasi Sistem Rekomendasi Kampus"
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Ringkasan
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Ceritakan peran, lingkup karya, atau metode yang digunakan..."
                  className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Proyek specific: Tautan URL */}
              {kategori === "proyek" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tautan Karya (GitHub / Website Demo)
                  </label>
                  <input
                    type="url"
                    value={tautanUrl}
                    onChange={(e) => setTautanUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              {/* SKPI / Sertifikat / Artikel Ilmiah Fields */}
              {kategori !== "proyek" && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {kategori === "artikel_ilmiah" ? "Nomor DOI" : "Nomor Dokumen / Sertifikat"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nomorDokumen}
                        onChange={(e) => setNomorDokumen(e.target.value)}
                        placeholder={kategori === "artikel_ilmiah" ? "10.1145/..." : "CERT-2024-..."}
                        className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {kategori === "artikel_ilmiah" ? "Nama Jurnal/Konferensi" : "Penyelenggara / Penerbit"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={penerbit}
                        onChange={(e) => setPenerbit(e.target.value)}
                        placeholder="Contoh: Kementerian Kominfo / IEEE"
                        className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Terbit / Diselenggarakan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={tanggalTerbit}
                      onChange={(e) => setTanggalTerbit(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* File Upload Dropzone */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Berkas Dokumen Bukti (PDF maks 10MB atau Gambar maks 5MB){" "}
                      {!editingItem && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border-subtle bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Pilih Berkas</span>
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-500 truncate max-w-xs">
                        {fileUrl ? fileUrl.split("/").pop() : "Belum ada berkas dipilih"}
                      </span>
                    </div>

                    {uploadProgress !== null && (
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Keahlian Terkait */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag Keahlian Terkait (Maksimal 10)
                </label>
                <SkillSelector
                  value={selectedSkills}
                  onChange={setSelectedSkills}
                  maxSkills={10}
                  allowCreate={false}
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "Simpan Perubahan" : "Simpan Portofolio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
