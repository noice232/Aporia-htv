from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sqlalchemy.orm import Session

from app.evaluator import (
    CameraPose,
    __version__ as evaluator_version,
    compute_coverage,
    look_at,
    make_unit_cube_cloud,
)
from app.models.fork import ResearchFork
from app.models.project import ExperimentRun, ResearchEvent
from app.policy.candidates import DEFAULT_CANDIDATES, Candidate
from app.policy.engine import run_policy
from app.policy.profile import build_human_context
from app.runner import INTRINSICS


def _next_seq(db: Session, project_id: str) -> int:
    from sqlalchemy import func

    cur = (
        db.query(func.max(ResearchEvent.sequence))
        .filter(ResearchEvent.project_id == project_id)
        .scalar()
    )
    return (cur or 0) + 1


def _emit(
    db: Session,
    project_id: str,
    event_type: str,
    entity_id: str | None = None,
    payload: dict[str, Any] | None = None,
    correlation_id: str | None = None,
) -> ResearchEvent:
    seq = _next_seq(db, project_id)
    evt = ResearchEvent(
        project_id=project_id,
        sequence=seq,
        type=event_type,
        entity_id=entity_id,
        payload_json=json.dumps(payload) if payload else None,
        data_mode="measured",
        correlation_id=correlation_id or str(uuid.uuid4()),
    )
    db.add(evt)
    db.flush()
    return evt


def _evaluate_candidate(
    db: Session,
    project_id: str,
    candidate: Candidate,
    branch_label: str,
    points: np.ndarray,
    normals: np.ndarray,
    correlation_id: str,
) -> tuple[str, float, int, int]:
    ext = look_at(np.array(candidate.eye, dtype=float), np.array(candidate.target, dtype=float))
    pose = CameraPose(intrinsics=INTRINSICS, extrinsics=ext)

    now = datetime.now(timezone.utc)
    run = ExperimentRun(
        project_id=project_id,
        evaluator_version=evaluator_version,
        seed=0,
        status="running",
        started_at=now,
        parameters_json=json.dumps({
            "fork_branch": branch_label,
            "candidate_id": candidate.id,
            "candidate_label": candidate.label,
            "eye": list(candidate.eye),
        }),
        data_mode="measured",
    )
    db.add(run)
    db.flush()

    result = compute_coverage(pose, points, normals)

    metrics = {
        "coverage_fraction": result.coverage_fraction,
        "visible_count": result.visible_count,
        "total_count": result.total_count,
    }

    run.metrics_json = json.dumps(metrics)
    run.status = "completed"
    run.ended_at = datetime.now(timezone.utc)

    _emit(
        db,
        project_id,
        "fork.branch_completed",
        entity_id=run.id,
        payload={
            "branch": branch_label,
            "candidate_id": candidate.id,
            "run_id": run.id,
            "coverage_fraction": result.coverage_fraction,
        },
        correlation_id=correlation_id,
    )

    return run.id, result.coverage_fraction, result.visible_count, result.total_count


def execute_fork(
    db: Session,
    project_id: str,
    w_guided: float,
    idempotency_key: str | None = None,
) -> dict[str, Any]:
    if idempotency_key:
        existing = (
            db.query(ResearchFork)
            .filter(ResearchFork.idempotency_key == idempotency_key)
            .first()
        )
        if existing:
            return _fork_to_dict(existing)

    human_context = build_human_context(db, project_id)

    result_unguided = run_policy(db, project_id, w=0.0, human_context=human_context)
    result_guided = run_policy(db, project_id, w=w_guided, human_context=human_context)

    cid_unguided = result_unguided["selected_candidate_id"]
    cid_guided = result_guided["selected_candidate_id"]
    snapshot_id = result_unguided["snapshot_id"]

    cand_map = {c.id: c for c in DEFAULT_CANDIDATES}
    cand_unguided = cand_map[cid_unguided]
    cand_guided = cand_map[cid_guided]

    points, normals = make_unit_cube_cloud(points_per_face=25)
    dataset_hash = hashlib.sha256(points.tobytes() + normals.tobytes()).hexdigest()

    correlation_id = str(uuid.uuid4())

    run_id_u, cov_u, vis_u, tot_u = _evaluate_candidate(
        db, project_id, cand_unguided, "unguided", points, normals, correlation_id,
    )
    run_id_g, cov_g, vis_g, tot_g = _evaluate_candidate(
        db, project_id, cand_guided, "guided", points, normals, correlation_id,
    )

    delta = cov_g - cov_u
    if delta > 1e-9:
        winner = "guided"
    elif delta < -1e-9:
        winner = "unguided"
    else:
        winner = "tie"

    limitations: list[str] = []
    confounds: list[str] = []
    if cid_unguided == cid_guided:
        limitations.append("both_branches_selected_same_candidate")

    fork = ResearchFork(
        project_id=project_id,
        checkpoint_snapshot_id=snapshot_id,
        policy_run_id_unguided=result_unguided["id"],
        policy_run_id_guided=result_guided["id"],
        candidate_id_unguided=cid_unguided,
        candidate_id_guided=cid_guided,
        w_unguided=0.0,
        w_guided=w_guided,
        run_id_unguided=run_id_u,
        run_id_guided=run_id_g,
        shared_evaluator_version=evaluator_version,
        shared_dataset_hash=dataset_hash,
        shared_budget="single_pose",
        coverage_unguided=cov_u,
        coverage_guided=cov_g,
        coverage_delta=delta,
        winner=winner,
        comparison_status="complete",
        limitations_json=json.dumps(limitations) if limitations else None,
        idempotency_key=idempotency_key,
    )
    db.add(fork)
    db.flush()

    _emit(
        db,
        project_id,
        "fork.created",
        entity_id=fork.id,
        payload={
            "fork_id": fork.id,
            "candidate_unguided": cid_unguided,
            "candidate_guided": cid_guided,
            "winner": winner,
            "coverage_delta": delta,
        },
        correlation_id=correlation_id,
    )

    return _fork_to_dict(fork, confounds=confounds)


def _fork_to_dict(fork: ResearchFork, confounds: list[str] | None = None) -> dict[str, Any]:
    cand_map = {c.id: c for c in DEFAULT_CANDIDATES}

    limitations = json.loads(fork.limitations_json) if fork.limitations_json else []

    branch_u_status = "evaluated" if fork.run_id_unguided else "not_evaluated"
    branch_g_status = "evaluated" if fork.run_id_guided else "not_evaluated"

    return {
        "id": fork.id,
        "project_id": fork.project_id,
        "checkpoint_snapshot_id": fork.checkpoint_snapshot_id,
        "w_unguided": fork.w_unguided,
        "w_guided": fork.w_guided,
        "branch_unguided": {
            "candidate_id": fork.candidate_id_unguided,
            "candidate_label": cand_map.get(fork.candidate_id_unguided, Candidate(id="?", label="unknown", eye=(0,0,0), target=(0,0,0))).label,
            "run_id": fork.run_id_unguided,
            "coverage_fraction": fork.coverage_unguided,
            "visible_count": None if fork.coverage_unguided is None else int(round(fork.coverage_unguided * 150)),
            "total_count": 150 if fork.run_id_unguided else None,
            "status": branch_u_status,
        },
        "branch_guided": {
            "candidate_id": fork.candidate_id_guided,
            "candidate_label": cand_map.get(fork.candidate_id_guided, Candidate(id="?", label="unknown", eye=(0,0,0), target=(0,0,0))).label,
            "run_id": fork.run_id_guided,
            "coverage_fraction": fork.coverage_guided,
            "visible_count": None if fork.coverage_guided is None else int(round(fork.coverage_guided * 150)),
            "total_count": 150 if fork.run_id_guided else None,
            "status": branch_g_status,
        },
        "comparison": {
            "coverage_delta": fork.coverage_delta,
            "winner": fork.winner,
            "status": fork.comparison_status,
            "confounds": confounds or [],
            "limitations": limitations,
        },
        "shared_evaluator_version": fork.shared_evaluator_version,
        "shared_dataset_hash": fork.shared_dataset_hash,
        "shared_budget": fork.shared_budget,
        "created_at": fork.created_at,
    }
