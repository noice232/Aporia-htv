from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CreateNode(BaseModel):
    node_type: str = Field(..., pattern="^(paper|objective|problem|hypothesis|method|run|claim|evidence|human_judgment|skill)$")
    label: str = Field(..., min_length=1, max_length=512)
    detail: str | None = None
    status: str = Field("open", pattern="^(open|active|blocked|completed|verified)$")
    priority: float = Field(1.0, ge=0.0)
    threshold_json: str | None = None
    measured_json: str | None = None
    entity_id: str | None = None
    parent_id: str | None = None
    data_mode: str = "measured"


class UpdateNode(BaseModel):
    label: str | None = None
    detail: str | None = None
    status: str | None = Field(None, pattern="^(open|active|blocked|completed|verified)$")
    priority: float | None = Field(None, ge=0.0)
    threshold_json: str | None = None
    measured_json: str | None = None


class NodeOut(BaseModel):
    id: str
    project_id: str
    node_type: str
    label: str
    detail: str | None
    status: str
    priority: float
    threshold_json: str | None
    measured_json: str | None
    entity_id: str | None
    parent_id: str | None
    data_mode: str
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class CreateEdge(BaseModel):
    source_node_id: str
    target_node_id: str
    edge_type: str = Field(..., pattern="^(depends_on|blocks|supports|contradicts|derived_from|tests|produces|requires_skill)$")
    weight: float = Field(1.0, ge=0.0)
    metadata_json: str | None = None


class EdgeOut(BaseModel):
    id: str
    project_id: str
    source_node_id: str
    target_node_id: str
    edge_type: str
    weight: float
    metadata_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubgraphOut(BaseModel):
    nodes: list[NodeOut]
    edges: list[EdgeOut]


class BlockerDetectionOut(BaseModel):
    blocked_nodes: list[NodeOut]
    children_created: list[NodeOut]
