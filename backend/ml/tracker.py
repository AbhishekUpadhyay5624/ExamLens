"""Phase 1B — motion detection + multi-object tracking.

Refactored from the Colab notebook (Phase 1B Cells 4-7). ``run_tracking`` opens
a video, runs the hybrid MOG2-motion / YOLO-detection / ByteTrack pipeline and
returns the same three artefacts the notebook produced:

    tracking_data    frame-by-frame detections (list of frame dicts)
    motion_timeline  per-person motion scores over time (dict keyed "person_<id>")
    summary          aggregate statistics

plus ``video_properties`` describing the source video.
"""
from __future__ import annotations

from collections import defaultdict, deque
from typing import Any, Callable, Dict, List, Optional, Tuple

import numpy as np

from . import config
from .detector import load_model

ProgressCb = Optional[Callable[[int, int], None]]


# ---------------------------------------------------------------------------
# Helper functions (notebook Cell 5)
# ---------------------------------------------------------------------------
def extract_motion_rois(motion_mask, min_area: int = config.MIN_MOTION_AREA):
    """Extract bounding-box ROIs from a MOG2 motion mask."""
    import cv2

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    motion_mask = cv2.morphologyEx(motion_mask, cv2.MORPH_CLOSE, kernel)
    motion_mask = cv2.morphologyEx(motion_mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(motion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    rois = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > min_area:
            x, y, w, h = cv2.boundingRect(contour)
            rois.append((x, y, w, h))
    return rois


def should_run_full_frame(frame_idx: int, interval: int = 60) -> bool:
    """Run a full-frame YOLO pass every ``interval`` frames to catch still /
    newly-entered persons that motion ROIs miss."""
    return frame_idx % interval == 0


def merge_rois(rois, frame_shape):
    """Merge overlapping motion ROIs, expanding each by 20% for context."""
    if len(rois) == 0:
        return []

    boxes = []
    for (x, y, w, h) in rois:
        expand = 0.2
        x1 = max(0, int(x - w * expand))
        y1 = max(0, int(y - h * expand))
        x2 = min(frame_shape[1], int(x + w * (1 + expand)))
        y2 = min(frame_shape[0], int(y + h * (1 + expand)))
        boxes.append([x1, y1, x2, y2])

    merged = []
    used = set()
    for i, box1 in enumerate(boxes):
        if i in used:
            continue
        x1, y1, x2, y2 = box1
        for j, box2 in enumerate(boxes[i + 1:], i + 1):
            if j in used:
                continue
            bx1, by1, bx2, by2 = box2
            if not (x2 < bx1 or bx2 < x1 or y2 < by1 or by2 < y1):
                x1 = min(x1, bx1)
                y1 = min(y1, by1)
                x2 = max(x2, bx2)
                y2 = max(y2, by2)
                used.add(j)
        merged.append((x1, y1, x2 - x1, y2 - y1))
        used.add(i)
    return merged


def calculate_motion_score(track_id, current_bbox, bbox_history) -> float:
    """Per-person motion score in [0, 1] from bbox position/area variance."""
    if track_id not in bbox_history:
        bbox_history[track_id] = deque(maxlen=config.MOTION_HISTORY_SIZE)

    bbox_history[track_id].append(current_bbox)

    if len(bbox_history[track_id]) < 2:
        return 0.0

    history = list(bbox_history[track_id])
    centers, areas = [], []
    for bbox in history:
        cx = (bbox[0] + bbox[2]) / 2
        cy = (bbox[1] + bbox[3]) / 2
        area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        centers.append((cx, cy))
        areas.append(area)

    cx_values = [c[0] for c in centers]
    cy_values = [c[1] for c in centers]
    position_variance = np.std(cx_values) + np.std(cy_values)
    area_variance = np.std(areas)

    motion_score = min(1.0, (position_variance / 50.0) + (area_variance / 10000.0))
    return float(motion_score)


def _draw_annotations(frame, detections, motion_scores, model):
    """Draw bboxes + track IDs + motion scores (only used when write_video=True)."""
    import cv2

    annotated = frame.copy()
    if detections is None or len(detections) == 0:
        return annotated

    for i in range(len(detections)):
        bbox = detections.xyxy[i]
        track_id = detections.tracker_id[i] if detections.tracker_id is not None else None
        class_id = detections.class_id[i]
        confidence = detections.confidence[i]
        x1, y1, x2, y2 = map(int, bbox)
        class_name = model.names[class_id]
        motion_score = motion_scores.get(track_id, 0.0) if track_id is not None else 0.0

        if motion_score > 0.6:
            color = (0, 0, 255)      # red - high motion
        elif motion_score > 0.3:
            color = (0, 165, 255)    # orange - medium
        else:
            color = (0, 255, 0)      # green - low motion

        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        if track_id is not None:
            label = f"ID:{track_id} {class_name} M:{motion_score:.2f}"
        else:
            label = f"{class_name} {confidence:.2f}"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        y1_label = max(y1, label_size[1] + 10)
        cv2.rectangle(annotated, (x1, y1_label - label_size[1] - 10),
                      (x1 + label_size[0], y1_label), color, -1)
        cv2.putText(annotated, label, (x1, y1_label - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    return annotated


# ---------------------------------------------------------------------------
# Main pipeline (notebook Cell 6-7)
# ---------------------------------------------------------------------------
def run_tracking(
    video_path: str,
    *,
    weights: str = config.YOLO_WEIGHTS_DEFAULT,
    frame_skip: int = config.FRAME_SKIP,
    max_frames: Optional[int] = None,
    write_video: bool = False,
    output_video_path: Optional[str] = None,
    progress_cb: ProgressCb = None,
) -> Tuple[List[dict], Dict[str, list], dict, dict]:
    """Run the Phase 1B tracking pipeline over ``video_path``.

    Returns ``(tracking_data, motion_timeline, summary, video_properties)``.
    """
    import cv2
    import supervision as sv

    model = load_model(weights)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if fps <= 0:
        fps = 30.0  # defensive default for containers with bad metadata

    frames_to_process = total_frames
    if max_frames:
        frames_to_process = min(total_frames, max_frames) if total_frames > 0 else max_frames

    video_duration_seconds = (total_frames / fps) if (total_frames > 0 and fps > 0) else 0.0
    if frame_skip == config.FRAME_SKIP and video_duration_seconds > 0:
        frame_skip = config.calculate_dynamic_frame_skip(video_duration_seconds, default_skip=frame_skip)

    effective_fps = max(1.0, fps / frame_skip)

    # Background subtractor (MOG2)
    bg_subtractor = cv2.createBackgroundSubtractorMOG2(
        history=500, varThreshold=config.MOTION_THRESHOLD, detectShadows=False
    )

    # ByteTrack configured with the effective FPS
    tracker = sv.ByteTrack(
        track_activation_threshold=config.BYTETRACK_ACTIVATION_THRESHOLD,
        lost_track_buffer=int(effective_fps * config.BYTETRACK_LOST_BUFFER_SECONDS),
        minimum_matching_threshold=config.BYTETRACK_MIN_MATCHING_THRESHOLD,
        frame_rate=int(effective_fps),
    )

    writer = None
    if write_video and output_video_path:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(output_video_path, fourcc, fps, (width, height))

    tracking_data: List[dict] = []
    motion_timeline: Dict[str, list] = defaultdict(list)
    bbox_history: Dict[int, deque] = {}
    motion_scores: Dict[int, float] = {}

    full_frame_interval = max(1, int(fps * config.FULL_FRAME_INTERVAL_SECONDS))
    processed_count = 0
    frame_idx = -1

    while True:
        if frames_to_process and processed_count >= frames_to_process:
            break
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1

        if frame_skip > 1 and frame_idx % frame_skip != 0:
            continue

        # Step 1: background subtraction + ROI extraction (kept faithful to the
        # notebook; a full-frame YOLO pass is used either way for accuracy).
        motion_mask = bg_subtractor.apply(frame)
        motion_rois = extract_motion_rois(motion_mask)
        _ = should_run_full_frame(processed_count, interval=full_frame_interval)
        if motion_rois:
            merge_rois(motion_rois, frame.shape)

        results = model(frame, verbose=False, conf=config.YOLO_CONFIDENCE)[0]

        detections = sv.Detections.from_ultralytics(results)
        mask = np.isin(detections.class_id, config.TRACK_CLASS_IDS)
        detections = detections[mask]
        detections = tracker.update_with_detections(detections)

        timestamp = frame_idx / fps
        frame_data = {"frame": frame_idx, "timestamp": timestamp, "detections": []}

        if detections.tracker_id is not None:
            for i in range(len(detections)):
                track_id = int(detections.tracker_id[i])
                bbox = detections.xyxy[i]
                score = calculate_motion_score(track_id, bbox, bbox_history)
                motion_scores[track_id] = score

                motion_timeline[f"person_{track_id}"].append({
                    "frame": frame_idx,
                    "time": timestamp,
                    "motion_score": float(score),
                    "bbox": bbox.tolist(),
                })
                frame_data["detections"].append({
                    "track_id": track_id,
                    "class": model.names[int(detections.class_id[i])],
                    "confidence": float(detections.confidence[i]),
                    "bbox": bbox.tolist(),
                    "motion_score": float(score),
                })

        if writer is not None:
            writer.write(_draw_annotations(frame, detections, motion_scores, model))

        tracking_data.append(frame_data)
        processed_count += 1
        if progress_cb and processed_count % 50 == 0:
            progress_cb(processed_count, frames_to_process or processed_count)

    cap.release()
    if writer is not None:
        writer.release()

    summary = _build_summary(tracking_data, processed_count)
    video_properties = {
        "resolution": f"{width}x{height}",
        "fps": round(float(fps), 2),
        "durationSeconds": round(processed_count / fps, 2) if fps else 0.0,
        "totalFrames": processed_count,
    }
    if progress_cb:
        progress_cb(processed_count, frames_to_process or processed_count)
    return tracking_data, dict(motion_timeline), summary, video_properties


def _build_summary(tracking_data: List[dict], processed_count: int) -> dict:
    """Aggregate statistics (notebook Cell 7)."""
    unique_tracks = set()
    total_detections = 0
    class_counts: Dict[str, int] = defaultdict(int)
    for frame_data in tracking_data:
        for det in frame_data["detections"]:
            unique_tracks.add(det["track_id"])
            total_detections += 1
            class_counts[det["class"]] += 1
    return {
        "total_frames_processed": processed_count,
        "unique_persons_tracked": len(unique_tracks),
        "total_detections": total_detections,
        "detections_per_class": dict(class_counts),
        "average_detections_per_frame": (
            total_detections / processed_count if processed_count > 0 else 0
        ),
    }
