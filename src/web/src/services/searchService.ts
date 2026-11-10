import { apiClient } from "@/lib/api";

export interface SearchSkillItem {
  skill_id: number;
  nama: string;
  tipe: string;
}

export interface StudentSearchResult {
  user_id: number;
  nama: string;
  nim: string;
  jurusan: string | null;
  angkatan: number | null;
  bio: string | null;
  kontak_url: string | null;
  skills: SearchSkillItem[];
  friendship_status: string | null;
  created_at: string;
}

export interface PostSearchResult {
  post_id: number;
  user_id: number;
  author_nama: string;
  author_jurusan: string | null;
  isi: string;
  gambar_url: string | null;
  tipe: "umum" | "cari_anggota";
  skills: SearchSkillItem[];
  created_at: string;
}

export interface PortfolioSearchResult {
  portfolio_id: number;
  user_id: number;
  author_nama: string;
  author_jurusan: string | null;
  judul: string;
  deskripsi: string | null;
  kategori: string;
  tautan_url: string | null;
  gambar_url: string | null;
  status_verifikasi: string;
  skills: SearchSkillItem[];
  created_at: string;
}

export interface SearchResponse<T = StudentSearchResult | PostSearchResult | PortfolioSearchResult> {
  total: number;
  limit: number;
  offset: number;
  tipe: "mahasiswa" | "postingan" | "portofolio";
  items: T[];
}

export interface SearchParams {
  q?: string;
  tipe?: "mahasiswa" | "postingan" | "portofolio";
  skill_id?: number;
  jurusan?: string;
  limit?: number;
  offset?: number;
}

export async function searchEntities<T = StudentSearchResult | PostSearchResult | PortfolioSearchResult>(
  params: SearchParams
): Promise<SearchResponse<T>> {
  const queryParams: Record<string, any> = {
    tipe: params.tipe || "mahasiswa",
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  };

  if (params.q && params.q.trim()) {
    queryParams.q = params.q.trim();
  }
  if (params.skill_id !== undefined && params.skill_id !== null) {
    queryParams.skill_id = params.skill_id;
  }
  if (params.jurusan && params.jurusan.trim()) {
    queryParams.jurusan = params.jurusan.trim();
  }

  const res = await apiClient.get<SearchResponse<T>>("/search", {
    params: queryParams,
  });
  return res.data;
}
