from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CompilePlanRequest(BaseModel):
    goal_text: str = Field(..., min_length=1)


class UpdatePlanRequest(BaseModel):
    objective: str | None = None
    variables_json: str | None = None
    metrics_json: str | None = None
    success_criteria_json: str | None = None
    constraints_json: str | None = None


class HypothesisOut(BaseModel):
    id: str
    plan_id: str
    text: str
    rationale: str | None
    status: str
    sequence: int

    model_config = {"from_attributes": True}


class ProtocolOut(BaseModel):
    id: str
    plan_id: str
    hypothesis_id: str | None
    description: str
    evaluator_config_json: str | None
    sequence: int

    model_config = {"from_attributes": True}


class PlanOut(BaseModel):
    id: str
    project_id: str
    status: str
    objective: str
    variables_json: str
    metrics_json: str
    success_criteria_json: str
    constraints_json: str
    version: int
    model_provider: str | None
    model_id: str | None
    created_at: datetime
    updated_at: datetime
    hypotheses: list[HypothesisOut] = []
    protocols: list[ProtocolOut] = []

    model_config = {"from_attributes": True}


class PlanSummaryOut(BaseModel):
    id: str
    project_id: str
    status: str
    objective: str
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PlanVersionOut(BaseModel):
    id: str
    plan_id: str
    version: int
    snapshot_json: str
    change_summary: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
