"""Smoke tests for the API surface.

These verify the app boots and routes/auth wiring behave, without requiring a
running MongoDB. DB-backed flows (register/login/upload) are covered separately
and need a live database.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

# No context manager -> skip the lifespan (index creation), so these run fast
# and offline. Endpoints that don't touch the DB still work.
client = TestClient(app)


def test_root_ok():
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["api_prefix"] == "/api"
    assert body["health"] == "/health"


def test_openapi_schema_available():
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = r.json()["paths"]
    # Core endpoints from the plan are registered.
    assert "/api/auth/login" in paths
    assert "/api/auth/register" in paths
    assert "/api/exams" in paths
    assert "/api/events/{event_id}" in paths
    assert "/api/events/{event_id}/clip" in paths


def test_protected_route_requires_bearer():
    # HTTPBearer(auto_error=True) rejects a missing Authorization header.
    r = client.get("/api/exams")
    assert r.status_code == 403


def test_login_body_validation():
    # Missing fields -> 422 from pydantic before any DB access.
    r = client.post("/api/auth/login", json={})
    assert r.status_code == 422


def test_invalid_token_is_unauthorized():
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401
