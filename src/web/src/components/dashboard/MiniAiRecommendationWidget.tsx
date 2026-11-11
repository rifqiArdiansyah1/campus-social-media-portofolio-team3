"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, UserPlus, Check, ThumbsDown, ArrowRight, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  getCollaboratorRecommendations,
  submitRecommendationFeedback,
  RecommendationItem,
} from "@/services/recommendationService";

export function MiniAiRecommendationWidget() {
  const toast = useToast();
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [dismissedRecs, setDismissedRecs] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ai-recommendations", "mini"],
    queryFn: () => getCollaboratorRecommendations({ top_k: 3 }),
    staleTime: 15 * 60 * 1000, // 15 mins cache to avoid heavy TF-IDF re-computations
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleAddFriend = async (candidateId: string, name?: string | null) => {
    try {
      await apiClient.post("/friendships", { addressee_id: Number(candidateId) });
      setSentRequests((prev) => ({ ...prev, [candidateId]: true }));
      toast.success(`Permohonan pertemanan terkirim ke ${name || "kandidat"}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal mengirim permohonan pertemanan.");
    }
  };

  const handleFeedbackNotRelevant = async (rec: RecommendationItem) => {
    setDismissedRecs((prev) => ({ ...prev, [rec.user_id]: true }));
    if (rec.rec_id) {
      try {
        await submitRecommendationFeedback(rec.rec_id, "tidak_relevan");
        toast.info("Masukan Anda telah dicatat untuk meningkatkan rekomendasi.");
      } catch {
        // Feedback is non-critical
      }
    } else {
      toast.info("Rekomendasi disembunyikan.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3 animate-pulse">
        <div className="h-4 w-36 bg-slate-200 rounded"></div>
        <div className="h-16 bg-slate-100 rounded-xl"></div>
        <div className="h-16 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (isError || !data) {
    return null; // Graceful degradation: don't break the home dashboard if AI service fails
  }

  const activeRecommendations = (data.recommendations || []).filter(
    (item) => !dismissedRecs[item.user_id]
  );

  return (
    <aside
      aria-label="Rekomendasi Kolaborator AI"
      className="p-4 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
            Rekomendasi Kolaborator
          </h2>
        </div>
        <Link
          href="/explore?tab=recommendation"
          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
        >
          <span>Jelajah</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {activeRecommendations.length === 0 ? (
        <div className="p-3 text-center rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <p className="text-xs text-slate-600 font-medium">Belum ada rekomendasi aktif.</p>
          <p className="text-[11px] text-slate-400">
            Lengkapi keahlian di profil Anda agar AI dapat memadukan mitra terbaik.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeRecommendations.map((rec) => {
            const isSent = Boolean(sentRequests[rec.user_id]);
            const matchPercent = Math.round(rec.score * 100);

            return (
              <div
                key={rec.user_id}
                data-testid={`mini-ai-rec-${rec.user_id}`}
                className="p-3 rounded-xl border border-border-subtle hover:border-primary/40 bg-white transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${rec.user_id}`}
                      className="text-xs font-bold text-slate-900 hover:text-primary transition-colors truncate block"
                    >
                      {rec.name || "Mahasiswa"}
                    </Link>
                    {rec.department && (
                      <p className="text-[11px] text-slate-500 truncate">{rec.department}</p>
                    )}
                  </div>
                  <span
                    data-testid={`match-badge-${rec.user_id}`}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 flex-shrink-0"
                  >
                    {matchPercent}% Cocok
                  </span>
                </div>

                {/* Matched / Complementary skills preview */}
                {rec.matched_terms && rec.matched_terms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.matched_terms.slice(0, 3).map((term) => (
                      <span
                        key={term}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleFeedbackNotRelevant(rec)}
                    title="Tandai kurang relevan"
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    <span className="text-[10px]">Kurang Relevan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFriend(rec.user_id, rec.name)}
                    disabled={isSent}
                    data-testid={`btn-add-friend-${rec.user_id}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                      isSent
                        ? "bg-slate-100 text-slate-500 cursor-default"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    {isSent ? (
                      <>
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Terkirim</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Tambah</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
