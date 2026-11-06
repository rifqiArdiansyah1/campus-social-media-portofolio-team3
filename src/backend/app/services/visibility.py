from sqlalchemy.orm import Session

from app.models.entities import UserBlock


def is_target_blocking_viewer(db: Session, viewer_id: int, target_id: int) -> bool:
    """
    Checks if target has blocked viewer.
    If True, the viewer must NOT be able to view target's profile (404 Not Found).
    """
    if viewer_id == target_id:
        return False

    block_exists = (
        db.query(UserBlock.block_id)
        .filter(UserBlock.blocker_id == target_id, UserBlock.blocked_id == viewer_id)
        .first()
        is not None
    )
    return block_exists


def is_viewer_blocking_target(db: Session, viewer_id: int, target_id: int) -> bool:
    """
    Checks if viewer has blocked target.
    If True, target's profile is rendered in restricted mode with blocked_by_me: true.
    """
    if viewer_id == target_id:
        return False

    block_exists = (
        db.query(UserBlock.block_id)
        .filter(UserBlock.blocker_id == viewer_id, UserBlock.blocked_id == target_id)
        .first()
        is not None
    )
    return block_exists


def is_visible(db: Session, viewer_id: int, target_id: int) -> bool:
    """
    General visibility check for search, feeds, and recommendations.
    Returns False if there is any blocking relationship between the two parties.
    """
    if viewer_id == target_id:
        return True

    return not (is_target_blocking_viewer(db, viewer_id, target_id) or is_viewer_blocking_target(db, viewer_id, target_id))
