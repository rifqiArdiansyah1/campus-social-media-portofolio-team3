from typing import Optional

from app.core.config import settings


def normalize_email(email: str) -> str:
    """
    Normalize email string to lowercase and stripped of leading/trailing whitespace.
    Ensures case-insensitive uniqueness consistency in database.
    """
    return email.strip().lower()


def validate_email_domain(email: str) -> bool:
    """
    Validate that email belongs strictly to an allowed campus domain (US-01).
    Performs exact match on the domain portion after '@' (e.g., campus.ac.id).
    Prevents subdomain spoofing such as evilcampus.ac.id.
    """
    if not email or "@" not in email:
        return False

    parts = email.strip().split("@")
    if len(parts) != 2:
        return False

    domain = parts[1].strip().lower()
    allowed_domains = [d.strip().lower() for d in settings.ALLOWED_EMAIL_DOMAINS]
    return domain in allowed_domains


def normalize_jurusan(jurusan: Optional[str], role: str) -> Optional[str]:
    """
    Validate and normalize department (jurusan) name according to user role:
    - For 'mahasiswa' and 'moderator': Must match one of settings.ALLOWED_JURUSAN
      (case-insensitive & stripped) and returns the canonical Title Case form.
      Returns None if not found in the controlled list.
    - For 'admin': Allows administrative unit strings (e.g., 'Biro Kemahasiswaan & Alumni').
    """
    if not jurusan:
        return None

    stripped = jurusan.strip()
    if not stripped:
        return None

    if role in ("mahasiswa", "moderator"):
        for allowed in settings.ALLOWED_JURUSAN:
            if stripped.lower() == allowed.strip().lower():
                return allowed
        return None

    # For admin or other roles, preserve stripped string
    return stripped
