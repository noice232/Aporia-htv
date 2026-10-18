from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)

WS_ID = "ws-test-001"


def _create_trial(strategy_a: str = "sa-1", strategy_b: str = "sb-1") -> dict:
    r = client.post(
        f"/api/v1/workspaces/{WS_ID}/meta/trials",
        json={
            "strategy_a_id": strategy_a,
            "strategy_b_id": strategy_b,
            "common_conditions_json": '{"seed": 42}',
        },
    )
    assert r.status_code == 201
    return r.json()


class TestMetaTrials:
    def test_create_trial(self):
        data = _create_trial()
        assert data["workspace_id"] == WS_ID
        assert data["strategy_a_id"] == "sa-1"
        assert data["strategy_b_id"] == "sb-1"
        assert data["status"] == "running"
        assert data["ended_at"] is None

    def test_list_trials(self):
        _create_trial("a1", "b1")
        _create_trial("a2", "b2")
        r = client.get(f"/api/v1/workspaces/{WS_ID}/meta")
        assert r.status_code == 200
        trials = r.json()
        assert len(trials) >= 2

    def test_rollback_trial(self):
        trial = _create_trial()
        r = client.post(
            f"/api/v1/workspaces/{WS_ID}/meta/{trial['id']}/rollback",
            json={"strategy_version": 1},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "rolled_back"
        assert data["ended_at"] is not None

    def test_rollback_not_found(self):
        r = client.post(
            f"/api/v1/workspaces/{WS_ID}/meta/nonexistent-id/rollback",
            json={"strategy_version": 1},
        )
        assert r.status_code == 404
