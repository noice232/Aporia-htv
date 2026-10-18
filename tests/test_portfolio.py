from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db
from app.models.project import AgendaItem, ExperimentRun


client = TestClient(app, raise_server_exceptions=False)


def _make_project() -> str:
    r = client.post("/api/v1/projects", json={"title": "portfolio-test"})
    assert r.status_code == 201
    return r.json()["id"]


def _make_strategy(pid: str, name: str = "Strategy Alpha", params: dict | None = None) -> dict:
    body: dict = {"name": name}
    if params is not None:
        body["parameters_json"] = json.dumps(params)
    r = client.post(f"/api/v1/projects/{pid}/strategies", json=body)
    assert r.status_code == 201
    return r.json()


def _get_db():
    """Get a DB session through the app's dependency override."""
    gen = app.dependency_overrides[get_db]()
    db = next(gen)
    return db


def _make_agenda_item(pid: str, question: str = "What next?", priority: float = 1.0) -> str:
    """Create an agenda item directly in the database."""
    db = _get_db()
    item = AgendaItem(
        project_id=pid,
        question=question,
        priority=priority,
        status="queued",
    )
    db.add(item)
    db.commit()
    return item.id


def _make_run(pid: str, strategy_id: str, score: float) -> str:
    """Create an experiment run directly in the database."""
    db = _get_db()
    run = ExperimentRun(
        project_id=pid,
        evaluator_version="v1",
        seed=1,
        status="completed",
        parameters_json=json.dumps({"strategy_id": strategy_id}),
        metrics_json=json.dumps({"overall_score": score}),
    )
    db.add(run)
    db.commit()
    return run.id


class TestStrategyCreate:
    def test_create_strategy(self):
        pid = _make_project()
        data = _make_strategy(pid)
        assert data["name"] == "Strategy Alpha"
        assert data["version"] == 1
        assert data["status"] == "active"
        assert data["project_id"] == pid

    def test_create_with_parameters(self):
        pid = _make_project()
        params = {"priority_weight": 2.0, "risk_tolerance": 0.3}
        data = _make_strategy(pid, params=params)
        assert json.loads(data["parameters_json"]) == params

    def test_list_strategies(self):
        pid = _make_project()
        _make_strategy(pid, name="A")
        _make_strategy(pid, name="B")
        r = client.get(f"/api/v1/projects/{pid}/strategies")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_get_strategy(self):
        pid = _make_project()
        s = _make_strategy(pid)
        r = client.get(f"/api/v1/projects/{pid}/strategies/{s['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == s["id"]

    def test_strategy_not_found(self):
        pid = _make_project()
        r = client.get(f"/api/v1/projects/{pid}/strategies/nonexistent")
        assert r.status_code == 404


class TestStrategyUpdate:
    def test_update_bumps_version(self):
        pid = _make_project()
        s = _make_strategy(pid)
        assert s["version"] == 1

        r = client.put(f"/api/v1/projects/{pid}/strategies/{s['id']}", json={
            "name": "Updated Strategy",
            "parameters_json": json.dumps({"priority_weight": 3.0}),
        })
        assert r.status_code == 200
        data = r.json()
        assert data["version"] == 2
        assert data["name"] == "Updated Strategy"

    def test_version_history(self):
        pid = _make_project()
        s = _make_strategy(pid, params={"v": 1})
        client.put(f"/api/v1/projects/{pid}/strategies/{s['id']}", json={
            "parameters_json": json.dumps({"v": 2}),
        })
        client.put(f"/api/v1/projects/{pid}/strategies/{s['id']}", json={
            "parameters_json": json.dumps({"v": 3}),
        })

        r = client.get(f"/api/v1/projects/{pid}/strategies/{s['id']}/history")
        assert r.status_code == 200
        versions = r.json()
        assert len(versions) == 3
        assert versions[0]["version"] == 1
        assert versions[1]["version"] == 2
        assert versions[2]["version"] == 3

        # Snapshots reflect the parameters at each version
        assert json.loads(versions[0]["parameters_snapshot_json"]) == {"v": 1}
        assert json.loads(versions[2]["parameters_snapshot_json"]) == {"v": 3}


class TestCompare:
    def test_compare_returns_winner(self):
        pid = _make_project()
        sa = _make_strategy(pid, name="Fast")
        sb = _make_strategy(pid, name="Slow")

        # Create runs tagged to strategy A with higher scores
        _make_run(pid, sa["id"], 0.8)
        _make_run(pid, sa["id"], 0.9)

        # Create runs tagged to strategy B with lower scores
        _make_run(pid, sb["id"], 0.3)
        _make_run(pid, sb["id"], 0.4)

        r = client.post(f"/api/v1/projects/{pid}/strategies/compare", json={
            "strategy_a_id": sa["id"],
            "strategy_b_id": sb["id"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["winner"] == "a"
        assert data["confidence"] > 0
        assert data["value_a"] > data["value_b"]
        assert data["suggestion"] is not None
        # Suggestion uses guarded language
        assert any(word in data["suggestion"].lower() for word in [
            "tentatively", "appears", "might", "consider", "preliminary",
            "edge", "marginally",
        ])

    def test_compare_with_no_data_returns_tie(self):
        pid = _make_project()
        sa = _make_strategy(pid, name="Empty A")
        sb = _make_strategy(pid, name="Empty B")

        r = client.post(f"/api/v1/projects/{pid}/strategies/compare", json={
            "strategy_a_id": sa["id"],
            "strategy_b_id": sb["id"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["winner"] == "tie"
        assert data["confidence"] == 0.0
        assert data["data_mode"] == "insufficient_data"
        assert "insufficient" in data["suggestion"].lower()


class TestPriorities:
    def test_rank_by_score(self):
        pid = _make_project()
        _make_agenda_item(pid, question="Low priority task", priority=1.0)
        _make_agenda_item(pid, question="High priority task", priority=5.0)
        _make_agenda_item(pid, question="Medium priority task", priority=3.0)

        r = client.get(f"/api/v1/projects/{pid}/priorities")
        assert r.status_code == 200
        priorities = r.json()
        assert len(priorities) == 3
        # Ranked by score descending
        assert priorities[0]["rank"] == 1
        assert priorities[0]["score"] >= priorities[1]["score"]
        assert priorities[1]["score"] >= priorities[2]["score"]


class TestSuggestNext:
    def test_suggest_returns_guarded_language(self):
        pid = _make_project()
        _make_agenda_item(pid, question="Investigate hypothesis X", priority=5.0)

        r = client.post(f"/api/v1/projects/{pid}/suggest-next", json={})
        assert r.status_code == 200
        data = r.json()
        assert data["agenda_item_id"] is not None
        assert data["confidence"] > 0

        # Verify guarded language patterns
        suggestion = data["suggestion"].lower()
        assert any(word in suggestion for word in [
            "might", "consider", "appears", "possibility",
            "seems", "preliminary", "could",
        ])

    def test_suggestion_confidence(self):
        pid = _make_project()
        _make_agenda_item(pid, question="Top item", priority=8.0)

        r = client.post(f"/api/v1/projects/{pid}/suggest-next", json={})
        assert r.status_code == 200
        data = r.json()
        assert 0.0 <= data["confidence"] <= 1.0
        assert len(data["rationale"]) > 0

    def test_suggest_empty_project(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/suggest-next", json={})
        assert r.status_code == 200
        data = r.json()
        assert data["agenda_item_id"] is None
        assert data["confidence"] == 0.0
