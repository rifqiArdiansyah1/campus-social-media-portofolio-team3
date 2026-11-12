"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  FileCheck,
  Users,
  Check,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface NotificationItem {
  notification_id: number;
  user_id: number;
  jenis: string;
  judul: string;
  isi: string;
  tautan?: string | null;
  ref_type?: string | null;
  ref_id?: number | null;
  is_read: boolean;
  created_at: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Baru saja";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function getNotificationIcon(jenis: string) {
  switch (jenis) {
    case "moderasi_disetujui":
    case "skpi_terverifikasi":
    case "pertemanan_diterima":
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-50 text-emerald-600",
      };
    case "moderasi_revisi":
      return {
        icon: AlertCircle,
        bg: "bg-amber-50 text-amber-600",
      };
    case "moderasi_ditolak":
    case "moderasi_takedown":
    case "skpi_ditolak":
      return {
        icon: ShieldAlert,
        bg: "bg-rose-50 text-rose-600",
      };
    case "laporan_selesai":
    case "laporan_diabaikan":
      return {
        icon: FileCheck,
        bg: "bg-sky-50 text-sky-600",
      };
    case "pertemanan_baru":
      return {
        icon: Users,
        bg: "bg-indigo-50 text-indigo-600",
      };
    default:
      return {
        icon: Bell,
        bg: "bg-slate-50 text-slate-600",
      };
  }
}

export interface NotificationDropdownProps {
  skipPolling?: boolean;
}

export function NotificationDropdown({ skipPolling = false }: NotificationDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient.get<{ unread_count: number }>(
        "/notifications/unread-count"
      );
      setUnreadCount(res.data.unread_count ?? 0);
    } catch {
      // Quiet ignore on polling errors
    }
  }, [user]);

  // Fetch notification list when opened
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get<NotificationItem[]>("/notifications", {
        params: { limit: 20 },
      });
      setNotifications(res.data ?? []);
    } catch {
      // Quiet ignore
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch & Polling every 45s (paused if tab is hidden or skipPolling enabled)
  useEffect(() => {
    fetchUnreadCount();

    if (skipPolling) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadCount, skipPolling]);

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Load list when opening
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark single as read & navigate
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      try {
        await apiClient.patch(`/notifications/${item.notification_id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === item.notification_id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Continue navigation even if read sync fails
      }
    }

    setIsOpen(false);

    if (item.tautan && item.tautan.startsWith("/")) {
      router.push(item.tautan);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Quiet ignore
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} notifikasi belum dibaca`
            : "Notifikasi"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-rose-500 rounded-full border-2 border-white shadow-sm"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="region"
          aria-label="Panel notifikasi"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-border-subtle z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between bg-surface-canvas/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-heading">
                Notifikasi
              </h2>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border-subtle">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-medium">Memuat notifikasi...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Belum ada notifikasi baru untuk Anda.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const { icon: IconComp, bg } = getNotificationIcon(item.jenis);
                return (
                  <div
                    key={item.notification_id}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleItemClick(item);
                      }
                    }}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-slate-50 focus:outline-none focus:bg-slate-50 ${
                      !item.is_read ? "bg-primary/5" : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            !item.is_read
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {item.judul}
                        </p>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.isi}
                      </p>
                    </div>

                    {!item.is_read && (
                      <span
                        className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5"
                        title="Belum dibaca"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
