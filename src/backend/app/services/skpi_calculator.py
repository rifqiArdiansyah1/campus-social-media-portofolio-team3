from typing import Any, Dict, List

from app.models.entities import PortfolioItem

CATEGORIES = ["proyek", "skpi", "sertifikat", "artikel_ilmiah"]
POIN_WEIGHTS = {"proyek": 0, "skpi": 1, "sertifikat": 1, "artikel_ilmiah": 2}


def calculate_skpi_summary(items: List[PortfolioItem]) -> Dict[str, Any]:
    """
    Computes official SKPI points and portfolio category breakdown.
    Shared implementation across M07 (users/skpi-summary) and M11 (dashboard/summary).
    """
    jumlah_per_kategori = {cat: 0 for cat in CATEGORIES}
    poin_per_kategori = {cat: 0 for cat in CATEGORIES}
    menunggu_count = 0
    terverifikasi_count = 0
    perlu_revisi_count = 0

    for item in items:
        status = item.status_verifikasi
        if status == "menunggu_review":
            menunggu_count += 1
        elif status == "terverifikasi":
            cat = item.kategori if item.kategori in CATEGORIES else "skpi"
            jumlah_per_kategori[cat] += 1
            poin_per_kategori[cat] += POIN_WEIGHTS.get(cat, 1)
            terverifikasi_count += 1
        elif status in ("perlu_revisi", "ditolak"):
            perlu_revisi_count += 1

        if item.kategori == "proyek" and status != "terverifikasi":
            jumlah_per_kategori["proyek"] += 1

    total_poin = sum(poin_per_kategori.values())

    return {
        "total_poin": total_poin,
        "total_terverifikasi": terverifikasi_count,
        "total_menunggu": menunggu_count,
        "total_perlu_revisi": perlu_revisi_count,
        "poin_per_kategori": poin_per_kategori,
        "jumlah_per_kategori": jumlah_per_kategori,
    }
