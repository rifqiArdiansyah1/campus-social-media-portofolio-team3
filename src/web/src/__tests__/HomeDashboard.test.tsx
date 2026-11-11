import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/app/(app)/home/page";
import { apiClient } from "@/lib/api";

let mockCurrentUser: any = {
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
    user: mockCurrentUser,
    role: mockCurrentUser?.role || "mahasiswa",
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
    patch: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("M11 Home Dashboard Integration Tests (/home)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = {
      user_id: 101,
      id: 101,
      nim: "2021001",
      nama: "Siswa Pengguna",
      email: "siswa@univ.ac.id",
      role: "mahasiswa",
      jurusan: "Teknik Informatika",
    };
  });

  it("renders student home dashboard with SKPI widget, Mini AI peers, friend requests, and feed", async () => {
    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/dashboard/summary") {
        return Promise.resolve({
          data: {
            summary: {
              role: "mahasiswa",
              total_skpi_poin: 12,
              total_portofolio_terverifikasi: 3,
              total_portofolio_menunggu: 1,
              total_portofolio_perlu_revisi: 1,
              pending_friend_requests: 1,
              unread_notifications_count: 2,
              recent_verified_portfolios: [
                {
                  portfolio_id: 55,
                  judul: "Juara 1 Hackathon Nasional",
                  kategori: "juara_1",
                  created_at: "2026-11-10T00:00:00Z",
                },
              ],
            },
          },
        });
      }
      if (url === "/friendships") {
        return Promise.resolve({
          data: {
            items: [
              {
                friendship_id: 10,
                counterpart: {
                  user_id: 205,
                  nama: "Budi Santoso",
                  jurusan: "Teknik Informatika",
                  avatar_url: null,
                },
                created_at: "2026-11-10T00:00:00Z",
              },
            ],
          },
        });
      }
      if (url === "/posts") {
        return Promise.resolve({
          data: {
            items: [
              {
                post_id: 1,
                user_id: 101,
                author: {
                  user_id: 101,
                  nama: "Siswa Pengguna",
                  jurusan: "Teknik Informatika",
                  angkatan: 2021,
                  role: "mahasiswa",
                },
                isi: "Postingan kolaborasi publik",
                gambar_url: null,
                tipe: "umum",
                status: "tayang",
                is_deleted: false,
                created_at: "2026-11-10T00:00:00Z",
                skills: [],
                moderation_note: null,
                is_owner: true,
                can_takedown: false,
                can_report: false,
                can_edit: true,
              },
            ],
            has_more: false,
            next_cursor: null,
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    (apiClient.post as any).mockImplementation((url: string) => {
      if (url === "/recommendations/match") {
        return Promise.resolve({
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
                reason: "Melengkapi keahlian Anda",
              },
            ],
          },
        });
      }
      return Promise.reject(new Error(`Unhandled POST: ${url}`));
    });

    renderWithClient(<HomePage />);

    // 1. Verify Greeting & Student Tabs (Semua, Prodi Saya, Teman, Rekrutmen Tim)
    expect(screen.getByText(/Halo, Siswa Pengguna!/i)).toBeInTheDocument();
    expect(screen.getByText("Semua")).toBeInTheDocument();
    expect(screen.getByText("Prodi Saya")).toBeInTheDocument();
    expect(screen.getByText("Teman")).toBeInTheDocument();
    expect(screen.getByText("Rekrutmen Tim")).toBeInTheDocument();

    // 2. Verify Unread Notifications Pill & SKPI Summary Widget
    await waitFor(() => {
      expect(screen.getByTestId("student-unread-notifs-pill")).toHaveTextContent("2 Notifikasi Baru");
      expect(screen.getByTestId("skpi-total-points")).toHaveTextContent("12");
      expect(screen.getByTestId("skpi-revision-alert")).toBeInTheDocument();
      expect(screen.getByText("Juara 1 Hackathon Nasional")).toBeInTheDocument();
      const addPortLink = screen.getByRole("link", { name: /\+ Tambah Karya Portofolio/i });
      expect(addPortLink).toHaveAttribute("href", "/portfolio");
    });

    // 3. Verify Mini AI Recommendation Widget
    await waitFor(() => {
      expect(screen.getByTestId("mini-ai-rec-202")).toBeInTheDocument();
      expect(screen.getByTestId("match-badge-202")).toHaveTextContent("92% Cocok");
      expect(screen.getByText("Rian Pratama")).toBeInTheDocument();
    });

    // 4. Verify Friend Requests Widget
    await waitFor(() => {
      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    });

    // 5. Staff Alert Banner should NOT exist for student
    expect(screen.queryByLabelText("Pusat Antrean Moderasi Program Studi")).not.toBeInTheDocument();
  });

  it("renders moderator dashboard with review alert banner and prodi filter tab, hiding student-only widgets", async () => {
    mockCurrentUser = {
      user_id: 50,
      id: 50,
      nim: "KAPRODI-01",
      nama: "Dr. Hendra, M.Kom",
      email: "kaprodi@univ.ac.id",
      role: "moderator",
      jurusan: "Teknik Informatika",
    };

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/dashboard/summary") {
        return Promise.resolve({
          data: {
            summary: {
              role: "moderator",
              jurusan: "Teknik Informatika",
              is_jurusan_configured: true,
              pending_posts: 3,
              pending_reports: 2,
              pending_portfolio_reviews: 5,
            },
          },
        });
      }
      if (url === "/posts") {
        return Promise.resolve({
          data: {
            items: [],
            has_more: false,
            next_cursor: null,
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    renderWithClient(<HomePage />);

    // 1. Verify Moderator Greeting & Tabs
    expect(screen.getByText(/Panel Program Studi/i)).toBeInTheDocument();
    expect(screen.getByText("Prodi Saya")).toBeInTheDocument();
    expect(screen.queryByText("Teman")).not.toBeInTheDocument();

    // 2. Verify Review Alert Banner
    await waitFor(() => {
      expect(screen.getByText("Antrean Program Studi: Teknik Informatika")).toBeInTheDocument();
      expect(screen.getByTestId("badge-pending-posts")).toHaveTextContent("3");
      expect(screen.getByTestId("badge-pending-reports")).toHaveTextContent("2");
      expect(screen.getByTestId("badge-pending-portfolios")).toHaveTextContent("5");
    });

    // 3. Verify student-only widgets are completely excluded for moderator
    expect(screen.queryByLabelText("Ringkasan Portofolio SKPI Mahasiswa")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Rekomendasi Kolaborator AI")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Permohonan Pertemanan")).not.toBeInTheDocument();
    expect(screen.getByText("Pintasan Staf & Verifikasi")).toBeInTheDocument();
  });

  it("renders unconfigured warning banner when moderator has no assigned jurusan", async () => {
    mockCurrentUser = {
      user_id: 51,
      id: 51,
      nim: "KAPRODI-02",
      nama: "Dr. Baru",
      email: "kaprodi_baru@univ.ac.id",
      role: "moderator",
      jurusan: null,
    };

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/dashboard/summary") {
        return Promise.resolve({
          data: {
            summary: {
              role: "moderator",
              jurusan: null,
              is_jurusan_configured: false,
              pending_posts: 0,
              pending_reports: 0,
              pending_portfolio_reviews: 0,
            },
          },
        });
      }
      if (url === "/posts") {
        return Promise.resolve({ data: { items: [], has_more: false, next_cursor: null } });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    renderWithClient(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Program Studi Belum Dikonfigurasi")).toBeInTheDocument();
    });
  });

  it("renders admin dashboard with campus-wide metrics overview", async () => {
    mockCurrentUser = {
      user_id: 1,
      id: 1,
      nim: "ADMIN-01",
      nama: "Admin Kemahasiswaan",
      email: "admin@univ.ac.id",
      role: "admin",
      jurusan: null,
    };

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/dashboard/summary") {
        return Promise.resolve({
          data: {
            summary: {
              role: "admin",
              total_mahasiswa: 1250,
              total_portofolio_terverifikasi: 480,
              pending_posts: 4,
              pending_reports: 3,
              pending_portfolio_reviews: 9,
              total_takedown: 14,
            },
          },
        });
      }
      if (url === "/posts") {
        return Promise.resolve({ data: { items: [], has_more: false, next_cursor: null } });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    renderWithClient(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Pusat Kendali Kemahasiswaan (Seluruh Kampus)")).toBeInTheDocument();
      expect(screen.getByText("1250")).toBeInTheDocument();
      expect(screen.getByText("480")).toBeInTheDocument();
      expect(screen.getByText("14")).toBeInTheDocument();
    });
  });

  it("handles interactions: sends friend request and submits feedback in Mini AI widget", async () => {
    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/dashboard/summary") {
        return Promise.resolve({
          data: {
            summary: {
              role: "mahasiswa",
              total_skpi_poin: 4,
              total_portofolio_terverifikasi: 1,
              total_portofolio_menunggu: 0,
              total_portofolio_perlu_revisi: 0,
              pending_friend_requests: 0,
              unread_notifications_count: 0,
              recent_verified_portfolios: [],
            },
          },
        });
      }
      if (url === "/friendships") {
        return Promise.resolve({ data: { items: [] } });
      }
      if (url === "/posts") {
        return Promise.resolve({ data: { items: [], has_more: false, next_cursor: null } });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });

    (apiClient.post as any).mockImplementation((url: string) => {
      if (url === "/recommendations/match") {
        return Promise.resolve({
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
                score: 0.95,
                matched_terms: ["AI", "Python"],
                complementary_skills: ["Figma"],
                reason: "Cocok untuk proyek AI",
              },
            ],
          },
        });
      }
      if (url === "/friendships") {
        return Promise.resolve({ data: { friendship_id: 99, status: "menunggu" } });
      }
      if (url === "/recommendations/88/feedback") {
        return Promise.resolve({ data: { detail: "Sukses", rec_id: 88, umpan_balik: "tidak_relevan" } });
      }
      return Promise.reject(new Error(`Unhandled POST: ${url}`));
    });

    renderWithClient(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Rian Pratama")).toBeInTheDocument();
    });

    // 1. Send friend request via Mini AI Widget
    const addBtn = screen.getByTestId("btn-add-friend-202");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/friendships", { addressee_id: 202 });
      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining("Rian Pratama"));
      expect(screen.getByText("Terkirim")).toBeInTheDocument();
    });

    // 2. Submit "Kurang Relevan" feedback
    const feedbackBtn = screen.getByTitle("Tandai kurang relevan");
    fireEvent.click(feedbackBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/recommendations/88/feedback", { umpan_balik: "tidak_relevan" });
      expect(mockToast.info).toHaveBeenCalledWith(expect.stringContaining("Masukan Anda telah dicatat"));
      expect(screen.queryByText("Rian Pratama")).not.toBeInTheDocument();
    });
  });
});
