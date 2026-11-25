import { describe, it, expect } from "vitest";
import { buildPortfolioPayload } from "../utils/portfolioPayload";

describe("buildPortfolioPayload", () => {
  it("normalizes and trims empty fields to null for a draft item", () => {
    const payload = buildPortfolioPayload({
      judul: "  Aplikasi Portofolio Mobile  ",
      kategori: "proyek",
      deskripsi: "   ",
      penerbit: "",
      nomor_dokumen: "   ",
      tanggal_terbit: "",
      tautan_url: "  https://github.com/student/app  ",
      file_url: null,
    });

    expect(payload.judul).toBe("Aplikasi Portofolio Mobile");
    expect(payload.kategori).toBe("proyek");
    expect(payload.deskripsi).toBeNull();
    expect(payload.penerbit).toBeNull();
    expect(payload.nomor_dokumen).toBeNull();
    expect(payload.tanggal_terbit).toBeNull();
    expect(payload.tautan_url).toBe("https://github.com/student/app");
    expect(payload.file_url).toBeNull();
  });

  it("retains all metadata when editing a complete certificate draft", () => {
    const payload = buildPortfolioPayload({
      judul: "Sertifikasi AWS Solutions Architect",
      kategori: "sertifikat",
      deskripsi: "Sertifikasi cloud computing",
      penerbit: "Amazon Web Services",
      nomor_dokumen: "AWS-SAA-1002",
      tanggal_terbit: "2024-06-15",
      tautan_url: null,
      file_url: "101/aws_cert.pdf",
    });

    expect(payload.judul).toBe("Sertifikasi AWS Solutions Architect");
    expect(payload.kategori).toBe("sertifikat");
    expect(payload.penerbit).toBe("Amazon Web Services");
    expect(payload.nomor_dokumen).toBe("AWS-SAA-1002");
    expect(payload.tanggal_terbit).toBe("2024-06-15");
    expect(payload.file_url).toBe("101/aws_cert.pdf");
  });

  it("handles cleared file when user removes an attached document", () => {
    const payload = buildPortfolioPayload({
      judul: "Draf Artikel Ilmiah",
      kategori: "artikel_ilmiah",
      nomor_dokumen: "10.1145/1234567.8901234",
      file_url: null,
    });

    expect(payload.file_url).toBeNull();
  });

  it("auto-prepends https:// on tautan_url and parses DD/MM/YYYY dates", () => {
    const payload = buildPortfolioPayload({
      judul: "Publikasi Ilmiah AI",
      kategori: "artikel_ilmiah",
      tautan_url: "doi.org/10.1145/3372278.3390678",
      nomor_dokumen: "https://doi.org/10.1145/3372278.3390678.",
      tanggal_terbit: "15/01/2024",
    });

    expect(payload.tautan_url).toBe("https://doi.org/10.1145/3372278.3390678");
    expect(payload.nomor_dokumen).toBe("10.1145/3372278.3390678");
    expect(payload.tanggal_terbit).toBe("2024-01-15");
  });
});
