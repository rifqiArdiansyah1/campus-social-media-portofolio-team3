import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExplorePage from "@/app/(app)/explore/page";
import { apiClient } from "@/lib/api";

const mockStudentUser = {
  user_id: 101,
  id: 101,
  nim: "2021001",
  nama: "Siswa Pengguna",
  email: "siswa@univ.ac.id",
  role: "mahasiswa",
  jurusan: "Teknik Informatika",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockStudentUser,
    role: "mahasiswa",
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock("@/context/ToastContext", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("M10 Explore & Search Frontend Tests (/explore)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders explore header, search bar, tabs, and loads AI recommendations spotlight", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: {
        query_user_id: "101",
        fallback: false,
        recommendations: [
          {
            user_id: "202",
            rec_id: 88,
            name: "Rian Pratama",
            department: "Sistem Informasi",
            match_level: "Sangat Cocok",
            score: 0.92,
            matched_terms: ["Flutter", "FastAPI"],
            complementary_skills: ["UI Design"],
            reason: "Memiliki keahlian backend yang melengkapi kebutuhan desain antarmuka.",
          },
        ],
      },
    });

    render(<ExplorePage />);

    expect(screen.getByText("Jelajah & Rekomendasi Kampus")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Cari mahasiswa, keahlian, topik proyek linimasa...")).toBeInTheDocument();
    expect(screen.getByText("Mahasiswa & Rekan")).toBeInTheDocument();
    expect(screen.getByText("Postingan & Rekrutmen")).toBeInTheDocument();
    expect(screen.getByText("Portofolio Karya")).toBeInTheDocument();

    // Verify AI Recommendation Card rendered
    await waitFor(() => {
      expect(screen.getByText("AI Matchmaker Engine")).toBeInTheDocument();
      expect(screen.getByText("Rian Pratama")).toBeInTheDocument();
      expect(screen.getByText("92% Match")).toBeInTheDocument();
      expect(screen.getByText("+ UI Design")).toBeInTheDocument();
    });
  });

  it("allows submitting negative feedback on recommendation card", async () => {
    (apiClient.post as any).mockImplementation((url: string) => {
      if (url === "/recommendations/match") {
        return Promise.resolve({
          data: {
            query_user_id: "101",
            fallback: false,
            recommendations: [
              {
                user_id: "203",
                rec_id: 99,
                name: "Sarah Amanda",
                department: "Teknik Informatika",
                match_level: "Cukup Cocok",
                score: 0.84,
                matched_terms: ["Python"],
                complementary_skills: ["Machine Learning"],
                reason: "Cocok untuk riset AI.",
              },
            ],
          },
        });
      }
      if (url.includes("/feedback")) {
        return Promise.resolve({
          data: { detail: "Umpan balik berhasil disimpan.", rec_id: 99, umpan_balik: "tidak_relevan" },
        });
      }
      return Promise.reject(new Error("Not found"));
    });

    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Amanda")).toBeInTheDocument();
    });

    const feedbackBtn = screen.getByTitle("Beri tahu AI jika rekomendasi ini kurang relevan");
    fireEvent.click(feedbackBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/recommendations/99/feedback", {
        umpan_balik: "tidak_relevan",
      });
      expect(screen.getByText("Umpan balik tersimpan")).toBeInTheDocument();
    });
  });

  it("executes search query and displays student search results", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { query_user_id: "101", fallback: false, recommendations: [] },
    });

    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        total: 1,
        limit: 15,
        offset: 0,
        tipe: "mahasiswa",
        items: [
          {
            user_id: 301,
            nama: "Citra Dewi",
            nim: "2021005",
            jurusan: "Teknik Informatika",
            angkatan: 2022,
            bio: "Pengembang fullstack web",
            kontak_url: null,
            skills: [{ skill_id: 1, nama: "React", tipe: "skill" }],
            friendship_status: null,
            created_at: "2026-11-10T00:00:00Z",
          },
        ],
      },
    });

    render(<ExplorePage />);

    const searchInput = screen.getByPlaceholderText("Cari mahasiswa, keahlian, topik proyek linimasa...");
    fireEvent.change(searchInput, { target: { value: "Citra" } });
    fireEvent.submit(searchInput.closest("form")!);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/search", {
        params: {
          tipe: "mahasiswa",
          limit: 15,
          offset: 0,
          q: "Citra",
        },
      });
      expect(screen.getByText("Citra Dewi")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });
  });

  it("allows switching tabs to postingan and portofolio", async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { query_user_id: "101", fallback: false, recommendations: [] },
    });

    render(<ExplorePage />);

    await waitFor(() => {
      expect(screen.getByText("Jelajah & Rekomendasi Kampus")).toBeInTheDocument();
    });

    const postinganTab = screen.getByText("Postingan & Rekrutmen");
    fireEvent.click(postinganTab);

    // AI recommendation spotlight should NOT show in Postingan tab
    expect(screen.queryByText("AI Matchmaker Engine")).not.toBeInTheDocument();

    const portofolioTab = screen.getByText("Portofolio Karya");
    fireEvent.click(portofolioTab);

    expect(screen.queryByText("AI Matchmaker Engine")).not.toBeInTheDocument();
  });
});
