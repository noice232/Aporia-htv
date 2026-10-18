from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class DisagreementOut(BaseModel):
    id: str
    claim_ids: list[str]
    status: str
    discriminating_experiment_json: str | None
    resolution: str | None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OpenDisputeRequest(BaseModel):
    claim_ids: list[str] = Field(..., min_length=2, max_length=2)
    notes: str | None = None


class TestDisagreementRequest(BaseModel):
    experiment_spec_id: str | None = None
    approved: bool | None = None


class InvalidateRequest(BaseModel):
    evidence_refs: list[str]
    reason: str = Field(..., min_length=1)


class InvalidateResult(BaseModel):
    claim_id: str
    status: str
    affected_frontier_nodes: int
