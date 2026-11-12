"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus, Check, CheckCircle2, ExternalLink } from "lucide-react";
import { StudentSearchResult } from "@/services/searchService";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";

interface StudentResultCardProps {
  student: StudentSearchResult;
  onCollaborationInvite?: (student: StudentSearchResult) => void;
  onSkillClick?: (skillName: string) => void;
}

export const StudentResultCard: React.FC<StudentResultCardProps> = ({
  student,
  onCollaborationInvite,
  onSkillClick,
}) => {
  const toast = useToast();
  const [friendStatus, setFriendStatus] = useState<string | null>(student.friendship_status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = student.nama
    ? student.nama
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "CF";

  const handleSendFriendRequest = async () => {
    try {
      setIsSubmitting(true);
      await apiClient.post("/friendships", {
        addressee_id: student.user_id,
      });
      setFriendStatus("menunggu");
      toast.success(`Permintaan pertemanan terkirim ke ${student.nama}.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal mengirim permintaan pertemanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article
      data-testid={`student-card-${student.user_id}`}
      className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        {/* Header: Avatar, Name, Jurusan & NIM */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-primary font-bold text-base flex items-center justify-center flex-shrink-0 shadow-sm">
              <span>{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/profile/${student.user_id}`}
                  className="font-bold text-sm text-slate-900 font-heading hover:text-primary transition-colors truncate"
                >
                  {student.nama}
                </Link>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              </div>
              <p className="text-xs text-slate-500 font-body truncate">
                {student.jurusan || "Program Studi Kampus"}
                {student.angkatan ? ` • Angkatan '${String(student.angkatan).slice(-2)}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Bio */}
        {student.bio && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-body">
            {student.bio}
          </p>
        )}

        {/* Skills Chips */}
        {student.skills && student.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {student.skills.slice(0, 5).map((s) => (
              <button
                key={s.skill_id}
                type="button"
                onClick={() => onSkillClick?.(s.nama)}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium transition ${
                  s.tipe === "minat"
                    ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                    : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                } ${onSkillClick ? "cursor-pointer" : ""}`}
                title={onSkillClick ? `Cari mahasiswa dengan keahlian ${s.nama}` : undefined}
              >
                {s.nama}
              </button>
            ))}
            {student.skills.length > 5 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{student.skills.length - 5} lainnya
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/profile/${student.user_id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>Lihat Portofolio</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {friendStatus === "diterima" ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Berteman</span>
          </span>
        ) : friendStatus === "menunggu" ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
            <span>Menunggu</span>
          </span>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSendFriendRequest}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Teman</span>
          </button>
        )}
      </div>
    </article>
  );
};
