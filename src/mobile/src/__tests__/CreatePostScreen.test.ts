import { describe, it, expect } from "vitest";
import { buildPostPayload } from "../utils/postPayload";

describe("buildPostPayload", () => {
  it("builds payload for umum post without skill_ids", () => {
    const payload = buildPostPayload("Ini postingan umum", "umum", [1, 2], "img/path.jpg");
    expect(payload.isi).toBe("Ini postingan umum");
    expect(payload.tipe).toBe("umum");
    expect(payload.gambar_url).toBe("img/path.jpg");
    expect(payload.skill_ids).toBeUndefined();
  });

  it("builds payload for cari_anggota with deduped skill_ids capped at 10", () => {
    const skillIds = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const payload = buildPostPayload("Dicari mobile developer", "cari_anggota", skillIds);
    expect(payload.tipe).toBe("cari_anggota");
    expect(payload.skill_ids).toHaveLength(10);
    expect(payload.skill_ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("builds payload for cari_anggota with empty skill_ids gracefully", () => {
    const payload = buildPostPayload("Dicari desainer", "cari_anggota", []);
    expect(payload.tipe).toBe("cari_anggota");
    expect(payload.skill_ids).toEqual([]);
  });
});
