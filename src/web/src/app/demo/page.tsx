"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PortfolioStatusBadge } from "@/components/common/PortfolioStatusBadge";
import { PostCard, PostViewModel } from "@/components/features/PostCard";
import { FriendRequestWidget, FriendRequestItem } from "@/components/features/FriendRequestWidget";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ModerationReviewModal,
  ModerationActionOption,
} from "@/components/common/ModerationReviewModal";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonCard } from "@/components/common/Skeleton";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, Layers, ShieldCheck, Trash2 } from "lucide-react";

export default function DemoGalleryPage() {
  const toast = useToast();

  // Dialog & Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);

  // Sample Data for PostCard
  const samplePost: PostViewModel = {
    id: 99,
    author_id: 1,
    author_name: "Hakim Pradana",
    author_jurusan: "Sistem Informasi",
    author_avatar: null,
    konten:
      "Demo Showcase Komponen Desain Stitch CampusFolio!\nKomponen ini mendukung varian teks kontras tinggi WCAG AA, responsive layout, dan aksi moderasi RBAC.",
    created_at: new Date().toISOString(),
    likes_count: 42,
    comments_count: 7,
    is_liked: true,
    can_takedown: true,
    can_report: true,
    can_delete: true,
  };

  // Sample Friend Requests
  const sampleRequests: FriendRequestItem[] = [
    {
      id: 1,
      sender_id: 88,
      sender_name: "Siti Rahmawati",
      sender_jurusan: "Teknik Informatika",
      sender_avatar: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      sender_id: 89,
      sender_name: "Dimas Suryo",
      sender_jurusan: "Manajemen Bisnis",
      sender_avatar: null,
      created_at: new Date().toISOString(),
    },
  ];

  const moderationActions: ModerationActionOption[] = [
    { action: "setujui", label: "Setujui SKPI", variant: "success", requiresNote: false },
    { action: "minta_revisi", label: "Minta Revisi", variant: "warning", requiresNote: true },
    { action: "tolak", label: "Tolak Pengajuan", variant: "danger", requiresNote: true },
    { action: "hapus_konten", label: "Takedown Post", variant: "danger", requiresNote: true },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Landing
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-primary" />
              Galeri Komponen M03 (Stitch Design System)
            </h1>
            <p className="text-xs text-slate-500 font-body mt-1">
              Showcase interaktif 9 komponen dasar web shell dengan dukungan kontras WCAG AA dan responsivitas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-accent-emerald-accessible text-xs font-bold border border-emerald-300">
              WCAG AA Compliant
            </span>
          </div>
        </div>

        {/* 1. PortfolioStatusBadge */}
        <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-heading uppercase tracking-wider">
            1. PortfolioStatusBadge (4 Varian Status Lengkap)
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <PortfolioStatusBadge status="draft" />
            <PortfolioStatusBadge status="menunggu_review" />
            <PortfolioStatusBadge status="terverifikasi" />
            <PortfolioStatusBadge status="ditolak" />
          </div>
        </section>

        {/* 2. Toast Notifications Trigger */}
        <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-heading uppercase tracking-wider">
            2. Toast System (Accessible role=&quot;status&quot; &amp; aria-live=&quot;polite&quot;)
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => toast.success("Operasi berhasil disimpan dengan aman!")}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-accent-emerald-accessible border border-emerald-300 hover:bg-emerald-100 transition"
            >
              Picu Toast Sukses
            </button>
            <button
              onClick={() => toast.error("Gagal memproses permintaan. Periksa koneksi.")}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 text-accent-danger-accessible border border-red-300 hover:bg-red-100 transition"
            >
              Picu Toast Error
            </button>
            <button
              onClick={() => toast.warning("Peringatan: sesi Anda akan berakhir dalam 5 menit.")}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-accent-amber-accessible border border-amber-300 hover:bg-amber-100 transition"
            >
              Picu Toast Peringatan
            </button>
            <button
              onClick={() => toast.info("Informasi: pemeliharaan server dijadwalkan pukul 02:00.")}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-primary border border-indigo-200 hover:bg-indigo-100 transition"
            >
              Picu Toast Info
            </button>
          </div>
        </section>

        {/* 3. ConfirmDialog & ModerationReviewModal */}
        <section className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-heading uppercase tracking-wider">
            3. Modal & Dialog Aksesibel (Headless UI Focus Trap)
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setConfirmOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Buka ConfirmDialog (Variant Danger)
            </button>
            <button
              onClick={() => setModerationOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Buka ModerationReviewModal
            </button>
          </div>

          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => {
              toast.error("Item berhasil dihapus via ConfirmDialog!");
              setConfirmOpen(false);
            }}
            title="Hapus Portofolio?"
            description="Tindakan ini tidak dapat dibatalkan. Berkas lampiran dan histori SKPI akan terhapus secara permanen."
            confirmText="Ya, Hapus"
            variant="danger"
          />

          <ModerationReviewModal
            isOpen={moderationOpen}
            onClose={() => setModerationOpen(false)}
            onSubmit={({ action, note }) => {
              toast.success(`Keputusan [${action}] tercatat dengan catatan: "${note || '-'}"`);
              setModerationOpen(false);
            }}
            title="Audit Keputusan Moderasi"
            targetDescription="Postingan Mahasiswa: Capstone AI Smart Campus"
            availableActions={moderationActions}
          />
        </section>

        {/* 4. PostCard & FriendRequestWidget */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-heading uppercase tracking-wider">
            4. PostCard & FriendRequestWidget
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <PostCard
                post={samplePost}
                onLike={() => toast.info("Aksi Suka terpicu.")}
                onComment={() => toast.info("Aksi Komentar terpicu.")}
                onTakedown={() => toast.warning("Aksi Takedown terpicu.")}
                onReport={() => toast.info("Aksi Lapor terpicu.")}
                onDelete={() => toast.error("Aksi Hapus terpicu.")}
              />
            </div>
            <div>
              <FriendRequestWidget
                requests={sampleRequests}
                onAccept={(id) => toast.success(`Menerima pertemanan ID #${id}`)}
                onReject={(id) => toast.info(`Menolak pertemanan ID #${id}`)}
              />
            </div>
          </div>
        </section>

        {/* 5. Skeleton & EmptyState */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-heading uppercase tracking-wider">
            5. Skeleton & EmptyState
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Shimmer Loading State
              </h3>
              <SkeletonCard />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Empty State Placeholder
              </h3>
              <EmptyState
                title="Linimasa Masih Sunyi"
                description="Belum ada aktivitas di program studi Anda. Mulai unggah portofolio pertama atau cari kolaborator!"
                actionText="Buat Unggahan Pertama"
                onAction={() => toast.info("Tombol aksi EmptyState ditekan.")}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
