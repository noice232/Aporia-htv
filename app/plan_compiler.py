from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.plan import PlanHypothesis, PlanProtocol, PlanVersion, ResearchPlan

logger = logging.getLogger(__name__)

_PLAN_PROMPT = """You are a scientific research planner. Given a research goal, decompose it into a structured experimental plan with competing hypotheses and concrete protocols.

Research goal: "{goal_text}"

Generate a JSON plan with these fields:
- variables: array of 2-4 experimental variables, each with "name" (string), "type" (string: continuous/discrete/categorical), and "role" (string: independent/dependent/control)
- metrics: array of 1-3 measurable outcomes, each with "name" (string), "unit" (string), and "target" (number between 0 and 1)
- success_criteria: array of 1-2 strings describing when the experiment succeeds
- constraints: array of 1-2 strings describing resource or methodological constraints
- hypotheses: array of 2-3 competing hypotheses, each with "text" (string, the hypothesis statement) and "rationale" (string, why this hypothesis is plausible)
- protocols: array matching hypotheses, each with "description" (string, the experimental procedure), "evaluator_config" (string, JSON config for the evaluator), and "hypothesis_index" (integer, 0-based index into the hypotheses array)

Return only valid JSON matching this structure."""

_GOAL_PATTERNS: list[dict[str, Any]] = [
    {
        "keywords": ["coverage", "camera", "view", "viewpoint", "3dgs", "reconstruction", "scene"],
        "variables": [
            {"name": "camera_count", "type": "discrete", "role": "independent"},
            {"name": "camera_placement_strategy", "type": "categorical", "role": "independent"},
            {"name": "surface_coverage", "type": "continuous", "role": "dependent"},
        ],
        "metrics": [
            {"name": "coverage_fraction", "unit": "fraction", "target": 0.8},
            {"name": "reconstruction_quality", "unit": "PSNR_dB", "target": 0.7},
        ],
        "hypotheses": [
            ("Increasing camera count improves surface coverage by observing previously occluded regions",
             "More viewpoints reduce occlusion gaps in the reconstructed geometry"),
            ("Optimizing camera placement strategy matters more than camera count for coverage",
             "Strategic placement at informative positions yields better coverage per camera"),
        ],
        "protocols": [
            "Vary camera count (4, 8, 16) with uniform spherical placement and measure surface coverage",
            "Compare placement strategies (uniform, information-gain-guided, random) with fixed camera count",
        ],
    },
    {
        "keywords": ["quality", "visual", "aesthetic", "appeal", "render", "image"],
        "variables": [
            {"name": "rendering_resolution", "type": "discrete", "role": "independent"},
            {"name": "sampling_rate", "type": "continuous", "role": "independent"},
            {"name": "visual_quality_score", "type": "continuous", "role": "dependent"},
        ],
        "metrics": [
            {"name": "visual_quality", "unit": "score_0_1", "target": 0.85},
            {"name": "render_time", "unit": "seconds", "target": 0.3},
        ],
        "hypotheses": [
            ("Higher sampling rates improve visual quality with diminishing returns",
             "Additional samples reduce noise but computational cost grows linearly"),
            ("Adaptive sampling outperforms uniform sampling at equivalent cost",
             "Concentrating samples in high-variance regions improves perceived quality"),
        ],
        "protocols": [
            "Sweep sampling rate (64, 128, 256, 512) with fixed resolution and measure quality metrics",
            "Compare uniform vs adaptive sampling at matched total sample budgets",
        ],
    },
    {
        "keywords": ["cost", "budget", "efficient", "resource", "compute", "speed"],
        "variables": [
            {"name": "compute_budget", "type": "continuous", "role": "independent"},
            {"name": "algorithm_variant", "type": "categorical", "role": "independent"},
            {"name": "cost_efficiency", "type": "continuous", "role": "dependent"},
        ],
        "metrics": [
            {"name": "cost_efficiency", "unit": "quality_per_second", "target": 0.7},
            {"name": "total_compute_time", "unit": "seconds", "target": 0.5},
        ],
        "hypotheses": [
            ("Early stopping at convergence thresholds reduces compute without quality loss",
             "Many iterations yield diminishing quality improvements past a convergence point"),
            ("Coarse-to-fine progressive evaluation achieves target quality faster",
             "Starting at low resolution and refining focuses compute on promising candidates"),
        ],
        "protocols": [
            "Run full vs early-stopped evaluation and compare quality-per-second across budgets",
            "Compare single-resolution vs progressive evaluation pipelines at matched quality targets",
        ],
    },
]


def compile_plan(
    db: Session,
    project_id: str,
    goal_text: str,
) -> dict[str, Any]:
    from app.config import settings

    if settings.scoring_mode == "gemini" and settings.gemini_api_key:
        try:
            return _compile_plan_gemini(
                db, project_id, goal_text,
                api_key=settings.gemini_api_key,
                model_id=settings.gemini_model_id,
            )
        except Exception:
            logger.warning(
                "Gemini plan compilation failed, falling back to stub",
                exc_info=True,
            )
            return _compile_plan_stub(db, project_id, goal_text)

    return _compile_plan_stub(db, project_id, goal_text)


def _compile_plan_gemini(
    db: Session,
    project_id: str,
    goal_text: str,
    api_key: str,
    model_id: str,
) -> dict[str, Any]:
    from google import genai
    from google.genai import types

    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "variables": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "name": types.Schema(type=types.Type.STRING),
                        "type": types.Schema(type=types.Type.STRING),
                        "role": types.Schema(type=types.Type.STRING),
                    },
                    required=["name", "type", "role"],
                ),
            ),
            "metrics": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "name": types.Schema(type=types.Type.STRING),
                        "unit": types.Schema(type=types.Type.STRING),
                        "target": types.Schema(type=types.Type.NUMBER),
                    },
                    required=["name", "unit", "target"],
                ),
            ),
            "success_criteria": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING),
            ),
            "constraints": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(type=types.Type.STRING),
            ),
            "hypotheses": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "text": types.Schema(type=types.Type.STRING),
                        "rationale": types.Schema(type=types.Type.STRING),
                    },
                    required=["text", "rationale"],
                ),
            ),
            "protocols": types.Schema(
                type=types.Type.ARRAY,
                items=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "description": types.Schema(type=types.Type.STRING),
                        "evaluator_config": types.Schema(type=types.Type.STRING),
                        "hypothesis_index": types.Schema(type=types.Type.INTEGER),
                    },
                    required=["description", "evaluator_config", "hypothesis_index"],
                ),
            ),
        },
        required=["variables", "metrics", "success_criteria", "constraints", "hypotheses", "protocols"],
    )

    client = genai.Client(api_key=api_key)
    prompt = _PLAN_PROMPT.format(goal_text=goal_text)

    t0 = time.monotonic()
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.0,
            response_mime_type="application/json",
            response_schema=response_schema,
        ),
    )
    latency_ms = (time.monotonic() - t0) * 1000

    data = json.loads(response.text)

    prompt_tokens = 0
    completion_tokens = 0
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
        completion_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

    variables = data.get("variables", [])
    metrics = data.get("metrics", [])
    success_criteria = data.get("success_criteria", [])
    constraints = data.get("constraints", [])

    plan = ResearchPlan(
        project_id=project_id,
        objective=goal_text,
        variables_json=json.dumps(variables),
        metrics_json=json.dumps(metrics),
        success_criteria_json=json.dumps(success_criteria),
        constraints_json=json.dumps(constraints),
        version=1,
        model_provider="gemini",
        model_id=model_id,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
    )
    db.add(plan)
    db.flush()

    hypotheses_data = data.get("hypotheses", [])
    protocols_data = data.get("protocols", [])
    hypothesis_ids: list[str] = []

    for i, h in enumerate(hypotheses_data):
        hyp = PlanHypothesis(
            plan_id=plan.id,
            text=h.get("text", f"Hypothesis {i + 1}"),
            rationale=h.get("rationale", "Generated by Gemini"),
            sequence=i,
        )
        db.add(hyp)
        db.flush()
        hypothesis_ids.append(hyp.id)

    for i, p in enumerate(protocols_data):
        h_idx = p.get("hypothesis_index", min(i, len(hypothesis_ids) - 1))
        h_idx = max(0, min(h_idx, len(hypothesis_ids) - 1)) if hypothesis_ids else 0
        linked_id = hypothesis_ids[h_idx] if hypothesis_ids else None

        proto = PlanProtocol(
            plan_id=plan.id,
            hypothesis_id=linked_id,
            description=p.get("description", f"Protocol {i + 1}"),
            evaluator_config_json=p.get("evaluator_config", json.dumps({"evaluator": "default", "seed": 42})),
            sequence=i,
        )
        db.add(proto)
        db.flush()

    _record_version(db, plan, "Initial Gemini compilation")

    return _plan_dict(db, plan)


def _compile_plan_stub(
    db: Session,
    project_id: str,
    goal_text: str,
) -> dict[str, Any]:
    goal_lower = goal_text.lower()

    variables = None
    metrics = None
    hypotheses_raw = None
    protocols_raw = None

    for pattern in _GOAL_PATTERNS:
        if any(kw in goal_lower for kw in pattern["keywords"]):
            variables = pattern["variables"]
            metrics = pattern["metrics"]
            hypotheses_raw = pattern["hypotheses"]
            protocols_raw = pattern["protocols"]
            break

    if variables is None:
        variables = [
            {"name": "independent_var", "type": "continuous", "role": "independent"},
            {"name": "dependent_var", "type": "continuous", "role": "dependent"},
        ]
        metrics = [
            {"name": "coverage_fraction", "unit": "fraction", "target": 0.8},
        ]
        hypotheses_raw = [
            (f"Varying the primary factor will improve outcomes for: {goal_text}",
             "Default exploratory hypothesis from goal decomposition"),
            (f"Interaction effects between factors dominate for: {goal_text}",
             "Multi-factor interactions may explain variance better than single-factor changes"),
        ]
        protocols_raw = [
            f"Run bounded experiment varying primary factor and measuring outcome for: {goal_text}",
            f"Run factorial design to test interaction effects for: {goal_text}",
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

    hypothesis_ids: list[str] = []
    for i, (text, rationale) in enumerate(hypotheses_raw):
        h = PlanHypothesis(
            plan_id=plan.id,
            text=text,
            rationale=rationale,
            sequence=i,
        )
        db.add(h)
        db.flush()
        hypothesis_ids.append(h.id)

    for i, desc in enumerate(protocols_raw):
        linked_id = hypothesis_ids[min(i, len(hypothesis_ids) - 1)]
        p = PlanProtocol(
            plan_id=plan.id,
            hypothesis_id=linked_id,
            description=desc,
            evaluator_config_json=json.dumps({"evaluator": "default", "seed": 42}),
            sequence=i,
        )
        db.add(p)
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
