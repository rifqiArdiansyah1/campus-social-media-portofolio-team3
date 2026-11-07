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
