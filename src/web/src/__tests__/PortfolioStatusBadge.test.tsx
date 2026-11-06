import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioStatusBadge } from "@/components/common/PortfolioStatusBadge";

describe("PortfolioStatusBadge Component", () => {
  it("renders draft status correctly", () => {
    render(<PortfolioStatusBadge status="draft" />);
    const badge = screen.getByTestId("portfolio-badge-draft");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Draf");
  });

  it("renders menunggu_review status correctly", () => {
    render(<PortfolioStatusBadge status="menunggu_review" />);
    const badge = screen.getByTestId("portfolio-badge-menunggu_review");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Menunggu Review");
  });

  it("renders terverifikasi status correctly", () => {
    render(<PortfolioStatusBadge status="terverifikasi" />);
    const badge = screen.getByTestId("portfolio-badge-terverifikasi");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Terverifikasi SKPI");
  });

  it("renders ditolak status correctly", () => {
    render(<PortfolioStatusBadge status="ditolak" />);
    const badge = screen.getByTestId("portfolio-badge-ditolak");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Ditolak");
  });
});
