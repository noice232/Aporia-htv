from __future__ import annotations

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.mock_graph import mock_graph
from app.models.artifact import ExperimentSpec
from app.models.frontier import FrontierEdge, FrontierNode
from app.models.parallax import Claim
from app.models.plan import PlanHypothesis, ResearchPlan
from app.models.project import ExperimentRun, Project, ResearchEvent
from app.schemas.policy_extra import ExperimentSpecOut, HypothesisOut, ProposeExperimentRequest
from app.schemas.project_state import (
    GraphEdge,
    GraphNode,
    GraphOut,
    PatchProject,
    ProjectStateOut,
)
from app.schemas.projects import ProjectOut

router = APIRouter(prefix="/api/v1", tags=["project-state"])

_NODE_TYPES = {
    "paper": "paper", "claim": "claim", "method": "method",
    "problem": "blocker", "objective": "question", "hypothesis": "question",
}
_EDGE_TYPES = {
    "depends_on": "dependency", "blocks": "dependency", "requires_skill": "dependency",
    "supports": "evidence", "tests": "evidence", "produces": "evidence",
    "contradicts": "contradiction", "derived_from": "citation",
}
_NODE_COLORS = {
    "paper": (0.30, 0.68, 1.0), "claim": (0.75, 0.54, 1.0),
    "question": (1.0, 0.7, 0.38), "method": (0.35, 0.9, 0.7),
    "blocker": (1.0, 0.4, 0.45),
}


def _frontier_graph(nodes: list[FrontierNode], edges: list[FrontierEdge]) -> GraphOut:
    graph_nodes = []
    for node in nodes:
        node_type = _NODE_TYPES.get(node.node_type, "claim")
        rng = random.Random(node.id)
        graph_nodes.append(GraphNode(
            id=node.id,
            label=node.label,
            type=node_type,
            cluster=node.node_type,
            position=tuple(round(rng.uniform(-10, 10), 3) for _ in range(3)),
            color=_NODE_COLORS[node_type],
            size=1.5,
            metadata={
                "abstract": node.detail,
                "authors": [],
                "year": None,
                "venue": None,
                "citation_count": 0,
                "data_mode": node.data_mode,
            },
            status=node.status,
        ))
    graph_edges = [GraphEdge(
        id=edge.id,
        source=edge.source_node_id,
        target=edge.target_node_id,
        type=_EDGE_TYPES.get(edge.edge_type, "dependency"),
        weight=edge.weight,
        relationship=edge.edge_type,
    ) for edge in edges]
    return GraphOut(nodes=graph_nodes, edges=graph_edges)


@router.patch("/projects/{project_id}", response_model=ProjectOut)
def patch_project(project_id: str, body: PatchProject, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.title is not None:
        project.title = body.title
    if body.objective is not None:
        project.objective = body.objective
    if body.status is not None:
        project.status = body.status

    db.commit()
    db.refresh(project)
    return ProjectOut(
        id=project.id,
        title=project.title,
        objective=project.objective,
        status=project.status,
        created_at=project.created_at,
    )


@router.get("/projects/{project_id}/state", response_model=ProjectStateOut)
def get_project_state(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    run_count = db.query(ExperimentRun).filter(
        ExperimentRun.project_id == project_id
    ).count()
    event_count = db.query(ResearchEvent).filter(
        ResearchEvent.project_id == project_id
    ).count()
    frontier_node_count = db.query(FrontierNode).filter(
        FrontierNode.project_id == project_id
    ).count()
    plan_count = db.query(ResearchPlan).filter(
        ResearchPlan.project_id == project_id
    ).count()
    claim_count = db.query(Claim).filter(
        Claim.project_id == project_id
    ).count()

    return ProjectStateOut(
        project=ProjectOut(
            id=project.id,
            title=project.title,
            objective=project.objective,
            status=project.status,
            created_at=project.created_at,
        ),
        run_count=run_count,
        event_count=event_count,
        frontier_node_count=frontier_node_count,
        plan_count=plan_count,
        claim_count=claim_count,
        status=project.status,
    )


@router.get("/projects/{project_id}/graph", response_model=GraphOut)
def get_project_graph(
    project_id: str,
    cluster: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    nodes = db.query(FrontierNode).filter(
        FrontierNode.project_id == project_id
    ).all()
    if nodes:
        edges = db.query(FrontierEdge).filter(FrontierEdge.project_id == project_id).all()
        graph = _frontier_graph(nodes, edges)
    else:
        graph = mock_graph(project_id)

    query = q.casefold().strip() if q else None
    filtered_nodes = [node for node in graph.nodes
                      if (cluster is None or node.cluster == cluster)
                      and (not query or query in node.label.casefold())]
    node_ids = {node.id for node in filtered_nodes}
    return GraphOut(
        nodes=filtered_nodes,
        edges=[edge for edge in graph.edges
               if edge.source in node_ids and edge.target in node_ids],
    )


@router.get("/projects/{project_id}/graph/node/{node_id}", response_model=GraphNode)
def get_project_graph_node(project_id: str, node_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    node = db.query(FrontierNode).filter(FrontierNode.project_id == project_id).first()
    if node:
        target = db.query(FrontierNode).filter(
            FrontierNode.project_id == project_id, FrontierNode.id == node_id,
        ).first()
        if target:
            return _frontier_graph([target], []).nodes[0]
    else:
        for demo_node in mock_graph(project_id).nodes:
            if demo_node.id == node_id:
                return demo_node
    raise HTTPException(status_code=404, detail="Node not found")


@router.get("/projects/{project_id}/hypotheses", response_model=list[HypothesisOut])
def list_hypotheses(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    plans = db.query(ResearchPlan).filter(
        ResearchPlan.project_id == project_id
    ).all()
    plan_ids = [p.id for p in plans]
    if not plan_ids:
        return []

    rows = db.query(PlanHypothesis).filter(
        PlanHypothesis.plan_id.in_(plan_ids)
    ).all()

    return [
        HypothesisOut(
            id=h.id,
            plan_id=h.plan_id,
            text=h.text,
            status=h.status,
        )
        for h in rows
    ]


@router.get("/projects/{project_id}/experiments", response_model=list[ExperimentSpecOut])
def list_experiments(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return db.query(ExperimentSpec).filter(
        ExperimentSpec.project_id == project_id
    ).all()


@router.post("/projects/{project_id}/experiments/propose", response_model=ExperimentSpecOut, status_code=201)
def propose_experiment(project_id: str, body: ProposeExperimentRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    spec = ExperimentSpec(
        project_id=project_id,
        plan_id=body.plan_id,
        hypothesis_id=body.hypothesis_id,
        evaluator_version=body.evaluator_version,
        parameters_json=body.parameters_json,
        dataset_hash=body.dataset_hash,
    )
    db.add(spec)
    db.commit()
    db.refresh(spec)
    return spec
