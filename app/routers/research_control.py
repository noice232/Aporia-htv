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
    AutonomousStartIn,
    AutonomousStartOut,
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


@router.post(
    "/projects/{project_id}/research/autonomous",
    response_model=AutonomousStartOut,
)
def start_autonomous(
    project_id: str,
    body: AutonomousStartIn | None = None,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.research_state == "running":
        raise HTTPException(status_code=409, detail="Research already running")

    max_iter = body.max_iterations if body else 5
    thresh = body.threshold if body else 0.85
    max_iter = max(1, min(max_iter, 20))
    thresh = max(0.1, min(thresh, 1.0))

    import threading
    from app.database import SessionLocal
    from app.runner import run_autonomous_loop

    def _run():
        session = SessionLocal()
        try:
            run_autonomous_loop(session, project_id, max_iterations=max_iter, threshold=thresh)
        except Exception as exc:
            p = session.get(Project, project_id)
            if p:
                p.research_state = "failed"
                seq = (
                    session.query(func.max(ResearchEvent.sequence))
                    .filter_by(project_id=project_id)
                    .scalar()
                    or 0
                ) + 1
                session.add(ResearchEvent(
                    project_id=project_id,
                    sequence=seq,
                    type="autonomous.error",
                    payload_json=json.dumps({"error": str(exc)}),
                ))
                session.commit()
        finally:
            session.close()

    project.research_state = "running"
    db.commit()
    threading.Thread(target=_run, daemon=True).start()

    return AutonomousStartOut(
        project_id=project_id,
        state="running",
        message=f"Autonomous research loop started ({max_iter} iterations, threshold {thresh:.0%})",
        max_iterations=max_iter,
        threshold=thresh,
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
