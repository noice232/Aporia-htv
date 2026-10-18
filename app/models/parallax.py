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


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    claim_type: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="proposed")
    confidence: Mapped[float] = mapped_column(Float, default=0.5)
    source_node_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("frontier_nodes.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ClaimEvidence(Base):
    __tablename__ = "claim_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    claim_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"), index=True)
    evidence_type: Mapped[str] = mapped_column(String(32))
    run_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("experiment_runs.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    strength: Mapped[float] = mapped_column(Float, default=0.5)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class Dispute(Base):
    __tablename__ = "disputes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    claim_a_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"))
    claim_b_id: Mapped[str] = mapped_column(String(36), ForeignKey("claims.id"))
    status: Mapped[str] = mapped_column(String(32), default="open")
    resolution: Mapped[str | None] = mapped_column(String(32), nullable=True)
    discriminating_experiment_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
