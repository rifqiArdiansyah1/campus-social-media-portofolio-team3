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
