from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app, raise_server_exceptions=False)


def _make_project() -> str:
    r = client.post("/api/v1/projects", json={"title": "skill-test", "goal": "test skills"})
    assert r.status_code == 201
    return r.json()["id"]


def _make_session(project_id: str | None = None) -> str:
    body = {"title": "test session", "goal": "explore skills"}
    if project_id:
        body["project_id"] = project_id
    r = client.post("/api/v1/research-sessions", json=body)
    assert r.status_code == 201
    return r.json()["id"]


def _make_step(session_id: str, title: str = "Run experiment", detail: str = "Measured output") -> str:
    r = client.post(f"/api/v1/research-sessions/{session_id}/steps", json={
        "kind": "experiment",
        "title": title,
        "detail": detail,
        "status": "completed",
        "data_mode": "measured",
        "evidence_status": "provided",
        "evidence_reference": "ref-001",
    })
    assert r.status_code == 201
    return r.json()["id"]


class TestExtractSkill:
    def test_extract_from_session_step(self):
        pid = _make_project()
        sid = _make_session(pid)
        step_id = _make_step(sid, title="Catalyst optimization", detail="Found optimal temperature range")
        r = client.post(f"/api/v1/projects/{pid}/skills", json={
            "source_step_id": step_id,
        })
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "Catalyst optimization"
        assert data["description"] == "Found optimal temperature range"
        assert data["source_step_id"] == step_id
        assert data["session_id"] == sid
        assert data["status"] == "candidate"

    def test_evidence_summary_from_step(self):
        pid = _make_project()
        sid = _make_session(pid)
        step_id = _make_step(sid, title="pH measurement", detail="pH 7.4 optimal for growth")
        r = client.post(f"/api/v1/projects/{pid}/skills", json={
            "source_step_id": step_id,
        })
        assert r.status_code == 201
        data = r.json()
        assert "pH measurement" in data["evidence_summary"]
        assert "pH 7.4 optimal for growth" in data["evidence_summary"]

    def test_extract_with_manual_title(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Manual skill",
            "description": "Learned manually",
            "domain": "chemistry",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "Manual skill"
        assert data["domain"] == "chemistry"


class TestReview:
    def test_review_approve(self):
        pid = _make_project()
        sr = client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Skill A", "description": "Desc A",
        })
        skill_id = sr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/skills/{skill_id}/review", json={
            "reviewer": "human",
            "verdict": "approve",
            "comment": "Looks good",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["reviewer"] == "human"
        assert data["verdict"] == "approve"
        assert data["comment"] == "Looks good"

    def test_review_transitions_to_under_review(self):
        pid = _make_project()
        sr = client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Skill B", "description": "Desc B",
        })
        skill_id = sr.json()["id"]
        client.post(f"/api/v1/projects/{pid}/skills/{skill_id}/review", json={
            "reviewer": "agent",
            "verdict": "approve",
        })
        detail = client.get(f"/api/v1/projects/{pid}/skills/{skill_id}").json()
        assert detail["status"] == "under_review"


class TestPromote:
    def test_promote_requires_approval(self):
        pid = _make_project()
        sr = client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "No reviews", "description": "Nope",
        })
        skill_id = sr.json()["id"]
        r = client.post(f"/api/v1/projects/{pid}/skills/{skill_id}/promote")
        assert r.status_code == 400
        assert "approval" in r.json()["detail"].lower()

    def test_promote_transitions_status(self):
        pid = _make_project()
        sr = client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Promotable", "description": "Will be promoted",
        })
        skill_id = sr.json()["id"]
        client.post(f"/api/v1/projects/{pid}/skills/{skill_id}/review", json={
            "reviewer": "human",
            "verdict": "approve",
            "comment": "Approved",
        })
        r = client.post(f"/api/v1/projects/{pid}/skills/{skill_id}/promote")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "promoted"
        assert data["promoted_at"] is not None


class TestRetrieve:
    def test_retrieve_by_domain(self):
        pid = _make_project()
        client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Bio skill", "description": "Bio", "domain": "biology",
        })
        client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Chem skill", "description": "Chem", "domain": "chemistry",
        })
        r = client.get(f"/api/v1/projects/{pid}/skills", params={"domain": "biology"})
        assert r.status_code == 200
        skills = r.json()
        assert len(skills) == 1
        assert skills[0]["domain"] == "biology"

    def test_cross_project_retrieval(self):
        pid1 = _make_project()
        pid2 = _make_project()
        client.post(f"/api/v1/projects/{pid1}/skills", json={
            "title": "Skill from P1", "description": "D1", "domain": "physics",
        })
        client.post(f"/api/v1/projects/{pid2}/skills", json={
            "title": "Skill from P2", "description": "D2", "domain": "physics",
        })
        r = client.get("/api/v1/skills", params={"domain": "physics"})
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_rejected_not_in_promoted_list(self):
        pid = _make_project()
        sr = client.post(f"/api/v1/projects/{pid}/skills", json={
            "title": "Will reject", "description": "Bad skill",
        })
        skill_id = sr.json()["id"]
        client.post(f"/api/v1/projects/{pid}/skills/{skill_id}/review", json={
            "reviewer": "human",
            "verdict": "reject",
            "comment": "Not useful",
        })
        r = client.get(f"/api/v1/projects/{pid}/skills", params={"status": "promoted"})
        assert r.status_code == 200
        ids = [s["id"] for s in r.json()]
        assert skill_id not in ids
