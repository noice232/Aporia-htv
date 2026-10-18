"""C9: API breadth smoke across the implemented research slices.

This is a local deterministic integration journey. It does not certify the
separate frozen OpenAPI contract or live Papiers, Gemini, GPU, or Tiger calls.
"""

from __future__ import annotations

import hashlib
import json

from fastapi.testclient import TestClient

from app.main import app


def test_research_journey_across_breadth_slices(monkeypatch):
    client = TestClient(app, raise_server_exceptions=False)

    def call(method: str, path: str, expected: int = 200, **kwargs):
        response = client.request(method, path, **kwargs)
        assert response.status_code == expected, f"{method} {path}: {response.status_code} {response.text}"
        return response.json()

    project = call(
        "POST", "/api/v1/projects", 201,
        json={"title": "C9 camera study", "objective": "Compare 3DGS camera coverage"},
    )
    base = f"/api/v1/projects/{project['id']}"
    papiers = call("GET", "/api/v1/papiers/status")
    assert papiers["mode"] in {"disconnected", "live_source"}
    monkeypatch.delenv("APORIA_PAPIERS_ACCESS_KEY", raising=False)
    call("POST", "/api/v1/papiers/search", 503, json={"query": "3DGS coverage"})
    session = call(
        "POST", "/api/v1/research-sessions", 201,
        json={"title": "Camera study", "goal": "Improve scene coverage", "project_id": project["id"]},
    )
    session_path = f"/api/v1/research-sessions/{session['id']}"

    # A goal-specific plan, an experiment specification, and an inspectable blocker.
    plan = call("POST", f"{base}/plans", 201, json={"goal_text": "Improve scene coverage"})
    assert plan["hypotheses"] and plan["protocols"]
    assert call("POST", f"{base}/plans/{plan['id']}/approve")["status"] == "approved"
    spec = call(
        "POST", f"{base}/experiment-specs", 201,
        json={
            "plan_id": plan["id"],
            "hypothesis_id": plan["hypotheses"][0]["id"],
            "evaluator_version": "c9-deterministic-grid",
            "parameters_json": json.dumps({"camera_count": 6}),
            "dataset_hash": "c9-grid-fixture",
        },
    )
    assert spec["plan_id"] == plan["id"]
    parent = call(
        "POST", f"{base}/frontier/nodes", 201,
        json={
            "node_type": "objective", "label": "Reach coverage target", "status": "active",
            "threshold_json": json.dumps({"coverage": 0.8}),
            "measured_json": json.dumps({"coverage": 0.2}),
            "data_mode": "demo_fixture",
        },
    )
    blocked = call("POST", f"{base}/frontier/detect-blockers")
    assert [node["id"] for node in blocked["blocked_nodes"]] == [parent["id"]]
    assert blocked["children_created"][0]["parent_id"] == parent["id"]

    # Run the bounded evaluator, store its result, and link a measured session step.
    goal = call("POST", f"{base}/goals", json={"threshold": 1.0})
    assert goal["runs"] and goal["agenda_item_id"]
    run_id = goal["runs"][0]["id"]
    metrics = json.dumps({"run_id": run_id, "coverage": goal["runs"][0]["coverage_fraction"]})
    artifact = call(
        "POST", f"{base}/artifacts", 201,
        json={"kind": "metric_json", "label": "C9 coverage", "run_id": run_id, "content_json": metrics},
    )
    assert artifact["content_hash"] == hashlib.sha256(metrics.encode()).hexdigest()
    assert call("GET", f"{base}/runs/{run_id}/artifacts")[0]["id"] == artifact["id"]
    step = call(
        "POST", f"{session_path}/steps", 201,
        json={
            "kind": "experiment", "title": "Evaluate candidate views", "status": "completed",
            "data_mode": "measured", "evidence_status": "provided",
            "evidence_reference": f"sha256:{artifact['content_hash']}",
        },
    )
    assert step["sequence"] == 1

    # The human checkpoint is persisted before guided scoring and fork replay.
    checkpoint = call(
        "POST", f"{session_path}/checkpoints", 201,
        json={"prompt": "Should geometry coverage outrank visual appeal?"},
    )
    call(
        "POST", f"{session_path}/checkpoints/{checkpoint['id']}/answer",
        json={"answer": "Prioritize geometry", "guidance_weight": 1.0},
    )
    principle = call(
        "POST", f"{base}/judgments", 201,
        json={"text": "Prefer geometry-consistent coverage over visual appeal"},
    )
    assert principle["source"] == "manual" and not principle["approved"]
    call("POST", f"{base}/principles/{principle['id']}/approve")
    guided = call("POST", f"{base}/policy/score", json={"w": 1.0})
    assert guided["fallback_reason"] is None
    fork = call("POST", f"{base}/forks", 201, json={"w": 1.0})
    replay = call("POST", f"{base}/forks/{fork['id']}/replay", 201, json={"w": 0.0})
    assert replay["id"] != fork["id"]
    assert replay["shared_dataset_hash"] == fork["shared_dataset_hash"]
    assert replay["shared_evaluator_version"] == fork["shared_evaluator_version"]
    assert call("GET", session_path)["checkpoints"][0]["answer"] == "Prioritize geometry"

    # PARALLAX holds opposing claims; a reviewed skill can be retrieved later.
    claim_a = call(
        "POST", f"{base}/claims", 201,
        json={"text": "View A covers more geometry", "claim_type": "hypothesis", "source_node_id": parent["id"]},
    )
    claim_b = call(
        "POST", f"{base}/claims", 201,
        json={"text": "View B covers more geometry", "claim_type": "hypothesis", "source_node_id": parent["id"]},
    )
    dispute = call(
        "POST", f"{base}/disputes", 201,
        json={"claim_a_id": claim_a["id"], "claim_b_id": claim_b["id"]},
    )
    proposal = call("POST", f"{base}/disputes/{dispute['id']}/propose-experiment")
    assert proposal["status"] == "investigating"
    assert json.loads(proposal["discriminating_experiment_json"])["claim_a"] == claim_a["text"]
    skill = call(
        "POST", f"{base}/skills", 201,
        json={"source_step_id": step["id"], "domain": "3dgs"},
    )
    assert skill["source_step_id"] == step["id"]
    assert call("POST", f"{base}/skills/{skill['id']}/promote", expected=400)["detail"]
    call(
        "POST", f"{base}/skills/{skill['id']}/review", 201,
        json={"reviewer": "human", "verdict": "approve", "comment": "Retain as a candidate method"},
    )
    assert call("POST", f"{base}/skills/{skill['id']}/promote")["status"] == "promoted"
    assert any(item["id"] == skill["id"] for item in call("GET", "/api/v1/skills", params={"domain": "3dgs", "status": "promoted"}))

    # Portfolio suggestions use the queued agenda, while strategy comparison
    # honestly reports insufficient evidence until runs are tagged to strategies.
    strategy_a = call("POST", f"{base}/strategies", 201, json={"name": "Baseline"})
    strategy_b = call("POST", f"{base}/strategies", 201, json={"name": "Guided"})
    comparison = call(
        "POST", f"{base}/strategies/compare",
        json={"strategy_a_id": strategy_a["id"], "strategy_b_id": strategy_b["id"]},
    )
    assert comparison["data_mode"] == "insufficient_data"
    suggestion = call("POST", f"{base}/suggest-next", json={"strategy_id": strategy_a["id"]})
    assert suggestion["agenda_item_id"] == goal["agenda_item_id"]
