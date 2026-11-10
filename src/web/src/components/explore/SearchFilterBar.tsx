"use client";

import React, { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  jurusan: string;
  onJurusanChange: (j: string) => void;
  isLoading?: boolean;
}

const JURUSAN_PRESETS = [
  "Semua",
  "Teknik Informatika",
  "Sistem Informasi",
  "Teknik Elektro",
  "Teknik Industri",
  "Desain Komunikasi Visual",
  "Manajemen Bisnis",
];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  jurusan,
  onJurusanChange,
  isLoading = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="space-y-2.5">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <div className="absolute left-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cari mahasiswa, keahlian, topik proyek linimasa..."
          className="w-full bg-white text-slate-900 placeholder:text-slate-400 font-body text-sm rounded-2xl pl-12 pr-24 py-3.5 border border-border-subtle shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition flex items-center justify-center ${
              showFilters || jurusan
                ? "bg-primary text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title="Filter lanjutan"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Expandable Filter Chips & Jurusan Selection */}
      {showFilters && (
        <div className="p-3.5 bg-white border border-border-subtle rounded-2xl shadow-xs space-y-2 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-heading">
              Filter Program Studi:
            </span>
            {jurusan && (
              <button
                type="button"
                onClick={() => onJurusanChange("")}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {JURUSAN_PRESETS.map((j) => {
              const isSelected = (j === "Semua" && !jurusan) || jurusan === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    onJurusanChange(j === "Semua" ? "" : j);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {j}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
