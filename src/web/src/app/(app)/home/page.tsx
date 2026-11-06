"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PostCard, PostViewModel } from "@/components/features/PostCard";
import { FriendRequestWidget, FriendRequestItem } from "@/components/features/FriendRequestWidget";
import { useToast } from "@/context/ToastContext";
import { Sparkles, PlusCircle } from "lucide-react";

export default function HomePage() {
  const { user, role } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<PostViewModel[]>([
    {
      id: 1,
      author_id: 101,
      author_name: "Budi Santoso",
      author_jurusan: "Teknik Informatika",
      author_avatar: null,
      konten:
        "Baru saja merilis proyek Smart Campus Assistant dengan LLM rag dan FastAPI. Menemukan beberapa optimasi indexing pgvector yang menarik untuk dibahas!",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      likes_count: 14,
      comments_count: 3,
      is_liked: false,
      can_takedown: role === "moderator" || role === "admin",
      can_report: true,
      can_delete: false,
    },
    {
      id: 2,
      author_id: 102,
      author_name: "Siti Rahma",
      author_jurusan: "Sistem Informasi",
      author_avatar: null,
      konten:
        "Ada yang tertarik kolaborasi untuk lomba UI/UX Hackathon Nasional bulan depan? Kami mencari frontend developer yang menguasai React & Tailwind.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      likes_count: 28,
      comments_count: 8,
      is_liked: true,
      can_takedown: role === "moderator" || role === "admin",
      can_report: true,
      can_delete: false,
    },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([
    {
      id: 201,
      sender_id: 301,
      sender_name: "Ahmad Fauzi",
      sender_jurusan: "Teknik Informatika",
      sender_avatar: null,
      created_at: new Date().toISOString(),
    },
  ]);

  const handleLike = (postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: (p.likes_count ?? 0) + (p.is_liked ? -1 : 1),
            }
          : p
      )
    );
  };

  const handleTakedown = (postId: number) => {
    toast.warning(`Konten post #${postId} ditakedown oleh moderator.`);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleReport = (postId: number) => {
    toast.info(`Laporan untuk post #${postId} berhasil dikirim ke antrean moderasi.`);
  };

  const handleAcceptFriend = (reqId: number) => {
    toast.success("Permohonan koneksi diterima!");
    setFriendRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleRejectFriend = (reqId: number) => {
    toast.info("Permohonan koneksi ditolak.");
    setFriendRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Feed Column */}
      <section className="lg:col-span-2 space-y-5">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-secondary-container" />
              <span className="text-xs font-semibold text-secondary-container uppercase tracking-wider">
                Beranda Kolaborasi
              </span>
            </div>
            <h2 className="text-xl font-extrabold font-heading">
              Halo, {user?.nama || "Mahasiswa"}! 👋
            </h2>
            <p className="mt-1 text-sm text-white/80 max-w-lg font-body">
              Temukan portofolio unggulan teman kampus, rekomendasi mitra tim, dan diskusikan ide inovasimu.
            </p>
          </div>
        </div>

        {/* Create Post Prompt */}
        <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
            {user?.nama?.charAt(0).toUpperCase() || "U"}
          </div>
          <button
            type="button"
            onClick={() => toast.info("Formulir pembuatan post baru akan aktif di modul M05!")}
            className="flex-1 text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-500 transition-colors flex items-center justify-between"
          >
            <span>Bagikan pembaruan proyek atau pertanyaanmu...</span>
            <PlusCircle className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* Post Feed List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={(id) => toast.info(`Komentar post #${id} akan aktif di modul M05.`)}
              onTakedown={handleTakedown}
              onReport={handleReport}
            />
          ))}
        </div>
      </section>

      {/* Side Widgets Column */}
      <aside className="space-y-5">
        <FriendRequestWidget
          requests={friendRequests}
          onAccept={handleAcceptFriend}
          onReject={handleRejectFriend}
        />

        <div className="p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
            Tentang CampusFolio
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-body">
            Platform portofolio terintegrasi SKPI untuk mahasiswa dan program studi. Setiap karya dapat diverifikasi langsung oleh Kaprodi/Moderator.
          </p>
        </div>
      </aside>
    </div>
  );
}
