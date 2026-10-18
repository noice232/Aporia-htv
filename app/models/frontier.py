from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


NODE_TYPES = (
    "paper", "objective", "problem", "hypothesis",
    "method", "run", "claim", "evidence",
    "human_judgment", "skill",
)

EDGE_TYPES = (
    "depends_on", "blocks", "supports", "contradicts",
    "derived_from", "tests", "produces", "requires_skill",
)


class FrontierNode(Base):
    __tablename__ = "frontier_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    node_type: Mapped[str] = mapped_column(String(32))
    label: Mapped[str] = mapped_column(String(512))
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    priority: Mapped[float] = mapped_column(Float, default=1.0)
    threshold_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    measured_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    parent_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("frontier_nodes.id"), nullable=True)
    data_mode: Mapped[str] = mapped_column(String(32), default="measured")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FrontierEdge(Base):
    __tablename__ = "frontier_edges"
    __table_args__ = (
        UniqueConstraint("source_node_id", "target_node_id", "edge_type", name="uq_edge"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    source_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("frontier_nodes.id"))
    target_node_id: Mapped[str] = mapped_column(String(36), ForeignKey("frontier_nodes.id"))
    edge_type: Mapped[str] = mapped_column(String(32))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
