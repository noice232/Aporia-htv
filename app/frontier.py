from __future__ import annotations

import json
from collections import deque
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.frontier import EDGE_TYPES, NODE_TYPES, FrontierEdge, FrontierNode


def create_node(
    db: Session,
    project_id: str,
    node_type: str,
    label: str,
    **kwargs: Any,
) -> dict[str, Any]:
    if node_type not in NODE_TYPES:
        raise ValueError(f"Invalid node_type: {node_type}")

    node = FrontierNode(
        project_id=project_id,
        node_type=node_type,
        label=label,
        detail=kwargs.get("detail"),
        status=kwargs.get("status", "open"),
        priority=kwargs.get("priority", 1.0),
        threshold_json=kwargs.get("threshold_json"),
        measured_json=kwargs.get("measured_json"),
        entity_id=kwargs.get("entity_id"),
        parent_id=kwargs.get("parent_id"),
        data_mode=kwargs.get("data_mode", "measured"),
    )
    db.add(node)
    db.flush()
    return _node_dict(node)


def create_edge(
    db: Session,
    project_id: str,
    source_node_id: str,
    target_node_id: str,
    edge_type: str,
    weight: float = 1.0,
    metadata_json: str | None = None,
) -> dict[str, Any]:
    if edge_type not in EDGE_TYPES:
        raise ValueError(f"Invalid edge_type: {edge_type}")
    if source_node_id == target_node_id:
        raise ValueError("Self-loops are not allowed")

    src = db.query(FrontierNode).filter(FrontierNode.id == source_node_id).first()
    tgt = db.query(FrontierNode).filter(FrontierNode.id == target_node_id).first()
    if not src or not tgt:
        raise ValueError("Source or target node not found")

    edge = FrontierEdge(
        project_id=project_id,
        source_node_id=source_node_id,
        target_node_id=target_node_id,
        edge_type=edge_type,
        weight=weight,
        metadata_json=metadata_json,
    )
    db.add(edge)
    db.flush()
    return _edge_dict(edge)


def detect_blockers(db: Session, project_id: str) -> dict[str, Any]:
    nodes = db.query(FrontierNode).filter(
        FrontierNode.project_id == project_id,
        FrontierNode.threshold_json.isnot(None),
        FrontierNode.measured_json.isnot(None),
        FrontierNode.status.in_(["open", "active"]),
    ).all()

    blocked: list[dict] = []
    children: list[dict] = []

    for node in nodes:
        threshold = json.loads(node.threshold_json)
        measured = json.loads(node.measured_json)

        is_blocked = False
        for key, target_val in threshold.items():
            actual = measured.get(key, 0.0)
            if actual < target_val:
                is_blocked = True
                break

        if is_blocked:
            node.status = "blocked"
            db.flush()
            blocked.append(_node_dict(node))

            child = FrontierNode(
                project_id=project_id,
                node_type="problem",
                label=f"Investigate: {node.label}",
                detail=f"Parent node blocked — measured values below threshold",
                status="queued" if "queued" in ("open", "active", "blocked", "completed", "verified", "queued") else "open",
                priority=node.priority + 1.0,
                parent_id=node.id,
                data_mode="measured",
            )
            child.status = "open"
            db.add(child)
            db.flush()
            children.append(_node_dict(child))

            create_edge(db, project_id, node.id, child.id, "depends_on")

    return {"blocked_nodes": blocked, "children_created": children}


def compute_priority(db: Session, project_id: str, node_id: str) -> float:
    node = db.query(FrontierNode).filter(FrontierNode.id == node_id).first()
    if not node:
        raise ValueError("Node not found")

    base = node.priority

    parent_edges = db.query(FrontierEdge).filter(
        FrontierEdge.target_node_id == node_id,
        FrontierEdge.edge_type == "depends_on",
    ).all()

    bonus = 0.0
    for edge in parent_edges:
        parent = db.query(FrontierNode).filter(FrontierNode.id == edge.source_node_id).first()
        if parent and parent.status == "blocked":
            bonus += parent.priority * edge.weight * 0.5

    return base + bonus


def check_unblock(db: Session, project_id: str, node_id: str) -> bool:
    parent_edges = db.query(FrontierEdge).filter(
        FrontierEdge.target_node_id == node_id,
        FrontierEdge.edge_type == "depends_on",
    ).all()

    unblocked_any = False
    for edge in parent_edges:
        parent = db.query(FrontierNode).filter(
            FrontierNode.id == edge.source_node_id,
            FrontierNode.status == "blocked",
        ).first()
        if not parent:
            continue

        child_edges = db.query(FrontierEdge).filter(
            FrontierEdge.source_node_id == parent.id,
            FrontierEdge.edge_type == "depends_on",
        ).all()

        all_done = True
        for ce in child_edges:
            child = db.query(FrontierNode).filter(FrontierNode.id == ce.target_node_id).first()
            if child and child.status not in ("completed", "verified"):
                all_done = False
                break

        if all_done:
            parent.status = "active"
            db.flush()
            unblocked_any = True

    return unblocked_any


def get_subgraph(
    db: Session,
    project_id: str,
    root_id: str | None = None,
    depth: int = 3,
) -> dict[str, Any]:
    if root_id:
        node_ids: set[str] = set()
        queue: deque[tuple[str, int]] = deque([(root_id, 0)])
        while queue:
            nid, d = queue.popleft()
            if nid in node_ids or d > depth:
                continue
            node_ids.add(nid)
            edges = db.query(FrontierEdge).filter(
                FrontierEdge.project_id == project_id,
                (FrontierEdge.source_node_id == nid) | (FrontierEdge.target_node_id == nid),
            ).all()
            for e in edges:
                neighbor = e.target_node_id if e.source_node_id == nid else e.source_node_id
                if neighbor not in node_ids:
                    queue.append((neighbor, d + 1))

        nodes = db.query(FrontierNode).filter(FrontierNode.id.in_(node_ids)).all()
        edges = db.query(FrontierEdge).filter(
            FrontierEdge.project_id == project_id,
            FrontierEdge.source_node_id.in_(node_ids),
            FrontierEdge.target_node_id.in_(node_ids),
        ).all()
    else:
        nodes = db.query(FrontierNode).filter(FrontierNode.project_id == project_id).all()
        edges = db.query(FrontierEdge).filter(FrontierEdge.project_id == project_id).all()

    return {
        "nodes": [_node_dict(n) for n in nodes],
        "edges": [_edge_dict(e) for e in edges],
    }


def _node_dict(node: FrontierNode) -> dict[str, Any]:
    return {
        "id": node.id,
        "project_id": node.project_id,
        "node_type": node.node_type,
        "label": node.label,
        "detail": node.detail,
        "status": node.status,
        "priority": node.priority,
        "threshold_json": node.threshold_json,
        "measured_json": node.measured_json,
        "entity_id": node.entity_id,
        "parent_id": node.parent_id,
        "data_mode": node.data_mode,
        "created_at": node.created_at,
        "completed_at": node.completed_at,
    }


def _edge_dict(edge: FrontierEdge) -> dict[str, Any]:
    return {
        "id": edge.id,
        "project_id": edge.project_id,
        "source_node_id": edge.source_node_id,
        "target_node_id": edge.target_node_id,
        "edge_type": edge.edge_type,
        "weight": edge.weight,
        "metadata_json": edge.metadata_json,
        "created_at": edge.created_at,
    }
