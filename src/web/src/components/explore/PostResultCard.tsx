"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Calendar, ArrowRight, MessageSquare } from "lucide-react";
import { PostSearchResult } from "@/services/searchService";

interface PostResultCardProps {
  post: PostSearchResult;
  onSkillClick?: (skillName: string) => void;
}

export const PostResultCard: React.FC<PostResultCardProps> = ({ post, onSkillClick }) => {
  const [imgError, setImgError] = React.useState(false);
  const isRecruiting = post.tipe === "cari_anggota";

  const dateFormatted = new Date(post.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      data-testid={`post-search-card-${post.post_id}`}
      className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3.5"
    >
      <div className="space-y-3">
        {/* Header: Author info, Post Type Badge, and Date */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-primary font-bold text-xs flex items-center justify-center">
              <span>{post.author_nama.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-heading">
                {post.author_nama}
              </h4>
              <span className="text-[11px] text-slate-500 font-body">
                {post.author_jurusan || "Mahasiswa"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRecruiting && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[10px]">
                <Users className="w-3 h-3 text-rose-600" />
                <span>Cari Tim</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-body">
              <Calendar className="w-3 h-3" />
              <span>{dateFormatted}</span>
            </span>
          </div>
        </div>

        {/* Post Content */}
        <p className="text-xs text-slate-800 line-clamp-3 leading-relaxed font-body">
          {post.isi}
        </p>

        {/* Post Image Thumbnail if available */}
        {post.gambar_url && !imgError && (
          <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={post.gambar_url}
              alt="Foto Postingan"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Skills Tags */}
        {post.skills && post.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.skills.map((s) => (
              <button
                key={s.skill_id}
                type="button"
                onClick={() => onSkillClick?.(s.nama)}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition ${
                  onSkillClick ? "cursor-pointer" : ""
                }`}
                title={onSkillClick ? `Cari postingan dengan topik #${s.nama}` : undefined}
              >
                #{s.nama}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <Link
          href={`/posts/${post.post_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition"
        >
          <span>Buka Diskusi Postingan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
