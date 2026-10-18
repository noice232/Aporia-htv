"""Demo research workflow, human guidance, and project scope."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def _project(client: TestClient) -> str:
    response = client.post("/api/v1/projects", json={
        "title": "3D reconstruction investigation",
        "objective": "Compare NeRF and Gaussian splatting",
    })
    assert response.status_code == 201
    return response.json()["id"]


def test_research_loop_feedback_changes_policy_and_emits_steps():
    client = TestClient(app)
    project_id = _project(client)
    root = f"/api/v1/projects/{project_id}"

    start = client.post(f"{root}/research/start")
    assert start.status_code == 200, start.text
    data = start.json()
    assert [step["phase"] for step in data["steps"]] == [
        "scan", "hypothesize", "experiment", "evaluate", "plan",
    ]
    assert all(not step["human_influenced"] for step in data["steps"])
    assert data["state"] == "completed"
    assert client.post(f"{root}/research/start").json()["steps"] == data["steps"]

    baseline = client.get(f"{root}/policy/comparison").json()
    assert baseline["with_cfg"]["w"] == 0
    assert baseline["without_cfg"]["candidates"][0]["candidate_id"] == "nerf"

    hypothesis = data["steps"][1]
    response = client.post(
        f"{root}/research/steps/{hypothesis['id']}/feedback",
        json={"text": "Redirect toward Gaussian splatting for real-time rendering.",
              "action": "redirect"},
    )
    assert response.status_code == 201, response.text
    feedback = response.json()
    assert feedback["step"]["parent_step_id"] == hypothesis["id"]
    assert feedback["step"]["human_influenced"]
    assert "Gaussian Splatting" in feedback["step"]["content"]

    all_steps = client.get(f"{root}/research/steps").json()
    human = client.get(f"{root}/research/steps", params={"human_only": True}).json()
    autonomous = client.get(f"{root}/research/steps", params={"autonomous_only": True}).json()
    assert len(all_steps) == len(human) + len(autonomous)
    assert any(step["id"] == hypothesis["id"] for step in human)
    assert all(step["human_influenced"] for step in human)
    assert all(not step["human_influenced"] for step in autonomous)
    assert client.get(f"{root}/research/steps", params={
        "human_only": True, "autonomous_only": True,
    }).status_code == 422

    comparison = client.get(f"{root}/policy/comparison").json()
    assert comparison["with_cfg"]["w"] > 0
    assert comparison["with_cfg"]["candidates"][0]["candidate_id"] == "gaussian_splatting"
    assert comparison["without_cfg"]["candidates"][0]["candidate_id"] == "nerf"
    assert next(d for d in comparison["diff"] if d["candidate_id"] == "gaussian_splatting")["rank_delta"] > 0

    events = client.get(f"{root}/events", params={"limit": 100}).json()["events"]
    agent_events = [event for event in events if event["type"] == "agent_step"]
    assert len(agent_events) == len(all_steps)
    assert all(set(["phase", "description", "evidence", "confidence"]) <= set(event["payload"])
               for event in agent_events)
    streamed = client.get(f"{root}/stream", params={"after": 0}).text
    assert '"type": "agent_step"' in streamed


def test_paper_search_retrieval_and_experiment_override():
    client = TestClient(app)
    project_id = _project(client)
    other_id = _project(client)
    root = f"/api/v1/projects/{project_id}"

    papers = client.post(f"{root}/papers/search", json={
        "query": "3D reconstruction Gaussian splatting", "semantic": True, "limit": 5,
    })
    assert papers.status_code == 200, papers.text
    results = papers.json()
    assert results
    assert any("Gaussian Splatting" in result["title"] for result in results)
    assert all(0 < result["relevance_score"] <= 1 for result in results)
    paper_id = results[0]["id"]
    detail = client.post(f"{root}/papers/retrieve", json={"paper_ids": [paper_id]})
    assert detail.status_code == 200
    assert detail.json()[0]["methods"] and detail.json()[0]["claims"]
    assert detail.json()[0]["data_mode"] == "mock"
    assert client.post(f"/api/v1/projects/{other_id}/papers/retrieve",
                       json={"paper_ids": [paper_id]}).status_code == 404
    semantic = client.post(f"{root}/papers/search", json={
        "query": "NeRF", "semantic": True,
    }).json()
    lexical = client.post(f"{root}/papers/search", json={
        "query": "NeRF", "semantic": False,
    }).json()
    assert any("Radiance Fields" in paper["title"] for paper in semantic)
    assert lexical == []

    queued = client.post(f"{root}/experiments", json={
        "hypothesis": "Gaussian splatting is faster", "method": "Mock comparison",
        "config": {"views": 12},
    })
    assert queued.status_code == 201, queued.text
    experiment = queued.json()
    assert experiment["status"] == "queued"
    assert experiment["results"] is None
    exp_id = experiment["id"]
    assert client.get(f"{root}/experiments/{exp_id}").json()["config"] == {"views": 12}
    assert client.get(f"/api/v1/projects/{other_id}/experiments/{exp_id}").status_code == 404
    evaluated = client.post(f"{root}/experiments/{exp_id}/evaluate", json={
        "score": 0.8, "notes": "Prioritize real-scene validation",
        "redirect": "Capture more camera views",
    })
    assert evaluated.status_code == 200
    assert evaluated.json()["human_evaluation"]["override_score"] == 0.8
    assert evaluated.json()["human_evaluation"]["redirect"] == "Capture more camera views"
    assert client.get(f"{root}/experiments/{exp_id}").json()["human_evaluation"] == evaluated.json()["human_evaluation"]
    timeline = client.get(f"{root}/timeline").json()
    assert "experiment.queued" in {entry["type"] for entry in timeline}
    assert "experiment.human_evaluated" in {entry["type"] for entry in timeline}


def test_seed_creates_complete_coherent_story():
    client = TestClient(app)
    seeded = client.post("/api/v1/demo/seed")
    assert seeded.status_code == 201, seeded.text
    data = seeded.json()
    project_id = data["project_id"]
    root = f"/api/v1/projects/{project_id}"
    steps = client.get(f"{root}/research/steps").json()
    assert len(steps) == data["research_step_count"]
    assert len([step for step in steps if not step["human_influenced"]]) >= 4
    assert any("NeRF" in step["content"] for step in steps)
    assert any("Gaussian" in step["content"] for step in steps if step["human_influenced"])

    experiment = client.get(f"{root}/experiments/{data['experiment_id']}").json()
    assert experiment["status"] == "completed"
    assert experiment["results"]["metrics"]["gaussian_render_fps"] > experiment["results"]["metrics"]["nerf_render_fps"]
    assert experiment["evaluation"]["next_steps"]

    comparison = client.get(f"{root}/policy/comparison").json()
    assert comparison["with_cfg"]["candidates"][0]["candidate_id"] == "gaussian_splatting"
    assert comparison["without_cfg"]["candidates"][0]["candidate_id"] == "nerf"

    graph = client.get(f"{root}/graph").json()
    assert any("Gaussian Splatting" in node["label"] for node in graph["nodes"])
    timeline = client.get(f"{root}/timeline").json()
    assert len(timeline) == data["timeline_count"]
    assert {"research_step", "human_feedback", "experiment.completed", "judgment"} <= {
        entry["type"] for entry in timeline
    }
    assert sum(entry["type"] == "human_feedback" for entry in timeline) == 2
    assert [entry["timestamp"] for entry in timeline] == sorted(entry["timestamp"] for entry in timeline)
    assert client.get(f"{root}/events", params={"limit": 200}).status_code == 200
