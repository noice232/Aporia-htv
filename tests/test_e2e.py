"""E2E smoke test: the full demo thread from project creation to fork verdict."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


class TestDemoThread:
    def test_full_demo_thread(self):
        c = _client()

        # 1. Create project
        resp = c.post("/api/v1/projects", json={"title": "E2E Demo", "objective": "smoke test"})
        assert resp.status_code == 201
        proj = resp.json()
        pid = proj["id"]

        # 2. Submit goal (threshold=1.0 forces below-threshold → agenda item)
        resp = c.post(f"/api/v1/projects/{pid}/goals", json={"threshold": 1.0})
        assert resp.status_code == 200
        goal = resp.json()
        assert goal["threshold_met"] is False
        assert goal["agenda_item_id"] is not None
        assert len(goal["runs"]) == 6

        # 3. Score w=0, no profile → picks A (unconditioned winner)
        resp = c.post(f"/api/v1/projects/{pid}/policy/score", json={"w": 0.0})
        assert resp.status_code == 200
        score_w0 = resp.json()
        assert score_w0["selected_candidate_id"] == "A"
        assert score_w0["fallback_reason"] == "no_human_context"

        # 4. Submit judgment → unapproved principle
        resp = c.post(
            f"/api/v1/projects/{pid}/judgments",
            json={"text": "prefer geometry-consistent coverage over visual appeal"},
        )
        assert resp.status_code == 201
        principle = resp.json()
        assert principle["approved"] is False
        assert principle["enabled"] is True
        principle_id = principle["id"]

        # 5. Score w=1, unapproved → still A (fallback, principle has no effect)
        resp = c.post(f"/api/v1/projects/{pid}/policy/score", json={"w": 1.0})
        assert resp.status_code == 200
        score_unapproved = resp.json()
        assert score_unapproved["selected_candidate_id"] == "A"
        assert score_unapproved["fallback_reason"] == "no_human_context"

        # 6. Approve principle
        resp = c.post(f"/api/v1/projects/{pid}/principles/{principle_id}/approve")
        assert resp.status_code == 200
        approved = resp.json()
        assert approved["approved"] is True

        # 7. Score w=1, approved → flips to B
        resp = c.post(f"/api/v1/projects/{pid}/policy/score", json={"w": 1.0})
        assert resp.status_code == 200
        score_approved = resp.json()
        assert score_approved["selected_candidate_id"] == "B"
        assert score_approved["fallback_reason"] is None

        # 8. Create fork w=1 → guided branch wins with real measured coverage
        resp = c.post(f"/api/v1/projects/{pid}/forks", json={"w": 1.0})
        assert resp.status_code == 201
        fork = resp.json()

        bu = fork["branch_unguided"]
        bg = fork["branch_guided"]
        comp = fork["comparison"]

        assert bu["candidate_id"] == "A"
        assert bg["candidate_id"] == "B"
        assert bu["status"] == "evaluated"
        assert bg["status"] == "evaluated"

        # Deterministic grid: A (axis-aligned) = 25/150, B (corner) = 75/150
        assert bu["coverage_fraction"] == 25 / 150
        assert bu["visible_count"] == 25
        assert bu["total_count"] == 150

        assert bg["coverage_fraction"] == 75 / 150
        assert bg["visible_count"] == 75
        assert bg["total_count"] == 150

        assert abs(comp["coverage_delta"] - (75 / 150 - 25 / 150)) < 1e-9
        assert comp["winner"] == "guided"
        assert comp["status"] == "complete"

        # 9. Profile history shows version progression (≥3: empty, added, approved)
        resp = c.get(f"/api/v1/projects/{pid}/profile/history")
        assert resp.status_code == 200
        history = resp.json()
        assert len(history) >= 3
        assert history[0]["version"] == 1
        assert len(history[0]["principles_snapshot"]) == 0
        last = history[-1]
        assert any(p["approved"] for p in last["principles_snapshot"])
