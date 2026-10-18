from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreatePaper(BaseModel):
    arxiv_id: str | None = None
    openalex_id: str | None = None
    doi: str | None = None
    title: str
    authors_json: str | None = None
    abstract: str | None = None
    url: str | None = None
    publication_year: int | None = None
    citation_count: int = 0
    topics_json: str | None = None
    position_json: str | None = None
    data_mode: str = "indexed"


class PaperOut(BaseModel):
    id: str
    arxiv_id: str | None = None
    openalex_id: str | None = None
    doi: str | None = None
    title: str
    authors_json: str | None = None
    abstract: str | None = None
    url: str | None = None
    publication_year: int | None = None
    citation_count: int
    topics_json: str | None = None
    position_json: str | None = None
    data_mode: str
    created_at: datetime


class PaperSearch(BaseModel):
    q: str | None = None
    topic: str | None = None
    limit: int = 20
