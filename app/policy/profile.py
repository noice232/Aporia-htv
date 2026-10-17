from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.profile import ProfileVersion, ResearcherPrinciple, ResearcherProfile
from app.policy.scoring import U_WEIGHTS

_SCORING_DIMS = list(U_WEIGHTS.keys())

_KNOWN_PATTERNS: list[dict[str, Any]] = [
    {
        "keywords": ["geometry", "geometric", "coverage", "consistent"],
        "adjustments": {
            "visual_appeal": -0.30,
            "geometric_coverage": 0.45,
            "info_gain": -0.15,
            "cost_efficiency": 0.00,
        },
    },
    {
        "keywords": ["visual", "appeal", "aesthetic", "attractive"],
        "adjustments": {
            "visual_appeal": 0.45,
            "geometric_coverage": -0.25,
            "info_gain": -0.10,
            "cost_efficiency": -0.10,
        },
    },
    {
        "keywords": ["cost", "budget", "efficient", "cheap"],
        "adjustments": {
            "visual_appeal": -0.10,
            "geometric_coverage": -0.05,
            "info_gain": -0.05,
            "cost_efficiency": 0.20,
        },
    },
]


def compile_judgment(text: str) -> dict[str, float]:
    text_lower = text.lower()
    for pattern in _KNOWN_PATTERNS:
        if any(kw in text_lower for kw in pattern["keywords"]):
            return dict(pattern["adjustments"])
    return {dim: 0.0 for dim in _SCORING_DIMS}


def _get_or_create_profile(db: Session, project_id: str) -> ResearcherProfile:
    profile = db.query(ResearcherProfile).filter(
        ResearcherProfile.project_id == project_id
    ).first()
    if profile:
        return profile

    profile = ResearcherProfile(project_id=project_id)
    db.add(profile)
    db.flush()

    _record_snapshot(db, profile)
    return profile


def _record_snapshot(db: Session, profile: ResearcherProfile) -> None:
    principles = db.query(ResearcherPrinciple).filter(
        ResearcherPrinciple.profile_id == profile.id
    ).all()

    snapshot = [
        {
            "id": p.id,
            "text": p.text,
            "source": p.source,
            "scope": p.scope,
            "confidence": p.confidence,
            "enabled": p.enabled,
            "approved": p.approved,
            "weight_adjustments": json.loads(p.weight_adjustments_json),
        }
        for p in principles
    ]

    pv = ProfileVersion(
        profile_id=profile.id,
        version=profile.version,
        principles_snapshot_json=json.dumps(snapshot),
    )
    db.add(pv)
    db.flush()


def bump_version(db: Session, profile: ResearcherProfile) -> None:
    profile.version += 1
    profile.updated_at = datetime.now(timezone.utc)
    db.flush()
    _record_snapshot(db, profile)


def build_human_context(db: Session, project_id: str) -> dict | None:
    profile = db.query(ResearcherProfile).filter(
        ResearcherProfile.project_id == project_id
    ).first()
    if not profile:
        return None

    active = db.query(ResearcherPrinciple).filter(
        ResearcherPrinciple.profile_id == profile.id,
        ResearcherPrinciple.enabled == True,  # noqa: E712
        ResearcherPrinciple.approved == True,  # noqa: E712
    ).all()

    if not active:
        return None

    weights = dict(U_WEIGHTS)
    for p in active:
        adjs = json.loads(p.weight_adjustments_json)
        for dim in _SCORING_DIMS:
            weights[dim] += adjs.get(dim, 0.0) * p.confidence

    for dim in _SCORING_DIMS:
        weights[dim] = max(weights[dim], 0.0)

    total = sum(weights.values())
    if total > 0:
        for dim in _SCORING_DIMS:
            weights[dim] = round(weights[dim] / total, 10)

    return {
        "principles": [p.text for p in active],
        "scoring_weights": weights,
    }
