from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import Friendship, User


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


def auth_headers(user: User) -> dict:
    token = create_access_token(subject=user.user_id)
    return {"Authorization": f"Bearer {token}"}


def test_block_user_creates_block_and_deletes_friendships(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # 1. Setup active friendship
    friendship = Friendship(
        requester_id=user_a.user_id,
        addressee_id=user_b.user_id,
        status="diterima",
    )
    db_session.add(friendship)
    db_session.commit()
    fid = friendship.friendship_id

    # 2. User A blocks User B
    res_block = client.post(
        "/api/v1/blocks",
        json={"blocked_id": user_b.user_id, "alasan": "Mengganggu kenyamanan"},
        headers=auth_headers(user_a),
    )
    assert res_block.status_code == 201
    data = res_block.json()
    assert data["blocker_id"] == user_a.user_id
    assert data["blocked_id"] == user_b.user_id
    assert data["alasan"] == "Mengganggu kenyamanan"

    # 3. Verify friendship was automatically deleted
    assert (
        db_session.query(Friendship).filter(Friendship.friendship_id == fid).first()
        is None
    )

    # 4. User B tries to view User A's profile -> 404 anti-leak
    res_b_views_a = client.get(
        f"/api/v1/users/{user_a.user_id}",
        headers=auth_headers(user_b),
    )
    assert res_b_views_a.status_code == 404
    assert res_b_views_a.json()["code"] == "USER_NOT_FOUND"

    # 5. User A views User B's profile -> restricted profile with blocked_by_me = True
    res_a_views_b = client.get(
        f"/api/v1/users/{user_b.user_id}",
        headers=auth_headers(user_a),
    )
    assert res_a_views_b.status_code == 200
    b_profile = res_a_views_b.json()
    assert b_profile["blocked_by_me"] is True
    assert b_profile["bio"] is None
    assert b_profile["skills"] == []


def test_block_self_forbidden(client, db_session: Session):
    user = create_user(db_session, nama="Mahasiswa Ego")
    res = client.post(
        "/api/v1/blocks",
        json={"blocked_id": user.user_id},
        headers=auth_headers(user),
    )
    assert res.status_code == 422
    assert res.json()["code"] == "CANNOT_BLOCK_SELF"


def test_block_staff_forbidden(client, db_session: Session):
    student = create_user(db_session, nama="Mahasiswa Biasa", role="mahasiswa")
    kaprodi = create_user(db_session, nama="Kaprodi TI", role="moderator")
    admin = create_user(db_session, nama="Admin Kampus", role="admin")

    # Try blocking Kaprodi
    res1 = client.post(
        "/api/v1/blocks",
        json={"blocked_id": kaprodi.user_id},
        headers=auth_headers(student),
    )
    assert res1.status_code == 422
    assert res1.json()["code"] == "CANNOT_BLOCK_STAFF"

    # Try blocking Admin
    res2 = client.post(
        "/api/v1/blocks",
        json={"blocked_id": admin.user_id},
        headers=auth_headers(student),
    )
    assert res2.status_code == 422
    assert res2.json()["code"] == "CANNOT_BLOCK_STAFF"


def test_block_idempotency(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # First block
    res1 = client.post(
        "/api/v1/blocks",
        json={"blocked_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res1.status_code in (200, 201)

    # Second block (idempotent duplicate)
    res2 = client.post(
        "/api/v1/blocks",
        json={"blocked_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res2.status_code in (200, 201)
    assert res2.json()["block_id"] == res1.json()["block_id"]


def test_unblock_user_success(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # Block B
    client.post(
        "/api/v1/blocks",
        json={"blocked_id": user_b.user_id},
        headers=auth_headers(user_a),
    )

    # Unblock B
    res_unblock = client.delete(
        f"/api/v1/blocks/{user_b.user_id}",
        headers=auth_headers(user_a),
    )
    assert res_unblock.status_code == 204

    # Now B can view A's profile again
    res_b_views_a = client.get(
        f"/api/v1/users/{user_a.user_id}",
        headers=auth_headers(user_b),
    )
    assert res_b_views_a.status_code == 200

    # But friendship is NOT automatically restored
    assert res_b_views_a.json()["friendship_status"] == "none"


def test_mutual_block_both_ways(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # Both block each other
    client.post("/api/v1/blocks", json={"blocked_id": user_b.user_id}, headers=auth_headers(user_a))
    client.post("/api/v1/blocks", json={"blocked_id": user_a.user_id}, headers=auth_headers(user_b))

    # User A unblocks User B
    client.delete(f"/api/v1/blocks/{user_b.user_id}", headers=auth_headers(user_a))

    # User A still gets 404 because User B still blocks User A!
    res = client.get(f"/api/v1/users/{user_b.user_id}", headers=auth_headers(user_a))
    assert res.status_code == 404
    assert res.json()["code"] == "USER_NOT_FOUND"


def test_list_blocked_users_paginated(client, db_session: Session):
    user_me = create_user(db_session, nama="Me")
    blocked1 = create_user(db_session, nama="Spammer 1")
    blocked2 = create_user(db_session, nama="Spammer 2")

    client.post("/api/v1/blocks", json={"blocked_id": blocked1.user_id, "alasan": "Spam"}, headers=auth_headers(user_me))
    client.post("/api/v1/blocks", json={"blocked_id": blocked2.user_id, "alasan": "Toxic"}, headers=auth_headers(user_me))

    res = client.get("/api/v1/blocks?page=1&limit=10", headers=auth_headers(user_me))
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["blocked_id"] in (blocked1.user_id, blocked2.user_id)


def test_staff_exempt_from_block_when_viewing_profile_and_post(client, db_session: Session):
    from app.models.entities import Post, UserBlock

    student = create_user(db_session, nama="Mahasiswa Nakal", role="mahasiswa", jurusan="Teknik Informatika")
    moderator = create_user(db_session, nama="Pak Kaprodi", role="moderator", jurusan="Teknik Informatika")

    # Simulate an anomaly block record in DB: student blocks staff
    anomaly_block = UserBlock(blocker_id=student.user_id, blocked_id=moderator.user_id)
    db_session.add(anomaly_block)

    # Create post by student
    post = Post(user_id=student.user_id, isi="Postingan yang dilaporkan", status="tayang", tipe="umum")
    db_session.add(post)
    db_session.commit()

    # 1. Moderator views student's profile -> 200 OK (staff is exempt from block 404)
    res_prof = client.get(f"/api/v1/users/{student.user_id}", headers=auth_headers(moderator))
    assert res_prof.status_code == 200
    assert res_prof.json()["user_id"] == student.user_id

    # 2. Moderator views reported post -> 200 OK (staff is exempt from post block 404)
    res_post = client.get(f"/api/v1/posts/{post.post_id}", headers=auth_headers(moderator))
    assert res_post.status_code == 200
    assert res_post.json()["post_id"] == post.post_id


def test_block_user_accepts_mobile_and_alias_payloads(client, db_session: Session):
    user_a = create_user(db_session, nama="User Mobile Blocker")
    user_b = create_user(db_session, nama="User Mobile Blocked")

    # Mobile payload using blocked_user_id
    res = client.post(
        "/api/v1/blocks",
        json={
            "blocked_user_id": user_b.user_id,
            "alasan": "  Pemblokiran melalui aplikasi mobile  ",
        },
        headers=auth_headers(user_a),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["blocker_id"] == user_a.user_id
    assert data["blocked_id"] == user_b.user_id
    assert data["alasan"] == "Pemblokiran melalui aplikasi mobile"


def test_block_user_accepts_string_numeric_id_and_alt_aliases(client, db_session: Session):
    user_a = create_user(db_session, nama="User Alt Blocker")
    user_b = create_user(db_session, nama="User Alt Blocked 1")
    user_c = create_user(db_session, nama="User Alt Blocked 2")

    # String numeric blocked_id
    res_str = client.post(
        "/api/v1/blocks",
        json={"blocked_id": str(user_b.user_id), "alasan": ""},
        headers=auth_headers(user_a),
    )
    assert res_str.status_code == 201
    assert res_str.json()["blocked_id"] == user_b.user_id
    assert res_str.json()["alasan"] is None

    # Alternative alias user_id
    res_alt = client.post(
        "/api/v1/blocks",
        json={"user_id": user_c.user_id},
        headers=auth_headers(user_a),
    )
    assert res_alt.status_code == 201
    assert res_alt.json()["blocked_id"] == user_c.user_id


def test_unblock_user_idempotent(client, db_session: Session):
    user_a = create_user(db_session, nama="Blocker Idempotent")
    user_b = create_user(db_session, nama="Blocked Idempotent")

    # Block user
    res_block = client.post(
        "/api/v1/blocks",
        json={"blocked_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_block.status_code == 201

    # First unblock -> 204 No Content
    res_unblock_1 = client.delete(
        f"/api/v1/blocks/{user_b.user_id}",
        headers=auth_headers(user_a),
    )
    assert res_unblock_1.status_code == 204

    # Second unblock (idempotent retry) -> 204 No Content (NOT 404)
    res_unblock_2 = client.delete(
        f"/api/v1/blocks/{user_b.user_id}",
        headers=auth_headers(user_a),
    )
    assert res_unblock_2.status_code == 204


def test_unblock_legacy_staff_anomaly(client, db_session: Session):
    from app.models.entities import UserBlock

    student = create_user(db_session, nama="Mahasiswa Anomaly", role="mahasiswa")
    moderator = create_user(db_session, nama="Kaprodi Anomaly", role="moderator")

    # Seed anomaly block: student blocks moderator
    anomaly = UserBlock(blocker_id=student.user_id, blocked_id=moderator.user_id)
    db_session.add(anomaly)
    db_session.commit()

    # Staff appears in student's blocked list
    res_list = client.get("/api/v1/blocks", headers=auth_headers(student))
    assert res_list.status_code == 200
    items = res_list.json()["items"]
    assert any(item["blocked_id"] == moderator.user_id for item in items)

    # Student can unblock staff
    res_del = client.delete(f"/api/v1/blocks/{moderator.user_id}", headers=auth_headers(student))
    assert res_del.status_code == 204


def test_block_and_unblock_preserves_rejection_cooldown(client, db_session: Session):
    user_a = create_user(db_session, nama="Requester Cooldown")
    user_b = create_user(db_session, nama="Rejector Cooldown")

    # 1. A requests B
    res_req = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_req.status_code == 201
    fid = res_req.json()["friendship_id"]

    # 2. B rejects A
    res_rej = client.patch(
        f"/api/v1/friendships/{fid}",
        json={"status": "ditolak"},
        headers=auth_headers(user_b),
    )
    assert res_rej.status_code == 200

    # 3. A blocks B
    res_block = client.post(
        "/api/v1/blocks",
        json={"blocked_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_block.status_code == 201

    # Verify 'ditolak' row was preserved in DB
    rejected_row = (
        db_session.query(Friendship)
        .filter(Friendship.friendship_id == fid, Friendship.status == "ditolak")
        .first()
    )
    assert rejected_row is not None

    # 4. A unblocks B
    res_unblock = client.delete(
        f"/api/v1/blocks/{user_b.user_id}",
        headers=auth_headers(user_a),
    )
    assert res_unblock.status_code == 204

    # 5. A tries to re-request B immediately (< 24h) -> MUST fail with 429 COOLDOWN_ACTIVE
    res_retry = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_retry.status_code == 429
    assert res_retry.json()["code"] == "COOLDOWN_ACTIVE"


def test_profile_contract_action_flags_and_privacy(client, db_session: Session):
    student_a = create_user(db_session, nama="Student Blocker Alpha", role="mahasiswa", jurusan="Teknik Informatika")
    student_b = create_user(db_session, nama="Student Blocked Beta", role="mahasiswa", jurusan="Teknik Informatika")
    moderator = create_user(db_session, nama="Kaprodi Supervisor", role="moderator", jurusan="Teknik Informatika")

    # 1. Normal student view: can_friend=True, can_block=True, can_unblock=False, nim/email=None
    res_normal = client.get(f"/api/v1/users/{student_b.user_id}", headers=auth_headers(student_a))
    assert res_normal.status_code == 200
    data_normal = res_normal.json()
    assert data_normal["friendship_status"] == "none"
    assert data_normal["can_friend"] is True
    assert data_normal["can_block"] is True
    assert data_normal["can_unblock"] is False
    assert data_normal["nim"] is None
    assert data_normal["email"] is None

    # 2. Student A blocks Student B
    client.post("/api/v1/blocks", json={"blocked_id": student_b.user_id}, headers=auth_headers(student_a))

    # A views B: restricted profile with friendship_status="blocked", can_unblock=True
    res_a_views_b = client.get(f"/api/v1/users/{student_b.user_id}", headers=auth_headers(student_a))
    assert res_a_views_b.status_code == 200
    data_blocked = res_a_views_b.json()
    assert data_blocked["friendship_status"] == "blocked"
    assert data_blocked["can_friend"] is False
    assert data_blocked["can_block"] is False
    assert data_blocked["can_unblock"] is True
    assert data_blocked["nim"] is None
    assert data_blocked["email"] is None

    # B views A: 404 anti-leak
    res_b_views_a = client.get(f"/api/v1/users/{student_a.user_id}", headers=auth_headers(student_b))
    assert res_b_views_a.status_code == 404
    assert res_b_views_a.json()["code"] == "USER_NOT_FOUND"

    # 3. Moderator views Student B: can_friend=False, can_block=False, nim/email visible
    res_mod = client.get(f"/api/v1/users/{student_b.user_id}", headers=auth_headers(moderator))
    assert res_mod.status_code == 200
    data_mod = res_mod.json()
    assert data_mod["can_friend"] is False
    assert data_mod["can_block"] is False
    assert data_mod["nim"] is not None


def test_mutual_block_evaluation_order(client, db_session: Session):
    user_a = create_user(db_session, nama="Mutual Alpha")
    user_b = create_user(db_session, nama="Mutual Beta")

    # Mutual block
    client.post("/api/v1/blocks", json={"blocked_id": user_b.user_id}, headers=auth_headers(user_a))
    client.post("/api/v1/blocks", json={"blocked_id": user_a.user_id}, headers=auth_headers(user_b))

    # Target blocking viewer check is evaluated BEFORE blocked_by_me, so A gets 404 on B
    res_a_views_b = client.get(f"/api/v1/users/{user_b.user_id}", headers=auth_headers(user_a))
    assert res_a_views_b.status_code == 404
    assert res_a_views_b.json()["code"] == "USER_NOT_FOUND"

    # But B is still in A's blocked list and can be unblocked directly
    res_list = client.get("/api/v1/blocks", headers=auth_headers(user_a))
    assert res_list.status_code == 200
    assert any(item["blocked_id"] == user_b.user_id for item in res_list.json()["items"])

    res_unblock = client.delete(f"/api/v1/blocks/{user_b.user_id}", headers=auth_headers(user_a))
    assert res_unblock.status_code == 204


def test_surface_visibility_matrix(client, db_session: Session):
    from app.models.entities import Post

    user_a = create_user(db_session, nama="Matrix Alpha")
    user_b = create_user(db_session, nama="Matrix Beta")

    # User B creates a post
    post = Post(user_id=user_b.user_id, isi="Postingan Matrix Beta", status="tayang", tipe="umum")
    db_session.add(post)
    db_session.commit()

    # User A blocks User B
    client.post("/api/v1/blocks", json={"blocked_id": user_b.user_id}, headers=auth_headers(user_a))

    # 1. Feed: hidden
    res_feed = client.get("/api/v1/posts", headers=auth_headers(user_a))
    assert res_feed.status_code == 200
    feed_posts = res_feed.json()["items"]
    assert not any(p["post_id"] == post.post_id for p in feed_posts)

    # 2. Search: hidden
    res_search = client.get(f"/api/v1/search?q={user_b.nama}", headers=auth_headers(user_a))
    assert res_search.status_code == 200
    assert not any(s["user_id"] == user_b.user_id for s in res_search.json().get("students", []))

    # 3. Unblock: restored
    client.delete(f"/api/v1/blocks/{user_b.user_id}", headers=auth_headers(user_a))
    res_feed_after = client.get("/api/v1/posts", headers=auth_headers(user_a))
    assert res_feed_after.status_code == 200
    assert any(p["post_id"] == post.post_id for p in res_feed_after.json()["items"])

