"""Exam schemas."""
from __future__ import annotations

import datetime as dt
from typing import Dict, Literal, Optional

from pydantic import BaseModel

ExamType = Literal["CBT", "PAPER_PEN", "PHYSICAL", "HYBRID"]
ExamStatus = Literal[
    "uploaded", "tracking", "detecting_events",
    "generating_clips", "generating_heatmap", "done", "failed",
]


class VideoProperties(BaseModel):
    resolution: Optional[str] = None
    fps: Optional[float] = None
    durationSeconds: Optional[float] = None
    totalFrames: Optional[int] = None


class ExamSummary(BaseModel):
    personsTracked: int = 0
    totalEvents: int = 0
    eventsBySeverity: Dict[str, int] = {}
    eventsByType: Dict[str, int] = {}


class ExamPublic(BaseModel):
    id: str
    examName: str
    examType: ExamType
    status: ExamStatus
    uploadedAt: Optional[dt.datetime] = None
    processedAt: Optional[dt.datetime] = None
    videoProperties: Optional[VideoProperties] = None
    summary: Optional[ExamSummary] = None
    error: Optional[str] = None
    hasHeatmap: bool = False


class ExamCreated(BaseModel):
    id: str
    examName: str
    examType: ExamType
    status: ExamStatus
