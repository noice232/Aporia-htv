from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.parallax import Claim
from app.models.project import ExperimentRun, Project, ResearchEvent
from app.schemas.analytics import ActivityBucket, AnalyticsOut, MetricSample

router = APIRouter(prefix="/api/v1/projects/{project_id}", tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsOut)
def project_analytics(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    # Activity buckets: group research events by date
    events = (
        db.query(ResearchEvent)
        .filter(ResearchEvent.project_id == project_id)
        .all()
    )
    buckets_map: dict[str, int] = {}
    for ev in events:
        period = ev.occurred_at.strftime("%Y-%m-%d")
        buckets_map[period] = buckets_map.get(period, 0) + 1
    activity_buckets = [
        ActivityBucket(period=k, event_count=v)
        for k, v in sorted(buckets_map.items())
    ]

    # Metric samples from ExperimentRun metrics_json
    runs = (
        db.query(ExperimentRun)
        .filter(ExperimentRun.project_id == project_id)
        .all()
    )
    metric_samples = []
    for run in runs:
        if run.metrics_json:
            try:
                metrics = json.loads(run.metrics_json)
                coverage = metrics.get("coverage_fraction", 0.0)
                metric_samples.append(
                    MetricSample(
                        run_id=run.id,
                        coverage_fraction=coverage,
                        timestamp=run.started_at or run.ended_at or project.created_at,
                    )
                )
            except (json.JSONDecodeError, TypeError):
                pass

    # Totals
    total_runs = db.query(func.count(ExperimentRun.id)).filter(
        ExperimentRun.project_id == project_id
    ).scalar() or 0

    total_events = db.query(func.count(ResearchEvent.id)).filter(
        ResearchEvent.project_id == project_id
    ).scalar() or 0

    total_claims = db.query(func.count(Claim.id)).filter(
        Claim.project_id == project_id
    ).scalar() or 0

    return AnalyticsOut(
        activity_buckets=activity_buckets,
        metric_samples=metric_samples,
        total_runs=total_runs,
        total_events=total_events,
        total_claims=total_claims,
    )
