"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, GraduationCap, Calendar, Award } from "lucide-react";

export default function ProfileDetailPage() {
  const params = useParams();
  const { user } = useAuth();

  const isCurrentUser = !params?.id || params?.id === "me" || String(user?.id) === params?.id;

  const displayUser = isCurrentUser
    ? user
    : {
        nama: "Reksa Anggara",
        nim: "2023001009",
        email: "reksa@campus.ac.id",
        role: "mahasiswa",
        jurusan: "Teknik Informatika",
        angkatan: 2023,
        bio: "Fullstack developer yang tertarik pada Distributed Systems dan Cloud Native Architecture.",
      };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile Card Header */}
      <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center flex-shrink-0">
            {displayUser?.nama?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                {displayUser?.nama || "Pengguna"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-primary border border-indigo-200 uppercase">
                {displayUser?.role || "Mahasiswa"}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-body mt-0.5">
              NIM: {displayUser?.nim || "—"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>{displayUser?.jurusan || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Angkatan {displayUser?.angkatan || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{displayUser?.email || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {displayUser?.bio && (
          <div className="pt-4 border-t border-border-subtle">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tentang Saya
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-body">
              {displayUser.bio}
            </p>
          </div>
        )}
      </div>

      {/* Portfolio Showcase Section */}
      <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Portofolio Terverifikasi (SKPI)
          </h3>
        </div>
        <p className="text-xs text-slate-500 font-body">
          Rincian portofolio publik dan rekam jejak sertifikasi akan dimuat di modul M04 (Profil Mahasiswa).
        </p>
      </div>
    </div>
  );
}
