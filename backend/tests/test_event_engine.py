"""Tests for the Phase 2 rule-based event engine.

Runs the engine against recorded Phase 1B output (``examlens_phase1b_small``)
and asserts the shape/ordering of the produced events, plus unit tests for the
pure helper functions. No GPU / OpenCV / torch required.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from ml import config
from ml.event_engine import (
    build_investigation_report,
    calculate_distance,
    calculate_event_confidence,
    format_timestamp,
    identify_invigilators_and_teachers,
    merge_consecutive_events,
    run_event_engine,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "Results given by ml models" / "examlens_phase1b_small"


# --------------------------------------------------------------------------- #
# Pure helper unit tests (always run)
# --------------------------------------------------------------------------- #
def test_calculate_distance_between_centres():
    # Two 10x10 boxes whose centres are 100px apart horizontally.
    assert calculate_distance([0, 0, 10, 10], [100, 0, 110, 10]) == pytest.approx(100.0)


def test_format_timestamp():
    assert format_timestamp(0) == "00:00"
    assert format_timestamp(65) == "01:05"
    assert format_timestamp(3599) == "59:59"


def test_confidence_is_clamped_and_type_weighted():
    c = calculate_event_confidence("SUSPICIOUS_STILLNESS", duration=30, signal_strength=0.8)
    assert 0.0 <= c <= 1.0
    # Stillness (0.9x) should rank above movement (0.75x) for the same inputs.
    still = calculate_event_confidence("SUSPICIOUS_STILLNESS", 10, 0.8)
    move = calculate_event_confidence("EXCESSIVE_MOVEMENT", 10, 0.8)
    assert still > move


def test_merge_consecutive_events_joins_adjacent_same_person():
    events = [
        {"event_type": "SUSPICIOUS_STILLNESS", "person_id": 1,
         "start_time": 0.0, "end_time": 5.0, "duration": 5.0, "confidence": 0.8},
        {"event_type": "SUSPICIOUS_STILLNESS", "person_id": 1,
         "start_time": 6.0, "end_time": 10.0, "duration": 4.0, "confidence": 0.9},
    ]
    merged = merge_consecutive_events(events, max_gap=2.0)
    assert len(merged) == 1
    assert merged[0]["start_time"] == 0.0
    assert merged[0]["end_time"] == 10.0
    assert merged[0]["confidence"] == 0.9  # keeps the max


def test_merge_keeps_distinct_when_gap_too_large():
    events = [
        {"event_type": "SUSPICIOUS_STILLNESS", "person_id": 1,
         "start_time": 0.0, "end_time": 5.0, "duration": 5.0, "confidence": 0.8},
        {"event_type": "SUSPICIOUS_STILLNESS", "person_id": 1,
         "start_time": 20.0, "end_time": 25.0, "duration": 5.0, "confidence": 0.9},
    ]
    assert len(merge_consecutive_events(events, max_gap=2.0)) == 2


def test_exam_profiles_toggle_detectors():
    cbt = config.build_event_config("CBT")
    paper = config.build_event_config("PAPER_PEN")
    physical = config.build_event_config("PHYSICAL")

    # A laptop is expected in CBT (not flagged) but is a red flag on paper exams.
    assert cbt["LAPTOP_INTERACTION"]["enabled"] is False
    assert paper["LAPTOP_INTERACTION"]["enabled"] is True
    assert paper["LAPTOP_INTERACTION"]["severity"] == "HIGH"

    # Movement is expected during a physical test, so that detector is disabled.
    assert physical["EXCESSIVE_MOVEMENT"]["enabled"] is False
    assert cbt["EXCESSIVE_MOVEMENT"]["enabled"] is True

    # Stillness is always watched; every profile defines all three detectors.
    for cfg in (cbt, paper, physical):
        assert cfg["SUSPICIOUS_STILLNESS"]["enabled"] is True
        assert set(cfg) == {"LAPTOP_INTERACTION", "SUSPICIOUS_STILLNESS", "EXCESSIVE_MOVEMENT"}

    # CBT has relaxed stillness min duration (30s) vs normal paper (5s)
    assert cbt["SUSPICIOUS_STILLNESS"]["min_duration"] == 30.0
    assert paper["SUSPICIOUS_STILLNESS"]["min_duration"] == 5.0


def test_identify_invigilators_and_teachers():
    # Person 12 leans back (displaces by ~280px < 500px threshold -> student)
    # Person 99 walks across room (displaces by 600px >= 500px threshold -> teacher)
    tracks = {
        12: [
            {"bbox": [100, 100, 200, 200]},
            {"bbox": [300, 300, 400, 400]},  # center moves from (150,150) to (350,350) -> distance sqrt(200^2+200^2)=~282.8px
        ],
        99: [
            {"bbox": [50, 50, 150, 150]},
            {"bbox": [650, 50, 750, 150]},  # center moves from (100,100) to (700,100) -> distance 600px
        ]
    }
    invigilators = identify_invigilators_and_teachers(tracks, travel_threshold=500.0)
    assert 99 in invigilators
    assert 12 not in invigilators


# --------------------------------------------------------------------------- #
# End-to-end against recorded Phase 1B output (skipped if data absent)
# --------------------------------------------------------------------------- #
requires_data = pytest.mark.skipif(
    not DATA_DIR.exists(), reason=f"recorded Phase 1B data not found at {DATA_DIR}"
)


@pytest.fixture(scope="module")
def phase1b_data():
    tracking = json.loads((DATA_DIR / "tracking_data.json").read_text())
    motion = json.loads((DATA_DIR / "motion_timeline.json").read_text())
    summary = json.loads((DATA_DIR / "summary.json").read_text())
    return tracking, motion, summary


@requires_data
def test_engine_runs_on_recorded_data(phase1b_data):
    tracking, motion, summary = phase1b_data
    events, metadata = run_event_engine(tracking, motion, summary, "PHYSICAL")

    assert isinstance(events, list)
    assert metadata["total_events"] == len(events)
    assert metadata["persons_tracked"] > 0
    assert metadata["video_frames"] == len(tracking)

    required = {
        "event_id", "event_type", "person_id", "severity",
        "start_time", "end_time", "duration", "confidence",
        "start_time_formatted", "end_time_formatted",
    }
    for e in events:
        assert required <= set(e)
        assert e["confidence"] >= config.MIN_EVENT_CONFIDENCE
        assert e["end_time"] >= e["start_time"]
        assert e["event_type"] in {
            "LAPTOP_INTERACTION", "SUSPICIOUS_STILLNESS", "EXCESSIVE_MOVEMENT"
        }


@requires_data
def test_events_are_sequentially_ided_and_sorted(phase1b_data):
    tracking, motion, summary = phase1b_data
    events, _ = run_event_engine(tracking, motion, summary, "PHYSICAL")
    if not events:
        pytest.skip("no events produced")

    # IDs are 1..N in order.
    assert [e["event_id"] for e in events] == list(range(1, len(events) + 1))

    # Sorted by severity (HIGH<MEDIUM<LOW) then start_time.
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    keys = [(order[e["severity"]], e["start_time"]) for e in events]
    assert keys == sorted(keys)


@requires_data
def test_investigation_report_structure(phase1b_data):
    tracking, motion, summary = phase1b_data
    events, metadata = run_event_engine(tracking, motion, summary, "PHYSICAL")
    video_props = {"resolution": "1280x720", "durationSeconds": 113.0}
    report = build_investigation_report(events, metadata, video_props, summary, "PHYSICAL")

    assert set(report) >= {
        "exam_info", "video_info", "processing_summary",
        "events_summary", "investigation_priority", "recommendations",
    }
    assert report["events_summary"]["total_events"] == len(events)
