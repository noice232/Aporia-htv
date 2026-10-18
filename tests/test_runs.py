"""Tests for run management and global artifact access."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Run Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "runs"})
    assert resp.status_code == 201
    return resp.json()


def _create_spec(project_id: str):
    """Create a plan and experiment spec for a project."""
    c = _client()
    # Create a plan first (needed for experiment context)
    plan = c.post(
        f"/api/v1/projects/{project_id}/plans",
        json={"goal_text": "test goal"},
    ).json()

    # Create an experiment spec
    resp = c.post(
        f"/api/v1/projects/{project_id}/experiment-specs",
        json={
            "evaluator_version": "1.0.0",
            "parameters_json": json.dumps({"camera_count": 6}),
            "plan_id": plan["id"],
        },
    )
    assert resp.status_code == 201
    return resp.json()


class TestStartRun:
    def test_start_run_from_spec(self):
        proj = _create_project()
        spec = _create_spec(proj["id"])
        c = _client()

        resp = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={"experiment_spec_id": spec["id"]},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "running"
        assert data["experiment_spec_id"] == spec["id"]
        assert data["evaluator_version"] == "1.0.0"
        assert data["started_at"] is not None
        assert data["project_id"] == proj["id"]


class TestGetRunById:
    def test_get_run(self):
        proj = _create_project()
        spec = _create_spec(proj["id"])
        c = _client()

        created = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={"experiment_spec_id": spec["id"]},
        ).json()

        resp = c.get(f"/api/v1/runs/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]
        assert resp.json()["status"] == "running"

    def test_run_not_found(self):
        c = _client()
        resp = c.get("/api/v1/runs/nonexistent-id")
        assert resp.status_code == 404


class TestCancelRun:
    def test_cancel_running_run(self):
        proj = _create_project()
        spec = _create_spec(proj["id"])
        c = _client()

        created = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={"experiment_spec_id": spec["id"]},
        ).json()

        resp = c.post(
            f"/api/v1/runs/{created['id']}/cancel",
            json={"reason": "no longer needed"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "cancelled"
        assert data["cancel_reason"] == "no longer needed"
        assert data["ended_at"] is not None

    def test_cancel_already_cancelled(self):
        proj = _create_project()
        spec = _create_spec(proj["id"])
        c = _client()

        created = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={"experiment_spec_id": spec["id"]},
        ).json()

        c.post(f"/api/v1/runs/{created['id']}/cancel", json={})
        resp = c.post(f"/api/v1/runs/{created['id']}/cancel", json={})
        assert resp.status_code == 409


class TestIdempotencyKey:
    def test_idempotency_returns_existing(self):
        proj = _create_project()
        spec = _create_spec(proj["id"])
        c = _client()

        resp1 = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={
                "experiment_spec_id": spec["id"],
                "idempotency_key": "unique-key-123",
            },
        )
        assert resp1.status_code == 201

        resp2 = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={
                "experiment_spec_id": spec["id"],
                "idempotency_key": "unique-key-123",
            },
        )
        assert resp2.status_code == 200
        assert resp2.json()["id"] == resp1.json()["id"]


class TestGetArtifactGlobal:
    def test_get_artifact_by_global_id(self):
        proj = _create_project()
        c = _client()

        created = c.post(
            f"/api/v1/projects/{proj['id']}/artifacts",
            json={
                "kind": "metric_json",
                "label": "global test",
                "content_json": json.dumps({"x": 1}),
            },
        ).json()

        resp = c.get(f"/api/v1/artifacts/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]
        assert resp.json()["label"] == "global test"

    def test_artifact_not_found(self):
        c = _client()
        resp = c.get("/api/v1/artifacts/nonexistent-id")
        assert resp.status_code == 404
