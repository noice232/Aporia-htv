"""FRONTIER graph nodes and dependencies tests."""
from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Frontier Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "frontier"})
    assert resp.status_code == 201
    return resp.json()


def _create_node(project_id, node_type="problem", label="Test node", **kwargs):
    c = _client()
    body = {"node_type": node_type, "label": label, **kwargs}
    resp = c.post(f"/api/v1/projects/{project_id}/frontier/nodes", json=body)
    assert resp.status_code == 201
    return resp.json()


class TestCreateNodeAllTypes:
    def test_all_node_types_accepted(self):
        proj = _create_project()
        types = [
            "paper", "objective", "problem", "hypothesis",
            "method", "run", "claim", "evidence",
            "human_judgment", "skill",
        ]
        for t in types:
            node = _create_node(proj["id"], node_type=t, label=f"Node {t}")
            assert node["node_type"] == t
            assert node["status"] == "open"


class TestCreateEdgeDirected:
    def test_edge_connects_two_nodes(self):
        proj = _create_project()
        a = _create_node(proj["id"], label="A")
        b = _create_node(proj["id"], label="B")
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/frontier/edges", json={
            "source_node_id": a["id"],
            "target_node_id": b["id"],
            "edge_type": "depends_on",
        })
        assert resp.status_code == 201
        edge = resp.json()
        assert edge["source_node_id"] == a["id"]
        assert edge["target_node_id"] == b["id"]
        assert edge["edge_type"] == "depends_on"


class TestNoSelfLoop:
    def test_self_loop_rejected(self):
        proj = _create_project()
        a = _create_node(proj["id"], label="Self")
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/frontier/edges", json={
            "source_node_id": a["id"],
            "target_node_id": a["id"],
            "edge_type": "depends_on",
        })
        assert resp.status_code == 422


class TestDetectBlockersCreatesChildren:
    def test_blocked_node_gets_child(self):
        proj = _create_project()
        node = _create_node(
            proj["id"],
            node_type="objective",
            label="Coverage target",
            threshold_json=json.dumps({"coverage": 0.8}),
            measured_json=json.dumps({"coverage": 0.2}),
            status="active",
        )
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/frontier/detect-blockers")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["blocked_nodes"]) == 1
        assert data["blocked_nodes"][0]["id"] == node["id"]
        assert len(data["children_created"]) == 1
        child = data["children_created"][0]
        assert child["parent_id"] == node["id"]
        assert child["node_type"] == "problem"


class TestPriorityIncreasesWithBlockingParents:
    def test_child_priority_boosted(self):
        proj = _create_project()
        parent = _create_node(proj["id"], label="Parent", priority=5.0,
                              threshold_json=json.dumps({"x": 1.0}),
                              measured_json=json.dumps({"x": 0.1}),
                              status="active")
        c = _client()
        c.post(f"/api/v1/projects/{proj['id']}/frontier/detect-blockers")

        nodes = c.get(f"/api/v1/projects/{proj['id']}/frontier/nodes").json()
        child = next(n for n in nodes if n["parent_id"] == parent["id"])
        assert child["priority"] >= parent["priority"]


class TestChildCompletionUnblocksParent:
    def test_unblock_on_child_complete(self):
        proj = _create_project()
        parent = _create_node(proj["id"], label="Parent blocked",
                              threshold_json=json.dumps({"x": 1.0}),
                              measured_json=json.dumps({"x": 0.1}),
                              status="active")
        c = _client()
        c.post(f"/api/v1/projects/{proj['id']}/frontier/detect-blockers")

        nodes = c.get(f"/api/v1/projects/{proj['id']}/frontier/nodes").json()
        child = next(n for n in nodes if n["parent_id"] == parent["id"])

        resp = c.post(f"/api/v1/projects/{proj['id']}/frontier/nodes/{child['id']}/complete")
        assert resp.status_code == 200

        parent_updated = c.get(f"/api/v1/projects/{proj['id']}/frontier/nodes/{parent['id']}").json()
        assert parent_updated["status"] == "active"


class TestSubgraphBFS:
    def test_subgraph_returns_connected(self):
        proj = _create_project()
        a = _create_node(proj["id"], label="Root")
        b = _create_node(proj["id"], label="Child")
        c_node = _create_node(proj["id"], label="Orphan")
        cl = _client()
        cl.post(f"/api/v1/projects/{proj['id']}/frontier/edges", json={
            "source_node_id": a["id"],
            "target_node_id": b["id"],
            "edge_type": "depends_on",
        })

        resp = cl.get(f"/api/v1/projects/{proj['id']}/frontier/subgraph", params={"root_id": a["id"], "depth": 2})
        assert resp.status_code == 200
        data = resp.json()
        ids = {n["id"] for n in data["nodes"]}
        assert a["id"] in ids
        assert b["id"] in ids
        assert c_node["id"] not in ids


class TestListNodesFilterByType:
    def test_filter_by_type(self):
        proj = _create_project()
        _create_node(proj["id"], node_type="problem", label="P1")
        _create_node(proj["id"], node_type="hypothesis", label="H1")
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/frontier/nodes", params={"node_type": "problem"})
        assert resp.status_code == 200
        nodes = resp.json()
        assert all(n["node_type"] == "problem" for n in nodes)
        assert len(nodes) == 1


class TestListNodesFilterByStatus:
    def test_filter_by_status(self):
        proj = _create_project()
        _create_node(proj["id"], label="Open", status="open")
        _create_node(proj["id"], label="Active", status="active")
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/frontier/nodes", params={"status": "active"})
        assert resp.status_code == 200
        nodes = resp.json()
        assert all(n["status"] == "active" for n in nodes)
        assert len(nodes) == 1


class TestNodeNotFound:
    def test_get_nonexistent_node(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/frontier/nodes/nonexistent")
        assert resp.status_code == 404


class TestEdgeValidatesNodeRefs:
    def test_edge_to_nonexistent_node(self):
        proj = _create_project()
        a = _create_node(proj["id"], label="Real")
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/frontier/edges", json={
            "source_node_id": a["id"],
            "target_node_id": "nonexistent",
            "edge_type": "depends_on",
        })
        assert resp.status_code == 422
