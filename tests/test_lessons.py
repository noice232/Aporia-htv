from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestProposeLesson:
    def test_propose_lesson(self):
        r = client.post("/api/v1/workspaces/ws-1/lessons", json={
            "title": "Optimal pH Range",
            "statement": "pH 7.2-7.6 consistently produces best results",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["title"] == "Optimal pH Range"
        assert data["workspace_id"] == "ws-1"
        assert data["review_state"] == "proposed"
        assert data["version"] == 1

    def test_list_lessons_by_workspace(self):
        client.post("/api/v1/workspaces/ws-x/lessons", json={
            "title": "Lesson 1", "statement": "Statement 1",
        })
        client.post("/api/v1/workspaces/ws-x/lessons", json={
            "title": "Lesson 2", "statement": "Statement 2",
        })
        client.post("/api/v1/workspaces/ws-y/lessons", json={
            "title": "Lesson 3", "statement": "Statement 3",
        })
        r = client.get("/api/v1/workspaces/ws-x/lessons")
        assert r.status_code == 200
        assert len(r.json()) == 2


class TestReviewLesson:
    def test_review_approve(self):
        r = client.post("/api/v1/workspaces/ws-r/lessons", json={
            "title": "Approve me", "statement": "Evidence supports this",
        })
        lesson_id = r.json()["id"]
        r = client.post(f"/api/v1/lessons/{lesson_id}/review", json={
            "approved": True,
            "comment": "Well supported",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["review_state"] == "approved"
        assert data["reviewer_comment"] == "Well supported"

    def test_review_already_reviewed_returns_409(self):
        r = client.post("/api/v1/workspaces/ws-r2/lessons", json={
            "title": "Already done", "statement": "Will be reviewed twice",
        })
        lesson_id = r.json()["id"]
        client.post(f"/api/v1/lessons/{lesson_id}/review", json={
            "approved": False, "comment": "Rejected",
        })
        r = client.post(f"/api/v1/lessons/{lesson_id}/review", json={
            "approved": True,
        })
        assert r.status_code == 409


class TestTransferLesson:
    def test_transfer_records_attempt(self):
        r = client.post("/api/v1/workspaces/ws-t/lessons", json={
            "title": "Transfer me", "statement": "Should transfer",
        })
        lesson_id = r.json()["id"]
        r = client.post(f"/api/v1/lessons/{lesson_id}/transfer", json={
            "target_project_id": "proj-99",
            "experiment_spec_id": "spec-1",
        })
        assert r.status_code == 200
        data = r.json()
        tests = json.loads(data["transfer_tests_json"])
        assert len(tests) == 1
        assert tests[0]["target_project_id"] == "proj-99"
        assert tests[0]["experiment_spec_id"] == "spec-1"

        # Second transfer appends
        r = client.post(f"/api/v1/lessons/{lesson_id}/transfer", json={
            "target_project_id": "proj-100",
        })
        tests = json.loads(r.json()["transfer_tests_json"])
        assert len(tests) == 2


class TestLessonNotFound:
    def test_review_not_found(self):
        r = client.post("/api/v1/lessons/no-such-id/review", json={
            "approved": True,
        })
        assert r.status_code == 404

    def test_transfer_not_found(self):
        r = client.post("/api/v1/lessons/no-such-id/transfer", json={
            "target_project_id": "proj-1",
        })
        assert r.status_code == 404
