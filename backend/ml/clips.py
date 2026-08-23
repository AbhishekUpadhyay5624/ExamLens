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


def _extract_with_opencv(
    video_path: str, start: float, duration: float, out_path: str, event: dict | None = None
) -> bool:
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

    event_bboxes = event.get("event_bboxes", []) if event else []
    primary_bbox = event.get("bbox", []) if event else []
    event_type = event.get("event_type", "SUSPICIOUS") if event else "SUSPICIOUS"
    person_id = event.get("person_id", event.get("track_id", "")) if event else ""
    severity = event.get("severity", "HIGH") if event else "HIGH"
    box_color = (0, 0, 255) if severity == "HIGH" else (0, 165, 255)  # BGR Red or Orange

    while frame_no < end_frame:
        ret, frame = cap.read()
        if not ret:
            break
        timestamp = frame_no / fps

        # Find closest bounding box for this timestamp or fallback to primary bbox
        match_bbox = None
        if event_bboxes:
            closest = min(event_bboxes, key=lambda b: abs(b.get("timestamp", 0.0) - timestamp), default=None)
            if closest and abs(closest.get("timestamp", 0.0) - timestamp) < 5.0:
                match_bbox = closest.get("bbox")
        if not match_bbox:
            match_bbox = primary_bbox

        if match_bbox and len(match_bbox) == 4:
            x1, y1, x2, y2 = map(int, match_bbox)
            # Draw bounding box rectangle
            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 3)

            # Draw glowing corner accents
            corner_len = min(25, (x2 - x1) // 4, (y2 - y1) // 4)
            accent_color = (255, 255, 255)
            # Top-left
            cv2.line(frame, (x1, y1), (x1 + corner_len, y1), accent_color, 4)
            cv2.line(frame, (x1, y1), (x1, y1 + corner_len), accent_color, 4)
            # Top-right
            cv2.line(frame, (x2, y1), (x2 - corner_len, y1), accent_color, 4)
            cv2.line(frame, (x2, y1), (x2, y1 + corner_len), accent_color, 4)
            # Bottom-left
            cv2.line(frame, (x1, y2), (x1 + corner_len, y2), accent_color, 4)
            cv2.line(frame, (x1, y2), (x1, y2 - corner_len), accent_color, 4)
            # Bottom-right
            cv2.line(frame, (x2, y2), (x2 - corner_len, y2), accent_color, 4)
            cv2.line(frame, (x2, y2), (x2, y2 - corner_len), accent_color, 4)

            # Draw tag label badge
            label = f"Person #{person_id} | {event_type.replace('_', ' ')}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(frame, (x1, max(0, y1 - 26)), (x1 + tw + 14, y1), box_color, -1)
            cv2.putText(frame, label, (x1 + 6, max(18, y1 - 7)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

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
        duration = min(25.0, max(1.5, end_time - start_time))

        filename = _clip_filename(event)
        clip_path = out / filename

        ok = False
        if ffmpeg:
            # 1. First render with OpenCV to draw the glowing bounding box & label
            temp_path = str(clip_path).replace(".mp4", "_raw.mp4")
            if _extract_with_opencv(video_path, start_time, duration, temp_path, event=event):
                # 2. Transcode to browser-compatible H.264 using ffmpeg
                cmd = [
                    ffmpeg, "-y",
                    "-i", temp_path,
                    "-c:v", "libx264",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-movflags", "+faststart",
                    "-loglevel", "error",
                    str(clip_path),
                ]
                subprocess.run(cmd, check=False, capture_output=True)
                Path(temp_path).unlink(missing_ok=True)
                ok = Path(clip_path).exists() and Path(clip_path).stat().st_size > 0

            # Fallback to direct ffmpeg extract if OpenCV temp failed
            if not ok:
                ok = _extract_with_ffmpeg(ffmpeg, video_path, start_time, duration, str(clip_path))
        else:
            ok = _extract_with_opencv(video_path, start_time, duration, str(clip_path), event=event)

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
