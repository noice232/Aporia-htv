from __future__ import annotations

import subprocess

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.papiers import PapiersAdapter, PapiersUnavailable
from app.routers.papiers import get_adapter, router


def test_search_uses_allowlisted_argv_and_environment(monkeypatch):
    observed = {}

    def fake_run(argv, **kwargs):
        observed["argv"] = argv
        observed["kwargs"] = kwargs
        return subprocess.CompletedProcess(argv, 0, stdout='[{"id":"doc_123","title":"A real provider result"}]')

    monkeypatch.setattr(subprocess, "run", fake_run)
    adapter = PapiersAdapter(token="private-test-token", cli="papiers", timeout_seconds=3)
    result = adapter.search("3DGS view coverage", 4)

    assert result == [{"id": "doc_123", "title": "A real provider result"}]
    assert observed["argv"] == ["papiers", "search", "3DGS view coverage", "--limit", "4", "--json"]
    assert observed["kwargs"]["shell"] is False
    assert observed["kwargs"]["env"]["PAPIERS_TOKEN"] == "private-test-token"
    assert "private-test-token" not in str(observed["argv"])


def test_invalid_source_id_never_reaches_cli(monkeypatch):
    def unexpected_run(*_args, **_kwargs):
        raise AssertionError("CLI must not run")

    monkeypatch.setattr(subprocess, "run", unexpected_run)
    adapter = PapiersAdapter(token="private-test-token", cli="papiers")
    with pytest.raises(ValueError, match="Invalid Papiers source ID"):
        adapter.read("doc_123; rm -rf anything")

    with pytest.raises(ValueError, match="unsupported characters"):
        adapter.search('3DGS & echo "bad"')


def test_cli_failure_does_not_expose_private_output(monkeypatch):
    def fake_run(argv, **_kwargs):
        return subprocess.CompletedProcess(argv, 1, stdout="secret note", stderr="private-test-token")

    monkeypatch.setattr(subprocess, "run", fake_run)
    adapter = PapiersAdapter(token="private-test-token", cli="papiers")
    with pytest.raises(PapiersUnavailable) as exc:
        adapter.search("geometry")
    assert "private-test-token" not in str(exc.value)
    assert "secret note" not in str(exc.value)


def test_status_disconnected_without_token():
    result = PapiersAdapter(token=None, cli="papiers").status()
    assert result.connected is False
    assert result.mode == "disconnected"
    assert result.capabilities == []


def test_private_search_requires_research_key(monkeypatch):
    application = FastAPI()
    application.include_router(router)
    application.dependency_overrides[get_adapter] = lambda: PapiersAdapter(token=None, cli=None)
    client = TestClient(application)
    monkeypatch.setenv("APORIA_PAPIERS_ACCESS_KEY", "server-only-key")

    assert client.post("/api/v1/papiers/search", json={"query": "geometry"}).status_code == 403
    denied = client.post(
        "/api/v1/papiers/search",
        headers={"X-Aporia-Research-Key": "wrong"},
        json={"query": "geometry"},
    )
    assert denied.status_code == 403

    disconnected = client.post(
        "/api/v1/papiers/search",
        headers={"X-Aporia-Research-Key": "server-only-key"},
        json={"query": "geometry"},
    )
    assert disconnected.status_code == 503
    assert disconnected.json()["detail"] == "Papiers token is not configured"


def test_private_search_returns_provider_payload_only(monkeypatch):
    application = FastAPI()
    application.include_router(router)
    application.dependency_overrides[get_adapter] = lambda: PapiersAdapter(token="private-test-token", cli="papiers")
    client = TestClient(application)
    monkeypatch.setenv("APORIA_PAPIERS_ACCESS_KEY", "server-only-key")

    def fake_run(argv, **_kwargs):
        return subprocess.CompletedProcess(argv, 0, stdout='[{"id":"hl_456","text":"Observed note"}]')

    monkeypatch.setattr(subprocess, "run", fake_run)
    response = client.post(
        "/api/v1/papiers/search",
        headers={"X-Aporia-Research-Key": "server-only-key"},
        json={"query": "geometry"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "papiers"
    assert data["data_mode"] == "live_source"
    assert data["result"] == [{"id": "hl_456", "text": "Observed note"}]
