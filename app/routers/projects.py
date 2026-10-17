from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import AgendaItem, ExperimentRun, Project, ResearchEvent
from app.runner import run_goal
from app.schemas.projects import (
    AgendaItemOut,
    CreateProject,
    EventOut,
    EventPage,
    GoalResult,
    ProjectOut,
    RunSummary,
    SubmitGoal,
)

router = APIRouter(prefix="/api/v1", tags=["projects"])


@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(body: CreateProject, db: Session = Depends(get_db)):
    project = Project(title=body.title, objective=body.objective)
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectOut(
        id=project.id,
        title=project.title,
        objective=project.objective,
        status=project.status,
        created_at=project.created_at,
    )


@router.post("/projects/{project_id}/goals", response_model=GoalResult)
def submit_goal(project_id: str, body: SubmitGoal, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "running"
    db.flush()

    result = run_goal(db, project_id, threshold=body.threshold, seed=body.seed)

    project.status = "completed"
    db.commit()

    runs = [
        RunSummary(
            id=r["id"],
            evaluator_version=r["evaluator_version"],
            seed=r["seed"],
            status=r["status"],
            coverage_fraction=r["coverage_fraction"],
            parameters_json=r["parameters_json"],
            started_at=r["started_at"],
            ended_at=r["ended_at"],
        )
        for r in result["runs"]
    ]

    return GoalResult(
        project_id=result["project_id"],
        runs=runs,
        best_coverage=result["best_coverage"],
        threshold_met=result["threshold_met"],
        agenda_item_id=result.get("agenda_item_id"),
    )


@router.get("/projects/{project_id}/runs", response_model=list[RunSummary])
def list_runs(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = (
        db.query(ExperimentRun)
        .filter(ExperimentRun.project_id == project_id)
        .order_by(ExperimentRun.started_at)
        .all()
    )
    return [
        RunSummary(
            id=r.id,
            evaluator_version=r.evaluator_version,
            seed=r.seed,
            status=r.status,
            coverage_fraction=json.loads(r.metrics_json).get("coverage_fraction") if r.metrics_json else None,
            parameters_json=json.loads(r.parameters_json) if r.parameters_json else None,
            started_at=r.started_at,
            ended_at=r.ended_at,
        )
        for r in rows
    ]


@router.get("/projects/{project_id}/events", response_model=EventPage)
def list_events(
    project_id: str,
    after: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = (
        db.query(ResearchEvent)
        .filter(ResearchEvent.project_id == project_id, ResearchEvent.sequence > after)
        .order_by(ResearchEvent.sequence)
        .limit(limit + 1)
        .all()
    )

    has_more = len(rows) > limit
    page = rows[:limit]

    events = [
        EventOut(
            id=e.id,
            sequence=e.sequence,
            type=e.type,
            entity_id=e.entity_id,
            payload=json.loads(e.payload_json) if e.payload_json else None,
            data_mode=e.data_mode,
            occurred_at=e.occurred_at,
        )
        for e in page
    ]

    next_seq = page[-1].sequence if has_more else None
    return EventPage(events=events, next_sequence=next_seq)


@router.get("/projects/{project_id}/agenda", response_model=list[AgendaItemOut])
def list_agenda(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = (
        db.query(AgendaItem)
        .filter(AgendaItem.project_id == project_id)
        .order_by(AgendaItem.created_at)
        .all()
    )
    return [
        AgendaItemOut(
            id=r.id,
            project_id=r.project_id,
            question=r.question,
            status=r.status,
            priority=r.priority,
            originating_run_id=r.originating_run_id,
            originating_event_id=r.originating_event_id,
            dedup_key=r.dedup_key,
            created_at=r.created_at,
        )
        for r in rows
    ]
