"use client";

import React from "react";
import { Compass, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 font-heading">
          Jelajah & Rekomendasi AI
        </h2>
        <p className="text-xs text-slate-500 font-body mt-1">
          Temukan proyek inspiratif lintas jurusan dan calon kolaborator berbasis keahlian.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Rekomendasi Kolaborator AI (M06)
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-body">
              Pencarian kemiripan semantik berbasis pgvector untuk mencocokkan keahlian dan minat riset.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Eksplorasi Proyek Unggulan (M05)
            </h3>
            <p className="text-xs text-slate-600 mt-1 font-body">
              Galeri proyek lintas angkatan dengan filter teknologi dan tag keahlian.
            </p>
          </div>
        </div>
      </div>

      <EmptyState
        title="Pencarian Belum Dilakukan"
        description="Gunakan kata kunci keahlian atau deskripsi proyek untuk mencari rekan tim yang relevan."
        icon={Compass}
      />
    </div>
  );
}
