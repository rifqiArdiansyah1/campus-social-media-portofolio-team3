"use client";

import React, { useState } from "react";
import { MessageSquare, ExternalLink, Copy, Check, X } from "lucide-react";
import { RecommendationItem } from "@/services/recommendationService";
import { useToast } from "@/context/ToastContext";

interface CollaborationModalProps {
  isOpen: boolean;
  candidate: RecommendationItem | null;
  onClose: () => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  candidate,
  onClose,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !candidate) return null;

  const defaultMessage = `Halo ${candidate.name || "rekan"}, saya melihat profil Anda di CampusFolio. Saya tertarik mengajak Anda berkolaborasi karena keahlian Anda (${candidate.matched_terms.concat(candidate.complementary_skills).slice(0, 3).join(", ")}) sangat sesuai dengan proyek kami.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(defaultMessage);
      setCopied(true);
      toast.success("Draf ajakan kolaborasi disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin teks.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border-subtle shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 font-heading">
              Ajak Kolaborasi Proyek
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <p className="text-xs font-semibold text-slate-800 font-heading">
              Kandidat: {candidate.name || `Mahasiswa #${candidate.user_id}`}
            </p>
            <p className="text-[11px] text-slate-500 font-body">
              {candidate.department || "Program Studi Mahasiswa"}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 font-heading">
              Draf Pesan Kolaborasi:
            </label>
            <textarea
              readOnly
              value={defaultMessage}
              rows={4}
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none font-body leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Tersalin!" : "Salin Pesan"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition shadow-xs active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
