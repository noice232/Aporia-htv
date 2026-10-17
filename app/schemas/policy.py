from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ScoreRequest(BaseModel):
    w: float = Field(ge=0.0, le=2.0)
    human_context: dict[str, Any] | None = None
    candidate_ids: list[str] | None = None


class ChooseRequest(BaseModel):
    policy_run_id: str
    candidate_id: str | None = None
    idempotency_key: str


class CandidateScoreOut(BaseModel):
    candidate_id: str
    label: str
    s_u: float | None
    s_c: float | None
    delta: float | None
    s_guided: float | None
    feasible: bool
    infeasibility_reason: str | None = None
    rubric_u: dict[str, float] | None = None
    rubric_c: dict[str, float] | None = None


class PolicyRunOut(BaseModel):
    id: str
    snapshot_id: str
    project_id: str
    w: float
    selected_candidate_id: str | None
    selected_label: str | None = None
    scores: list[CandidateScoreOut]
    status: str
    fallback_reason: str | None = None
    computed_at: datetime


class ChooseResult(BaseModel):
    policy_run_id: str
    selected_candidate_id: str
    status: str
    idempotency_key: str
