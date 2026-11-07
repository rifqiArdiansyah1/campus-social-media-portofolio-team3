"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  GraduationCap,
  Calendar,
  Award,
  Heart,
  Globe,
  Edit3,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Check,
  Clock,
  ShieldAlert,
  Ban,
  FolderOpen,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface UserSkillData {
  skill_id: number;
  nama: string;
  tipe: "skill" | "minat";
  level: "pemula" | "menengah" | "mahir";
}

interface PublicProfileData {
  user_id: number;
  nama: string;
  jurusan: string | null;
  angkatan: number | null;
  bio: string | null;
  kontak_url: string | null;
  role: string;
  created_at: string;
  skills: UserSkillData[];
  friendship_status: "none" | "pending_sent" | "pending_received" | "friends";
  friendship_id?: number | null;
  friendship_direction?: "incoming" | "outgoing" | null;
  blocked_by_me: boolean;
  nim: string | null;
  email: string | null;
  is_visible: boolean;
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"portfolio" | "skpi">("portfolio");

  // Interaction Dialogs & States
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);

  const rawId = params?.id;
  const isMeParam = !rawId || rawId === "me";

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsNotFound(false);

      let targetId: number | string;

      if (isMeParam) {
        const meRes = await apiClient.get<{ user_id: number }>("/users/me");
        targetId = meRes.data.user_id;
      } else {
        targetId = rawId as string;
      }

      const res = await apiClient.get<PublicProfileData>(`/users/${targetId}`);
      setProfile(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        toastRef.current.error(err.response?.data?.detail || "Gagal memuat profil pengguna");
      }
    } finally {
      setIsLoading(false);
    }
  }, [rawId, isMeParam]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isOwner = Boolean(
    currentUser && profile && (currentUser.id === profile.user_id || isMeParam)
  );

  const skillsList = profile?.skills?.filter((s) => s.tipe === "skill") || [];
  const minatsList = profile?.skills?.filter((s) => s.tipe === "minat") || [];

  // 1. Send Friend Request (US-13)
  const handleSendFriendRequest = async () => {
    if (!profile) return;
    try {
      setIsFriendActionLoading(true);
      const res = await apiClient.post<{ friendship_id: number }>("/friendships", {
        addressee_id: profile.user_id,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendship_status: "pending_sent",
              friendship_id: res.data.friendship_id,
              friendship_direction: "outgoing",
            }
          : null
      );
      toast.success("Permohonan pertemanan berhasil dikirim!");
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === "INCOMING_REQUEST_EXISTS") {
        const fid = err.response?.data?.friendship_id;
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                friendship_status: "pending_received",
                friendship_id: fid,
                friendship_direction: "incoming",
              }
            : null
        );
        toast.info("Pengguna ini telah mengirim permohonan terlebih dahulu. Anda dapat langsung menerimanya.");
      } else {
        toast.error(err.response?.data?.detail || "Gagal mengirim permohonan pertemanan.");
      }
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // 2. Cancel Pending Request (US-13 / FR-06)
  const handleCancelFriendRequest = async () => {
    if (!profile?.friendship_id) return;
    try {
      setIsFriendActionLoading(true);
      await apiClient.delete(`/friendships/${profile.friendship_id}`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendship_status: "none",
              friendship_id: null,
              friendship_direction: null,
            }
          : null
      );
      toast.info("Permohonan pertemanan dibatalkan.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal membatalkan permohonan.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // 3. Accept Incoming Friend Request (US-13)
  const handleAcceptFriendRequest = async () => {
    if (!profile?.friendship_id) return;
    try {
      setIsFriendActionLoading(true);
      await apiClient.patch(`/friendships/${profile.friendship_id}`, { status: "diterima" });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendship_status: "friends",
            }
          : null
      );
      toast.success("Permohonan pertemanan diterima!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menerima permohonan pertemanan.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // 4. Reject Incoming Friend Request (US-13)
  const handleRejectFriendRequest = async () => {
    if (!profile?.friendship_id) return;
    try {
      setIsFriendActionLoading(true);
      await apiClient.patch(`/friendships/${profile.friendship_id}`, { status: "ditolak" });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendship_status: "none",
              friendship_id: null,
              friendship_direction: null,
            }
          : null
      );
      toast.info("Permohonan pertemanan ditolak.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menolak permohonan pertemanan.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // 5. Unfriend (US-13 / FR-06)
  const handleUnfriend = async () => {
    if (!profile?.friendship_id) return;
    try {
      setIsFriendActionLoading(true);
      await apiClient.delete(`/friendships/${profile.friendship_id}`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              friendship_status: "none",
              friendship_id: null,
              friendship_direction: null,
            }
          : null
      );
      setUnfriendDialogOpen(false);
      toast.info(`Pertemanan dengan ${profile.nama} telah diputus.`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal memutuskan pertemanan.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  // 6. Block User (US-14 / FR-07)
  const handleBlockUser = async () => {
    if (!profile) return;
    try {
      await apiClient.post("/blocks", { blocked_id: profile.user_id });
      setBlockDialogOpen(false);
      toast.warning(`Anda telah memblokir ${profile.nama}.`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              blocked_by_me: true,
              friendship_status: "none",
              friendship_id: null,
              friendship_direction: null,
              skills: [],
              bio: null,
              kontak_url: null,
            }
          : null
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal memblokir pengguna.");
    }
  };

  // 7. Unblock User (US-14)
  const handleUnblockUser = async () => {
    if (!profile) return;
    try {
      await apiClient.delete(`/blocks/${profile.user_id}`);
      setUnblockDialogOpen(false);
      toast.success(`Blokir terhadap ${profile.nama} telah dibuka.`);
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal membuka blokir pengguna.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-white rounded-2xl border border-slate-200 p-6 flex gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-slate-200 rounded"></div>
            <div className="h-4 w-60 bg-slate-100 rounded"></div>
            <div className="h-4 w-48 bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isNotFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <EmptyState
          title="Profil Pengguna Tidak Ditemukan"
          description="Pengguna ini mungkin tidak terdaftar atau profil tidak dapat diakses."
          icon={FolderOpen}
          actionText="Kembali ke Beranda"
          onAction={() => router.push("/home")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Blocked by Me Notification Banner */}
      {profile.blocked_by_me && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Anda telah memblokir pengguna ini. Data detail dan aktivitas portofolio disembunyikan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUnblockDialogOpen(true)}
            className="text-xs font-semibold px-3 py-1 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
          >
            Buka Blokir
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar Circle with Initial */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-primary font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
              {getInitials(profile.nama)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  {profile.nama}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-primary border border-indigo-200 uppercase tracking-wide">
                  {profile.role}
                </span>
              </div>

              {/* Jurusan & Angkatan */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                {profile.jurusan && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    <span>{profile.jurusan}</span>
                  </div>
                )}
                {profile.angkatan && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Angkatan {profile.angkatan}</span>
                  </div>
                )}
              </div>

              {/* Sensitive Academic Details (Only visible if permitted) */}
              {(profile.nim || profile.email) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  {profile.nim && (
                    <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      NIM: {profile.nim}
                    </span>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {isOwner ? (
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profil</span>
              </Link>
            ) : (
              <>
                {/* 1. Friends State */}
                {profile.friendship_status === "friends" ? (
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>Berteman</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUnfriendDialogOpen(true)}
                      disabled={isFriendActionLoading}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-border-subtle"
                      title="Hapus Pertemanan"
                      aria-label="Hapus Pertemanan"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ) : profile.friendship_status === "pending_sent" ? (
                  /* 2. Pending Sent State */
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Permintaan Terkirim</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelFriendRequest}
                      disabled={isFriendActionLoading}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-border-subtle"
                      title="Batalkan Permintaan"
                    >
                      {isFriendActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Batal"}
                    </button>
                  </div>
                ) : profile.friendship_status === "pending_received" ? (
                  /* 3. Pending Received State */
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAcceptFriendRequest}
                      disabled={isFriendActionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isFriendActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>Terima</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectFriendRequest}
                      disabled={isFriendActionLoading}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-border-subtle disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                ) : (
                  /* 4. None State (Can Add Friend) */
                  <button
                    type="button"
                    onClick={handleSendFriendRequest}
                    disabled={isFriendActionLoading || profile.blocked_by_me}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isFriendActionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Tambah Teman</span>
                  </button>
                )}

                {/* Block / Safety Action */}
                {!profile.blocked_by_me && profile.role === "mahasiswa" && (
                  <button
                    type="button"
                    onClick={() => setBlockDialogOpen(true)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Blokir pengguna"
                    aria-label="Blokir pengguna"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="pt-4 border-t border-border-subtle">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tentang Saya
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-body whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* External Contact URL */}
        {profile.kontak_url && (
          <div className="pt-3 border-t border-border-subtle">
            <a
              href={profile.kontak_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{profile.kontak_url}</span>
            </a>
          </div>
        )}
      </div>

      {/* Keahlian & Minat Showcase Card */}
      {!profile.blocked_by_me && (
        <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-heading">
            Kompetensi & Minat Karir
          </h2>

          <div className="space-y-4">
            {/* Keahlian Teknis */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Keahlian Utama ({skillsList.length})</span>
              </div>
              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill) => (
                    <span
                      key={skill.skill_id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50/60 text-xs font-medium text-slate-800 shadow-sm"
                    >
                      <span>{skill.nama}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                          skill.level === "mahir"
                            ? "bg-emerald-100 text-emerald-800"
                            : skill.level === "menengah"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {skill.level}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada keahlian terdaftar</p>
              )}
            </div>

            {/* Minat Karir */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Minat & Eksplorasi ({minatsList.length})</span>
              </div>
              {minatsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {minatsList.map((minat) => (
                    <span
                      key={minat.skill_id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50/60 text-xs font-medium text-slate-800 shadow-sm"
                    >
                      <span>{minat.nama}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800">
                        {minat.level}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada minat terdaftar</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Showcase (Portofolio & SKPI) */}
      {!profile.blocked_by_me && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("portfolio")}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "portfolio"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Karya & Portofolio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("skpi")}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === "skpi"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Rekapitulasi SKPI</span>
            </button>
          </div>

          {activeTab === "portfolio" && (
            <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm">
              <EmptyState
                title={
                  isOwner
                    ? "Anda Belum Mengunggah Portofolio"
                    : "Belum Ada Karya Portofolio Terpublikasi"
                }
                description={
                  isOwner
                    ? "Anda belum mempublikasikan karya portofolio. Modul unggah portofolio (M07) akan segera hadir untuk memfasilitasi karya terbaik Anda."
                    : "Mahasiswa ini belum mempublikasikan karya portofolio. Karya inovatif dan portofolio proyek akan tampil setelah dipublikasikan."
                }
                icon={FolderOpen}
              />
            </div>
          )}

          {activeTab === "skpi" && (
            <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm">
              <EmptyState
                title={
                  isOwner
                    ? "Rekapitulasi SKPI Anda"
                    : "Rekapitulasi SKPI Resmi"
                }
                description={
                  isOwner
                    ? "Klaim sertifikat kompetensi dan aktivitas pendukung SKPI Anda akan dapat dikelola dan diajukan ke Kaprodi pada modul M08."
                    : "Daftar sertifikat keahlian, prestasi kompetisi, dan verifikasi SKPI resmi oleh Kaprodi akan disajikan pada modul M08."
                }
                icon={FileCheck2}
              />
            </div>
          )}
        </div>
      )}

      {/* Block Dialog */}
      <ConfirmDialog
        isOpen={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onConfirm={handleBlockUser}
        title="Blokir Pengguna Ini?"
        description={`Apakah Anda yakin ingin memblokir ${profile.nama}? Pengguna ini tidak akan dapat melihat postingan, profil, atau mengirim permohonan kepada Anda. Hubungan pertemanan aktif juga akan diputus secara otomatis.`}
        confirmText="Blokir"
        variant="danger"
      />

      {/* Unblock Dialog */}
      <ConfirmDialog
        isOpen={unblockDialogOpen}
        onClose={() => setUnblockDialogOpen(false)}
        onConfirm={handleUnblockUser}
        title="Buka Blokir Pengguna?"
        description={`Apakah Anda yakin ingin membuka blokir untuk ${profile.nama}? Catatan: Membuka blokir tidak memulihkan pertemanan secara otomatis. Anda dapat mengirimkan permohonan pertemanan kembali setelah blokir dibuka.`}
        confirmText="Buka Blokir"
        variant="primary"
      />

      {/* Unfriend Dialog */}
      <ConfirmDialog
        isOpen={unfriendDialogOpen}
        onClose={() => setUnfriendDialogOpen(false)}
        onConfirm={handleUnfriend}
        title="Putus Pertemanan?"
        description={`Apakah Anda yakin ingin memutuskan hubungan pertemanan dengan ${profile.nama}? Anda dapat mengajukan pertemanan kembali sewaktu-waktu.`}
        confirmText="Putus Pertemanan"
        variant="danger"
      />
    </div>
  );
}
