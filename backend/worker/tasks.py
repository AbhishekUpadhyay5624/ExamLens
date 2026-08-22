"""Celery task wrapping the processing job (only used when ``USE_CELERY=1``)."""
from __future__ import annotations

from .celery_app import celery_app
from .processing import process_and_persist


@celery_app.task(name="examlens.process_exam", bind=True, max_retries=0)
def process_exam_task(self, exam_id: str) -> str:  # noqa: ANN001 - Celery self
    process_and_persist(exam_id)
    return exam_id
