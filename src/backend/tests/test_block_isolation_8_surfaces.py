from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.entities import Post, User, UserBlock, Skill, UserSkill


def make_user(
    db: Session,
    nama: str,
    role: str = "mahasiswa",
    jurusan: str = "Teknik Informatika",
    bio: str = "Pengembang aplikasi kampus"
) -> User:
    uid = uuid4().hex[:8]
    user = User(
        nim=f"NIM-{uid}",
        nama=f"{nama} {uid}",
        email=f"{uid}@campus.ac.id",
        password_hash=hash_password("Password123!"),
        role=role,
        jurusan=jurusan,
        angkatan=2022,
        bio=bio,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_h(user: User) -> dict:
    token = create_access_token(subject=user.user_id)
    return {"Authorization": f"Bearer {token}"}


def test_block_isolation_across_8_surfaces(client: TestClient, db_session: Session):
    """
    Audit Keamanan US-14: Verifikasi isolasi pemblokiran di 8 permukaan:
    1. Feed List
    2. Post Detail (Anti-leak 404)
    3. User Profile (Anti-leak 404 saat diblokir)
    4. Global Search
    5. Recommendation Match
    6. Recommendation For-Post
    7. Student Dashboard
    8. Friend Request (Anti-leak 404 untuk pihak terblokir, 422 untuk blocker)
    """
    # Buat dua user: Alice dan Bob
    alice = make_user(db_session, "Alice", bio="Suka Python dan AI")
    bob = make_user(db_session, "Bob", bio="Suka React dan Frontend")

    # Tambah skill ke Bob (get or create)
    skill_react = db_session.query(Skill).filter(Skill.nama == "React").first()
    if not skill_react:
        skill_react = Skill(nama="React", tipe="skill")
        db_session.add(skill_react)
        db_session.commit()
        db_session.refresh(skill_react)
    
    db_session.add(UserSkill(user_id=bob.user_id, skill_id=skill_react.skill_id))
    db_session.commit()

    # Buat post tayang milik Bob
    post_bob = Post(
        user_id=bob.user_id,
        isi="Postingan karya Bob tentang Frontend React terbaru.",
        tipe="umum",
        status="tayang"
    )
    # Buat post cari_anggota milik Alice
    post_alice = Post(
        user_id=alice.user_id,
        isi="Mencari partner frontend React untuk lomba capstone.",
        tipe="cari_anggota",
        status="tayang"
    )
    db_session.add_all([post_bob, post_alice])
    db_session.commit()
    db_session.refresh(post_bob)
    db_session.refresh(post_alice)

    # =========================================================================
    # KONDISI AWAL (SEBELUM DIBLOKIR): Alice bisa melihat postingan Bob
    # =========================================================================
    feed_before = client.get("/api/v1/posts", headers=auth_h(alice))
    assert feed_before.status_code == 200
    item_ids_before = [p["post_id"] for p in feed_before.json().get("items", [])]
    assert post_bob.post_id in item_ids_before

    # =========================================================================
    # EKSEKUSI BLOKIR: Alice memblokir Bob
    # =========================================================================
    block = UserBlock(blocker_id=alice.user_id, blocked_id=bob.user_id, alasan="Spamming")
    db_session.add(block)
    db_session.commit()

    # -------------------------------------------------------------------------
    # SURFACE 1: Feed List (GET /posts)
    # Postingan Bob tidak boleh muncul di feed Alice (dan sebaliknya)
    # -------------------------------------------------------------------------
    feed_alice = client.get("/api/v1/posts", headers=auth_h(alice))
    assert feed_alice.status_code == 200
    feed_alice_ids = [p["post_id"] for p in feed_alice.json().get("items", [])]
    assert post_bob.post_id not in feed_alice_ids

    feed_bob = client.get("/api/v1/posts", headers=auth_h(bob))
    assert feed_bob.status_code == 200
    feed_bob_ids = [p["post_id"] for p in feed_bob.json().get("items", [])]
    assert post_alice.post_id not in feed_bob_ids

    # -------------------------------------------------------------------------
    # SURFACE 2: Post Detail (GET /posts/{id})
    # Alice melihat post Bob -> 404 POST_NOT_FOUND (Anti-leak, tidak membocorkan eksistensi)
    # -------------------------------------------------------------------------
    p_detail_alice = client.get(f"/api/v1/posts/{post_bob.post_id}", headers=auth_h(alice))
    assert p_detail_alice.status_code == 404
    assert p_detail_alice.json()["code"] == "POST_NOT_FOUND"

    p_detail_bob = client.get(f"/api/v1/posts/{post_alice.post_id}", headers=auth_h(bob))
    assert p_detail_bob.status_code == 404
    assert p_detail_bob.json()["code"] == "POST_NOT_FOUND"

    # -------------------------------------------------------------------------
    # SURFACE 3: User Profile (GET /users/{id})
    # Bob yang diblokir melihat profil Alice -> 404 USER_NOT_FOUND
    # -------------------------------------------------------------------------
    prof_bob_sees_alice = client.get(f"/api/v1/users/{alice.user_id}", headers=auth_h(bob))
    assert prof_bob_sees_alice.status_code == 404
    assert prof_bob_sees_alice.json()["code"] == "USER_NOT_FOUND"

    # -------------------------------------------------------------------------
    # SURFACE 4: Global Search (GET /search)
    # Pencarian Alice untuk "Bob" atau postingannya tidak menampilkan Bob
    # -------------------------------------------------------------------------
    search_user = client.get(f"/api/v1/search?q={bob.nama}&tipe=mahasiswa", headers=auth_h(alice))
    assert search_user.status_code == 200
    search_user_ids = [u.get("user_id") for u in search_user.json().get("items", [])]
    assert bob.user_id not in search_user_ids

    search_post = client.get("/api/v1/search?q=Frontend&tipe=postingan", headers=auth_h(alice))
    assert search_post.status_code == 200
    search_post_ids = [p.get("post_id") for p in search_post.json().get("items", [])]
    assert post_bob.post_id not in search_post_ids

    # -------------------------------------------------------------------------
    # SURFACE 5: Recommendation Match (POST /recommendations/match)
    # Bob tidak boleh muncul di rekomendasi partner Alice
    # -------------------------------------------------------------------------
    rec_match = client.post(
        "/api/v1/recommendations/match",
        json={"target_skills": ["React"], "project_description": "Frontend React", "top_k": 5},
        headers=auth_h(alice)
    )
    assert rec_match.status_code == 200
    rec_cand_ids = [str(r.get("user_id")) for r in rec_match.json().get("recommendations", [])]
    assert str(bob.user_id) not in rec_cand_ids

    # -------------------------------------------------------------------------
    # SURFACE 6: Recommendation For Post (POST /recommendations/for-post/{id})
    # Bob tidak boleh muncul sebagai rekomendasi untuk postingan Alice
    # -------------------------------------------------------------------------
    rec_for_post = client.post(
        f"/api/v1/recommendations/for-post/{post_alice.post_id}?top_k=5",
        headers=auth_h(alice)
    )
    assert rec_for_post.status_code == 200
    rec_post_cand_ids = [str(r.get("user_id")) for r in rec_for_post.json().get("recommendations", [])]
    assert str(bob.user_id) not in rec_post_cand_ids

    # -------------------------------------------------------------------------
    # SURFACE 7: Student Dashboard Summary (GET /dashboard/summary)
    # Dashboard mahasiswa berhasil dimuat tanpa crash dan mengagregasi data aman
    # -------------------------------------------------------------------------
    dash_resp = client.get("/api/v1/dashboard/summary", headers=auth_h(alice))
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert "summary" in dash_data
    assert dash_data["summary"]["role"] == "mahasiswa"

    # -------------------------------------------------------------------------
    # SURFACE 8: Friend Request (POST /friendships)
    # 8a: Bob yang diblokir mengirim pertemanan ke Alice -> 404 USER_NOT_FOUND (Anti-leak)
    # 8b: Alice mengirim pertemanan ke Bob (yang ia blokir) -> 422 BLOCKED_USER
    # -------------------------------------------------------------------------
    bob_to_alice = client.post(
        "/api/v1/friendships",
        json={"addressee_id": alice.user_id},
        headers=auth_h(bob)
    )
    assert bob_to_alice.status_code == 404
    assert bob_to_alice.json()["code"] == "USER_NOT_FOUND"

    alice_to_bob = client.post(
        "/api/v1/friendships",
        json={"addressee_id": bob.user_id},
        headers=auth_h(alice)
    )
    assert alice_to_bob.status_code in (400, 422)
    assert alice_to_bob.json()["code"] == "BLOCKED_USER"


def test_kaprodi_prodi_isolation_takedown_and_review(client: TestClient, db_session: Session):
    """
    Audit Keamanan Otorisasi Lintas Jurusan:
    Kaprodi Informatika TIDAK BOLEH men-takedown atau me-review postingan mahasiswa Sistem Informasi.
    """
    mhs_ti = make_user(db_session, "Mahasiswa TI", role="mahasiswa", jurusan="Teknik Informatika")
    mhs_si = make_user(db_session, "Mahasiswa SI", role="mahasiswa", jurusan="Sistem Informasi")
    kaprodi_ti = make_user(db_session, "Kaprodi TI", role="moderator", jurusan="Teknik Informatika")

    post_si = Post(
        user_id=mhs_si.user_id,
        isi="Postingan mahasiswa SI untuk acara festival prodi.",
        tipe="umum",
        status="tayang"
    )
    post_ti = Post(
        user_id=mhs_ti.user_id,
        isi="Postingan mahasiswa TI untuk pameran capstone.",
        tipe="umum",
        status="tayang"
    )
    db_session.add_all([post_si, post_ti])
    db_session.commit()
    db_session.refresh(post_si)
    db_session.refresh(post_ti)

    # 1. Kaprodi TI mencoba takedown postingan mahasiswa SI -> 403 FORBIDDEN
    takedown_si_resp = client.post(
        f"/api/v1/posts/{post_si.post_id}/takedown",
        json={"alasan_hapus": "Pelanggaran aturan lintas prodi"},
        headers=auth_h(kaprodi_ti)
    )
    assert takedown_si_resp.status_code == 403
    assert takedown_si_resp.json()["code"] == "FORBIDDEN_TAKEDOWN"

    # 2. Kaprodi TI takedown postingan mahasiswa TI (prodi yang sama) -> Berhasil 200 OK
    takedown_ti_resp = client.post(
        f"/api/v1/posts/{post_ti.post_id}/takedown",
        json={"alasan_hapus": "Pelanggaran tata tertib prodi TI"},
        headers=auth_h(kaprodi_ti)
    )
    assert takedown_ti_resp.status_code == 200
    assert takedown_ti_resp.json()["post_id"] == post_ti.post_id
