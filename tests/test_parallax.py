from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app, raise_server_exceptions=False)


def _make_project() -> str:
    r = client.post("/api/v1/projects", json={"title": "parallax-test", "goal": "test claims"})
    assert r.status_code == 201
    return r.json()["id"]


class TestClaimCRUD:
    def test_create_claim(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Protein X binds receptor Y",
            "claim_type": "observation",
            "confidence": 0.8,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["text"] == "Protein X binds receptor Y"
        assert data["claim_type"] == "observation"
        assert data["status"] == "proposed"
        assert data["confidence"] == 0.8

    def test_list_claims(self):
        pid = _make_project()
        client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Claim A", "claim_type": "hypothesis",
        })
        client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Claim B", "claim_type": "conclusion",
        })
        r = client.get(f"/api/v1/projects/{pid}/claims")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_get_claim_with_evidence(self):
        pid = _make_project()
        cr = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Temperature affects yield", "claim_type": "observation",
        })
        cid = cr.json()["id"]
        r = client.get(f"/api/v1/projects/{pid}/claims/{cid}")
        assert r.status_code == 200
        assert r.json()["id"] == cid
        assert r.json()["evidence"] == []

    def test_claim_not_found(self):
        pid = _make_project()
        r = client.get(f"/api/v1/projects/{pid}/claims/nonexistent")
        assert r.status_code == 404

    def test_filter_claims_by_status(self):
        pid = _make_project()
        client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "A", "claim_type": "hypothesis",
        })
        r = client.get(f"/api/v1/projects/{pid}/claims", params={"status": "proposed"})
        assert r.status_code == 200
        assert len(r.json()) == 1
        r2 = client.get(f"/api/v1/projects/{pid}/claims", params={"status": "refuted"})
        assert len(r2.json()) == 0


class TestEvidence:
    def test_add_evidence_supports(self):
        pid = _make_project()
        cr = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Enzyme K catalyzes reaction", "claim_type": "observation",
        })
        cid = cr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/claims/{cid}/evidence", json={
            "evidence_type": "supports",
            "description": "Run 42 showed 95% conversion",
            "strength": 0.9,
        })
        assert r.status_code == 201
        assert r.json()["evidence_type"] == "supports"
        assert r.json()["strength"] == 0.9

    def test_add_contradicting_evidence(self):
        pid = _make_project()
        cr = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Method A is superior", "claim_type": "conclusion",
        })
        cid = cr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/claims/{cid}/evidence", json={
            "evidence_type": "contradicts",
            "description": "Replicate failed",
            "strength": 0.7,
            "data_mode": "measured",
        })
        assert r.status_code == 201
        assert r.json()["data_mode"] == "measured"

    def test_evidence_on_missing_claim(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/claims/bad-id/evidence", json={
            "evidence_type": "supports",
            "description": "some evidence",
        })
        assert r.status_code == 404


class TestDispute:
    def _two_claims(self, pid: str) -> tuple[str, str]:
        a = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Drug works via pathway A", "claim_type": "hypothesis",
        }).json()["id"]
        b = client.post(f"/api/v1/projects/{pid}/claims", json={
            "text": "Drug works via pathway B", "claim_type": "hypothesis",
        }).json()["id"]
        return a, b

    def test_open_dispute(self):
        pid = _make_project()
        a, b = self._two_claims(pid)
        r = client.post(f"/api/v1/projects/{pid}/disputes", json={
            "claim_a_id": a, "claim_b_id": b,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "open"
        assert data["claim_a_id"] == a
        assert data["claim_b_id"] == b

        ca = client.get(f"/api/v1/projects/{pid}/claims/{a}").json()
        assert ca["status"] == "disputed"

    def test_dispute_same_claim_rejected(self):
        pid = _make_project()
        a, _ = self._two_claims(pid)
        r = client.post(f"/api/v1/projects/{pid}/disputes", json={
            "claim_a_id": a, "claim_b_id": a,
        })
        assert r.status_code == 400

    def test_propose_discriminating_experiment(self):
        pid = _make_project()
        a, b = self._two_claims(pid)
        dr = client.post(f"/api/v1/projects/{pid}/disputes", json={
            "claim_a_id": a, "claim_b_id": b,
        })
        did = dr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/disputes/{did}/propose-experiment")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "investigating"
        exp = json.loads(data["discriminating_experiment_json"])
        assert "experiment" in exp
        assert "claim_a" in exp

    def test_resolve_dispute_a_wins(self):
        pid = _make_project()
        a, b = self._two_claims(pid)
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
        assert r.json()["resolved_at"] is not None

        ca = client.get(f"/api/v1/projects/{pid}/claims/{a}").json()
        cb = client.get(f"/api/v1/projects/{pid}/claims/{b}").json()
        assert ca["status"] == "supported"
        assert cb["status"] == "refuted"

    def test_list_disputes(self):
        pid = _make_project()
        a, b = self._two_claims(pid)
        client.post(f"/api/v1/projects/{pid}/disputes", json={
            "claim_a_id": a, "claim_b_id": b,
        })
        r = client.get(f"/api/v1/projects/{pid}/disputes")
        assert r.status_code == 200
        assert len(r.json()) == 1

    def test_dispute_not_found(self):
        pid = _make_project()
        r = client.get(f"/api/v1/projects/{pid}/disputes/nonexistent")
        assert r.status_code == 404
