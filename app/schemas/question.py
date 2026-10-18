from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreateQuestion(BaseModel):
    prompt: str
    reason_for_asking: str | None = None
    options_json: str | None = None


class QuestionOut(BaseModel):
    id: str
    project_id: str
    prompt: str
    reason_for_asking: str | None = None
    options_json: str | None = None
    status: str
    evidence_refs_json: str | None = None
    routed_to: str | None = None
    answer_text: str | None = None
    answer_choice: str | None = None
    answered_at: datetime | None = None
    created_at: datetime


class AnswerRequest(BaseModel):
    choice: str | None = None
    rationale: str


class ExpertRequest(BaseModel):
    researcher_id: str
    question_id: str
