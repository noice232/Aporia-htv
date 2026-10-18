from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def _make_user(email: str = "alice@example.com", display_name: str = "Alice") -> dict:
    r = client.post("/api/v1/users", json={"email": email, "display_name": display_name})
    assert r.status_code == 201
    return r.json()


def _make_workspace(owner_id: str, name: str = "My Lab", visibility: str = "private") -> dict:
    r = client.post("/api/v1/workspaces", json={
        "name": name,
        "visibility": visibility,
        "owner_id": owner_id,
    })
    assert r.status_code == 201
    return r.json()


class TestUserCreation:
    def test_create_user(self):
        data = _make_user()
        assert data["email"] == "alice@example.com"
        assert data["display_name"] == "Alice"
        assert "id" in data
        assert "created_at" in data


class TestWorkspaceCRUD:
    def test_create_workspace(self):
        user = _make_user()
        ws = _make_workspace(user["id"])
        assert ws["name"] == "My Lab"
        assert ws["visibility"] == "private"
        assert ws["owner_id"] == user["id"]

    def test_list_workspaces(self):
        user = _make_user()
        _make_workspace(user["id"], name="WS-1")
        _make_workspace(user["id"], name="WS-2")
        r = client.get("/api/v1/workspaces")
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_list_workspaces_filter_by_owner(self):
        u1 = _make_user(email="owner1@example.com")
        u2 = _make_user(email="owner2@example.com")
        _make_workspace(u1["id"], name="U1-WS")
        _make_workspace(u2["id"], name="U2-WS")
        r = client.get("/api/v1/workspaces", params={"owner_id": u1["id"]})
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 1
        assert items[0]["name"] == "U1-WS"

    def test_workspace_not_found_members(self):
        r = client.get("/api/v1/workspaces/nonexistent-id/members")
        assert r.status_code == 404


class TestWorkspaceMembers:
    def test_add_member(self):
        owner = _make_user(email="owner@example.com")
        member = _make_user(email="member@example.com", display_name="Bob")
        ws = _make_workspace(owner["id"])
        r = client.post(f"/api/v1/workspaces/{ws['id']}/members", json={
            "user_id": member["id"],
            "role": "contributor",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["user_id"] == member["id"]
        assert data["role"] == "contributor"
        assert data["workspace_id"] == ws["id"]

    def test_list_members(self):
        owner = _make_user(email="owner@example.com")
        m1 = _make_user(email="m1@example.com", display_name="M1")
        m2 = _make_user(email="m2@example.com", display_name="M2")
        ws = _make_workspace(owner["id"])
        client.post(f"/api/v1/workspaces/{ws['id']}/members", json={"user_id": m1["id"]})
        client.post(f"/api/v1/workspaces/{ws['id']}/members", json={"user_id": m2["id"]})
        r = client.get(f"/api/v1/workspaces/{ws['id']}/members")
        assert r.status_code == 200
        assert len(r.json()) == 2


class TestGetMe:
    def test_me_with_bearer_token(self):
        user = _make_user()
        r = client.get("/api/v1/me", headers={"Authorization": f"Bearer {user['id']}"})
        assert r.status_code == 200
        assert r.json()["id"] == user["id"]

    def test_me_with_query_param(self):
        user = _make_user()
        r = client.get("/api/v1/me", params={"user_id": user["id"]})
        assert r.status_code == 200
        assert r.json()["id"] == user["id"]

    def test_me_no_auth_returns_401(self):
        r = client.get("/api/v1/me")
        assert r.status_code == 401


class TestResearcherProfile:
    def test_get_researcher(self):
        user = _make_user(email="researcher@example.com", display_name="Dr. Res")
        r = client.get(f"/api/v1/researchers/{user['id']}")
        assert r.status_code == 200
        assert r.json()["display_name"] == "Dr. Res"

    def test_patch_researcher(self):
        user = _make_user(email="patcher@example.com", display_name="Old Name")
        r = client.patch(f"/api/v1/researchers/{user['id']}", json={
            "display_name": "New Name",
            "bio": "Expert in ML",
            "expertise_json": '["machine learning", "NLP"]',
        })
        assert r.status_code == 200
        data = r.json()
        assert data["display_name"] == "New Name"
        assert data["bio"] == "Expert in ML"
        assert data["expertise_json"] == '["machine learning", "NLP"]'

    def test_get_researcher_not_found(self):
        r = client.get("/api/v1/researchers/nonexistent-id")
        assert r.status_code == 404
