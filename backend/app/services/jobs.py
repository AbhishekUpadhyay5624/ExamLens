"""Job enqueue abstraction.

By default jobs run in an in-process background thread (see ``worker/runner.py``);
set ``USE_CELERY=1`` to dispatch to a Celery worker instead. The API never calls
the pipeline directly — it always enqueues — so processing can be scaled out to
separate worker processes/machines without touching the API code.
"""
from __future__ import annotations

from ..config import settings


def enqueue_processing(exam_id: str) -> str:
    """Enqueue video processing for ``exam_id``. Returns the backend used."""
    if settings.use_celery:
        from worker.tasks import process_exam_task

        process_exam_task.delay(exam_id)
        return "celery"

    from worker.runner import submit

    submit(exam_id)
    return "thread"
