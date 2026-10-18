from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.frontier import (
    check_unblock,
    compute_priority,
    create_edge,
    create_node,
    detect_blockers,
    get_subgraph,
)
from app.models.frontier import FrontierNode
from app.schemas.frontier import (
    BlockerDetectionOut,
    CreateEdge,
    CreateNode,
    EdgeOut,
    NodeOut,
    SubgraphOut,
    UpdateNode,
)

router = APIRouter(prefix="/api/v1", tags=["frontier"])


@router.post("/projects/{project_id}/frontier/nodes", response_model=NodeOut, status_code=201)
def post_node(project_id: str, body: CreateNode, db: Session = Depends(get_db)):
    try:
        result = create_node(
            db, project_id, body.node_type, body.label,
            detail=body.detail, status=body.status, priority=body.priority,
            threshold_json=body.threshold_json, measured_json=body.measured_json,
            entity_id=body.entity_id, parent_id=body.parent_id,
            data_mode=body.data_mode,
        )
        db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/projects/{project_id}/frontier/nodes", response_model=list[NodeOut])
def list_nodes(
    project_id: str,
    node_type: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(FrontierNode).filter(FrontierNode.project_id == project_id)
    if node_type:
        q = q.filter(FrontierNode.node_type == node_type)
    if status:
        q = q.filter(FrontierNode.status == status)
    return q.order_by(FrontierNode.priority.desc()).all()


@router.get("/projects/{project_id}/frontier/nodes/{node_id}", response_model=NodeOut)
def get_node(project_id: str, node_id: str, db: Session = Depends(get_db)):
    node = db.query(FrontierNode).filter(
        FrontierNode.id == node_id,
        FrontierNode.project_id == project_id,
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.put("/projects/{project_id}/frontier/nodes/{node_id}", response_model=NodeOut)
def update_node(project_id: str, node_id: str, body: UpdateNode, db: Session = Depends(get_db)):
    node = db.query(FrontierNode).filter(
        FrontierNode.id == node_id,
        FrontierNode.project_id == project_id,
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(node, field, val)
    db.commit()
    return node


@router.post("/projects/{project_id}/frontier/edges", response_model=EdgeOut, status_code=201)
def post_edge(project_id: str, body: CreateEdge, db: Session = Depends(get_db)):
    try:
        result = create_edge(
            db, project_id, body.source_node_id, body.target_node_id,
            body.edge_type, weight=body.weight, metadata_json=body.metadata_json,
        )
        db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/projects/{project_id}/frontier/edges", response_model=list[EdgeOut])
def list_edges(project_id: str, db: Session = Depends(get_db)):
    from app.models.frontier import FrontierEdge
    return db.query(FrontierEdge).filter(FrontierEdge.project_id == project_id).all()


@router.post("/projects/{project_id}/frontier/detect-blockers", response_model=BlockerDetectionOut)
def post_detect_blockers(project_id: str, db: Session = Depends(get_db)):
    result = detect_blockers(db, project_id)
    db.commit()
    return result


@router.get("/projects/{project_id}/frontier/subgraph", response_model=SubgraphOut)
def get_subgraph_endpoint(
    project_id: str,
    root_id: str | None = None,
    depth: int = 3,
    db: Session = Depends(get_db),
):
    return get_subgraph(db, project_id, root_id=root_id, depth=depth)


@router.post("/projects/{project_id}/frontier/nodes/{node_id}/complete", response_model=NodeOut)
def complete_node(project_id: str, node_id: str, db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    node = db.query(FrontierNode).filter(
        FrontierNode.id == node_id,
        FrontierNode.project_id == project_id,
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    node.status = "completed"
    node.completed_at = datetime.now(timezone.utc)
    db.flush()

    check_unblock(db, project_id, node_id)
    db.commit()

    updated = compute_priority(db, project_id, node_id)
    node.priority = updated
    db.commit()
    return node
