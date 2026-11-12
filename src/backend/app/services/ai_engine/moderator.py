import re
import unicodedata
from typing import Dict, List, Pattern, Set

from app.schemas.moderation import ModerationResponse
from app.services.ai_engine.validator import validate_moderation_output


class ContentModerator:
    """
    AI-2: Engine moderasi teks awal untuk feed postingan kampus.
    Menggunakan Deterministic Heuristic Baseline dengan pipeline normalisasi multi-tahap
    (Unicode NFKC, zero-width stripping, Cyrillic homoglyph replacement, leetspeak decoding,
    controlled repetition collapse, and regex word-boundary matching).
    Prinsip Human-in-the-Loop: Saran AI untuk review manusia, tidak menghapus konten sepihak.
    """

    MAX_CONTENT_LENGTH = 5000

    # Peta Cyrillic homoglyph ke Latin
    CYRILLIC_HOMOGLYPHS = {
        "\u0430": "a",  # Cyrillic small letter a
        "\u0435": "e",  # Cyrillic small letter ie
        "\u043e": "o",  # Cyrillic small letter o
        "\u0440": "p",  # Cyrillic small letter er
        "\u0441": "c",  # Cyrillic small letter es
        "\u0443": "y",  # Cyrillic small letter u
        "\u0445": "x",  # Cyrillic small letter ha
        "\u0456": "i",  # Cyrillic small letter byelorussian-ukrainian i
        "\u0458": "j",  # Cyrillic small letter je
    }

    # Peta leetspeak selektif (angka & simbol ke huruf)
    LEET_MAP = {
        "4": "a",
        "@": "a",
        "3": "e",
        "0": "o",
        "1": "i",
        "!": "i",
        "5": "s",
        "$": "s",
        "7": "t",
        "8": "b",
    }

    # Regex untuk karakter zero-width dan invisible formatting
    ZERO_WIDTH_REGEX = re.compile(r"[\u200B-\u200D\uFEFF\u00AD]")

    # Kamus pola mentah (sebelum pembersihan angka/simbol)
    RAW_FLAGGED_PATTERNS: Dict[str, List[Pattern]] = {
        "penipuan": [
            re.compile(r"\binvestasi\s+pasti\s+untung\s+100%", re.IGNORECASE),
            re.compile(r"\bjoki\s+skripsi\s+murah\b", re.IGNORECASE),
            re.compile(r"\bjual\s+akun\b", re.IGNORECASE),
            re.compile(r"\bpinjol\s+cepat\s+cair\b", re.IGNORECASE),
        ],
        "spam": [
            re.compile(r"wa\.me/\d+", re.IGNORECASE),
            re.compile(r"wa\.me/", re.IGNORECASE),
            re.compile(r"\bklik\s+link\s+ini\s+gratis\b", re.IGNORECASE),
            re.compile(r"\bfollower\s+gratis\b", re.IGNORECASE),
        ],
    }

    # Kamus kata terlarang (dievaluasi setelah normalisasi dengan word boundary)
    FLAGGED_WORDS: Dict[str, List[str]] = {
        "ujaran_kasar": [
            "anjing",
            "bangsat",
            "tolol",
            "goblok",
            "bego",
            "kampret",
            "kontol",
            "memek",
        ],
        "pelecehan": [
            "open bo",
            "jablay",
            "lonte",
            "sange",
            "bugil",
        ],
    }

    SUSPICIOUS_WORDS: Dict[str, List[str]] = {
        "borderline_negatif": [
            "males banget",
            "dosen ga jelas",
            "tugas tai",
            "parah sih",
        ]
    }

    def __init__(self):
        # Pra-kompilasi regex untuk kata-kata kasar dengan toleransi celah tanda baca antar huruf
        self.compiled_flagged_regexes: Dict[str, List[Pattern]] = {}
        for category, words in self.FLAGGED_WORDS.items():
            regex_list = []
            for word in words:
                regex_list.append(self._build_word_pattern(word))
            self.compiled_flagged_regexes[category] = regex_list

        self.compiled_suspicious_regexes: Dict[str, List[Pattern]] = {}
        for category, words in self.SUSPICIOUS_WORDS.items():
            regex_list = []
            for word in words:
                regex_list.append(self._build_word_pattern(word))
            self.compiled_suspicious_regexes[category] = regex_list

    @classmethod
    def _build_word_pattern(cls, phrase: str) -> Pattern:
        """
        Membangun regex bertoleransi pemisah tanda baca / spasi tunggal antar karakter
        dengan pembatas kata (word boundary \b).
        Contoh: 'anjing' -> r'\ba+[._\\s\\-*]*n+[._\\s\\-*]*j+[._\\s\\-*]*i+[._\\s\\-*]*n+[._\\s\\-*]*g+\b'
        """
        words = phrase.split()
        word_patterns = []
        for w in words:
            # Toleransi pemisah antar huruf dalam satu kata
            char_patterns = [f"{re.escape(c)}+" for c in w]
            w_pattern = r"[._\s\-*]*".join(char_patterns)
            word_patterns.append(rf"\b{w_pattern}\b")

        # Jika frasa lebih dari 1 kata (misal 'open bo'), gabung dengan toleransi spasi
        full_pattern = r"\s+".join(word_patterns)
        return re.compile(full_pattern, re.IGNORECASE)

    @classmethod
    def normalize_text(cls, text: str) -> str:
        """
        Pipeline normalisasi teks bertingkat:
        1. Unicode NFKC
        2. Hapus zero-width characters
        3. Cyrillic homoglyph replacement ke Latin
        4. Lowercase
        5. Leetspeak substitution
        6. Controlled repetition collapse: >= 3 huruf sama berurutan dipadatkan menjadi 2 huruf
        """
        if not text:
            return ""

        # Step 1: Unicode NFKC
        norm = unicodedata.normalize("NFKC", text)

        # Step 2: Strip zero-width characters
        norm = cls.ZERO_WIDTH_REGEX.sub("", norm)

        # Step 3: Replace Cyrillic homoglyphs
        for cyr, lat in cls.CYRILLIC_HOMOGLYPHS.items():
            norm = norm.replace(cyr, lat)

        # Step 4: Lowercase
        norm = norm.lower()

        # Step 5: Leetspeak conversion
        for leet, char in cls.LEET_MAP.items():
            norm = norm.replace(leet, char)

        # Step 6: Controlled repetition collapse (3 or more -> 2)
        # Menjaga kata sah seperti 'maaf', 'Aamiin' tetap utuh (2 huruf)
        norm = re.sub(r"(.)\1{2,}", r"\1\1", norm)

        return norm

    def moderate_text(self, post_id: str, content: str) -> ModerationResponse:
        """
        Menjalankan moderasi teks feed dengan evaluasi dua tahap:
        Tahap 1: Evaluasi pola mentah (spam URL, penipuan finansial berangka)
        Tahap 2: Evaluasi teks ternormalisasi dengan word boundaries
        """
        if not content:
            resp = ModerationResponse(
                post_id=str(post_id),
                label="aman",
                categories=[],
                confidence=0.95,
                explanation="[Saran AI] Konten kosong aman untuk dipublikasikan."
            )
            validate_moderation_output(resp.model_dump())
            return resp

        # Batasi panjang masukan
        sanitized_content = content[:self.MAX_CONTENT_LENGTH]
        normalized_content = self.normalize_text(sanitized_content)

        matched_categories: Set[str] = set()
        severity_score = 0.0

        # ---------------------------------------------------------------------
        # TAHAP 1: Pola Mentah (Raw Patterns)
        # ---------------------------------------------------------------------
        for category, patterns in self.RAW_FLAGGED_PATTERNS.items():
            for pat in patterns:
                if pat.search(sanitized_content):
                    matched_categories.add(category)
                    severity_score += 0.80

        # ---------------------------------------------------------------------
        # TAHAP 2: Pola Pelanggaran Berat (Flagged Words pada Normalized Text)
        # ---------------------------------------------------------------------
        for category, regex_list in self.compiled_flagged_regexes.items():
            for regex in regex_list:
                if regex.search(normalized_content):
                    matched_categories.add(category)
                    # Satu kata kasar berat langsung cukup membawa skor ke berpotensi_melanggar
                    severity_score += 0.75

        # ---------------------------------------------------------------------
        # TAHAP 3: Pola Borderline / Suspicious Words
        # ---------------------------------------------------------------------
        for category, regex_list in self.compiled_suspicious_regexes.items():
            for regex in regex_list:
                if regex.search(normalized_content):
                    matched_categories.add(category)
                    severity_score += 0.40

        # Klasifikasi label dan kalibrasi confidence score
        categories_list = sorted(list(matched_categories))

        if severity_score >= 0.70:
            label = "berpotensi_melanggar"
            # Kalibrasi confidence antara 0.75 - 0.98
            confidence = round(min(0.98, max(0.75, severity_score)), 2)
            explanation = (
                f"[Saran AI] Konten terdeteksi mengandung indikasi {', '.join(categories_list)} "
                f"yang berpotensi melanggar pedoman etika kampus. Disarankan ditinjau moderator."
            )
        elif severity_score >= 0.35:
            label = "perlu_review"
            confidence = round(min(0.70, max(0.40, severity_score)), 2)
            explanation = (
                f"[Saran AI] Konten mengandung sentimen atau konteks sensitif ({', '.join(categories_list)}) "
                f"yang disarankan untuk diverifikasi admin."
            )
        else:
            label = "aman"
            confidence = 0.95
            explanation = "[Saran AI] Konten tidak mengandung indikasi pelanggaran norma dan aman untuk dipublikasikan."

        resp = ModerationResponse(
            post_id=str(post_id),
            label=label,
            categories=categories_list,
            confidence=confidence,
            explanation=explanation,
        )
        validate_moderation_output(resp.model_dump())
        return resp


# Singleton instance
moderator_engine = ContentModerator()


def get_moderator_engine() -> ContentModerator:
    return moderator_engine
