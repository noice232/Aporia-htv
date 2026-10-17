from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Test Project"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "test"})
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestCreateProject:
    def test_returns_201(self):
        data = _create_project()
        assert data["title"] == "Test Project"
        assert data["status"] == "created"
        assert "id" in data

    def test_fields_present(self):
        data = _create_project("Another")
        for field in ("id", "title", "objective", "status", "created_at"):
            assert field in data


class TestSubmitGoal:
    def test_above_threshold(self):
        c = _client()
        proj = _create_project()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/goals",
            json={"threshold": 0.01, "seed": 42},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["threshold_met"] is True
        assert data["agenda_item_id"] is None
        assert len(data["runs"]) == 6
        assert data["best_coverage"] > 0.01

    def test_below_threshold_creates_subproblem(self):
        c = _client()
        proj = _create_project()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/goals",
            json={"threshold": 0.99, "seed": 42},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["threshold_met"] is False
        assert data["agenda_item_id"] is not None
        assert data["best_coverage"] < 0.99

    def test_runs_have_real_coverage(self):
        c = _client()
        proj = _create_project()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/goals",
            json={"threshold": 0.5, "seed": 42},
        )
        data = resp.json()
        for run in data["runs"]:
            assert run["status"] == "completed"
            assert isinstance(run["coverage_fraction"], float)
            assert 0.0 <= run["coverage_fraction"] <= 1.0


class TestListRuns:
    def test_lists_all_runs(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.5})
        resp = c.get(f"/api/v1/projects/{proj['id']}/runs")
        assert resp.status_code == 200
        runs = resp.json()
        assert len(runs) == 6

    def test_404_for_missing_project(self):
        c = _client()
        resp = c.get("/api/v1/projects/nonexistent/runs")
        assert resp.status_code == 404


class TestListEvents:
    def test_events_exist_after_goal(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.5})
        resp = c.get(f"/api/v1/projects/{proj['id']}/events")
        assert resp.status_code == 200
        page = resp.json()
        assert len(page["events"]) > 0

    def test_event_sequences_monotonic(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.5})
        page = c.get(f"/api/v1/projects/{proj['id']}/events?limit=200").json()
        seqs = [e["sequence"] for e in page["events"]]
        assert seqs == sorted(seqs)
        assert len(seqs) == len(set(seqs))

    def test_event_types_present(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.99})
        page = c.get(f"/api/v1/projects/{proj['id']}/events?limit=200").json()
        types = {e["type"] for e in page["events"]}
        assert "experiment.started" in types
        assert "metric.recorded" in types
        assert "experiment.completed" in types
        assert "problem.discovered" in types
        assert "agenda.queued" in types

    def test_cursor_pagination(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.5})
        page1 = c.get(f"/api/v1/projects/{proj['id']}/events?limit=3").json()
        assert len(page1["events"]) == 3
        assert page1["next_sequence"] is not None

        page2 = c.get(
            f"/api/v1/projects/{proj['id']}/events?after={page1['next_sequence']}&limit=3"
        ).json()
        assert len(page2["events"]) > 0
        assert page2["events"][0]["sequence"] > page1["next_sequence"]


class TestAgenda:
    def test_agenda_empty_when_threshold_met(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.01})
        resp = c.get(f"/api/v1/projects/{proj['id']}/agenda")
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_agenda_created_when_below_threshold(self):
        c = _client()
        proj = _create_project()
        c.post(f"/api/v1/projects/{proj['id']}/goals", json={"threshold": 0.99})
        resp = c.get(f"/api/v1/projects/{proj['id']}/agenda")
        items = resp.json()
        assert len(items) == 1
        item = items[0]
        assert item["status"] == "queued"
        assert "coverage" in item["question"].lower()
        assert item["originating_run_id"] is not None
        assert item["originating_event_id"] is not None
        assert item["dedup_key"] is not None
