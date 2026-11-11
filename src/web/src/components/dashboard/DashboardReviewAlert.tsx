"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  FileCheck2,
  Flag,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Users,
  Award,
  Trash2,
} from "lucide-react";
import {
  AdminDashboardSummary,
  ModeratorDashboardSummary,
} from "@/services/dashboardService";

interface DashboardReviewAlertProps {
  summary: ModeratorDashboardSummary | AdminDashboardSummary;
}

export function DashboardReviewAlert({ summary }: DashboardReviewAlertProps) {
  if (summary.role === "moderator") {
    const isUnconfigured = !summary.is_jurusan_configured || !summary.jurusan;
    const totalPending =
      summary.pending_posts +
      summary.pending_reports +
      summary.pending_portfolio_reviews;

    if (isUnconfigured) {
      return (
        <aside
          aria-label="Peringatan Konfigurasi Moderator"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-heading uppercase tracking-wider">
              Program Studi Belum Dikonfigurasi
            </h3>
            <p className="text-xs text-amber-700 font-body">
              Akun Kaprodi Anda belum terhubung dengan program studi manapun. Silakan hubungi Administrator Kemahasiswaan untuk menetapkan hak moderasi prodi.
            </p>
          </div>
        </aside>
      );
    }

    return (
      <aside
        aria-label="Pusat Antrean Moderasi Program Studi"
        className="p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                Antrean Program Studi: {summary.jurusan}
              </h2>
              <p className="text-xs text-slate-500 font-body">
                Tinjauan cepat postingan, laporan pelanggaran, dan verifikasi SKPI mahasiswa.
              </p>
            </div>
          </div>
          {totalPending > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 self-start sm:self-auto">
              {totalPending} Perlu Tindakan
            </span>
          )}
        </div>

        {totalPending === 0 ? (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Semua antrean prodi telah terselesaikan. Tidak ada postingan atau portofolio tertunda.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Pending Posts */}
            <Link
              href="/moderation?tab=posts"
              className="p-3 rounded-xl border border-border-subtle hover:border-primary/50 hover:bg-slate-50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                    Post Pending
                  </p>
                  <p className="text-[11px] text-slate-500">Menunggu review</p>
                </div>
              </div>
              <span
                data-testid="badge-pending-posts"
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  summary.pending_posts > 0
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {summary.pending_posts}
              </span>
            </Link>

            {/* 2. Pending Reports */}
            <Link
              href="/moderation?tab=reports"
              className="p-3 rounded-xl border border-border-subtle hover:border-primary/50 hover:bg-slate-50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                    Laporan Masuk
                  </p>
                  <p className="text-[11px] text-slate-500">Perlu diproses</p>
                </div>
              </div>
              <span
                data-testid="badge-pending-reports"
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  summary.pending_reports > 0
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {summary.pending_reports}
              </span>
            </Link>

            {/* 3. Pending Portfolio Reviews */}
            <Link
              href="/portfolio/review"
              className="p-3 rounded-xl border border-border-subtle hover:border-primary/50 hover:bg-slate-50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">
                    Tinjauan SKPI
                  </p>
                  <p className="text-[11px] text-slate-500">Validasi sertifikat/karya</p>
                </div>
              </div>
              <span
                data-testid="badge-pending-portfolios"
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  summary.pending_portfolio_reviews > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {summary.pending_portfolio_reviews}
              </span>
            </Link>
          </div>
        )}
      </aside>
    );
  }

  // Admin Dashboard View
  const adminSummary = summary as AdminDashboardSummary;
  return (
    <aside
      aria-label="Pusat Kendali Kemahasiswaan & Moderasi Kampus"
      className="p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-heading">
              Pusat Kendali Kemahasiswaan (Seluruh Kampus)
            </h2>
            <p className="text-xs text-slate-500 font-body">
              Pemantauan ekosistem kolaborasi kampus, integritas konten, dan verifikasi SKPI.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/moderation"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <span>Buka Moderasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Mahasiswa Aktif</span>
          </div>
          <p className="text-base font-bold text-slate-900">{adminSummary.total_mahasiswa}</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">SKPI Terverifikasi</span>
          </div>
          <p className="text-base font-bold text-slate-900">{adminSummary.total_portofolio_terverifikasi}</p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Antrean Total</span>
          </div>
          <p className="text-base font-bold text-amber-900">
            {adminSummary.pending_posts + adminSummary.pending_reports + adminSummary.pending_portfolio_reviews}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
          <div className="flex items-center gap-2 text-rose-700 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Total Takedown</span>
          </div>
          <p className="text-base font-bold text-rose-900">{adminSummary.total_takedown}</p>
        </div>
      </div>
    </aside>
  );
}
