"""Authentication routes: register, login, current user."""
from __future__ import annotations

import datetime as dt
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..config import settings
from ..deps import db_dep, get_current_user
from ..schemas import LoginRequest, Token, UserCreate, UserPublic
from ..security import create_access_token, decode_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

# Registration may be gated behind an admin token; use a non-erroring bearer so
# the route can decide based on settings / bootstrap state.
_optional_bearer = HTTPBearer(auto_error=False)


def _user_public(doc: Dict[str, Any]) -> UserPublic:
    return UserPublic(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        role=doc["role"],
    )


async def _caller_is_admin(
    db: AsyncIOMotorDatabase, credentials: Optional[HTTPAuthorizationCredentials]
) -> bool:
    if not credentials:
        return False
    payload = decode_access_token(credentials.credentials)
    return bool(payload and payload.get("role") == "admin")


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    db: AsyncIOMotorDatabase = Depends(db_dep),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
) -> Token:
    """Create a user account.

    - The very first account created becomes an ``admin`` (bootstrap).
    - Afterwards, if ``ALLOW_OPEN_REGISTRATION`` is disabled, only an admin token
      may create further accounts.
    """
    total_users = await db.users.count_documents({})
    is_bootstrap = total_users == 0

    if not is_bootstrap and not settings.allow_open_registration:
        if not await _caller_is_admin(db, credentials):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registration is closed; an admin must create accounts.",
            )

    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    role = "admin" if is_bootstrap else payload.role
    doc = {
        "name": payload.name,
        "email": payload.email,
        "passwordHash": hash_password(payload.password),
        "role": role,
        "createdAt": dt.datetime.now(dt.timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token(subject=str(doc["_id"]), role=role)
    return Token(access_token=token, user=_user_public(doc))


@router.post("/login", response_model=Token)
async def login(
    payload: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(db_dep),
) -> Token:
    user = await db.users.find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user.get("passwordHash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return Token(access_token=token, user=_user_public(user))


@router.get("/me", response_model=UserPublic)
async def me(current_user: Dict[str, Any] = Depends(get_current_user)) -> UserPublic:
    return _user_public(current_user)
