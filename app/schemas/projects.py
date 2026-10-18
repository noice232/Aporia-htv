from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CreateProject(BaseModel):
    title: str
    objective: str | None = None


class ProjectOut(BaseModel):
    id: str
    title: str
    objective: str | None
    status: str
    created_at: datetime


class SubmitGoal(BaseModel):
    threshold: float = Field(ge=0.0, le=1.0)
    seed: int = 42


class RunSummary(BaseModel):
    id: str
    evaluator_version: str
    seed: int
    status: str
    coverage_fraction: float | None
    parameters_json: dict[str, Any] | None = None
    started_at: datetime | None
    ended_at: datetime | None


class GoalResult(BaseModel):
    project_id: str
    runs: list[RunSummary]
    best_coverage: float
    threshold_met: bool
    agenda_item_id: str | None = None


class EventOut(BaseModel):
    id: str
    sequence: int
    type: str
    entity_id: str | None
    payload: dict[str, Any] | None
    data_mode: str
    occurred_at: datetime


class EventPage(BaseModel):
    events: list[EventOut]
    next_sequence: int | None


class AgendaItemOut(BaseModel):
    id: str
    project_id: str
    question: str
    status: str
    priority: float
    originating_run_id: str | None
    originating_event_id: str | None
    dedup_key: str | None
    created_at: datetime
