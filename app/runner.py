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
from app.models.project import AgendaItem, ExperimentRun, ResearchEvent

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

        item = AgendaItem(
            project_id=project_id,
            question=(
                f"Coverage {best_coverage:.2%} below threshold {threshold:.2%} "
                f"— investigate missing geometry or alternative poses"
            ),
            status="queued",
            priority=1.0,
            originating_run_id=best_run_id,
            originating_event_id=evt.id,
            dedup_key=f"coverage_gap:{project_id}",
            completion_criteria_json=json.dumps({
                "required_coverage": threshold,
                "current_best": best_coverage,
            }),
        )
        db.add(item)
        db.flush()

        _emit(db, project_id, "agenda.queued", entity_id=item.id,
              payload={"agenda_item_id": item.id, "question": item.question})

        agenda_item_id = item.id

    db.commit()

    return {
        "project_id": project_id,
        "runs": run_summaries,
        "best_coverage": best_coverage,
        "threshold_met": best_coverage >= threshold,
        "agenda_item_id": agenda_item_id,
    }
