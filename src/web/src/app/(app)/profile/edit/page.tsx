"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, BookOpen, Calendar, Link as LinkIcon, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api";
import { SkillSelector, SelectedSkill } from "@/components/features/SkillSelector";

const ALLOWED_JURUSAN = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Ilmu Komputer",
  "Manajemen Bisnis",
  "Teknik Elektro",
  "Teknik Komputer",
];

interface UserSkillApiResponse {
  skill_id: number;
  nama: string;
  tipe: "skill" | "minat";
  level: "pemula" | "menengah" | "mahir";
}

interface UserMeResponse {
  user_id: number;
  nim: string;
  nama: string;
  email: string;
  role: string;
  jurusan: string | null;
  angkatan: number | null;
  bio: string | null;
  kontak_url: string | null;
  skills?: UserSkillApiResponse[];
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [nama, setNama] = useState("");
  const [jurusan, setJurusan] = useState<string>("");
  const [angkatan, setAngkatan] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [kontakUrl, setKontakUrl] = useState("");
  const [skills, setSkills] = useState<SelectedSkill[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isStaff = user?.role === "moderator" || user?.role === "admin";

  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true);
        // Load user me details with skills included
        const meRes = await apiClient.get<UserMeResponse>("/users/me");
        const data = meRes.data;
        setNama(data.nama || "");
        setJurusan(data.jurusan || "");
        setAngkatan(data.angkatan || "");
        setBio(data.bio || "");
        setKontakUrl(data.kontak_url || "");

        if (data.skills && Array.isArray(data.skills)) {
          setSkills(
            data.skills.map((s) => ({
              skill_id: s.skill_id,
              nama: s.nama,
              tipe: s.tipe,
              level: s.level,
            }))
          );
        }
      } catch (err: any) {
        toastRef.current.error(err.response?.data?.detail || "Gagal mengambil data profil Anda");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!nama.trim()) {
      errors.nama = "Nama lengkap tidak boleh kosong";
    }

    if (bio.length > 1000) {
      errors.bio = "Bio maksimal 1000 karakter";
    }

    if (kontakUrl.trim()) {
      const url = kontakUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        errors.kontakUrl = "URL kontak harus diawali dengan http:// atau https://";
      }
    }

    if (skills.length > 20) {
      errors.skills = "Maksimal 20 keahlian & minat";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      // 1. Update Profile Information (PATCH /users/me)
      const patchPayload: Record<string, any> = {
        nama: nama.trim(),
        bio: bio.trim() || null,
        kontak_url: kontakUrl.trim() || null,
      };

      if (!isStaff) {
        patchPayload.jurusan = jurusan || null;
      }
      if (angkatan !== "") {
        patchPayload.angkatan = Number(angkatan);
      } else {
        patchPayload.angkatan = null;
      }

      await apiClient.patch("/users/me", patchPayload);

      // 2. Update Skills & Interests (PUT /users/me/skills)
      const skillsPayload = {
        items: skills.map((s) => ({
          skill_id: s.skill_id,
          nama: s.nama,
          tipe: s.tipe,
          level: s.level,
        })),
      };

      await apiClient.put("/users/me/skills", skillsPayload);

      // Refresh global user state
      await refreshUser();

      toast.success("Profil dan kompetensi Anda berhasil diperbarui.");

      // Navigate back to profile view after brief delay
      setTimeout(() => {
        router.push("/profile/me");
      }, 800);
    } catch (err: any) {
      const errorMsg =
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : err.message || "Terjadi kesalahan saat menyimpan profil";

      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="h-10 bg-slate-100 rounded-xl"></div>
          <div className="h-10 bg-slate-100 rounded-xl"></div>
          <div className="h-24 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile/me"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Kembali ke profil"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-heading">Edit Profil & Keahlian</h1>
            <p className="text-xs text-slate-500 font-body">
              Perbarui identitas akademik, biografi, dan kelola tag kompetensi
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Diri Card */}
        <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 font-heading border-b pb-3">
            Identitas Akademik & Kontak
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                maxLength={100}
                placeholder="Masukkan nama lengkap Anda"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.nama ? "border-rose-400 focus:ring-rose-400" : "border-slate-300"
                }`}
              />
              {fieldErrors.nama && (
                <p className="text-xs text-rose-500 font-medium">{fieldErrors.nama}</p>
              )}
            </div>

            {/* Jurusan / Program Studi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Program Studi (Jurusan)
              </label>
              <select
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
                disabled={isStaff}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <option value="">Pilih Program Studi</option>
                {ALLOWED_JURUSAN.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
              {isStaff && (
                <p className="text-[11px] text-amber-600 font-medium">
                  Program studi staf/moderator dikelola oleh Administrator kampus.
                </p>
              )}
            </div>

            {/* Tahun Angkatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tahun Angkatan
              </label>
              <input
                type="number"
                min={2000}
                max={2030}
                value={angkatan}
                onChange={(e) =>
                  setAngkatan(e.target.value ? parseInt(e.target.value, 10) : "")
                }
                placeholder="Misal: 2023"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Tautan Profil / Kontak URL */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                Tautan Kontak / Portofolio Eksternal
              </label>
              <input
                type="url"
                value={kontakUrl}
                onChange={(e) => setKontakUrl(e.target.value)}
                maxLength={255}
                placeholder="https://linkedin.com/in/username atau https://github.com/username"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.kontakUrl ? "border-rose-400 focus:ring-rose-400" : "border-slate-300"
                }`}
              />
              {fieldErrors.kontakUrl && (
                <p className="text-xs text-rose-500 font-medium">{fieldErrors.kontakUrl}</p>
              )}
            </div>

            {/* Biografi / Tentang Saya */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Biografi Singkat
                </label>
                <span
                  className={`text-[11px] ${
                    bio.length > 950 ? "text-amber-600 font-bold" : "text-slate-400"
                  }`}
                >
                  {bio.length} / 1000
                </span>
              </div>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={1000}
                placeholder="Ceritakan latar belakang, fokus minat akademik, dan tujuan karir Anda..."
                className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.bio ? "border-rose-400 focus:ring-rose-400" : "border-slate-300"
                }`}
              />
              {fieldErrors.bio && (
                <p className="text-xs text-rose-500 font-medium">{fieldErrors.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Keahlian & Minat Card */}
        <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-heading">
              Tag Keahlian & Minat
            </h2>
            <p className="text-xs text-slate-500 font-body">
              Tambahkan hingga 20 tag keahlian teknis dan minat karir yang merepresentasikan kompetensi Anda.
            </p>
          </div>

          <SkillSelector
            value={skills}
            onChange={setSkills}
            maxSkills={20}
            disabled={isSaving}
          />
          {fieldErrors.skills && (
            <p className="text-xs text-rose-500 font-medium">{fieldErrors.skills}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/profile/me"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
