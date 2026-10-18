from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sqlalchemy.orm import Session

from app.evaluator import (
    CameraIntrinsics,
    CameraPose,
    __version__ as evaluator_version,
    compute_coverage,
    look_at,
    make_unit_cube_cloud,
)
from app.models.project import AgendaItem, ExperimentRun, Project, ResearchEvent

INTRINSICS = CameraIntrinsics(fx=500.0, fy=500.0, cx=320.0, cy=240.0, width=640, height=480)

_AXIS_CAMERAS: list[tuple[list[float], str]] = [
    ([3, 0, 0], "+X"),
    ([-3, 0, 0], "-X"),
    ([0, 3, 0], "+Y"),
    ([0, -3, 0], "-Y"),
    ([0, 0, 3], "+Z"),
    ([0, 0, -3], "-Z"),
]


def _next_seq(db: Session, project_id: str) -> int:
    from sqlalchemy import func
    cur = db.query(func.max(ResearchEvent.sequence)).filter(
        ResearchEvent.project_id == project_id
    ).scalar()
    return (cur or 0) + 1


def _emit(db: Session, project_id: str, event_type: str,
          entity_id: str | None = None,
          payload: dict[str, Any] | None = None,
          correlation_id: str | None = None) -> ResearchEvent:
    seq = _next_seq(db, project_id)
    evt = ResearchEvent(
        project_id=project_id,
        sequence=seq,
        type=event_type,
        entity_id=entity_id,
        payload_json=json.dumps(payload) if payload else None,
        data_mode="measured",
        correlation_id=correlation_id or str(uuid.uuid4()),
    )
    db.add(evt)
    db.flush()
    return evt


def run_goal(
    db: Session,
    project_id: str,
    threshold: float,
    seed: int = 42,
) -> dict[str, Any]:
    points, normals = make_unit_cube_cloud(points_per_face=25)

    run_summaries: list[dict[str, Any]] = []
    best_coverage = -1.0
    best_run_id: str | None = None

    for eye, label in _AXIS_CAMERAS:
        ext = look_at(np.array(eye, dtype=float), np.array([0.0, 0.0, 0.0]))
        pose = CameraPose(intrinsics=INTRINSICS, extrinsics=ext)

        now = datetime.now(timezone.utc)
        run = ExperimentRun(
            project_id=project_id,
            evaluator_version=evaluator_version,
            seed=seed,
            status="running",
            started_at=now,
            parameters_json=json.dumps({"camera_label": label, "eye": eye}),
            data_mode="measured",
        )
        db.add(run)
        db.flush()

        _emit(db, project_id, "experiment.started", entity_id=run.id,
              payload={"run_id": run.id, "camera_label": label})

        result = compute_coverage(pose, points, normals)

        metrics = {
            "coverage_fraction": result.coverage_fraction,
            "visible_count": result.visible_count,
            "total_count": result.total_count,
        }

        _emit(db, project_id, "metric.recorded", entity_id=run.id,
              payload={"run_id": run.id, "metrics": metrics})

        end_time = datetime.now(timezone.utc)
        run.metrics_json = json.dumps(metrics)
        run.status = "completed"
        run.ended_at = end_time

        _emit(db, project_id, "experiment.completed", entity_id=run.id,
              payload={"run_id": run.id, "coverage_fraction": result.coverage_fraction})

        if result.coverage_fraction > best_coverage:
            best_coverage = result.coverage_fraction
            best_run_id = run.id

        run_summaries.append({
            "id": run.id,
            "evaluator_version": evaluator_version,
            "seed": seed,
            "status": "completed",
            "coverage_fraction": result.coverage_fraction,
            "parameters_json": {"camera_label": label, "eye": eye},
            "started_at": now,
            "ended_at": end_time,
        })

    agenda_item_id: str | None = None

    if best_coverage < threshold:
        evt = _emit(db, project_id, "problem.discovered", entity_id=best_run_id,
                    payload={
                        "best_coverage": best_coverage,
                        "threshold": threshold,
                        "best_run_id": best_run_id,
                        "message": f"Best coverage {best_coverage:.4f} < threshold {threshold:.4f}",
                    })

        template_question = (
            f"Coverage {best_coverage:.2%} below threshold {threshold:.2%} "
            f"— investigate missing geometry or alternative poses"
        )
        question = template_question
        data_mode = "measured"
        sp_provider = None
        sp_model_id = None
        sp_prompt_tokens = None
        sp_completion_tokens = None
        sp_latency_ms = None
        hypothesis_payload: dict[str, Any] = {}

        from app.config import settings
        if settings.scoring_mode == "gemini" and settings.gemini_api_key:
            try:
                from app.policy.gemini import generate_subproblem
                evidence = {
                    "threshold": threshold,
                    "best_coverage": best_coverage,
                    "runs": run_summaries,
                }
                sp_result = generate_subproblem(
                    evidence=evidence,
                    api_key=settings.gemini_api_key,
                    model_id=settings.gemini_model_id,
                )
                question = sp_result.question
                data_mode = "ai_generated"
                sp_provider = "gemini"
                sp_model_id = settings.gemini_model_id
                sp_prompt_tokens = sp_result.prompt_tokens
                sp_completion_tokens = sp_result.completion_tokens
                sp_latency_ms = sp_result.latency_ms
                hypothesis_payload = {
                    "hypothesis": sp_result.hypothesis,
                    "proposed_action": sp_result.proposed_action,
                    "rationale": sp_result.rationale,
                }
            except Exception:
                pass

        item = AgendaItem(
            project_id=project_id,
            question=question,
            status="queued",
            priority=1.0,
            originating_run_id=best_run_id,
            originating_event_id=evt.id,
            dedup_key=f"coverage_gap:{project_id}",
            completion_criteria_json=json.dumps({
                "required_coverage": threshold,
                "current_best": best_coverage,
            }),
            model_provider=sp_provider,
            model_id=sp_model_id,
            generation_prompt_tokens=sp_prompt_tokens,
            generation_completion_tokens=sp_completion_tokens,
            generation_latency_ms=sp_latency_ms,
        )
        db.add(item)
        db.flush()

        agenda_payload: dict[str, Any] = {"agenda_item_id": item.id, "question": item.question, "data_mode": data_mode}
        agenda_payload.update(hypothesis_payload)
        _emit(db, project_id, "agenda.queued", entity_id=item.id, payload=agenda_payload)

        agenda_item_id = item.id

    db.commit()

    return {
        "project_id": project_id,
        "runs": run_summaries,
        "best_coverage": best_coverage,
        "threshold_met": best_coverage >= threshold,
        "agenda_item_id": agenda_item_id,
    }


_CAMERA_STRATEGIES: list[list[tuple[list[float], str]]] = [
    [([3, 0, 0], "+X"), ([-3, 0, 0], "-X"), ([0, 3, 0], "+Y"),
     ([0, -3, 0], "-Y"), ([0, 0, 3], "+Z"), ([0, 0, -3], "-Z")],
    [([2.1, 2.1, 2.1], "diag-+++"), ([-2.1, 2.1, 2.1], "diag--++"),
     ([2.1, -2.1, 2.1], "diag-+-+"), ([-2.1, -2.1, 2.1], "diag---+")],
    [([0, 2.5, 2.5], "edge-YZ+"), ([2.5, 0, 2.5], "edge-XZ+"),
     ([2.5, 2.5, 0], "edge-XY+"), ([0, -2.5, -2.5], "edge-YZ-")],
    [([1.5, 1.5, 3.0], "high-diag1"), ([-1.5, 1.5, 3.0], "high-diag2"),
     ([1.5, -1.5, 3.0], "high-diag3"), ([-1.5, -1.5, 3.0], "high-diag4"),
     ([3.0, 1.5, 1.5], "side-diag1"), ([-3.0, 1.5, 1.5], "side-diag2")],
    [([2.0, 2.0, 0], "mid-XY+"), ([-2.0, 2.0, 0], "mid-XY-"),
     ([0, 2.0, 2.0], "mid-YZ+"), ([0, -2.0, 2.0], "mid-YZ-"),
     ([2.0, 0, 2.0], "mid-XZ+"), ([-2.0, 0, 2.0], "mid-XZ-")],
]


def _perturb_cameras(
    base: list[tuple[list[float], str]], rng: np.random.Generator, scale: float = 0.4,
) -> list[tuple[list[float], str]]:
    result = []
    for eye, label in base:
        perturbed = [e + float(rng.normal(0, scale)) for e in eye]
        norm = max(np.linalg.norm(perturbed), 0.5)
        perturbed = [e * 3.0 / norm for e in perturbed]
        result.append((perturbed, f"{label}~p"))
    return result


def run_autonomous_loop(
    db: Session,
    project_id: str,
    max_iterations: int = 5,
    threshold: float = 0.85,
) -> dict[str, Any]:
    project = db.get(Project, project_id)
    if not project:
        raise ValueError(f"Project {project_id} not found")

    project.research_state = "running"
    db.flush()

    points, normals = make_unit_cube_cloud(points_per_face=25)
    rng = np.random.default_rng(seed=42)
    correlation = str(uuid.uuid4())

    all_summaries: list[dict[str, Any]] = []
    overall_best_coverage = -1.0
    hypothesis_text: str | None = None

    _emit(db, project_id, "autonomous.started", payload={
        "max_iterations": max_iterations, "threshold": threshold,
    }, correlation_id=correlation)
    db.commit()

    for iteration in range(1, max_iterations + 1):
        db.refresh(project)
        if project.research_state in ("cancelled", "paused"):
            _emit(db, project_id, "autonomous.stopped", payload={
                "iteration": iteration, "reason": project.research_state,
            }, correlation_id=correlation)
            db.commit()
            break

        _emit(db, project_id, "iteration.started", payload={
            "iteration": iteration, "max_iterations": max_iterations,
            "hypothesis": hypothesis_text,
        }, correlation_id=correlation)
        db.commit()

        strategy_idx = (iteration - 1) % len(_CAMERA_STRATEGIES)
        cameras = _CAMERA_STRATEGIES[strategy_idx]
        if iteration > 1:
            cameras = _perturb_cameras(cameras, rng, scale=0.3 + 0.1 * iteration)

        iteration_summaries: list[dict[str, Any]] = []
        best_coverage = -1.0
        best_run_id: str | None = None

        for eye, label in cameras:
            eye_arr = np.array(eye, dtype=float)
            norm = np.linalg.norm(eye_arr)
            if norm < 0.1:
                eye_arr = np.array([3.0, 0.0, 0.0])
            ext = look_at(eye_arr, np.array([0.0, 0.0, 0.0]))
            pose = CameraPose(intrinsics=INTRINSICS, extrinsics=ext)

            now = datetime.now(timezone.utc)
            run = ExperimentRun(
                project_id=project_id,
                evaluator_version=evaluator_version,
                seed=42 + iteration,
                status="running",
                started_at=now,
                parameters_json=json.dumps({
                    "camera_label": label, "eye": [round(e, 3) for e in eye],
                    "iteration": iteration,
                }),
                data_mode="measured",
            )
            db.add(run)
            db.flush()

            _emit(db, project_id, "experiment.started", entity_id=run.id,
                  payload={"run_id": run.id, "camera_label": label,
                           "iteration": iteration},
                  correlation_id=correlation)

            result = compute_coverage(pose, points, normals)

            metrics = {
                "coverage_fraction": result.coverage_fraction,
                "visible_count": result.visible_count,
                "total_count": result.total_count,
            }

            _emit(db, project_id, "metric.recorded", entity_id=run.id,
                  payload={"run_id": run.id, "metrics": metrics,
                           "iteration": iteration},
                  correlation_id=correlation)

            end_time = datetime.now(timezone.utc)
            run.metrics_json = json.dumps(metrics)
            run.status = "completed"
            run.ended_at = end_time

            _emit(db, project_id, "experiment.completed", entity_id=run.id,
                  payload={"run_id": run.id,
                           "coverage_fraction": result.coverage_fraction,
                           "iteration": iteration},
                  correlation_id=correlation)

            if result.coverage_fraction > best_coverage:
                best_coverage = result.coverage_fraction
                best_run_id = run.id

            iteration_summaries.append({
                "id": run.id,
                "evaluator_version": evaluator_version,
                "seed": 42 + iteration,
                "status": "completed",
                "coverage_fraction": result.coverage_fraction,
                "parameters_json": {"camera_label": label,
                                    "eye": [round(e, 3) for e in eye]},
                "started_at": now.isoformat(),
                "ended_at": end_time.isoformat(),
            })

        all_summaries.extend(iteration_summaries)
        if best_coverage > overall_best_coverage:
            overall_best_coverage = best_coverage

        if overall_best_coverage >= threshold:
            _emit(db, project_id, "goal_reached", entity_id=best_run_id,
                  payload={
                      "iteration": iteration,
                      "best_coverage": overall_best_coverage,
                      "threshold": threshold,
                  }, correlation_id=correlation)
            db.commit()
            break

        hypothesis_text = None
        from app.config import settings
        if settings.scoring_mode == "gemini" and settings.gemini_api_key:
            try:
                from app.policy.gemini import generate_subproblem
                evidence = {
                    "threshold": threshold,
                    "best_coverage": best_coverage,
                    "runs": iteration_summaries,
                }
                sp = generate_subproblem(
                    evidence=evidence,
                    api_key=settings.gemini_api_key,
                    model_id=settings.gemini_model_id,
                )
                hypothesis_text = sp.hypothesis
                _emit(db, project_id, "hypothesis.generated",
                      entity_id=best_run_id,
                      payload={
                          "iteration": iteration,
                          "question": sp.question,
                          "hypothesis": sp.hypothesis,
                          "proposed_action": sp.proposed_action,
                          "rationale": sp.rationale,
                          "prompt_tokens": sp.prompt_tokens,
                          "completion_tokens": sp.completion_tokens,
                          "latency_ms": sp.latency_ms,
                          "data_mode": "ai_generated",
                      }, correlation_id=correlation)
            except Exception:
                _emit(db, project_id, "hypothesis.fallback",
                      entity_id=best_run_id,
                      payload={
                          "iteration": iteration,
                          "message": "Gemini unavailable, using geometric strategy",
                          "data_mode": "measured",
                      }, correlation_id=correlation)

        _emit(db, project_id, "iteration.completed", payload={
            "iteration": iteration,
            "best_coverage": best_coverage,
            "overall_best": overall_best_coverage,
            "runs_this_iteration": len(iteration_summaries),
        }, correlation_id=correlation)
        db.commit()

    db.refresh(project)
    if project.research_state == "running":
        project.research_state = "completed"
    _emit(db, project_id, "autonomous.completed", payload={
        "total_runs": len(all_summaries),
        "best_coverage": overall_best_coverage,
        "threshold_met": overall_best_coverage >= threshold,
        "final_state": project.research_state,
    }, correlation_id=correlation)
    db.commit()

    return {
        "project_id": project_id,
        "runs": all_summaries,
        "best_coverage": overall_best_coverage,
        "threshold_met": overall_best_coverage >= threshold,
        "iterations_completed": min(
            max_iterations,
            len(all_summaries) // max(1, len(_CAMERA_STRATEGIES[0])) + 1,
        ),
    }
