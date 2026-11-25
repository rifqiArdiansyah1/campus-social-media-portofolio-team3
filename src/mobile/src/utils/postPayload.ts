export interface PostCreatePayload {
  isi: string;
  tipe: 'umum' | 'cari_anggota';
  gambar_url?: string | null;
  skill_ids?: number[];
}

export function buildPostPayload(
  isi: string,
  tipe: 'umum' | 'cari_anggota',
  selectedSkillIds: number[] = [],
  gambarUrl: string | null = null
): PostCreatePayload {
  const payload: PostCreatePayload = {
    isi: isi.trim(),
    tipe,
    gambar_url: gambarUrl,
  };
  if (tipe === 'cari_anggota') {
    const deduped = Array.from(new Set(selectedSkillIds)).slice(0, 10);
    payload.skill_ids = deduped;
  }
  return payload;
}
