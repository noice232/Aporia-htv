from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app, raise_server_exceptions=False)


def _make_project() -> str:
    r = client.post("/api/v1/projects", json={"title": "court-test", "goal": "test court"})
    assert r.status_code == 201
    return r.json()["id"]


def _make_two_claims(pid: str) -> tuple[str, str]:
    a = client.post(f"/api/v1/projects/{pid}/claims", json={
        "text": "Hypothesis A is correct",
        "claim_type": "hypothesis",
        "confidence": 0.8,
    })
    b = client.post(f"/api/v1/projects/{pid}/claims", json={
        "text": "Hypothesis B is correct",
        "claim_type": "hypothesis",
        "confidence": 0.7,
    })
    return a.json()["id"], b.json()["id"]


def _add_evidence(pid: str, claim_id: str) -> None:
    client.post(f"/api/v1/projects/{pid}/claims/{claim_id}/evidence", json={
        "evidence_type": "supports",
        "description": "Experimental result supporting this claim",
        "strength": 0.8,
    })


class TestCourtList:
    def test_list_court_empty(self):
        pid = _make_project()
        r = client.get(f"/api/v1/projects/{pid}/court")
        assert r.status_code == 200
        assert r.json() == []

    def test_list_court_shows_dispute(self):
        pid = _make_project()
        a, b = _make_two_claims(pid)
        client.post(f"/api/v1/projects/{pid}/court", json={
            "claim_ids": [a, b],
        })
        r = client.get(f"/api/v1/projects/{pid}/court")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert set(data[0]["claim_ids"]) == {a, b}
        assert data[0]["status"] == "open"


class TestCourtOpen:
    def test_open_dispute_via_court(self):
        pid = _make_project()
        a, b = _make_two_claims(pid)
        r = client.post(f"/api/v1/projects/{pid}/court", json={
            "claim_ids": [a, b],
        })
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "open"
        assert a in data["claim_ids"]
        assert b in data["claim_ids"]


class TestCourtTest:
    def test_propose_experiment(self):
        pid = _make_project()
        a, b = _make_two_claims(pid)
        dr = client.post(f"/api/v1/projects/{pid}/court", json={
            "claim_ids": [a, b],
        })
        did = dr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/court/{did}/test", json={})
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "investigating"
        assert data["discriminating_experiment_json"] is not None
        exp = json.loads(data["discriminating_experiment_json"])
        assert "experiment" in exp


class TestInvalidate:
    def test_invalidate_claim_changes_status(self):
        pid = _make_project()
        cr = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Some claim", "claim_type": "observation",
        })
        cid = cr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/claims/{cid}/invalidate", json={
            "evidence_refs": ["ref1"],
            "reason": "Found contradicting data",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["claim_id"] == cid
        assert data["status"] == "needs_revalidation"
        assert data["affected_frontier_nodes"] == 0

    def test_invalidate_propagates_to_frontier_nodes(self):
        pid = _make_project()
        # Create a frontier node first
        nr = client.post(f"/api/v1/projects/{pid}/frontier/nodes", json={
            "node_type": "claim",
            "label": "Test frontier node",
            "status": "open",
            "threshold_json": "{}",
            "measured_json": "{}",
            "data_mode": "measured",
        })
        assert nr.status_code == 201
        node_id = nr.json()["id"]

        # Create a claim linked to that frontier node
        cr = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Linked claim",
            "claim_type": "observation",
            "source_node_id": node_id,
        })
        cid = cr.json()["id"]

        # Invalidate the claim
        r = client.post(f"/api/v1/projects/{pid}/claims/{cid}/invalidate", json={
            "evidence_refs": ["ref1"],
            "reason": "Data was wrong",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["affected_frontier_nodes"] == 1

        # Verify frontier node status changed
        fn = client.get(f"/api/v1/projects/{pid}/frontier/nodes/{node_id}")
        assert fn.json()["status"] == "needs_revalidation"


class TestEvidenceRequiredForResolution:
    def test_resolve_without_evidence_fails(self):
        pid = _make_project()
        a, b = _make_two_claims(pid)
        dr = client.post(f"/api/v1/projects/{pid}/disputes", json={
            "claim_a_id": a, "claim_b_id": b,
        })
        did = dr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/disputes/{did}/resolve", json={
            "resolution": "a_wins",
        })
        assert r.status_code == 400
        assert "evidence" in r.json()["detail"].lower()

    def test_resolve_with_evidence_succeeds(self):
        pid = _make_project()
        a, b = _make_two_claims(pid)
        _add_evidence(pid, a)
        _add_evidence(pid, b)
        dr = client.post(f"/api/v1/projects/{pid}/disputes", json={
            "claim_a_id": a, "claim_b_id": b,
        })
        did = dr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/disputes/{did}/resolve", json={
            "resolution": "a_wins",
        })
        assert r.status_code == 200
        assert r.json()["status"] == "resolved"
        assert r.json()["resolution"] == "a_wins"
