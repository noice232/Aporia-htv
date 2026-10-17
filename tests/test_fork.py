"""P4: Counterfactual fork — both branches evaluated with real coverage."""
from __future__ import annotations

import numpy as np
from fastapi.testclient import TestClient

from app.evaluator import CameraPose, compute_coverage, look_at, make_unit_cube_cloud
from app.main import app
from app.policy.candidates import DEFAULT_CANDIDATES
from app.runner import INTRINSICS


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Fork Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "p4"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _setup_guided_profile(project_id: str):
    c = _client()
    p = c.post(
        f"/api/v1/projects/{project_id}/judgments",
        json={"text": "prefer geometry-consistent coverage over visual appeal"},
    ).json()
    c.post(f"/api/v1/projects/{project_id}/principles/{p['id']}/approve")
    return p


def _create_fork(project_id: str, w: float = 1.0, idempotency_key: str | None = None):
    c = _client()
    body: dict = {"w": w}
    if idempotency_key is not None:
        body["idempotency_key"] = idempotency_key
    resp = c.post(f"/api/v1/projects/{project_id}/forks", json=body)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestForkCreatesBothBranches:
    def test_both_branches_have_distinct_run_ids(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        assert fork["branch_unguided"]["run_id"] is not None
        assert fork["branch_guided"]["run_id"] is not None
        assert fork["branch_unguided"]["run_id"] != fork["branch_guided"]["run_id"]
        assert fork["branch_unguided"]["status"] == "evaluated"
        assert fork["branch_guided"]["status"] == "evaluated"

    def test_branches_select_different_candidates(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        assert fork["branch_unguided"]["candidate_id"] == "A"
        assert fork["branch_guided"]["candidate_id"] == "B"


class TestSharedEvaluatorAndDataset:
    def test_shared_context(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        assert fork["shared_evaluator_version"] == "0.1.0"
        assert len(fork["shared_dataset_hash"]) == 64
        assert fork["shared_budget"] == "single_pose"


class TestCoverageMatchesIndependentEvaluator:
    def test_coverage_values_match(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        points, normals = make_unit_cube_cloud(points_per_face=25)
        cand_map = {c.id: c for c in DEFAULT_CANDIDATES}

        for branch_key, cand_id in [
            ("branch_unguided", fork["branch_unguided"]["candidate_id"]),
            ("branch_guided", fork["branch_guided"]["candidate_id"]),
        ]:
            cand = cand_map[cand_id]
            ext = look_at(np.array(cand.eye, dtype=float), np.array(cand.target, dtype=float))
            pose = CameraPose(intrinsics=INTRINSICS, extrinsics=ext)
            result = compute_coverage(pose, points, normals)

            assert abs(fork[branch_key]["coverage_fraction"] - result.coverage_fraction) < 1e-9
            assert fork[branch_key]["visible_count"] == result.visible_count
            assert fork[branch_key]["total_count"] == result.total_count


class TestGuidedWinsOnCoverage:
    def test_guided_branch_wins(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        assert fork["branch_guided"]["coverage_fraction"] > fork["branch_unguided"]["coverage_fraction"]
        assert fork["comparison"]["winner"] == "guided"
        assert fork["comparison"]["coverage_delta"] > 0
        assert fork["comparison"]["status"] == "complete"


class TestNotEvaluatedBranch:
    def test_get_fork_shows_status(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/forks/{fork['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["branch_unguided"]["status"] == "evaluated"
        assert data["branch_guided"]["status"] == "evaluated"


class TestIdempotency:
    def test_same_key_returns_same_fork(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])

        fork1 = _create_fork(proj["id"], idempotency_key="fork-test-001")
        fork2 = _create_fork(proj["id"], idempotency_key="fork-test-001")

        assert fork1["id"] == fork2["id"]
        assert fork1["branch_unguided"]["run_id"] == fork2["branch_unguided"]["run_id"]
        assert fork1["branch_guided"]["run_id"] == fork2["branch_guided"]["run_id"]


class TestForkEvents:
    def test_events_emitted(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        _create_fork(proj["id"])

        c = _client()
        events = c.get(f"/api/v1/projects/{proj['id']}/events?limit=200").json()

        branch_events = [e for e in events["events"] if e["type"] == "fork.branch_completed"]
        assert len(branch_events) == 2
        branches = {e["payload"]["branch"] for e in branch_events}
        assert branches == {"unguided", "guided"}

        created_events = [e for e in events["events"] if e["type"] == "fork.created"]
        assert len(created_events) == 1
        assert "winner" in created_events[0]["payload"]


class TestSameCandidateNoted:
    def test_w_zero_same_candidate(self):
        proj = _create_project()
        fork = _create_fork(proj["id"], w=0.0)

        assert fork["branch_unguided"]["candidate_id"] == fork["branch_guided"]["candidate_id"]
        assert "both_branches_selected_same_candidate" in fork["comparison"]["limitations"]


class TestHonestReporting:
    def test_unguided_can_win(self):
        proj = _create_project()
        fork = _create_fork(proj["id"], w=0.0)

        assert fork["comparison"]["winner"] == "tie"


class TestListForks:
    def test_list_returns_forks(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/forks")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == fork["id"]
        assert data[0]["winner"] == "guided"


class TestGetFork:
    def test_get_by_id(self):
        proj = _create_project()
        _setup_guided_profile(proj["id"])
        fork = _create_fork(proj["id"])

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/forks/{fork['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == fork["id"]
        assert data["branch_guided"]["coverage_fraction"] > 0

    def test_get_nonexistent_returns_404(self):
        proj = _create_project()
        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/forks/nonexistent")
        assert resp.status_code == 404
