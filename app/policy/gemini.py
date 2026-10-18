from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

from google import genai
from google.genai import types

from app.policy.candidates import Candidate

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE_VERSION = "1.0"
CALIBRATION_VERSION = "1.0"

_SCORING_DIMS = ("visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency")

_SCENE_DESCRIPTION = (
    "Scene: a unit cube centered at the origin [-0.5, 0.5]^3 with 150 surface "
    "sample points (25 per face, fixed grid). The task is 3D reconstruction via "
    "camera-based observation."
)

_DIMENSION_DEFINITIONS = """Rate this viewpoint on each dimension from 0.0 to 1.0:
- visual_appeal: How aesthetically pleasing and well-composed is this viewpoint for observation?
- geometric_coverage: How much of the scene's surface geometry can be observed from this viewpoint?
- info_gain: How much new geometric information does this viewpoint provide?
- cost_efficiency: How resource-efficient is acquiring this viewpoint (closer = cheaper)?"""

_UNCONDITIONED_PROMPT = """You are an objective evaluator of camera viewpoints for 3D reconstruction experiments.

{scene}

Candidate viewpoint: {candidate_id} ({candidate_label})
Camera position: eye={eye}, looking at target={target}

{dimensions}

Return a JSON object with exactly these fields:
- visual_appeal: float (0.0 to 1.0)
- geometric_coverage: float (0.0 to 1.0)
- info_gain: float (0.0 to 1.0)
- cost_efficiency: float (0.0 to 1.0)
- rationale: string (brief explanation of your ratings)
- confidence: float (0.0 to 1.0, how confident you are in these ratings)"""

_CONDITIONED_PROMPT = """You are evaluating camera viewpoints for 3D reconstruction experiments, informed by a researcher's stated priorities.

{scene}

Candidate viewpoint: {candidate_id} ({candidate_label})
Camera position: eye={eye}, looking at target={target}

Research context from the human investigator:
Principles: {principles}
These priorities shape what makes a viewpoint valuable for this researcher's goals.

{dimensions}

Return a JSON object with exactly these fields:
- visual_appeal: float (0.0 to 1.0)
- geometric_coverage: float (0.0 to 1.0)
- info_gain: float (0.0 to 1.0)
- cost_efficiency: float (0.0 to 1.0)
- rationale: string (brief explanation of your ratings, considering the researcher's priorities)
- confidence: float (0.0 to 1.0, how confident you are in these ratings)"""

_RESPONSE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "visual_appeal": types.Schema(type=types.Type.NUMBER),
        "geometric_coverage": types.Schema(type=types.Type.NUMBER),
        "info_gain": types.Schema(type=types.Type.NUMBER),
        "cost_efficiency": types.Schema(type=types.Type.NUMBER),
        "rationale": types.Schema(type=types.Type.STRING),
        "confidence": types.Schema(type=types.Type.NUMBER),
    },
    required=["visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency", "rationale", "confidence"],
)


class ScoringError(Exception):
    pass


@dataclass(frozen=True)
class RubricResult:
    scores: dict[str, float]
    rationale: str
    confidence: float
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: float = 0.0


class GeminiScoringClient:
    def __init__(self, api_key: str, model_id: str = "gemini-2.0-flash", temperature: float = 0.0):
        self._client = genai.Client(api_key=api_key)
        self.model_id = model_id
        self._temperature = temperature
        self._last_error: str | None = None

    def evaluate_unconditioned(self, candidate: Candidate) -> RubricResult:
        prompt = _UNCONDITIONED_PROMPT.format(
            scene=_SCENE_DESCRIPTION,
            candidate_id=candidate.id,
            candidate_label=candidate.label,
            eye=candidate.eye,
            target=candidate.target,
            dimensions=_DIMENSION_DEFINITIONS,
        )
        return self._call(prompt)

    def evaluate_conditioned(self, candidate: Candidate, human_context: dict) -> RubricResult:
        principles = human_context.get("principles", [])
        prompt = _CONDITIONED_PROMPT.format(
            scene=_SCENE_DESCRIPTION,
            candidate_id=candidate.id,
            candidate_label=candidate.label,
            eye=candidate.eye,
            target=candidate.target,
            principles="; ".join(principles) if principles else "(none stated)",
            dimensions=_DIMENSION_DEFINITIONS,
        )
        return self._call(prompt)

    def _call(self, prompt: str) -> RubricResult:
        t0 = time.monotonic()
        try:
            response = self._client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=self._temperature,
                    response_mime_type="application/json",
                    response_schema=_RESPONSE_SCHEMA,
                ),
            )
        except Exception as exc:
            self._last_error = str(exc)
            raise ScoringError(f"Gemini API call failed: {exc}") from exc

        latency_ms = (time.monotonic() - t0) * 1000

        try:
            import json
            data = json.loads(response.text)
        except (json.JSONDecodeError, TypeError, AttributeError) as exc:
            self._last_error = f"Invalid response: {exc}"
            raise ScoringError(f"Failed to parse Gemini response: {exc}") from exc

        scores: dict[str, float] = {}
        for dim in _SCORING_DIMS:
            val = data.get(dim)
            if val is None or not isinstance(val, (int, float)):
                self._last_error = f"Missing or invalid dimension: {dim}"
                raise ScoringError(f"Missing or invalid rubric dimension: {dim}")
            if not (0.0 <= float(val) <= 1.0):
                self._last_error = f"Dimension {dim} out of range: {val}"
                raise ScoringError(f"Rubric dimension {dim} out of [0,1]: {val}")
            scores[dim] = float(val)

        prompt_tokens = 0
        completion_tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
            completion_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

        self._last_error = None
        return RubricResult(
            scores=scores,
            rationale=data.get("rationale", ""),
            confidence=float(data.get("confidence", 0.5)),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
        )

    def check_health(self) -> dict[str, Any]:
        from datetime import datetime, timezone
        try:
            self._client.models.get(model=self.model_id)
            connected = True
            error = None
        except Exception as exc:
            connected = False
            error = str(exc)
            self._last_error = error

        return {
            "provider": "gemini",
            "connected": connected,
            "mode": "live",
            "model_id": self.model_id,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "last_error": error or self._last_error,
        }


def build_unconditioned_prompt(candidate: Candidate) -> str:
    return _UNCONDITIONED_PROMPT.format(
        scene=_SCENE_DESCRIPTION,
        candidate_id=candidate.id,
        candidate_label=candidate.label,
        eye=candidate.eye,
        target=candidate.target,
        dimensions=_DIMENSION_DEFINITIONS,
    )


def build_conditioned_prompt(candidate: Candidate, human_context: dict) -> str:
    principles = human_context.get("principles", [])
    return _CONDITIONED_PROMPT.format(
        scene=_SCENE_DESCRIPTION,
        candidate_id=candidate.id,
        candidate_label=candidate.label,
        eye=candidate.eye,
        target=candidate.target,
        principles="; ".join(principles) if principles else "(none stated)",
        dimensions=_DIMENSION_DEFINITIONS,
    )


_SUBPROBLEM_PROMPT = """You are a research agent analyzing the results of a 3D reconstruction experiment that failed to meet its coverage target.

{scene}

Experiment results:
- Coverage threshold required: {threshold:.2%}
- Best coverage achieved: {best_coverage:.2%}
- Gap: {gap:.2%}

Per-camera results:
{per_camera_results}

Based on this evidence, generate a research hypothesis about why coverage was insufficient and propose a concrete next step to improve it.

Return a JSON object with exactly these fields:
- question: string (the research question to investigate, 1-2 sentences)
- hypothesis: string (your hypothesis about the coverage gap, grounded in the per-camera evidence)
- proposed_action: string (a concrete next step to test the hypothesis)
- rationale: string (why this hypothesis and action are the most promising based on the evidence)"""

_SUBPROBLEM_RESPONSE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "question": types.Schema(type=types.Type.STRING),
        "hypothesis": types.Schema(type=types.Type.STRING),
        "proposed_action": types.Schema(type=types.Type.STRING),
        "rationale": types.Schema(type=types.Type.STRING),
    },
    required=["question", "hypothesis", "proposed_action", "rationale"],
)


@dataclass(frozen=True)
class SubproblemResult:
    question: str
    hypothesis: str
    proposed_action: str
    rationale: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: float = 0.0


def generate_subproblem(
    evidence: dict[str, Any],
    api_key: str,
    model_id: str = "gemini-2.0-flash",
    temperature: float = 0.0,
) -> SubproblemResult:
    client = genai.Client(api_key=api_key)

    per_camera_lines = []
    for run in evidence.get("runs", []):
        params = run.get("parameters_json", {})
        label = params.get("camera_label", "unknown")
        eye = params.get("eye", [])
        cov = run.get("coverage_fraction", 0.0)
        per_camera_lines.append(f"  - {label} (eye={eye}): coverage={cov:.2%}")

    prompt = _SUBPROBLEM_PROMPT.format(
        scene=_SCENE_DESCRIPTION,
        threshold=evidence.get("threshold", 1.0),
        best_coverage=evidence.get("best_coverage", 0.0),
        gap=evidence.get("threshold", 1.0) - evidence.get("best_coverage", 0.0),
        per_camera_results="\n".join(per_camera_lines) if per_camera_lines else "  (no per-camera data)",
    )

    t0 = time.monotonic()
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            response_mime_type="application/json",
            response_schema=_SUBPROBLEM_RESPONSE_SCHEMA,
        ),
    )
    latency_ms = (time.monotonic() - t0) * 1000

    import json as _json
    data = _json.loads(response.text)

    prompt_tokens = 0
    completion_tokens = 0
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        prompt_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
        completion_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

    return SubproblemResult(
        question=data["question"],
        hypothesis=data["hypothesis"],
        proposed_action=data["proposed_action"],
        rationale=data["rationale"],
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
    )
