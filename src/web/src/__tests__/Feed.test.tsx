import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreatePostCard } from "@/components/features/CreatePostCard";
import { PostCard, PostViewModel } from "@/components/features/PostCard";
import HomePage from "@/app/(app)/home/page";
import { apiClient } from "@/lib/api";

// Mock AuthContext
const mockCurrentUser = {
  id: 101,
  nim: "24060122140001",
  nama: "Rifqi Mahasiswa",
  email: "rifqi@campus.ac.id",
  role: "mahasiswa",
  jurusan: "Teknik Informatika",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    role: "mahasiswa",
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

// Mock apiClient
vi.mock("@/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("M05 Feed & Post Creation Frontend Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CreatePostCard", () => {
    it("renders create post form and disables submit button when content is empty", () => {
      render(<CreatePostCard />);

      expect(screen.getByText("Rifqi Mahasiswa")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Bagikan progres riset/i)).toBeInTheDocument();
      const submitBtn = screen.getByRole("button", { name: /Publikasikan/i });
      expect(submitBtn).toBeDisabled();
    });

    it("enables submit button when valid text is typed for general post", () => {
      render(<CreatePostCard />);

      const textarea = screen.getByPlaceholderText(/Bagikan progres riset/i);
      fireEvent.change(textarea, { target: { value: "Halo dunia kampus!" } });

      const submitBtn = screen.getByRole("button", { name: /Publikasikan/i });
      expect(submitBtn).toBeEnabled();
    });

    it("displays skill selector and requires skills when 'Cari Tim' type is selected", () => {
      render(<CreatePostCard />);

      const cariTimBtn = screen.getByRole("button", { name: /Cari Tim/i });
      fireEvent.click(cariTimBtn);

      expect(screen.getByText(/Keahlian yang Dibutuhkan/i)).toBeInTheDocument();
      // Submit should be disabled until at least 1 skill is selected
      const textarea = screen.getByPlaceholderText(/Jelaskan proyek lomba/i);
      fireEvent.change(textarea, { target: { value: "Mencari rekan tim lomba" } });

      const submitBtn = screen.getByRole("button", { name: /Publikasikan/i });
      expect(submitBtn).toBeDisabled();
    });
  });

  describe("PostCard", () => {
    const mockPostGeneral: PostViewModel = {
      id: 1,
      author_id: 101,
      author_name: "Budi Santoso",
      author_jurusan: "Teknik Informatika",
      author_avatar: null,
      konten: "Proyek Smart Campus Assistant dengan LLM",
      created_at: new Date().toISOString(),
      tipe: "umum",
      status: "tayang",
      likes_count: 5,
      comments_count: 2,
      is_owner: false,
    };

    const mockPostRecruiting: PostViewModel = {
      id: 2,
      author_id: 102,
      author_name: "Nadia Pramudita",
      author_jurusan: "Ilmu Komputer",
      konten: "Mencari 1 UI/UX Designer untuk Gemastik 2026",
      created_at: new Date().toISOString(),
      tipe: "cari_anggota",
      status: "tayang",
      skills: [
        { skill_id: 1, nama: "Figma", tipe: "skill" },
        { skill_id: 2, nama: "Flutter", tipe: "skill" },
      ],
      is_owner: false,
    };

    it("renders general post with 2-char initials and action counts", () => {
      render(<PostCard post={mockPostGeneral} />);

      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
      expect(screen.getByText("BS")).toBeInTheDocument(); // 2-char initial
      expect(screen.getByText("Proyek Smart Campus Assistant dengan LLM")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders recruitment badge and required skill chips for recruiting posts", () => {
      render(<PostCard post={mockPostRecruiting} />);

      expect(screen.getByText("Nadia Pramudita")).toBeInTheDocument();
      expect(screen.getByText("Cari Anggota Tim")).toBeInTheDocument();
      expect(screen.getByText("Figma")).toBeInTheDocument();
      expect(screen.getByText("Flutter")).toBeInTheDocument();
      expect(screen.getByText("Terbuka untuk Kolaborasi")).toBeInTheDocument();
    });

    it("renders moderation note alert when viewed by owner", () => {
      const ownerPostWithNote: PostViewModel = {
        ...mockPostGeneral,
        is_owner: true,
        status: "menunggu_review",
        moderation_note: "Konten sedang diverifikasi oleh admin prodi",
      };

      render(<PostCard post={ownerPostWithNote} />);

      expect(screen.getByText(/Catatan Moderasi:/i)).toBeInTheDocument();
      expect(screen.getByText("Konten sedang diverifikasi oleh admin prodi")).toBeInTheDocument();
      expect(screen.getByText(/menunggu review/i)).toBeInTheDocument();
    });
  });

  describe("HomePage Feed Integration", () => {
    it("fetches feed on mount and renders posts", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          items: [
            {
              post_id: 10,
              user_id: 201,
              author: {
                user_id: 201,
                nama: "Ahmad Fauzi Penulis",
                jurusan: "Teknik Informatika",
                angkatan: 2022,
                role: "mahasiswa",
              },
              isi: "Feed Postingan Pertama",
              gambar_url: null,
              tipe: "umum",
              status: "tayang",
              is_deleted: false,
              created_at: new Date().toISOString(),
              skills: [],
              moderation_note: null,
              is_owner: false,
              can_takedown: false,
              can_report: true,
              can_edit: false,
            },
          ],
          has_more: false,
          next_cursor: null,
        },
      });

      render(<HomePage />);

      expect(await screen.findByText("Feed Postingan Pertama")).toBeInTheDocument();
      expect(screen.getByText("Ahmad Fauzi Penulis")).toBeInTheDocument();
    });

    it("switches tabs and triggers API call with new scope", async () => {
      (apiClient.get as any)
        .mockResolvedValueOnce({
          data: { items: [], has_more: false, next_cursor: null },
        })
        .mockResolvedValueOnce({
          data: { items: [], has_more: false, next_cursor: null },
        });

      render(<HomePage />);

      const recruitingTab = screen.getByRole("button", { name: /Rekrutmen Tim/i });
      fireEvent.click(recruitingTab);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith("/posts", expect.objectContaining({
          params: expect.objectContaining({ scope: "recruiting" }),
        }));
      });
    });
  });
});
