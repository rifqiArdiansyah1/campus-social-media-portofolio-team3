from sqlalchemy.orm import Session

from app.models.entities import Friendship


def get_friendship_status(db: Session, viewer_id: int, target_id: int) -> str:
    """
    Computes the friendship relationship from the perspective of the viewer:
    - 'none': No friendship record exists, or previous request was rejected.
    - 'pending_sent': Viewer sent a request that is still awaiting response.
    - 'pending_received': Target sent a request to viewer that is awaiting response.
    - 'friends': The friendship request has been accepted.
    """
    if viewer_id == target_id:
        return "none"

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
        return "none"

    if rel.status == "diterima":
        return "friends"
    elif rel.status == "menunggu":
        if rel.requester_id == viewer_id:
            return "pending_sent"
        else:
            return "pending_received"
    else:
        # 'ditolak' is mapped to 'none' for clean UI
        return "none"
