from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


Phase = Literal["scan", "hypothesize", "experiment", "evaluate", "plan"]
FeedbackAction = Literal["approve", "reject", "redirect", "refine"]


class ResearchStepOut(BaseModel):
    id: str
    project_id: str
    phase: Phase
    content: str
    evidence: list[str]
    confidence: float
    created_at: datetime
    parent_step_id: str | None
    human_influenced: bool
    data_mode: Literal["mock"] = "mock"


class ResearchStartOut(BaseModel):
    project_id: str
    state: str
    steps: list[ResearchStepOut]
    experiment_id: str | None


class FeedbackIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    action: FeedbackAction


class FeedbackOut(BaseModel):
    id: str
    step_id: str
    response_step_id: str
    text: str
    action: FeedbackAction
    created_at: datetime


class FeedbackResult(BaseModel):
    feedback: FeedbackOut
    step: ResearchStepOut


class ComparisonCandidate(BaseModel):
    candidate_id: str
    label: str
    score: float
    rank: int
    s_u: float
    s_c: float
    s_guided: float


class ComparisonBranch(BaseModel):
    candidates: list[ComparisonCandidate]
    w: float | None = None


class ComparisonDiff(BaseModel):
    candidate_id: str
    cfg_rank: int
    no_cfg_rank: int
    rank_delta: int
    score_delta: float


class PolicyComparisonOut(BaseModel):
    with_cfg: ComparisonBranch
    without_cfg: ComparisonBranch
    diff: list[ComparisonDiff]
    data_mode: Literal["mock"] = "mock"


class PaperSearchIn(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    semantic: bool = True
    limit: int = Field(default=10, ge=1, le=50)


class PaperResult(BaseModel):
    id: str
    title: str
    authors: list[str]
    venue: str
    year: int
    abstract: str
    relevance_score: float
    cluster: str
    data_mode: Literal["mock"] = "mock"


class PaperRetrieveIn(BaseModel):
    paper_ids: list[str] = Field(min_length=1, max_length=50)


class PaperDetail(PaperResult):
    claims: list[str]
    methods: list[str]
    findings: list[str]


class ExperimentIn(BaseModel):
    hypothesis: str = Field(min_length=1, max_length=4000)
    method: str = Field(min_length=1, max_length=4000)
    config: dict[str, Any] = Field(default_factory=dict)


class ExperimentResults(BaseModel):
    metrics: dict[str, Any]
    findings: list[str]
    artifacts: list[dict[str, Any]]


class ExperimentEvaluation(BaseModel):
    score: float
    explanation: str
    next_steps: list[str]


class HumanEvaluation(BaseModel):
    override_score: float
    notes: str
    redirect: str | None = None


class ExperimentOut(BaseModel):
    id: str
    project_id: str
    hypothesis: str
    method: str
    config: dict[str, Any]
    status: str
    results: ExperimentResults | None
    evaluation: ExperimentEvaluation | None
    human_evaluation: HumanEvaluation | None = None
    created_at: datetime
    updated_at: datetime
    data_mode: Literal["mock"] = "mock"


class EvaluateIn(BaseModel):
    score: float = Field(ge=0, le=1)
    notes: str = Field(min_length=1, max_length=4000)
    redirect: str | None = Field(default=None, max_length=4000)


class TimelineEntry(BaseModel):
    id: str
    type: str
    timestamp: datetime
    title: str
    description: str
    human_involved: bool
    metadata: dict[str, Any]


class DemoSeedOut(BaseModel):
    project_id: str
    title: str
    research_step_count: int
    experiment_id: str
    timeline_count: int
    data_mode: Literal["mock"] = "mock"
