from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreateLesson(BaseModel):
    title: str
    statement: str
    evidence_run_ids_json: str | None = None
    workspace_id: str | None = None


class LessonOut(BaseModel):
    id: str
    workspace_id: str | None
    title: str
    statement: str
    evidence_run_ids_json: str | None
    version: int
    review_state: str
    reviewer_id: str | None
    reviewer_comment: str | None
    access_scope: str
    transfer_tests_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewLesson(BaseModel):
    approved: bool
    comment: str | None = None


class TransferLesson(BaseModel):
    target_project_id: str
    experiment_spec_id: str | None = None
