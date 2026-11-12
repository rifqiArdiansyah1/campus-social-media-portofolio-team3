"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AxiosError } from "axios";
import { registerUser } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { AppErrorResponse } from "@/lib/api";

const ALLOWED_JURUSAN = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Ilmu Komputer",
  "Manajemen Bisnis",
  "Teknik Elektro",
  "Teknik Komputer",
];

const registerSchema = z
  .object({
    nama: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    nim: z
      .string()
      .min(5, "NIM minimal 5 karakter")
      .max(20, "NIM maksimal 20 karakter"),
    email: z
      .string()
      .min(1, "Email kampus wajib diisi")
      .email("Format email tidak valid")
      .refine(
        (val) => {
          const parts = val.trim().toLowerCase().split("@");
          if (parts.length !== 2) return false;
          const domain = parts[1];
          return domain === "campus.ac.id" || domain === "students.campus.ac.id";
        },
        {
          message: "Email harus menggunakan domain resmi kampus (@campus.ac.id atau @students.campus.ac.id)",
        }
      ),
    jurusan: z.string().min(1, "Pilih program studi resmi Anda"),
    angkatan: z.coerce.number().min(2015, "Tahun angkatan minimal 2015"),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .refine(
        (val) => new TextEncoder().encode(val).length <= 72,
        {
          message: "Kata sandi tidak boleh melebihi 72 byte",
        }
      ),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "Anda harus menyetujui Ketentuan Layanan dan Pedoman Etik kampus",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Guest Guard: if already logged in, redirect immediately to /home
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/home");
    }
  }, [authLoading, isAuthenticated, router]);
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    email: "",
    jurusan: "",
    angkatan: "2024",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
    if (fieldErrors[name as keyof RegisterFormValues]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof RegisterFormValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof RegisterFormValues;
        if (!formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        nama: formData.nama.trim(),
        nim: formData.nim.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        jurusan: formData.jurusan,
        angkatan: Number(formData.angkatan),
      });

      // Auto login on successful registration
      try {
        await login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });
        router.push("/home");
      } catch {
        router.push("/login");
      }
    } catch (err) {
      const axiosError = err as AxiosError<AppErrorResponse>;
      if (axiosError.response?.data?.code === "EMAIL_TAKEN") {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Email kampus ini telah terdaftar. Silakan gunakan email lain atau masuk.",
        }));
      } else if (axiosError.response?.data?.code === "NIM_TAKEN") {
        setFieldErrors((prev) => ({
          ...prev,
          nim: "NIM mahasiswa ini telah terdaftar.",
        }));
      } else if (axiosError.message) {
        setServerError(axiosError.message);
      } else {
        setServerError("Gagal mendaftarkan akun. Silakan periksa kembali data Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#faf8ff] text-slate-800 font-sans antialiased min-h-screen flex justify-center selection:bg-brand-100 selection:text-brand-900">
      {/* Mobile Container (~390px-430px wide, centered) */}
      <div className="w-full max-w-md bg-[#faf8ff] min-h-screen pb-12 flex flex-col shadow-sm border-x border-slate-200/60 relative">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#faf8ff]/90 backdrop-blur-md px-4 py-3 border-b border-indigo-100/70 flex items-center justify-between">
          <Link
            href="/login"
            aria-label="Kembali"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-indigo-50 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>

          {/* CampusFolio Brand Logo Minimal */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-white shadow-sm shadow-indigo-300/40">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                CampusFolio
              </span>
              <span className="text-[10px] font-semibold text-brand-700 uppercase tracking-wider">
                Universitas
              </span>
            </div>
          </div>

          <div className="w-10 h-10 flex items-center justify-center">
            <button
              type="button"
              aria-label="Bantuan Registrasi"
              onClick={() => alert("Pusat Bantuan Akademik & Verifikasi Akun")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">help_outline</span>
            </button>
          </div>
        </header>

        {/* Main Registration Content */}
        <main className="px-5 pt-5 pb-8 flex-1 flex flex-col">
          {/* Badge & Title Section */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100/70 text-brand-800 text-xs font-semibold mb-2.5 border border-indigo-200/50">
              <span className="material-symbols-outlined text-[16px] text-brand-700">verified_user</span>
              <span>Portal Pendaftaran Terintegrasi</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              Daftar Akun Mahasiswa
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Bergabung dengan ekosistem portofolio dan kolaborasi proyek kampus.
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Quick SSO Action */}
          <div className="mb-6 bg-white p-3.5 rounded-2xl border border-indigo-100/90 shadow-sm flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => alert("SSO Akademik Universitas sedang dalam tahap integrasi.")}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-indigo-50/50 active:bg-indigo-100/60 border border-slate-200 flex items-center justify-center gap-2.5 text-slate-800 font-semibold text-xs tracking-tight transition-all"
            >
              <span className="material-symbols-outlined text-[20px] text-brand-700">key</span>
              <span>Masuk dengan SSO Kampus</span>
              <span className="material-symbols-outlined text-[16px] text-slate-400 ml-auto">arrow_forward</span>
            </button>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
              <span>Login instan menggunakan akun SIAKAD / SSO terdaftar</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              atau daftar dengan formulir
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Form Container Card */}
          <form className="bg-white p-5 rounded-2xl border border-indigo-100/80 shadow-sm space-y-4" onSubmit={handleSubmit}>
            {/* Field 1: Nama Lengkap */}
            <div>
              <label htmlFor="nama" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  person
                </span>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="cth. Nadia Eka Pramudita"
                  className={`w-full pl-11 pr-3.5 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.nama ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all`}
                />
              </div>
              {fieldErrors.nama && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.nama}</p>
              )}
            </div>

            {/* Field 2: NIM */}
            <div>
              <label htmlFor="nim" className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                <span>
                  Nomor Induk Mahasiswa (NIM) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Identitas Akademik</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  badge
                </span>
                <input
                  type="text"
                  id="nim"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  placeholder="cth. 2106728910"
                  className={`w-full pl-11 pr-3.5 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.nim ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 tracking-wider font-mono transition-all`}
                />
              </div>
              {fieldErrors.nim && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.nim}</p>
              )}
            </div>

            {/* Field 3: Email Kampus ac.id */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>
                  Email Mahasiswa Kampus <span className="text-rose-500">*</span>
                </span>
                <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                  Wajib @*.ac.id
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  mail
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama.mahasiswa@campus.ac.id"
                  className={`w-full pl-11 pr-24 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.email ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all`}
                />
                <div className="absolute right-2.5 flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md pointer-events-none font-mono">
                  <span className="material-symbols-outlined text-[14px] text-brand-600">verified</span>
                  <span>campus.ac.id</span>
                </div>
              </div>
              {fieldErrors.email ? (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.email}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1 pl-1">
                  Gunakan email resmi kampus (@campus.ac.id atau @students.campus.ac.id).
                </p>
              )}
            </div>

            {/* Field 4: Program Studi */}
            <div>
              <label htmlFor="jurusan" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Program Studi Resmi <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  school
                </span>
                <select
                  id="jurusan"
                  name="jurusan"
                  value={formData.jurusan}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-10 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.jurusan ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none transition-all cursor-pointer`}
                >
                  <option value="" disabled>Pilih Program Studi</option>
                  {ALLOWED_JURUSAN.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3.5 text-slate-400 text-[20px] pointer-events-none">
                  expand_more
                </span>
              </div>
              {fieldErrors.jurusan && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.jurusan}</p>
              )}
            </div>

            {/* Field 5: Tahun Angkatan */}
            <div>
              <label htmlFor="angkatan" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun Angkatan <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  calendar_today
                </span>
                <select
                  id="angkatan"
                  name="angkatan"
                  value={formData.angkatan}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-10 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.angkatan ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none transition-all cursor-pointer`}
                >
                  <option value="2025">Angkatan 2025 (Mahasiswa Baru)</option>
                  <option value="2024">Angkatan 2024</option>
                  <option value="2023">Angkatan 2023</option>
                  <option value="2022">Angkatan 2022</option>
                  <option value="2021">Angkatan 2021</option>
                  <option value="2020">Angkatan 2020</option>
                  <option value="2019">Angkatan 2019</option>
                  <option value="2018">Angkatan 2018 atau sebelumnya</option>
                </select>
                <span className="material-symbols-outlined absolute right-3.5 text-slate-400 text-[20px] pointer-events-none">
                  expand_more
                </span>
              </div>
              {fieldErrors.angkatan && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.angkatan}</p>
              )}
            </div>

            {/* Field 6: Kata Sandi */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                <span>
                  Kata Sandi <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400">Min. 8 karakter (Maks. 72 byte)</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Buat kata sandi akun"
                  className={`w-full pl-11 pr-11 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.password ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all`}
                />
                <button
                  type="button"
                  aria-label="Lihat kata sandi"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Field 7: Konfirmasi Kata Sandi */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                  lock_reset
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi kata sandi"
                  className={`w-full pl-11 pr-11 py-2.5 bg-slate-50/80 border ${
                    fieldErrors.confirmPassword ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                  } rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all`}
                />
                <button
                  type="button"
                  aria-label="Lihat konfirmasi kata sandi"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Checkbox Persetujuan */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-slate-300 cursor-pointer accent-[#4338ca]"
                />
                <span className="text-[11px] text-slate-600 leading-normal">
                  Saya menyetujui Ketentuan Layanan serta berkomitmen mematuhi Pedoman Etik Komunitas Akademik kampus.
                </span>
              </label>
              {fieldErrors.termsAccepted && (
                <p className="text-[11px] text-rose-500 mt-1 pl-1">{fieldErrors.termsAccepted}</p>
              )}
            </div>

            {/* Tombol Utama: Daftar Akun Mahasiswa */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-5 rounded-xl bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-bold text-xs shadow-md shadow-brand-700/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>Mendaftarkan akun...</span>
                ) : (
                  <>
                    <span>Daftar Akun Mahasiswa</span>
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              Sudah memiliki akun terverifikasi?{" "}
              <Link
                href="/login"
                className="font-bold text-brand-700 hover:text-brand-800 hover:underline inline-flex items-center gap-0.5 ml-1"
              >
                <span>Masuk</span>
                <span className="material-symbols-outlined text-[14px]">login</span>
              </Link>
            </p>
          </div>

          {/* Campus Trust Footer Note */}
          <div className="mt-8 text-center px-4">
            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <span className="material-symbols-outlined text-[15px] text-indigo-400">shield</span>
              <span>Data mahasiswa diverifikasi dan dilindungi standar privasi kampus</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
