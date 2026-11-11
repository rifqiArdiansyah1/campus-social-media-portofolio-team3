import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("M05 Feed & Post Creation Frontend Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CreatePostCard", () => {
    it("renders textarea, type selector, and image dropzone", () => {
      render(<CreatePostCard onPostCreated={vi.fn()} />);

      expect(
        screen.getByPlaceholderText(/Bagikan progres riset/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Umum/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cari Tim/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Foto/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Publikasikan/i })).toBeInTheDocument();
    });

    it("disables submit button and shows required skill indicator when type is 'cari_anggota'", () => {
      render(<CreatePostCard onPostCreated={vi.fn()} />);

      const textarea = screen.getByPlaceholderText(/Bagikan progres riset/i);
      fireEvent.change(textarea, { target: { value: "Mencari frontend developer React" } });

      const cariTimBtn = screen.getByRole("button", { name: /Cari Tim/i });
      fireEvent.click(cariTimBtn);

      const submitBtn = screen.getByRole("button", { name: /Publikasikan/i });
      expect(submitBtn).toBeDisabled();
      expect(screen.getByText(/Keahlian yang Dibutuhkan/i)).toBeInTheDocument();
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe("PostCard", () => {
    const mockPost: PostViewModel = {
      id: 1,
      author_id: 101,
      author_name: "Rifqi Mahasiswa",
      author_jurusan: "Teknik Informatika",
      author_avatar: null,
      konten: "Membangun sistem portofolio terpadu untuk kampus.",
      media_url: "https://example.com/post-images/101/test.jpg",
      created_at: new Date().toISOString(),
      tipe: "cari_anggota",
      status: "tayang",
      skills: [
        { skill_id: 10, nama: "React", tipe: "skill" },
        { skill_id: 11, nama: "FastAPI", tipe: "skill" },
      ],
      moderation_note: null,
      is_owner: true,
      can_takedown: false,
      can_report: false,
      can_delete: false,
      can_edit: true,
      likes_count: 5,
      comments_count: 2,
      is_liked: false,
    };

    it("renders post author, content, image, skills, and recruiting badge", () => {
      render(
        <PostCard
          post={mockPost}
          onLike={vi.fn()}
          onComment={vi.fn()}
          onTakedown={vi.fn()}
          onReport={vi.fn()}
          onEdit={vi.fn()}
        />
      );

      expect(screen.getByText("Rifqi Mahasiswa")).toBeInTheDocument();
      expect(screen.getByText("Teknik Informatika")).toBeInTheDocument();
      expect(screen.getByText(/Membangun sistem portofolio terpadu/i)).toBeInTheDocument();
      expect(screen.getByText("Cari Anggota Tim")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("FastAPI")).toBeInTheDocument();
    });

    it("calls onLike when like button is clicked", () => {
      const handleLike = vi.fn();
      render(
        <PostCard
          post={mockPost}
          onLike={handleLike}
          onComment={vi.fn()}
          onTakedown={vi.fn()}
          onReport={vi.fn()}
          onEdit={vi.fn()}
        />
      );

      const likeBtn = screen.getByRole("button", { name: /Sukai postingan/i });
      fireEvent.click(likeBtn);

      expect(handleLike).toHaveBeenCalledWith(1);
    });

    it("renders edit menu item when is_owner and can_edit is true", async () => {
      const handleEdit = vi.fn();
      const editablePost = { ...mockPost, is_owner: true, can_edit: true };

      render(
        <PostCard
          post={editablePost}
          onLike={vi.fn()}
          onComment={vi.fn()}
          onTakedown={vi.fn()}
          onReport={vi.fn()}
          onEdit={handleEdit}
        />
      );

      // Open options dropdown menu
      const menuBtn = screen.getByRole("button", { name: /Opsi postingan/i });
      fireEvent.click(menuBtn);

      const editBtn = await screen.findByRole("menuitem", { name: /Edit Postingan/i });
      expect(editBtn).toBeInTheDocument();

      fireEvent.click(editBtn);

      expect(handleEdit).toHaveBeenCalledWith(editablePost);
    });
  });

  describe("HomePage Feed Integration", () => {
    it("fetches feed on mount and renders posts", async () => {
      (apiClient.get as any).mockImplementation((url: string) => {
        if (url === "/friendships") {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.resolve({
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
      });

      renderWithClient(<HomePage />);

      expect(await screen.findByText("Feed Postingan Pertama")).toBeInTheDocument();
      expect(screen.getByText("Ahmad Fauzi Penulis")).toBeInTheDocument();
    });

    it("switches tabs and triggers API call with new scope", async () => {
      (apiClient.get as any).mockImplementation((url: string) => {
        if (url === "/friendships") {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.resolve({
          data: { items: [], has_more: false, next_cursor: null },
        });
      });

      renderWithClient(<HomePage />);

      const recruitingTab = screen.getByRole("button", { name: /Rekrutmen Tim/i });
      fireEvent.click(recruitingTab);

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          "/posts",
          expect.objectContaining({
            params: expect.objectContaining({ scope: "recruiting" }),
          })
        );
      });
    });
  });
});
