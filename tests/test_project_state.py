"""Tests for project state aggregation, graph, hypotheses, and experiments."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="State Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "testing"})
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestPatchProject:
    def test_patch_title(self):
        proj = _create_project()
        c = _client()
        resp = c.patch(f"/api/v1/projects/{proj['id']}", json={"title": "New Title"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "New Title"
        assert data["objective"] == "testing"

    def test_patch_not_found(self):
        c = _client()
        resp = c.patch("/api/v1/projects/nonexistent", json={"title": "X"})
        assert resp.status_code == 404


class TestProjectState:
    def test_get_state_returns_counts(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/state")
        assert resp.status_code == 200
        data = resp.json()
        assert data["project"]["id"] == proj["id"]
        assert data["run_count"] == 0
        assert data["event_count"] == 0
        assert data["frontier_node_count"] == 0
        assert data["plan_count"] == 0
        assert data["claim_count"] == 0
        assert data["status"] == "created"


class TestProjectGraph:
    def test_graph_returns_nodes_and_edges(self):
        proj = _create_project()
        c = _client()
        pid = proj["id"]

        # Create frontier nodes
        n1 = c.post(f"/api/v1/projects/{pid}/frontier/nodes", json={
            "node_type": "hypothesis",
            "label": "H1: Test hypothesis",
        })
        assert n1.status_code == 201, n1.text
        n1_id = n1.json()["id"]

        n2 = c.post(f"/api/v1/projects/{pid}/frontier/nodes", json={
            "node_type": "method",
            "label": "M1: Test method",
        })
        assert n2.status_code == 201, n2.text
        n2_id = n2.json()["id"]

        # Create frontier edge
        e = c.post(f"/api/v1/projects/{pid}/frontier/edges", json={
            "source_node_id": n1_id,
            "target_node_id": n2_id,
            "edge_type": "tests",
        })
        assert e.status_code == 201, e.text

        # Get graph
        resp = c.get(f"/api/v1/projects/{pid}/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["nodes"]) == 2
        assert len(data["edges"]) == 1
        assert data["edges"][0]["source"] == n1_id
        assert data["edges"][0]["target"] == n2_id
        assert data["edges"][0]["relationship"] == "tests"

        node_ids = {n["id"] for n in data["nodes"]}
        assert n1_id in node_ids
        assert n2_id in node_ids


class TestHypotheses:
    def test_list_hypotheses(self):
        proj = _create_project()
        c = _client()
        pid = proj["id"]

        # Create a plan (which generates hypotheses)
        plan_resp = c.post(f"/api/v1/projects/{pid}/plans", json={
            "goal_text": "Test coverage improvement",
        })
        assert plan_resp.status_code == 201, plan_resp.text
        plan_data = plan_resp.json()

        # List hypotheses
        resp = c.get(f"/api/v1/projects/{pid}/hypotheses")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        assert data[0]["plan_id"] == plan_data["id"]
        assert "text" in data[0]
        assert "status" in data[0]


class TestExperiments:
    def test_list_experiments_empty(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/experiments")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_propose_experiment(self):
        proj = _create_project()
        c = _client()
        pid = proj["id"]

        resp = c.post(f"/api/v1/projects/{pid}/experiments/propose", json={
            "evaluator_version": "v1.0",
            "parameters_json": '{"lr": 0.01}',
            "dataset_hash": "abc123",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_id"] == pid
        assert data["evaluator_version"] == "v1.0"
        assert data["parameters_json"] == '{"lr": 0.01}'
        assert data["dataset_hash"] == "abc123"
        assert data["status"] == "pending"

        # Verify it appears in list
        resp2 = c.get(f"/api/v1/projects/{pid}/experiments")
        assert resp2.status_code == 200
        assert len(resp2.json()) == 1
