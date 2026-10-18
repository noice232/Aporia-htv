"""Plan/hypothesis compiler tests."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Plan Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "plan"})
    assert resp.status_code == 201
    return resp.json()


def _compile_plan(project_id, goal="Maximize 3D coverage"):
    c = _client()
    resp = c.post(f"/api/v1/projects/{project_id}/plans", json={"goal_text": goal})
    assert resp.status_code == 201
    return resp.json()


class TestCompilePlanStub:
    def test_creates_valid_plan(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        assert plan["status"] == "draft"
        assert plan["objective"] == "Maximize 3D coverage"
        assert plan["version"] == 1

    def test_hypotheses_and_protocols_exist(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        assert len(plan["hypotheses"]) >= 1
        assert len(plan["protocols"]) >= 1
        assert plan["hypotheses"][0]["status"] == "proposed"

    def test_variables_and_metrics_populated(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        variables = json.loads(plan["variables_json"])
        metrics = json.loads(plan["metrics_json"])
        assert len(variables) >= 1
        assert len(metrics) >= 1


class TestEditPlanBumpsVersion:
    def test_version_increments(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        c = _client()
        resp = c.put(f"/api/v1/projects/{proj['id']}/plans/{plan['id']}", json={
            "objective": "Updated objective",
        })
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["version"] == 2
        assert updated["objective"] == "Updated objective"


class TestApprovePlan:
    def test_transitions_status(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/plans/{plan['id']}/approve")
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"


class TestPlanVersionHistory:
    def test_history_after_edit(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        c = _client()
        c.put(f"/api/v1/projects/{proj['id']}/plans/{plan['id']}", json={
            "objective": "Edited",
        })
        resp = c.get(f"/api/v1/projects/{proj['id']}/plans/{plan['id']}/history")
        assert resp.status_code == 200
        versions = resp.json()
        assert len(versions) >= 2


class TestPlanNotFound:
    def test_get_nonexistent(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/plans/nonexistent")
        assert resp.status_code == 404


class TestPlanList:
    def test_list_returns_all(self):
        proj = _create_project()
        _compile_plan(proj["id"], "Goal A")
        _compile_plan(proj["id"], "Goal B")
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/plans")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


class TestPlanGetDetail:
    def test_get_includes_sub_objects(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/plans/{plan['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "hypotheses" in data
        assert "protocols" in data
        assert len(data["hypotheses"]) >= 1


class TestPlanProtocolLinksHypothesis:
    def test_protocol_references_hypothesis(self):
        proj = _create_project()
        plan = _compile_plan(proj["id"])
        hyp_id = plan["hypotheses"][0]["id"]
        proto = plan["protocols"][0]
        assert proto["hypothesis_id"] == hyp_id
