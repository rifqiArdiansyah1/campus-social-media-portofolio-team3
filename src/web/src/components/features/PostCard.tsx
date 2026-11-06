"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Heart, MessageSquare, MoreHorizontal, ShieldAlert, Flag, Trash2 } from "lucide-react";

export interface PostViewModel {
  id: number;
  author_id: number;
  author_name: string;
  author_jurusan?: string | null;
  author_avatar?: string | null;
  konten: string;
  media_url?: string | null;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  can_takedown?: boolean;
  can_report?: boolean;
  can_delete?: boolean;
}

export interface PostCardProps {
  post: PostViewModel;
  onLike?: (postId: number) => void;
  onComment?: (postId: number) => void;
  onTakedown?: (postId: number) => void;
  onReport?: (postId: number) => void;
  onDelete?: (postId: number) => void;
}

export function PostCard({
  post,
  onLike,
  onComment,
  onTakedown,
  onReport,
  onDelete,
}: PostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formattedDate = new Date(post.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      data-testid={`post-card-${post.id}`}
      className="p-5 rounded-2xl border border-border-subtle bg-surface-card shadow-sm hover:shadow-md transition-shadow relative"
    >
      {/* Header: Author & Options */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary text-sm flex-shrink-0 overflow-hidden relative border border-border-subtle">
            {post.author_avatar ? (
              <Image
                src={post.author_avatar}
                alt={post.author_name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span>{post.author_name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 font-heading leading-tight">
              {post.author_name}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-body">
              {post.author_jurusan && <span>{post.author_jurusan}</span>}
              {post.author_jurusan && <span>•</span>}
              <time dateTime={post.created_at}>{formattedDate}</time>
            </div>
          </div>
        </div>

        {/* Action Menu (Takedown, Report, Delete) */}
        {(post.can_takedown || post.can_report || post.can_delete) && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Opsi postingan"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-border-subtle py-1 z-20 text-xs font-medium"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {post.can_takedown && onTakedown && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onTakedown(post.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-accent-danger-accessible hover:bg-red-50 text-left transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Takedown Post</span>
                  </button>
                )}

                {post.can_report && onReport && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onReport(post.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition-colors"
                  >
                    <Flag className="w-4 h-4 text-slate-500" />
                    <span>Laporkan Konten</span>
                  </button>
                )}

                {post.can_delete && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(post.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-left transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Postingan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Body */}
      <p className="mt-3.5 text-sm text-slate-800 leading-relaxed font-body whitespace-pre-line">
        {post.konten}
      </p>

      {/* Media Image */}
      {post.media_url && (
        <div className="mt-3 relative w-full h-64 rounded-xl overflow-hidden bg-slate-100 border border-border-subtle">
          <Image
            src={post.media_url}
            alt="Lampiran postingan"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Footer / Reactions */}
      <div className="mt-4 pt-3 border-t border-border-subtle flex items-center gap-6 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={() => onLike && onLike(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${
            post.is_liked ? "text-accent-coral-accessible font-semibold" : "hover:text-slate-800"
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
    </article>
  );
}
