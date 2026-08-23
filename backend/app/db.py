"""MongoDB connection (async Motor for the API) with shared in-memory fallback.

The API uses Motor; the background worker uses a synchronous PyMongo client
(see ``worker/runner.py``). Both share the exact same in-memory database instance
when MongoDB is unreachable, ensuring background jobs access created exams seamlessly.
"""
from __future__ import annotations

import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import MongoClient

from .config import settings

logger = logging.getLogger("examlens.db")

_client: Optional[object] = None
_sync_mock_client: Optional[object] = None
_is_mock: bool = False


def get_client():
    global _client, _sync_mock_client, _is_mock
    if _client is None:
        try:
            test_client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=1000)
            test_client.admin.command("ping")
            test_client.close()
            _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=2000)
            _is_mock = False
            logger.info(f"Connected to local MongoDB at {settings.mongodb_uri}")
        except Exception as e:
            logger.warning(f"MongoDB not reachable ({e}). Falling back to In-Memory Database (mongomock_motor).")
            import mongomock_motor
            _client = mongomock_motor.AsyncMongoMockClient()
            _sync_mock_client = getattr(_client, "_AsyncMongoMockClient__client", None)
            _is_mock = True
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.db_name]


def get_sync_db():
    """Return a synchronous PyMongo/mongomock database instance sharing the DB state."""
    global _sync_mock_client, _is_mock
    get_client() # Ensure client initialized
    if _is_mock and _sync_mock_client is not None:
        return _sync_mock_client[settings.db_name]
    else:
        client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=2000)
        return client[settings.db_name]


async def ping() -> bool:
    """Return True if MongoDB (or in-memory mock) responds to a ping."""
    try:
        if _is_mock:
            return True
        await get_client().admin.command("ping")
        return True
    except Exception:
        return False


async def ensure_indexes() -> None:
    """Create the indexes the dashboard relies on (best effort)."""
    try:
        db = get_db()
        await db.events.create_index([("examId", 1), ("severity", 1)])
        await db.events.create_index([("examId", 1), ("personId", 1)])
        await db.events.create_index([("examId", 1), ("eventId", 1)])
        await db.exams.create_index([("uploadedAt", -1)])
        await db.users.create_index("email", unique=True)
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")


async def close() -> None:
    global _client, _sync_mock_client
    if _client is not None:
        if hasattr(_client, "close"):
            _client.close()
        _client = None
        _sync_mock_client = None
