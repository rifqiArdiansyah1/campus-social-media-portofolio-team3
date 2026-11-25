import { describe, it, expect } from "vitest";
import { getApiErrorMessage } from "@/lib/api";

describe("getApiErrorMessage", () => {
  it("returns fallback when err is undefined or null", () => {
    expect(getApiErrorMessage(null)).toBe("Terjadi kesalahan pada sistem.");
    expect(getApiErrorMessage(undefined, "Custom fallback")).toBe("Custom fallback");
  });

  it("handles string detail from FastAPI", () => {
    const err = {
      response: {
        data: {
          detail: "Alasan takedown minimal 5 karakter.",
        },
      },
    };
    expect(getApiErrorMessage(err)).toBe("Alasan takedown minimal 5 karakter.");
  });

  it("handles Pydantic 422 array of validation errors", () => {
    const err = {
      response: {
        data: {
          detail: [
            { loc: ["body", "judul"], msg: "Value error, Judul portofolio minimal 3 karakter." },
            { loc: ["body", "tanggal_terbit"], msg: "tanggal_terbit tidak boleh berada di masa depan." },
          ],
        },
      },
    };
    const res = getApiErrorMessage(err);
    expect(res).toContain("judul: Judul portofolio minimal 3 karakter.");
    expect(res).toContain("tanggal_terbit: tanggal_terbit tidak boleh berada di masa depan.");
  });

  it("extracts specific field messages from data.errors when detail is generic", () => {
    const err = {
      response: {
        data: {
          detail: "Validasi input gagal",
          code: "VALIDATION_ERROR",
          errors: [
            {
              loc: ["body", "nomor_dokumen"],
              msg: "Value error, Format DOI tidak valid. Masukkan format resmi seperti 10.1145/...",
            },
          ],
        },
      },
    };
    const res = getApiErrorMessage(err);
    expect(res).toContain("nomor_dokumen: Format DOI tidak valid");
  });

  it("falls back to error.message if no response data", () => {
    const err = new Error("Network Error");
    expect(getApiErrorMessage(err)).toBe("Network Error");
  });
});
