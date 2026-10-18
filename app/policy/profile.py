from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.profile import ProfileVersion, ResearcherPrinciple, ResearcherProfile
from app.policy.scoring import U_WEIGHTS

logger = logging.getLogger(__name__)

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

_JUDGMENT_EXTRACTION_PROMPT = """You are an expert at interpreting human research judgments and translating them into scoring dimension adjustments.

Given a researcher's judgment text, extract how it should adjust the scoring weights for a 3D reconstruction experiment evaluation system.

Researcher's judgment: "{text}"

Scoring dimensions (each adjustment should be between -1.0 and 1.0):
- visual_appeal: How aesthetically pleasing viewpoints are valued
- geometric_coverage: How much surface geometry observation is valued
- info_gain: How much new geometric information is valued
- cost_efficiency: How resource-efficient acquisition is valued

Return a JSON object with exactly these fields:
- visual_appeal: float (-1.0 to 1.0, adjustment)
- geometric_coverage: float (-1.0 to 1.0, adjustment)
- info_gain: float (-1.0 to 1.0, adjustment)
- cost_efficiency: float (-1.0 to 1.0, adjustment)"""


def _compile_judgment_stub(text: str) -> dict[str, float]:
    """Stub extraction: keyword pattern matching."""
    text_lower = text.lower()
    for pattern in _KNOWN_PATTERNS:
        if any(kw in text_lower for kw in pattern["keywords"]):
            return dict(pattern["adjustments"])
    return {dim: 0.0 for dim in _SCORING_DIMS}


def _compile_judgment_gemini(text: str, api_key: str, model_id: str) -> dict[str, float]:
    """Gemini extraction: send text to structured JSON, return dimension adjustments."""
    from google import genai
    from google.genai import types

    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "visual_appeal": types.Schema(type=types.Type.NUMBER),
            "geometric_coverage": types.Schema(type=types.Type.NUMBER),
            "info_gain": types.Schema(type=types.Type.NUMBER),
            "cost_efficiency": types.Schema(type=types.Type.NUMBER),
        },
        required=["visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency"],
    )

    client = genai.Client(api_key=api_key)
    prompt = _JUDGMENT_EXTRACTION_PROMPT.format(text=text)

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

    adjustments: dict[str, float] = {}
    for dim in _SCORING_DIMS:
        val = data.get(dim, 0.0)
        adjustments[dim] = max(-1.0, min(1.0, float(val)))

    logger.info(
        "Gemini judgment extraction: latency=%.0fms adjustments=%s",
        latency_ms, adjustments,
    )
    return adjustments


def compile_judgment(text: str) -> dict[str, float]:
    from app.config import settings

    if settings.scoring_mode == "gemini" and settings.gemini_api_key:
        try:
            return _compile_judgment_gemini(
                text,
                api_key=settings.gemini_api_key,
                model_id=settings.gemini_model_id,
            )
        except Exception:
            logger.warning(
                "Gemini judgment extraction failed, falling back to stub",
                exc_info=True,
            )
            return _compile_judgment_stub(text)

    return _compile_judgment_stub(text)


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
