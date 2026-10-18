"""Artifact and ExperimentSpec tests."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Artifact Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "artifact"})
    assert resp.status_code == 201
    return resp.json()


class TestCreateArtifact:
    def test_create_with_content(self):
        proj = _create_project()
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "metric_json",
            "label": "coverage results",
            "content_json": json.dumps({"coverage": 0.5}),
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["label"] == "coverage results"
        assert data["kind"] == "metric_json"
        assert data["content_hash"] != ""
        assert data["size_bytes"] > 0


class TestListArtifacts:
    def test_list_for_project(self):
        proj = _create_project()
        c = _client()
        c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "log", "label": "run log",
        })
        c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "config", "label": "run config",
        })
        resp = c.get(f"/api/v1/projects/{proj['id']}/artifacts")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


class TestGetArtifactById:
    def test_get_by_id(self):
        proj = _create_project()
        c = _client()
        created = c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "checkpoint", "label": "snap",
        }).json()
        resp = c.get(f"/api/v1/projects/{proj['id']}/artifacts/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_404_nonexistent(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/artifacts/nonexistent")
        assert resp.status_code == 404


class TestArtifactLinkedToRun:
    def test_linked_to_run(self):
        proj = _create_project()
        c = _client()
        goal = c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.01}).json()
        runs = c.get(f"/api/v1/projects/{proj['id']}/runs").json()
        run_id = runs[0]["id"]

        c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "metric_json", "label": "run metrics", "run_id": run_id,
        })
        resp = c.get(f"/api/v1/projects/{proj['id']}/runs/{run_id}/artifacts")
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["run_id"] == run_id


class TestCreateExperimentSpec:
    def test_create_spec(self):
        proj = _create_project()
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/experiment-specs", json={
            "evaluator_version": "1.0.0",
            "parameters_json": json.dumps({"camera_count": 6}),
            "dataset_hash": "abc123",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["evaluator_version"] == "1.0.0"
        assert data["dataset_hash"] == "abc123"
        assert data["status"] == "pending"


class TestContentHashComputed:
    def test_hash_deterministic(self):
        proj = _create_project()
        c = _client()
        content = json.dumps({"x": 1})
        r1 = c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "metric_json", "label": "a", "content_json": content,
        }).json()
        r2 = c.post(f"/api/v1/projects/{proj['id']}/artifacts", json={
            "kind": "metric_json", "label": "b", "content_json": content,
        }).json()
        assert r1["content_hash"] == r2["content_hash"]
