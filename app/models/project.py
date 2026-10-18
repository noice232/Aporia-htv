from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(256))
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="created")
    research_state: Mapped[str] = mapped_column(String(32), default="idle")
    workspace_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("workspaces.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ExperimentRun(Base):
    __tablename__ = "experiment_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    evaluator_version: Mapped[str] = mapped_column(String(64))
    seed: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32), default="queued")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    parameters_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    experiment_spec_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("experiment_specs.id"), nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)


class ResearchEvent(Base):
    __tablename__ = "research_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    sequence: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    correlation_id: Mapped[str] = mapped_column(String(36), default=_uuid)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)


class AgendaItem(Base):
    __tablename__ = "agenda_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="queued")
    priority: Mapped[float] = mapped_column(Float, default=1.0)
    blocked_parent_node_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    originating_run_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("experiment_runs.id"), nullable=True)
    originating_event_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("research_events.id"), nullable=True)
    dedup_key: Mapped[str | None] = mapped_column(String(256), nullable=True, unique=True)
    completion_criteria_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    model_provider: Mapped[str | None] = mapped_column(String(32), nullable=True)
    model_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    generation_prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generation_completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    generation_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
