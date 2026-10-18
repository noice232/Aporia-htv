"""The demo session records what happened and where evidence came from."""

from fastapi.testclient import TestClient

from app.main import app


def test_generic_goal_timeline_and_human_checkpoint():
    client = TestClient(app)
    created = client.post(
        "/api/v1/research-sessions",
        json={
            "title": "Find an informative camera view",
            "goal": "Compare novel viewpoints in a Gaussian splat scene",
            "domain": "3D scene research",
        },
    )
    assert created.status_code == 201
    session_id = created.json()["id"]

    planned = client.post(
        f"/api/v1/research-sessions/{session_id}/steps",
        json={
            "kind": "source_search",
            "title": "Find a scene",
            "detail": "Papiers access has not been connected",
            "status": "blocked",
            "data_mode": "planned",
        },
    )
    assert planned.status_code == 201
    assert planned.json()["sequence"] == 1

    question = client.post(
        f"/api/v1/research-sessions/{session_id}/checkpoints",
        json={
            "prompt": "Which outcome matters more, full coverage or visual coherence?",
            "reason": "This preference could change the next experiment",
        },
    )
    assert question.status_code == 201
    checkpoint_id = question.json()["id"]
    assert question.json()["sequence"] == 2

    answer = client.post(
        f"/api/v1/research-sessions/{session_id}/checkpoints/{checkpoint_id}/answer",
        json={"answer": "Favor geometric coverage", "guidance_weight": 1.25},
    )
    assert answer.status_code == 200
    assert answer.json()["status"] == "answered"
    assert answer.json()["answer_sequence"] == 3

    measured = client.post(
        f"/api/v1/research-sessions/{session_id}/steps",
        json={
            "kind": "render",
            "title": "Render candidate A",
            "status": "completed",
            "data_mode": "measured",
            "evidence_status": "provided",
            "evidence_reference": "sha256:3c047f",
        },
    )
    assert measured.status_code == 201
    assert measured.json()["sequence"] == 4

    detail = client.get(f"/api/v1/research-sessions/{session_id}")
    assert detail.status_code == 200
    assert [step["sequence"] for step in detail.json()["steps"]] == [1, 4]
    assert detail.json()["checkpoints"][0]["answer"] == "Favor geometric coverage"
    assert client.get("/api/v1/research-sessions").json()[0]["id"] == session_id


def test_measured_step_cannot_be_saved_without_evidence():
    client = TestClient(app)
    session_id = client.post(
        "/api/v1/research-sessions", json={"title": "Protein search", "goal": "Find lead"}
    ).json()["id"]
    invalid = client.post(
        f"/api/v1/research-sessions/{session_id}/steps",
        json={"kind": "experiment", "title": "Claimed hit", "status": "completed", "data_mode": "measured"},
    )
    assert invalid.status_code == 422
    valid_replay = client.post(
        f"/api/v1/research-sessions/{session_id}/steps",
        json={"kind": "experiment", "title": "Storyboarded hit", "status": "completed", "data_mode": "replay"},
    )
    assert valid_replay.status_code == 201
    assert valid_replay.json()["data_mode"] == "replay"


def test_checkpoint_is_scoped_and_single_answer():
    client = TestClient(app)
    first = client.post(
        "/api/v1/research-sessions", json={"title": "First", "goal": "Goal one"}
    ).json()["id"]
    second = client.post(
        "/api/v1/research-sessions", json={"title": "Second", "goal": "Goal two"}
    ).json()["id"]
    checkpoint = client.post(
        f"/api/v1/research-sessions/{first}/checkpoints", json={"prompt": "Review?"}
    ).json()["id"]
    answer_url = f"/api/v1/research-sessions/{first}/checkpoints/{checkpoint}/answer"
    assert client.post(
        f"/api/v1/research-sessions/{second}/checkpoints/{checkpoint}/answer",
        json={"answer": "Wrong session"},
    ).status_code == 404
    assert client.post(answer_url, json={"answer": "Approved"}).status_code == 200
    assert client.post(answer_url, json={"answer": "Changed"}).status_code == 409
    assert client.get(f"/api/v1/research-sessions/{first}").json()["checkpoints"][0]["answer"] == "Approved"
