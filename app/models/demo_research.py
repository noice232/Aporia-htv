from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.project import _utcnow, _uuid


class ResearchStep(Base):
    __tablename__ = "research_steps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    phase: Mapped[str] = mapped_column(String(32))
    content: Mapped[str] = mapped_column(Text)
    evidence_json: Mapped[str] = mapped_column(Text, default="[]")
    confidence: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    parent_step_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("research_steps.id"), nullable=True
    )
    human_influenced: Mapped[bool] = mapped_column(Boolean, default=False)


class ResearchFeedback(Base):
    __tablename__ = "research_feedback"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    step_id: Mapped[str] = mapped_column(String(36), ForeignKey("research_steps.id"))
    response_step_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("research_steps.id"), nullable=True
    )
    text: Mapped[str] = mapped_column(Text)
    action: Mapped[str] = mapped_column(String(16))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class DemoExperiment(Base):
    __tablename__ = "demo_experiments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    hypothesis: Mapped[str] = mapped_column(Text)
    method: Mapped[str] = mapped_column(Text)
    config_json: Mapped[str] = mapped_column(Text, default="{}")
    status: Mapped[str] = mapped_column(String(32), default="queued")
    results_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluation_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    human_evaluation_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
