"""Event document queries + serialisation (async / Motor)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


def serialize_event(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "examId": str(doc["examId"]),
        "eventId": doc.get("eventId", 0),
        "eventType": doc.get("eventType"),
        "personId": doc.get("personId"),
        "severity": doc.get("severity"),
        "startTime": doc.get("startTime"),
        "endTime": doc.get("endTime"),
        "duration": doc.get("duration"),
        "confidence": doc.get("confidence"),
        "startTimeFormatted": doc.get("startTimeFormatted"),
        "endTimeFormatted": doc.get("endTimeFormatted"),
        "description": doc.get("description"),
        "hasClip": bool(doc.get("clipFilename")),
        "reviewed": doc.get("reviewed", False),
        "reviewStatus": doc.get("reviewStatus"),
        "reviewerNotes": doc.get("reviewerNotes", ""),
    }


async def list_events(
    db: AsyncIOMotorDatabase,
    exam_id: str,
    *,
    page: int,
    page_size: int,
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    person_id: Optional[int] = None,
    reviewed: Optional[bool] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    query: Dict[str, Any] = {"examId": ObjectId(exam_id)}
    if severity:
        query["severity"] = severity
    if event_type:
        query["eventType"] = event_type
    if person_id is not None:
        query["personId"] = person_id
    if reviewed is not None:
        query["reviewed"] = reviewed

    total = await db.events.count_documents(query)
    # Sort by severity (HIGH first) then start time — matches the notebook ordering.
    cursor = (
        db.events.find(query)
        .sort([("eventId", 1)])
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    docs = await cursor.to_list(length=page_size)
    return docs, total


async def get_event(db: AsyncIOMotorDatabase, event_id: str) -> Optional[Dict[str, Any]]:
    if not ObjectId.is_valid(event_id):
        return None
    return await db.events.find_one({"_id": ObjectId(event_id)})


async def update_event(
    db: AsyncIOMotorDatabase, event_id: str, updates: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    if not ObjectId.is_valid(event_id) or not updates:
        return await get_event(db, event_id)
    await db.events.update_one({"_id": ObjectId(event_id)}, {"$set": updates})
    return await get_event(db, event_id)
