from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ActivityBucket(BaseModel):
    period: str
    event_count: int


class MetricSample(BaseModel):
    run_id: str
    coverage_fraction: float
    timestamp: datetime


class AnalyticsOut(BaseModel):
    activity_buckets: list[ActivityBucket]
    metric_samples: list[MetricSample]
    total_runs: int
    total_events: int
    total_claims: int
