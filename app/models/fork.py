from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ResearchFork(Base):
    __tablename__ = "research_forks"

    id = Column(String(36), primary_key=True, default=_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)

    checkpoint_snapshot_id = Column(String(36), ForeignKey("policy_snapshots.id"), nullable=False)
    policy_run_id_unguided = Column(String(36), ForeignKey("policy_runs.id"), nullable=False)
    policy_run_id_guided = Column(String(36), ForeignKey("policy_runs.id"), nullable=False)

    candidate_id_unguided = Column(String(36), nullable=False)
    candidate_id_guided = Column(String(36), nullable=False)
    w_unguided = Column(Float, nullable=False)
    w_guided = Column(Float, nullable=False)

    run_id_unguided = Column(String(36), ForeignKey("experiment_runs.id"), nullable=True)
    run_id_guided = Column(String(36), ForeignKey("experiment_runs.id"), nullable=True)

    shared_evaluator_version = Column(String(64), nullable=False)
    shared_dataset_hash = Column(String(64), nullable=False)
    shared_budget = Column(String(64), nullable=True)

    coverage_unguided = Column(Float, nullable=True)
    coverage_guided = Column(Float, nullable=True)
    coverage_delta = Column(Float, nullable=True)
    winner = Column(String(32), nullable=True)

    comparison_status = Column(String(32), nullable=False, default="pending")
    limitations_json = Column(Text, nullable=True)

    idempotency_key = Column(String(128), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utc_now)
