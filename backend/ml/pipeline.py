"""Pipeline orchestration.

``process_exam_video`` is the single entry point the worker (or the standalone
CLI) calls. It is deliberately storage-agnostic: it reports progress through a
``status_cb`` and returns a results dict. The worker layer is responsible for
persisting those results to MongoDB — this keeps the ML core testable and free
of any database import.
"""
from __future__ import annotations

from pathlib import Path
from typing import Callable, Optional

from . import config
from .clips import extract_evidence_clips
from .event_engine import build_investigation_report, run_event_engine
from .heatmap import generate_heatmap
from .tracker import run_tracking

# Pipeline stages, in order. Mirrors exams.status in the Mongo schema.
STAGE_TRACKING = "tracking"
STAGE_DETECTING = "detecting_events"
STAGE_CLIPS = "generating_clips"
STAGE_HEATMAP = "generating_heatmap"
STAGE_DONE = "done"

StatusCb = Optional[Callable[[str], None]]


def process_exam_video(
    video_path: str,
    exam_type: str,
    output_dir: str,
    *,
    weights: str = config.YOLO_WEIGHTS_DEFAULT,
    top_clips: int = 10,
    max_frames: Optional[int] = None,
    write_video: bool = False,
    status_cb: StatusCb = None,
) -> dict:
    """Run tracking -> event detection -> clips -> heatmap.

    Returns a dict with keys: ``events``, ``metadata``, ``summary``,
    ``video_properties``, ``clips``, ``report``, ``heatmap_filename``,
    ``clips_dirname``.
    """
    def _status(stage: str) -> None:
        if status_cb:
            status_cb(stage)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    clips_dir = out / "clips"

    # 1. Tracking (Phase 1B)
    _status(STAGE_TRACKING)
    tracking_data, motion_timeline, summary, video_properties = run_tracking(
        video_path,
        weights=weights,
        max_frames=max_frames,
        write_video=write_video,
        output_video_path=str(out / "tracked_video.mp4") if write_video else None,
    )

    # 2. Event detection (Phase 2)
    _status(STAGE_DETECTING)
    events, metadata = run_event_engine(tracking_data, motion_timeline, summary, exam_type)
    report = build_investigation_report(events, metadata, video_properties, summary, exam_type)

    # 3. Evidence clips for the top events
    _status(STAGE_CLIPS)
    clips = extract_evidence_clips(
        video_path, events, str(clips_dir),
        max_clips=top_clips,
        video_duration=video_properties.get("durationSeconds"),
    )

    # 4. Motion heatmap
    _status(STAGE_HEATMAP)
    heatmap_png, _ = generate_heatmap(video_path, tracking_data, str(out), exam_type)

    _status(STAGE_DONE)
    return {
        "events": events,
        "metadata": metadata,
        "summary": summary,
        "video_properties": video_properties,
        "clips": clips,
        "clips_dirname": "clips",
        "report": report,
        "heatmap_filename": Path(heatmap_png).name if heatmap_png else None,
    }
