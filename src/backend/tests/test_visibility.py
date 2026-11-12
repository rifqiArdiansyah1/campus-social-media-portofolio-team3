from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.entities import Friendship, Post, User, UserBlock
from app.services.visibility import (
    exclude_hidden,
    friend_ids,
    friend_ids_subquery,
    hidden_user_ids,
    is_target_blocking_viewer,
    is_viewer_blocking_target,
    is_visible,
)


def create_user(
    db: Session,
    nama: str = "Test User",
    role: str = "mahasiswa",
    jurusan: str = "Teknik Informatika",
) -> User:
    uid = uuid4().hex[:8]
    user = User(
        nim=f"NIM-{uid}",
        nama=f"{nama} {uid}",
        email=f"user-{uid}@campus.ac.id",
        password_hash="fakehash",
        role=role,
        jurusan=jurusan,
        angkatan=2022,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_visibility_helpers_and_exclude_hidden(db_session: Session):
    viewer = create_user(db_session, nama="Viewer")
    target1 = create_user(db_session, nama="Target Normal")
    target2_blocked = create_user(db_session, nama="Target Blocked By Me")
    target3_blocker = create_user(db_session, nama="Target Blocking Me")

    # Viewer blocks Target 2
    b1 = UserBlock(blocker_id=viewer.user_id, blocked_id=target2_blocked.user_id)
    # Target 3 blocks Viewer
    b2 = UserBlock(blocker_id=target3_blocker.user_id, blocked_id=viewer.user_id)
    db_session.add_all([b1, b2])
    db_session.commit()

    # 1. is_visible
    assert is_visible(db_session, viewer.user_id, target1.user_id) is True
    assert is_visible(db_session, viewer.user_id, target2_blocked.user_id) is False
    assert is_visible(db_session, viewer.user_id, target3_blocker.user_id) is False
    assert is_visible(db_session, viewer.user_id, viewer.user_id) is True

    # 2. is_target_blocking_viewer & is_viewer_blocking_target
    assert is_target_blocking_viewer(db_session, viewer.user_id, target3_blocker.user_id) is True
    assert is_target_blocking_viewer(db_session, viewer.user_id, target2_blocked.user_id) is False
    assert is_viewer_blocking_target(db_session, viewer.user_id, target2_blocked.user_id) is True
    assert is_viewer_blocking_target(db_session, viewer.user_id, target3_blocker.user_id) is False

    # 3. hidden_user_ids
    hidden = hidden_user_ids(db_session, viewer.user_id)
    assert hidden == {target2_blocked.user_id, target3_blocker.user_id}

    # 4. exclude_hidden on Post query
    # Create posts
    p1 = Post(user_id=target1.user_id, isi="Post Target 1", tipe="umum", status="tayang")
    p2 = Post(user_id=target2_blocked.user_id, isi="Post Target 2", tipe="umum", status="tayang")
    p3 = Post(user_id=target3_blocker.user_id, isi="Post Target 3", tipe="umum", status="tayang")
    db_session.add_all([p1, p2, p3])
    db_session.commit()

    q = db_session.query(Post)
    filtered_q = exclude_hidden(q, viewer.user_id, Post.user_id)
    post_ids = [p.post_id for p in filtered_q.all()]
    assert p1.post_id in post_ids
    assert p2.post_id not in post_ids
    assert p3.post_id not in post_ids


def test_friend_ids_and_subquery(db_session: Session):
    viewer = create_user(db_session, nama="Viewer")
    f1 = create_user(db_session, nama="Friend 1")
    f2 = create_user(db_session, nama="Friend 2")
    pending = create_user(db_session, nama="Pending Person")

    # Accepted friendships
    rel1 = Friendship(requester_id=viewer.user_id, addressee_id=f1.user_id, status="diterima")
    rel2 = Friendship(requester_id=f2.user_id, addressee_id=viewer.user_id, status="diterima")
    rel_pend = Friendship(requester_id=viewer.user_id, addressee_id=pending.user_id, status="menunggu")
    db_session.add_all([rel1, rel2, rel_pend])
    db_session.commit()

    # In-memory friend_ids
    friends = friend_ids(db_session, viewer.user_id)
    assert friends == {f1.user_id, f2.user_id}

    # Subquery test
    subq = friend_ids_subquery(db_session, viewer.user_id)
    subq_results = {row[0] for row in subq.all()}
    assert subq_results == {f1.user_id, f2.user_id}


def test_type_consistency_between_int_and_str(db_session: Session):
    viewer = create_user(db_session, nama="Viewer")
    target = create_user(db_session, nama="Target")

    b = UserBlock(blocker_id=viewer.user_id, blocked_id=target.user_id)
    db_session.add(b)
    db_session.commit()

    # String input passed to helpers should be coerced safely without TypeError
    assert is_target_blocking_viewer(db_session, str(viewer.user_id), str(target.user_id)) is False
    assert is_viewer_blocking_target(db_session, str(viewer.user_id), str(target.user_id)) is True
    assert is_visible(db_session, str(viewer.user_id), str(target.user_id)) is False
    assert hidden_user_ids(db_session, str(viewer.user_id)) == {target.user_id}
