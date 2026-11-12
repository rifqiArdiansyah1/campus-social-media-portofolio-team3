"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FolderCheck, ExternalLink, Award, FileText, CheckCircle2 } from "lucide-react";
import { PortfolioSearchResult } from "@/services/searchService";

interface PortfolioResultCardProps {
  portfolio: PortfolioSearchResult;
  onSkillClick?: (skillName: string) => void;
}

export const PortfolioResultCard: React.FC<PortfolioResultCardProps> = ({ portfolio, onSkillClick }) => {
  const [imgError, setImgError] = React.useState(false);
  const getCategoryBadge = (kategori: string) => {
    switch (kategori) {
      case "skpi":
        return { label: "SKPI", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Award };
      case "sertifikat":
        return { label: "Sertifikat", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Award };
      case "artikel_ilmiah":
        return { label: "Artikel Ilmiah", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: FileText };
      default:
        return { label: "Proyek Karya", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FolderCheck };
    }
  };

  const cat = getCategoryBadge(portfolio.kategori);
  const CatIcon = cat.icon;

  return (
    <article
      data-testid={`portfolio-search-card-${portfolio.portfolio_id}`}
      className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3.5"
    >
      <div className="space-y-3">
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cat.bg}`}>
            <CatIcon className="w-3 h-3" />
            <span>{cat.label}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Terverifikasi</span>
          </span>
        </div>

        {/* Thumbnail Image if available */}
        {portfolio.gambar_url && !imgError && (
          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={portfolio.gambar_url}
              alt={portfolio.judul}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Title & Author */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 font-heading line-clamp-1">
            {portfolio.judul}
          </h3>
          <p className="text-xs text-slate-500 font-body mt-0.5">
            Oleh <span className="font-semibold text-slate-700">{portfolio.author_nama}</span>
            {portfolio.author_jurusan ? ` (${portfolio.author_jurusan})` : ""}
          </p>
        </div>

        {/* Description */}
        {portfolio.deskripsi && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-body">
            {portfolio.deskripsi}
          </p>
        )}

        {/* Skills Tags */}
        {portfolio.skills && portfolio.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {portfolio.skills.map((s) => (
              <button
                key={s.skill_id}
                type="button"
                onClick={() => onSkillClick?.(s.nama)}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition ${
                  onSkillClick ? "cursor-pointer" : ""
                }`}
                title={onSkillClick ? `Cari portofolio dengan keahlian ${s.nama}` : undefined}
              >
                {s.nama}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <Link
          href={`/profile/${portfolio.user_id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>Profil Kreator</span>
        </Link>

        {portfolio.tautan_url && (
          <a
            href={portfolio.tautan_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-primary transition font-medium"
          >
            <span>Buka Tautan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </article>
  );
};
