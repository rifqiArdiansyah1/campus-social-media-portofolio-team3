"use client";

import React, { useState } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { PortfolioStatusBadge } from "@/components/common/PortfolioStatusBadge";
import {
  ModerationReviewModal,
  ModerationActionOption,
} from "@/components/common/ModerationReviewModal";
import { CheckSquare, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface ReviewQueueItem {
  id: number;
  mahasiswa_nama: string;
  mahasiswa_nim: string;
  jurusan: string;
  judul: string;
  kategori: string;
  submitted_at: string;
}

export default function PortfolioReviewPage() {
  const toast = useToast();
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [queue, setQueue] = useState<ReviewQueueItem[]>([
    {
      id: 501,
      mahasiswa_nama: "Dewi Lestari",
      mahasiswa_nim: "2023001005",
      jurusan: "Teknik Informatika",
      judul: "Juara 2 Gemastik Kategori Animasi Komputer",
      kategori: "Kompetisi & Lomba",
      submitted_at: "2026-11-04 14:20",
    },
    {
      id: 502,
      mahasiswa_nama: "Rizky Ramadhan",
      mahasiswa_nim: "2023001018",
      jurusan: "Teknik Informatika",
      judul: "Sertifikasi Kompetensi BNSP: Software Architect",
      kategori: "Sertifikasi Profesi",
      submitted_at: "2026-11-05 09:15",
    },
  ]);

  const reviewActions: ModerationActionOption[] = [
    { action: "setujui", label: "Setujui SKPI", variant: "success", requiresNote: false },
    { action: "minta_revisi", label: "Minta Revisi", variant: "warning", requiresNote: true },
    { action: "tolak", label: "Tolak Pengajuan", variant: "danger", requiresNote: true },
  ];

  const handleOpenReview = (item: ReviewQueueItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleReviewSubmit = async ({ action, note }: { action: string; note: string }) => {
    if (!selectedItem) return;
    toast.success(
      `Keputusan [${action.toUpperCase()}] untuk pengajuan "${selectedItem.judul}" berhasil disimpan.`
    );
    setQueue((prev) => prev.filter((i) => i.id !== selectedItem.id));
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
            Halaman ini hanya dapat diakses oleh Kaprodi / Moderator jurusan dan Administrator Kampus.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            Antrean Verifikasi Portofolio SKPI
          </h2>
          <p className="text-xs text-slate-500 font-body mt-1">
            Validasi dokumen dan capaian portofolio mahasiswa untuk penerbitan poin Surat Keterangan Pendamping Ijazah.
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-border-subtle">
            <CheckCircle2 className="w-10 h-10 text-accent-emerald-accessible mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Antrean Bersih</h3>
            <p className="text-xs text-slate-500 mt-1">Semua pengajuan SKPI saat ini telah ditinjau.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <PortfolioStatusBadge status="menunggu_review" />
                    <span className="text-xs text-slate-400 font-medium">• {item.kategori}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">{item.judul}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{item.mahasiswa_nama}</span>
                    <span>({item.mahasiswa_nim})</span>
                    <span>•</span>
                    <span>{item.jurusan}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenReview(item)}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
                >
                  Tinjau & Validasi
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <ModerationReviewModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleReviewSubmit}
            title="Tinjauan Verifikasi SKPI"
            targetDescription={`${selectedItem.mahasiswa_nama} — ${selectedItem.judul}`}
            availableActions={reviewActions}
          />
        )}
      </div>
    </RoleGate>
  );
}
