from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    session_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("research_sessions.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(Text)
    evidence_summary: Mapped[str] = mapped_column(Text, default="")
    source_step_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("session_steps.id"), nullable=True
    )
    source_run_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("experiment_runs.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), default="candidate")
    domain: Mapped[str | None] = mapped_column(String(128), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.5)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    promoted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SkillReview(Base):
    __tablename__ = "skill_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidate_skills.id"), index=True)
    reviewer: Mapped[str] = mapped_column(String(32))
    verdict: Mapped[str] = mapped_column(String(32))
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
