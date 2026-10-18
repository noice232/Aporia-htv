from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import ExperimentRun, Project, ResearchEvent
from app.models.research_session import HumanCheckpoint, ResearchSession
from app.schemas.research_session import CheckpointOut
from app.schemas.run import (
    ResearchControlOut,
    ResearchControlRequest,
    ResearchStatusOut,
)

router = APIRouter(prefix="/api/v1", tags=["research-control"])


def _next_seq(db: Session, project_id: str) -> int:
    max_seq = (
        db.query(func.max(ResearchEvent.sequence))
        .filter_by(project_id=project_id)
        .scalar()
        or 0
    )
    return max_seq + 1


@router.get("/projects/{project_id}/research/status", response_model=ResearchStatusOut)
def research_status(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    active_run_count = (
        db.query(func.count(ExperimentRun.id))
        .filter(
            ExperimentRun.project_id == project_id,
            ExperimentRun.status == "running",
        )
        .scalar()
        or 0
    )

    last_event_sequence = (
        db.query(func.max(ResearchEvent.sequence))
        .filter_by(project_id=project_id)
        .scalar()
        or 0
    )

    return ResearchStatusOut(
        project_id=project_id,
        state=project.research_state,
        active_run_count=active_run_count,
        last_event_sequence=last_event_sequence,
    )


@router.post("/projects/{project_id}/research/control", response_model=ResearchControlOut)
def research_control(
    project_id: str,
    body: ResearchControlRequest,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    valid_actions = ("pause", "resume", "cancel")
    if body.action not in valid_actions:
        raise HTTPException(status_code=422, detail=f"action must be one of {valid_actions}")

    state_map = {"pause": "paused", "resume": "running", "cancel": "cancelled"}
    new_state = state_map[body.action]

    affected_runs = 0

    if body.action == "cancel":
        now = datetime.now(timezone.utc)
        running_runs = (
            db.query(ExperimentRun)
            .filter(
                ExperimentRun.project_id == project_id,
                ExperimentRun.status == "running",
            )
            .all()
        )
        for run in running_runs:
            run.status = "cancelled"
            run.cancel_reason = "research cancelled"
            run.ended_at = now
            affected_runs += 1

    project.research_state = new_state
    db.flush()

    seq = _next_seq(db, project_id)
    event = ResearchEvent(
        project_id=project_id,
        sequence=seq,
        type=f"research.{body.action}d",
        payload_json=json.dumps({"action": body.action, "affected_runs": affected_runs}),
        idempotency_key=body.idempotency_key,
    )
    db.add(event)
    db.commit()

    return ResearchControlOut(
        project_id=project_id,
        new_state=new_state,
        affected_runs=affected_runs,
    )


@router.get("/projects/{project_id}/research/checkpoints", response_model=list[CheckpointOut])
def list_checkpoints(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    checkpoints = (
        db.query(HumanCheckpoint)
        .join(ResearchSession, HumanCheckpoint.session_id == ResearchSession.id)
        .filter(ResearchSession.project_id == project_id)
        .order_by(HumanCheckpoint.created_at)
        .all()
    )
    return checkpoints
