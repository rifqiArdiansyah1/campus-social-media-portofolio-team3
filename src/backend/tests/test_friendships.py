from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.api.v1.endpoints import friendships as friendships_module
from app.core.security import create_access_token
from app.models.entities import Friendship, User, UserBlock


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


def test_friend_request_normal_flow_and_accept(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # 1. A sends request to B
    res = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["requester_id"] == user_a.user_id
    assert data["addressee_id"] == user_b.user_id
    assert data["status"] == "menunggu"
    friendship_id = data["friendship_id"]

    # 2. B views incoming request
    res_list = client.get(
        "/api/v1/friendships?direction=incoming",
        headers=auth_headers(user_b),
    )
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] == 1
    assert list_data["items"][0]["friendship_id"] == friendship_id
    assert list_data["items"][0]["counterpart"]["user_id"] == user_a.user_id

    # 3. B accepts the request
    res_accept = client.patch(
        f"/api/v1/friendships/{friendship_id}",
        json={"status": "diterima"},
        headers=auth_headers(user_b),
    )
    assert res_accept.status_code == 200
    assert res_accept.json()["status"] == "diterima"
    assert res_accept.json()["updated_at"] is not None

    # 4. Check active friends list for both A and B
    res_friends_a = client.get("/api/v1/friends", headers=auth_headers(user_a))
    assert res_friends_a.status_code == 200
    friends_a = res_friends_a.json()["items"]
    assert any(f["user_id"] == user_b.user_id for f in friends_a)

    res_friends_b = client.get("/api/v1/friends", headers=auth_headers(user_b))
    assert res_friends_b.status_code == 200
    friends_b = res_friends_b.json()["items"]
    assert any(f["user_id"] == user_a.user_id for f in friends_b)


def test_friend_request_reject_flow(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    res = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res.status_code == 201
    friendship_id = res.json()["friendship_id"]

    # B rejects the request
    res_reject = client.patch(
        f"/api/v1/friendships/{friendship_id}",
        json={"status": "ditolak"},
        headers=auth_headers(user_b),
    )
    assert res_reject.status_code == 200
    assert res_reject.json()["status"] == "ditolak"

    # Outgoing requests for A should NOT leak rejected status (remains empty or filtered)
    res_out = client.get(
        "/api/v1/friendships?direction=outgoing",
        headers=auth_headers(user_a),
    )
    assert res_out.status_code == 200
    assert res_out.json()["total"] == 0


def test_friend_request_cannot_friend_self(client, db_session: Session):
    user = create_user(db_session, nama="Self Mahasiswa")
    res = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user.user_id},
        headers=auth_headers(user),
    )
    assert res.status_code == 422
    assert res.json()["code"] == "CANNOT_FRIEND_SELF"


def test_friend_request_involving_staff_forbidden(client, db_session: Session):
    student = create_user(db_session, nama="Mahasiswa Biasa", role="mahasiswa")
    kaprodi = create_user(db_session, nama="Kaprodi TI", role="moderator")
    admin = create_user(db_session, nama="Admin Kampus", role="admin")

    # Student -> Kaprodi
    res1 = client.post(
        "/api/v1/friendships",
        json={"addressee_id": kaprodi.user_id},
        headers=auth_headers(student),
    )
    assert res1.status_code == 422
    assert res1.json()["code"] == "STUDENT_ONLY"

    # Admin -> Student
    res2 = client.post(
        "/api/v1/friendships",
        json={"addressee_id": student.user_id},
        headers=auth_headers(admin),
    )
    assert res2.status_code == 422
    assert res2.json()["code"] == "STUDENT_ONLY"


def test_friend_request_to_blocking_user_returns_404_anti_leak(client, db_session: Session):
    user_a = create_user(db_session, nama="Viewer A")
    user_b = create_user(db_session, nama="Target B")

    # B blocks A
    block = UserBlock(blocker_id=user_b.user_id, blocked_id=user_a.user_id)
    db_session.add(block)
    db_session.commit()

    # A tries to send friend request to B -> 404 anti-leak
    res = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res.status_code == 404
    assert res.json()["code"] == "USER_NOT_FOUND"


def test_friend_request_from_blocked_user_forbidden(client, db_session: Session):
    user_a = create_user(db_session, nama="Viewer A")
    user_b = create_user(db_session, nama="Target B")

    # A blocks B
    block = UserBlock(blocker_id=user_a.user_id, blocked_id=user_b.user_id)
    db_session.add(block)
    db_session.commit()

    # A tries to send friend request to B while A has blocked B -> 422 / 400
    res = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res.status_code == 422
    assert res.json()["code"] == "BLOCKED_USER"


def test_friend_request_duplicate_same_and_reverse_direction(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # 1. First request
    res1 = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res1.status_code == 201
    friendship_id = res1.json()["friendship_id"]

    # 2. A sends again to B -> 409 PENDING_REQUEST_EXISTS
    res2 = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res2.status_code == 409
    assert res2.json()["code"] == "PENDING_REQUEST_EXISTS"

    # 3. B sends to A -> 409 INCOMING_REQUEST_EXISTS with friendship_id
    res3 = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_a.user_id},
        headers=auth_headers(user_b),
    )
    assert res3.status_code == 409
    assert res3.json()["code"] == "INCOMING_REQUEST_EXISTS"
    assert res3.json()["friendship_id"] == friendship_id


def test_friend_request_cooldown_24h_with_mock_clock(client, db_session: Session, monkeypatch):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    base_time = datetime(2026, 11, 7, 10, 0, 0)
    monkeypatch.setattr(friendships_module, "get_system_now", lambda: base_time)

    # 1. A sends request
    res_req = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_req.status_code == 201
    fid = res_req.json()["friendship_id"]

    # 2. B rejects at base_time + 10 mins
    reject_time = base_time + timedelta(minutes=10)
    monkeypatch.setattr(friendships_module, "get_system_now", lambda: reject_time)
    res_rej = client.patch(
        f"/api/v1/friendships/{fid}",
        json={"status": "ditolak"},
        headers=auth_headers(user_b),
    )
    assert res_rej.status_code == 200

    # 3. A tries to re-request after 5 hours (< 24 hours) -> 429 RateLimitError
    retry_early = reject_time + timedelta(hours=5)
    monkeypatch.setattr(friendships_module, "get_system_now", lambda: retry_early)
    res_early = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_early.status_code == 429
    assert res_early.json()["code"] == "COOLDOWN_ACTIVE"
    assert "Retry-After" in res_early.headers

    # 4. A tries after 25 hours (>= 24 hours) -> 200/201 Success row updated
    retry_ok = reject_time + timedelta(hours=25)
    monkeypatch.setattr(friendships_module, "get_system_now", lambda: retry_ok)
    res_ok = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    assert res_ok.status_code in (200, 201)
    assert res_ok.json()["status"] == "menunggu"
    assert res_ok.json()["friendship_id"] == fid


def test_idor_and_status_guards(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")
    user_c = create_user(db_session, nama="Mahasiswa C (Third Party)")

    # A requests B
    res = client.post(
        "/api/v1/friendships",
        json={"addressee_id": user_b.user_id},
        headers=auth_headers(user_a),
    )
    fid = res.json()["friendship_id"]

    # 1. C tries to accept A's request to B -> 404 anti-IDOR
    res_idor_patch = client.patch(
        f"/api/v1/friendships/{fid}",
        json={"status": "diterima"},
        headers=auth_headers(user_c),
    )
    assert res_idor_patch.status_code == 404

    # 2. Requester A tries to PATCH accept -> 404 anti-IDOR
    res_req_patch = client.patch(
        f"/api/v1/friendships/{fid}",
        json={"status": "diterima"},
        headers=auth_headers(user_a),
    )
    assert res_req_patch.status_code == 404

    # 3. Addressee B tries to DELETE pending request -> 422 / 400 (must use PATCH to reject)
    res_addr_del = client.delete(
        f"/api/v1/friendships/{fid}",
        headers=auth_headers(user_b),
    )
    assert res_addr_del.status_code == 422
    assert res_addr_del.json()["code"] == "USE_PATCH_TO_REJECT"

    # 4. Requester A can DELETE pending request (Cancel)
    res_cancel = client.delete(
        f"/api/v1/friendships/{fid}",
        headers=auth_headers(user_a),
    )
    assert res_cancel.status_code == 204


def test_unfriend_by_either_party(client, db_session: Session):
    user_a = create_user(db_session, nama="Mahasiswa A")
    user_b = create_user(db_session, nama="Mahasiswa B")

    # Create accepted friendship
    f = Friendship(requester_id=user_a.user_id, addressee_id=user_b.user_id, status="diterima")
    db_session.add(f)
    db_session.commit()
    fid = f.friendship_id

    # User B unfriends User A
    res_del = client.delete(f"/api/v1/friendships/{fid}", headers=auth_headers(user_b))
    assert res_del.status_code == 204

    # Verify friendship is deleted
    assert db_session.query(Friendship).filter(Friendship.friendship_id == fid).first() is None


def test_friends_query_pagination_and_escaping(client, db_session: Session):
    user_me = create_user(db_session, nama="Saya Mahasiswa")
    friend_special = create_user(db_session, nama="Special_Friend%Name", jurusan="Teknik Informatika")

    f = Friendship(requester_id=user_me.user_id, addressee_id=friend_special.user_id, status="diterima")
    db_session.add(f)
    db_session.commit()

    # Test exact match with escaped underscore
    res_search = client.get("/api/v1/friends?q=Friend%Name", headers=auth_headers(user_me))
    assert res_search.status_code == 200
    items = res_search.json()["items"]
    assert len(items) == 1
    assert items[0]["user_id"] == friend_special.user_id
