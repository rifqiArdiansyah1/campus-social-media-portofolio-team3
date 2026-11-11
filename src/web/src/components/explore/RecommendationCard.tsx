"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ThumbsDown,
  UserPlus,
  MessageSquare,
  ExternalLink,
  BrainCircuit,
  Check,
} from "lucide-react";
import { RecommendationItem, submitRecommendationFeedback } from "@/services/recommendationService";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";

interface RecommendationCardProps {
  item: RecommendationItem;
  isFallback?: boolean;
  onCollaborationInvite?: (candidate: RecommendationItem) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  isFallback = false,
  onCollaborationInvite,
}) => {
  const toast = useToast();
  const [feedbackSent, setFeedbackSent] = useState<"relevan" | "tidak_relevan" | null>(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [friendRequested, setFriendRequested] = useState(false);
  const [isRequestingFriend, setIsRequestingFriend] = useState(false);

  const matchPercentage = Math.round(item.score * 100);

  const handleFeedback = async (type: "relevan" | "tidak_relevan") => {
    if (!item.rec_id) {
      toast.info("Catatan rekomendasi tidak memiliki ID audit untuk umpan balik.");
      return;
    }

    try {
      setIsSendingFeedback(true);
      await submitRecommendationFeedback(item.rec_id, type);
      setFeedbackSent(type);
      toast.success(
        type === "tidak_relevan"
          ? "Terima kasih, umpan balik Anda membantu AI meningkatkan kualitas saran kolaborator."
          : "Umpan balik relevan berhasil dicatat."
      );
    } catch {
      toast.error("Gagal mengirim umpan balik relevansi.");
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleSendFriendRequest = async () => {
    const candidateId = Number(item.user_id);
    if (!candidateId || isNaN(candidateId)) return;

    try {
      setIsRequestingFriend(true);
      await apiClient.post("/friendships", {
        addressee_id: candidateId,
      });
      setFriendRequested(true);
      toast.success(`Permintaan pertemanan terkirim ke ${item.name || "mahasiswa"}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal mengirim permintaan pertemanan.");
    } finally {
      setIsRequestingFriend(false);
    }
  };

  const initials = item.name
    ? item.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "CF";

  return (
    <article
      data-testid={`recommendation-card-${item.user_id}`}
      className="relative flex flex-col bg-white rounded-2xl p-5 border border-border-subtle shadow-sm hover:shadow-md transition-shadow space-y-4"
    >
      {/* Header: Avatar, Name, Jurusan & AI Match Pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-primary font-bold text-base flex items-center justify-center shadow-sm">
              <span>{initials}</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${item.user_id}`}
                className="font-bold text-sm text-slate-900 font-heading hover:text-primary transition-colors truncate"
              >
                {item.name || `Mahasiswa #${item.user_id}`}
              </Link>
              <span title="Mahasiswa Terverifikasi">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              </span>
            </div>
            <span className="text-xs text-slate-500 font-body truncate">
              {item.department || "Mahasiswa Aktif"}
            </span>
          </div>
        </div>

        {/* AI Score Pill (Stitch Screen 4) */}
        {!isFallback ? (
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full flex-shrink-0 shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span className="text-xs font-extrabold font-heading">{matchPercentage}% Match</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full flex-shrink-0 text-[11px] font-semibold">
            <span>Pencocokan Kata Kunci</span>
          </div>
        )}
      </div>

      {/* AI Reasoning Spotlight Box */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-primary">
          <BrainCircuit className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold tracking-wider uppercase font-heading">
            AI Complementary Reason
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-body">
          {item.reason}
        </p>
      </div>

      {/* Matched Terms & Complementary Skills Chips */}
      <div className="space-y-2">
        {item.matched_terms && item.matched_terms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 mr-1 uppercase tracking-wide">
              Keahlian Bersama:
            </span>
            {item.matched_terms.map((term, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 border border-indigo-100 text-indigo-700"
              >
                {term}
              </span>
            ))}
          </div>
        )}

        {item.complementary_skills && item.complementary_skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-emerald-700 mr-1 uppercase tracking-wide">
              Komplementer Proyek:
            </span>
            {item.complementary_skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800"
              >
                + {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action CTA Group (Stitch Screen 4) */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Ajak Kolaborasi Button */}
          <button
            type="button"
            onClick={() => onCollaborationInvite?.(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition shadow-xs active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ajak Kolaborasi</span>
          </button>

          {/* Tambah Teman Button */}
          {friendRequested ? (
            <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terkirim</span>
            </span>
          ) : (
            <button
              type="button"
              disabled={isRequestingFriend}
              onClick={handleSendFriendRequest}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95 disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-600" />
              <span>Tambah Teman</span>
            </button>
          )}

          {/* Lihat Profil */}
          <Link
            href={`/profile/${item.user_id}`}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Lihat Profil Lengkap"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Feedback Button: Kurang Relevan */}
        {item.rec_id && (
          <div className="flex items-center gap-1">
            {feedbackSent === "tidak_relevan" ? (
              <span className="text-[11px] text-slate-500 font-medium italic">
                Umpan balik tersimpan
              </span>
            ) : (
              <button
                type="button"
                disabled={isSendingFeedback}
                onClick={() => handleFeedback("tidak_relevan")}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition font-medium"
                title="Beri tahu AI jika rekomendasi ini kurang relevan"
              >
                <ThumbsDown className="w-3 h-3" />
                <span>Kurang Relevan</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
