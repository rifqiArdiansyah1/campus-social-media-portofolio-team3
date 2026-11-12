"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Search, Plus, X, Award, Heart, Check, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

export interface SelectedSkill {
  skill_id?: number;
  nama: string;
  tipe: "skill" | "minat";
  level: "pemula" | "menengah" | "mahir";
}

interface SkillItemApi {
  skill_id: number;
  nama: string;
  tipe: "skill" | "minat";
}

interface SkillSelectorProps {
  value: SelectedSkill[];
  onChange: (skills: SelectedSkill[]) => void;
  maxSkills?: number;
  disabled?: boolean;
  allowCreate?: boolean;
}

export function SkillSelector({
  value = [],
  onChange,
  maxSkills = 20,
  disabled = false,
  allowCreate = true,
}: SkillSelectorProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SkillItemApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedTipe, setSelectedTipe] = useState<"skill" | "minat">("skill");
  const [selectedLevel, setSelectedLevel] = useState<"pemula" | "menengah" | "mahir">("pemula");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for skills
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<SkillItemApi[]>("/skills", {
          params: { q: trimmed, limit: 10 },
        });
        setSuggestions(response.data);
        setIsOpen(true);
        setFocusedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddSkill = (skill: { skill_id?: number; nama: string; tipe?: "skill" | "minat" }) => {
    setErrorMessage(null);
    const cleanedName = skill.nama.trim();

    if (value.length >= maxSkills) {
      setErrorMessage(`Batas maksimal ${maxSkills} keahlian & minat telah tercapai.`);
      return;
    }

    // Check duplicate (case-insensitive)
    const isDuplicate = value.some(
      (s) =>
        (skill.skill_id && s.skill_id === skill.skill_id) ||
        s.nama.toLowerCase() === cleanedName.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage(`Tag "${cleanedName}" sudah ada dalam daftar.`);
      return;
    }

    const newSkill: SelectedSkill = {
      skill_id: skill.skill_id,
      nama: cleanedName,
      tipe: skill.tipe || selectedTipe,
      level: selectedLevel,
    };

    onChange([...value, newSkill]);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (index: number) => {
    setErrorMessage(null);
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleLevelChange = (index: number, level: "pemula" | "menengah" | "mahir") => {
    const updated = [...value];
    updated[index] = { ...updated[index], level };
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
      }
      setFocusedIndex((prev) => (prev < suggestions.length ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        handleAddSkill(suggestions[focusedIndex]);
      } else if (allowCreate && query.trim().length >= 2) {
        handleAddSkill({ nama: query.trim(), tipe: selectedTipe });
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const isExactMatch = suggestions.some(
    (s) => s.nama.toLowerCase() === query.trim().toLowerCase()
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Header & Counter */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span>Keahlian & Minat</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              value.length >= maxSkills
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {value.length} / {maxSkills}
          </span>
        </label>
        {value.length >= maxSkills && (
          <span className="text-xs text-amber-600 font-medium">Batas kuota tercapai</span>
        )}
      </div>

      {/* Input & Search Controls */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-activedescendant={
                focusedIndex >= 0 ? `skill-option-${focusedIndex}` : undefined
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              disabled={disabled || value.length >= maxSkills}
              placeholder={
                value.length >= maxSkills
                  ? "Batas 20 keahlian tercapai"
                  : "Cari atau tambah keahlian/minat baru..."
              }
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
            />

            {/* Suggestions Dropdown */}
            {isOpen && (
              <ul
                id={listboxId}
                role="listbox"
                className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-lg py-1 divide-y divide-slate-100"
              >
                {isLoading && (
                  <li className="px-4 py-2.5 text-xs text-slate-500 font-medium">
                    Mencari rekomendasi...
                  </li>
                )}

                {!isLoading && suggestions.length === 0 && !isExactMatch && query.trim().length >= 2 && (
                  <li
                    role="option"
                    aria-selected={focusedIndex === 0}
                    className="px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    onClick={() => handleAddSkill({ nama: query.trim(), tipe: selectedTipe })}
                  >
                    <span>
                      Tambah <strong className="text-primary font-semibold">&ldquo;{query.trim()}&rdquo;</strong> sebagai tag kustom
                    </span>
                    <Plus className="w-4 h-4 text-primary" />
                  </li>
                )}

                {suggestions.map((item, idx) => {
                  const isSelected = value.some(
                    (s) => s.skill_id === item.skill_id || s.nama.toLowerCase() === item.nama.toLowerCase()
                  );
                  const isFocused = focusedIndex === idx;

                  return (
                    <li
                      key={item.skill_id}
                      id={`skill-option-${idx}`}
                      role="option"
                      aria-selected={isFocused}
                      className={`px-4 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isFocused ? "bg-primary/5 text-primary font-medium" : "text-slate-700 hover:bg-slate-50"
                      } ${isSelected ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
                      onClick={() => {
                        if (!isSelected) {
                          handleAddSkill(item);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {item.tipe === "skill" ? (
                          <Award className="w-3.5 h-3.5 text-indigo-500" />
                        ) : (
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>{item.nama}</span>
                        <span className="text-[10px] text-slate-400 capitalize">({item.tipe})</span>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] font-semibold text-primary">Pilih</span>
                      )}
                    </li>
                  );
                })}

                {allowCreate && !isExactMatch && query.trim().length >= 2 && suggestions.length > 0 && (
                  <li
                    role="option"
                    aria-selected={false}
                    className="px-4 py-2 text-xs text-primary bg-slate-50 hover:bg-primary/10 cursor-pointer flex items-center justify-between font-medium"
                    onClick={() => handleAddSkill({ nama: query.trim(), tipe: selectedTipe })}
                  >
                    <span>Tambah &ldquo;{query.trim()}&rdquo; sebagai kustom ({selectedTipe})</span>
                    <Plus className="w-3.5 h-3.5" />
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Quick Config Controls for New Addition */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setSelectedTipe("skill")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedTipe === "skill"
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Keahlian
              </button>
              <button
                type="button"
                onClick={() => setSelectedTipe("minat")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedTipe === "minat"
                    ? "bg-white text-rose-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Minat
              </button>
            </div>

            <select
              aria-label="Tingkat Kemahiran Tag Baru"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as "pemula" | "menengah" | "mahir")}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pemula">Pemula</option>
              <option value="menengah">Menengah</option>
              <option value="mahir">Mahir</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Selected Chips List */}
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((skill, index) => {
            const isSkill = skill.tipe === "skill";
            return (
              <div
                key={`${skill.nama}-${index}`}
                className={`inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs shadow-sm transition-all ${
                  isSkill
                    ? "bg-indigo-50/60 border-indigo-200 text-slate-800"
                    : "bg-rose-50/60 border-rose-200 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isSkill ? (
                    <Award className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span className="font-semibold">{skill.nama}</span>
                </div>

                {/* Level Dropdown */}
                <select
                  aria-label={`Ubah tingkat kemahiran untuk ${skill.nama}`}
                  value={skill.level}
                  onChange={(e) =>
                    handleLevelChange(
                      index,
                      e.target.value as "pemula" | "menengah" | "mahir"
                    )
                  }
                  disabled={disabled}
                  className={`text-[10px] font-semibold py-0.5 px-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                    skill.level === "mahir"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : skill.level === "menengah"
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  <option value="pemula">Pemula</option>
                  <option value="menengah">Menengah</option>
                  <option value="mahir">Mahir</option>
                </select>

                {/* Remove button */}
                <button
                  type="button"
                  aria-label={`Hapus ${skill.nama}`}
                  onClick={() => handleRemoveSkill(index)}
                  disabled={disabled}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          Belum ada keahlian atau minat yang ditambahkan. Gunakan kolom pencarian di atas.
        </p>
      )}
    </div>
  );
}
