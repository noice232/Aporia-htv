from __future__ import annotations

from app.policy.candidates import Candidate

U_WEIGHTS: dict[str, float] = {
    "visual_appeal": 0.30,
    "geometric_coverage": 0.25,
    "info_gain": 0.25,
    "cost_efficiency": 0.20,
}

_SCORING_DIMS = ("visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency")


def score_unconditioned(candidate: Candidate) -> tuple[float, dict[str, float]]:
    """Score using ONLY objective evidence. No human context accepted."""
    attrs = candidate.attributes
    rubric: dict[str, float] = {}
    total = 0.0
    for dim in _SCORING_DIMS:
        val = attrs[dim]
        rubric[dim] = val
        total += U_WEIGHTS[dim] * val
    total = round(total, 10)
    if not (0.0 <= total <= 1.0):
        raise ValueError(f"Unconditioned score {total} outside [0,1] for {candidate.id}")
    return total, rubric


def score_conditioned(
    candidate: Candidate,
    human_context: dict,
) -> tuple[float, dict[str, float]]:
    """Score using objective evidence PLUS human researcher context."""
    if not human_context:
        raise ValueError("human_context is required for conditioned scoring")

    weights = human_context.get("scoring_weights")
    if weights is None:
        raise ValueError("human_context must contain scoring_weights")

    attrs = candidate.attributes
    rubric: dict[str, float] = {}
    total = 0.0
    for dim in _SCORING_DIMS:
        w = weights.get(dim, 0.0)
        val = attrs[dim]
        rubric[dim] = val
        total += w * val
    total = round(total, 10)
    if not (0.0 <= total <= 1.0):
        raise ValueError(f"Conditioned score {total} outside [0,1] for {candidate.id}")
    return total, rubric
