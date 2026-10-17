from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class JudgmentRequest(BaseModel):
    text: str


class UpdatePrinciple(BaseModel):
    text: str | None = None
    enabled: bool | None = None
    confidence: float | None = None


class PrincipleOut(BaseModel):
    id: str
    text: str
    source: str
    scope: str
    confidence: float
    enabled: bool
    approved: bool
    approved_at: datetime | None = None
    weight_adjustments: dict[str, float]
    created_at: datetime


class ProfileOut(BaseModel):
    id: str
    project_id: str
    version: int
    principles: list[PrincipleOut]
    scoring_weights: dict[str, float] | None = None


class ProfileVersionOut(BaseModel):
    version: int
    principles_snapshot: list[dict[str, Any]]
    created_at: datetime
