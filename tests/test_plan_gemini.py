"""Gemini plan compiler tests — mocked client, no live network."""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Plan Gemini Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "test"})
    assert resp.status_code == 201
    return resp.json(), c


def _mock_gemini_response(data: dict):
    """Build a mock response matching the google.genai response shape."""
    mock_response = MagicMock()
    mock_response.text = json.dumps(data)
    mock_usage = MagicMock()
    mock_usage.prompt_token_count = 150
    mock_usage.candidates_token_count = 300
    mock_response.usage_metadata = mock_usage
    return mock_response


_SAMPLE_PLAN = {
    "variables": [
        {"name": "camera_count", "type": "discrete", "role": "independent"},
        {"name": "placement_strategy", "type": "categorical", "role": "independent"},
        {"name": "surface_coverage", "type": "continuous", "role": "dependent"},
    ],
    "metrics": [
        {"name": "coverage_fraction", "unit": "fraction", "target": 0.85},
        {"name": "reconstruction_PSNR", "unit": "dB", "target": 25.0},
    ],
    "success_criteria": [
        "Achieve >85% surface coverage with fewer than 16 cameras",
    ],
    "constraints": [
        "Maximum 16 cameras per evaluation run",
        "Each evaluation must complete within 60 seconds",
    ],
    "hypotheses": [
        {
            "text": "Increasing camera count from 4 to 12 linearly improves surface coverage",
            "rationale": "More viewpoints reduce occlusion, and the relationship is approximately linear in the low-camera regime",
        },
        {
            "text": "Information-gain guided placement outperforms uniform placement at equal camera count",
            "rationale": "Placing cameras where geometric uncertainty is highest maximizes new information per viewpoint",
        },
        {
            "text": "Combining high camera count with guided placement yields diminishing returns over guided-only",
            "rationale": "Guided placement already targets high-information positions, so additional cameras add less",
        },
    ],
    "protocols": [
        {
            "description": "Sweep camera count (4, 8, 12, 16) with uniform spherical placement",
            "evaluator_config": json.dumps({"evaluator": "bounded_grid", "seed": 42}),
            "hypothesis_index": 0,
        },
        {
            "description": "Compare uniform vs information-gain placement at 8 cameras",
            "evaluator_config": json.dumps({"evaluator": "bounded_grid", "seed": 42}),
            "hypothesis_index": 1,
        },
        {
            "description": "Full factorial: (8, 16) cameras x (uniform, guided) placement",
            "evaluator_config": json.dumps({"evaluator": "bounded_grid", "seed": 42}),
            "hypothesis_index": 2,
        },
    ],
}


class TestGeminiPlanCompiler:
    def test_gemini_produces_multiple_hypotheses(self, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "scoring_mode", "gemini")
        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_response = _mock_gemini_response(_SAMPLE_PLAN)
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch("google.genai.Client", return_value=mock_client):
            resp = client.post(f"{base}/plans", json={
                "goal_text": "Improve 3DGS camera coverage for scene reconstruction",
            })

        assert resp.status_code == 201
        data = resp.json()
        assert len(data["hypotheses"]) == 3
        assert len(data["protocols"]) == 3
        assert data["hypotheses"][0]["text"] == _SAMPLE_PLAN["hypotheses"][0]["text"]

    def test_gemini_populates_provenance(self, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "scoring_mode", "gemini")
        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_response = _mock_gemini_response(_SAMPLE_PLAN)
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch("google.genai.Client", return_value=mock_client):
            resp = client.post(f"{base}/plans", json={
                "goal_text": "Improve coverage",
            })

        data = resp.json()
        assert data["model_provider"] == "gemini"
        assert data["model_id"] is not None

    def test_gemini_fallback_to_stub_on_error(self, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "scoring_mode", "gemini")
        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = RuntimeError("API down")

        with patch("google.genai.Client", return_value=mock_client):
            resp = client.post(f"{base}/plans", json={
                "goal_text": "Improve coverage",
            })

        assert resp.status_code == 201
        data = resp.json()
        assert data["hypotheses"]
        assert data["protocols"]
        assert data["model_provider"] is None

    def test_gemini_protocols_link_to_hypotheses(self, monkeypatch):
        from app.config import settings
        monkeypatch.setattr(settings, "scoring_mode", "gemini")
        monkeypatch.setattr(settings, "gemini_api_key", "fake-key")

        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        mock_response = _mock_gemini_response(_SAMPLE_PLAN)
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch("google.genai.Client", return_value=mock_client):
            resp = client.post(f"{base}/plans", json={
                "goal_text": "Improve coverage",
            })

        data = resp.json()
        hypothesis_ids = {h["id"] for h in data["hypotheses"]}
        for protocol in data["protocols"]:
            assert protocol["hypothesis_id"] in hypothesis_ids


class TestImprovedStub:
    def test_coverage_goal_gets_relevant_variables(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/plans", json={
            "goal_text": "Improve camera coverage for 3D reconstruction",
        })

        assert resp.status_code == 201
        data = resp.json()
        variables = json.loads(data["variables_json"])
        var_names = [v["name"] for v in variables]
        assert "camera_count" in var_names

    def test_coverage_goal_gets_multiple_hypotheses(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/plans", json={
            "goal_text": "Improve scene coverage",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert len(data["hypotheses"]) >= 2

    def test_unknown_goal_still_produces_valid_plan(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/plans", json={
            "goal_text": "Investigate novel protein folding approaches",
        })

        assert resp.status_code == 201
        data = resp.json()
        assert data["hypotheses"]
        assert data["protocols"]
        assert len(data["hypotheses"]) >= 2

    def test_stub_does_not_set_model_provider(self):
        project, client = _create_project()
        base = f"/api/v1/projects/{project['id']}"

        resp = client.post(f"{base}/plans", json={
            "goal_text": "Any goal",
        })

        data = resp.json()
        assert data["model_provider"] is None
