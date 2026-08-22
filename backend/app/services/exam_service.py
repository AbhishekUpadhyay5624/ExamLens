"""Exam document CRUD + serialisation (async / Motor)."""
from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def serialize_exam(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Map a Mongo exam doc to the API shape (``_id`` -> ``id``)."""
    return {
        "id": str(doc["_id"]),
        "examName": doc.get("examName", ""),
        "examType": doc.get("examType", "HYBRID"),
        "status": doc.get("status", "uploaded"),
        "uploadedAt": doc.get("uploadedAt"),
        "processedAt": doc.get("processedAt"),
        "videoProperties": doc.get("videoProperties"),
        "summary": doc.get("summary"),
        "error": doc.get("error"),
        "hasHeatmap": bool(doc.get("heatmapFilename")),
    }


async def create_exam(
    db: AsyncIOMotorDatabase,
    *,
    exam_name: str,
    exam_type: str,
    video_path: str,
    video_suffix: str,
    created_by: Optional[str] = None,
) -> Dict[str, Any]:
    doc = {
        "examName": exam_name,
        "examType": exam_type,
        "videoPath": video_path,
        "videoSuffix": video_suffix,
        "status": "uploaded",
        "uploadedAt": _now(),
        "processedAt": None,
        "videoProperties": None,
        "summary": None,
        "error": None,
        "heatmapFilename": None,
        "createdBy": created_by,
    }
    result = await db.exams.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_exam(db: AsyncIOMotorDatabase, exam_id: str) -> Optional[Dict[str, Any]]:
    if not ObjectId.is_valid(exam_id):
        return None
    return await db.exams.find_one({"_id": ObjectId(exam_id)})


async def list_exams(
    db: AsyncIOMotorDatabase, *, page: int, page_size: int,
    status: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    total = await db.exams.count_documents(query)
    cursor = (
        db.exams.find(query)
        .sort("uploadedAt", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    docs = await cursor.to_list(length=page_size)
    return docs, total
