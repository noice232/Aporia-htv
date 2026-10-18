from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ExtractSkill(BaseModel):
    source_step_id: str | None = None
    source_run_id: str | None = None
    session_id: str | None = None
    title: str | None = None
    description: str | None = None
    domain: str | None = None


class SubmitReview(BaseModel):
    reviewer: str = Field(..., pattern="^(human|agent)$")
    verdict: str = Field(..., pattern="^(approve|reject|needs_revision)$")
    comment: str = ""


class ReviewOut(BaseModel):
    id: str
    skill_id: str
    reviewer: str
    verdict: str
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SkillOut(BaseModel):
    id: str
    project_id: str
    session_id: str | None
    title: str
    description: str
    evidence_summary: str
    source_step_id: str | None
    source_run_id: str | None
    status: str
    domain: str | None
    confidence: float
    data_mode: str
    created_at: datetime
    promoted_at: datetime | None
    reviews: list[ReviewOut] = []

    model_config = {"from_attributes": True}
