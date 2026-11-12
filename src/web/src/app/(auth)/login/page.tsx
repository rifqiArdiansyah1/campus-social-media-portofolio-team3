"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { AppErrorResponse } from "@/lib/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "NIM atau email kampus wajib diisi")
    .refine(
      (val) => {
        const clean = val.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
        const isNim = /^[a-zA-Z0-9]{5,20}$/.test(clean);
        return isEmail || isNim;
      },
      { message: "Masukkan email kampus resmi atau NIM mahasiswa valid" }
    ),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const isExpired = searchParams.get("expired") === "true";
  const nextParam = searchParams.get("next");

  const [formData, setFormData] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(
    isExpired ? "Sesi login Anda telah kedaluwarsa. Silakan masuk kembali." : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Guest Guard: if already logged in, redirect immediately to next or /home
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const destination = nextParam || "/home";
      router.replace(destination);
    }
  }, [authLoading, isAuthenticated, nextParam, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof LoginFormValues]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof LoginFormValues, string>> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof LoginFormValues;
        formattedErrors[fieldName] = issue.message;
      });
      setFieldErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const destination = nextParam || "/home";
      router.push(destination);
    } catch (err) {
      const axiosError = err as AxiosError<AppErrorResponse>;
      if (axiosError.response?.status === 429) {
        setServerError(
          (axiosError.response.data?.detail as string) ||
            "Terlalu banyak percobaan masuk gagal. Silakan tunggu beberapa saat sebelum mencoba kembali."
        );
      } else if (axiosError.response?.status === 401) {
        setServerError(
          (axiosError.response.data?.detail as string) || "Email atau kata sandi tidak valid."
        );
      } else if (axiosError.message) {
        setServerError(axiosError.message);
      } else {
        setServerError("Gagal terhubung ke server. Periksa koneksi jaringan Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-100 font-sans text-slate-800 antialiased min-h-screen flex justify-center items-start sm:py-8 sm:px-4">
      {/* Mobile Container (Max width 420px for mobile app viewport) */}
      <main className="w-full max-w-[420px] min-h-screen sm:min-h-0 bg-white sm:rounded-3xl shadow-xl flex flex-col justify-between overflow-hidden border border-slate-200/80">
        {/* Top Bar & Header Branding */}
        <div>
          {/* Status & Safety Micro Bar */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
            {/* Logo CampusFolio */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-700/20">
                <span className="material-symbols-outlined text-[22px]">school</span>
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                  CampusFolio
                </span>
                <span className="text-[10px] font-semibold text-brand-700 tracking-wider uppercase block">
                  Ekosistem Portofolio Kampus
                </span>
              </div>
            </div>

            {/* Verified Campus Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">verified_user</span>
              <span>Portal Resmi</span>
            </div>
          </div>

          {/* Hero Header & Title */}
          <div className="px-6 pt-6 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Masuk ke CampusFolio</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Akses portofolio karyamu dan terhubung dengan rekan proyek se-kampus.
            </p>
          </div>

          {/* Server Error Alert Banner */}
          {serverError && (
            <div className="mx-6 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          {/* Main Action Section */}
          <div className="px-6 space-y-5">
            {/* SSO / SIAKAD Button */}
            <div className="space-y-1.5">
              <button
                type="button"
                className="w-full group relative flex items-center justify-between p-3.5 bg-brand-50/60 hover:bg-brand-50 active:bg-brand-100 border border-brand-200 hover:border-brand-500 rounded-2xl transition duration-200 text-left shadow-xs"
                onClick={() => alert("SSO Akademik Universitas sedang dalam tahap integrasi.")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">key</span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Masuk dengan SSO Kampus</span>
                    <span className="text-[11px] text-slate-500 block">Akun SIAKAD / Email Institusi Resmi</span>
                  </div>
                </div>
                <div className="flex items-center text-brand-700 pr-1 group-hover:translate-x-0.5 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </div>
              </button>

              <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                <span>Autentikasi terenkripsi terhubung ke server akademik universitas</span>
              </div>
            </div>

            {/* Elegant Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                atau masuk dengan kredensial akun
              </span>
            </div>

            {/* Credentials Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Input NIM / Email Mahasiswa */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                  NIM atau Email Mahasiswa Kampus <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <input
                    type="text"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="cth. 2106728910 atau nama@campus.ac.id"
                    className={`block w-full pl-10 pr-20 py-3 text-xs sm:text-sm bg-slate-50 border ${
                      fieldErrors.email ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                    } rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 text-slate-900 placeholder:text-slate-400 transition`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-[10px] font-semibold tracking-wide bg-brand-100 text-brand-800 px-2 py-0.5 rounded-md">
                      @ac.id / NIM
                    </span>
                  </div>
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-500 pl-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Input Kata Sandi */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan kata sandi akun"
                    className={`block w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-50 border ${
                      fieldErrors.password ? "border-rose-400 ring-1 ring-rose-400" : "border-slate-200"
                    } rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-brand-700 text-slate-900 placeholder:text-slate-400 transition`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-500 pl-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Options Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-brand-700 border-slate-300 focus:ring-brand-700 focus:ring-offset-0 transition cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Ingat Saya</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Fitur pemulihan kata sandi dapat diajukan ke biro kemahasiswaan.");
                  }}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                >
                  Lupa Kata Sandi?
                </a>
              </div>

              {/* Primary CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-700/25 flex items-center justify-center gap-2 transition duration-150 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span>Memverifikasi...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">login</span>
                      <span>Masuk ke Akun</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Register Link Navigation */}
            <div className="text-center py-2">
              <p className="text-xs text-slate-600">
                Belum memiliki akun mahasiswa?{" "}
                <Link
                  href="/register"
                  className="font-bold text-brand-700 hover:text-brand-800 hover:underline ml-1"
                >
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Academic Security Footer Guarantee */}
        <div className="mt-8 border-t border-slate-100 bg-slate-50/70 p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <span className="material-symbols-outlined text-[18px] text-brand-700">verified</span>
            <span className="text-[11px] font-semibold text-slate-700">
              Jaminan Keamanan Akademik Kampus
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
            Kredensial dan data portofolio dilindungi enkripsi standar institusi pendidikan tinggi serta
            terintegrasi kebijakan privasi mahasiswa.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
      <LoginForm />
    </Suspense>
  );
}
