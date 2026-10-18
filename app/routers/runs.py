from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.artifact import ArtifactBlob, ExperimentSpec
from app.models.project import ExperimentRun, Project, ResearchEvent
from app.schemas.artifact import ArtifactOut
from app.schemas.run import CancelRequest, RunOut, StartRunRequest

router = APIRouter(prefix="/api/v1", tags=["runs"])


def _next_seq(db: Session, project_id: str) -> int:
    max_seq = (
        db.query(func.max(ResearchEvent.sequence))
        .filter_by(project_id=project_id)
        .scalar()
        or 0
    )
    return max_seq + 1


@router.post("/projects/{project_id}/runs", response_model=RunOut, status_code=201)
def start_run(project_id: str, body: StartRunRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Idempotency check
    if body.idempotency_key:
        existing = (
            db.query(ExperimentRun)
            .filter_by(idempotency_key=body.idempotency_key)
            .first()
        )
        if existing:
            return JSONResponse(
                status_code=200,
                content=RunOut.model_validate(existing).model_dump(mode="json"),
            )

    spec = db.get(ExperimentSpec, body.experiment_spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="ExperimentSpec not found")

    now = datetime.now(timezone.utc)
    run = ExperimentRun(
        project_id=project_id,
        experiment_spec_id=spec.id,
        evaluator_version=spec.evaluator_version,
        seed=0,
        status="running",
        started_at=now,
        parameters_json=body.parameters_json or spec.parameters_json,
        idempotency_key=body.idempotency_key,
    )
    db.add(run)
    db.flush()

    seq = _next_seq(db, project_id)
    event = ResearchEvent(
        project_id=project_id,
        sequence=seq,
        type="experiment.started",
        entity_id=run.id,
        payload_json=json.dumps({"experiment_spec_id": spec.id}),
    )
    db.add(event)
    db.commit()
    db.refresh(run)
    return run


@router.get("/runs/{run_id}", response_model=RunOut)
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.get(ExperimentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/runs/{run_id}/cancel", response_model=RunOut)
def cancel_run(run_id: str, body: CancelRequest, db: Session = Depends(get_db)):
    run = db.get(ExperimentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status in ("cancelled", "completed"):
        raise HTTPException(status_code=409, detail=f"Run already {run.status}")

    now = datetime.now(timezone.utc)
    run.status = "cancelled"
    run.cancel_reason = body.reason
    run.ended_at = now
    db.flush()

    seq = _next_seq(db, run.project_id)
    event = ResearchEvent(
        project_id=run.project_id,
        sequence=seq,
        type="experiment.cancelled",
        entity_id=run.id,
        payload_json=json.dumps({"reason": body.reason}),
    )
    db.add(event)
    db.commit()
    db.refresh(run)
    return run


@router.get("/artifacts/{artifact_id}", response_model=ArtifactOut)
def get_artifact_global(artifact_id: str, db: Session = Depends(get_db)):
    blob = db.get(ArtifactBlob, artifact_id)
    if not blob:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return blob
