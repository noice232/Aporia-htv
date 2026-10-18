"""Papiers source verification — mocked adapter, no live network."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Papiers verify test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "test"})
    assert resp.status_code == 201
    return resp.json(), c


class TestJudgmentPapiersTypedId:
    def test_verified_with_typed_papiers_id(self, monkeypatch):
        monkeypatch.setenv("APORIA_PAPIERS_ACCESS_KEY", "test-key")
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_adapter = MagicMock()
        mock_adapter.read.return_value = {"title": "A paper", "content": "..."}

        with patch("app.routers.profile.PapiersAdapter.from_environment", return_value=mock_adapter):
            resp = client.post(f"{base}/judgments", json={
                "text": "Prefer geometric coverage",
                "source_id": "doc_abc123",
            })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "papiers"
        assert data["data_mode"] == "verified"
        mock_adapter.read.assert_called_once_with("doc_abc123")

    def test_unverified_without_access_key(self, monkeypatch):
        monkeypatch.delenv("APORIA_PAPIERS_ACCESS_KEY", raising=False)
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/judgments", json={
            "text": "Prefer geometric coverage",
            "source_id": "hl_note456",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "papiers"
        assert data["data_mode"] == "unverified"

    def test_verification_failure_returns_422(self, monkeypatch):
        monkeypatch.setenv("APORIA_PAPIERS_ACCESS_KEY", "test-key")
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_adapter = MagicMock()
        from app.papiers import PapiersUnavailable
        mock_adapter.read.side_effect = PapiersUnavailable("CLI not found")

        with patch("app.routers.profile.PapiersAdapter.from_environment", return_value=mock_adapter):
            resp = client.post(f"{base}/judgments", json={
                "text": "Prefer geometric coverage",
                "source_id": "doc_missing",
            })

        assert resp.status_code == 422
        assert "not verified" in resp.json()["detail"].lower()

    def test_doi_accepted_unverified(self, monkeypatch):
        monkeypatch.delenv("APORIA_PAPIERS_ACCESS_KEY", raising=False)
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/judgments", json={
            "text": "Based on prior literature",
            "source_id": "10.1234/test.paper.2024",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "papiers"
        assert data["data_mode"] == "unverified"

    def test_manual_judgment_no_source(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/judgments", json={
            "text": "Prefer visual appeal",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "manual"
        assert data["data_mode"] == "manual"

    def test_invalid_source_id_rejected(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/judgments", json={
            "text": "Some judgment",
            "source_id": "not-a-valid-id!!!",
        })

        assert resp.status_code == 422


class TestCompileRoutePapiersVerification:
    def test_compile_with_typed_papiers_id_verified(self, monkeypatch):
        monkeypatch.setenv("APORIA_PAPIERS_ACCESS_KEY", "test-key")
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_adapter = MagicMock()
        mock_adapter.read.return_value = {"title": "Note", "content": "..."}

        with patch("app.routers.judgments.PapiersAdapter.from_environment", return_value=mock_adapter):
            resp = client.post(f"{base}/judgments/compile", json={
                "context_text": "Coverage matters more than aesthetics",
                "source_context_id": "nte_research789",
            })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "papiers"
        assert data["data_mode"] == "verified"

    def test_compile_with_non_papiers_source(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/judgments/compile", json={
            "context_text": "Coverage matters",
            "source_context_id": "some-internal-ref",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "papiers"
        assert data["data_mode"] == "unverified"

    def test_compile_without_source_is_compiled(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/judgments/compile", json={
            "context_text": "My own observation about coverage",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert data["source"] == "compiled"
        assert data["data_mode"] == "manual"

    def test_compile_papiers_verification_failure(self, monkeypatch):
        monkeypatch.setenv("APORIA_PAPIERS_ACCESS_KEY", "test-key")
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_adapter = MagicMock()
        from app.papiers import PapiersUnavailable
        mock_adapter.read.side_effect = PapiersUnavailable("timeout")

        with patch("app.routers.judgments.PapiersAdapter.from_environment", return_value=mock_adapter):
            resp = client.post(f"{base}/judgments/compile", json={
                "context_text": "From my Papiers notes",
                "source_context_id": "doc_timeout_test",
            })

        assert resp.status_code == 422
