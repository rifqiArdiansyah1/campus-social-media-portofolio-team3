"use client";

import React, { useState } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import {
  ModerationReviewModal,
  ModerationActionOption,
} from "@/components/common/ModerationReviewModal";
import { ShieldAlert, CheckCircle2, AlertOctagon } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface ModerationReportItem {
  id: number;
  post_id: number;
  post_author: string;
  post_content: string;
  pelapor_nama: string;
  alasan: string;
  created_at: string;
}

export default function ModerationAuditPage() {
  const toast = useToast();
  const [selectedReport, setSelectedReport] = useState<ModerationReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [reports, setReports] = useState<ModerationReportItem[]>([
    {
      id: 701,
      post_id: 18,
      post_author: "User Anonymous",
      post_content: "Jual kunci jawaban ujian akhir semester mata kuliah Algoritma, hubungi WA 0812...",
      pelapor_nama: "Mahasiswa Peduli Kampus",
      alasan: "Pelanggaran integritas akademik dan spam komersial ilegal.",
      created_at: "2026-11-05 16:30",
    },
  ]);

  const moderationActions: ModerationActionOption[] = [
    { action: "hapus_konten", label: "Takedown / Hapus Konten", variant: "danger", requiresNote: true },
    { action: "abaikan", label: "Abaikan Laporan", variant: "default", requiresNote: false },
  ];

  const handleOpenReview = (item: ModerationReportItem) => {
    setSelectedReport(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async ({ action, note }: { action: string; note: string }) => {
    if (!selectedReport) return;
    toast.success(
      `Tindakan [${action.toUpperCase()}] untuk laporan #${selectedReport.id} berhasil dieksekusi.`
    );
    setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
    setIsModalOpen(false);
  };

  return (
    <RoleGate
      allowedRoles={["moderator", "admin"]}
      fallback={
        <div className="p-8 text-center rounded-2xl bg-white border border-border-subtle">
          <ShieldAlert className="w-10 h-10 text-accent-danger-accessible mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900 font-heading">Akses Dibatasi</h2>
          <p className="mt-1 text-xs text-slate-500 font-body">
            Halaman moderasi hanya dapat diakses oleh Kaprodi / Moderator jurusan dan Administrator Kampus.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            Antrean Moderasi Konten & Laporan
          </h2>
          <p className="text-xs text-slate-500 font-body mt-1">
            Audit laporan pengguna terkait ujaran kebencian, pelanggaran akademik, atau spam di linimasa kampus.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-border-subtle">
            <CheckCircle2 className="w-10 h-10 text-accent-emerald-accessible mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Antrean Moderasi Bersih</h3>
            <p className="text-xs text-slate-500 mt-1">Tidak ada laporan konten yang menunggu tindakan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-accent-danger-accessible flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" />
                      Laporan Pelanggaran #{report.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">• {report.created_at}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-border-subtle">
                    <p className="text-xs font-semibold text-slate-700">Penulis: {report.post_author}</p>
                    <p className="text-xs text-slate-600 mt-1 italic">&ldquo;{report.post_content}&rdquo;</p>
                  </div>

                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-700">Alasan Lapor:</strong> {report.alasan} (oleh {report.pelapor_nama})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenReview(report)}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
                >
                  Tinjau Laporan
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedReport && (
          <ModerationReviewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            title="Tinjauan Laporan Konten"
            targetDescription={`Laporan #${selectedReport.id} pada Post #${selectedReport.post_id}`}
            availableActions={moderationActions}
          />
        )}
      </div>
    </RoleGate>
  );
}
