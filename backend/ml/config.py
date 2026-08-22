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
YOLO_WEIGHTS_DEFAULT = "yolo11n.pt"
YOLO_CONFIDENCE = 0.5          # minimum YOLO detection confidence
FRAME_SKIP = 1                 # process every Nth frame (1 = all frames)
MIN_MOTION_AREA = 500          # minimum motion region size (pixels^2)
MOTION_THRESHOLD = 25          # MOG2 background-subtraction sensitivity (varThreshold)
MOTION_HISTORY_SIZE = 30       # frames considered for a motion score

PERSON_CLASS_ID = 0            # COCO "person"
LAPTOP_CLASS_ID = 63           # COCO "laptop"
TRACK_CLASS_IDS = [PERSON_CLASS_ID, LAPTOP_CLASS_ID]

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
MIN_EVENT_CONFIDENCE = 0.5     # drop events below this confidence
EVENT_MERGE_GAP_GLOBAL = 2.0   # default merge gap (seconds)
CONTEXT_SECONDS = 10           # padding added before/after each evidence clip

VALID_EXAM_TYPES = ("CBT", "PAPER_PEN", "PHYSICAL", "HYBRID")

# ---------------------------------------------------------------------------
# Exam profiles (notebook Phase 2 Cell 2.5)
# ---------------------------------------------------------------------------
EXAM_PROFILES: Dict[str, Dict[str, Any]] = {
    "CBT": {
        "description": "Computer-Based Test - Students use laptops throughout exam",
        "laptop_detection": False,
        "laptop_severity": "LOW",
        "movement_threshold": 0.85,
        "stillness_threshold": 0.10,
    },
    "PAPER_PEN": {
        "description": "Paper-Based Exam - No electronic devices allowed",
        "laptop_detection": True,
        "laptop_severity": "HIGH",
        "movement_threshold": 0.7,
        "stillness_threshold": 0.15,
    },
    "PHYSICAL": {
        "description": "Physical Fitness Test - High movement expected",
        "laptop_detection": True,
        "laptop_severity": "HIGH",
        "movement_threshold": 999,  # disabled
        "stillness_threshold": 0.20,
    },
    "HYBRID": {
        "description": "Mixed Format Exam",
        "laptop_detection": True,
        "laptop_severity": "MEDIUM",
        "movement_threshold": 0.7,
        "stillness_threshold": 0.15,
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
            "min_duration": 5.0,
            "merge_gap": 3.0,
            "severity": "HIGH",
            "color": "red",
            "description": "Prolonged stillness detected - potential hidden device usage",
        },
        "EXCESSIVE_MOVEMENT": {
            "enabled": profile["movement_threshold"] < 999,
            "motion_threshold": profile["movement_threshold"],
            "min_duration": 10.0,
            "merge_gap": 3.0,
            "severity": "MEDIUM",
            "color": "yellow",
            "description": "Sustained excessive movement detected",
        },
    }
