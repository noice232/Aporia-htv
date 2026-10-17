from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ForkRequest(BaseModel):
    w: float = Field(..., ge=0.0, le=10.0)
    idempotency_key: str | None = None


class BranchOut(BaseModel):
    candidate_id: str
    candidate_label: str
    run_id: str | None
    coverage_fraction: float | None
    visible_count: int | None
    total_count: int | None
    status: str


class ComparisonOut(BaseModel):
    coverage_delta: float | None
    winner: str | None
    status: str
    confounds: list[str]
    limitations: list[str]


class ForkOut(BaseModel):
    id: str
    project_id: str
    checkpoint_snapshot_id: str
    w_unguided: float
    w_guided: float
    branch_unguided: BranchOut
    branch_guided: BranchOut
    comparison: ComparisonOut
    shared_evaluator_version: str
    shared_dataset_hash: str
    shared_budget: str | None
    created_at: datetime


class ForkSummaryOut(BaseModel):
    id: str
    project_id: str
    candidate_id_unguided: str
    candidate_id_guided: str
    w_guided: float
    winner: str | None
    comparison_status: str
    created_at: datetime
