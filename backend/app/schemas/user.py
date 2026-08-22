"""User & auth schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["admin", "invigilator"]


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Role = "invigilator"


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
