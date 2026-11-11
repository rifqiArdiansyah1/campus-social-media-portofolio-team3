"use client";

import React from "react";
import Link from "next/link";
import { Award, Clock, AlertTriangle, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { StudentDashboardSummary } from "@/services/dashboardService";

interface MySkpiSummaryWidgetProps {
  summary: StudentDashboardSummary;
  isLoading?: boolean;
}

export function MySkpiSummaryWidget({ summary, isLoading = false }: MySkpiSummaryWidgetProps) {
  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
        <div className="h-12 bg-slate-100 rounded-xl"></div>
        <div className="h-16 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  const hasRevisions = summary.total_portofolio_perlu_revisi > 0;

  return (
    <aside
      aria-label="Ringkasan Portofolio SKPI Mahasiswa"
      className="p-4 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
            Portofolio & SKPI
          </h2>
        </div>
        <Link
          href="/portfolio"
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
        >
          <span>Buka</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Points Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-600 font-body">Poin SKPI Terverifikasi</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span data-testid="skpi-total-points" className="text-2xl font-extrabold text-primary font-heading">
              {summary.total_skpi_poin}
            </span>
            <span className="text-xs font-medium text-slate-500">Poin</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white shadow-xs border border-primary/20 text-primary">
          <Award className="w-6 h-6" />
        </div>
      </div>

      {/* Revision Alert Badge if needed */}
      {hasRevisions && (
        <Link
          href="/portfolio?status=ditolak"
          data-testid="skpi-revision-alert"
          className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium hover:bg-rose-100 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="truncate">
            {summary.total_portofolio_perlu_revisi} item perlu perbaikan dokumen.
          </span>
        </Link>
      )}

      {/* Status Counters Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Terverifikasi
          </span>
          <span className="font-bold text-slate-800">{summary.total_portofolio_terverifikasi}</span>
        </div>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Menunggu
          </span>
          <span className="font-bold text-slate-800">{summary.total_portofolio_menunggu}</span>
        </div>
      </div>

      {/* Recent Verified Items */}
      <div className="space-y-2 pt-1 border-t border-border-subtle">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Karya Terverifikasi Terbaru
        </p>
        {summary.recent_verified_portfolios.length === 0 ? (
          <p className="text-xs text-slate-400 py-1 italic">Belum ada karya terverifikasi.</p>
        ) : (
          <div className="space-y-1.5">
            {summary.recent_verified_portfolios.slice(0, 3).map((item) => (
              <div
                key={item.portfolio_id}
                data-testid={`recent-portfolio-${item.portfolio_id}`}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{item.judul}</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 capitalize">
                    {item.kategori.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/portfolio/create"
        className="block w-full py-2 px-3 text-center text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-xs"
      >
        + Tambah Karya Portofolio
      </Link>
    </aside>
  );
}
