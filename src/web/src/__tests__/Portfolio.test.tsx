import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PortfolioPage from "@/app/(app)/portfolio/page";
import PortfolioReviewPage from "@/app/(app)/portfolio/review/page";
import { apiClient } from "@/lib/api";

let mockAuthRole = "mahasiswa";

const mockCurrentUser = {
  user_id: 101,
  id: 101,
  nim: "24060122140001",
  nama: "Rama Mahasiswa",
  email: "rama@campus.ac.id",
  role: "mahasiswa",
  jurusan: "Teknik Informatika",
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockCurrentUser,
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

describe("M07 Portfolio & SKPI Verification Frontend Tests", () => {
  const mockSummary = {
    user_id: 101,
    total_poin: 4,
    total_terverifikasi: 3,
    menunggu_review: 1,
    jumlah_per_kategori: { proyek: 1, skpi: 1, sertifikat: 1, artikel_ilmiah: 1 },
    poin_per_kategori: { proyek: 0, skpi: 1, sertifikat: 1, artikel_ilmiah: 2 },
  };

  const mockItems = [
    {
      portfolio_id: 1,
      user_id: 101,
      judul: "Aplikasi Portofolio React",
      deskripsi: "Proyek mandiri web app",
      kategori: "proyek",
      status_verifikasi: "draft",
      has_file: false,
      created_at: "2026-11-01",
      skills: [{ skill_id: 1, nama: "React", kategori: "skill" }],
    },
    {
      portfolio_id: 2,
      user_id: 101,
      judul: "Sertifikat BNSP Software Architect",
      deskripsi: "Sertifikasi profesi resmi",
      kategori: "sertifikat",
      nomor_dokumen: "BNSP-12345",
      penerbit: "BNSP Indonesia",
      tanggal_terbit: "2024-05-10",
      status_verifikasi: "menunggu_review",
      has_file: true,
      file_url: "101/cert.pdf",
      created_at: "2026-11-02",
      skills: [],
    },
    {
      portfolio_id: 3,
      user_id: 101,
      judul: "Capaian Juara 1 Gemastik",
      kategori: "skpi",
      nomor_dokumen: "SKPI-9999",
      penerbit: "Puspresnas",
      status_verifikasi: "terverifikasi",
      has_file: true,
      file_url: "101/skpi.pdf",
      created_at: "2026-11-03",
      skills: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRole = "mahasiswa";
  });

  describe("PortfolioPage", () => {
    it("renders SKPI summary widgets and items correctly", async () => {
      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url.includes("/portfolio?user_id=")) {
          return Promise.resolve({ data: mockItems }) as any;
        }
        if (url.includes("/skpi-summary")) {
          return Promise.resolve({ data: mockSummary }) as any;
        }
        return Promise.resolve({ data: [] }) as any;
      });

      render(<PortfolioPage />);

      await waitFor(() => {
        expect(screen.getByText(/Portofolio & Rekam SKPI/i)).toBeInTheDocument();
        expect(screen.getByText("4 Poin")).toBeInTheDocument();
        expect(screen.getByText("3 Berkas")).toBeInTheDocument();
        expect(screen.getByText(/1 Pengajuan/i)).toBeInTheDocument();
        expect(screen.getByText("Aplikasi Portofolio React")).toBeInTheDocument();
        expect(screen.getByText("Sertifikat BNSP Software Architect")).toBeInTheDocument();
        expect(screen.getByText("Capaian Juara 1 Gemastik")).toBeInTheDocument();
      });
    });

    it("handles popup blocker safe document viewing", async () => {
      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url.includes("/portfolio?user_id=")) {
          return Promise.resolve({ data: mockItems }) as any;
        }
        if (url.includes("/skpi-summary")) {
          return Promise.resolve({ data: mockSummary }) as any;
        }
        if (url.includes("/portfolio/2/file")) {
          return Promise.resolve({
            data: { signed_url: "https://storage.campus.ac.id/signed?token=abc" },
          }) as any;
        }
        return Promise.resolve({ data: [] }) as any;
      });

      const mockWindow = { location: { href: "" }, close: vi.fn() };
      const windowOpenSpy = vi.spyOn(window, "open").mockReturnValue(mockWindow as any);

      render(<PortfolioPage />);

      await waitFor(() => {
        expect(screen.getByText("Sertifikat BNSP Software Architect")).toBeInTheDocument();
      });

      const viewDocButtons = screen.getAllByRole("button", { name: /Lihat Dokumen/i });
      fireEvent.click(viewDocButtons[0]);

      expect(windowOpenSpy).toHaveBeenCalledWith("about:blank", "_blank");
      await waitFor(() => {
        expect(mockWindow.location.href).toBe("https://storage.campus.ac.id/signed?token=abc");
      });

      windowOpenSpy.mockRestore();
    });

    it("triggers withdraw review action", async () => {
      vi.mocked(apiClient.get).mockImplementation((url: string) => {
        if (url.includes("/portfolio?user_id=")) {
          return Promise.resolve({ data: mockItems }) as any;
        }
        if (url.includes("/skpi-summary")) {
          return Promise.resolve({ data: mockSummary }) as any;
        }
        return Promise.resolve({ data: [] }) as any;
      });
      vi.mocked(apiClient.post).mockResolvedValue({ data: { status_verifikasi: "draft" } } as any);

      render(<PortfolioPage />);

      await waitFor(() => {
        expect(screen.getByText("Tarik Pengajuan")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Tarik Pengajuan"));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith("/portfolio/2/withdraw");
        expect(mockToast.info).toHaveBeenCalledWith(expect.stringContaining("ditarik"));
      });
    });
  });

  describe("PortfolioReviewPage", () => {
    beforeEach(() => {
      mockAuthRole = "moderator";
    });

    const mockQueue = [
      {
        portfolio_id: 201,
        user_id: 102,
        judul: "Sertifikasi Cisco CCNA",
        deskripsi: "Lulus sertifikasi jaringan internasional",
        kategori: "sertifikat",
        nomor_dokumen: "CCNA-9988",
        penerbit: "Cisco Systems",
        tanggal_terbit: "2024-06-01",
        file_url: "102/ccna.pdf",
        has_file: true,
        status_verifikasi: "menunggu_review",
        submitted_at: "2026-11-04T10:00:00Z",
        created_at: "2026-11-04T09:00:00Z",
        author_nama: "Dewi Lestari",
        author_nim: "2023001005",
        author_jurusan: "Teknik Informatika",
        is_duplicate_dokumen: true,
        skills: [],
      },
    ];

    it("renders review queue with duplicate badge and submits approval", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { items: mockQueue, total: 1, jurusan: "Teknik Informatika" },
      } as any);
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { status_verifikasi: "terverifikasi" },
      } as any);

      render(<PortfolioReviewPage />);

      await waitFor(() => {
        expect(screen.getByText("Antrean Verifikasi Portofolio SKPI")).toBeInTheDocument();
        expect(screen.getByText("Prodi Teknik Informatika")).toBeInTheDocument();
        expect(screen.getByText("Sertifikasi Cisco CCNA")).toBeInTheDocument();
        expect(screen.getByText(/Duplikasi Terdeteksi/i)).toBeInTheDocument();
      });

      // Click Tinjau Berkas
      fireEvent.click(screen.getByRole("button", { name: /Tinjau Berkas/i }));

      // Modal opens
      await waitFor(() => {
        expect(screen.getByText("Keputusan Verifikasi SKPI")).toBeInTheDocument();
        expect(screen.getByText("Konfirmasi Setujui")).toBeInTheDocument();
      });

      // Submit form
      const submitBtn = screen.getByText("Konfirmasi Setujui");
      const form = submitBtn.closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(apiClient.patch).toHaveBeenCalledWith(
          "/portfolio/201/review",
          expect.objectContaining({
            status_verifikasi: "terverifikasi",
          })
        );
        expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining("berhasil diverifikasi"));
      });
    });
  });
});
