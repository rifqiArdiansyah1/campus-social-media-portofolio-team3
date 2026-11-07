import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FriendRequestWidget, FriendRequestItem } from "@/components/features/FriendRequestWidget";
import ProfileDetailPage from "@/app/(app)/profile/[id]/page";
import FriendsPage from "@/app/(app)/friends/page";
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

// Mock Next.js navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "202" }),
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: (key: string) => (key === "tab" ? "friends" : null),
  }),
}));

// Mock apiClient
vi.mock("@/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("M06 Friendship & Social Interactions Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FriendRequestWidget", () => {
    const mockRequests: FriendRequestItem[] = [
      {
        id: 1,
        sender_id: 301,
        sender_name: "Budi Santoso",
        sender_jurusan: "Sistem Informasi",
        sender_avatar: null,
        created_at: new Date().toISOString(),
      },
    ];

    it("renders empty state when requests list is empty", () => {
      render(
        <FriendRequestWidget
          requests={[]}
          onAccept={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByText(/Tidak ada permohonan koneksi pertemanan baru/i)).toBeInTheDocument();
    });

    it("renders incoming request items and triggers onAccept", () => {
      const handleAccept = vi.fn();
      const handleReject = vi.fn();

      render(
        <FriendRequestWidget
          requests={mockRequests}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      );

      expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
      expect(screen.getByText("Sistem Informasi")).toBeInTheDocument();

      const acceptBtn = screen.getByRole("button", { name: /Terima pertemanan dari Budi Santoso/i });
      fireEvent.click(acceptBtn);
      expect(handleAccept).toHaveBeenCalledWith(1);

      const rejectBtn = screen.getByRole("button", { name: /Tolak pertemanan dari Budi Santoso/i });
      fireEvent.click(rejectBtn);
      expect(handleReject).toHaveBeenCalledWith(1);
    });
  });

  describe("ProfileDetailPage Friendship Actions", () => {
    it("renders 'Tambah Teman' and sends friend request", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          user_id: 202,
          nama: "Budi Target",
          jurusan: "Teknik Informatika",
          angkatan: 2022,
          bio: "Halo dunia",
          kontak_url: null,
          role: "mahasiswa",
          created_at: new Date().toISOString(),
          skills: [],
          friendship_status: "none",
          friendship_id: null,
          blocked_by_me: false,
          nim: null,
          email: null,
          is_visible: true,
        },
      });

      (apiClient.post as any).mockResolvedValueOnce({
        data: {
          friendship_id: 55,
          requester_id: 101,
          addressee_id: 202,
          status: "menunggu",
        },
      });

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Budi Target")).toBeInTheDocument();
      const addFriendBtn = screen.getByRole("button", { name: /Tambah Teman/i });
      fireEvent.click(addFriendBtn);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith("/friendships", { addressee_id: 202 });
        expect(screen.getByText("Permintaan Terkirim")).toBeInTheDocument();
      });
    });

    it("renders 'Berteman' and opens unfriend dialog", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          user_id: 202,
          nama: "Budi Teman",
          jurusan: "Teknik Informatika",
          angkatan: 2022,
          bio: "Kawan karib",
          kontak_url: null,
          role: "mahasiswa",
          created_at: new Date().toISOString(),
          skills: [],
          friendship_status: "friends",
          friendship_id: 88,
          blocked_by_me: false,
          nim: null,
          email: null,
          is_visible: true,
        },
      });

      (apiClient.delete as any).mockResolvedValueOnce({});

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Berteman")).toBeInTheDocument();
      const unfriendBtn = screen.getByRole("button", { name: /Hapus Pertemanan/i });
      fireEvent.click(unfriendBtn);

      expect(screen.getByText("Putus Pertemanan?")).toBeInTheDocument();
      const confirmBtn = screen.getByRole("button", { name: "Putus Pertemanan" });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith("/friendships/88");
      });
    });

    it("renders block button and executes block in dialog", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          user_id: 202,
          nama: "Budi Pengganggu",
          jurusan: "Teknik Informatika",
          angkatan: 2022,
          bio: null,
          kontak_url: null,
          role: "mahasiswa",
          created_at: new Date().toISOString(),
          skills: [],
          friendship_status: "none",
          friendship_id: null,
          blocked_by_me: false,
          nim: null,
          email: null,
          is_visible: true,
        },
      });

      (apiClient.post as any).mockResolvedValueOnce({
        data: {
          block_id: 12,
          blocker_id: 101,
          blocked_id: 202,
        },
      });

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Budi Pengganggu")).toBeInTheDocument();
      const blockBtn = screen.getByRole("button", { name: /Blokir pengguna/i });
      fireEvent.click(blockBtn);

      expect(screen.getByText("Blokir Pengguna Ini?")).toBeInTheDocument();
      const confirmBlockBtn = screen.getByRole("button", { name: "Blokir" });
      fireEvent.click(confirmBlockBtn);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith("/blocks", { blocked_id: 202 });
        expect(screen.getByText(/Anda telah memblokir pengguna ini/i)).toBeInTheDocument();
      });
    });
  });

  describe("FriendsPage", () => {
    it("renders active friends list and tabs", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          items: [
            {
              user_id: 205,
              nama: "Siti Rahmawati",
              jurusan: "Sistem Informasi",
              angkatan: 2023,
              role: "mahasiswa",
              avatar_url: null,
            },
          ],
        },
      });

      render(<FriendsPage />);

      expect(await screen.findByText("Siti Rahmawati")).toBeInTheDocument();
      expect(screen.getByText("Sistem Informasi")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Permohonan Masuk/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Daftar Blokir/i })).toBeInTheDocument();
    });
  });
});
