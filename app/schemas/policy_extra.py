from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ChooseActionRequest(BaseModel):
    policy_run_id: str
    chosen_action: str


class PolicyRunOut(BaseModel):
    id: str
    snapshot_id: str
    project_id: str
    w: float
    selected_candidate_id: str | None
    fallback_reason: str | None = None
    status: str
    computed_at: datetime

    model_config = {"from_attributes": True}


class CreateSnapshotRequest(BaseModel):
    label: str | None = None


class SnapshotOut(BaseModel):
    id: str
    project_id: str
    candidate_set_hash: str
    candidate_ids_json: str
    rubric_version: str
    constraints_hash: str
    human_context_json: str | None
    conditioned_context_status: str
    model_provider: str | None
    model_id: str | None
    prompt_template_version: str | None
    calibration_version: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class HypothesisOut(BaseModel):
    id: str
    plan_id: str
    text: str
    status: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


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


class ProposeExperimentRequest(BaseModel):
    plan_id: str | None = None
    hypothesis_id: str | None = None
    evaluator_version: str
    parameters_json: str = "{}"
    dataset_hash: str | None = None
