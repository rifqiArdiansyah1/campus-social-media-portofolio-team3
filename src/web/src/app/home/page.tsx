"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getStoredUser,
  isAuthenticated,
  UserProfile,
} from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    const current = getStoredUser();
    setUser(current);
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat profil mahasiswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm shadow-brand-700/20">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
              CampusFolio
            </span>
            <span className="text-[10px] font-semibold text-brand-700 tracking-wider uppercase block">
              Beranda Kolaborasi Mahasiswa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900">{user.nama}</span>
            <span className="text-[10px] text-slate-500">{user.role} • {user.jurusan || "Umum"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-r from-brand-700 via-indigo-700 to-brand-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-700/10 mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium mb-3">
              <span className="material-symbols-outlined text-[15px] text-emerald-300">verified</span>
              <span>Sesi Terautentikasi Aktif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              Selamat Datang Kembali, {user.nama.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-brand-100 mt-2 leading-relaxed">
              Platform portofolio dan rekomendasi rekan kolaborasi AI telah siap. Bagikan karya akademikmu,
              temukan partner proyek lintas prodi, dan kumpulkan poin SKPI.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-white text-brand-800 text-xs font-bold hover:bg-brand-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">explore</span>
                <span>Jelajahi Showcase</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-700 text-[20px]">badge</span>
            <span>Ringkasan Akun Mahasiswa</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Nama Lengkap</span>
              <span className="font-semibold text-slate-800 text-sm">{user.nama}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Email Kampus Resmi</span>
              <span className="font-semibold text-slate-800 text-sm">{user.email}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Nomor Induk Mahasiswa (NIM)</span>
              <span className="font-semibold text-slate-800 text-sm font-mono">{user.nim || "-"}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Program Studi / Angkatan</span>
              <span className="font-semibold text-slate-800 text-sm">
                {user.jurusan || "-"} {user.angkatan ? `(Angkatan ${user.angkatan})` : ""}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
