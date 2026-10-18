from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.plan import PlanHypothesis, PlanProtocol, PlanVersion, ResearchPlan


def compile_plan(
    db: Session,
    project_id: str,
    goal_text: str,
) -> dict[str, Any]:
    variables = [
        {"name": "independent_var", "type": "continuous", "role": "independent"},
        {"name": "dependent_var", "type": "continuous", "role": "dependent"},
    ]
    metrics = [
        {"name": "coverage_fraction", "unit": "fraction", "target": 0.8},
    ]
    success_criteria = [
        f"Achieve target metric on at least one configuration for: {goal_text}",
    ]
    constraints = [
        "Bounded compute budget",
        "Deterministic evaluator required",
    ]

    plan = ResearchPlan(
        project_id=project_id,
        objective=goal_text,
        variables_json=json.dumps(variables),
        metrics_json=json.dumps(metrics),
        success_criteria_json=json.dumps(success_criteria),
        constraints_json=json.dumps(constraints),
        version=1,
    )
    db.add(plan)
    db.flush()

    h1 = PlanHypothesis(
        plan_id=plan.id,
        text=f"Hypothesis: varying the independent variable will improve outcomes for {goal_text}",
        rationale="Default exploratory hypothesis from goal decomposition",
        sequence=0,
    )
    db.add(h1)
    db.flush()

    p1 = PlanProtocol(
        plan_id=plan.id,
        hypothesis_id=h1.id,
        description=f"Run bounded experiment varying independent_var and measuring dependent_var",
        evaluator_config_json=json.dumps({"evaluator": "default", "seed": 42}),
        sequence=0,
    )
    db.add(p1)
    db.flush()

    _record_version(db, plan, "Initial compilation")

    return _plan_dict(db, plan)


def update_plan(
    db: Session,
    plan_id: str,
    edits: dict[str, Any],
) -> dict[str, Any]:
    plan = db.query(ResearchPlan).filter(ResearchPlan.id == plan_id).first()
    if not plan:
        raise ValueError("Plan not found")

    for field in ("objective", "variables_json", "metrics_json", "success_criteria_json", "constraints_json"):
        if field in edits and edits[field] is not None:
            setattr(plan, field, edits[field])

    plan.version += 1
    plan.updated_at = datetime.now(timezone.utc)
    db.flush()

    _record_version(db, plan, edits.get("change_summary", "User edit"))

    return _plan_dict(db, plan)


def approve_plan(db: Session, plan_id: str) -> dict[str, Any]:
    plan = db.query(ResearchPlan).filter(ResearchPlan.id == plan_id).first()
    if not plan:
        raise ValueError("Plan not found")
    plan.status = "approved"
    plan.updated_at = datetime.now(timezone.utc)
    db.flush()
    return _plan_dict(db, plan)


def _record_version(db: Session, plan: ResearchPlan, summary: str | None) -> None:
    snapshot = {
        "objective": plan.objective,
        "variables_json": plan.variables_json,
        "metrics_json": plan.metrics_json,
        "success_criteria_json": plan.success_criteria_json,
        "constraints_json": plan.constraints_json,
    }
    pv = PlanVersion(
        plan_id=plan.id,
        version=plan.version,
        snapshot_json=json.dumps(snapshot),
        change_summary=summary,
    )
    db.add(pv)
    db.flush()


def _plan_dict(db: Session, plan: ResearchPlan) -> dict[str, Any]:
    hypotheses = db.query(PlanHypothesis).filter(
        PlanHypothesis.plan_id == plan.id
    ).order_by(PlanHypothesis.sequence).all()

    protocols = db.query(PlanProtocol).filter(
        PlanProtocol.plan_id == plan.id
    ).order_by(PlanProtocol.sequence).all()

    return {
        "id": plan.id,
        "project_id": plan.project_id,
        "status": plan.status,
        "objective": plan.objective,
        "variables_json": plan.variables_json,
        "metrics_json": plan.metrics_json,
        "success_criteria_json": plan.success_criteria_json,
        "constraints_json": plan.constraints_json,
        "version": plan.version,
        "model_provider": plan.model_provider,
        "model_id": plan.model_id,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
        "hypotheses": [
            {
                "id": h.id, "plan_id": h.plan_id, "text": h.text,
                "rationale": h.rationale, "status": h.status, "sequence": h.sequence,
            }
            for h in hypotheses
        ],
        "protocols": [
            {
                "id": p.id, "plan_id": p.plan_id, "hypothesis_id": p.hypothesis_id,
                "description": p.description, "evaluator_config_json": p.evaluator_config_json,
                "sequence": p.sequence,
            }
            for p in protocols
        ],
    }
