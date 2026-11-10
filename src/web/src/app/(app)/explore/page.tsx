"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Users,
  Compass,
  Layers,
  FolderCheck,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  searchEntities,
  StudentSearchResult,
  PostSearchResult,
  PortfolioSearchResult,
} from "@/services/searchService";
import {
  getCollaboratorRecommendations,
  RecommendationItem,
} from "@/services/recommendationService";
import { SearchFilterBar } from "@/components/explore/SearchFilterBar";
import { RecommendationCard } from "@/components/explore/RecommendationCard";
import { StudentResultCard } from "@/components/explore/StudentResultCard";
import { PostResultCard } from "@/components/explore/PostResultCard";
import { PortfolioResultCard } from "@/components/explore/PortfolioResultCard";
import { CollaborationModal } from "@/components/explore/CollaborationModal";
import { EmptyState } from "@/components/common/EmptyState";

type TabType = "mahasiswa" | "postingan" | "portofolio";

export default function ExplorePage() {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("mahasiswa");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJurusan, setSelectedJurusan] = useState("");

  // States for Search Results
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [posts, setPosts] = useState<PostSearchResult[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioSearchResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // States for AI Recommendations Spotlight
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isFallbackAI, setIsFallbackAI] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Modal State
  const [collaborationCandidate, setCollaborationCandidate] = useState<RecommendationItem | null>(null);

  // Fetch AI Recommendations for the seeker
  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoadingRecs(true);
      const res = await getCollaboratorRecommendations({
        top_k: 5,
      });
      setRecommendations(res.recommendations);
      setIsFallbackAI(res.fallback);
    } catch {
      toast.error("Gagal memuat rekomendasi kolaborator.");
    } finally {
      setIsLoadingRecs(false);
    }
  }, [toast]);

  // Load recommendations on mount
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Execute Search
  const executeSearch = useCallback(
    async (newOffset = 0, append = false) => {
      const cleanQ = searchQuery.trim();
      const cleanJur = selectedJurusan.trim();

      // If both query and filters are empty, reset to initial explore mode
      if (!cleanQ && !cleanJur) {
        setIsSearching(false);
        setStudents([]);
        setPosts([]);
        setPortfolios([]);
        setTotalResults(0);
        return;
      }

      try {
        setIsLoadingSearch(true);
        setIsSearching(true);

        const res = await searchEntities({
          q: cleanQ || undefined,
          tipe: activeTab,
          jurusan: cleanJur || undefined,
          limit: 15,
          offset: newOffset,
        });

        setTotalResults(res.total);
        setOffset(newOffset);

        if (activeTab === "mahasiswa") {
          const items = res.items as StudentSearchResult[];
          setStudents((prev) => (append ? [...prev, ...items] : items));
        } else if (activeTab === "postingan") {
          const items = res.items as PostSearchResult[];
          setPosts((prev) => (append ? [...prev, ...items] : items));
        } else {
          const items = res.items as PortfolioSearchResult[];
          setPortfolios((prev) => (append ? [...prev, ...items] : items));
        }
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Gagal melakukan pencarian.");
      } finally {
        setIsLoadingSearch(false);
      }
    },
    [searchQuery, selectedJurusan, activeTab, toast]
  );

  // Trigger search when tab changes if already searching
  useEffect(() => {
    if (isSearching) {
      executeSearch(0, false);
    }
  }, [activeTab, isSearching, executeSearch]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setOffset(0);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + 15;
    executeSearch(nextOffset, true);
  };

  const currentCount =
    activeTab === "mahasiswa"
      ? students.length
      : activeTab === "postingan"
      ? posts.length
      : portfolios.length;

  const hasMore = currentCount < totalResults;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-heading tracking-tight">
          Jelajah & Rekomendasi Kampus
        </h1>
        <p className="text-xs text-slate-500 font-body mt-1">
          Temukan calon kolaborator proyek, postingan rekrutmen tim, dan karya portofolio mahasiswa terverifikasi.
        </p>
      </div>

      {/* Search Input and Filter Bar */}
      <SearchFilterBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSearch={() => executeSearch(0, false)}
        jurusan={selectedJurusan}
        onJurusanChange={(j) => {
          setSelectedJurusan(j);
        }}
        isLoading={isLoadingSearch}
      />

      {/* Tab Navigation (Mahasiswa, Postingan, Portofolio) */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-1">
        <button
          type="button"
          onClick={() => handleTabChange("mahasiswa")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold transition-all ${
            activeTab === "mahasiswa"
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mahasiswa & Rekan</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("postingan")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold transition-all ${
            activeTab === "postingan"
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Postingan & Rekrutmen</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("portofolio")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-bold transition-all ${
            activeTab === "portofolio"
              ? "bg-primary text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FolderCheck className="w-4 h-4" />
          <span>Portofolio Karya</span>
        </button>
      </div>

      {/* Spotlight AI Recommendations Banner (Stitch Screen 4) - only when on Mahasiswa tab */}
      {activeTab === "mahasiswa" && !isSearching && (
        <section className="space-y-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-primary to-indigo-700 text-white rounded-3xl p-6 shadow-md">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1 rounded-full text-[11px] font-bold tracking-wider font-heading uppercase backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>AI Matchmaker Engine</span>
              </div>
              <h2 className="text-lg font-bold font-heading">
                Rekomendasi Kolaborator Cerdas untuk Kamu
              </h2>
              <p className="text-xs text-indigo-100 font-body max-w-xl leading-relaxed">
                Dihitung secara personal berdasarkan kecocokan semantik dan keahlian komplementer yang saling melengkapi profil akademik Anda.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-slate-900 font-heading">
                Kandidat Rekomendasi Teratas
              </h3>
            </div>
            <button
              type="button"
              onClick={fetchRecommendations}
              disabled={isLoadingRecs}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecs ? "animate-spin" : ""}`} />
              <span>Segarkan Rekomendasi</span>
            </button>
          </div>

          {isLoadingRecs ? (
            <div className="p-8 bg-white border border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-slate-500 font-medium">Menganalisis kemiripan keahlian kolaborator...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.user_id}
                  item={rec}
                  isFallback={isFallbackAI}
                  onCollaborationInvite={(cand) => setCollaborationCandidate(cand)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum Ada Rekomendasi"
              description="Lengkapi tag keahlian dan minat di profil Anda untuk mendapatkan rekomendasi kolaborator AI yang lebih presisi."
              icon={Compass}
            />
          )}
        </section>
      )}

      {/* Search Results Section */}
      {isSearching && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-heading">
              Ditemukan {totalResults} hasil untuk &quot;{searchQuery || selectedJurusan}&quot;
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedJurusan("");
                setIsSearching(false);
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Kembali ke Mode Jelajah
            </button>
          </div>

          {isLoadingSearch && offset === 0 ? (
            <div className="p-8 bg-white border border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-slate-500 font-medium">Mencari entitas kampus...</p>
            </div>
          ) : totalResults === 0 ? (
            <EmptyState
              title="Tidak Ada Hasil yang Cocok"
              description="Coba gunakan kata kunci keahlian lain atau atur filter program studi."
              icon={Search}
            />
          ) : (
            <div className="space-y-4">
              {activeTab === "mahasiswa" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students.map((s) => (
                    <StudentResultCard
                      key={s.user_id}
                      student={s}
                      onCollaborationInvite={(stud) => {
                        setCollaborationCandidate({
                          user_id: String(stud.user_id),
                          name: stud.nama,
                          department: stud.jurusan,
                          score: 0.8,
                          matched_terms: stud.skills.map((sk) => sk.nama),
                          complementary_skills: [],
                          reason: "Kolaborasi pencarian profil",
                        });
                      }}
                    />
                  ))}
                </div>
              )}

              {activeTab === "postingan" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {posts.map((p) => (
                    <PostResultCard key={p.post_id} post={p} />
                  ))}
                </div>
              )}

              {activeTab === "portofolio" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {portfolios.map((item) => (
                    <PortfolioResultCard key={item.portfolio_id} portfolio={item} />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    disabled={isLoadingSearch}
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-border-subtle text-slate-700 hover:bg-slate-50 font-semibold text-xs transition shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {isLoadingSearch && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    <span>Muat Lebih Banyak ({totalResults - currentCount} tersisa)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Collaboration Invite Modal */}
      <CollaborationModal
        isOpen={collaborationCandidate !== null}
        candidate={collaborationCandidate}
        onClose={() => setCollaborationCandidate(null)}
      />
    </div>
  );
}
