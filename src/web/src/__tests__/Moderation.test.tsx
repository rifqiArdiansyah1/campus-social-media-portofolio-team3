import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ModerationAuditPage from "@/app/(app)/moderation/page";
import { ReportPostModal } from "@/components/features/ReportPostModal";
import { TakedownPostModal } from "@/components/features/TakedownPostModal";
import { apiClient } from "@/lib/api";

let mockAuthRole = "moderator";

const mockStaffUser = {
  user_id: 201,
  id: 201,
  nim: "198501012010121001",
  nama: "Dr. Budi (Kaprodi TI)",
  email: "kaprodi.ti@campus.ac.id",
  role: "moderator",
  jurusan: "Teknik Informatika",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockStaffUser,
    role: mockAuthRole,
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
    delete: vi.fn(),
  },
}));

describe("M08 Moderation & Reports Frontend Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRole = "moderator";
  });

  it("restricts access for unauthorized role (mahasiswa)", async () => {
    mockAuthRole = "mahasiswa";
    render(<ModerationAuditPage />);

    expect(screen.getByText("Akses Dibatasi")).toBeInTheDocument();
    expect(
      screen.getByText(/Halaman moderasi hanya dapat diakses oleh Kaprodi/i)
    ).toBeInTheDocument();
  });

  it("loads summary counters and AI triage queue for authorized staff", async () => {
    mockAuthRole = "moderator";

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/moderation/summary") {
        return Promise.resolve({
          data: { post_menunggu: 2, laporan_baru: 1, portofolio_menunggu: 3 },
        });
      }
      if (url === "/moderation/queue") {
        return Promise.resolve({
          data: [
            {
              post_id: 10,
              user_id: 101,
              author_name: "Mahasiswa A",
              author_jurusan: "Teknik Informatika",
              isi: "Konten yang terindikasi melanggar oleh AI.",
              gambar_url: null,
              tipe: "umum",
              status: "menunggu_review",
              created_at: "2026-11-09T08:00:00Z",
              label_ai: "berpotensi_melanggar",
              confidence: 0.94,
              penjelasan_ai: "Deteksi kata kasar",
              jumlah_laporan_aktif: 1,
              kategori_laporan: ["ujaran_kebencian"],
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(<ModerationAuditPage />);

    await waitFor(() => {
      expect(screen.getByText("Tata Kelola & Moderasi Konten")).toBeInTheDocument();
    });

    expect(await screen.findByText("Saran AI: Berpotensi Melanggar (94%)")).toBeInTheDocument();
    expect(screen.getByText("Mahasiswa A")).toBeInTheDocument();
    expect(screen.getByText(/Deteksi kata kasar/i)).toBeInTheDocument();
    expect(screen.getByText("1 Laporan Aktif")).toBeInTheDocument();
  });

  it("executes moderation approval decision with modal", async () => {
    mockAuthRole = "moderator";

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/moderation/summary") {
        return Promise.resolve({
          data: { post_menunggu: 1, laporan_baru: 0, portofolio_menunggu: 0 },
        });
      }
      if (url === "/moderation/queue") {
        return Promise.resolve({
          data: [
            {
              post_id: 15,
              user_id: 102,
              author_name: "Mahasiswa B",
              author_jurusan: "Teknik Informatika",
              isi: "Konten diskusi tugas akhir.",
              status: "menunggu_review",
              created_at: "2026-11-09T08:00:00Z",
              label_ai: "perlu_review",
              confidence: 0.65,
              jumlah_laporan_aktif: 0,
              kategori_laporan: [],
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    (apiClient.post as any).mockResolvedValue({
      data: { message: "Disetujui", post_id: 15, status: "tayang" },
    });

    render(<ModerationAuditPage />);

    const approveBtn = await screen.findByRole("button", { name: /Setujui Tayang/i });
    fireEvent.click(approveBtn);

    expect(screen.getByText(/Konfirmasi Keputusan: setujui/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Simpan Keputusan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/moderation/15/decision",
        expect.objectContaining({ keputusan: "setujui" })
      );
    });
  });

  it("switches to reports tab and loads reports queue", async () => {
    mockAuthRole = "moderator";

    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === "/moderation/summary") {
        return Promise.resolve({
          data: { post_menunggu: 0, laporan_baru: 1, portofolio_menunggu: 0 },
        });
      }
      if (url === "/reports") {
        return Promise.resolve({
          data: [
            {
              report_id: 88,
              post_id: 20,
              pelapor_id: 105,
              pelapor_nama: "Pelapor Aktif",
              post_isi_snippet: "Kutipan postingan...",
              alasan: "Spam komersial jualan pulsa ilegal",
              kategori_laporan: "spam",
              status: "baru",
              created_at: "2026-11-09T08:30:00Z",
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(<ModerationAuditPage />);

    const reportsTab = await screen.findByRole("button", { name: /Laporan Sivitas/i });
    fireEvent.click(reportsTab);

    expect(await screen.findByText(/Laporan #88/i)).toBeInTheDocument();
    expect(screen.getByText(/Spam komersial jualan pulsa ilegal/i)).toBeInTheDocument();
    expect(screen.getByText("Pelapor Aktif")).toBeInTheDocument();
  });
});

describe("ReportPostModal & TakedownPostModal Frontend Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates minimum length and submits report", async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { report_id: 99, status: "baru" },
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ReportPostModal
        isOpen={true}
        postId={45}
        postAuthorName="Ahmad"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Laporkan Postingan")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Jelaskan secara spesifik/i);
    const submitBtn = screen.getByRole("button", { name: /Kirim Laporan/i });

    // Disabled when too short (< 5 chars)
    fireEvent.change(textarea, { target: { value: "abc" } });
    expect(submitBtn).toBeDisabled();

    // Enabled when valid
    fireEvent.change(textarea, {
      target: { value: "Konten memuat tautan berbahaya phising." },
    });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/reports", {
        post_id: 45,
        kategori_laporan: "konten_tidak_pantas",
        alasan: "Konten memuat tautan berbahaya phising.",
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("submits staff takedown with reason", async () => {
    (apiClient.post as any).mockResolvedValue({
      data: { message: "Takedown sukses", post_id: 50 },
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <TakedownPostModal
        isOpen={true}
        postId={50}
        postAuthorName="Budi"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Takedown Postingan")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Tuliskan pelanggaran pasal/i);
    const submitBtn = screen.getByRole("button", { name: /Takedown Sekarang/i });

    fireEvent.change(textarea, {
      target: { value: "Pelanggaran etika berat pasal 4 tata tertib mahasiswa." },
    });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/posts/50/takedown", {
        alasan_hapus: "Pelanggaran etika berat pasal 4 tata tertib mahasiswa.",
      });
      expect(onSuccess).toHaveBeenCalledWith(50);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
