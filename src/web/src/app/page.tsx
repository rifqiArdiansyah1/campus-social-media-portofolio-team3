"use client";

import React, { useState } from "react";
import { Users, Sparkles, ShieldCheck, Search, Code, Palette, Briefcase, ExternalLink, ArrowRight } from "lucide-react";

export default function Home() {
  const [targetSkill, setTargetSkill] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sampleStudents = [
    {
      id: "u_01",
      name: "Moh. Rifqi Dwi Ardiansyah",
      role: "Hacker / Backend Engineer",
      dept: "Teknik Informatika",
      skills: ["FastAPI", "Python", "PostgreSQL", "Git", "AI/ML"],
      match: 95,
      reason: "Memiliki keahlian backend & database yang siap mengintegrasikan API proyek Anda."
    },
    {
      id: "u_02",
      name: "Hakim",
      role: "Hipster / UI/UX & Mobile",
      dept: "Sistem Informasi",
      skills: ["React", "Next.js", "Expo", "Figma", "UI/UX"],
      match: 92,
      reason: "Mampu merancang antarmuka intuitif dan mengembangkan aplikasi web/mobile responsif."
    },
    {
      id: "u_03",
      name: "Ramadhan (Rama)",
      role: "Hustler / Product Lead",
      dept: "Manajemen Bisnis",
      skills: ["Product Strategy", "Market Research", "Business Plan", "Pitching"],
      match: 88,
      reason: "Berpengalaman dalam validasi problem-solution fit dan strategi kompetisi inovasi."
    }
  ];

  const handleSimulateMatch = () => {
    setLoading(true);
    setTimeout(() => {
      setRecommendations(sampleStudents);
      setLoading(false);
    }, 400);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">CampusFolio</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full ml-2">Team 3</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="#fitur" className="text-slate-600 hover:text-indigo-600 transition">Fitur</a>
            <a href="#ai-demo" className="text-slate-600 hover:text-indigo-600 transition">Uji Coba AI</a>
            <a href="#tim" className="text-slate-600 hover:text-indigo-600 transition">Tim Kami</a>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-semibold">
              Masuk / Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Rekomendasi Kolaborator Mahasiswa Berbasis AI NLP
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Temukan Teman Se-Universitas dengan Skill yang <span className="text-indigo-600 underline decoration-indigo-300">Melengkapi</span> Proyek Anda
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Platform media sosial dan portofolio terpadu mahasiswa untuk pamer karya, mencari rekan tim lomba/tugas, dan berinteraksi secara aman.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="#ai-demo" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2">
            Coba Rekomendasi AI <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#fitur" className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold transition">
            Pelajari Fitur
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Pilar Utama CampusFolio</h2>
            <p className="text-slate-600">Dirancang khusus menjawab permasalahan nyata mahasiswa kampus</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-200 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Profil & Portofolio Terpusat</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tampilkan rekam jejak tugas, karya lomba, dan keahlian nyata Anda dalam satu wadah profil resmi kampus.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-200 transition">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Rekomendasi Cerdas (AI-1)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Algoritma TF-IDF & Text Embedding mencocokkan kebutuhan proyek Anda dengan kandidat mahasiswa yang memiliki skill pelengkap.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-indigo-200 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Moderasi Konten Aman (AI-2)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Penyaringan otomatis atas ujaran kasar dan spam dengan keputusan akhir tetap di tangan moderator manusia (*Human-in-the-Loop*).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section id="ai-demo" className="py-20 max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-100">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Uji Coba Algoritma Pencocokan Rekan (AI-1)</h3>
              <p className="text-sm text-slate-500">Mencari rekan proyek berdasarkan keahlian komplementer</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <label className="block text-sm font-semibold text-slate-700">Keahlian yang Sedang Anda Butuhkan untuk Tim:</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: Flutter, UI/UX, Python, Market Research..."
                  value={targetSkill}
                  onChange={(e) => setTargetSkill(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button
                onClick={handleSimulateMatch}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Menganalisis..." : "Cari Kecocokan"}
              </button>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-4 pt-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Hasil Rekomendasi Teratas:</h4>
              <div className="grid gap-3">
                {recommendations.map((cand) => (
                  <div key={cand.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cand.name}</span>
                        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">{cand.dept}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{cand.role}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cand.skills.map((s: string) => (
                          <span key={s} className="text-xs bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-indigo-800 bg-indigo-50/80 p-2 rounded-lg mt-2 border border-indigo-100">
                        💡 <strong>Alasan AI:</strong> {cand.reason}
                      </p>
                    </div>
                    <div className="text-right flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0">
                      <span className="text-2xl font-black text-indigo-600">{cand.match}%</span>
                      <span className="text-[11px] text-slate-400 font-semibold">Skor Relevansi</span>
                      <button className="mt-2 text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold transition">
                        Lihat Profil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section id="tim" className="py-16 bg-slate-100 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Tim Pengembang (Team 3)</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mx-auto mb-4">
                <Code className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Moh. Rifqi Dwi Ardiansyah</h4>
              <p className="text-xs font-semibold text-blue-600 mb-2">HACKER (Tech Lead & Backend)</p>
              <p className="text-xs text-slate-500">FastAPI, PostgreSQL Supabase, dan Pipeline NLP Rekomendasi.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xl mx-auto mb-4">
                <Palette className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Hakim</h4>
              <p className="text-xs font-semibold text-purple-600 mb-2">HIPSTER (UI/UX & Frontend)</p>
              <p className="text-xs text-slate-500">Next.js Web, Expo Mobile App, dan Desain Sistem Figma.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl mx-auto mb-4">
                <Briefcase className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Ramadhan (Rama)</h4>
              <p className="text-xs font-semibold text-amber-600 mb-2">HUSTLER (Product & Strategy)</p>
              <p className="text-xs text-slate-500">Riset Pengguna Mahasiswa, Pitch Deck, dan Prioritas Backlog.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 CampusFolio — Team 3. Dibuat untuk pemenuhan proyek perkuliahan.
      </footer>
    </main>
  );
}
