from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from app.policy.candidates import Candidate

logger = logging.getLogger(__name__)

U_WEIGHTS: dict[str, float] = {
    "visual_appeal": 0.30,
    "geometric_coverage": 0.25,
    "info_gain": 0.25,
    "cost_efficiency": 0.20,
}

_SCORING_DIMS = ("visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency")

_gemini_client = None


@dataclass
class ScoringProvenance:
    provider: str = "stub"
    model_id: str | None = None
    prompt_template_version: str | None = None
    calibration_version: str | None = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: float = 0.0
    rationale: str | None = None

_last_provenance_u: dict[str, ScoringProvenance] = {}
_last_provenance_c: dict[str, ScoringProvenance] = {}


def get_last_provenance() -> tuple[dict[str, ScoringProvenance], dict[str, ScoringProvenance]]:
    return _last_provenance_u, _last_provenance_c


def clear_provenance() -> None:
    _last_provenance_u.clear()
    _last_provenance_c.clear()


def _get_gemini_client():
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client
    from app.config import settings
    if settings.scoring_mode != "gemini" or not settings.gemini_api_key:
        return None
    from app.policy.gemini import GeminiScoringClient
    _gemini_client = GeminiScoringClient(
        api_key=settings.gemini_api_key,
        model_id=settings.gemini_model_id,
    )
    return _gemini_client


def reset_gemini_client() -> None:
    global _gemini_client
    _gemini_client = None


def _stub_rubric(candidate: Candidate) -> dict[str, float]:
    return {dim: candidate.attributes[dim] for dim in _SCORING_DIMS}


def _get_rubric_unconditioned(candidate: Candidate) -> tuple[dict[str, float], ScoringProvenance]:
    from app.config import settings
    if settings.scoring_mode == "gemini":
        client = _get_gemini_client()
        if client:
            try:
                from app.policy.gemini import PROMPT_TEMPLATE_VERSION, CALIBRATION_VERSION
                result = client.evaluate_unconditioned(candidate)
                prov = ScoringProvenance(
                    provider="gemini",
                    model_id=client.model_id,
                    prompt_template_version=PROMPT_TEMPLATE_VERSION,
                    calibration_version=CALIBRATION_VERSION,
                    prompt_tokens=result.prompt_tokens,
                    completion_tokens=result.completion_tokens,
                    latency_ms=result.latency_ms,
                    rationale=result.rationale,
                )
                return result.scores, prov
            except Exception as exc:
                logger.warning("Gemini unconditioned scoring failed, falling back to stub: %s", exc)
    return _stub_rubric(candidate), ScoringProvenance(provider="stub")


def _get_rubric_conditioned(candidate: Candidate, human_context: dict) -> tuple[dict[str, float], ScoringProvenance]:
    from app.config import settings
    if settings.scoring_mode == "gemini":
        client = _get_gemini_client()
        if client:
            try:
                from app.policy.gemini import PROMPT_TEMPLATE_VERSION, CALIBRATION_VERSION
                result = client.evaluate_conditioned(candidate, human_context)
                prov = ScoringProvenance(
                    provider="gemini",
                    model_id=client.model_id,
                    prompt_template_version=PROMPT_TEMPLATE_VERSION,
                    calibration_version=CALIBRATION_VERSION,
                    prompt_tokens=result.prompt_tokens,
                    completion_tokens=result.completion_tokens,
                    latency_ms=result.latency_ms,
                    rationale=result.rationale,
                )
                return result.scores, prov
            except Exception as exc:
                logger.warning("Gemini conditioned scoring failed, falling back to stub: %s", exc)
    return _stub_rubric(candidate), ScoringProvenance(provider="stub")


def score_unconditioned(candidate: Candidate) -> tuple[float, dict[str, float]]:
    rubric, prov = _get_rubric_unconditioned(candidate)
    _last_provenance_u[candidate.id] = prov
    total = 0.0
    for dim in _SCORING_DIMS:
        total += U_WEIGHTS[dim] * rubric[dim]
    total = round(total, 10)
    if not (0.0 <= total <= 1.0):
        raise ValueError(f"Unconditioned score {total} outside [0,1] for {candidate.id}")
    return total, rubric


def score_conditioned(
    candidate: Candidate,
    human_context: dict,
) -> tuple[float, dict[str, float]]:
    if not human_context:
        raise ValueError("human_context is required for conditioned scoring")

    weights = human_context.get("scoring_weights")
    if weights is None:
        raise ValueError("human_context must contain scoring_weights")

    rubric, prov = _get_rubric_conditioned(candidate, human_context)
    _last_provenance_c[candidate.id] = prov
    total = 0.0
    for dim in _SCORING_DIMS:
        w = weights.get(dim, 0.0)
        total += w * rubric[dim]
    total = round(total, 10)
    if not (0.0 <= total <= 1.0):
        raise ValueError(f"Conditioned score {total} outside [0,1] for {candidate.id}")
    return total, rubric
