"""Slice 4: Human questions, expert routing, and contract-aligned judgment endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Question Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "slice4"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _create_question(project_id: str, prompt: str = "What method should we use?", **kwargs):
    c = _client()
    body = {"prompt": prompt, **kwargs}
    resp = c.post(f"/api/v1/projects/{project_id}/questions", json=body)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestCreateQuestion:
    def test_creates_pending_question(self):
        proj = _create_project()
        q = _create_question(proj["id"])
        assert q["status"] == "pending"
        assert q["prompt"] == "What method should we use?"
        assert q["project_id"] == proj["id"]
        assert q["answer_text"] is None
        assert q["routed_to"] is None

    def test_create_with_optional_fields(self):
        proj = _create_project()
        q = _create_question(
            proj["id"],
            prompt="Pick a method",
            reason_for_asking="Need expert input",
            options_json='["A","B","C"]',
        )
        assert q["reason_for_asking"] == "Need expert input"
        assert q["options_json"] == '["A","B","C"]'


class TestListQuestions:
    def test_list_returns_all(self):
        proj = _create_project()
        _create_question(proj["id"], prompt="Q1")
        _create_question(proj["id"], prompt="Q2")

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/questions")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_filter_by_status(self):
        proj = _create_project()
        q = _create_question(proj["id"], prompt="Q1")
        _create_question(proj["id"], prompt="Q2")

        # Answer Q1
        c = _client()
        c.post(f"/api/v1/questions/{q['id']}/answer", json={"rationale": "Use X"})

        resp = c.get(f"/api/v1/projects/{proj['id']}/questions?status=pending")
        assert resp.status_code == 200
        pending = resp.json()
        assert len(pending) == 1
        assert pending[0]["prompt"] == "Q2"

        resp = c.get(f"/api/v1/projects/{proj['id']}/questions?status=answered")
        assert resp.status_code == 200
        answered = resp.json()
        assert len(answered) == 1
        assert answered[0]["prompt"] == "Q1"


class TestAnswerQuestion:
    def test_answer_sets_fields(self):
        proj = _create_project()
        q = _create_question(proj["id"])

        c = _client()
        resp = c.post(
            f"/api/v1/questions/{q['id']}/answer",
            json={"rationale": "Use method X", "choice": "A"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "answered"
        assert data["answer_text"] == "Use method X"
        assert data["answer_choice"] == "A"
        assert data["answered_at"] is not None

    def test_answer_already_answered_returns_409(self):
        proj = _create_project()
        q = _create_question(proj["id"])

        c = _client()
        c.post(f"/api/v1/questions/{q['id']}/answer", json={"rationale": "First"})
        resp = c.post(f"/api/v1/questions/{q['id']}/answer", json={"rationale": "Second"})
        assert resp.status_code == 409

    def test_answer_not_found_returns_404(self):
        c = _client()
        resp = c.post(
            "/api/v1/questions/nonexistent-id/answer",
            json={"rationale": "anything"},
        )
        assert resp.status_code == 404


class TestRouteToExpert:
    def test_route_sets_routed_to(self):
        proj = _create_project()
        q = _create_question(proj["id"])

        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/experts/request",
            json={"researcher_id": "expert-42", "question_id": q["id"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["routed_to"] == "expert-42"

    def test_route_question_not_found(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/experts/request",
            json={"researcher_id": "expert-42", "question_id": "nonexistent"},
        )
        assert resp.status_code == 404


class TestCompileJudgment:
    def test_compile_creates_principle(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments/compile",
            json={"context_text": "prefer geometry-consistent coverage"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "compiled"
        assert data["text"] == "prefer geometry-consistent coverage"
        assert data["approved"] is False

    def test_compile_with_source_context_id_sets_papiers(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments/compile",
            json={"context_text": "prefer visual aesthetics", "source_context_id": "some-ref"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "papiers"


class TestReviewJudgment:
    def test_review_approves_judgment(self):
        proj = _create_project()
        c = _client()

        # Compile first
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments/compile",
            json={"context_text": "prefer geometry-consistent coverage"},
        )
        judgment = resp.json()
        assert judgment["approved"] is False

        # Review and approve
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments/{judgment['id']}/review",
            json={"approved": True},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["approved"] is True
        assert data["approved_at"] is not None


class TestListJudgments:
    def test_list_returns_compiled_judgments(self):
        proj = _create_project()
        c = _client()

        c.post(
            f"/api/v1/projects/{proj['id']}/judgments/compile",
            json={"context_text": "prefer geometry-consistent coverage"},
        )
        c.post(
            f"/api/v1/projects/{proj['id']}/judgments/compile",
            json={"context_text": "prefer visual aesthetics"},
        )

        resp = c.get(f"/api/v1/projects/{proj['id']}/judgments")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
