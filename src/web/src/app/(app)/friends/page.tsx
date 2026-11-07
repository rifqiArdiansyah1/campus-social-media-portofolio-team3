"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  Clock,
  ShieldAlert,
  Search,
  ExternalLink,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface FriendUser {
  user_id: number;
  nama: string;
  jurusan: string | null;
  angkatan: number | null;
  role: string;
  avatar_url: string | null;
}

interface FriendshipItem {
  friendship_id: number;
  requester_id: number;
  addressee_id: number;
  status: string;
  created_at: string;
  counterpart: FriendUser;
}

interface BlockedUser {
  block_id: number;
  blocked_id: number;
  nama: string;
  jurusan: string | null;
  angkatan: number | null;
  alasan: string | null;
  created_at: string;
}

export default function FriendsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const initialTab = (searchParams.get("tab") as "friends" | "requests" | "outgoing" | "blocks") || "friends";
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "outgoing" | "blocks">(initialTab);

  // Data states
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendshipItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendshipItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Dialog states
  const [unfriendTarget, setUnfriendTarget] = useState<FriendUser | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlockedUser | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: "friends" | "requests" | "outgoing" | "blocks") => {
    setActiveTab(tab);
    router.replace(`/friends?tab=${tab}`, { scroll: false });
  };

  // Fetch functions
  const fetchFriends = useCallback(async (query: string = "") => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = { limit: 50 };
      if (query.trim()) {
        params.q = query.trim();
      }
      const res = await apiClient.get<{ items: FriendUser[] }>("/friends", { params });
      setFriends(res.data.items);
    } catch {
      toastRef.current.error("Gagal memuat daftar teman.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchIncoming = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<{ items: FriendshipItem[] }>("/friendships", {
        params: { direction: "incoming", limit: 50 },
      });
      setIncomingRequests(res.data.items);
    } catch {
      toastRef.current.error("Gagal memuat permohonan masuk.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOutgoing = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<{ items: FriendshipItem[] }>("/friendships", {
        params: { direction: "outgoing", limit: 50 },
      });
      setOutgoingRequests(res.data.items);
    } catch {
      toastRef.current.error("Gagal memuat permohonan keluar.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<{ items: BlockedUser[] }>("/blocks", {
        params: { limit: 50 },
      });
      setBlockedUsers(res.data.items);
    } catch {
      toastRef.current.error("Gagal memuat daftar blokir.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "friends") fetchFriends(searchQuery);
    else if (activeTab === "requests") fetchIncoming();
    else if (activeTab === "outgoing") fetchOutgoing();
    else if (activeTab === "blocks") fetchBlocks();
  }, [activeTab, fetchFriends, fetchIncoming, fetchOutgoing, fetchBlocks, searchQuery]);

  // Actions
  const handleAcceptRequest = async (fid: number) => {
    try {
      setActionLoadingId(fid);
      await apiClient.patch(`/friendships/${fid}`, { status: "diterima" });
      setIncomingRequests((prev) => prev.filter((item) => item.friendship_id !== fid));
      toast.success("Permohonan pertemanan diterima!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menerima permohonan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (fid: number) => {
    try {
      setActionLoadingId(fid);
      await apiClient.patch(`/friendships/${fid}`, { status: "ditolak" });
      setIncomingRequests((prev) => prev.filter((item) => item.friendship_id !== fid));
      toast.info("Permohonan pertemanan ditolak.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal menolak permohonan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelOutgoing = async (fid: number) => {
    try {
      setActionLoadingId(fid);
      await apiClient.delete(`/friendships/${fid}`);
      setOutgoingRequests((prev) => prev.filter((item) => item.friendship_id !== fid));
      toast.info("Permohonan pertemanan dibatalkan.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal membatalkan permohonan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmUnfriend = async () => {
    if (!unfriendTarget) return;
    try {
      // Find friendship_id by viewing user profile or direct unfriend
      const profRes = await apiClient.get<{ friendship_id: number | null }>(`/users/${unfriendTarget.user_id}`);
      if (profRes.data.friendship_id) {
        await apiClient.delete(`/friendships/${profRes.data.friendship_id}`);
        setFriends((prev) => prev.filter((u) => u.user_id !== unfriendTarget.user_id));
        toast.info(`Pertemanan dengan ${unfriendTarget.nama} telah diputus.`);
      }
      setUnfriendTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal memutuskan pertemanan.");
    }
  };

  const handleConfirmUnblock = async () => {
    if (!unblockTarget) return;
    try {
      await apiClient.delete(`/blocks/${unblockTarget.blocked_id}`);
      setBlockedUsers((prev) => prev.filter((u) => u.blocked_id !== unblockTarget.blocked_id));
      toast.success(`Blokir terhadap ${unblockTarget.nama} telah dibuka.`);
      setUnblockTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Gagal membuka blokir.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
          <Users className="w-4 h-4" />
          <span>Jejaring Kampus & Privasi</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
          Jejaring Pertemanan Mahasiswa
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-body">
          Kelola hubungan pertemanan sesama mahasiswa, tinjau permohonan koneksi masuk, dan atur akun yang diblokir demi kenyamanan bersama.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div
        role="tablist"
        aria-label="Navigasi Manajemen Pertemanan"
        className="flex items-center gap-2 border-b border-border-subtle pb-1 overflow-x-auto"
      >
        <button
          role="tab"
          id="tab-friends"
          aria-selected={activeTab === "friends"}
          aria-controls="panel-friends"
          onClick={() => handleTabChange("friends")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all flex-shrink-0 ${
            activeTab === "friends"
              ? "bg-primary text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Teman Saya</span>
        </button>

        <button
          role="tab"
          id="tab-requests"
          aria-selected={activeTab === "requests"}
          aria-controls="panel-requests"
          onClick={() => handleTabChange("requests")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all flex-shrink-0 ${
            activeTab === "requests"
              ? "bg-primary text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Permohonan Masuk</span>
          {incomingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-primary">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          role="tab"
          id="tab-outgoing"
          aria-selected={activeTab === "outgoing"}
          aria-controls="panel-outgoing"
          onClick={() => handleTabChange("outgoing")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all flex-shrink-0 ${
            activeTab === "outgoing"
              ? "bg-primary text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Permintaan Terkirim</span>
        </button>

        <button
          role="tab"
          id="tab-blocks"
          aria-selected={activeTab === "blocks"}
          aria-controls="panel-blocks"
          onClick={() => handleTabChange("blocks")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all flex-shrink-0 ${
            activeTab === "blocks"
              ? "bg-primary text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Daftar Blokir</span>
        </button>
      </div>

      {/* TAB 1: TEMAN SAYA */}
      {activeTab === "friends" && (
        <section id="panel-friends" role="tabpanel" aria-labelledby="tab-friends" className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari teman berdasarkan nama atau program studi..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-subtle rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm">
              <EmptyState
                title={searchQuery ? "Teman Tidak Ditemukan" : "Belum Ada Teman Terhubung"}
                description={
                  searchQuery
                    ? `Tidak ditemukan teman yang cocok dengan kata kunci "${searchQuery}".`
                    : "Anda belum memiliki koneksi pertemanan aktif. Temukan rekan mahasiswa melalui Beranda atau Jelajah dan kirim permohonan berteman."
                }
                icon={Users}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.user_id}
                  className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-primary font-bold text-base flex items-center justify-center flex-shrink-0">
                      {getInitials(friend.nama)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate font-heading">
                        {friend.nama}
                      </h3>
                      {friend.jurusan && (
                        <p className="text-xs text-slate-500 truncate">{friend.jurusan}</p>
                      )}
                      {friend.angkatan && (
                        <p className="text-[11px] text-slate-400">Angkatan {friend.angkatan}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                    <Link
                      href={`/profile/${friend.user_id}`}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                    >
                      <span>Profil</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setUnfriendTarget(friend)}
                      className="p-1.5 rounded-xl border border-border-subtle text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Putus Pertemanan"
                      aria-label="Putus Pertemanan"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: PERMOHONAN MASUK */}
      {activeTab === "requests" && (
        <section id="panel-requests" role="tabpanel" aria-labelledby="tab-requests" className="space-y-4">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm">
              <EmptyState
                title="Tidak Ada Permohonan Masuk"
                description="Saat ini tidak ada mahasiswa lain yang sedang menunggu konfirmasi pertemanan dari Anda."
                icon={FolderOpen}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div
                  key={req.friendship_id}
                  className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {getInitials(req.counterpart.nama)}
                    </div>
                    <div>
                      <Link
                        href={`/profile/${req.counterpart.user_id}`}
                        className="text-xs font-bold text-slate-900 font-heading hover:underline block"
                      >
                        {req.counterpart.nama}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {req.counterpart.jurusan || "Mahasiswa"}
                        {req.counterpart.angkatan && ` • Angkatan ${req.counterpart.angkatan}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.friendship_id)}
                      disabled={actionLoadingId === req.friendship_id}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {actionLoadingId === req.friendship_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Terima</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(req.friendship_id)}
                      disabled={actionLoadingId === req.friendship_id}
                      className="px-3 py-1.5 rounded-xl border border-border-subtle text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PERMINTAAN TERKIRIM */}
      {activeTab === "outgoing" && (
        <section id="panel-outgoing" role="tabpanel" aria-labelledby="tab-outgoing" className="space-y-4">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : outgoingRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm">
              <EmptyState
                title="Tidak Ada Permintaan Terkirim"
                description="Anda belum memiliki permohonan pertemanan keluar yang sedang menunggu respon."
                icon={FolderOpen}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((req) => (
                <div
                  key={req.friendship_id}
                  className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {getInitials(req.counterpart.nama)}
                    </div>
                    <div>
                      <Link
                        href={`/profile/${req.counterpart.user_id}`}
                        className="text-xs font-bold text-slate-900 font-heading hover:underline block"
                      >
                        {req.counterpart.nama}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {req.counterpart.jurusan || "Mahasiswa"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Menunggu Respon</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancelOutgoing(req.friendship_id)}
                      disabled={actionLoadingId === req.friendship_id}
                      className="px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === req.friendship_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Batalkan"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: DAFTAR BLOKIR */}
      {activeTab === "blocks" && (
        <section id="panel-blocks" role="tabpanel" aria-labelledby="tab-blocks" className="space-y-4">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-border-subtle shadow-sm">
              <EmptyState
                title="Daftar Blokir Kosong"
                description="Anda tidak sedang memblokir akun pengguna mana pun."
                icon={ShieldAlert}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((item) => (
                <div
                  key={item.block_id}
                  className="p-4 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {getInitials(item.nama)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 font-heading">
                        {item.nama}
                      </h3>
                      {item.jurusan && (
                        <p className="text-[11px] text-slate-500">{item.jurusan}</p>
                      )}
                      {item.alasan && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          Alasan: {item.alasan}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUnblockTarget(item)}
                    className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
                  >
                    Buka Blokir
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Dialog Unfriend */}
      <ConfirmDialog
        isOpen={Boolean(unfriendTarget)}
        onClose={() => setUnfriendTarget(null)}
        onConfirm={handleConfirmUnfriend}
        title="Putus Pertemanan?"
        description={`Apakah Anda yakin ingin memutuskan hubungan pertemanan dengan ${unfriendTarget?.nama}? Anda dapat mengajukan pertemanan kembali sewaktu-waktu.`}
        confirmText="Putus Pertemanan"
        variant="danger"
      />

      {/* Dialog Unblock */}
      <ConfirmDialog
        isOpen={Boolean(unblockTarget)}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleConfirmUnblock}
        title="Buka Blokir Pengguna?"
        description={`Buka blokir untuk ${unblockTarget?.nama}? Catatan: Membuka blokir tidak memulihkan pertemanan secara otomatis.`}
        confirmText="Buka Blokir"
        variant="primary"
      />
    </div>
  );
}
