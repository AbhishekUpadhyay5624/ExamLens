"""Event schemas."""
from __future__ import annotations

import datetime as dt
from typing import Literal, Optional

from pydantic import BaseModel, Field

EventType = Literal["LAPTOP_INTERACTION", "SUSPICIOUS_STILLNESS", "EXCESSIVE_MOVEMENT"]
Severity = Literal["HIGH", "MEDIUM", "LOW"]
ReviewStatus = Literal["confirmed", "false_positive"]


class EventPublic(BaseModel):
    id: str
    examId: str
    eventId: int
    eventType: EventType
    personId: int
    severity: Severity
    startTime: float
    endTime: float
    duration: float
    confidence: float
    startTimeFormatted: Optional[str] = None
    endTimeFormatted: Optional[str] = None
    description: Optional[str] = None
    hasClip: bool = False
    reviewed: bool = False
    reviewStatus: Optional[ReviewStatus] = None
    reviewerNotes: str = ""


class EventUpdate(BaseModel):
    """PATCH body — all fields optional."""
    reviewed: Optional[bool] = None
    reviewStatus: Optional[ReviewStatus] = None
    reviewerNotes: Optional[str] = Field(default=None, max_length=5000)
