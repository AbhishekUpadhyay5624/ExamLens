"""Core processing job: run the ML pipeline and persist results to MongoDB.

Uses a *synchronous* PyMongo client (not Motor) because this runs inside a
background thread / separate Celery process with no asyncio event loop. Both the
thread runner and the Celery task call ``process_and_persist``.
"""
from __future__ import annotations

import datetime as dt
import logging
from typing import Optional

from bson import ObjectId
from pymongo import MongoClient
from pymongo.database import Database

from app.config import settings
from ml import process_exam_video

logger = logging.getLogger("examlens.worker")

_client: Optional[MongoClient] = None


def get_sync_db() -> Database:
    global _client
    if _client is None:
        _client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    return _client[settings.db_name]


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def process_and_persist(exam_id: str) -> None:
    """Process the exam video and write events + summary back to MongoDB."""
    db = get_sync_db()
    oid = ObjectId(exam_id)
    exam = db.exams.find_one({"_id": oid})
    if not exam:
        logger.warning("Exam %s not found; skipping", exam_id)
        return

    out_dir = settings.storage_dir / "exams" / exam_id

    def status_cb(stage: str) -> None:
        db.exams.update_one({"_id": oid}, {"$set": {"status": stage}})

    try:
        results = process_exam_video(
            video_path=exam["videoPath"],
            exam_type=exam["examType"],
            output_dir=str(out_dir),
            weights=settings.yolo_weights,
            top_clips=settings.top_clips,
            max_frames=settings.max_frames,
            status_cb=status_cb,
        )
    except Exception as exc:  # noqa: BLE001 - record failure for the dashboard
        logger.exception("Processing failed for exam %s", exam_id)
        db.exams.update_one(
            {"_id": oid},
            {"$set": {"status": "failed", "error": str(exc), "processedAt": _now()}},
        )
        raise

    _persist_events(db, oid, results)
    _persist_summary(db, oid, results)


def _persist_events(db: Database, exam_oid: ObjectId, results: dict) -> None:
    # Idempotent: clear any events from a previous run of the same exam.
    db.events.delete_many({"examId": exam_oid})
    clip_by_event = {c["event_id"]: c["filename"] for c in results.get("clips", [])}

    docs = []
    for e in results["events"]:
        clip_filename = clip_by_event.get(e["event_id"]) or e.get("clip_filename")
        if not clip_filename:
            # Omit extra events that don't have clips
            continue
        docs.append({
            "examId": exam_oid,
            "eventId": e["event_id"],
            "eventType": e["event_type"],
            "personId": e["person_id"],
            "severity": e["severity"],
            "startTime": e["start_time"],
            "endTime": e["end_time"],
            "duration": e["duration"],
            "confidence": e["confidence"],
            "startTimeFormatted": e.get("start_time_formatted"),
            "endTimeFormatted": e.get("end_time_formatted"),
            "description": e.get("description"),
            "clipFilename": clip_filename,
            "reviewed": False,
            "reviewStatus": None,
            "reviewerNotes": "",
            "createdAt": _now(),
        })
    if docs:
        db.events.insert_many(docs)


def _persist_summary(db: Database, exam_oid: ObjectId, results: dict) -> None:
    meta = results["metadata"]
    summary = {
        "personsTracked": meta.get("persons_tracked", 0),
        "totalEvents": meta.get("total_events", 0),
        "eventsBySeverity": meta.get("events_by_severity", {}),
        "eventsByType": meta.get("events_by_type", {}),
    }
    db.exams.update_one(
        {"_id": exam_oid},
        {"$set": {
            "status": "done",
            "processedAt": _now(),
            "videoProperties": results.get("video_properties"),
            "summary": summary,
            "heatmapFilename": results.get("heatmap_filename"),
            "report": results.get("report"),
            "error": None,
        }},
    )
