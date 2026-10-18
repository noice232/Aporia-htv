from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.mock_graph import mock_graph
from app.models.frontier import FrontierNode
from app.models.project import Project, ResearchEvent

router = APIRouter(prefix="/api/v1", tags=["sse"])


def _ensure_demo_graph_events(db: Session, project_id: str, commit: bool = True) -> None:
    """Record each demo event once so SSE and polling share stable sequences."""
    if db.query(FrontierNode.id).filter(FrontierNode.project_id == project_id).first():
        return
    existing = db.query(ResearchEvent.id).filter(
        ResearchEvent.project_id == project_id,
        ResearchEvent.idempotency_key == f"demo-graph:{project_id}:node_added",
    ).first()
    if existing:
        return

    graph = mock_graph(project_id)
    edge = graph.edges[0]
    node = next(node for node in graph.nodes if node.id == edge.source)
    demo_events = (
        ("node_added", node.id, {"node": node.model_dump(mode="json")}),
        ("edge_added", edge.id, {"edge": edge.model_dump(mode="json")}),
        ("cluster_updated", node.id, {
            "node_id": node.id,
            "cluster": node.cluster,
            "previous_cluster": None,
        }),
    )
    current = db.query(func.max(ResearchEvent.sequence)).filter(
        ResearchEvent.project_id == project_id
    ).scalar() or 0
    for index, (event_type, entity_id, payload) in enumerate(demo_events, start=1):
        db.add(ResearchEvent(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"aporia:{project_id}:demo-event:{event_type}")),
            project_id=project_id,
            sequence=current + index,
            type=event_type,
            entity_id=entity_id,
            payload_json=json.dumps(payload),
            data_mode="mock",
            idempotency_key=f"demo-graph:{project_id}:{event_type}",
        ))
    if commit:
        db.commit()
    else:
        db.flush()


def _event_generator(db: Session, project_id: str, after: int):
    rows = (
        db.query(ResearchEvent)
        .filter(ResearchEvent.project_id == project_id, ResearchEvent.sequence > after)
        .order_by(ResearchEvent.sequence)
        .all()
    )
    for evt in rows:
        data = {
            "id": evt.id,
            "sequence": evt.sequence,
            "type": evt.type,
            "entity_id": evt.entity_id,
            "payload": json.loads(evt.payload_json) if evt.payload_json else None,
            "data_mode": evt.data_mode,
            "occurred_at": evt.occurred_at.isoformat(),
        }
        yield f"data: {json.dumps(data)}\n\n"


@router.get("/projects/{project_id}/stream")
def stream_events(
    project_id: str,
    after: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    _ensure_demo_graph_events(db, project_id)
    return StreamingResponse(
        _event_generator(db, project_id, after),
        media_type="text/event-stream",
    )
