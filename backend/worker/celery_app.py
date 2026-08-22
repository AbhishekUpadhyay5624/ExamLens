"""Celery application (only used when ``USE_CELERY=1``).

Kept import-light: importing this module does not require Celery to be installed
unless Celery mode is actually enabled. The broker/backend default to Redis but
can point anywhere via ``CELERY_BROKER_URL``.
"""
from __future__ import annotations

from app.config import settings

try:
    from celery import Celery
except ImportError as exc:  # pragma: no cover - only hit in Celery mode w/o dep
    raise RuntimeError(
        "USE_CELERY is enabled but the 'celery' package is not installed. "
        "Install it with: pip install celery[redis]"
    ) from exc

broker = settings.celery_broker_url or "redis://localhost:6379/0"

celery_app = Celery("examlens", broker=broker, backend=broker)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    worker_max_tasks_per_child=10,  # release GPU/CV memory periodically
)

# Ensure the task module is imported so the task is registered.
celery_app.autodiscover_tasks(["worker"])
