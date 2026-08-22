"""Standalone pipeline runner (no database).

Process a single video through the full ExamLens pipeline and write the results
(events.json, report.json, clips, heatmap) to an output directory. Useful for
smoke-testing the ML stack or reproducing the notebook output from the CLI.

Usage::

    python -m scripts.run_pipeline path/to/video.mp4 --exam-type PHYSICAL \
        --output out/ --max-frames 300
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Allow running as a plain script (python scripts/run_pipeline.py ...).
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml import config, process_exam_video  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the ExamLens pipeline on one video.")
    parser.add_argument("video", help="Path to the input video file.")
    parser.add_argument(
        "--exam-type", default="HYBRID", choices=list(config.VALID_EXAM_TYPES),
        help="Exam type profile to apply (default: HYBRID).",
    )
    parser.add_argument("--output", default="pipeline_output", help="Output directory.")
    parser.add_argument("--weights", default=config.YOLO_WEIGHTS_DEFAULT, help="YOLO weights.")
    parser.add_argument("--top-clips", type=int, default=10, help="Max evidence clips to cut.")
    parser.add_argument(
        "--max-frames", type=int, default=None,
        help="Cap frames processed (for quick demos). Default: whole video.",
    )
    parser.add_argument("--write-video", action="store_true", help="Also write the annotated video.")
    args = parser.parse_args(argv)

    video = Path(args.video)
    if not video.exists():
        parser.error(f"video not found: {video}")

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    def status_cb(stage: str) -> None:
        print(f"  [stage] {stage}", flush=True)

    print(f"Processing {video} as {args.exam_type} ...")
    results = process_exam_video(
        video_path=str(video),
        exam_type=args.exam_type,
        output_dir=str(out_dir),
        weights=args.weights,
        top_clips=args.top_clips,
        max_frames=args.max_frames,
        write_video=args.write_video,
        status_cb=status_cb,
    )

    (out_dir / "events.json").write_text(json.dumps(results["events"], indent=2))
    (out_dir / "report.json").write_text(json.dumps(results["report"], indent=2))
    (out_dir / "metadata.json").write_text(json.dumps(results["metadata"], indent=2, default=str))

    meta = results["metadata"]
    print("\nDone.")
    print(f"  persons tracked : {meta['persons_tracked']}")
    print(f"  total events    : {meta['total_events']}")
    print(f"  by severity     : {meta['events_by_severity']}")
    print(f"  by type         : {meta['events_by_type']}")
    print(f"  clips extracted : {len(results['clips'])}")
    print(f"  heatmap         : {results['heatmap_filename']}")
    print(f"  output dir      : {out_dir.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
