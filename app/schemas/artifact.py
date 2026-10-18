from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CreateArtifact(BaseModel):
    run_id: str | None = None
    kind: str = Field(..., pattern="^(metric_json|image|log|config|checkpoint)$")
    label: str = Field(..., min_length=1, max_length=256)
    content_json: str | None = None
    mime_type: str = "application/json"
    data_mode: str = "measured"


class ArtifactOut(BaseModel):
    id: str
    project_id: str
    run_id: str | None
    kind: str
    label: str
    content_hash: str
    content_json: str | None
    size_bytes: int
    mime_type: str
    data_mode: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateExperimentSpec(BaseModel):
    plan_id: str | None = None
    hypothesis_id: str | None = None
    evaluator_version: str
    parameters_json: str = "{}"
    dataset_hash: str | None = None
    code_hash: str | None = None


class ExperimentSpecOut(BaseModel):
    id: str
    project_id: str
    plan_id: str | None
    hypothesis_id: str | None
    evaluator_version: str
    parameters_json: str
    dataset_hash: str | None
    code_hash: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
