"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { PostCard, PostViewModel } from "@/components/features/PostCard";
import { CreatePostCard } from "@/components/features/CreatePostCard";
import { FriendRequestWidget, FriendRequestItem } from "@/components/features/FriendRequestWidget";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Sparkles,
  Compass,
  Users,
  UserCheck,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface PostSkillApi {
  skill_id: number;
  nama: string;
  tipe: string;
}

interface PostDetailApi {
  post_id: number;
  user_id: number;
  author: {
    user_id: number;
    nama: string;
    jurusan: string | null;
    angkatan: number | null;
    role: string;
  };
  isi: string;
  gambar_url: string | null;
  tipe: "umum" | "cari_anggota";
  status: string;
  is_deleted: boolean;
  created_at: string;
  skills: PostSkillApi[];
  moderation_note: string | null;
  is_owner: boolean;
  can_takedown: boolean;
  can_report: boolean;
  can_edit: boolean;
}

interface PostFeedApiResponse {
  items: PostDetailApi[];
  has_more: boolean;
  next_cursor: string | null;
}

function mapApiToViewModel(item: PostDetailApi): PostViewModel {
  return {
    id: item.post_id,
    author_id: item.author.user_id,
    author_name: item.author.nama,
    author_jurusan: item.author.jurusan,
    author_avatar: null,
    konten: item.isi,
    media_url: item.gambar_url,
    created_at: item.created_at,
    tipe: item.tipe,
    status: item.status,
    skills: item.skills,
    moderation_note: item.moderation_note,
    is_owner: item.is_owner,
    can_takedown: item.can_takedown,
    can_report: item.can_report,
    can_delete: false,
    can_edit: item.can_edit,
    likes_count: 0,
    comments_count: 0,
    is_liked: false,
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [activeTab, setActiveTab] = useState<"all" | "friends" | "recruiting">("all");
  const [posts, setPosts] = useState<PostViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Friend requests placeholder for M06
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

  const fetchFeed = useCallback(async (scope: "all" | "friends" | "recruiting", cursor?: string | null) => {
    try {
      if (!cursor) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params: Record<string, any> = {
        scope,
        limit: 10,
      };
      if (cursor) {
        params.cursor = cursor;
      }

      const res = await apiClient.get<PostFeedApiResponse>("/posts", { params });
      const data = res.data;
      const mapped = data.items.map(mapApiToViewModel);

      if (!cursor) {
        setPosts(mapped);
      } else {
        setPosts((prev) => [...prev, ...mapped]);
      }

      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);
    } catch (err: any) {
      toastRef.current.error(err.response?.data?.detail || "Gagal memuat linimasa postingan");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(activeTab, null);
  }, [activeTab, fetchFeed]);

  const handlePostCreated = (newPostApi: PostDetailApi) => {
    // Only display in public feed if status is 'tayang'
    if (newPostApi.status === "tayang") {
      const viewModel = mapApiToViewModel(newPostApi);
      if (
        activeTab === "all" ||
        (activeTab === "recruiting" && newPostApi.tipe === "cari_anggota") ||
        activeTab === "friends"
      ) {
        setPosts((prev) => [viewModel, ...prev]);
      }
    }
  };

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
    toast.warning(`Permintaan takedown post #${postId} diajukan ke antrean moderasi (M08).`);
  };

  const handleReport = (postId: number) => {
    toast.info(`Laporan untuk post #${postId} berhasil dikirim ke antrean review (M08).`);
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Main Feed Column */}
      <section className="lg:col-span-2 space-y-5">
        {/* Welcome Greeting Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-secondary-container" />
              <span className="text-xs font-semibold text-secondary-container uppercase tracking-wider">
                Beranda Kolaborasi
              </span>
            </div>
            <h1 className="text-xl font-extrabold font-heading">
              Halo, {user?.nama || "Mahasiswa"}! 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-lg font-body">
              Temukan inovasi karya kampus, diskusikan proyek riset, dan temukan mitra kolaborasi terbaikmu.
            </p>
          </div>
        </div>

        {/* Create Post Card Widget */}
        <CreatePostCard onPostCreated={handlePostCreated} />

        {/* Feed Scope Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border-subtle pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === "all"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Semua</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === "friends"
                ? "bg-primary text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Teman</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("recruiting")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === "recruiting"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rekrutmen Tim</span>
          </button>
        </div>

        {/* Posts Timeline Stream */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm">
            <EmptyState
              title={
                activeTab === "recruiting"
                  ? "Belum Ada Lowongan Rekrutmen Tim"
                  : activeTab === "friends"
                  ? "Belum Ada Postingan dari Teman"
                  : "Linimasa Masih Sunyi"
              }
              description={
                activeTab === "recruiting"
                  ? "Jadilah yang pertama membuka rekrutmen kolaborator untuk lomba atau proyek skripsi Anda."
                  : activeTab === "friends"
                  ? "Kembangkan jejaring pertemanan kampus Anda untuk melihat kabar terbaru dari rekan satu prodi."
                  : "Mulai percakapan dengan membagikan karya portofolio atau pencapaian terbaru Anda."
              }
              icon={FolderOpen}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={() => toast.info("Fitur komentar akan diaktifkan pada modul interaksi.")}
                onTakedown={handleTakedown}
                onReport={handleReport}
                onEdit={(p) => {
                  toast.info(`Membuka mode perbaikan postingan #${p.id}.`);
                }}
              />
            ))}

            {/* Keyset Load More Button */}
            {hasMore && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchFeed(activeTab, nextCursor)}
                  disabled={isLoadingMore}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                  <span>{isLoadingMore ? "Memuat postingan..." : "Muat Lebih Banyak"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Side Widgets Column */}
      <aside className="space-y-5">
        <FriendRequestWidget
          requests={friendRequests}
          onAccept={handleAcceptFriend}
          onReject={handleRejectFriend}
        />

        <div className="p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
            Tentang CampusFolio
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-body">
            Platform portofolio terintegrasi SKPI untuk mahasiswa dan program studi. Setiap karya dapat diverifikasi langsung oleh Kaprodi/Moderator.
          </p>
        </div>
      </aside>
    </div>
  );
}
