"""MongoDB connection (async Motor for the API).

The API uses Motor; the background worker uses a synchronous PyMongo client
(see ``worker/runner.py``) to avoid sharing an event loop across threads.
Connection is lazy so the API can boot even before MongoDB is reachable — each
request that needs the DB will surface a clear error instead.
"""
from __future__ import annotations

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .config import settings

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.db_name]


async def ping() -> bool:
    """Return True if MongoDB responds to a ping."""
    try:
        await get_client().admin.command("ping")
        return True
    except Exception:
        return False


async def ensure_indexes() -> None:
    """Create the indexes the dashboard relies on (best effort)."""
    db = get_db()
    await db.events.create_index([("examId", 1), ("severity", 1)])
    await db.events.create_index([("examId", 1), ("personId", 1)])
    await db.events.create_index([("examId", 1), ("eventId", 1)])
    await db.exams.create_index([("uploadedAt", -1)])
    await db.users.create_index("email", unique=True)


async def close() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
