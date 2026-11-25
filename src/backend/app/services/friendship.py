from typing import Optional

from sqlalchemy.orm import Session

from app.models.entities import Friendship


def get_friendship_relation(
    db: Session, viewer_id: int, target_id: int
) -> tuple[str, Optional[int], Optional[str]]:
    """
    Computes detailed friendship relationship from the perspective of viewer:
    Returns (status, friendship_id, direction) where:
    - status: 'none', 'pending_sent', 'pending_received', 'friends'
    - friendship_id: ID of the friendship record (if exists and active/pending)
    - direction: 'outgoing' if viewer is requester, 'incoming' if viewer is addressee, else None
    """
    viewer_id = int(viewer_id)
    target_id = int(target_id)
    if viewer_id == target_id:
        return "none", None, None

    rel = (
        db.query(Friendship)
        .filter(
            (
                (Friendship.requester_id == viewer_id)
                & (Friendship.addressee_id == target_id)
            )
            | (
                (Friendship.requester_id == target_id)
                & (Friendship.addressee_id == viewer_id)
            )
        )
        .first()
    )

    if not rel:
        return "none", None, None

    if rel.status == "diterima":
        direction = "outgoing" if rel.requester_id == viewer_id else "incoming"
        return "friends", rel.friendship_id, direction
    elif rel.status == "menunggu":
        if rel.requester_id == viewer_id:
            return "pending_sent", rel.friendship_id, "outgoing"
        else:
            return "pending_received", rel.friendship_id, "incoming"
    else:
        # 'ditolak' is mapped to 'none' for clean UI
        return "none", None, None


def get_friendship_status(db: Session, viewer_id: int, target_id: int) -> str:
    """
    Backward-compatible shortcut returning just the friendship status string.
    """
    status, _, _ = get_friendship_relation(db, viewer_id, target_id)
    return status


def is_friendship_cooldown_active(db: Session, requester_id: int, addressee_id: int) -> bool:
    """
    Returns True if requester_id was rejected by addressee_id within the last 24 hours.
    """
    from datetime import datetime, timezone
    requester_id = int(requester_id)
    addressee_id = int(addressee_id)
    rejected_rel = (
        db.query(Friendship)
        .filter(
            Friendship.requester_id == requester_id,
            Friendship.addressee_id == addressee_id,
            Friendship.status == "ditolak",
        )
        .first()
    )
    if not rejected_rel:
        return False
    ref_time = rejected_rel.updated_at or rejected_rel.created_at
    if not ref_time:
        return False
    now = datetime.now(timezone.utc) if ref_time.tzinfo else datetime.utcnow()
    elapsed = (now - ref_time).total_seconds()
    return elapsed < 86400


def acquire_social_pair_lock(db: Session, user_a_id: int, user_b_id: int):
    """
    Acquires a transaction-scoped advisory lock for the ordered user pair (u1, u2).
    Generates a deterministic 64-bit signed integer with a dedicated namespace.
    Safe on PostgreSQL; gracefully skipped if running on non-PG dialects (e.g. SQLite).
    """
    import hashlib
    import struct
    from sqlalchemy import text

    if db.bind and db.bind.dialect.name == "postgresql":
        u1, u2 = min(int(user_a_id), int(user_b_id)), max(int(user_a_id), int(user_b_id))
        lock_str = f"cffr_pair:{u1}:{u2}".encode("utf-8")
        lock_key = struct.unpack(">q", hashlib.sha256(lock_str).digest()[:8])[0]
        db.execute(text("SELECT pg_advisory_xact_lock(:lock_key)"), {"lock_key": lock_key})
