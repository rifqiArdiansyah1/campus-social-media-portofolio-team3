import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { FriendRequestWidget, FriendRequestItem } from "@/components/features/FriendRequestWidget";
import ProfileDetailPage from "@/app/(app)/profile/[id]/page";
import FriendsPage from "@/app/(app)/friends/page";
import { apiClient } from "@/lib/api";

// Mock AuthContext
const defaultStudent = {
  id: 101,
  user_id: 101,
  nim: "24060122140001",
  nama: "Rifqi Mahasiswa",
  email: "rifqi@campus.ac.id",
  role: "mahasiswa",
  jurusan: "Teknik Informatika",
};

let mockCurrentUser = { ...defaultStudent };

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    role: mockCurrentUser.role,
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
    mockCurrentUser = { ...defaultStudent };
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
          can_friend: true,
          can_block: true,
          can_unblock: false,
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
          can_friend: false,
          can_block: true,
          can_unblock: false,
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
          can_block: true,
          can_friend: true,
          can_unblock: false,
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

    it("renders unblock banner and executes unblock in dialog on blocked profile", async () => {
      let isBlocked = true;

      (apiClient.get as any).mockImplementation((url: string) => {
        if (url === "/users/202") {
          if (isBlocked) {
            return Promise.resolve({
              data: {
                user_id: 202,
                nama: "Budi Yang Diblokir",
                jurusan: null,
                angkatan: null,
                bio: null,
                kontak_url: null,
                role: "mahasiswa",
                created_at: new Date().toISOString(),
                skills: [],
                friendship_status: "blocked",
                friendship_id: null,
                blocked_by_me: true,
                can_block: false,
                can_friend: false,
                can_unblock: true,
                nim: null,
                email: null,
                is_visible: false,
              },
            });
          } else {
            return Promise.resolve({
              data: {
                user_id: 202,
                nama: "Budi Yang Diblokir",
                jurusan: "Teknik Informatika",
                angkatan: 2022,
                bio: "Sudah berdamai",
                kontak_url: null,
                role: "mahasiswa",
                created_at: new Date().toISOString(),
                skills: [],
                friendship_status: "none",
                friendship_id: null,
                blocked_by_me: false,
                can_block: true,
                can_friend: true,
                can_unblock: false,
                nim: null,
                email: null,
                is_visible: true,
              },
            });
          }
        }
        if (url.startsWith("/portfolio")) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes("/skpi-summary")) {
          return Promise.resolve({ data: null });
        }
        return Promise.resolve({ data: {} });
      });

      (apiClient.delete as any).mockImplementation(async (url: string) => {
        if (url === "/blocks/202") {
          isBlocked = false;
        }
        return { data: {} };
      });

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Budi Yang Diblokir")).toBeInTheDocument();
      expect(screen.getByText(/Anda telah memblokir pengguna ini/i)).toBeInTheDocument();

      const unblockBtn = screen.getByRole("button", { name: /Buka Blokir/i });
      fireEvent.click(unblockBtn);

      expect(screen.getByText(/Buka Blokir Budi Yang Diblokir\?/i)).toBeInTheDocument();
      const confirmUnblockBtn = within(screen.getByRole("dialog")).getByRole("button", { name: "Buka Blokir" });
      fireEvent.click(confirmUnblockBtn);

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith("/blocks/202");
        expect(screen.getByRole("button", { name: /Tambah Teman/i })).toBeInTheDocument();
      });
    });

    it("renders neutral 'Profil Tidak Tersedia' on 404 (mutual block) without action CTA", async () => {
      (apiClient.get as any).mockRejectedValueOnce({
        response: { status: 404, data: { detail: "Pengguna tidak ditemukan" } },
      });

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Profil Tidak Tersedia")).toBeInTheDocument();
      expect(screen.getByText("Profil tidak dapat ditemukan atau tidak tersedia saat ini.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Tambah Teman/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Buka Blokir/i })).not.toBeInTheDocument();
    });

    it("hides 'Tambah Teman' and renders academic supervisor badge when Kaprodi (moderator) views a student profile", async () => {
      mockCurrentUser = {
        id: 999,
        user_id: 999,
        nim: "197501011999031001",
        nama: "Dr. Budi Utomo",
        email: "kaprodi.ti@campus.ac.id",
        role: "moderator",
        jurusan: "Teknik Informatika",
      };

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
          can_friend: true,
          can_block: true,
          can_unblock: false,
          nim: null,
          email: null,
          is_visible: true,
        },
      });

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Budi Target")).toBeInTheDocument();
      // "Tambah Teman" button must NOT exist for Kaprodi
      expect(screen.queryByRole("button", { name: /Tambah Teman/i })).not.toBeInTheDocument();
      // Academic guidance badge and SKPI review quick link must be visible
      expect(screen.getByText(/Mahasiswa Bimbingan/i)).toBeInTheDocument();
      expect(screen.getByText(/Review SKPI/i)).toBeInTheDocument();
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
              friendship_id: 77,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      });

      render(<FriendsPage />);

      expect(await screen.findByText("Siti Rahmawati")).toBeInTheDocument();
      expect(screen.getByText(/Sistem Informasi/i)).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Permohonan Masuk/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Daftar Blokir/i })).toBeInTheDocument();
    });

    it("handles unblock in FriendsPage blocks tab with accessible inline action row", async () => {
      // 1. Initial friends list fetch
      (apiClient.get as any).mockResolvedValueOnce({
        data: { items: [], total: 0, page: 1, limit: 20, total_pages: 1 },
      });

      render(<FriendsPage />);

      // 2. Click "Daftar Blokir" tab
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          items: [
            {
              block_id: 88,
              blocked_id: 303,
              nama: "Andi Terblokir",
              jurusan: "Teknik Informatika",
              angkatan: 2022,
              alasan: "Spam",
              created_at: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      });

      const blocksTab = screen.getByRole("tab", { name: /Daftar Blokir/i });
      fireEvent.click(blocksTab);

      expect(await screen.findByText("Andi Terblokir")).toBeInTheDocument();
      expect(screen.getByText(/Alasan: Spam/i)).toBeInTheDocument();

      // 3. Click "Buka Blokir" button on the item
      const unblockBtn = screen.getByRole("button", { name: /Buka blokir untuk Andi Terblokir/i });
      fireEvent.click(unblockBtn);

      // 4. Confirm in dialog
      (apiClient.delete as any).mockResolvedValueOnce({});
      // Probe target profile returns 200 with can_friend: true
      (apiClient.get as any).mockResolvedValueOnce({
        data: { can_friend: true },
      });

      const confirmBtn = screen.getByRole("button", { name: "Buka Blokir" });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(apiClient.delete).toHaveBeenCalledWith("/blocks/303");
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.getByText(/Blokir terhadap/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Kirim Permintaan Teman/i })).toBeInTheDocument();
      });
    });
  });
});
