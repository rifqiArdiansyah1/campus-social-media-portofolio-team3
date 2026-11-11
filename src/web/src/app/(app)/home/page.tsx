"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { PostCard, PostViewModel } from "@/components/features/PostCard";
import { CreatePostCard } from "@/components/features/CreatePostCard";
import { FriendRequestWidget, FriendRequestItem } from "@/components/features/FriendRequestWidget";
import { DashboardReviewAlert } from "@/components/dashboard/DashboardReviewAlert";
import { MySkpiSummaryWidget } from "@/components/dashboard/MySkpiSummaryWidget";
import { MiniAiRecommendationWidget } from "@/components/dashboard/MiniAiRecommendationWidget";
import { ReportPostModal } from "@/components/features/ReportPostModal";
import { TakedownPostModal } from "@/components/features/TakedownPostModal";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getDashboardSummary,
  StudentDashboardSummary,
  ModeratorDashboardSummary,
  AdminDashboardSummary,
} from "@/services/dashboardService";
import {
  Sparkles,
  Compass,
  Users,
  UserCheck,
  Loader2,
  FolderOpen,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
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

interface FriendRequestsApiResponse {
  items: Array<{
    friendship_id: number;
    counterpart: {
      user_id: number;
      nama: string;
      jurusan: string | null;
      avatar_url: string | null;
    };
    created_at: string;
  }>;
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
  const queryClient = useQueryClient();

  // Role helpers
  const isStudent = user?.role === "mahasiswa";
  const isModerator = user?.role === "moderator";
  const isAdmin = user?.role === "admin";
  const isStaff = isModerator || isAdmin;

  // Unified Dashboard Summary Query
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const [activeTab, setActiveTab] = useState<"all" | "friends" | "recruiting" | "prodi">("all");
  const [posts, setPosts] = useState<PostViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // M08 Modals
  const [reportModalPost, setReportModalPost] = useState<{ id: number; authorName: string } | null>(null);
  const [takedownModalPost, setTakedownModalPost] = useState<{ id: number; authorName: string } | null>(null);

  // Live Friend requests for Mahasiswa only
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fetchFriendRequests = useCallback(async () => {
    if (!isStudent) return;
    try {
      setIsLoadingRequests(true);
      const res = await apiClient.get<FriendRequestsApiResponse>("/friendships", {
        params: { direction: "incoming" },
      });
      const mapped: FriendRequestItem[] = res.data.items.map((item) => ({
        id: item.friendship_id,
        sender_id: item.counterpart.user_id,
        sender_name: item.counterpart.nama,
        sender_jurusan: item.counterpart.jurusan,
        sender_avatar: item.counterpart.avatar_url,
        created_at: item.created_at,
      }));
      setFriendRequests(mapped);
    } catch {
      // Quiet fail if not yet authenticated
    } finally {
      setIsLoadingRequests(false);
    }
  }, [isStudent]);

  const fetchFeed = useCallback(
    async (scope: "all" | "friends" | "recruiting" | "prodi", cursor?: string | null) => {
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
    },
    []
  );

  useEffect(() => {
    fetchFeed(activeTab, null);
  }, [activeTab, fetchFeed]);

  useEffect(() => {
    if (isStudent) {
      fetchFriendRequests();
    }
  }, [isStudent, fetchFriendRequests]);

  const handlePostCreated = (newPostApi: PostDetailApi) => {
    if (newPostApi.status === "tayang") {
      const viewModel = mapApiToViewModel(newPostApi);
      if (
        activeTab === "all" ||
        (activeTab === "recruiting" && newPostApi.tipe === "cari_anggota") ||
        (activeTab === "friends" && isStudent) ||
        (activeTab === "prodi" && isModerator)
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
    const post = posts.find((p) => p.id === postId);
    setTakedownModalPost({ id: postId, authorName: post?.author_name || "Pengguna" });
  };

  const handleReport = (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    setReportModalPost({ id: postId, authorName: post?.author_name || "Pengguna" });
  };

  const handleAcceptFriend = async (reqId: number) => {
    const prev = [...friendRequests];
    setFriendRequests((old) => old.filter((r) => r.id !== reqId));
    try {
      await apiClient.patch(`/friendships/${reqId}`, { status: "diterima" });
      toast.success("Permohonan koneksi diterima!");
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      if (activeTab === "friends") {
        fetchFeed("friends", null);
      }
    } catch (err: any) {
      setFriendRequests(prev);
      toast.error(err.response?.data?.detail || "Gagal menerima permohonan koneksi.");
    }
  };

  const handleRejectFriend = async (reqId: number) => {
    const prev = [...friendRequests];
    setFriendRequests((old) => old.filter((r) => r.id !== reqId));
    try {
      await apiClient.patch(`/friendships/${reqId}`, { status: "ditolak" });
      toast.info("Permohonan koneksi ditolak.");
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    } catch (err: any) {
      setFriendRequests(prev);
      toast.error(err.response?.data?.detail || "Gagal menolak permohonan koneksi.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Main Column */}
      <section className="lg:col-span-2 space-y-5">
        {/* Role-Adaptive Alert Banner for Moderator & Admin */}
        {summary && isStaff && (
          <DashboardReviewAlert summary={summary as ModeratorDashboardSummary | AdminDashboardSummary} />
        )}

        {/* Welcome Greeting Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white shadow-sm flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-secondary-container" />
              <span className="text-xs font-semibold text-secondary-container uppercase tracking-wider">
                {isModerator
                  ? "Panel Program Studi"
                  : isAdmin
                  ? "Pusat Administrator Kampus"
                  : "Beranda Kolaborasi Mahasiswa"}
              </span>
            </div>
            <h1 className="text-xl font-extrabold font-heading">
              Halo, {user?.nama || "Pengguna"}! 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-lg font-body">
              {isModerator
                ? "Pantau dan kelola kurasi karya ilmiah, portofolio SKPI mahasiswa, serta postingan prodi."
                : isAdmin
                ? "Kelola ekosistem karya, kepatuhan moderasi konten, dan pertumbuhan portofolio seluruh kampus."
                : "Temukan inovasi karya kampus, diskusikan proyek riset, dan temukan mitra kolaborasi terbaikmu."}
            </p>
          </div>
        </div>

        {/* Quick Post Card Widget (Allowed for all authenticated users) */}
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

          {/* Student Only: Teman Tab */}
          {isStudent && (
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "friends"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Teman</span>
            </button>
          )}

          {/* Moderator Only: Prodi Saya Tab */}
          {isModerator && (
            <button
              type="button"
              onClick={() => setActiveTab("prodi")}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "prodi"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Prodi Saya</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("recruiting")}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
              activeTab === "recruiting"
                ? "bg-recruiting-coral text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Rekrutmen Tim</span>
          </button>
        </div>

        {/* Post List or States */}
        {isLoading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-20 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm">
            <EmptyState
              title={
                activeTab === "friends"
                  ? "Belum Ada Postingan dari Teman"
                  : activeTab === "prodi"
                  ? "Belum Ada Postingan di Program Studi Anda"
                  : activeTab === "recruiting"
                  ? "Belum Ada Lowongan Rekrutmen Tim"
                  : "Belum Ada Postingan di Kampus"
              }
              description={
                activeTab === "friends"
                  ? "Tambahkan teman baru untuk melihat aktivitas karya dan riset rekan mahasiswa di kampusmu."
                  : activeTab === "prodi"
                  ? "Mahasiswa dari program studi Anda belum membagikan postingan publik."
                  : activeTab === "recruiting"
                  ? "Jadilah yang pertama membuka kesempatan rekrutmen tim untuk proyek kolaborasimu!"
                  : "Bagikan progres proyek, ide inovasi, atau diskusikan riset pertamamu hari ini."
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
        {/* STUDENT VIEW: Friend Requests, Mini AI Matchmaker, SKPI Summary */}
        {isStudent && (
          <>
            <FriendRequestWidget
              requests={friendRequests}
              onAccept={handleAcceptFriend}
              onReject={handleRejectFriend}
              isLoading={isLoadingRequests}
            />

            <MiniAiRecommendationWidget />

            {summary && summary.role === "mahasiswa" ? (
              <MySkpiSummaryWidget
                summary={summary as StudentDashboardSummary}
                isLoading={isSummaryLoading}
              />
            ) : null}
          </>
        )}

        {/* STAFF VIEW: Quick Actions & Navigation Shortcuts */}
        {isStaff && (
          <div className="p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
                Pintasan Staf & Verifikasi
              </h2>
            </div>
            <div className="space-y-2 pt-1 text-xs font-medium">
              <Link
                href="/moderation"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle hover:bg-slate-50 hover:text-primary transition-all group"
              >
                <span>Pusat Moderasi Konten & Laporan</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
              <Link
                href="/portfolio/review"
                className="flex items-center justify-between p-2.5 rounded-xl border border-border-subtle hover:bg-slate-50 hover:text-primary transition-all group"
              >
                <span>Tinjauan Portofolio & SKPI</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        )}

        {/* About CampusFolio Platform */}
        <div className="p-5 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3">
          <h2 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
            Tentang CampusFolio
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-body">
            Platform portofolio terintegrasi SKPI untuk mahasiswa dan program studi. Setiap karya dapat diverifikasi langsung oleh Kaprodi/Moderator.
          </p>
        </div>
      </aside>

      {/* M08 Feature Modals */}
      <ReportPostModal
        isOpen={Boolean(reportModalPost)}
        postId={reportModalPost?.id ?? null}
        postAuthorName={reportModalPost?.authorName}
        onClose={() => setReportModalPost(null)}
        onSuccess={() => {
          if (reportModalPost) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === reportModalPost.id ? { ...p, can_report: false } : p
              )
            );
          }
        }}
      />

      <TakedownPostModal
        isOpen={Boolean(takedownModalPost)}
        postId={takedownModalPost?.id ?? null}
        postAuthorName={takedownModalPost?.authorName}
        onClose={() => setTakedownModalPost(null)}
        onSuccess={(deletedId) => {
          setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        }}
      />
    </div>
  );
}
