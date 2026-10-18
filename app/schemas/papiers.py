from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PapiersStatusOut(BaseModel):
    connected: bool
    mode: str
    authenticated_user: str | None
    capabilities: list[str]
    checked_at: datetime
    error: str | None


class PapiersSearchIn(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=20)


class PapiersReadIn(BaseModel):
    source_id: str = Field(min_length=5, max_length=128)


class PapiersResultOut(BaseModel):
    provider: str = "papiers"
    data_mode: str = "live_source"
    retrieved_at: datetime
    result: Any
