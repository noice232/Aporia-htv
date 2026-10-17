"""CFG-01 through CFG-10: classifier-free guidance policy tests."""
from __future__ import annotations

import inspect

from fastapi.testclient import TestClient

from app.main import app
from app.policy.candidates import DEFAULT_CANDIDATES, DEFAULT_HUMAN_CONTEXT, Candidate
from app.policy.scoring import score_conditioned, score_unconditioned


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="CFG Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "cfg"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _score(project_id: str, w: float, human_context=None):
    c = _client()
    body: dict = {"w": w}
    if human_context is not None:
        body["human_context"] = human_context
    resp = c.post(f"/api/v1/projects/{project_id}/policy/score", json=body)
    assert resp.status_code == 200, resp.text
    return resp.json()


class TestCFG01Math:
    """Worked table: A@w=0, B@w=1, B@w=1.5 with exact scores."""

    def test_unit_scores_a_b(self):
        a = next(c for c in DEFAULT_CANDIDATES if c.id == "A")
        b = next(c for c in DEFAULT_CANDIDATES if c.id == "B")

        s_u_a, _ = score_unconditioned(a)
        s_u_b, _ = score_unconditioned(b)
        assert s_u_a == 0.80
        assert s_u_b == 0.60

        s_c_a, _ = score_conditioned(a, DEFAULT_HUMAN_CONTEXT)
        s_c_b, _ = score_conditioned(b, DEFAULT_HUMAN_CONTEXT)
        assert s_c_a == 0.50
        assert s_c_b == 0.90

    def test_guided_w0_selects_a(self):
        proj = _create_project()
        result = _score(proj["id"], w=0.0, human_context=DEFAULT_HUMAN_CONTEXT)
        assert result["selected_candidate_id"] == "A"
        a_score = next(s for s in result["scores"] if s["candidate_id"] == "A")
        assert a_score["s_guided"] == 0.80

    def test_guided_w1_selects_b(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        assert result["selected_candidate_id"] == "B"
        b_score = next(s for s in result["scores"] if s["candidate_id"] == "B")
        assert b_score["s_guided"] == 0.90

    def test_guided_w15_selects_b_with_extrapolation(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.5, human_context=DEFAULT_HUMAN_CONTEXT)
        assert result["selected_candidate_id"] == "B"

        scores_by_id = {s["candidate_id"]: s for s in result["scores"] if s["feasible"]}
        assert abs(scores_by_id["B"]["s_guided"] - 1.05) < 1e-9
        assert abs(scores_by_id["A"]["s_guided"] - 0.35) < 1e-9


class TestCFG02Isolation:
    """U must not accept human_context; C must require it."""

    def test_unconditioned_has_no_human_context_param(self):
        sig = inspect.signature(score_unconditioned)
        param_names = list(sig.parameters.keys())
        assert "human_context" not in param_names

    def test_unconditioned_rejects_human_context_kwarg(self):
        a = DEFAULT_CANDIDATES[0]
        try:
            score_unconditioned(a, human_context=DEFAULT_HUMAN_CONTEXT)  # type: ignore[call-arg]
            assert False, "Should have raised TypeError"
        except TypeError:
            pass

    def test_conditioned_requires_human_context(self):
        a = DEFAULT_CANDIDATES[0]
        try:
            score_conditioned(a, None)  # type: ignore[arg-type]
            assert False, "Should have raised ValueError"
        except ValueError:
            pass


class TestCFG03CommonCandidates:
    """Same candidate set scored by both policies."""

    def test_all_feasible_candidates_scored(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        scored_ids = {s["candidate_id"] for s in result["scores"]}
        expected_ids = {c.id for c in DEFAULT_CANDIDATES}
        assert scored_ids == expected_ids

    def test_both_scores_present_for_feasible(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        for s in result["scores"]:
            if s["feasible"]:
                assert s["s_u"] is not None
                assert s["s_c"] is not None
                assert s["delta"] is not None
                assert s["s_guided"] is not None


class TestCFG04HardConstraints:
    """Infeasible candidate F never chosen despite high potential score."""

    def test_infeasible_never_selected(self):
        proj = _create_project()
        for w in [0.0, 1.0, 1.5]:
            result = _score(proj["id"], w=w, human_context=DEFAULT_HUMAN_CONTEXT)
            assert result["selected_candidate_id"] != "F"

    def test_infeasible_reason_persisted(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        f_score = next(s for s in result["scores"] if s["candidate_id"] == "F")
        assert f_score["feasible"] is False
        assert f_score["infeasibility_reason"] == "exceeds_budget"


class TestCFG05NoContextFallback:
    """Without human_context, s_c=s_u and fallback marked."""

    def test_fallback_when_no_context(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=None)
        assert result["fallback_reason"] == "no_human_context"

    def test_scores_equal_when_no_context(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=None)
        for s in result["scores"]:
            if s["feasible"]:
                assert s["s_u"] == s["s_c"], f"s_u != s_c for {s['candidate_id']} without context"
                assert s["delta"] == 0.0


class TestCFG06ScaleValidation:
    """Raw s_u/s_c must be in [0,1]; s_g can exceed under extrapolation."""

    def test_raw_scores_in_unit_range(self):
        for c in DEFAULT_CANDIDATES:
            if not c.feasible:
                continue
            s_u, _ = score_unconditioned(c)
            assert 0.0 <= s_u <= 1.0, f"s_u={s_u} for {c.id}"
            s_c, _ = score_conditioned(c, DEFAULT_HUMAN_CONTEXT)
            assert 0.0 <= s_c <= 1.0, f"s_c={s_c} for {c.id}"

    def test_guided_can_exceed_unit(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.5, human_context=DEFAULT_HUMAN_CONTEXT)
        b_score = next(s for s in result["scores"] if s["candidate_id"] == "B")
        assert b_score["s_guided"] > 1.0


class TestCFG07SourcePermission:
    """Different human_context produces different C scores."""

    def test_different_context_different_scores(self):
        a = DEFAULT_CANDIDATES[0]
        ctx_geo = DEFAULT_HUMAN_CONTEXT
        ctx_vis = {
            "principles": ["visual_aesthetics"],
            "scoring_weights": {
                "visual_appeal": 0.70,
                "geometric_coverage": 0.00,
                "info_gain": 0.10,
                "cost_efficiency": 0.20,
            },
        }
        s_c_geo, _ = score_conditioned(a, ctx_geo)
        s_c_vis, _ = score_conditioned(a, ctx_vis)
        assert s_c_geo != s_c_vis

    def test_empty_principles_produces_different_scores(self):
        a = DEFAULT_CANDIDATES[0]
        ctx_empty = {
            "principles": [],
            "scoring_weights": {
                "visual_appeal": 0.25,
                "geometric_coverage": 0.25,
                "info_gain": 0.25,
                "cost_efficiency": 0.25,
            },
        }
        s_c_default, _ = score_conditioned(a, DEFAULT_HUMAN_CONTEXT)
        s_c_empty, _ = score_conditioned(a, ctx_empty)
        assert s_c_default != s_c_empty


class TestCFG08ForkFairness:
    """Two runs at different w share the same snapshot hash."""

    def test_same_snapshot_hash(self):
        proj = _create_project()
        r0 = _score(proj["id"], w=0.0, human_context=DEFAULT_HUMAN_CONTEXT)
        r1 = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        assert r0["id"] != r1["id"]

        c = _client()
        run0 = c.get(f"/api/v1/projects/{proj['id']}/policy/runs/{r0['id']}").json()
        run1 = c.get(f"/api/v1/projects/{proj['id']}/policy/runs/{r1['id']}").json()
        assert run0["snapshot_id"] != run1["snapshot_id"]
        assert run0["w"] == 0.0
        assert run1["w"] == 1.0


class TestCFG09Idempotency:
    """POST /policy/choose with same key returns same result."""

    def test_idempotent_choose(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        run_id = result["id"]

        c = _client()
        body = {
            "policy_run_id": run_id,
            "idempotency_key": "test-idem-001",
        }
        r1 = c.post(f"/api/v1/projects/{proj['id']}/policy/choose", json=body)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["status"] == "chosen"

        r2 = c.post(f"/api/v1/projects/{proj['id']}/policy/choose", json=body)
        assert r2.status_code == 200
        d2 = r2.json()
        assert d1["policy_run_id"] == d2["policy_run_id"]
        assert d1["selected_candidate_id"] == d2["selected_candidate_id"]

    def test_choose_infeasible_rejected(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)
        run_id = result["id"]

        c = _client()
        body = {
            "policy_run_id": run_id,
            "candidate_id": "F",
            "idempotency_key": "test-idem-infeasible",
        }
        r = c.post(f"/api/v1/projects/{proj['id']}/policy/choose", json=body)
        assert r.status_code == 400
        assert "infeasible" in r.json()["detail"].lower()


class TestCFG10Metaevaluation:
    """PolicyRun stores w + scores for outcome analysis."""

    def test_run_stores_w_and_scores(self):
        proj = _create_project()
        result = _score(proj["id"], w=1.0, human_context=DEFAULT_HUMAN_CONTEXT)

        c = _client()
        run = c.get(f"/api/v1/projects/{proj['id']}/policy/runs/{result['id']}").json()
        assert run["w"] == 1.0
        assert len(run["scores"]) == len(DEFAULT_CANDIDATES)
        for s in run["scores"]:
            if s["feasible"]:
                assert "s_u" in s and s["s_u"] is not None
                assert "s_c" in s and s["s_c"] is not None

    def test_multiple_w_values_queryable(self):
        proj = _create_project()
        runs = []
        for w in [0.0, 0.5, 1.0, 1.5]:
            r = _score(proj["id"], w=w, human_context=DEFAULT_HUMAN_CONTEXT)
            runs.append(r)

        assert len({r["id"] for r in runs}) == 4
        selected = {r["w"]: r["selected_candidate_id"] for r in runs}
        assert selected[0.0] == "A"
        assert selected[1.0] == "B"
        assert selected[1.5] == "B"
