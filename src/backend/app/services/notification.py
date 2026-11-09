import logging
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.entities import Notification

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user_id: int,
    jenis: str,
    judul: str,
    isi: str,
    tautan: Optional[str] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[int] = None,
) -> Optional[Notification]:
    """
    Create a notification with idempotent deduplication and internal link validation.
    """
    if tautan and not tautan.startswith("/"):
        logger.warning("Invalid external tautan rejected for notification: %s", tautan)
        tautan = None

    notif = Notification(
        user_id=user_id,
        jenis=jenis,
        judul=judul,
        isi=isi,
        tautan=tautan,
        ref_type=ref_type,
        ref_id=ref_id,
        is_read=False,
    )
    try:
        db.add(notif)
        db.flush()
        return notif
    except IntegrityError:
        # Idempotency conflict via uq_notifications_ref: already notified
        db.rollback()
        return None
