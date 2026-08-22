"""Event routes: detail, review update, evidence clip streaming (range-capable)."""
from __future__ import annotations

import datetime as dt
from pathlib import Path
from typing import Any, Dict, Iterator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..deps import db_dep, get_current_user
from ..schemas import EventPublic, EventUpdate
from ..services import event_service, storage

router = APIRouter(prefix="/events", tags=["events"])

_STREAM_CHUNK = 1024 * 1024  # 1 MiB


async def _load_event(db: AsyncIOMotorDatabase, event_id: str) -> Dict[str, Any]:
    event = await event_service.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.get("/{event_id}", response_model=EventPublic)
async def get_event(
    event_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> EventPublic:
    event = await _load_event(db, event_id)
    return EventPublic(**event_service.serialize_event(event))


@router.patch("/{event_id}", response_model=EventPublic)
async def update_event(
    event_id: str,
    payload: EventUpdate,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> EventPublic:
    await _load_event(db, event_id)
    updates = payload.model_dump(exclude_none=True)

    # Setting a review verdict implies the event has been reviewed.
    if "reviewStatus" in updates and "reviewed" not in updates:
        updates["reviewed"] = True
    if updates.get("reviewed"):
        updates["reviewedBy"] = str(current_user["_id"])
        updates["reviewedAt"] = dt.datetime.now(dt.timezone.utc)

    updated = await event_service.update_event(db, event_id, updates)
    return EventPublic(**event_service.serialize_event(updated))


def _range_stream(path: Path, request: Request, media_type: str = "video/mp4"):
    """Serve a file, honouring the HTTP Range header so clients can seek."""
    file_size = path.stat().st_size
    range_header = request.headers.get("range")

    if not range_header:
        return FileResponse(
            str(path),
            media_type=media_type,
            headers={"Accept-Ranges": "bytes"},
        )

    try:
        units, _, spec = range_header.partition("=")
        if units.strip().lower() != "bytes":
            raise ValueError("unsupported unit")
        start_s, _, end_s = spec.partition("-")
        start = int(start_s) if start_s else 0
        end = int(end_s) if end_s else file_size - 1
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            detail="Invalid Range header",
        )

    end = min(end, file_size - 1)
    if start > end or start >= file_size:
        raise HTTPException(
            status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            headers={"Content-Range": f"bytes */{file_size}"},
        )

    def iterator() -> Iterator[bytes]:
        with open(path, "rb") as f:
            f.seek(start)
            remaining = end - start + 1
            while remaining > 0:
                data = f.read(min(_STREAM_CHUNK, remaining))
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
        "Content-Length": str(end - start + 1),
    }
    return StreamingResponse(
        iterator(),
        status_code=status.HTTP_206_PARTIAL_CONTENT,
        media_type=media_type,
        headers=headers,
    )


@router.get("/{event_id}/clip")
async def get_event_clip(
    event_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    event = await _load_event(db, event_id)
    filename = event.get("clipFilename")
    if not filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No clip for this event")

    path = storage.clip_path(str(event["examId"]), filename)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clip file missing on disk")

    return _range_stream(path, request, media_type="video/mp4")
