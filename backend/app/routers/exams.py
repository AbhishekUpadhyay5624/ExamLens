"""Exam routes: upload + processing, listing, detail, events, report, heatmap."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from ml import config as ml_config
from ..deps import db_dep, get_current_user
from ..schemas import EventPublic, ExamCreated, ExamPublic, Page
from ..services import exam_service, event_service, storage
from ..services.jobs import enqueue_processing

router = APIRouter(prefix="/exams", tags=["exams"])

_ALLOWED_SUFFIXES = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v"}


@router.post("", response_model=ExamCreated, status_code=status.HTTP_201_CREATED)
async def upload_exam(
    examName: str = Form(..., min_length=1, max_length=200),
    examType: str = Form(...),
    video: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> ExamCreated:
    if examType not in ml_config.VALID_EXAM_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"examType must be one of {sorted(ml_config.VALID_EXAM_TYPES)}",
        )

    suffix = Path(video.filename or "").suffix.lower() or ".mp4"
    if suffix not in _ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported video type '{suffix}'. Allowed: {sorted(_ALLOWED_SUFFIXES)}",
        )

    # Create the DB record first so we have an id for the storage path.
    exam = await exam_service.create_exam(
        db,
        exam_name=examName,
        exam_type=examType,
        video_path="",  # set after we know the id
        video_suffix=suffix,
        created_by=str(current_user["_id"]),
    )
    exam_id = str(exam["_id"])

    dest = storage.video_path(exam_id, suffix)
    written = await storage.save_upload(video, dest)
    if written == 0:
        await db.exams.delete_one({"_id": exam["_id"]})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file was empty."
        )

    await db.exams.update_one(
        {"_id": exam["_id"]}, {"$set": {"videoPath": str(dest)}}
    )

    enqueue_processing(exam_id)

    return ExamCreated(
        id=exam_id, examName=examName, examType=examType, status="uploaded"
    )


@router.get("", response_model=Page[ExamPublic])
async def list_exams(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Page[ExamPublic]:
    docs, total = await exam_service.list_exams(
        db, page=page, page_size=page_size, status=status_filter
    )
    items = [ExamPublic(**exam_service.serialize_exam(d)) for d in docs]
    return Page(items=items, total=total, page=page, page_size=page_size)


async def _load_exam(db: AsyncIOMotorDatabase, exam_id: str) -> Dict[str, Any]:
    exam = await exam_service.get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    return exam


@router.get("/{exam_id}", response_model=ExamPublic)
async def get_exam(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> ExamPublic:
    exam = await _load_exam(db, exam_id)
    return ExamPublic(**exam_service.serialize_exam(exam))


@router.get("/{exam_id}/events", response_model=Page[EventPublic])
async def list_exam_events(
    exam_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, alias="eventType"),
    person_id: Optional[int] = Query(None, alias="personId"),
    reviewed: Optional[bool] = Query(None),
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Page[EventPublic]:
    await _load_exam(db, exam_id)
    docs, total = await event_service.list_events(
        db, exam_id, page=page, page_size=page_size,
        severity=severity, event_type=event_type,
        person_id=person_id, reviewed=reviewed,
    )
    items = [EventPublic(**event_service.serialize_event(d)) for d in docs]
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{exam_id}/report")
async def get_exam_report(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    exam = await _load_exam(db, exam_id)
    report = exam.get("report")
    if not report:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Report not available (exam status: {exam.get('status')}).",
        )
    return report


@router.get("/{exam_id}/heatmap")
async def get_exam_heatmap(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> FileResponse:
    exam = await _load_exam(db, exam_id)
    filename = exam.get("heatmapFilename")
    if not filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No heatmap for this exam")
    path = storage.exam_dir(exam_id) / Path(filename).name
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Heatmap file missing on disk")
    return FileResponse(str(path), media_type="image/png", filename=f"heatmap_{exam_id}.png")


@router.delete("/{exam_id}", status_code=status.HTTP_200_OK)
async def delete_exam(
    exam_id: str,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Delete an exam recording, its database records, and all extracted evidence files."""
    exam = await _load_exam(db, exam_id)
    await db.exams.delete_one({"_id": exam["_id"]})
    await db.events.delete_many({"examId": exam_id})
    await db.events.delete_many({"exam_id": exam_id})

    # Remove storage directory and video files
    exam_dir = storage.exam_dir(exam_id)
    if exam_dir.exists():
        import shutil
        shutil.rmtree(exam_dir, ignore_errors=True)

    return {"ok": True, "id": exam_id, "message": "Exam and associated evidence files deleted successfully"}

