import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleGate } from "@/components/auth/RoleGate";
import * as AuthContextModule from "@/context/AuthContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("RoleGate Component", () => {
  it("renders children when user role is in allowedRoles", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { user_id: 1, nama: "Kaprodi", email: "kaprodi@campus.ac.id", role: "moderator" },
      token: "mock-token",
      role: "moderator",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <RoleGate allowedRoles={["moderator", "admin"]}>
        <div data-testid="moderation-panel">Panel Moderasi Khusus</div>
      </RoleGate>
    );

    expect(screen.getByTestId("moderation-panel")).toBeInTheDocument();
  });

  it("does not render children and shows fallback when role is unauthorized", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { user_id: 2, nama: "Budi", email: "budi@campus.ac.id", role: "mahasiswa" },
      token: "mock-token",
      role: "mahasiswa",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <RoleGate
        allowedRoles={["moderator", "admin"]}
        fallback={<div data-testid="access-denied">Akses Ditolak</div>}
      >
        <div data-testid="moderation-panel">Panel Moderasi Khusus</div>
      </RoleGate>
    );

    expect(screen.queryByTestId("moderation-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("access-denied")).toBeInTheDocument();
  });

  it("renders null during loading state to prevent flicker", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { container } = render(
      <RoleGate allowedRoles={["mahasiswa"]}>
        <div data-testid="content">Konten Mahasiswa</div>
      </RoleGate>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
