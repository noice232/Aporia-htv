from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CreateStrategy(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None
    parameters_json: str | None = None
    status: str = Field("active", pattern="^(active|archived|testing)$")


class UpdateStrategy(BaseModel):
    name: str | None = None
    description: str | None = None
    parameters_json: str | None = None
    status: str | None = Field(None, pattern="^(active|archived|testing)$")


class StrategyOut(BaseModel):
    id: str
    project_id: str
    name: str
    description: str | None
    parameters_json: str | None
    version: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StrategyVersionOut(BaseModel):
    id: str
    strategy_id: str
    version: int
    parameters_snapshot_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CompareRequest(BaseModel):
    strategy_a_id: str
    strategy_b_id: str
    metric_name: str = "overall_score"


class ComparisonOut(BaseModel):
    id: str
    project_id: str
    strategy_a_id: str
    strategy_b_id: str
    metric_name: str
    value_a: float
    value_b: float
    winner: str | None
    confidence: float
    suggestion: str | None
    data_mode: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgendaPriorityOut(BaseModel):
    id: str
    project_id: str
    agenda_item_id: str
    strategy_id: str | None
    rank: int
    score: float
    rationale: str | None
    computed_at: datetime

    model_config = {"from_attributes": True}


class SuggestNextRequest(BaseModel):
    strategy_id: str | None = None


class SuggestionOut(BaseModel):
    suggestion: str
    confidence: float
    agenda_item_id: str | None
    rationale: str
