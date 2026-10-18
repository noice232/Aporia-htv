from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


DataMode = Literal["measured", "replay", "planned"]
StepStatus = Literal["planned", "running", "completed", "blocked", "needs_human"]
EvidenceStatus = Literal["missing", "provided"]


class CreateSession(BaseModel):
    title: str = Field(min_length=1, max_length=256)
    goal: str = Field(min_length=1)
    domain: str | None = Field(default=None, max_length=128)
    project_id: str | None = None


class SessionSummary(BaseModel):
    id: str
    project_id: str | None
    title: str
    goal: str
    domain: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class CreateStep(BaseModel):
    kind: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=256)
    detail: str | None = None
    status: StepStatus = "planned"
    data_mode: DataMode = "planned"
    evidence_status: EvidenceStatus = "missing"
    evidence_reference: str | None = None

    @model_validator(mode="after")
    def validate_provenance(self):
        if self.data_mode == "measured":
            if self.status != "completed":
                raise ValueError("measured steps must be completed")
            if self.evidence_status != "provided" or not (self.evidence_reference or "").strip():
                raise ValueError("measured steps require a provided evidence reference")
        if self.evidence_status == "provided" and not (self.evidence_reference or "").strip():
            raise ValueError("provided evidence requires an evidence reference")
        return self


class StepOut(CreateStep):
    id: str
    session_id: str
    sequence: int
    created_at: datetime


class CreateCheckpoint(BaseModel):
    prompt: str = Field(min_length=1)
    reason: str | None = None


class AnswerCheckpoint(BaseModel):
    answer: str = Field(min_length=1)
    guidance_weight: float | None = Field(default=None, ge=0, le=2)


class CheckpointOut(BaseModel):
    id: str
    session_id: str
    sequence: int
    prompt: str
    reason: str | None
    status: Literal["open", "answered"]
    answer: str | None
    guidance_weight: float | None
    answer_sequence: int | None
    created_at: datetime
    answered_at: datetime | None


class SessionDetail(SessionSummary):
    steps: list[StepOut]
    checkpoints: list[CheckpointOut]
