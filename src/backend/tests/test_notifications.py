from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import User
from app.services.notification import create_notification


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


def test_notification_flow_and_unread_count(client, db_session: Session):
    user = create_user(db_session, "Notif Receiver")
    headers = auth_headers(user)

    # 1. Initial count should be 0
    res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 0

    # 2. Create notification
    notif = create_notification(
        db=db_session,
        user_id=user.user_id,
        jenis="moderasi_disetujui",
        judul="Postingan Disetujui",
        isi="Postingan Anda telah disetujui moderator.",
        tautan="/posts/101",
        ref_type="post",
        ref_id=101,
    )
    db_session.commit()
    assert notif is not None

    # 3. Count should now be 1
    res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 1

    # 4. List notifications
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["notification_id"] == notif.notification_id
    assert items[0]["is_read"] is False
    assert items[0]["jenis"] == "moderasi_disetujui"
    assert items[0]["tautan"] == "/posts/101"

    # 5. Mark single notification as read
    res = client.patch(f"/api/v1/notifications/{notif.notification_id}/read", headers=headers)
    assert res.status_code == 200
    assert res.json()["is_read"] is True

    # 6. Count should now be 0
    res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 0


def test_notification_read_all(client, db_session: Session):
    user = create_user(db_session, "Multi Notif User")
    headers = auth_headers(user)

    # Create 3 notifications
    for i in range(1, 4):
        create_notification(
            db=db_session,
            user_id=user.user_id,
            jenis="laporan_selesai",
            judul=f"Laporan {i} Ditindaklanjuti",
            isi=f"Laporan ke-{i} Anda selesai.",
            tautan=None,
            ref_type="report",
            ref_id=i,
        )
    db_session.commit()

    # Check unread count is 3
    res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 3

    # Mark all as read
    res = client.patch("/api/v1/notifications/read-all", headers=headers)
    assert res.status_code == 200
    assert res.json()["updated_count"] == 3

    # Check unread count is now 0
    res = client.get("/api/v1/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    assert res.json()["unread_count"] == 0


def test_notification_user_data_isolation(client, db_session: Session):
    user_a = create_user(db_session, "User A")
    user_b = create_user(db_session, "User B")

    notif_a = create_notification(
        db=db_session,
        user_id=user_a.user_id,
        jenis="moderasi_revisi",
        judul="Perlu Revisi",
        isi="Harap perbaiki konten Anda.",
        tautan="/posts/202",
        ref_type="post",
        ref_id=202,
    )
    db_session.commit()

    headers_b = auth_headers(user_b)

    # User B list should not include User A's notification
    res = client.get("/api/v1/notifications", headers=headers_b)
    assert res.status_code == 200
    assert len(res.json()) == 0

    # User B trying to mark User A's notification as read should return 404 (anti-leak)
    res = client.patch(f"/api/v1/notifications/{notif_a.notification_id}/read", headers=headers_b)
    assert res.status_code == 404
    assert "tidak ditemukan" in res.json()["detail"]


def test_notification_unread_only_filter_and_pagination(client, db_session: Session):
    user = create_user(db_session, "Pagination User")
    headers = auth_headers(user)

    # Create 4 notifications
    notifs = []
    for i in range(1, 5):
        n = create_notification(
            db=db_session,
            user_id=user.user_id,
            jenis="moderasi_disetujui",
            judul=f"Notif {i}",
            isi=f"Isi {i}",
            tautan=f"/posts/{i}",
            ref_type="post",
            ref_id=i + 300,
        )
        notifs.append(n)
    db_session.commit()

    # Mark first notification as read
    client.patch(f"/api/v1/notifications/{notifs[0].notification_id}/read", headers=headers)

    # Filter unread_only=true should return 3
    res = client.get("/api/v1/notifications?unread_only=true", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 3

    # Pagination test: limit 2 offset 0
    res = client.get("/api/v1/notifications?limit=2&offset=0", headers=headers)
    assert res.status_code == 200
    page1 = res.json()
    assert len(page1) == 2

    # Pagination test: limit 2 offset 2
    res = client.get("/api/v1/notifications?limit=2&offset=2", headers=headers)
    assert res.status_code == 200
    page2 = res.json()
    assert len(page2) == 2

    # Ensure items don't overlap
    page1_ids = {p["notification_id"] for p in page1}
    page2_ids = {p["notification_id"] for p in page2}
    assert page1_ids.isdisjoint(page2_ids)


def test_notification_ref_dedup_idempotency(db_session: Session):
    user = create_user(db_session, "Dedup User")

    # First call succeeds
    notif1 = create_notification(
        db=db_session,
        user_id=user.user_id,
        jenis="moderasi_takedown",
        judul="Takedown 1",
        isi="Alasan 1",
        ref_type="post",
        ref_id=999,
    )
    db_session.commit()
    assert notif1 is not None

    # Second call with same ref_type and ref_id returns None (idempotent rollback)
    notif2 = create_notification(
        db=db_session,
        user_id=user.user_id,
        jenis="moderasi_takedown",
        judul="Takedown 2",
        isi="Alasan 2",
        ref_type="post",
        ref_id=999,
    )
    assert notif2 is None


def test_notification_internal_path_validation(db_session: Session):
    user = create_user(db_session, "Path Validation User")

    # External URL rejected, sanitized to None
    notif_ext = create_notification(
        db=db_session,
        user_id=user.user_id,
        jenis="laporan_diabaikan",
        judul="Laporan Diabaikan",
        isi="Isi",
        tautan="https://malicious-external-site.com/steal-creds",
    )
    db_session.commit()
    assert notif_ext.tautan is None

    # Valid internal relative path accepted
    notif_int = create_notification(
        db=db_session,
        user_id=user.user_id,
        jenis="laporan_diabaikan",
        judul="Laporan Diabaikan Internal",
        isi="Isi",
        tautan="/portfolio",
    )
    db_session.commit()
    assert notif_int.tautan == "/portfolio"
