"""Gemini subproblem generation tests — mocked, no live network."""
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models.project import AgendaItem
from app.policy.gemini import SubproblemResult


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Subproblem Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "subproblem"})
    assert resp.status_code == 201
    return resp.json()


def _get_db_session():
    gen = app.dependency_overrides[get_db]()
    return next(gen)


_MOCK_SUBPROBLEM = SubproblemResult(
    question="Why does the unit cube have low coverage from axis-aligned views?",
    hypothesis="Axis-aligned cameras each see only one face of the cube, leaving 5/6 of the surface unobserved.",
    proposed_action="Add a camera at position (1.7, 1.7, 1.7) to observe three faces at once.",
    rationale="Each axis-aligned camera covers exactly 25/150 points (16.67%), corresponding to one face.",
    prompt_tokens=250,
    completion_tokens=180,
    latency_ms=420.0,
)


class TestSubproblemGeminiGeneratesHypothesis:
    @patch("app.policy.gemini.generate_subproblem", return_value=_MOCK_SUBPROBLEM)
    @patch("app.config.settings")
    def test_gemini_question_used(self, mock_settings, mock_gen):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        proj = _create_project()
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 1.0})
        assert resp.status_code == 200
        data = resp.json()

        assert data["threshold_met"] is False
        assert data["agenda_item_id"] is not None

        agenda = c.get(f"/api/v1/projects/{proj['id']}/agenda").json()
        assert len(agenda) >= 1
        assert agenda[0]["question"] == _MOCK_SUBPROBLEM.question

        events = c.get(f"/api/v1/projects/{proj['id']}/events?limit=200").json()
        agenda_events = [e for e in events["events"] if e["type"] == "agenda.queued"]
        assert len(agenda_events) >= 1
        payload = agenda_events[0]["payload"]
        assert payload.get("data_mode") == "ai_generated"
        assert payload["hypothesis"] == _MOCK_SUBPROBLEM.hypothesis


class TestSubproblemFallbackToTemplate:
    @patch("app.policy.gemini.generate_subproblem", side_effect=Exception("Gemini down"))
    @patch("app.config.settings")
    def test_fallback_uses_template(self, mock_settings, mock_gen):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        proj = _create_project("Fallback Test")
        c = _client()
        resp = c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 1.0})
        assert resp.status_code == 200

        agenda = c.get(f"/api/v1/projects/{proj['id']}/agenda").json()
        assert len(agenda) >= 1
        assert "investigate missing geometry" in agenda[0]["question"]


class TestSubproblemProvenance:
    @patch("app.policy.gemini.generate_subproblem", return_value=_MOCK_SUBPROBLEM)
    @patch("app.config.settings")
    def test_provenance_stored(self, mock_settings, mock_gen):
        mock_settings.scoring_mode = "gemini"
        mock_settings.gemini_api_key = "fake-key"
        mock_settings.gemini_model_id = "gemini-2.0-flash"

        proj = _create_project("Provenance Test")
        c = _client()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 1.0})

        db = _get_db_session()
        items = db.query(AgendaItem).filter(AgendaItem.project_id == proj["id"]).all()
        assert len(items) >= 1
        item = items[0]
        assert item.model_provider == "gemini"
        assert item.model_id == "gemini-2.0-flash"
        assert item.generation_prompt_tokens == 250
        assert item.generation_completion_tokens == 180
        assert item.generation_latency_ms > 0
        db.close()
