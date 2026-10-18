from __future__ import annotations

from datetime import datetime
from typing import Any

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
    type: str
    status: str


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str


class GraphOut(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
