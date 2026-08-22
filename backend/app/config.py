"""Application settings, loaded from environment / .env (pydantic-settings)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_name: str = "ExamLens API"
    api_prefix: str = "/api"
    # NoDecode stops pydantic-settings from JSON-parsing the env value, so the
    # validator below can accept a plain comma-separated string.
    cors_origins: Annotated[List[str], NoDecode] = [
        "http://localhost:5173", "http://localhost:3000"
    ]

    # --- MongoDB ---
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "examlens"

    # --- Storage ---
    storage_dir: Path = BACKEND_ROOT / "storage"

    # --- Auth (JWT) ---
    jwt_secret: str = "CHANGE_ME_dev_secret_do_not_use_in_prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    # If true, POST /api/auth/register is open (use to bootstrap the first admin,
    # then turn it off). If false, only an admin can create users.
    allow_open_registration: bool = True

    # --- ML / worker ---
    yolo_weights: str = "yolo11n.pt"
    worker_threads: int = 1
    top_clips: int = 10
    # Optional cap on frames processed per job (None = whole video). Handy for demos.
    max_frames: int | None = None

    # --- Optional Celery (off by default; jobs run in-process) ---
    use_celery: bool = False
    celery_broker_url: str = "redis://localhost:6379/0"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
