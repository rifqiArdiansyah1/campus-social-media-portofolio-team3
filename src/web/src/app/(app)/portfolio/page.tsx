"use client";

import React, { useState } from "react";
import { PortfolioStatusBadge, PortfolioStatus } from "@/components/common/PortfolioStatusBadge";
import { FolderKanban, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface PortfolioMockItem {
  id: number;
  judul: string;
  deskripsi: string;
  status: PortfolioStatus;
  kategori: string;
  created_at: string;
}

export default function PortfolioPage() {
  const toast = useToast();

  const [items] = useState<PortfolioMockItem[]>([
    {
      id: 1,
      judul: "Sistem Monitoring IoT untuk Laboratorium Kimia",
      deskripsi: "Proyek capstone menggunakan ESP32, MQTT, dan dashboard Next.js real-time.",
      status: "terverifikasi",
      kategori: "Capstone / Tugas Akhir",
      created_at: "2026-09-12",
    },
    {
      id: 2,
      judul: "Aplikasi Mobile Campus Shuttle Tracker",
      deskripsi: "Pelacak bus kampus berbasis React Native dan Supabase realtime location.",
      status: "menunggu_review",
      kategori: "Lomba / Hackathon",
      created_at: "2026-10-01",
    },
    {
      id: 3,
      judul: "Paper Review: Efficient ViT on Edge TPU",
      deskripsi: "Analisis performa Vision Transformer untuk segmentasi gambar pada edge device.",
      status: "draft",
      kategori: "Karya Tulis Ilmiah",
      created_at: "2026-10-25",
    },
    {
      id: 4,
      judul: "Kepanitiaan Seminar Nasional Web3",
      deskripsi: "Sertifikat koordinator divisi publikasi dan dokumentasi acara tahunan.",
      status: "ditolak",
      kategori: "Organisasi & Kepanitiaan",
      created_at: "2026-08-15",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">
            Portofolio & Rekam SKPI
          </h2>
          <p className="text-xs text-slate-500 font-body mt-1">
            Kelola karya, sertifikat, dan proyek yang diajukan untuk verifikasi SKPI program studi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.info("Fitur upload portofolio akan dibuka di modul M07.")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karya Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white border border-border-subtle shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {item.kategori}
                </span>
                <PortfolioStatusBadge status={item.status} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-heading leading-snug">
                {item.judul}
              </h3>
              <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed font-body">
                {item.deskripsi}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-slate-400">
              <span>Diajukan: {item.created_at}</span>
              <button
                type="button"
                onClick={() => toast.info(`Detail portofolio #${item.id} aktif di M07.`)}
                className="text-primary hover:text-primary-container font-semibold flex items-center gap-1"
              >
                <span>Lihat Detail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
