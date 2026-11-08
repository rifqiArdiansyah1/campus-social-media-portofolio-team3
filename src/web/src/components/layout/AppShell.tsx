"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import {
  Home,
  Users,
  Compass,
  FolderKanban,
  CheckSquare,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [incomingCount, setIncomingCount] = useState<number>(0);

  const isStaff = role === "moderator" || role === "admin";

  useEffect(() => {
    if (user && role === "mahasiswa") {
      apiClient
        .get<{ total: number }>("/friendships", { params: { direction: "incoming", limit: 1 } })
        .then((res) => {
          setIncomingCount(res.data.total ?? 0);
        })
        .catch(() => {
          // Quiet ignore
        });
    }
  }, [user, role, pathname]);

  // Desktop Sidebar Navigation Items
  const navItems = [
    { label: "Beranda", href: "/home", icon: Home },
    { label: "Jejaring Teman", href: "/friends", icon: Users, badge: incomingCount },
    { label: "Jelajah Rekomendasi", href: "/explore", icon: Compass },
    { label: "Portofolio", href: "/portfolio", icon: FolderKanban },
    ...(isStaff
      ? [
          { label: "Tinjauan SKPI", href: "/portfolio/review", icon: CheckSquare },
          { label: "Moderasi", href: "/moderation", icon: ShieldAlert },
        ]
      : []),
    { label: "Profil", href: `/profile/${user?.id ?? user?.user_id ?? "me"}`, icon: User },
  ];

  // Mobile Bottom Bar Navigation (3 primary slots + "Lainnya" trigger)
  const mobilePrimaryNav = [
    { label: "Beranda", href: "/home", icon: Home },
    { label: "Jelajah", href: "/explore", icon: Compass },
    { label: "Portofolio", href: "/portfolio", icon: FolderKanban },
  ];

  const checkIsActive = (item: { label: string; href: string }) => {
    if (item.label === "Profil" && (pathname?.startsWith("/profile") ?? false)) {
      return true;
    }
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col lg:flex-row">
      {/* DESKTOP SIDEBAR (>= 1024px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-border-subtle z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border-subtle">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-slate-900 text-base leading-tight">
              CampusFolio
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {role || "Mahasiswa"}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = checkIsActive(item);
            const IconComponent = item.icon;
            const badgeValue = item.badge;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {Boolean(badgeValue && badgeValue > 0) && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white text-primary" : "bg-rose-500 text-white"
                    }`}
                  >
                    {badgeValue && badgeValue > 99 ? "99+" : badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-border-subtle bg-surface-container-low/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                {getInitials(user?.nama)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate font-heading">
                  {user?.nama || "Pengguna"}
                </p>
                <p className="text-[11px] text-slate-500 truncate font-body">
                  {user?.jurusan || user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              title="Keluar"
              aria-label="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER (< 1024px) */}
      <header className="lg:hidden h-14 bg-white border-b border-border-subtle flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-heading font-extrabold text-slate-900 text-sm">
            CampusFolio
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative"
          aria-label="Toggle menu lainnya"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          {!mobileMenuOpen && incomingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </button>
      </header>

      {/* MOBILE DRAWER / SHEET FOR "MORE" MENU (< 1024px) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Menu navigasi mobile"
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <span className="font-heading font-bold text-slate-900 text-sm">
                Menu Lengkap
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-1.5 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = checkIsActive(item);
                const IconComponent = item.icon;
                const badgeValue = item.badge;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {Boolean(badgeValue && badgeValue > 0) && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? "bg-white text-primary" : "bg-rose-500 text-white"
                        }`}
                      >
                        {badgeValue && badgeValue > 99 ? "99+" : badgeValue}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border-subtle space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {getInitials(user?.nama)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate font-heading">
                    {user?.nama || "Pengguna"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate font-body">
                    {user?.jurusan || user?.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-accent-danger-accessible bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-64 flex flex-col pb-20 lg:pb-8 min-h-screen">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* MOBILE / TABLET BOTTOM NAVIGATION (< 1024px) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-border-subtle h-16 px-4 flex items-center justify-around"
      >
        {mobilePrimaryNav.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 py-1 text-center transition-colors ${
                isActive ? "text-primary font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-16 py-1 text-center text-slate-500 hover:text-slate-900 transition-colors relative"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">Lainnya</span>
          {incomingCount > 0 && (
            <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
          )}
        </button>
      </nav>
    </div>
  );
}
