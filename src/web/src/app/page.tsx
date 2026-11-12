"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Sparkles,
  ShieldCheck,
  Search,
  ArrowRight,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Compass,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="min-h-screen bg-surface-canvas text-slate-800">
      {/* Navbar */}
      <nav className="border-b border-border-subtle bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
              CampusFolio
            </span>
            <span className="text-[10px] bg-indigo-50 text-primary border border-indigo-200 font-semibold px-2 py-0.5 rounded-full ml-1">
              Team 3
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/demo" className="text-slate-600 hover:text-primary transition flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              <span>UI Galeri Demo</span>
            </Link>

            {isAuthenticated ? (
              <Link
                href="/home"
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition shadow-sm font-semibold flex items-center gap-1.5 text-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard ({user?.nama?.split(" ")[0] || "Akun"})</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-primary transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition shadow-sm font-semibold text-xs"
                >
                  Daftar Akun
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-primary text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Rekomendasi Kolaborator Mahasiswa Berbasis AI NLP
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6 font-heading">
          Temukan Teman Se-Universitas dengan Skill yang{" "}
          <span className="text-primary underline decoration-indigo-300">Melengkapi</span> Proyek Anda
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed font-body">
          Platform media sosial dan portofolio terpadu mahasiswa untuk pamer karya, verifikasi SKPI prodi, mencari rekan tim lomba/tugas, dan berinteraksi secara aman.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {isAuthenticated ? (
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/home"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                Masuk ke Linimasa Kampus <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="bg-white hover:bg-slate-50 border border-border-subtle text-slate-700 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-primary" />
                Jelajah & Rekomendasi AI
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/login"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                Masuk Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/explore"
                className="bg-white hover:bg-slate-50 border border-border-subtle text-slate-700 px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-primary" />
                Jelajah Kolaborator
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-16 bg-white border-y border-border-subtle">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 font-heading">
              Pilar Utama CampusFolio
            </h2>
            <p className="text-slate-600 font-body text-sm">
              Dirancang khusus menjawab permasalahan nyata kolaborasi mahasiswa kampus
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-border-subtle bg-surface-canvas hover:border-primary/40 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-primary flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2 font-heading">
                Profil & Portofolio SKPI
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                Tampilkan karya, tugas akhir, dan sertifikat yang langsung diaudit oleh Kaprodi untuk poin SKPI resmi.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border-subtle bg-surface-canvas hover:border-primary/40 transition">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-secondary flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2 font-heading">
                Rekomendasi Cerdas AI
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                Pencarian semantik pgvector mencocokkan ide proyek Anda dengan mahasiswa lain yang memiliki skill komplementer.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border-subtle bg-surface-canvas hover:border-primary/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-accent-emerald-accessible flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2 font-heading">
                Moderasi Beretika Akademik
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-body">
                Filter otomatis dan sistem pelaporan berbasis RBAC menjaga linimasa kampus tetap produktif dan aman.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
