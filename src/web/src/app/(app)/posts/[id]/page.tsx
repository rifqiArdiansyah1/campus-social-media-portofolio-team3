"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  XCircle,
  Loader2,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { PostCard, PostViewModel } from "@/components/features/PostCard";
import { ReportPostModal } from "@/components/features/ReportPostModal";
import { TakedownPostModal } from "@/components/features/TakedownPostModal";
import { EmptyState } from "@/components/common/EmptyState";
import {
  RecommendationCard,
} from "@/components/explore/RecommendationCard";
import {
  CollaborationModal,
} from "@/components/explore/CollaborationModal";
import {
  RecommendationItem,
  getRecommendationsForPost,
} from "@/services/recommendationService";

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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const postId = params?.id as string;

  const [post, setPost] = useState<PostViewModel | null>(null);
  const [rawPost, setRawPost] = useState<PostDetailApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modals state
  const [reportingPostId, setReportingPostId] = useState<number | null>(null);
  const [takedownPostId, setTakedownPostId] = useState<number | null>(null);

  // US-08: AI Recommendation state for recruitment post
  const [postRecs, setPostRecs] = useState<RecommendationItem[]>([]);
  const [isLoadingPostRecs, setIsLoadingPostRecs] = useState(false);
  const [isFallbackPostRecs, setIsFallbackPostRecs] = useState(false);
  const [selectedCollabCandidate, setSelectedCollabCandidate] = useState<RecommendationItem | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    try {
      setIsLoading(true);
      setNotFound(false);
      const res = await apiClient.get<PostDetailApi>(`/posts/${postId}`);
      const data = res.data;
      setRawPost(data);

      setPost({
        id: data.post_id,
        author_id: data.author.user_id,
        author_name: data.author.nama,
        author_jurusan: data.author.jurusan,
        author_avatar: null,
        konten: data.isi,
        media_url: data.gambar_url,
        created_at: data.created_at,
        tipe: data.tipe,
        status: data.status,
        skills: data.skills,
        moderation_note: data.moderation_note,
        is_owner: data.is_owner,
        can_takedown: data.can_takedown,
        can_report: data.can_report,
        can_delete: data.is_owner && !data.is_deleted,
        can_edit: data.can_edit,
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(err.response?.data?.detail || "Gagal memuat postingan.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // US-08: Fetch AI collaborator recommendations for recruiting post owner
  useEffect(() => {
    if (post && post.is_owner && post.tipe === "cari_anggota") {
      setIsLoadingPostRecs(true);
      getRecommendationsForPost(post.id)
        .then((res) => {
          setPostRecs(res.recommendations);
          setIsFallbackPostRecs(res.fallback);
        })
        .catch(() => {
          // Non-blocking for post page
        })
        .finally(() => {
          setIsLoadingPostRecs(false);
        });
    }
  }, [post]);

  const handleLike = () => {
    toast.info("Fitur apresiasi / suka akan hadir di pembaruan linimasa.");
  };

  const handleTakedown = (id: number) => {
    setTakedownPostId(id);
  };

  const handleReport = (id: number) => {
    setReportingPostId(id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus postingan ini secara permanen?")) {
      return;
    }
    try {
      await apiClient.delete(`/posts/${id}`);
      toast.success("Postingan berhasil dihapus.");
      router.push("/home");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menghapus postingan.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      {/* Back button */}
      <div>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-slate-500 font-medium">Memuat detail postingan...</p>
        </div>
      ) : notFound || !post ? (
        <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm">
          <EmptyState
            title="Postingan Tidak Ditemukan"
            description="Postingan ini mungkin telah dihapus oleh penulis, di-takedown oleh tim moderasi kampus, atau tidak tersedia untuk akun Anda."
            icon={FolderOpen}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Moderation Revision Notice for Post Author */}
          {post.is_owner && rawPost?.status === "revisi" && post.moderation_note && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <h3 className="text-sm font-bold font-heading">
                  Permintaan Revisi dari Tim Moderasi
                </h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-body">
                {post.moderation_note}
              </p>
            </div>
          )}

          {/* Moderation Rejection Notice for Post Author */}
          {post.is_owner && rawPost?.status === "ditolak" && post.moderation_note && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <h3 className="text-sm font-bold font-heading">
                  Postingan Ditolak
                </h3>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed font-body">
                {post.moderation_note}
              </p>
            </div>
          )}

          {/* Post Card */}
          <PostCard
            post={post}
            onLike={handleLike}
            onComment={() => toast.info("Fitur komentar akan diaktifkan pada modul interaksi.")}
            onTakedown={handleTakedown}
            onReport={handleReport}
            onDelete={handleDelete}
            onEdit={() => {
              toast.info(`Membuka mode perbaikan postingan #${post.id}.`);
            }}
          />

          {/* US-08: AI Candidates Recommendation for Recruitment Post Owner */}
          {post.is_owner && post.tipe === "cari_anggota" && (
            <section className="pt-6 border-t border-border-subtle space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Rekomendasi Kandidat Tim untuk Postingan Anda (US-08)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-body">
                Algoritma AI menganalisis deskripsi kebutuhan proyek dan tag keahlian postingan ini untuk mencocokkan mahasiswa yang paling relevan.
              </p>

              {isLoadingPostRecs ? (
                <div className="p-6 bg-white border border-border-subtle rounded-2xl flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Mencocokkan kandidat kolaborator...</span>
                </div>
              ) : postRecs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {postRecs.map((rec) => (
                    <RecommendationCard
                      key={rec.user_id}
                      item={rec}
                      isFallback={isFallbackPostRecs}
                      onCollaborationInvite={(c) => setSelectedCollabCandidate(c)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-body">
                  Belum ditemukan kandidat yang cocok dengan tag keahlian postingan saat ini.
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Collaboration Modal */}
      <CollaborationModal
        isOpen={selectedCollabCandidate !== null}
        candidate={selectedCollabCandidate}
        onClose={() => setSelectedCollabCandidate(null)}
      />

      {/* Report Modal */}
      <ReportPostModal
        isOpen={reportingPostId !== null}
        postId={reportingPostId}
        postAuthorName={post?.author_name}
        onClose={() => setReportingPostId(null)}
        onSuccess={() => {
          fetchPost();
        }}
      />

      {/* Takedown Modal */}
      <TakedownPostModal
        isOpen={takedownPostId !== null}
        postId={takedownPostId}
        onClose={() => setTakedownPostId(null)}
        onSuccess={() => {
          fetchPost();
        }}
      />
    </div>
  );
}
