"use client";

import React from "react";
import Image from "next/image";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  Heart,
  MessageSquare,
  MoreHorizontal,
  ShieldAlert,
  Flag,
  Trash2,
  Users,
  Award,
  Clock,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

export interface PostSkillItem {
  skill_id: number;
  nama: string;
  tipe: string;
}

export interface PostViewModel {
  id: number;
  author_id: number;
  author_name: string;
  author_jurusan?: string | null;
  author_avatar?: string | null;
  konten: string;
  media_url?: string | null;
  created_at: string;
  tipe?: "umum" | "cari_anggota";
  status?: string;
  skills?: PostSkillItem[];
  moderation_note?: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_owner?: boolean;
  can_takedown?: boolean;
  can_report?: boolean;
  can_delete?: boolean;
  can_edit?: boolean;
}

export interface PostCardProps {
  post: PostViewModel;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onTakedown?: (postId: number) => void;
  onReport?: (postId: number) => void;
  onDelete?: (postId: number) => void;
  onEdit?: (post: PostViewModel) => void;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onTakedown,
  onReport,
  onDelete,
  onEdit,
}: PostCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isRecruiting = post.tipe === "cari_anggota";
  const isOwner = Boolean(post.is_owner);

  return (
    <article
      data-testid={`post-card-${post.id}`}
      className="p-5 rounded-2xl border border-border-subtle bg-surface-card shadow-sm hover:shadow-md transition-shadow relative space-y-3.5"
    >
      {/* Header: Author & Options */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar Circle with 2-char Initial */}
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0 overflow-hidden relative shadow-sm">
            {post.author_avatar ? (
              <Image
                src={post.author_avatar}
                alt={post.author_name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span>{getInitials(post.author_name)}</span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 font-heading leading-tight truncate">
                {post.author_name}
              </h4>

              {/* Recruitment Type Badge */}
              {isRecruiting && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[10px] tracking-wide">
                  <Users className="w-3 h-3 text-rose-600" />
                  <span>Cari Anggota Tim</span>
                </span>
              )}

              {/* Owner Status Badge (if not publicly active) */}
              {isOwner && post.status && post.status !== "tayang" && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    post.status === "menunggu_review" || post.status === "direview"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : post.status === "revisi"
                      ? "bg-orange-50 text-orange-800 border-orange-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span className="capitalize">{post.status.replace("_", " ")}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-body mt-0.5">
              {post.author_jurusan && <span className="truncate">{post.author_jurusan}</span>}
              {post.author_jurusan && <span>•</span>}
              <time dateTime={post.created_at}>{formattedDate}</time>
            </div>
          </div>
        </div>

        {/* Action Menu (Accessible Headless UI Menu) */}
        {(post.can_takedown || post.can_report || post.can_delete || (post.can_edit && onEdit)) && (
          <Menu as="div" className="relative flex-shrink-0">
            <MenuButton
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Opsi postingan"
            >
              <MoreHorizontal className="w-5 h-5" />
            </MenuButton>

            <MenuItems
              transition
              className="absolute right-0 mt-1 w-44 origin-top-right rounded-xl bg-white shadow-lg border border-border-subtle py-1 z-20 text-xs font-medium focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              {post.can_edit && onEdit && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() => onEdit(post)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-primary text-left transition-colors ${
                        focus ? "bg-indigo-50" : ""
                      }`}
                    >
                      <Edit3 className="w-4 h-4 text-primary" />
                      <span>Edit Postingan</span>
                    </button>
                  )}
                </MenuItem>
              )}
              {post.can_takedown && onTakedown && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() => onTakedown(post.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-red-700 text-left transition-colors ${
                        focus ? "bg-red-50" : ""
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>Takedown Post</span>
                    </button>
                  )}
                </MenuItem>
              )}

              {post.can_report && onReport && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() => onReport(post.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-slate-700 text-left transition-colors ${
                        focus ? "bg-slate-50" : ""
                      }`}
                    >
                      <Flag className="w-4 h-4 text-slate-500" />
                      <span>Laporkan Konten</span>
                    </button>
                  )}
                </MenuItem>
              )}

              {post.can_delete && onDelete && (
                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() => onDelete(post.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-red-600 text-left transition-colors ${
                        focus ? "bg-red-50" : ""
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus Postingan</span>
                    </button>
                  )}
                </MenuItem>
              )}
            </MenuItems>
          </Menu>
        )}
      </div>

      {/* Moderation Note Alert for Owner/Staff */}
      {post.moderation_note && (isOwner || post.can_takedown) && (
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Catatan Moderasi: </span>
            <span>{post.moderation_note}</span>
          </div>
        </div>
      )}

      {/* Content Body */}
      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-body whitespace-pre-line">
        {post.konten}
      </p>

      {/* Media Image */}
      {post.media_url && (
        <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-slate-100 border border-border-subtle">
          <Image
            src={post.media_url}
            alt="Lampiran postingan"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Skill Tags */}
      {post.skills && post.skills.length > 0 && (
        <div className="pt-1 flex flex-wrap gap-1.5 items-center">
          <Award className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mr-0.5" />
          {post.skills.map((skill) => (
            <span
              key={skill.skill_id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
            >
              {skill.nama}
            </span>
          ))}
        </div>
      )}

      {/* Footer / Reactions */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => onLike && onLike(post.id)}
            className={`flex items-center gap-1.5 transition-colors ${
              post.is_liked ? "text-rose-600 font-semibold" : "hover:text-slate-800"
            }`}
            aria-label={post.is_liked ? "Batal suka" : "Sukai postingan"}
          >
            <Heart className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`} />
            <span>{post.likes_count ?? 0}</span>
          </button>

          <button
            type="button"
            onClick={() => onComment && onComment(post.id)}
            className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
            aria-label="Komentar"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments_count ?? 0}</span>
          </button>
        </div>

        {isRecruiting && (
          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
            Terbuka untuk Kolaborasi
          </span>
        )}
      </div>
    </article>
  );
}
