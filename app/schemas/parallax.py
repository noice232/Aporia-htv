from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CreateClaim(BaseModel):
    text: str = Field(..., min_length=1)
    claim_type: str = Field(..., pattern="^(observation|hypothesis|conclusion)$")
    confidence: float = Field(0.5, ge=0.0, le=1.0)
    source_node_id: str | None = None


class ClaimOut(BaseModel):
    id: str
    project_id: str
    text: str
    claim_type: str
    status: str
    confidence: float
    source_node_id: str | None
    created_at: datetime
    evidence: list["EvidenceOut"] = []

    model_config = {"from_attributes": True}


class CreateEvidence(BaseModel):
    evidence_type: str = Field(..., pattern="^(supports|contradicts)$")
    run_id: str | None = None
    description: str = Field(..., min_length=1)
    strength: float = Field(0.5, ge=0.0, le=1.0)
    data_mode: str = "measured"


class EvidenceOut(BaseModel):
    id: str
    claim_id: str
    evidence_type: str
    run_id: str | None
    description: str
    strength: float
    data_mode: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateDispute(BaseModel):
    claim_a_id: str
    claim_b_id: str


class ResolveDispute(BaseModel):
    resolution: str = Field(..., pattern="^(a_wins|b_wins|both_wrong|merged)$")


class DisputeOut(BaseModel):
    id: str
    project_id: str
    claim_a_id: str
    claim_b_id: str
    status: str
    resolution: str | None
    discriminating_experiment_json: str | None
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}
