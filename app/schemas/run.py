from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class StartRunRequest(BaseModel):
    experiment_spec_id: str
    idempotency_key: str | None = None
    parameters_json: str | None = None


class RunOut(BaseModel):
    id: str
    project_id: str
    experiment_spec_id: str | None
    evaluator_version: str
    seed: int
    status: str
    started_at: datetime | None
    ended_at: datetime | None
    metrics_json: str | None
    parameters_json: str | None
    cancel_reason: str | None
    data_mode: str

    model_config = {"from_attributes": True}


class CancelRequest(BaseModel):
    reason: str | None = None


class ResearchStatusOut(BaseModel):
    project_id: str
    state: str
    active_run_count: int
    last_event_sequence: int


class ResearchControlRequest(BaseModel):
    action: str
    idempotency_key: str | None = None


class ResearchControlOut(BaseModel):
    project_id: str
    new_state: str
    affected_runs: int
