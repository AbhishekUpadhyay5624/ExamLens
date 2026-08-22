"""Evidence clip extraction (Phase 2 Cell 13).

For each event, cut a clip spanning ``event.start - context`` to
``event.end + context``. Prefers ffmpeg (bundled ``imageio-ffmpeg`` binary or a
system ffmpeg) for fast stream copying; falls back to OpenCV frame copying when
no ffmpeg is available so the service has no hard system dependency.
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import List, Optional

from . import config


def _resolve_ffmpeg() -> Optional[str]:
    """Return a usable ffmpeg executable path, or None."""
    system = shutil.which("ffmpeg")
    if system:
        return system
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def _clip_filename(event: dict) -> str:
    return (
        f"event_{event['event_id']:03d}_"
        f"{event['event_type'].lower()}_{event['person_id']}.mp4"
    )


def _extract_with_ffmpeg(ffmpeg: str, video_path: str, start: float,
                         duration: float, out_path: str) -> bool:
    cmd = [
        ffmpeg, "-y",
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-strict", "experimental",
        "-loglevel", "error",
        out_path,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return Path(out_path).exists() and Path(out_path).stat().st_size > 0
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def _extract_with_opencv(video_path: str, start: float, duration: float,
                         out_path: str) -> bool:
    import cv2

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return False
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    start_frame = int(start * fps)
    end_frame = int((start + duration) * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(out_path, fourcc, fps, (width, height))
    frame_no = start_frame
    while frame_no < end_frame:
        ret, frame = cap.read()
        if not ret:
            break
        writer.write(frame)
        frame_no += 1
    cap.release()
    writer.release()
    return Path(out_path).exists() and Path(out_path).stat().st_size > 0


def extract_evidence_clips(
    video_path: str,
    events: List[dict],
    output_dir: str,
    *,
    context_seconds: float = config.CONTEXT_SECONDS,
    max_clips: Optional[int] = None,
    video_duration: Optional[float] = None,
) -> List[dict]:
    """Extract clips for (a subset of) ``events``.

    Returns a list of clip descriptors; also mutates each processed event with a
    ``clip_filename`` key so callers can persist the relative path.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    ffmpeg = _resolve_ffmpeg()

    if video_duration is None:
        try:
            import cv2

            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            cap.release()
            video_duration = frames / fps if fps else None
        except Exception:
            video_duration = None

    events_to_extract = events[:max_clips] if max_clips else events
    clips: List[dict] = []

    for event in events_to_extract:
        start_time = max(0.0, event["start_time"] - context_seconds)
        end_time = event["end_time"] + context_seconds
        if video_duration:
            end_time = min(video_duration, end_time)
        duration = max(0.1, end_time - start_time)

        filename = _clip_filename(event)
        clip_path = out / filename

        ok = False
        if ffmpeg:
            ok = _extract_with_ffmpeg(ffmpeg, video_path, start_time, duration, str(clip_path))
        if not ok:
            ok = _extract_with_opencv(video_path, start_time, duration, str(clip_path))
        if not ok:
            continue

        event["clip_filename"] = filename
        clips.append({
            "event_id": event["event_id"],
            "filename": filename,
            "duration": round(duration, 2),
            "size_mb": round(clip_path.stat().st_size / (1024 * 1024), 2),
            "event_type": event["event_type"],
            "person_id": event["person_id"],
            "severity": event["severity"],
        })
    return clips
