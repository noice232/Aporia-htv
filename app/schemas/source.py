from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreateSource(BaseModel):
    provider: str
    source_locator: str
    kind: str
    title: str | None = None
    excerpt: str | None = None
    access_scope: str = "public"
    data_mode: str = "retrieved"


class SourceOut(BaseModel):
    id: str
    provider: str
    source_locator: str
    kind: str
    title: str | None = None
    excerpt: str | None = None
    access_scope: str
    data_mode: str
    project_id: str | None = None
    retrieved_at: datetime


class SourceSearch(BaseModel):
    query: str | None = None
    provider: str | None = None
    kind: str | None = None
