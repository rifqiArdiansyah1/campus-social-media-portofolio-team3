import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SkillSelector, SelectedSkill } from "@/components/features/SkillSelector";
import ProfileDetailPage from "@/app/(app)/profile/[id]/page";
import ProfileEditPage from "@/app/(app)/profile/edit/page";
import { apiClient } from "@/lib/api";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

// Mock AuthContext
const mockCurrentUser = {
  id: 1,
  nim: "12345678",
  nama: "Rifqi Mahasiswa",
  email: "rifqi@campus.ac.id",
  role: "mahasiswa",
  jurusan: "Teknik Informatika",
};

vi.mock("@context/AuthContext", () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    refreshUser: vi.fn(),
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    refreshUser: vi.fn(),
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
    patch: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe("M04 Profile & Skills Frontend Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SkillSelector", () => {
    const initialSkills: SelectedSkill[] = [
      { skill_id: 1, nama: "React.js", tipe: "skill", level: "mahir" },
      { skill_id: 2, nama: "UI Design", tipe: "minat", level: "menengah" },
    ];

    it("renders initial selected skills and quota counter", () => {
      render(
        <SkillSelector
          value={initialSkills}
          onChange={vi.fn()}
          maxSkills={20}
        />
      );

      expect(screen.getByText("React.js")).toBeInTheDocument();
      expect(screen.getByText("UI Design")).toBeInTheDocument();
      expect(screen.getByText("2 / 20")).toBeInTheDocument();
    });

    it("allows removing a skill via remove button", () => {
      const handleChange = vi.fn();
      render(
        <SkillSelector
          value={initialSkills}
          onChange={handleChange}
          maxSkills={20}
        />
      );

      const removeBtn = screen.getByRole("button", { name: "Hapus React.js" });
      fireEvent.click(removeBtn);

      expect(handleChange).toHaveBeenCalledWith([initialSkills[1]]);
    });

    it("allows changing level of an existing skill", () => {
      const handleChange = vi.fn();
      render(
        <SkillSelector
          value={initialSkills}
          onChange={handleChange}
          maxSkills={20}
        />
      );

      const levelSelect = screen.getByLabelText("Ubah tingkat kemahiran untuk React.js");
      fireEvent.change(levelSelect, { target: { value: "pemula" } });

      expect(handleChange).toHaveBeenCalledWith([
        { ...initialSkills[0], level: "pemula" },
        initialSkills[1],
      ]);
    });

    it("prevents adding duplicate skill and shows error message", async () => {
      const handleChange = vi.fn();
      render(
        <SkillSelector
          value={initialSkills}
          onChange={handleChange}
          maxSkills={20}
        />
      );

      const input = screen.getByPlaceholderText(/Cari atau tambah keahlian/i);
      fireEvent.change(input, { target: { value: "react.js" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(handleChange).not.toHaveBeenCalled();
      expect(
        await screen.findByText(/sudah ada dalam daftar/i)
      ).toBeInTheDocument();
    });
  });

  describe("ProfileDetailPage", () => {
    it("renders profile details with sensitive data when provided by API", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          user_id: 1,
          nama: "Rifqi Mahasiswa",
          jurusan: "Teknik Informatika",
          angkatan: 2022,
          bio: "Student Developer",
          kontak_url: "https://github.com/rifqi",
          role: "mahasiswa",
          created_at: "2026-01-01T00:00:00Z",
          skills: [
            { skill_id: 10, nama: "FastAPI", tipe: "skill", level: "mahir" },
            { skill_id: 11, nama: "AI Prompting", tipe: "minat", level: "pemula" },
          ],
          friendship_status: "none",
          blocked_by_me: false,
          nim: "24060122140001",
          email: "rifqi@campus.ac.id",
          is_visible: true,
        },
      });

      render(<ProfileDetailPage />);

      expect(await screen.findByText("Rifqi Mahasiswa")).toBeInTheDocument();
      expect(screen.getByText("Teknik Informatika")).toBeInTheDocument();
      expect(screen.getByText(/24060122140001/)).toBeInTheDocument();
      expect(screen.getByText("rifqi@campus.ac.id")).toBeInTheDocument();
      expect(screen.getByText("FastAPI")).toBeInTheDocument();
      expect(screen.getByText("AI Prompting")).toBeInTheDocument();
    });

    it("renders EmptyState when user is not found or returns 404", async () => {
      (apiClient.get as any).mockRejectedValueOnce({
        response: { status: 404, data: { detail: "Pengguna tidak ditemukan" } },
      });

      render(<ProfileDetailPage />);

      expect(
        await screen.findByText("Profil Pengguna Tidak Ditemukan")
      ).toBeInTheDocument();
    });

    it("renders banner when viewer has blocked the user", async () => {
      (apiClient.get as any).mockResolvedValueOnce({
        data: {
          user_id: 2,
          nama: "User Yang Diblokir",
          jurusan: null,
          angkatan: null,
          bio: null,
          kontak_url: null,
          role: "mahasiswa",
          created_at: "2026-01-01T00:00:00Z",
          skills: [],
          friendship_status: "none",
          blocked_by_me: true,
          nim: null,
          email: null,
          is_visible: false,
        },
      });

      render(<ProfileDetailPage />);

      expect(
        await screen.findByText(/Anda telah memblokir pengguna ini/i)
      ).toBeInTheDocument();
    });
  });

  describe("ProfileEditPage", () => {
    it("loads profile and renders editable inputs", async () => {
      (apiClient.get as any)
        .mockResolvedValueOnce({
          data: {
            user_id: 1,
            nama: "Rifqi Mahasiswa",
            jurusan: "Teknik Informatika",
            angkatan: 2022,
            bio: "Old bio",
            kontak_url: "https://github.com/rifqi",
            role: "mahasiswa",
          },
        })
        .mockResolvedValueOnce({
          data: {
            skills: [{ skill_id: 1, nama: "React", tipe: "skill", level: "mahir" }],
          },
        });

      render(<ProfileEditPage />);

      expect(await screen.findByDisplayValue("Rifqi Mahasiswa")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Old bio")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://github.com/rifqi")).toBeInTheDocument();
    });
  });
});
