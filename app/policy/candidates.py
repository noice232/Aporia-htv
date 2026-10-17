from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Candidate:
    id: str
    label: str
    eye: tuple[float, float, float]
    target: tuple[float, float, float]
    attributes: dict[str, float] = field(default_factory=dict)
    feasible: bool = True
    infeasibility_reason: str | None = None


DEFAULT_CANDIDATES: list[Candidate] = [
    Candidate(
        id="A",
        label="attractive_front",
        eye=(3.0, 0.0, 0.0),
        target=(0.0, 0.0, 0.0),
        attributes={
            "visual_appeal": 1.0,
            "geometric_coverage": 0.3,
            "info_gain": 0.9,
            "cost_efficiency": 1.0,
            "evidence_quality": 0.9,
            "estimated_cost": 0.2,
        },
    ),
    Candidate(
        id="B",
        label="corner_coverage",
        eye=(1.7, 1.7, 1.7),
        target=(0.0, 0.0, 0.0),
        attributes={
            "visual_appeal": 0.2,
            "geometric_coverage": 1.0,
            "info_gain": 0.6,
            "cost_efficiency": 0.7,
            "evidence_quality": 0.7,
            "estimated_cost": 0.5,
        },
    ),
    Candidate(
        id="C",
        label="top_down",
        eye=(0.0, 3.0, 0.0),
        target=(0.0, 0.0, 0.0),
        attributes={
            "visual_appeal": 0.5,
            "geometric_coverage": 0.4,
            "info_gain": 0.6,
            "cost_efficiency": 0.9,
            "evidence_quality": 0.5,
            "estimated_cost": 0.3,
        },
    ),
    Candidate(
        id="D",
        label="diagonal_sweep",
        eye=(2.0, 2.0, 1.0),
        target=(0.0, 0.0, 0.0),
        attributes={
            "visual_appeal": 0.4,
            "geometric_coverage": 0.8,
            "info_gain": 0.7,
            "cost_efficiency": 0.6,
            "evidence_quality": 0.6,
            "estimated_cost": 0.6,
        },
    ),
    Candidate(
        id="E",
        label="extreme_close",
        eye=(1.0, 0.5, 0.5),
        target=(0.0, 0.0, 0.0),
        attributes={
            "visual_appeal": 0.8,
            "geometric_coverage": 0.5,
            "info_gain": 0.8,
            "cost_efficiency": 0.5,
            "evidence_quality": 0.8,
            "estimated_cost": 0.7,
        },
    ),
    Candidate(
        id="F",
        label="over_budget",
        eye=(2.0, 2.0, 2.0),
        target=(0.0, 0.0, 0.0),
        attributes={
            "visual_appeal": 0.9,
            "geometric_coverage": 0.95,
            "info_gain": 0.9,
            "cost_efficiency": 0.8,
            "evidence_quality": 0.85,
            "estimated_cost": 0.9,
        },
        feasible=False,
        infeasibility_reason="exceeds_budget",
    ),
]


DEFAULT_HUMAN_CONTEXT: dict = {
    "principles": ["geometric_consistency", "thorough_coverage"],
    "scoring_weights": {
        "visual_appeal": 0.00,
        "geometric_coverage": 0.70,
        "info_gain": 0.10,
        "cost_efficiency": 0.20,
    },
}
