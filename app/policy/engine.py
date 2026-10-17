from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.policy import CandidateScore, PolicyRun, PolicySnapshot
from app.models.project import ResearchEvent
from app.policy.candidates import Candidate, DEFAULT_CANDIDATES
from app.policy.scoring import score_conditioned, score_unconditioned


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _candidate_set_hash(candidates: list[Candidate]) -> str:
    ids = sorted(c.id for c in candidates)
    return hashlib.sha256(json.dumps(ids).encode()).hexdigest()


def _next_seq(db: Session, project_id: str) -> int:
    from sqlalchemy import func
    cur = db.query(func.max(ResearchEvent.sequence)).filter(
        ResearchEvent.project_id == project_id
    ).scalar()
    return (cur or 0) + 1


def _emit(db: Session, project_id: str, event_type: str,
          entity_id: str | None = None,
          payload: dict[str, Any] | None = None) -> ResearchEvent:
    seq = _next_seq(db, project_id)
    evt = ResearchEvent(
        project_id=project_id,
        sequence=seq,
        type=event_type,
        entity_id=entity_id,
        payload_json=json.dumps(payload) if payload else None,
        data_mode="measured",
        correlation_id=str(uuid.uuid4()),
    )
    db.add(evt)
    db.flush()
    return evt


def run_policy(
    db: Session,
    project_id: str,
    w: float,
    human_context: dict | None = None,
    candidates: list[Candidate] | None = None,
) -> dict[str, Any]:
    if candidates is None:
        candidates = list(DEFAULT_CANDIDATES)

    feasible = [c for c in candidates if c.feasible]
    infeasible = [c for c in candidates if not c.feasible]

    conditioned_status = "present" if human_context else "missing"
    fallback_reason = None if human_context else "no_human_context"

    scores_data: list[dict[str, Any]] = []

    for c in infeasible:
        scores_data.append({
            "candidate_id": c.id,
            "label": c.label,
            "s_u": None,
            "s_c": None,
            "delta": None,
            "s_g": None,
            "rubric_u": None,
            "rubric_c": None,
            "feasible": False,
            "infeasibility_reason": c.infeasibility_reason,
        })

    for c in feasible:
        s_u, rubric_u = score_unconditioned(c)

        if human_context:
            s_c, rubric_c = score_conditioned(c, human_context)
        else:
            s_c = s_u
            rubric_c = dict(rubric_u)

        delta = round(s_c - s_u, 10)
        s_g = round(s_u + w * delta, 10)

        scores_data.append({
            "candidate_id": c.id,
            "label": c.label,
            "s_u": s_u,
            "s_c": s_c,
            "delta": delta,
            "s_g": s_g,
            "rubric_u": rubric_u,
            "rubric_c": rubric_c,
            "feasible": True,
            "infeasibility_reason": None,
        })

    feasible_scores = [s for s in scores_data if s["feasible"]]
    if feasible_scores:
        feasible_scores.sort(key=lambda s: (
            -s["s_g"],
            -_evidence_quality(s["candidate_id"], candidates),
            _estimated_cost(s["candidate_id"], candidates),
            s["candidate_id"],
        ))
        selected_id = feasible_scores[0]["candidate_id"]
    else:
        selected_id = None

    if selected_id:
        sel_candidate = next(c for c in candidates if c.id == selected_id)
        if not sel_candidate.feasible:
            selected_id = None

    cset_hash = _candidate_set_hash(candidates)
    now = _utcnow()

    snapshot = PolicySnapshot(
        project_id=project_id,
        candidate_set_hash=cset_hash,
        candidate_ids_json=json.dumps(sorted(c.id for c in candidates)),
        rubric_version="1.0",
        constraints_hash=cset_hash,
        human_context_json=json.dumps(human_context) if human_context else None,
        conditioned_context_status=conditioned_status,
        created_at=now,
    )
    db.add(snapshot)
    db.flush()

    _emit(db, project_id, "policy.snapshot_created", entity_id=snapshot.id,
          payload={"snapshot_id": snapshot.id, "candidate_count": len(candidates)})

    policy_run = PolicyRun(
        snapshot_id=snapshot.id,
        project_id=project_id,
        w=w,
        selected_candidate_id=selected_id,
        fallback_reason=fallback_reason,
        computed_at=now,
        status="scored",
    )
    db.add(policy_run)
    db.flush()

    for s in scores_data:
        cs = CandidateScore(
            policy_run_id=policy_run.id,
            candidate_id=s["candidate_id"],
            s_unconditioned=s["s_u"],
            s_conditioned=s["s_c"] if human_context else s["s_u"],
            delta=s["delta"],
            s_guided=s["s_g"],
            weight=w,
            rubric_scores_u_json=json.dumps(s["rubric_u"]) if s["rubric_u"] else None,
            rubric_scores_c_json=json.dumps(s["rubric_c"]) if s["rubric_c"] else None,
            feasibility=s["feasible"],
            infeasibility_reason=s["infeasibility_reason"],
            data_mode="measured",
        )
        db.add(cs)

    _emit(db, project_id, "policy.scored", entity_id=policy_run.id,
          payload={
              "policy_run_id": policy_run.id,
              "w": w,
              "selected_candidate_id": selected_id,
              "conditioned_context_status": conditioned_status,
          })

    db.flush()

    selected_label = None
    if selected_id:
        selected_label = next(c.label for c in candidates if c.id == selected_id)

    return {
        "id": policy_run.id,
        "snapshot_id": snapshot.id,
        "project_id": project_id,
        "w": w,
        "selected_candidate_id": selected_id,
        "selected_label": selected_label,
        "scores": scores_data,
        "status": policy_run.status,
        "fallback_reason": fallback_reason,
        "computed_at": now,
    }


def choose_action(
    db: Session,
    policy_run_id: str,
    idempotency_key: str,
    candidate_id: str | None = None,
) -> dict[str, Any]:
    existing = db.query(PolicyRun).filter(
        PolicyRun.idempotency_key == idempotency_key
    ).first()
    if existing:
        return {
            "policy_run_id": existing.id,
            "selected_candidate_id": existing.selected_candidate_id,
            "status": existing.status,
            "idempotency_key": idempotency_key,
        }

    policy_run = db.get(PolicyRun, policy_run_id)
    if not policy_run:
        raise ValueError(f"PolicyRun {policy_run_id} not found")

    if policy_run.status != "scored":
        raise ValueError(f"PolicyRun status is '{policy_run.status}', expected 'scored'")

    chosen_id = candidate_id or policy_run.selected_candidate_id
    if not chosen_id:
        raise ValueError("No candidate selected and none provided")

    score_row = db.query(CandidateScore).filter(
        CandidateScore.policy_run_id == policy_run_id,
        CandidateScore.candidate_id == chosen_id,
    ).first()

    if not score_row:
        raise ValueError(f"Candidate {chosen_id} not found in this policy run")
    if not score_row.feasibility:
        raise ValueError(f"Candidate {chosen_id} is infeasible: {score_row.infeasibility_reason}")

    policy_run.selected_candidate_id = chosen_id
    policy_run.status = "chosen"
    policy_run.idempotency_key = idempotency_key

    _emit(db, policy_run.project_id, "action.selected", entity_id=policy_run.id,
          payload={
              "policy_run_id": policy_run.id,
              "candidate_id": chosen_id,
              "idempotency_key": idempotency_key,
          })

    db.flush()

    return {
        "policy_run_id": policy_run.id,
        "selected_candidate_id": chosen_id,
        "status": policy_run.status,
        "idempotency_key": idempotency_key,
    }


def _evidence_quality(candidate_id: str, candidates: list[Candidate]) -> float:
    for c in candidates:
        if c.id == candidate_id:
            return c.attributes.get("evidence_quality", 0.0)
    return 0.0


def _estimated_cost(candidate_id: str, candidates: list[Candidate]) -> float:
    for c in candidates:
        if c.id == candidate_id:
            return c.attributes.get("estimated_cost", 1.0)
    return 1.0
