"""C5: Judgment compiler upgrade + Papiers grounding tests."""
from __future__ import annotations

import json
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Judgment Upgrade Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "judgment"})
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestJudgmentWithSourceIdSetsPapiersSource:
    """When source_id is provided, the principle source should be 'papiers'."""

    def test_source_id_doi_sets_papiers(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={
                "text": "prefer geometric coverage",
                "source_id": "10.1234/test.paper.2024",
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["source"] == "papiers"

    def test_source_id_uuid_sets_papiers(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={
                "text": "prefer visual appeal",
                "source_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["source"] == "papiers"

    def test_source_id_papiers_prefix_sets_papiers(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={
                "text": "prefer cost efficiency",
                "source_id": "papiers:arxiv.2401.12345",
            },
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["source"] == "papiers"

    def test_no_source_id_stays_manual(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={"text": "prefer geometric coverage"},
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["source"] == "manual"


class TestInvalidSourceIdRejected:
    """Invalid source_id format should return 422."""

    def test_invalid_format_rejected(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={
                "text": "prefer geometric coverage",
                "source_id": "not a valid id!!!",
            },
        )
        assert resp.status_code == 422
        assert "Invalid source_id format" in resp.json()["detail"]

    def test_empty_string_rejected(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={
                "text": "prefer geometric coverage",
                "source_id": "",
            },
        )
        assert resp.status_code == 422

    def test_whitespace_rejected(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={
                "text": "prefer geometric coverage",
                "source_id": "has space in it",
            },
        )
        assert resp.status_code == 422


class TestGeminiJudgmentExtraction:
    """Gemini extraction path should be used when scoring_mode=gemini."""

    @patch("app.policy.profile._compile_judgment_gemini")
    @patch("app.config.settings")
    def test_gemini_extraction_mocked(self, mock_settings, mock_gemini):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        mock_gemini.return_value = {
            "visual_appeal": 0.10,
            "geometric_coverage": 0.50,
            "info_gain": -0.20,
            "cost_efficiency": 0.05,
        }

        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={"text": "I want maximum surface coverage from each viewpoint"},
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()

        assert data["weight_adjustments"]["geometric_coverage"] == 0.50
        assert data["weight_adjustments"]["visual_appeal"] == 0.10
        assert data["weight_adjustments"]["info_gain"] == -0.20
        assert data["weight_adjustments"]["cost_efficiency"] == 0.05

        mock_gemini.assert_called_once()

    @patch("app.policy.profile._compile_judgment_gemini", side_effect=Exception("API down"))
    @patch("app.config.settings")
    def test_gemini_fallback_to_stub(self, mock_settings, mock_gemini):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={"text": "prefer geometric coverage"},
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        # Should fall back to stub and still return valid adjustments
        assert "geometric_coverage" in data["weight_adjustments"]
        assert data["weight_adjustments"]["geometric_coverage"] == 0.45


class TestValidAdjustmentsReturned:
    """compile_judgment always returns valid dimension adjustments."""

    def test_stub_known_keyword_returns_adjustments(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={"text": "prefer visual aesthetic quality"},
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        adj = data["weight_adjustments"]
        assert set(adj.keys()) == {"visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency"}
        assert adj["visual_appeal"] > 0

    def test_stub_unknown_text_returns_zeros(self):
        proj = _create_project()
        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/judgments",
            json={"text": "something completely unrelated to any keyword"},
        )
        assert resp.status_code == 201, resp.text
        data = resp.json()
        adj = data["weight_adjustments"]
        assert set(adj.keys()) == {"visual_appeal", "geometric_coverage", "info_gain", "cost_efficiency"}
        assert all(v == 0.0 for v in adj.values())
