from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestIntegrations:
    def test_integration_status_returns_providers(self):
        r = client.get("/api/v1/integrations/status")
        assert r.status_code == 200
        data = r.json()
        assert "providers" in data
        names = [p["name"] for p in data["providers"]]
        assert "gemini" in names
        assert "papiers" in names
        assert "tiger" in names

    def test_unconfigured_providers_shown(self):
        r = client.get("/api/v1/integrations/status")
        assert r.status_code == 200
        data = r.json()
        tiger = next(p for p in data["providers"] if p["name"] == "tiger")
        assert tiger["status"] == "unconfigured"
        assert tiger["detail"] == "Not yet integrated"
