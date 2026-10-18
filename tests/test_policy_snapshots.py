"""Tests for policy snapshots, choose action, and SSE streaming."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.policy.candidates import DEFAULT_HUMAN_CONTEXT


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Snapshot Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "testing"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _setup_policy_data(project_id: str):
    """Create judgment, approve it, then score to produce a policy run."""
    c = _client()

    # Submit a judgment
    j = c.post(f"/api/v1/projects/{project_id}/judgments", json={
        "text": "I value geometric coverage and consistency above all else",
    })
    assert j.status_code == 201, j.text
    principle_id = j.json()["id"]

    # Approve the principle
    a = c.post(f"/api/v1/projects/{project_id}/principles/{principle_id}/approve")
    assert a.status_code == 200, a.text

    # Score the policy
    s = c.post(f"/api/v1/projects/{project_id}/policy/score", json={"w": 1.0})
    assert s.status_code == 200, s.text
    return s.json()


class TestGetPolicyRun:
    def test_get_policy_run(self):
        proj = _create_project()
        score_result = _setup_policy_data(proj["id"])
        run_id = score_result["id"]

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/policy/runs/{run_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == run_id
        assert data["w"] == 1.0
        assert len(data["scores"]) > 0

    def test_policy_run_not_found(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/policy/runs/nonexistent")
        assert resp.status_code == 404


class TestChooseAction:
    def test_choose_action_updates_run(self):
        proj = _create_project()
        score_result = _setup_policy_data(proj["id"])
        run_id = score_result["id"]

        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/policy/choose", json={
            "policy_run_id": run_id,
            "idempotency_key": "test-choose-001",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "chosen"
        assert data["policy_run_id"] == run_id


class TestPolicySnapshots:
    def test_create_snapshot(self):
        proj = _create_project()
        _setup_policy_data(proj["id"])

        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/policy/snapshots", json={})
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_id"] == proj["id"]
        assert "candidate_set_hash" in data
        assert "candidate_ids_json" in data

    def test_get_latest_snapshot(self):
        proj = _create_project()
        _setup_policy_data(proj["id"])

        c = _client()

        # The scoring already created a snapshot, so latest should exist
        resp = c.get(f"/api/v1/projects/{proj['id']}/policy/snapshots/latest")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_id"] == proj["id"]

    def test_latest_snapshot_not_found(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/policy/snapshots/latest")
        assert resp.status_code == 404


class TestSSEStream:
    def test_sse_stream_returns_events(self):
        proj = _create_project()
        # Setup generates research events via scoring
        _setup_policy_data(proj["id"])

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/stream")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        body = resp.text
        assert "data:" in body
