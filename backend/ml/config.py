"""Central configuration for the ExamLens ML pipeline.

These values are ported verbatim from the Colab notebooks (Phase 1B Cell 3 and
Phase 2 Cells 2.5 / 3) so the service reproduces the exact detection behaviour
that was validated during research.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

# ---------------------------------------------------------------------------
# Phase 1B — tracking parameters (notebook Cell 3 / Cell 4)
# ---------------------------------------------------------------------------
YOLO_WEIGHTS_DEFAULT = "yolo11m.pt"
YOLO_CONFIDENCE = 0.25         # minimum YOLO detection confidence
FRAME_SKIP = 1                 # process every Nth frame (1 = all frames for short clips)
MIN_MOTION_AREA = 500          # minimum motion region size (pixels^2)
MOTION_THRESHOLD = 25          # MOG2 background-subtraction sensitivity (varThreshold)
MOTION_HISTORY_SIZE = 30       # frames considered for a motion score


def calculate_dynamic_frame_skip(duration_seconds: float, default_skip: int = 1) -> int:
    """Dynamic frame skipping rules for long videos:
    - < 10 mins: skip 1 (process every frame)
    - 10 - 15 mins: skip 3 frames
    - 15 - 20 mins: skip 7 frames
    - 20 - 30 mins: skip 10 frames
    - 30+ mins: skip 25 frames
    """
    duration_mins = duration_seconds / 60.0
    if duration_mins < 10.0:
        return default_skip
    elif 10.0 <= duration_mins < 15.0:
        return 3
    elif 15.0 <= duration_mins < 20.0:
        return 7
    elif 20.0 <= duration_mins < 30.0:
        return 10
    else:  # 30+ mins
        return 25


PERSON_CLASS_ID = 0            # COCO "person"
LAPTOP_CLASS_ID = 63           # COCO "laptop"
CELL_PHONE_CLASS_ID = 67       # COCO "cell phone"
BOOK_CLASS_ID = 73             # COCO "book"
TRACK_CLASS_IDS = [PERSON_CLASS_ID, LAPTOP_CLASS_ID, CELL_PHONE_CLASS_ID, BOOK_CLASS_ID]

# ByteTrack
BYTETRACK_ACTIVATION_THRESHOLD = 0.25
BYTETRACK_MIN_MATCHING_THRESHOLD = 0.8
BYTETRACK_LOST_BUFFER_SECONDS = 2      # lost_track_buffer = fps * this

# Detection strategy: run a full-frame YOLO pass this often (seconds) to catch
# still / newly-entered persons that motion ROIs would miss.
FULL_FRAME_INTERVAL_SECONDS = 5

# ---------------------------------------------------------------------------
# Phase 2 — event-engine general settings (notebook Cell 3 / Cell 9 / Cell 13)
# ---------------------------------------------------------------------------
MIN_EVENT_CONFIDENCE = 0.55    # drop events below this confidence
EVENT_MERGE_GAP_GLOBAL = 5.0   # default merge gap (seconds) to consolidate proximate events
CONTEXT_SECONDS = 2.5          # padding added before/after each evidence clip (keeps clips <= 25s)

VALID_EXAM_TYPES = ("CBT", "PAPER_PEN", "PHYSICAL", "HYBRID")

# Teacher / invigilator detection threshold (pixels of bbox displacement across room)
TEACHER_TRAVEL_THRESHOLD_PX = 500.0

# ---------------------------------------------------------------------------
# Exam profiles (notebook Phase 2 Cell 2.5)
# ---------------------------------------------------------------------------
EXAM_PROFILES: Dict[str, Dict[str, Any]] = {
    "CBT": {
        "description": "Computer-Based Test - Students use laptops throughout exam",
        "laptop_detection": False,
        "laptop_severity": "LOW",
        "movement_threshold": 0.38,   # Sensitive to desk-leaning, chit sliding, and head tilt
        "stillness_threshold": 0.10,
        "stillness_min_duration": 30.0,
        "movement_min_duration": 3.0,
    },
    "PAPER_PEN": {
        "description": "Paper-Based Exam - No electronic devices allowed",
        "laptop_detection": True,
        "laptop_severity": "HIGH",
        "movement_threshold": 0.7,
        "stillness_threshold": 0.15,
        "stillness_min_duration": 5.0,
    },
    "PHYSICAL": {
        "description": "Physical Fitness Test - High movement expected",
        "laptop_detection": True,
        "laptop_severity": "HIGH",
        "movement_threshold": 999,  # disabled
        "stillness_threshold": 0.20,
        "stillness_min_duration": 5.0,
    },
    "HYBRID": {
        "description": "Mixed Format Exam",
        "laptop_detection": True,
        "laptop_severity": "MEDIUM",
        "movement_threshold": 0.7,
        "stillness_threshold": 0.15,
        "stillness_min_duration": 5.0,
    },
}


def get_exam_profile(exam_type: str) -> Dict[str, Any]:
    """Return the profile for ``exam_type`` (falls back to HYBRID, as in the notebook)."""
    return deepcopy(EXAM_PROFILES.get(exam_type, EXAM_PROFILES["HYBRID"]))


def build_event_config(exam_type: str) -> Dict[str, Dict[str, Any]]:
    """Build the per-exam EVENT_CONFIG (notebook Phase 2 Cell 3).

    The three event detectors are toggled and tuned according to the exam
    profile: e.g. laptop detection is disabled for CBT, movement detection is
    disabled for PHYSICAL exams.
    """
    profile = get_exam_profile(exam_type)
    laptop_severity = profile.get("laptop_severity", "MEDIUM")

    return {
        "LAPTOP_INTERACTION": {
            "enabled": profile["laptop_detection"],
            "proximity_threshold": 150,   # px - max person-laptop distance
            "min_duration": 5.0,          # s - minimum to flag
            "max_duration": 120.0,        # s - filters continuous exam use
            "merge_gap": 5.0,             # s
            "severity": laptop_severity,
            "color": "red" if laptop_severity == "HIGH" else "orange",
            "description": f"Laptop interaction detected during {exam_type} exam",
        },
        "SUSPICIOUS_STILLNESS": {
            "enabled": True,
            "motion_threshold": profile["stillness_threshold"],
            "min_duration": profile.get("stillness_min_duration", 5.0),
            "merge_gap": 3.0,
            "severity": "HIGH",
            "color": "red",
            "description": "Prolonged stillness detected - potential hidden device usage",
        },
        "EXCESSIVE_MOVEMENT": {
            "enabled": profile["movement_threshold"] < 999,
            "motion_threshold": profile["movement_threshold"],
            "min_duration": profile.get("movement_min_duration", 10.0),
            "merge_gap": 3.0,
            "severity": "HIGH" if exam_type == "CBT" else "MEDIUM",
            "color": "red" if exam_type == "CBT" else "yellow",
            "description": f"Suspicious movement / desk activity detected during {exam_type} exam",
        },
    }
