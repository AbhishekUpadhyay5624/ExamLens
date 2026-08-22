"""ExamLens ML pipeline package (refactored from the Colab notebooks)."""
from .pipeline import (
    STAGE_CLIPS,
    STAGE_DETECTING,
    STAGE_DONE,
    STAGE_HEATMAP,
    STAGE_TRACKING,
    process_exam_video,
)

__all__ = [
    "process_exam_video",
    "STAGE_TRACKING",
    "STAGE_DETECTING",
    "STAGE_CLIPS",
    "STAGE_HEATMAP",
    "STAGE_DONE",
]
