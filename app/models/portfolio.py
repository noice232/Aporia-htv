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


class PortfolioStrategy(Base):
    __tablename__ = "portfolio_strategies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parameters_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(32), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class StrategyVersion(Base):
    __tablename__ = "strategy_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    strategy_id: Mapped[str] = mapped_column(String(36), ForeignKey("portfolio_strategies.id"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    parameters_snapshot_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class PortfolioComparison(Base):
    __tablename__ = "portfolio_comparisons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    strategy_a_id: Mapped[str] = mapped_column(String(36), ForeignKey("portfolio_strategies.id"))
    strategy_b_id: Mapped[str] = mapped_column(String(36), ForeignKey("portfolio_strategies.id"))
    metric_name: Mapped[str] = mapped_column(String(128))
    value_a: Mapped[float] = mapped_column(Float)
    value_b: Mapped[float] = mapped_column(Float)
    winner: Mapped[str | None] = mapped_column(String(8), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class AgendaPriority(Base):
    __tablename__ = "agenda_priorities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    agenda_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("agenda_items.id"))
    strategy_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("portfolio_strategies.id"), nullable=True)
    rank: Mapped[int] = mapped_column(Integer)
    score: Mapped[float] = mapped_column(Float)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
