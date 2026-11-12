from sqlalchemy import and_, case, or_
from sqlalchemy.orm import Query, Session

from app.models.entities import Friendship, UserBlock


def is_target_blocking_viewer(db: Session, viewer_id: int, target_id: int) -> bool:
    """
    Checks if target has blocked viewer.
    If True, the viewer must NOT be able to view target's profile (404 Not Found anti-leak).
    """
    viewer_id = int(viewer_id)
    target_id = int(target_id)
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
    viewer_id = int(viewer_id)
    target_id = int(target_id)
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
    viewer_id = int(viewer_id)
    target_id = int(target_id)
    if viewer_id == target_id:
        return True

    return not (is_target_blocking_viewer(db, viewer_id, target_id) or is_viewer_blocking_target(db, viewer_id, target_id))


def hidden_user_ids(db: Session, viewer_id: int) -> set[int]:
    """
    Returns a set of all user IDs that have a mutual blocking relation with viewer
    (either blocked by viewer, or who blocked viewer).
    """
    viewer_id = int(viewer_id)
    blocks = (
        db.query(UserBlock.blocker_id, UserBlock.blocked_id)
        .filter(or_(UserBlock.blocker_id == viewer_id, UserBlock.blocked_id == viewer_id))
        .all()
    )
    result: set[int] = set()
    for b_id, blk_id in blocks:
        if int(b_id) == viewer_id:
            result.add(int(blk_id))
        else:
            result.add(int(b_id))
    return result


def exclude_hidden(query: Query, viewer_id: int, user_id_column) -> Query:
    """
    Adds a NOT EXISTS filter on the SQLAlchemy query against user_blocks
    in both directions for optimal indexed SQL execution without loading IDs into memory.
    """
    viewer_id = int(viewer_id)
    block_subq = query.session.query(UserBlock.block_id).filter(
        or_(
            and_(UserBlock.blocker_id == viewer_id, UserBlock.blocked_id == user_id_column),
            and_(UserBlock.blocker_id == user_id_column, UserBlock.blocked_id == viewer_id),
        )
    )
    return query.filter(~block_subq.exists())


def friend_ids_subquery(session: Session, viewer_id: int):
    """
    Returns an SQLAlchemy query selecting counterpart user IDs for accepted friendships.
    Can be used directly with in_(...) or exists().
    """
    viewer_id = int(viewer_id)
    return session.query(
        case(
            (Friendship.requester_id == viewer_id, Friendship.addressee_id),
            else_=Friendship.requester_id,
        ).label("friend_user_id")
    ).filter(
        Friendship.status == "diterima",
        or_(Friendship.requester_id == viewer_id, Friendship.addressee_id == viewer_id),
    )


def friend_ids(db: Session, viewer_id: int) -> set[int]:
    """
    Computes the set of accepted friend IDs for viewer, subtracting any hidden/blocked accounts.
    """
    viewer_id = int(viewer_id)
    friends_records = (
        db.query(Friendship.requester_id, Friendship.addressee_id)
        .filter(
            Friendship.status == "diterima",
            or_(Friendship.requester_id == viewer_id, Friendship.addressee_id == viewer_id),
        )
        .all()
    )
    all_friends: set[int] = set()
    for req_id, addr_id in friends_records:
        fid = int(addr_id) if int(req_id) == viewer_id else int(req_id)
        all_friends.add(fid)

    # Fail-safe: subtract any blocked accounts
    hidden = hidden_user_ids(db, viewer_id)
    return all_friends - hidden
