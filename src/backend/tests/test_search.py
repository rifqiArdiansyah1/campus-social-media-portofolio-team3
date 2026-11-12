from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.entities import (
    PortfolioItem,
    PortfolioSkill,
    Post,
    Skill,
    User,
    UserBlock,
    UserSkill,
)


def get_or_create_skill(db: Session, nama: str, tipe: str = "skill") -> Skill:
    s = db.query(Skill).filter(Skill.nama == nama).first()
    if not s:
        s = Skill(nama=nama, tipe=tipe)
        db.add(s)
        db.commit()
    return s


def test_search_validation_empty_query_and_filters_raises_422(client: TestClient, db_session: Session):
    user = User(nim="901001", nama="Tester", email="tester@univ.ac.id", password_hash="hash", role="mahasiswa")
    db_session.add(user)
    db_session.commit()

    token = create_access_token(subject=user.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Tanpa q dan tanpa filter -> 422
    res = client.get("/api/v1/search", headers=headers)
    assert res.status_code == 422
    assert res.json()["code"] == "QUERY_OR_FILTER_REQUIRED"

    # 2. q hanya spasi kosong dan tanpa filter -> 422
    res_spaces = client.get("/api/v1/search?q=%20%20%20", headers=headers)
    assert res_spaces.status_code == 422
    assert res_spaces.json()["code"] == "QUERY_OR_FILTER_REQUIRED"

    # 3. q kosong tetapi ada filter skill_id -> Valid 200
    res_skill = client.get("/api/v1/search?skill_id=1", headers=headers)
    assert res_skill.status_code == 200
    assert "items" in res_skill.json()

    # 4. q kosong tetapi ada filter jurusan -> Valid 200
    res_jurusan = client.get("/api/v1/search?jurusan=Informatika", headers=headers)
    assert res_jurusan.status_code == 200
    assert "items" in res_jurusan.json()


def test_search_mahasiswa_by_keyword_skill_and_jurusan(client: TestClient, db_session: Session):
    db = db_session

    u_searcher = User(nim="901002", nama="Pencari", email="pencari@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_budi = User(
        nim="901003",
        nama="Budi Santoso",
        email="budi@univ.ac.id",
        password_hash="hash",
        jurusan="Teknik Informatika",
        bio="Pengembang mobile Flutter dan enthusiast AI",
        role="mahasiswa",
    )
    u_siti = User(
        nim="901004",
        nama="Siti Rahma",
        email="siti@univ.ac.id",
        password_hash="hash",
        jurusan="Sistem Informasi",
        bio="UI/UX Designer fokus desain produk kampus",
        role="mahasiswa",
    )
    db.add_all([u_searcher, u_budi, u_siti])
    db.commit()

    skill_flutter = get_or_create_skill(db, "Flutter")
    skill_figma = get_or_create_skill(db, "Figma")

    db.add(UserSkill(user_id=u_budi.user_id, skill_id=skill_flutter.skill_id))
    db.add(UserSkill(user_id=u_siti.user_id, skill_id=skill_figma.skill_id))
    db.commit()

    token = create_access_token(subject=u_searcher.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Cari berdasarkan nama
    res_nama = client.get("/api/v1/search?tipe=mahasiswa&q=Budi", headers=headers)
    assert res_nama.status_code == 200
    data = res_nama.json()
    assert data["total"] >= 1
    assert any(item["nama"] == "Budi Santoso" for item in data["items"])

    # 2. Cari berdasarkan keahlian teks (q="Figma")
    res_skill_q = client.get("/api/v1/search?tipe=mahasiswa&q=Figma", headers=headers)
    assert res_skill_q.status_code == 200
    data_skill = res_skill_q.json()
    assert any(item["nama"] == "Siti Rahma" for item in data_skill["items"])

    # 3. Cari dengan filter jurusan murni
    res_jur = client.get("/api/v1/search?tipe=mahasiswa&jurusan=Sistem%20Informasi", headers=headers)
    assert res_jur.status_code == 200
    items_jur = res_jur.json()["items"]
    assert all(it["jurusan"] == "Sistem Informasi" for it in items_jur)

    # 4. Filter skill_id eksplisit
    res_skill_id = client.get(f"/api/v1/search?tipe=mahasiswa&skill_id={skill_flutter.skill_id}", headers=headers)
    assert res_skill_id.status_code == 200
    items_sid = res_skill_id.json()["items"]
    assert any(it["user_id"] == u_budi.user_id for it in items_sid)


def test_search_mahasiswa_mutual_block_visibility(client: TestClient, db_session: Session):
    db = db_session
    u_alice = User(nim="901005", nama="Alice Wonderland", email="alice@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_bob = User(nim="901006", nama="Bob Builder", email="bob@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add_all([u_alice, u_bob])
    db.commit()

    token_alice = create_access_token(subject=u_alice.user_id)
    token_bob = create_access_token(subject=u_bob.user_id)

    # Alice blokir Bob
    db.add(UserBlock(blocker_id=u_alice.user_id, blocked_id=u_bob.user_id, alasan="Spam"))
    db.commit()

    # 1. Alice mencari Bob -> tidak boleh muncul
    res_alice = client.get("/api/v1/search?tipe=mahasiswa&q=Bob", headers={"Authorization": f"Bearer {token_alice}"})
    assert res_alice.status_code == 200
    assert not any(it["user_id"] == u_bob.user_id for it in res_alice.json()["items"])

    # 2. Bob mencari Alice -> tidak boleh muncul (timbal balik)
    res_bob = client.get("/api/v1/search?tipe=mahasiswa&q=Alice", headers={"Authorization": f"Bearer {token_bob}"})
    assert res_bob.status_code == 200
    assert not any(it["user_id"] == u_alice.user_id for it in res_bob.json()["items"])


def test_search_postingan_status_and_filters(client: TestClient, db_session: Session):
    db = db_session
    u_author = User(nim="901007", nama="Author Post", email="author@univ.ac.id", password_hash="hash", jurusan="Teknik Elektro", role="mahasiswa")
    u_blocked = User(nim="901008", nama="Blocked User", email="blocked@univ.ac.id", password_hash="hash", role="mahasiswa")
    u_viewer = User(nim="901009", nama="Viewer Post", email="viewer@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add_all([u_author, u_blocked, u_viewer])
    db.commit()

    # Blocked relation antara viewer dan u_blocked
    db.add(UserBlock(blocker_id=u_blocked.user_id, blocked_id=u_viewer.user_id, alasan="Konflik"))
    db.commit()

    now = datetime.utcnow()

    # 1. Post valid (tayang)
    p_tayang = Post(user_id=u_author.user_id, isi="Mencari rekan lomba Gemastik bidang IoT", status="tayang", is_deleted=False, tipe="cari_anggota")
    # 2. Post menunggu review -> tidak boleh muncul
    p_review = Post(user_id=u_author.user_id, isi="Lomba Gemastik masih menunggu review moderator", status="menunggu_review", is_deleted=False)
    # 3. Post terhapus (mematuhi 4 kolom soft delete audit & status dihapus) -> tidak boleh muncul
    p_deleted = Post(
        user_id=u_author.user_id,
        isi="Lomba Gemastik yang sudah dihapus",
        status="dihapus",
        is_deleted=True,
        deleted_at=now,
        deleted_by=u_author.user_id,
        alasan_hapus="Konten melanggar pedoman kampus",
    )
    # 4. Post dari blocked user -> tidak boleh muncul bagi viewer
    p_blocked = Post(user_id=u_blocked.user_id, isi="Lomba Gemastik dari pengguna terblokir", status="tayang", is_deleted=False)

    db.add_all([p_tayang, p_review, p_deleted, p_blocked])
    db.commit()

    token_viewer = create_access_token(subject=u_viewer.user_id)
    headers = {"Authorization": f"Bearer {token_viewer}"}

    res = client.get("/api/v1/search?tipe=postingan&q=Gemastik", headers=headers)
    assert res.status_code == 200
    items = res.json()["items"]
    post_ids = [it["post_id"] for it in items]

    assert p_tayang.post_id in post_ids
    assert p_review.post_id not in post_ids
    assert p_deleted.post_id not in post_ids
    assert p_blocked.post_id not in post_ids

    # Filter postingan dengan jurusan penulis
    res_jur = client.get("/api/v1/search?tipe=postingan&q=Gemastik&jurusan=Teknik%20Elektro", headers=headers)
    assert res_jur.status_code == 200
    assert any(it["post_id"] == p_tayang.post_id for it in res_jur.json()["items"])


def test_search_portofolio_status_and_filters(client: TestClient, db_session: Session):
    db = db_session
    u_owner = User(nim="901010", nama="Kreator Portofolio", email="kreator@univ.ac.id", password_hash="hash", jurusan="Desain Komunikasi Visual", role="mahasiswa")
    u_viewer = User(nim="901011", nama="Pengamat", email="pengamat@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add_all([u_owner, u_viewer])
    db.commit()

    skill_3d = get_or_create_skill(db, "Blender 3D")

    # 1. Portofolio terverifikasi
    item_verified = PortfolioItem(
        user_id=u_owner.user_id,
        judul="Animasi 3D Kampus Masa Depan",
        deskripsi="Karya visualisasi arsitektur 3D gedung rektorat",
        kategori="proyek",
        status_verifikasi="terverifikasi",
    )
    # 2. Portofolio draft / menunggu -> tidak boleh muncul
    item_pending = PortfolioItem(
        user_id=u_owner.user_id,
        judul="Animasi 3D Belum Terverifikasi",
        deskripsi="Masih menunggu validasi Kaprodi",
        kategori="proyek",
        status_verifikasi="menunggu_review",
    )
    db.add_all([item_verified, item_pending])
    db.commit()

    db.add(PortfolioSkill(portfolio_id=item_verified.portfolio_id, skill_id=skill_3d.skill_id))
    db.commit()

    token_viewer = create_access_token(subject=u_viewer.user_id)
    headers = {"Authorization": f"Bearer {token_viewer}"}

    # Cari kata kunci judul
    res = client.get("/api/v1/search?tipe=portofolio&q=Animasi", headers=headers)
    assert res.status_code == 200
    items = res.json()["items"]
    ids = [it["portfolio_id"] for it in items]

    assert item_verified.portfolio_id in ids
    assert item_pending.portfolio_id not in ids

    # Filter skill_id pada portofolio
    res_skill = client.get(f"/api/v1/search?tipe=portofolio&skill_id={skill_3d.skill_id}", headers=headers)
    assert res_skill.status_code == 200
    assert any(it["portfolio_id"] == item_verified.portfolio_id for it in res_skill.json()["items"])

    # Filter jurusan pemilik portofolio
    res_jur = client.get("/api/v1/search?tipe=portofolio&jurusan=Desain", headers=headers)
    assert res_jur.status_code == 200
    assert any(it["portfolio_id"] == item_verified.portfolio_id for it in res_jur.json()["items"])


def test_search_pagination_and_deterministic_order(client: TestClient, db_session: Session):
    db = db_session
    u_searcher = User(nim="901012", nama="Pagination Tester", email="pagin@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add(u_searcher)
    db.commit()

    # Buat 5 post dengan kata kunci yang sama
    posts = [
        Post(user_id=u_searcher.user_id, isi=f"Artikel Riset Kampus #{i}", status="tayang", is_deleted=False)
        for i in range(1, 6)
    ]
    db.add_all(posts)
    db.commit()

    token = create_access_token(subject=u_searcher.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Halaman 1 (limit=2, offset=0)
    res_p1 = client.get("/api/v1/search?tipe=postingan&q=Riset%20Kampus&limit=2&offset=0", headers=headers)
    assert res_p1.status_code == 200
    data_p1 = res_p1.json()
    assert data_p1["total"] >= 5
    assert len(data_p1["items"]) == 2

    # Halaman 2 (limit=2, offset=2)
    res_p2 = client.get("/api/v1/search?tipe=postingan&q=Riset%20Kampus&limit=2&offset=2", headers=headers)
    assert res_p2.status_code == 200
    data_p2 = res_p2.json()
    assert len(data_p2["items"]) == 2

    # Pastikan item antara p1 dan p2 tidak saling tumpang tindih
    ids_p1 = {it["post_id"] for it in data_p1["items"]}
    ids_p2 = {it["post_id"] for it in data_p2["items"]}
    assert ids_p1.isdisjoint(ids_p2)


def test_search_mahasiswa_excludes_current_user(client: TestClient, db_session: Session):
    db = db_session
    u_me = User(nim="901099", nama="Diri Sendiri", email="dirisendiri@univ.ac.id", password_hash="hash", jurusan="Teknik Nuklir", role="mahasiswa")
    u_other = User(nim="901098", nama="Rekan Sekelas", email="rekansekelas@univ.ac.id", password_hash="hash", jurusan="Teknik Nuklir", role="mahasiswa")
    db.add_all([u_me, u_other])
    db.commit()

    token = create_access_token(subject=u_me.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Cari berdasarkan nama sendiri -> tidak boleh muncul
    res_self = client.get("/api/v1/search?tipe=mahasiswa&q=Diri%20Sendiri", headers=headers)
    assert res_self.status_code == 200
    assert not any(it["user_id"] == u_me.user_id for it in res_self.json()["items"])

    # 2. Cari dengan filter jurusan yang sama -> hanya rekan yang muncul, bukan diri sendiri
    res_jurusan = client.get("/api/v1/search?tipe=mahasiswa&jurusan=Teknik%20Nuklir", headers=headers)
    assert res_jurusan.status_code == 200
    items = res_jurusan.json()["items"]
    assert any(it["user_id"] == u_other.user_id for it in items)
    assert not any(it["user_id"] == u_me.user_id for it in items)


def test_search_wildcard_escaping(client: TestClient, db_session: Session):
    db = db_session
    u_viewer = User(nim="901097", nama="Wildcard Viewer", email="wildcard@univ.ac.id", password_hash="hash", role="mahasiswa")
    db.add(u_viewer)
    db.commit()

    p_special = Post(user_id=u_viewer.user_id, isi="Belajar diskon 50% di kampus", status="tayang", is_deleted=False)
    p_normal = Post(user_id=u_viewer.user_id, isi="Belajar algoritma pemrograman", status="tayang", is_deleted=False)
    db.add_all([p_special, p_normal])
    db.commit()

    token = create_access_token(subject=u_viewer.user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Cari karakter '%' harus mencocokkan p_special secara spesifik
    res = client.get("/api/v1/search?tipe=postingan&q=50%", headers=headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(it["post_id"] == p_special.post_id for it in items)
