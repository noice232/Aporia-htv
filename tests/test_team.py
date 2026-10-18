from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def _make_project() -> str:
    r = client.post("/api/v1/projects", json={"title": "team-test", "goal": "test teams"})
    assert r.status_code == 201
    return r.json()["id"]


class TestCreateSession:
    def test_create_team_session(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/sessions", json={
            "workspace_id": "ws-1",
            "visibility": "team",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["project_id"] == pid
        assert data["workspace_id"] == "ws-1"
        assert data["visibility"] == "team"
        assert data["state"] == "active"
        assert data["last_sequence"] == 0
        assert data["participants"] == []
        assert data["comment_count"] == 0

    def test_create_session_default_visibility(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/sessions", json={})
        assert r.status_code == 201
        assert r.json()["visibility"] == "team"


class TestGetSession:
    def test_get_session_with_participants(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-2"})
        session_id = r.json()["id"]
        client.post(f"/api/v1/sessions/{session_id}/join", json={
            "user_id": "user-1",
            "display_name": "Alice",
            "role": "contributor",
        })
        r = client.get(f"/api/v1/sessions/{session_id}")
        assert r.status_code == 200
        data = r.json()
        assert len(data["participants"]) == 1
        assert data["participants"][0]["user_id"] == "user-1"
        assert data["participants"][0]["display_name"] == "Alice"

    def test_session_not_found(self):
        r = client.get("/api/v1/sessions/nonexistent-id")
        assert r.status_code == 404


class TestListSessions:
    def test_list_sessions_by_workspace(self):
        pid = _make_project()
        client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-a"})
        client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-a"})
        client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-b"})
        r = client.get("/api/v1/workspaces/ws-a/sessions")
        assert r.status_code == 200
        assert len(r.json()) == 2


class TestJoinSession:
    def test_join_creates_participant(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-j"})
        session_id = r.json()["id"]
        r = client.post(f"/api/v1/sessions/{session_id}/join", json={
            "user_id": "user-42",
            "display_name": "Bob",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["user_id"] == "user-42"
        assert data["display_name"] == "Bob"
        assert data["role"] == "observer"

    def test_join_nonexistent_session(self):
        r = client.post("/api/v1/sessions/no-such-session/join", json={
            "user_id": "user-1",
        })
        assert r.status_code == 404


class TestComments:
    def test_add_comment_increments_sequence(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-c"})
        session_id = r.json()["id"]
        r1 = client.post(f"/api/v1/sessions/{session_id}/comments", json={
            "body": "First comment",
            "author_id": "user-1",
        })
        assert r1.status_code == 201
        assert r1.json()["sequence"] == 1

        r2 = client.post(f"/api/v1/sessions/{session_id}/comments", json={
            "body": "Second comment",
        })
        assert r2.status_code == 201
        assert r2.json()["sequence"] == 2

        # session's last_sequence should be updated
        session = client.get(f"/api/v1/sessions/{session_id}").json()
        assert session["last_sequence"] == 2

    def test_list_comments_ordered(self):
        pid = _make_project()
        r = client.post(f"/api/v1/projects/{pid}/sessions", json={"workspace_id": "ws-d"})
        session_id = r.json()["id"]
        client.post(f"/api/v1/sessions/{session_id}/comments", json={"body": "A"})
        client.post(f"/api/v1/sessions/{session_id}/comments", json={"body": "B"})
        client.post(f"/api/v1/sessions/{session_id}/comments", json={"body": "C"})
        r = client.get(f"/api/v1/sessions/{session_id}/comments")
        assert r.status_code == 200
        bodies = [c["body"] for c in r.json()]
        assert bodies == ["A", "B", "C"]
        seqs = [c["sequence"] for c in r.json()]
        assert seqs == [1, 2, 3]
