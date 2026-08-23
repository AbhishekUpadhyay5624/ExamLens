"""Phase 2 — rule-based event detection engine.

Refactored from the Colab notebook (Phase 2 Cells 4-10). Reads the Phase 1B
``tracking_data`` + ``motion_timeline`` and produces the flagged ``events`` list
(LAPTOP_INTERACTION / SUSPICIOUS_STILLNESS / EXCESSIVE_MOVEMENT) with severity,
timing and confidence.

This module is pure Python + numpy — no torch / OpenCV — so it can be unit
tested against recorded Phase 1B output without a GPU.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Tuple

import numpy as np

from . import config


# ---------------------------------------------------------------------------
# Helper functions (notebook Cell 5)
# ---------------------------------------------------------------------------
def calculate_distance(bbox1, bbox2) -> float:
    """Euclidean distance between two bbox centres."""
    cx1 = (bbox1[0] + bbox1[2]) / 2
    cy1 = (bbox1[1] + bbox1[3]) / 2
    cx2 = (bbox2[0] + bbox2[2]) / 2
    cy2 = (bbox2[1] + bbox2[3]) / 2
    return float(np.sqrt((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2))


def calculate_event_confidence(event_type: str, duration: float, signal_strength: float) -> float:
    """Confidence score for an event (base signal + duration bonus, weighted by type)."""
    base_confidence = signal_strength
    duration_bonus = min(0.2, duration / 50.0)
    type_multipliers = {
        "LAPTOP_INTERACTION": 0.85,
        "SUSPICIOUS_STILLNESS": 0.9,
        "EXCESSIVE_MOVEMENT": 0.75,
    }
    multiplier = type_multipliers.get(event_type, 0.8)
    confidence = (base_confidence + duration_bonus) * multiplier
    return float(min(1.0, max(0.0, confidence)))


def merge_consecutive_events(events: List[dict], max_gap: float = 2.0) -> List[dict]:
    """Merge same-type, same-person events that are within ``max_gap`` seconds."""
    if len(events) == 0:
        return []

    events = sorted(events, key=lambda x: x["start_time"])
    merged: List[dict] = []
    current = events[0].copy()

    for event in events[1:]:
        if (
            event["event_type"] == current["event_type"]
            and event["person_id"] == current["person_id"]
            and event["start_time"] - current["end_time"] <= max_gap
        ):
            current["end_time"] = event["end_time"]
            current["duration"] = current["end_time"] - current["start_time"]
            current["confidence"] = max(current["confidence"], event["confidence"])
            curr_bboxes = current.get("event_bboxes", [])
            new_bboxes = event.get("event_bboxes", [])
            current["event_bboxes"] = curr_bboxes + new_bboxes
            if not current.get("bbox") and event.get("bbox"):
                current["bbox"] = event["bbox"]
        else:
            merged.append(current)
            current = event.copy()
    merged.append(current)
    return merged


def format_timestamp(seconds: float) -> str:
    """Convert seconds to MM:SS."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


def build_person_tracks(tracking_data: List[dict]) -> Dict[int, List[dict]]:
    """Index frame-by-frame detections into per-person tracks (notebook Cell 4)."""
    person_tracks: Dict[int, List[dict]] = defaultdict(list)
    for frame_data in tracking_data:
        for det in frame_data["detections"]:
            if det["class"] == "person":
                person_tracks[det["track_id"]].append({
                    "frame": frame_data["frame"],
                    "timestamp": frame_data["timestamp"],
                    "bbox": det["bbox"],
                    "motion_score": det.get("motion_score", 0.0),
                    "confidence": det["confidence"],
                })
    return dict(person_tracks)


def identify_invigilators_and_teachers(
    person_tracks: Dict[int, List[dict]],
    travel_threshold: float = config.TEACHER_TRAVEL_THRESHOLD_PX,
) -> set[int]:
    """Identify invigilators and teachers based on bounding box travel across the room.

    Students generally remain in their seats, while invigilators pace across aisles.
    If a person's bounding box centroid displacement spans more than `travel_threshold`
    pixels across the entire video, they are flagged as an invigilator/teacher.
    """
    invigilator_ids: set[int] = set()
    for person_id, detections in person_tracks.items():
        if len(detections) < 2:
            continue
        centroids = [
            ((d["bbox"][0] + d["bbox"][2]) / 2.0, (d["bbox"][1] + d["bbox"][3]) / 2.0)
            for d in detections
        ]
        xs = [c[0] for c in centroids]
        ys = [c[1] for c in centroids]
        span = float(np.sqrt((max(xs) - min(xs)) ** 2 + (max(ys) - min(ys)) ** 2))
        if span >= travel_threshold:
            invigilator_ids.add(person_id)
    return invigilator_ids


# ---------------------------------------------------------------------------
# Event detectors (notebook Cells 6-8)
# ---------------------------------------------------------------------------
def detect_laptop_interactions(
    tracking_data: List[dict],
    cfg: dict,
    ignore_person_ids: set[int] | None = None,
) -> List[dict]:
    """Person-near-laptop interactions, filtered to a plausible duration window."""
    if not cfg["enabled"]:
        return []

    ignore_ids = ignore_person_ids or set()
    frame_interactions: List[dict] = []
    for frame_data in tracking_data:
        persons = [
            d for d in frame_data["detections"]
            if d["class"] == "person" and d["track_id"] not in ignore_ids
        ]
        laptops = [d for d in frame_data["detections"] if d["class"] == "laptop"]
        for person in persons:
            for laptop in laptops:
                distance = calculate_distance(person["bbox"], laptop["bbox"])
                if distance < cfg["proximity_threshold"]:
                    frame_interactions.append({
                        "timestamp": frame_data["timestamp"],
                        "person_id": person["track_id"],
                        "bbox": person["bbox"],
                    })

    if not frame_interactions:
        return []

    events: List[dict] = []
    per_person: Dict[int, List[dict]] = defaultdict(list)
    for interaction in frame_interactions:
        per_person[interaction["person_id"]].append(interaction)

    for person_id, interactions in per_person.items():
        interactions = sorted(interactions, key=lambda x: x["timestamp"])
        start_time = interactions[0]["timestamp"]
        end_time = interactions[0]["timestamp"]

        def _flush(start, end):
            duration = end - start
            if cfg["min_duration"] <= duration <= cfg["max_duration"]:
                ev_bboxes = [
                    {"timestamp": item["timestamp"], "bbox": item["bbox"]}
                    for item in interactions
                    if start <= item["timestamp"] <= end
                ]
                pri_bbox = ev_bboxes[0]["bbox"] if ev_bboxes else []
                events.append(_make_event(
                    "LAPTOP_INTERACTION", person_id, start, end, cfg["severity"],
                    calculate_event_confidence("LAPTOP_INTERACTION", duration, 0.85),
                    "Brief laptop interaction detected",
                    bbox=pri_bbox,
                    event_bboxes=ev_bboxes,
                ))

        for i in range(1, len(interactions)):
            gap = interactions[i]["timestamp"] - end_time
            if gap <= cfg["merge_gap"]:
                end_time = interactions[i]["timestamp"]
            else:
                _flush(start_time, end_time)
                start_time = interactions[i]["timestamp"]
                end_time = interactions[i]["timestamp"]
        _flush(start_time, end_time)
    return events


def _detect_motion_events(
    person_tracks: Dict[int, List[dict]],
    cfg: dict,
    event_type: str,
    signal: float,
    description: str,
    comparison: str,
) -> List[dict]:
    """Shared scan for stillness (motion < threshold) / movement (motion > threshold)."""
    if not cfg["enabled"]:
        return []

    events: List[dict] = []
    threshold = cfg["motion_threshold"]

    for person_id, track in person_tracks.items():
        if len(track) < 2:
            continue
        def _emit_event(s, dur):
            ev_bboxes = [
                {"timestamp": d["timestamp"], "bbox": d["bbox"]}
                for d in track
                if s <= d["timestamp"] <= s + dur
            ]
            pri_bbox = ev_bboxes[0]["bbox"] if ev_bboxes else (track[0]["bbox"] if track else [])
            events.append(_make_event(
                event_type, person_id, s, s + dur,
                cfg["severity"],
                calculate_event_confidence(event_type, dur, signal),
                description,
                bbox=pri_bbox,
                event_bboxes=ev_bboxes,
            ))

        run_start = None
        run_duration = 0.0

        for detection in track:
            motion = detection["motion_score"]
            triggered = motion < threshold if comparison == "<" else motion > threshold
            if triggered:
                if run_start is None:
                    run_start = detection["timestamp"]
                run_duration = detection["timestamp"] - run_start
            else:
                if run_start is not None and run_duration >= cfg["min_duration"]:
                    _emit_event(run_start, run_duration)
                run_start = None
                run_duration = 0.0
        if run_start is not None and run_duration >= cfg["min_duration"]:
            _emit_event(run_start, run_duration)
    return events


def detect_suspicious_stillness(person_tracks: Dict[int, List[dict]], cfg: dict) -> List[dict]:
    return _detect_motion_events(
        person_tracks, cfg, "SUSPICIOUS_STILLNESS", 0.8,
        "Prolonged stillness - potential hidden device usage", "<",
    )


def detect_excessive_movement(person_tracks: Dict[int, List[dict]], cfg: dict) -> List[dict]:
    return _detect_motion_events(
        person_tracks, cfg, "EXCESSIVE_MOVEMENT", 0.7,
        "Sustained excessive movement / suspicious desk interaction detected", ">",
    )


def _make_event(
    event_type: str,
    person_id: int,
    start: float,
    end: float,
    severity: str,
    confidence: float,
    description: str,
    bbox: list | None = None,
    event_bboxes: list | None = None,
) -> dict:
    return {
        "event_type": event_type,
        "person_id": int(person_id),
        "track_id": int(person_id),
        "start_time": float(start),
        "end_time": float(end),
        "duration": float(end - start),
        "severity": severity,
        "confidence": float(confidence),
        "description": description,
        "bbox": bbox or [],
        "event_bboxes": event_bboxes or [],
    }


# ---------------------------------------------------------------------------
# Orchestration (notebook Cell 9-10)
# ---------------------------------------------------------------------------
_SEVERITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


def run_event_engine(
    tracking_data: List[dict],
    motion_timeline: Dict[str, list] | None,
    summary: dict | None,
    exam_type: str,
) -> Tuple[List[dict], dict]:
    """Run all detectors, merge/filter/sort, and assign event IDs.

    Returns ``(events, metadata)`` mirroring the notebook's ``events.json``.
    """
    event_config = config.build_event_config(exam_type)
    person_tracks = build_person_tracks(tracking_data)
    invigilator_ids = identify_invigilators_and_teachers(
        person_tracks, travel_threshold=config.TEACHER_TRAVEL_THRESHOLD_PX
    )
    student_tracks = {
        pid: track for pid, track in person_tracks.items()
        if pid not in invigilator_ids
    }

    all_events: List[dict] = []
    all_events += detect_laptop_interactions(
        tracking_data,
        event_config["LAPTOP_INTERACTION"],
        ignore_person_ids=invigilator_ids,
    )
    all_events += detect_suspicious_stillness(student_tracks, event_config["SUSPICIOUS_STILLNESS"])
    all_events += detect_excessive_movement(student_tracks, event_config["EXCESSIVE_MOVEMENT"])

    all_events = merge_consecutive_events(all_events, max_gap=config.EVENT_MERGE_GAP_GLOBAL)
    filtered = [e for e in all_events if e["confidence"] >= config.MIN_EVENT_CONFIDENCE]
    filtered = sorted(
        filtered, key=lambda x: (_SEVERITY_ORDER.get(x["severity"], 3), x["start_time"])
    )

    for i, event in enumerate(filtered, 1):
        event["event_id"] = i
        event["start_time_formatted"] = format_timestamp(event["start_time"])
        event["end_time_formatted"] = format_timestamp(event["end_time"])

    events_by_type: Dict[str, int] = defaultdict(int)
    events_by_severity: Dict[str, int] = defaultdict(int)
    for event in filtered:
        events_by_type[event["event_type"]] += 1
        events_by_severity[event["severity"]] += 1

    metadata = {
        "exam_type": exam_type,
        "total_events": len(filtered),
        "video_frames": len(tracking_data),
        "persons_tracked": len(person_tracks),
        "students_tracked": len(student_tracks),
        "invigilators_identified": sorted(list(invigilator_ids)),
        "detection_config": event_config,
        "events_by_type": dict(events_by_type),
        "events_by_severity": dict(events_by_severity),
    }
    return filtered, metadata


def build_investigation_report(
    events: List[dict],
    metadata: dict,
    video_properties: dict,
    summary: dict | None,
    exam_type: str,
) -> dict:
    """Build the summary investigation report (notebook Phase 2 Cell 15)."""
    profile = config.get_exam_profile(exam_type)
    high = [e for e in events if e["severity"] == "HIGH"]
    medium = [e for e in events if e["severity"] == "MEDIUM"]
    summary = summary or {}

    return {
        "exam_info": {
            "exam_type": exam_type,
            "exam_description": profile["description"],
        },
        "video_info": {
            "total_frames": metadata.get("video_frames", 0),
            "duration_seconds": video_properties.get("durationSeconds", 0),
            "resolution": video_properties.get("resolution", ""),
        },
        "processing_summary": {
            "persons_tracked": metadata.get("persons_tracked", 0),
            "total_detections": summary.get("total_detections", 0),
            "detections_per_frame": summary.get("average_detections_per_frame", 0),
        },
        "events_summary": {
            "total_events": len(events),
            "high_severity": len(high),
            "medium_severity": len(medium),
            "by_type": metadata.get("events_by_type", {}),
        },
        "investigation_priority": {
            "immediate_review": [
                {
                    "event_id": e["event_id"],
                    "type": e["event_type"],
                    "person": e["person_id"],
                    "time": e["start_time_formatted"],
                    "duration": f"{e['duration']:.1f}s",
                }
                for e in high
            ][:10],
            "secondary_review": [
                {
                    "event_id": e["event_id"],
                    "type": e["event_type"],
                    "person": e["person_id"],
                    "time": e["start_time_formatted"],
                }
                for e in medium
            ][:10],
        },
        "recommendations": {
            "manual_review_required": len(high),
            "estimated_review_time_minutes": len(events) * 2,
            "attention_persons": sorted({e["person_id"] for e in high}),
        },
    }
