from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.security import apply_moderation_scope, can_moderate, require_roles
from app.models.entities import ModerationRecord, Post, Report, User
from app.schemas.moderation import (
    ModerationDecisionRequest,
    ModerationQueueItemResponse,
    ModerationRequest,
    ModerationResponse,
    ModerationSummaryResponse,
)
from app.services.ai_engine.moderator import moderator_engine
from app.services.notification import create_notification
from app.services.queue_counts import get_staff_queue_counts
from app.services.storage import storage_service

router = APIRouter()


@router.post("/check", response_model=ModerationResponse, summary="Klasifikasi Awal Moderasi Postingan (AI-2, Khusus Staf)")
def check_post_moderation(payload: ModerationRequest, current_user: User = Depends(require_roles("moderator", "admin"))):
    """
    Endpoint AI-2: Memindai teks postingan sebelum/sesudah tayang.
    Hasil klasifikasi menentukan apakah postingan langsung tayang (aman),
    ditinjau admin (perlu_review), atau disembunyikan (berpotensi_melanggar).
    """
    return moderator_engine.moderate_text(
        post_id=payload.post_id,
        content=payload.content,
    )


@router.get(
    "/queue",
    response_model=List[ModerationQueueItemResponse],
    summary="Antrean Postingan AI Triage & Berisiko (Kaprodi Se-Prodi & Admin)",
)
def get_moderation_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("moderator", "admin")),
):
    """
    Mengambil antrean postingan yang membutuhkan peninjauan manusia:
    - Status: 'menunggu_review' atau 'direview'
    - Filter berdasarkan program studi Kaprodi (Admin global)
    - Prioritas AI: 'berpotensi_melanggar' teratas, lalu 'perlu_review', lalu FIFO created_at.
    """
    query = (
        db.query(Post)
        .join(User, Post.user_id == User.user_id)
        .options(
            joinedload(Post.user),
            selectinload(Post.moderation_records),
            selectinload(Post.reports),
        )
        .filter(
            Post.is_deleted == False,  # noqa: E712
            Post.status.in_(["menunggu_review", "direview"]),
        )
    )

    query = apply_moderation_scope(query, User, current_user)
    posts = query.all()

    # In-memory AI priority sorting & data assembly
    # Priority: berpotensi_melanggar (0), perlu_review (1), other (2), then FIFO (created_at)
    def sort_key(p: Post):
        latest_mod = None
        if p.moderation_records:
            latest_mod = sorted(p.moderation_records, key=lambda r: r.created_at, reverse=True)[0]
        label = latest_mod.label_ai if latest_mod else None
        if label == "berpotensi_melanggar":
            priority = 0
        elif label == "perlu_review" or p.status == "direview":
            priority = 1
        else:
            priority = 2
        return (priority, p.created_at)

    sorted_posts = sorted(posts, key=sort_key)

    results = []
    for p in sorted_posts:
        latest_mod = None
        if p.moderation_records:
            latest_mod = sorted(p.moderation_records, key=lambda r: r.created_at, reverse=True)[0]

        active_reports = [r for r in p.reports if r.status in ("baru", "diproses")]
        kategori_laporan = list(dict.fromkeys(r.kategori_laporan for r in active_reports))

        # Build public URL for image if exists
        gambar_display = None
        if p.gambar_url:
            if p.gambar_url.startswith("http://") or p.gambar_url.startswith("https://"):
                gambar_display = p.gambar_url
            else:
                gambar_display = storage_service.get_public_url("post-images", p.gambar_url)

        results.append(
            ModerationQueueItemResponse(
                post_id=p.post_id,
                user_id=p.user_id,
                author_name=p.user.nama if p.user else "Anonim",
                author_jurusan=p.user.jurusan if p.user else None,
                isi=p.isi,
                gambar_url=gambar_display,
                tipe=p.tipe,
                status=p.status,
                created_at=p.created_at,
                label_ai=latest_mod.label_ai if latest_mod else None,
                kategori_ai=latest_mod.kategori_ai if latest_mod else None,
                confidence=latest_mod.confidence if latest_mod else None,
                penjelasan_ai=latest_mod.penjelasan_ai if latest_mod else None,
                jumlah_laporan_aktif=len(active_reports),
                kategori_laporan=kategori_laporan,
            )
        )

    return results


@router.post(
    "/{post_id}/decision",
    status_code=status.HTTP_200_OK,
    summary="Eksekusi Keputusan Moderasi Konten (Kaprodi Se-Prodi & Admin)",
)
def submit_moderation_decision(
    post_id: int,
    payload: ModerationDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("moderator", "admin")),
):
    # 1. Lock post with FOR UPDATE
    post = (
        db.query(Post)
        .filter(Post.post_id == post_id)
        .with_for_update()
        .first()
    )

    if not post or post.is_deleted:
        raise NotFoundError(code="POST_NOT_FOUND", detail="Postingan tidak ditemukan atau sudah dihapus.")

    # 2. Check department authority
    author_jurusan = post.user.jurusan if post.user else None
    if not can_moderate(current_user, author_jurusan):
        raise ForbiddenError(
            code="FORBIDDEN_MODERATION",
            detail="Anda tidak memiliki izin memoderasi postingan dari program studi ini.",
        )

    # 3. Staff protection: Moderator cannot moderate fellow staff or admin
    if post.user and post.user.role in ("moderator", "admin") and current_user.role != "admin":
        raise ForbiddenError(
            code="CANNOT_MODERATE_STAFF",
            detail="Hanya Administrator Kampus yang berwenang memutuskan moderasi postingan staf/dosen.",
        )

    # 4. State guard: Decision (setujui, tolak, minta_revisi) only valid for posts pending review
    if payload.keputusan in ("setujui", "tolak", "minta_revisi"):
        if post.status not in ("menunggu_review", "direview"):
            raise ConflictError(
                code="ALREADY_REVIEWED",
                detail="Postingan telah ditinjau atau diputuskan oleh peninjau lain.",
            )

    # 5. If action is takedown / hapus_konten, delegate to takedown logic
    if payload.keputusan == "hapus_konten":
        from app.api.v1.endpoints.posts import takedown_post

        takedown_post(db, post, current_user, payload.catatan or "Melanggar pedoman komunitas")
        return {
            "message": "Postingan berhasil di-takedown oleh tim moderasi.",
            "post_id": post.post_id,
            "status": "dihapus",
        }

    # 5. Lock or create pending moderation record
    mod_rec = (
        db.query(ModerationRecord)
        .filter(
            ModerationRecord.post_id == post.post_id,
            ModerationRecord.keputusan_admin.is_(None),
            ModerationRecord.keputusan_moderator.is_(None),
        )
        .order_by(ModerationRecord.created_at.desc())
        .with_for_update()
        .first()
    )

    now = datetime.utcnow()
    if not mod_rec:
        mod_rec = ModerationRecord(post_id=post.post_id)
        db.add(mod_rec)

    mod_rec.decided_at = now
    if current_user.role == "admin":
        mod_rec.admin_id = current_user.user_id
        mod_rec.keputusan_admin = payload.keputusan
        mod_rec.catatan_admin = payload.catatan
    else:
        mod_rec.moderator_id = current_user.user_id
        mod_rec.keputusan_moderator = payload.keputusan
        mod_rec.catatan_moderator = payload.catatan

    # 6. Apply state transition & auto-resolve active reports
    active_reports = (
        db.query(Report)
        .filter(Report.post_id == post.post_id, Report.status.in_(["baru", "diproses"]))
        .all()
    )

    if payload.keputusan == "setujui":
        post.status = "tayang"
        for r in active_reports:
            r.status = "diabaikan"
            r.tindakan_diambil = "laporan_ditolak"
            r.resolved_at = now
            r.ditinjau_oleh = current_user.user_id
            create_notification(
                db=db,
                user_id=r.pelapor_id,
                jenis="laporan_diabaikan",
                judul="Laporan Selesai Ditinjau",
                isi="Laporan Anda terhadap sebuah postingan telah ditinjau oleh tim moderasi kampus. Terima kasih telah berpartisipasi menjaga kenyamanan komunitas CampusFolio.",
                ref_type="report",
                ref_id=r.report_id,
            )

        create_notification(
            db=db,
            user_id=post.user_id,
            jenis="moderasi_disetujui",
            judul="Postingan Disetujui",
            isi="Postingan Anda telah ditinjau dan disetujui tayang oleh tim moderasi kampus.",
            tautan=f"/posts/{post.post_id}",
            ref_type="post",
            ref_id=post.post_id,
        )

    elif payload.keputusan == "tolak":
        post.status = "ditolak"
        for r in active_reports:
            r.status = "selesai"
            r.tindakan_diambil = "peringatan"
            r.resolved_at = now
            r.ditinjau_oleh = current_user.user_id
            create_notification(
                db=db,
                user_id=r.pelapor_id,
                jenis="laporan_selesai",
                judul="Laporan Selesai Ditinjau",
                isi="Laporan Anda terhadap sebuah postingan telah selesai ditindaklanjuti oleh tim moderasi kampus. Terima kasih atas partisipasi Anda.",
                ref_type="report",
                ref_id=r.report_id,
            )

        create_notification(
            db=db,
            user_id=post.user_id,
            jenis="moderasi_ditolak",
            judul="Postingan Ditolak",
            isi=f"Postingan Anda ditolak oleh tim moderasi kampus: {payload.catatan}",
            ref_type="post",
            ref_id=post.post_id,
        )

    elif payload.keputusan == "minta_revisi":
        post.status = "revisi"
        for r in active_reports:
            r.status = "selesai"
            r.tindakan_diambil = "peringatan"
            r.resolved_at = now
            r.ditinjau_oleh = current_user.user_id
            create_notification(
                db=db,
                user_id=r.pelapor_id,
                jenis="laporan_selesai",
                judul="Laporan Selesai Ditinjau",
                isi="Laporan Anda terhadap sebuah postingan telah selesai ditindaklanjuti oleh tim moderasi kampus. Terima kasih atas partisipasi Anda.",
                ref_type="report",
                ref_id=r.report_id,
            )

        create_notification(
            db=db,
            user_id=post.user_id,
            jenis="moderasi_revisi",
            judul="Permintaan Revisi Postingan",
            isi=f"Tim moderasi kampus meminta perbaikan pada postingan Anda: {payload.catatan}",
            tautan=f"/posts/{post.post_id}",
            ref_type="post",
            ref_id=post.post_id,
        )

    db.commit()
    db.refresh(post)

    return {
        "message": f"Keputusan moderasi '{payload.keputusan}' berhasil disimpan.",
        "post_id": post.post_id,
        "status": post.status,
    }


@router.get(
    "/summary",
    response_model=ModerationSummaryResponse,
    summary="Ringkasan Metrik Moderasi & Tinjauan (Dashboard M11)",
)
def get_moderation_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("moderator", "admin")),
):
    counts = get_staff_queue_counts(db, current_user)
    return ModerationSummaryResponse(
        post_menunggu=counts["post_menunggu"],
        laporan_baru=counts["laporan_baru"],
        portofolio_menunggu=counts["portofolio_menunggu"],
    )
