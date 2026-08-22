"""In-process background worker (default runtime).

Runs ``process_and_persist`` on a small thread pool so the upload request returns
immediately while the video is processed in the background. This is the
"no Redis / no Celery" path; swap to Celery by setting ``USE_CELERY=1``.
"""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor

from app.config import settings
from .processing import process_and_persist

logger = logging.getLogger("examlens.worker")

_executor = ThreadPoolExecutor(
    max_workers=settings.worker_threads,
    thread_name_prefix="examlens-worker",
)


def _run(exam_id: str) -> None:
    try:
        process_and_persist(exam_id)
    except Exception:  # noqa: BLE001 - already logged + persisted as failed
        logger.exception("Background processing crashed for exam %s", exam_id)


def submit(exam_id: str) -> None:
    """Schedule processing of ``exam_id`` on the background thread pool."""
    logger.info("Queued exam %s on background worker", exam_id)
    _executor.submit(_run, exam_id)


def shutdown(wait: bool = False) -> None:
    _executor.shutdown(wait=wait)
