from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.meta import MetaTrial
from app.schemas.meta import CreateMetaTrial, MetaTrialOut, RollbackRequest

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}", tags=["meta"])


@router.get("/meta", response_model=list[MetaTrialOut])
def list_meta_trials(workspace_id: str, db: Session = Depends(get_db)):
    trials = (
        db.query(MetaTrial)
        .filter(MetaTrial.workspace_id == workspace_id)
        .order_by(MetaTrial.started_at.desc())
        .all()
    )
    return trials


@router.post("/meta/trials", response_model=MetaTrialOut, status_code=201)
def create_meta_trial(
    workspace_id: str,
    body: CreateMetaTrial,
    db: Session = Depends(get_db),
):
    trial = MetaTrial(
        workspace_id=workspace_id,
        strategy_a_id=body.strategy_a_id,
        strategy_b_id=body.strategy_b_id,
        common_conditions_json=body.common_conditions_json,
    )
    db.add(trial)
    db.commit()
    db.refresh(trial)
    return trial


@router.post("/meta/{trial_id}/rollback", response_model=MetaTrialOut)
def rollback_trial(
    workspace_id: str,
    trial_id: str,
    body: RollbackRequest,
    db: Session = Depends(get_db),
):
    trial = (
        db.query(MetaTrial)
        .filter(
            MetaTrial.id == trial_id,
            MetaTrial.workspace_id == workspace_id,
        )
        .first()
    )
    if not trial:
        raise HTTPException(404, "Meta trial not found")
    trial.status = "rolled_back"
    trial.ended_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(trial)
    return trial
