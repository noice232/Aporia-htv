from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel

from app.schemas.projects import ProjectOut


class PatchProject(BaseModel):
    title: str | None = None
    objective: str | None = None
    status: str | None = None


class ProjectStateOut(BaseModel):
    project: ProjectOut
    run_count: int
    event_count: int
    frontier_node_count: int
    plan_count: int
    claim_count: int
    status: str


class GraphNode(BaseModel):
    id: str
    label: str
    type: Literal["paper", "claim", "question", "method", "blocker"]
    cluster: str | None = None
    position: tuple[float, float, float]
    color: tuple[float, float, float]
    size: float
    metadata: dict[str, Any] | None = None
    status: str | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: Literal["citation", "dependency", "evidence", "contradiction"]
    weight: float
    relationship: str | None = None


class GraphOut(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
