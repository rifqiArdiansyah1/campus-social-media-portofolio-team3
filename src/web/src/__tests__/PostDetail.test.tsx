import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PostDetailPage from "@/app/(app)/posts/[id]/page";
import { apiClient } from "@/lib/api";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "101" }),
  useRouter: () => ({ push: mockRouterPush }),
}));

const mockUser = {
  user_id: 201,
  id: 201,
  nama: "Ahmad Rizki",
  email: "rizki@campus.ac.id",
  role: "mahasiswa",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    role: "mahasiswa",
    isAuthenticated: true,
  }),
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock("@/context/ToastContext", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Post Detail Page Tests (/posts/[id])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders post content and author information", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        post_id: 101,
        user_id: 201,
        author: {
          user_id: 201,
          nama: "Ahmad Rizki",
          jurusan: "Teknik Informatika",
          angkatan: 2022,
          role: "mahasiswa",
        },
        isi: "Hasil riset algoritma deteksi pola kampus kami.",
        gambar_url: null,
        tipe: "umum",
        status: "tayang",
        is_deleted: false,
        created_at: new Date().toISOString(),
        skills: [{ skill_id: 1, nama: "Python", tipe: "teknis" }],
        moderation_note: null,
        is_owner: true,
        can_takedown: false,
        can_report: false,
        can_edit: false,
      },
    });

    render(<PostDetailPage />);

    expect(await screen.findByText("Hasil riset algoritma deteksi pola kampus kami.")).toBeInTheDocument();
    expect(screen.getByText("Ahmad Rizki")).toBeInTheDocument();
    expect(screen.getByText("Kembali ke Beranda")).toBeInTheDocument();
  });

  it("renders prominent revision alert for author when status is revisi", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        post_id: 101,
        user_id: 201,
        author: {
          user_id: 201,
          nama: "Ahmad Rizki",
          jurusan: "Teknik Informatika",
          angkatan: 2022,
          role: "mahasiswa",
        },
        isi: "Draft artikel yang perlu perbaikan.",
        gambar_url: null,
        tipe: "umum",
        status: "revisi",
        is_deleted: false,
        created_at: new Date().toISOString(),
        skills: [],
        moderation_note: "Harap sertakan sumber referensi jurnal ilmiah.",
        is_owner: true,
        can_takedown: false,
        can_report: false,
        can_edit: true,
      },
    });

    render(<PostDetailPage />);

    expect(await screen.findByText("Permintaan Revisi dari Tim Moderasi")).toBeInTheDocument();
    const notes = screen.getAllByText("Harap sertakan sumber referensi jurnal ilmiah.");
    expect(notes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state when post is not found (404)", async () => {
    (apiClient.get as any).mockRejectedValueOnce({
      response: { status: 404 },
    });

    render(<PostDetailPage />);

    expect(await screen.findByText("Postingan Tidak Ditemukan")).toBeInTheDocument();
  });
});
