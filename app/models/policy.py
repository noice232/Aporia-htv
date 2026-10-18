from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.project import _utcnow, _uuid


class PolicySnapshot(Base):
    __tablename__ = "policy_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    candidate_set_hash: Mapped[str] = mapped_column(String(64))
    candidate_ids_json: Mapped[str] = mapped_column(Text)
    rubric_version: Mapped[str] = mapped_column(String(32), default="1.0")
    constraints_hash: Mapped[str] = mapped_column(String(64))
    human_context_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    conditioned_context_status: Mapped[str] = mapped_column(String(32), default="missing")
    model_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    model_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prompt_template_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    calibration_version: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    policy_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("policy_runs.id"), index=True)
    candidate_id: Mapped[str] = mapped_column(String(36))
    s_unconditioned: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_conditioned: Mapped[float | None] = mapped_column(Float, nullable=True)
    delta: Mapped[float | None] = mapped_column(Float, nullable=True)
    s_guided: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight: Mapped[float] = mapped_column(Float)
    rubric_scores_u_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    rubric_scores_c_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    feasibility: Mapped[bool] = mapped_column(Boolean, default=True)
    infeasibility_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    scoring_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    scoring_model_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    rationale_u_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    rationale_c_json: Mapped[str | None] = mapped_column(Text, nullable=True)


class PolicyRun(Base):
    __tablename__ = "policy_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    snapshot_id: Mapped[str] = mapped_column(String(36), ForeignKey("policy_snapshots.id"))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    w: Mapped[float] = mapped_column(Float)
    selected_candidate_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    fallback_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    status: Mapped[str] = mapped_column(String(32), default="scored")
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
