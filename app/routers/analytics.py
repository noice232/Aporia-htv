from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.database import get_db, _is_sqlite
from app.models.parallax import Claim
from app.models.project import ExperimentRun, Project, ResearchEvent
from app.schemas.analytics import ActivityBucket, AnalyticsOut, MetricSample

router = APIRouter(prefix="/api/v1/projects/{project_id}", tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsOut)
def project_analytics(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    if _is_sqlite:
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
    else:
        rows = db.execute(text("""
            SELECT time_bucket('1 day', occurred_at)::date::text AS period,
                   COUNT(*) AS event_count
            FROM research_events
            WHERE project_id = :pid
            GROUP BY period
            ORDER BY period
        """), {"pid": project_id}).fetchall()
        activity_buckets = [
            ActivityBucket(period=r.period, event_count=r.event_count)
            for r in rows
        ]

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


@router.get("/analytics/timeseries")
def project_timeseries(project_id: str, db: Session = Depends(get_db)):
    """Hourly research event breakdown — powered by Tiger Data continuous aggregates."""
    if _is_sqlite:
        rows = db.execute(text("""
            SELECT type AS event_type,
                   strftime('%Y-%m-%dT%H:00:00Z', occurred_at) AS bucket,
                   COUNT(*) AS event_count
            FROM research_events
            WHERE project_id = :pid
            GROUP BY type, bucket
            ORDER BY bucket DESC
        """), {"pid": project_id}).fetchall()
    else:
        rows = db.execute(text("""
            SELECT event_type, bucket::text, event_count
            FROM research_activity_hourly
            WHERE project_id = :pid
              AND bucket > NOW() - INTERVAL '7 days'
            ORDER BY bucket DESC
        """), {"pid": project_id}).fetchall()
    return [dict(r._mapping) for r in rows]


@router.get("/analytics/experiments/daily")
def project_experiments_daily(project_id: str, db: Session = Depends(get_db)):
    """Daily experiment run stats — powered by Tiger Data continuous aggregates."""
    if _is_sqlite:
        rows = db.execute(text("""
            SELECT status,
                   strftime('%Y-%m-%d', started_at) AS day,
                   COUNT(*) AS run_count
            FROM experiment_runs
            WHERE project_id = :pid AND started_at IS NOT NULL
            GROUP BY status, day
            ORDER BY day DESC
        """), {"pid": project_id}).fetchall()
    else:
        rows = db.execute(text("""
            SELECT day::text, status, run_count, avg_duration_sec
            FROM experiment_runs_daily
            WHERE project_id = :pid
              AND day > NOW() - INTERVAL '30 days'
            ORDER BY day DESC
        """), {"pid": project_id}).fetchall()
    return [dict(r._mapping) for r in rows]
