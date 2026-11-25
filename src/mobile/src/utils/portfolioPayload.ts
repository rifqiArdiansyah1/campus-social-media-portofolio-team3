export interface PortfolioPayloadInput {
  judul: string;
  kategori: string;
  deskripsi?: string | null;
  penerbit?: string | null;
  nomor_dokumen?: string | null;
  tanggal_terbit?: string | null;
  tautan_url?: string | null;
  file_url?: string | null;
}

export function buildPortfolioPayload(input: PortfolioPayloadInput) {
  let cleanTautan = input.tautan_url?.trim() || null;
  if (cleanTautan && !cleanTautan.startsWith('http://') && !cleanTautan.startsWith('https://')) {
    cleanTautan = `https://${cleanTautan}`;
  }

  let cleanTanggal = input.tanggal_terbit?.trim() || null;
  if (cleanTanggal) {
    const match = cleanTanggal.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      cleanTanggal = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  let cleanNomorDokumen = input.nomor_dokumen?.trim() || null;
  if (cleanNomorDokumen && input.kategori === 'artikel_ilmiah') {
    const doiMatch = cleanNomorDokumen.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9<>+]+/);
    if (doiMatch) {
      cleanNomorDokumen = doiMatch[0].replace(/[.,;]+$/, '');
    }
  }

  return {
    judul: input.judul.trim(),
    kategori: input.kategori,
    deskripsi: input.deskripsi?.trim() || null,
    penerbit: input.penerbit?.trim() || null,
    nomor_dokumen: cleanNomorDokumen,
    tanggal_terbit: cleanTanggal,
    tautan_url: cleanTautan,
    file_url: input.file_url || null,
  };
}
