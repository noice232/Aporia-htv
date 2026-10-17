from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.fork import execute_fork, _fork_to_dict
from app.models.fork import ResearchFork
from app.models.project import Project
from app.policy.candidates import DEFAULT_CANDIDATES
from app.schemas.fork import (
    BranchOut,
    ComparisonOut,
    ForkOut,
    ForkRequest,
    ForkSummaryOut,
)

router = APIRouter(prefix="/api/v1", tags=["fork"])


def _build_fork_out(data: dict) -> ForkOut:
    return ForkOut(
        id=data["id"],
        project_id=data["project_id"],
        checkpoint_snapshot_id=data["checkpoint_snapshot_id"],
        w_unguided=data["w_unguided"],
        w_guided=data["w_guided"],
        branch_unguided=BranchOut(**data["branch_unguided"]),
        branch_guided=BranchOut(**data["branch_guided"]),
        comparison=ComparisonOut(**data["comparison"]),
        shared_evaluator_version=data["shared_evaluator_version"],
        shared_dataset_hash=data["shared_dataset_hash"],
        shared_budget=data["shared_budget"],
        created_at=data["created_at"],
    )


@router.post("/projects/{project_id}/forks", response_model=ForkOut, status_code=201)
def create_fork(project_id: str, body: ForkRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = execute_fork(
        db,
        project_id,
        w_guided=body.w,
        idempotency_key=body.idempotency_key,
    )
    db.commit()
    return _build_fork_out(result)


@router.get("/projects/{project_id}/forks/{fork_id}", response_model=ForkOut)
def get_fork(project_id: str, fork_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    fork = db.get(ResearchFork, fork_id)
    if not fork or fork.project_id != project_id:
        raise HTTPException(status_code=404, detail="Fork not found")

    return _build_fork_out(_fork_to_dict(fork))


@router.get("/projects/{project_id}/forks", response_model=list[ForkSummaryOut])
def list_forks(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    forks = (
        db.query(ResearchFork)
        .filter(ResearchFork.project_id == project_id)
        .order_by(ResearchFork.created_at.desc())
        .all()
    )
    return [
        ForkSummaryOut(
            id=f.id,
            project_id=f.project_id,
            candidate_id_unguided=f.candidate_id_unguided,
            candidate_id_guided=f.candidate_id_guided,
            w_guided=f.w_guided,
            winner=f.winner,
            comparison_status=f.comparison_status,
            created_at=f.created_at,
        )
        for f in forks
    ]
