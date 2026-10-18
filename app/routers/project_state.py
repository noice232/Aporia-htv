from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
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
def get_project_graph(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    nodes = db.query(FrontierNode).filter(
        FrontierNode.project_id == project_id
    ).all()
    edges = db.query(FrontierEdge).filter(
        FrontierEdge.project_id == project_id
    ).all()

    return GraphOut(
        nodes=[
            GraphNode(
                id=n.id,
                label=n.label,
                type=n.node_type,
                status=n.status,
            )
            for n in nodes
        ],
        edges=[
            GraphEdge(
                source=e.source_node_id,
                target=e.target_node_id,
                relationship=e.edge_type,
            )
            for e in edges
        ],
    )


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
