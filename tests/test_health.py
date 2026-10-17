from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_health_matches_schema():
    data = client.get("/api/v1/health").json()
    assert data["status"] == "ok"
    assert data["api_version"] == "1.0.0"
    assert data["providers"] == []
    assert data["database_mode"] == "sqlite"
    assert data["last_event_sequence"] is None
