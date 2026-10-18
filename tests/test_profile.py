"""P3.5: Researcher profile, principle approval, and profile-driven scoring."""
from __future__ import annotations

import inspect

from fastapi.testclient import TestClient

from app.main import app
from app.policy.scoring import score_unconditioned


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Profile Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "p35"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _add_judgment(project_id: str, text: str):
    c = _client()
    resp = c.post(f"/api/v1/projects/{project_id}/judgments", json={"text": text})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _approve(project_id: str, principle_id: str):
    c = _client()
    resp = c.post(f"/api/v1/projects/{project_id}/principles/{principle_id}/approve")
    assert resp.status_code == 200, resp.text
    return resp.json()


def _score(project_id: str, w: float, human_context=None):
    c = _client()
    body: dict = {"w": w}
    if human_context is not None:
        body["human_context"] = human_context
    resp = c.post(f"/api/v1/projects/{project_id}/policy/score", json=body)
    assert resp.status_code == 200, resp.text
    return resp.json()


class TestJudgmentCreation:
    def test_creates_unapproved_principle(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage over visual appeal")
        assert p["approved"] is False
        assert p["enabled"] is True
        assert p["source"] == "manual"
        assert "geometric_coverage" in p["weight_adjustments"]
        assert p["weight_adjustments"]["geometric_coverage"] > 0

    def test_weight_adjustments_computed(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer visual aesthetics")
        assert p["weight_adjustments"]["visual_appeal"] > 0
        assert p["weight_adjustments"]["geometric_coverage"] < 0


class TestUnapprovedDoesNotAffectScoring:
    def test_unapproved_principle_no_effect(self):
        proj = _create_project()
        _add_judgment(proj["id"], "prefer geometry-consistent coverage over visual appeal")
        result = _score(proj["id"], w=1.0)
        assert result["selected_candidate_id"] == "A"
        assert result["fallback_reason"] == "no_human_context"


class TestApproveFlipsScoring:
    def test_approve_causes_flip(self):
        proj = _create_project()
        before = _score(proj["id"], w=1.0)
        assert before["selected_candidate_id"] == "A"

        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage over visual appeal")
        still_a = _score(proj["id"], w=1.0)
        assert still_a["selected_candidate_id"] == "A"

        _approve(proj["id"], p["id"])
        after = _score(proj["id"], w=1.0)
        assert after["selected_candidate_id"] == "B"
        assert after["fallback_reason"] is None


class TestUIsolationPreserved:
    def test_unconditioned_still_no_human_context(self):
        sig = inspect.signature(score_unconditioned)
        assert "human_context" not in sig.parameters


class TestProfileHistory:
    def test_history_shows_versions(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage")

        c = _client()
        history = c.get(f"/api/v1/projects/{proj['id']}/profile/history").json()
        assert len(history) >= 2
        assert history[0]["version"] == 1
        assert len(history[0]["principles_snapshot"]) == 0

        _approve(proj["id"], p["id"])
        history2 = c.get(f"/api/v1/projects/{proj['id']}/profile/history").json()
        assert len(history2) >= 3
        last = history2[-1]
        assert any(pr["approved"] for pr in last["principles_snapshot"])


class TestDeleteRemovesEffect:
    def test_delete_reverts_scoring(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage")
        _approve(proj["id"], p["id"])

        result = _score(proj["id"], w=1.0)
        assert result["selected_candidate_id"] == "B"

        c = _client()
        resp = c.delete(f"/api/v1/projects/{proj['id']}/principles/{p['id']}")
        assert resp.status_code == 204

        reverted = _score(proj["id"], w=1.0)
        assert reverted["selected_candidate_id"] == "A"


class TestDisableRemovesEffect:
    def test_disable_reverts_scoring(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage")
        _approve(proj["id"], p["id"])

        result = _score(proj["id"], w=1.0)
        assert result["selected_candidate_id"] == "B"

        c = _client()
        resp = c.put(
            f"/api/v1/projects/{proj['id']}/principles/{p['id']}",
            json={"enabled": False},
        )
        assert resp.status_code == 200

        reverted = _score(proj["id"], w=1.0)
        assert reverted["selected_candidate_id"] == "A"


class TestInterventionEvent:
    def test_approve_emits_event(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage")
        _approve(proj["id"], p["id"])

        c = _client()
        events = c.get(f"/api/v1/projects/{proj['id']}/events?limit=200").json()
        intervention_events = [
            e for e in events["events"] if e["type"] == "intervention.approved"
        ]
        assert len(intervention_events) == 1
        payload = intervention_events[0]["payload"]
        assert payload["before"]["approved"] is False
        assert payload["after"]["approved"] is True


class TestEditPrinciple:
    def test_edit_bumps_version(self):
        proj = _create_project()
        p = _add_judgment(proj["id"], "prefer geometry-consistent coverage")

        c = _client()
        profile_before = c.get(f"/api/v1/projects/{proj['id']}/profile").json()
        v_before = profile_before["version"]

        c.put(
            f"/api/v1/projects/{proj['id']}/principles/{p['id']}",
            json={"text": "prefer cost efficiency"},
        )

        profile_after = c.get(f"/api/v1/projects/{proj['id']}/profile").json()
        assert profile_after["version"] > v_before

        updated = next(
            pr for pr in profile_after["principles"] if pr["id"] == p["id"]
        )
        assert updated["text"] == "prefer cost efficiency"
        assert updated["weight_adjustments"]["cost_efficiency"] > 0
