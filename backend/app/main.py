"""ExamLens FastAPI application entry point.

Run locally with::

    uvicorn app.main:app --reload

The app boots even if MongoDB is unreachable (connection is lazy); ``/health``
reports live DB connectivity.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close, ensure_indexes, ping
from .routers import auth, events, exams

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("examlens.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best-effort index creation; don't crash boot if Mongo isn't up yet.
    try:
        await ensure_indexes()
        logger.info("MongoDB indexes ensured.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not ensure indexes at startup (Mongo down?): %s", exc)
    yield
    await close()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Exam proctoring / cheating-detection backend.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(exams.router, prefix=settings.api_prefix)
app.include_router(events.router, prefix=settings.api_prefix)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "mongo": await ping()}


@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "api_prefix": settings.api_prefix,
    }
