"""Motion heatmap generation (Phase 2 Cell 14).

Accumulates per-person motion-weighted activity across all frames, overlays it
on the first frame, and writes a PNG plus a small JSON descriptor.
"""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np

from . import config


def generate_heatmap(
    video_path: str,
    tracking_data: List[dict],
    output_dir: str,
    exam_type: str,
) -> Tuple[Optional[str], Optional[str]]:
    """Generate the motion heatmap.

    Returns ``(heatmap_png_path, heatmap_json_path)`` as strings (or ``(None, None)``
    if the video could not be opened).
    """
    import cv2
    import matplotlib

    matplotlib.use("Agg")  # headless
    import matplotlib.pyplot as plt

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None, None
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ret, first_frame = cap.read()
    cap.release()

    if width <= 0 or height <= 0:
        return None, None

    heatmap = np.zeros((height, width), dtype=np.float32)
    for frame_data in tracking_data:
        for det in frame_data["detections"]:
            if det["class"] != "person":
                continue
            x1, y1, x2, y2 = map(int, det["bbox"])
            motion_score = det.get("motion_score", 0.5)
            x1, x2 = max(0, x1), min(width, x2)
            y1, y2 = max(0, y1), min(height, y2)
            if x2 > x1 and y2 > y1:
                heatmap[y1:y2, x1:x2] += motion_score

    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    fig, ax = plt.subplots(figsize=(16, 9))
    if ret and first_frame is not None:
        ax.imshow(cv2.cvtColor(first_frame, cv2.COLOR_BGR2RGB), alpha=0.5)
    im = ax.imshow(heatmap, cmap="hot", alpha=0.6, interpolation="bilinear")
    cbar = plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label("Activity Intensity", fontsize=12, fontweight="bold")
    ax.set_title(f"Motion Activity Heatmap - {exam_type} Exam", fontsize=14, fontweight="bold")
    ax.axis("off")
    plt.tight_layout()

    heatmap_png = out / "motion_heatmap.png"
    plt.savefig(heatmap_png, dpi=150, bbox_inches="tight")
    plt.close(fig)

    heatmap_json = out / "heatmap_data.json"
    import json

    with open(heatmap_json, "w") as f:
        json.dump(
            {
                "exam_type": exam_type,
                "width": width,
                "height": height,
                "max_value": float(heatmap.max()),
                "min_value": float(heatmap.min()),
            },
            f,
            indent=2,
        )
    return str(heatmap_png), str(heatmap_json)
