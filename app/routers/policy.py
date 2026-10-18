from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.policy import CandidateScore, PolicyRun, PolicySnapshot
from app.models.project import Project
from app.policy.candidates import DEFAULT_CANDIDATES
from app.policy.engine import choose_action, run_policy
from app.policy.profile import build_human_context
from app.schemas.policy import (
    CandidateScoreOut,
    ChooseRequest,
    ChooseResult,
    PolicyRunOut,
    ScoreRequest,
)
from app.schemas.policy_extra import (
    CreateSnapshotRequest,
    SnapshotOut,
)

router = APIRouter(prefix="/api/v1", tags=["policy"])


def _build_run_out(result: dict) -> PolicyRunOut:
    scores = [
        CandidateScoreOut(
            candidate_id=s["candidate_id"],
            label=s["label"],
            s_u=s["s_u"],
            s_c=s["s_c"],
            delta=s["delta"],
            s_guided=s["s_g"],
            feasible=s["feasible"],
            infeasibility_reason=s["infeasibility_reason"],
            rubric_u=s["rubric_u"],
            rubric_c=s["rubric_c"],
        )
        for s in result["scores"]
    ]
    return PolicyRunOut(
        id=result["id"],
        snapshot_id=result["snapshot_id"],
        project_id=result["project_id"],
        w=result["w"],
        selected_candidate_id=result["selected_candidate_id"],
        selected_label=result.get("selected_label"),
        scores=scores,
        status=result["status"],
        fallback_reason=result.get("fallback_reason"),
        computed_at=result["computed_at"],
    )


@router.post("/projects/{project_id}/policy/score", response_model=PolicyRunOut)
def score_policy(project_id: str, body: ScoreRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.human_context is not None:
        human_context = body.human_context
    else:
        human_context = build_human_context(db, project_id)

    result = run_policy(
        db,
        project_id,
        w=body.w,
        human_context=human_context,
    )
    db.commit()
    return _build_run_out(result)


@router.get("/projects/{project_id}/policy/runs/{policy_run_id}", response_model=PolicyRunOut)
def get_policy_run(project_id: str, policy_run_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    pr = db.get(PolicyRun, policy_run_id)
    if not pr or pr.project_id != project_id:
        raise HTTPException(status_code=404, detail="Policy run not found")

    snapshot = db.get(PolicySnapshot, pr.snapshot_id)
    score_rows = (
        db.query(CandidateScore)
        .filter(CandidateScore.policy_run_id == policy_run_id)
        .all()
    )

    label_map = {c.id: c.label for c in DEFAULT_CANDIDATES}

    scores = [
        {
            "candidate_id": s.candidate_id,
            "label": label_map.get(s.candidate_id, s.candidate_id),
            "s_u": s.s_unconditioned,
            "s_c": s.s_conditioned,
            "delta": s.delta,
            "s_g": s.s_guided,
            "feasible": s.feasibility,
            "infeasibility_reason": s.infeasibility_reason,
            "rubric_u": json.loads(s.rubric_scores_u_json) if s.rubric_scores_u_json else None,
            "rubric_c": json.loads(s.rubric_scores_c_json) if s.rubric_scores_c_json else None,
        }
        for s in score_rows
    ]

    selected_label = label_map.get(pr.selected_candidate_id) if pr.selected_candidate_id else None

    return _build_run_out({
        "id": pr.id,
        "snapshot_id": pr.snapshot_id,
        "project_id": pr.project_id,
        "w": pr.w,
        "selected_candidate_id": pr.selected_candidate_id,
        "selected_label": selected_label,
        "scores": scores,
        "status": pr.status,
        "fallback_reason": pr.fallback_reason,
        "computed_at": pr.computed_at,
    })


@router.post("/projects/{project_id}/policy/choose", response_model=ChooseResult)
def choose_policy_action(project_id: str, body: ChooseRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        result = choose_action(
            db,
            policy_run_id=body.policy_run_id,
            idempotency_key=body.idempotency_key,
            candidate_id=body.candidate_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    return ChooseResult(**result)


@router.get("/projects/{project_id}/policy/snapshots/latest", response_model=SnapshotOut)
def get_latest_snapshot(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    snapshot = (
        db.query(PolicySnapshot)
        .filter(PolicySnapshot.project_id == project_id)
        .order_by(PolicySnapshot.created_at.desc())
        .first()
    )
    if not snapshot:
        raise HTTPException(status_code=404, detail="No snapshots found")

    return snapshot


@router.post("/projects/{project_id}/policy/snapshots", response_model=SnapshotOut, status_code=201)
def create_snapshot(project_id: str, body: CreateSnapshotRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    human_context = build_human_context(db, project_id)
    candidates = list(DEFAULT_CANDIDATES)
    cset_hash = hashlib.sha256(
        json.dumps(sorted(c.id for c in candidates)).encode()
    ).hexdigest()

    snapshot = PolicySnapshot(
        project_id=project_id,
        candidate_set_hash=cset_hash,
        candidate_ids_json=json.dumps(sorted(c.id for c in candidates)),
        rubric_version="1.0",
        constraints_hash=cset_hash,
        human_context_json=json.dumps(human_context) if human_context else None,
        conditioned_context_status="present" if human_context else "missing",
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot
