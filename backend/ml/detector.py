"""YOLO model loading (Phase 1A/1B).

The model is cached per-weights so a long-lived worker process loads YOLO once
and reuses it across jobs.
"""
from __future__ import annotations

from typing import Dict

from .config import YOLO_WEIGHTS_DEFAULT

_MODEL_CACHE: Dict[str, "object"] = {}


def load_model(weights: str = YOLO_WEIGHTS_DEFAULT):
    """Load (and cache) a YOLO model. ``ultralytics`` auto-downloads weights on
    first use if they are not present on disk."""
    if weights not in _MODEL_CACHE:
        # Imported lazily so importing this module does not require torch to be
        # installed (useful for the pure-Python event-engine unit tests).
        from ultralytics import YOLO

        _MODEL_CACHE[weights] = YOLO(weights)
    return _MODEL_CACHE[weights]
