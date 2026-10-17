from typing import List, Dict, Tuple
from app.schemas.moderation import ModerationResponse

class ContentModerator:
    """
    AI-2: Engine moderasi teks awal untuk feed postingan kampus.
    Melakukan klasifikasi awal (aman, perlu_review, berpotensi_melanggar)
    dengan prinsip Human-in-the-Loop.
    """

    # Kamus indikasi pelanggaran norma kampus
    FLAGGED_PATTERNS = {
        "ujaran_kasar": ["anjing", "bangsat", "tolol", "goblok", "bego", "kampret", "kontol", "memek"],
        "pelecehan": ["open bo", "jablay", "lonte", "sange", "bugil"],
        "penipuan": ["jual akun", "joki skripsi murah", "pinjol cepat cair", "investasi pasti untung 100%"],
        "spam": ["klik link ini gratis", "follower gratis", "wa.me/"]
    }

    SUSPICIOUS_PATTERNS = {
        "borderline_negatif": ["males banget", "dosen ga jelas", "tugas tai", "parah sih", "curang"]
    }

    def moderate_text(self, post_id: str, content: str) -> ModerationResponse:
        content_lower = content.lower()
        matched_categories: List[str] = []
        severity_score = 0.0

        # Check high severity flagged words
        for category, keywords in self.FLAGGED_PATTERNS.items():
            for word in keywords:
                if word in content_lower:
                    if category not in matched_categories:
                        matched_categories.append(category)
                    severity_score += 0.45

        # Check suspicious / borderline words
        for category, keywords in self.SUSPICIOUS_PATTERNS.items():
            for word in keywords:
                if word in content_lower:
                    severity_score += 0.20

        # Determine label and confidence
        if severity_score >= 0.70:
            label = "berpotensi_melanggar"
            confidence = round(min(0.95, severity_score), 2)
            explanation = f"Konten terdeteksi mengandung indikasi {', '.join(matched_categories)} yang melanggar etika media sosial kampus."
        elif severity_score >= 0.35:
            label = "perlu_review"
            confidence = round(severity_score, 2)
            explanation = "Konten mengandung kata atau konteks sensitif yang disarankan untuk diverifikasi admin."
        else:
            label = "aman"
            confidence = 0.90
            explanation = "Konten tidak mengandung indikasi pelanggaran norma dan aman untuk dipublikasikan."

        return ModerationResponse(
            post_id=post_id,
            label=label,
            categories=matched_categories,
            confidence=confidence,
            explanation=explanation
        )

# Singleton instance
moderator_engine = ContentModerator()
