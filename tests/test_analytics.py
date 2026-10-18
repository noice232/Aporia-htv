from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models.project import ExperimentRun, ResearchEvent

client = TestClient(app, raise_server_exceptions=False)


def _make_project() -> str:
    r = client.post("/api/v1/projects", json={"title": "analytics-test"})
    assert r.status_code == 201
    return r.json()["id"]


def _get_db():
    gen = app.dependency_overrides[get_db]()
    return next(gen)


class TestAnalytics:
    def test_analytics_empty_project(self):
        pid = _make_project()
        r = client.get(f"/api/v1/projects/{pid}/analytics")
        assert r.status_code == 200
        data = r.json()
        assert data["total_runs"] == 0
        assert data["total_events"] == 0
        assert data["total_claims"] == 0
        assert data["activity_buckets"] == []
        assert data["metric_samples"] == []

    def test_analytics_with_data(self):
        pid = _make_project()
        db = _get_db()

        # Create some runs
        run = ExperimentRun(
            project_id=pid,
            evaluator_version="v1",
            seed=1,
            status="completed",
            metrics_json=json.dumps({"coverage_fraction": 0.75}),
        )
        db.add(run)

        # Create some events
        ev = ResearchEvent(
            project_id=pid,
            sequence=1,
            type="observation",
        )
        db.add(ev)
        db.commit()

        r = client.get(f"/api/v1/projects/{pid}/analytics")
        assert r.status_code == 200
        data = r.json()
        assert data["total_runs"] == 1
        assert data["total_events"] == 1
        assert len(data["activity_buckets"]) == 1
        assert data["activity_buckets"][0]["event_count"] == 1
        assert len(data["metric_samples"]) == 1
        assert data["metric_samples"][0]["coverage_fraction"] == 0.75

    def test_analytics_project_not_found(self):
        r = client.get("/api/v1/projects/nonexistent-id/analytics")
        assert r.status_code == 404
