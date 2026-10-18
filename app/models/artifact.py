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


class ArtifactBlob(Base):
    __tablename__ = "artifact_blobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    run_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("experiment_runs.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(32))
    label: Mapped[str] = mapped_column(String(256))
    content_hash: Mapped[str] = mapped_column(String(64))
    content_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    mime_type: Mapped[str] = mapped_column(String(128), default="application/json")
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ExperimentSpec(Base):
    __tablename__ = "experiment_specs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    plan_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    hypothesis_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    evaluator_version: Mapped[str] = mapped_column(String(64))
    parameters_json: Mapped[str] = mapped_column(Text, default="{}")
    dataset_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    code_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
