"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCheck, UserX, Users } from "lucide-react";

export interface FriendRequestItem {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_jurusan?: string | null;
  sender_avatar?: string | null;
  created_at: string;
}

export interface FriendRequestWidgetProps {
  requests: FriendRequestItem[];
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
  isLoading?: boolean;
}

export function FriendRequestWidget({
  requests,
  onAccept,
  onReject,
  isLoading = false,
}: FriendRequestWidgetProps) {
  if (requests.length === 0) {
    return (
      <div className="p-4 rounded-2xl border border-border-subtle bg-white text-center">
        <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Tidak ada permohonan koneksi pertemanan baru.</p>
        <Link
          href="/friends"
          className="inline-block mt-2 text-[11px] font-semibold text-primary hover:underline"
        >
          Kelola Daftar Teman &rarr;
        </Link>
      </div>
    );
  }

  return (
    <aside
      aria-label="Permohonan Pertemanan"
      className="p-4 rounded-2xl border border-border-subtle bg-white shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider">
          Permohonan Koneksi ({requests.length})
        </h3>
        <Link
          href="/friends?tab=requests"
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            data-testid={`friend-request-${req.id}`}
            className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary text-xs flex-shrink-0 overflow-hidden relative border border-border-subtle">
                {req.sender_avatar ? (
                  <Image
                    src={req.sender_avatar}
                    alt={req.sender_name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <span>{req.sender_name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/profile/${req.sender_id}`}
                  className="text-xs font-bold text-slate-900 truncate font-heading hover:underline block"
                >
                  {req.sender_name}
                </Link>
                {req.sender_jurusan && (
                  <p className="text-[11px] text-slate-500 truncate font-body">
                    {req.sender_jurusan}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onAccept(req.id)}
                disabled={isLoading}
                className="p-1.5 rounded-lg bg-emerald-50 text-accent-emerald-accessible hover:bg-emerald-100 transition-colors disabled:opacity-50"
                aria-label={`Terima pertemanan dari ${req.sender_name}`}
                title="Terima"
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onReject(req.id)}
                disabled={isLoading}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                aria-label={`Tolak pertemanan dari ${req.sender_name}`}
                title="Tolak"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
