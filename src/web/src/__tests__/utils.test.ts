import { describe, it, expect } from "vitest";
import { getInitials } from "@/lib/utils";

describe("getInitials helper", () => {
  it("returns uppercase initials for single and multi-word names", () => {
    expect(getInitials("Moh. Rifqi Dwi Ardiansyah")).toBe("MR");
    expect(getInitials("Dewi Sartika")).toBe("DS");
    expect(getInitials("Rizky")).toBe("R");
  });

  it("handles null, undefined, empty and whitespace-only strings gracefully", () => {
    expect(getInitials(null)).toBe("U");
    expect(getInitials(undefined)).toBe("U");
    expect(getInitials("")).toBe("U");
    expect(getInitials("    ")).toBe("U");
  });

  it("handles extra spaces between words correctly", () => {
    expect(getInitials("   Budi    Santoso   ")).toBe("BS");
  });
});
