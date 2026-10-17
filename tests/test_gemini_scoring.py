"""Gemini rubric evaluator tests — all mocked, no live network."""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.policy.candidates import DEFAULT_CANDIDATES, DEFAULT_HUMAN_CONTEXT
from app.policy.gemini import (
    GeminiScoringClient,
    RubricResult,
    ScoringError,
    build_conditioned_prompt,
    build_unconditioned_prompt,
)
from app.policy.scoring import (
    ScoringProvenance,
    _SCORING_DIMS,
    U_WEIGHTS,
    clear_provenance,
    get_last_provenance,
    reset_gemini_client,
    score_conditioned,
    score_unconditioned,
)


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Gemini Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "gemini"})
    assert resp.status_code == 201
    return resp.json()


_MOCK_RUBRIC_A = {"visual_appeal": 0.95, "geometric_coverage": 0.3, "info_gain": 0.85, "cost_efficiency": 0.9}
_MOCK_RUBRIC_B = {"visual_appeal": 0.2, "geometric_coverage": 0.95, "info_gain": 0.55, "cost_efficiency": 0.65}

_MOCK_RESULT_A = RubricResult(
    scores=_MOCK_RUBRIC_A,
    rationale="Front view favors aesthetics over geometry",
    confidence=0.85,
    prompt_tokens=120,
    completion_tokens=80,
    latency_ms=350.0,
)

_MOCK_RESULT_B = RubricResult(
    scores=_MOCK_RUBRIC_B,
    rationale="Corner view maximizes geometric surface coverage",
    confidence=0.90,
    prompt_tokens=120,
    completion_tokens=85,
    latency_ms=380.0,
)


def _mock_evaluate_unconditioned(candidate):
    if candidate.id == "A":
        return _MOCK_RESULT_A
    if candidate.id == "B":
        return _MOCK_RESULT_B
    return RubricResult(
        scores={dim: candidate.attributes[dim] for dim in _SCORING_DIMS},
        rationale="fallback",
        confidence=0.5,
        prompt_tokens=100,
        completion_tokens=70,
        latency_ms=300.0,
    )


def _mock_evaluate_conditioned(candidate, human_context):
    return _mock_evaluate_unconditioned(candidate)


class TestGeminiRubricProducesValidScores:
    def test_rubric_values_in_range(self):
        for dim, val in _MOCK_RUBRIC_A.items():
            assert 0.0 <= val <= 1.0

        cand_a = next(c for c in DEFAULT_CANDIDATES if c.id == "A")
        rubric = _MOCK_RUBRIC_A
        total = sum(U_WEIGHTS[dim] * rubric[dim] for dim in _SCORING_DIMS)
        assert 0.0 <= total <= 1.0


class TestUPromptHasNoHumanContext:
    def test_unconditioned_prompt_clean(self):
        cand_a = next(c for c in DEFAULT_CANDIDATES if c.id == "A")
        prompt = build_unconditioned_prompt(cand_a)
        assert "principles" not in prompt.lower() or "Principles" not in prompt
        assert "researcher" not in prompt.lower()
        assert "priorities" not in prompt.lower()
        assert "human" not in prompt.lower()


class TestCPromptIncludesPrinciples:
    def test_conditioned_prompt_has_principles(self):
        cand_a = next(c for c in DEFAULT_CANDIDATES if c.id == "A")
        ctx = {"principles": ["geometric_consistency", "thorough_coverage"], "scoring_weights": {}}
        prompt = build_conditioned_prompt(cand_a, ctx)
        assert "geometric_consistency" in prompt
        assert "thorough_coverage" in prompt
        assert "researcher" in prompt.lower()


class TestGeminiFailureFallsBackToStub:
    @patch("app.policy.scoring._get_gemini_client")
    @patch("app.config.settings")
    def test_fallback_on_error(self, mock_settings, mock_get_client):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        mock_client = MagicMock()
        mock_client.evaluate_unconditioned.side_effect = ScoringError("API down")
        mock_get_client.return_value = mock_client

        cand_a = next(c for c in DEFAULT_CANDIDATES if c.id == "A")
        total, rubric = score_unconditioned(cand_a)

        assert total == 0.80
        assert rubric["visual_appeal"] == 1.0


class TestGeminiInvalidSchemaFallsBack:
    @patch("app.policy.scoring._get_gemini_client")
    @patch("app.config.settings")
    def test_fallback_on_invalid(self, mock_settings, mock_get_client):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        mock_client = MagicMock()
        mock_client.evaluate_unconditioned.side_effect = ScoringError("Missing dimension: info_gain")
        mock_get_client.return_value = mock_client

        cand_b = next(c for c in DEFAULT_CANDIDATES if c.id == "B")
        total, rubric = score_unconditioned(cand_b)

        assert total == 0.60
        assert rubric["geometric_coverage"] == 1.0


class TestCalibrationAnchorAWinsW0:
    @patch("app.policy.scoring._get_gemini_client")
    @patch("app.config.settings")
    def test_a_selected_at_w0(self, mock_settings, mock_get_client):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        mock_client = MagicMock()
        mock_client.evaluate_unconditioned.side_effect = _mock_evaluate_unconditioned
        mock_get_client.return_value = mock_client

        clear_provenance()
        scores = {}
        for c in DEFAULT_CANDIDATES:
            if c.feasible:
                s_u, _ = score_unconditioned(c)
                scores[c.id] = s_u

        assert scores["A"] > scores["B"]


class TestCalibrationAnchorBWinsW1:
    @patch("app.policy.scoring._get_gemini_client")
    @patch("app.config.settings")
    def test_b_selected_at_w1(self, mock_settings, mock_get_client):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        mock_client = MagicMock()
        mock_client.evaluate_unconditioned.side_effect = _mock_evaluate_unconditioned
        mock_client.evaluate_conditioned.side_effect = _mock_evaluate_conditioned
        mock_get_client.return_value = mock_client

        clear_provenance()
        hc = DEFAULT_HUMAN_CONTEXT
        guided = {}
        for c in DEFAULT_CANDIDATES:
            if c.feasible:
                s_u, _ = score_unconditioned(c)
                s_c, _ = score_conditioned(c, hc)
                s_g = s_u + 1.0 * (s_c - s_u)
                guided[c.id] = s_g

        assert guided["B"] > guided["A"]


class TestHealthReportsStubMode:
    def test_stub_provider(self):
        c = _client()
        resp = c.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        providers = data["providers"]
        assert len(providers) == 1
        assert providers[0]["provider"] == "scoring"
        assert providers[0]["mode"] == "stub"
        assert providers[0]["connected"] is True


class TestHealthReportsGeminiConnected:
    @patch("app.routers.health.settings")
    def test_gemini_provider_shown(self, mock_settings):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"
        mock_settings.api_version = "1.0.0"

        with patch("app.policy.scoring._get_gemini_client") as mock_get:
            mock_client = MagicMock()
            mock_client.check_health.return_value = {
                "provider": "gemini",
                "connected": True,
                "mode": "live",
                "model_id": "gemini-2.0-flash",
                "checked_at": "2026-01-01T00:00:00+00:00",
                "last_error": None,
            }
            mock_get.return_value = mock_client

            c = _client()
            resp = c.get("/api/v1/health")
            assert resp.status_code == 200
            data = resp.json()
            providers = data["providers"]
            assert len(providers) == 1
            assert providers[0]["provider"] == "gemini"
            assert providers[0]["connected"] is True
            assert providers[0]["mode"] == "live"


class TestProvenancePersisted:
    @patch("app.policy.scoring._get_gemini_client")
    @patch("app.config.settings")
    def test_provenance_on_scores(self, mock_settings, mock_get_client):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"
        mock_settings.database_url = "sqlite:///./aporia.db"

        mock_client = MagicMock()
        mock_client.model_id = "gemini-2.0-flash"
        mock_client.evaluate_unconditioned.side_effect = _mock_evaluate_unconditioned
        mock_client.evaluate_conditioned.side_effect = _mock_evaluate_conditioned
        mock_get_client.return_value = mock_client

        clear_provenance()
        cand_a = next(c for c in DEFAULT_CANDIDATES if c.id == "A")
        score_unconditioned(cand_a)

        prov_u, _ = get_last_provenance()
        assert "A" in prov_u
        assert prov_u["A"].provider == "gemini"
        assert prov_u["A"].model_id == "gemini-2.0-flash"
        assert prov_u["A"].prompt_tokens == 120
        assert prov_u["A"].completion_tokens == 80
        assert prov_u["A"].latency_ms > 0
