import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { apiClient } from "@/lib/api";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  usePathname: () => "/home",
}));

const mockUser = {
  user_id: 101,
  id: 101,
  nama: "Siti Rahma",
  email: "siti@campus.ac.id",
  role: "mahasiswa",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    role: "mahasiswa",
    isAuthenticated: true,
  }),
}));

vi.mock("@/lib/api", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("M08 / US-10 NotificationDropdown Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/notifications/unread-count") {
        return Promise.resolve({ data: { unread_count: 3 } });
      }
      if (url === "/notifications") {
        return Promise.resolve({
          data: [
            {
              notification_id: 1,
              user_id: 101,
              jenis: "moderasi_disetujui",
              judul: "Postingan Disetujui",
              isi: "Postingan riset Anda kini telah tayang.",
              tautan: "/posts/1",
              is_read: false,
              created_at: new Date().toISOString(),
            },
            {
              notification_id: 2,
              user_id: 101,
              jenis: "skpi_ditolak",
              judul: "Pengajuan SKPI Ditolak",
              isi: "Sertifikat tidak terbaca jelas.",
              tautan: "/portfolio",
              is_read: false,
              created_at: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              notification_id: 3,
              user_id: 101,
              jenis: "laporan_selesai",
              judul: "Laporan Selesai",
              isi: "Terima kasih atas laporannya.",
              tautan: null,
              is_read: true,
              created_at: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });
    (apiClient.patch as any).mockResolvedValue({ data: { updated_count: 3 } });
  });

  it("renders trigger button with unread count badge", async () => {
    render(<NotificationDropdown />);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/notifications/unread-count");
    });

    const badge = await screen.findByTestId("notification-badge");
    expect(badge).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /3 notifikasi belum dibaca/i })).toBeInTheDocument();
  });

  it("caps badge display at 99+ for counts exceeding 99", async () => {
    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/notifications/unread-count") {
        return Promise.resolve({ data: { unread_count: 142 } });
      }
      return Promise.resolve({ data: [] });
    });

    render(<NotificationDropdown />);

    const badge = await screen.findByTestId("notification-badge");
    expect(badge).toHaveTextContent("99+");
  });

  it("opens dropdown panel on click and displays notification items with semantic styles", async () => {
    render(<NotificationDropdown />);

    const trigger = screen.getByRole("button", { name: /notifikasi/i });
    fireEvent.click(trigger);

    expect(await screen.findByText("Notifikasi")).toBeInTheDocument();
    expect(screen.getByText("Postingan Disetujui")).toBeInTheDocument();
    expect(screen.getByText("Pengajuan SKPI Ditolak")).toBeInTheDocument();
    expect(screen.getByText("Laporan Selesai")).toBeInTheDocument();
  });

  it("closes dropdown panel on Escape key", async () => {
    render(<NotificationDropdown />);

    const trigger = screen.getByRole("button", { name: /notifikasi/i });
    fireEvent.click(trigger);

    expect(await screen.findByText("Notifikasi")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Notifikasi")).not.toBeInTheDocument();
    });
  });

  it("marks all notifications as read when clicking Tandai Semua Dibaca", async () => {
    render(<NotificationDropdown />);

    const trigger = screen.getByRole("button", { name: /notifikasi/i });
    fireEvent.click(trigger);

    const markAllBtn = await screen.findByRole("button", { name: /Tandai Semua Dibaca/i });
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith("/notifications/read-all");
    });

    // Badge should disappear once count is 0
    await waitFor(() => {
      expect(screen.queryByTestId("notification-badge")).not.toBeInTheDocument();
    });
  });

  it("marks individual notification as read and navigates on item click", async () => {
    render(<NotificationDropdown />);

    const trigger = screen.getByRole("button", { name: /notifikasi/i });
    fireEvent.click(trigger);

    const unreadItem = await screen.findByText("Postingan Disetujui");
    fireEvent.click(unreadItem);

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith("/notifications/1/read");
      expect(mockRouterPush).toHaveBeenCalledWith("/posts/1");
    });
  });
});
