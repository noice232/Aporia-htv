"""Tests for research control endpoints."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Research Control Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "ctrl"})
    assert resp.status_code == 201
    return resp.json()


def _create_spec(project_id: str):
    c = _client()
    plan = c.post(
        f"/api/v1/projects/{project_id}/plans",
        json={"goal_text": "test goal"},
    ).json()
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


class TestResearchStatus:
    def test_get_status(self):
        proj = _create_project()
        c = _client()

        resp = c.get(f"/api/v1/projects/{proj['id']}/research/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_id"] == proj["id"]
        assert data["state"] == "idle"
        assert data["active_run_count"] == 0
        assert data["last_event_sequence"] == 0


class TestResearchControlPause:
    def test_pause(self):
        proj = _create_project()
        c = _client()

        resp = c.post(
            f"/api/v1/projects/{proj['id']}/research/control",
            json={"action": "pause"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_state"] == "paused"
        assert data["affected_runs"] == 0

        # Verify state persisted
        status = c.get(f"/api/v1/projects/{proj['id']}/research/status").json()
        assert status["state"] == "paused"


class TestResearchControlResume:
    def test_resume(self):
        proj = _create_project()
        c = _client()

        # Pause first
        c.post(
            f"/api/v1/projects/{proj['id']}/research/control",
            json={"action": "pause"},
        )

        # Resume
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/research/control",
            json={"action": "resume"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_state"] == "running"

        status = c.get(f"/api/v1/projects/{proj['id']}/research/status").json()
        assert status["state"] == "running"


class TestResearchControlCancel:
    def test_cancel_cancels_running_runs(self):
        proj = _create_project()
        spec = _create_spec(proj["id"])
        c = _client()

        # Start two runs
        r1 = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={"experiment_spec_id": spec["id"]},
        ).json()
        r2 = c.post(
            f"/api/v1/projects/{proj['id']}/runs",
            json={"experiment_spec_id": spec["id"]},
        ).json()

        resp = c.post(
            f"/api/v1/projects/{proj['id']}/research/control",
            json={"action": "cancel"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_state"] == "cancelled"
        assert data["affected_runs"] == 2

        # Verify runs are cancelled
        assert c.get(f"/api/v1/runs/{r1['id']}").json()["status"] == "cancelled"
        assert c.get(f"/api/v1/runs/{r2['id']}").json()["status"] == "cancelled"


class TestListCheckpoints:
    def test_list_checkpoints_empty(self):
        proj = _create_project()
        c = _client()

        resp = c.get(f"/api/v1/projects/{proj['id']}/research/checkpoints")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_checkpoints_with_session(self):
        proj = _create_project()
        c = _client()

        # Create a research session linked to the project
        session_resp = c.post(
            "/api/v1/research-sessions",
            json={
                "title": "Test Session",
                "goal": "test",
                "project_id": proj["id"],
            },
        )
        assert session_resp.status_code == 201
        session = session_resp.json()

        # Create a checkpoint in that session
        cp_resp = c.post(
            f"/api/v1/research-sessions/{session['id']}/checkpoints",
            json={"prompt": "Should we continue?", "reason": "uncertainty"},
        )
        assert cp_resp.status_code == 201

        # List checkpoints for the project
        resp = c.get(f"/api/v1/projects/{proj['id']}/research/checkpoints")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["prompt"] == "Should we continue?"
