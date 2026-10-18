from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.portfolio import (
    AgendaPriority,
    PortfolioComparison,
    PortfolioStrategy,
    StrategyVersion,
)
from app.models.project import AgendaItem, ExperimentRun


def create_strategy(
    db: Session,
    project_id: str,
    name: str,
    description: str | None = None,
    parameters_json: str | None = None,
    status: str = "active",
) -> PortfolioStrategy:
    strategy = PortfolioStrategy(
        project_id=project_id,
        name=name,
        description=description,
        parameters_json=parameters_json,
        version=1,
        status=status,
    )
    db.add(strategy)
    db.flush()

    # Record initial version snapshot
    snapshot = StrategyVersion(
        strategy_id=strategy.id,
        version=1,
        parameters_snapshot_json=parameters_json,
    )
    db.add(snapshot)
    db.flush()
    return strategy


def update_strategy(
    db: Session,
    strategy_id: str,
    name: str | None = None,
    description: str | None = None,
    parameters_json: str | None = None,
    status: str | None = None,
) -> PortfolioStrategy:
    strategy = db.query(PortfolioStrategy).filter(
        PortfolioStrategy.id == strategy_id
    ).first()
    if not strategy:
        raise ValueError("Strategy not found")

    if name is not None:
        strategy.name = name
    if description is not None:
        strategy.description = description
    if parameters_json is not None:
        strategy.parameters_json = parameters_json
    if status is not None:
        strategy.status = status

    strategy.version += 1
    strategy.updated_at = datetime.now(timezone.utc)
    db.flush()

    # Record version snapshot
    snapshot = StrategyVersion(
        strategy_id=strategy.id,
        version=strategy.version,
        parameters_snapshot_json=strategy.parameters_json,
    )
    db.add(snapshot)
    db.flush()
    return strategy


def compare_strategies(
    db: Session,
    project_id: str,
    strategy_a_id: str,
    strategy_b_id: str,
    metric_name: str = "overall_score",
) -> PortfolioComparison:
    """Compare two strategies by aggregating outcomes from experiment runs.

    Returns "insufficient_data" as winner if fewer than 2 runs exist
    for either strategy.
    """
    strategy_a = db.query(PortfolioStrategy).filter(
        PortfolioStrategy.id == strategy_a_id
    ).first()
    strategy_b = db.query(PortfolioStrategy).filter(
        PortfolioStrategy.id == strategy_b_id
    ).first()
    if not strategy_a or not strategy_b:
        raise ValueError("One or both strategies not found")

    # Aggregate runs associated with each strategy via parameters_json match
    runs_a = _get_strategy_runs(db, project_id, strategy_a)
    runs_b = _get_strategy_runs(db, project_id, strategy_b)

    insufficient = len(runs_a) < 2 or len(runs_b) < 2

    value_a = _aggregate_metric(runs_a, metric_name)
    value_b = _aggregate_metric(runs_b, metric_name)

    if insufficient:
        winner = "tie"
        confidence = 0.0
        suggestion = (
            "Insufficient data to draw conclusions. "
            "Consider running more experiments before comparing strategies."
        )
        data_mode = "insufficient_data"
    else:
        diff = abs(value_a - value_b)
        total = value_a + value_b if (value_a + value_b) > 0 else 1.0
        confidence = min(diff / total, 1.0)

        if value_a > value_b:
            winner = "a"
        elif value_b > value_a:
            winner = "b"
        else:
            winner = "tie"

        suggestion = _generate_suggestion(winner, confidence, strategy_a.name, strategy_b.name)
        data_mode = "measured"

    comparison = PortfolioComparison(
        project_id=project_id,
        strategy_a_id=strategy_a_id,
        strategy_b_id=strategy_b_id,
        metric_name=metric_name,
        value_a=value_a,
        value_b=value_b,
        winner=winner,
        confidence=confidence,
        suggestion=suggestion,
        data_mode=data_mode,
    )
    db.add(comparison)
    db.flush()
    return comparison


def rank_priorities(
    db: Session,
    project_id: str,
    strategy_id: str | None = None,
) -> list[AgendaPriority]:
    """Rank queued agenda items by strategy-weighted priority."""
    items = (
        db.query(AgendaItem)
        .filter(
            AgendaItem.project_id == project_id,
            AgendaItem.status == "queued",
        )
        .all()
    )

    strategy = None
    if strategy_id:
        strategy = db.query(PortfolioStrategy).filter(
            PortfolioStrategy.id == strategy_id
        ).first()

    scored: list[tuple[AgendaItem, float, str]] = []
    for item in items:
        base_score = item.priority
        weight = 1.0

        if strategy and strategy.parameters_json:
            try:
                params = json.loads(strategy.parameters_json)
                weight = params.get("priority_weight", 1.0)
            except (json.JSONDecodeError, TypeError):
                pass

        score = base_score * weight
        rationale = f"Base priority {base_score:.2f} weighted by strategy factor {weight:.2f}"
        scored.append((item, score, rationale))

    scored.sort(key=lambda x: x[1], reverse=True)

    # Clear old priorities for this project/strategy combination
    old = db.query(AgendaPriority).filter(
        AgendaPriority.project_id == project_id,
    )
    if strategy_id:
        old = old.filter(AgendaPriority.strategy_id == strategy_id)
    old.delete()
    db.flush()

    priorities = []
    for rank, (item, score, rationale) in enumerate(scored, start=1):
        p = AgendaPriority(
            project_id=project_id,
            agenda_item_id=item.id,
            strategy_id=strategy_id,
            rank=rank,
            score=score,
            rationale=rationale,
        )
        db.add(p)
        priorities.append(p)

    db.flush()
    return priorities


def suggest_next(
    db: Session,
    project_id: str,
    strategy_id: str | None = None,
) -> dict[str, Any]:
    """Return a guarded suggestion for the next action, never assertive."""
    priorities = rank_priorities(db, project_id, strategy_id)

    if not priorities:
        return {
            "suggestion": "There may not be enough queued items to suggest a next action. "
                          "Consider adding more agenda items to explore.",
            "confidence": 0.0,
            "agenda_item_id": None,
            "rationale": "No queued agenda items found for this project.",
        }

    top = priorities[0]
    item = db.query(AgendaItem).filter(AgendaItem.id == top.agenda_item_id).first()

    confidence = min(top.score / 10.0, 1.0) if top.score > 0 else 0.1

    question_text = item.question if item else "Unknown item"
    suggestion = _guarded_suggestion(question_text, confidence)

    return {
        "suggestion": suggestion,
        "confidence": confidence,
        "agenda_item_id": top.agenda_item_id,
        "rationale": top.rationale or "Ranked by strategy-weighted priority.",
    }


# ---- Internal helpers ----


def _get_strategy_runs(
    db: Session,
    project_id: str,
    strategy: PortfolioStrategy,
) -> list[ExperimentRun]:
    """Get experiment runs associated with a strategy.

    Matches by parameters_json containing the strategy name or by project.
    """
    runs = (
        db.query(ExperimentRun)
        .filter(ExperimentRun.project_id == project_id)
        .all()
    )
    matched = []
    for run in runs:
        if run.parameters_json:
            try:
                params = json.loads(run.parameters_json)
                if params.get("strategy_id") == strategy.id:
                    matched.append(run)
                    continue
            except (json.JSONDecodeError, TypeError):
                pass
        # If no parameters match, still count runs under the project
        # (fallback for when runs aren't explicitly tagged to strategies)
    return matched


def _aggregate_metric(runs: list[ExperimentRun], metric_name: str) -> float:
    """Average a named metric across runs. Returns 0.0 if no data."""
    values = []
    for run in runs:
        if run.metrics_json:
            try:
                metrics = json.loads(run.metrics_json)
                if metric_name in metrics:
                    values.append(float(metrics[metric_name]))
            except (json.JSONDecodeError, TypeError, ValueError):
                pass
    return sum(values) / len(values) if values else 0.0


def _generate_suggestion(
    winner: str,
    confidence: float,
    name_a: str,
    name_b: str,
) -> str:
    """Generate guarded language about a comparison result."""
    if winner == "tie":
        return (
            f"The data suggests no clear difference between '{name_a}' and "
            f"'{name_b}'. Further experimentation might help clarify."
        )

    winner_name = name_a if winner == "a" else name_b
    if confidence >= 0.7:
        return (
            f"The evidence tentatively favors '{winner_name}', though "
            f"additional validation would strengthen this conclusion."
        )
    elif confidence >= 0.3:
        return (
            f"There appears to be a slight edge for '{winner_name}', "
            f"but confidence is moderate. More data could help."
        )
    else:
        return (
            f"'{winner_name}' shows marginally better results, but the "
            f"difference is small. Consider this a preliminary indication."
        )


def _guarded_suggestion(question: str, confidence: float) -> str:
    """Return a suggestion using guarded, non-assertive language."""
    if confidence >= 0.7:
        return (
            f"It might be worth exploring: {question}. "
            "This appears to be a relatively high-priority item, "
            "though further analysis could refine this assessment."
        )
    elif confidence >= 0.3:
        return (
            f"Consider looking into: {question}. "
            "This seems moderately important based on current data, "
            "but priorities may shift as more information becomes available."
        )
    else:
        return (
            f"One possibility to explore: {question}. "
            "Current data is limited, so this suggestion should be "
            "treated as preliminary."
        )
