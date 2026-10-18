"""Tests for source contexts: create, list, search, get by id."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


def _create_project(title="Source Test"):
    c = _client()
    resp = c.post("/api/v1/projects", json={"title": title, "objective": "test"})
    assert resp.status_code == 201, resp.text
    return resp.json()


def _create_source(project_id: str, **overrides):
    defaults = {
        "provider": "arxiv",
        "source_locator": "2401.00001",
        "kind": "paper",
        "title": "Test Paper Title",
        "excerpt": "An excerpt from the paper abstract.",
    }
    defaults.update(overrides)
    c = _client()
    resp = c.post(f"/api/v1/projects/{project_id}/sources", json=defaults)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestCreateSource:
    def test_create_source_for_project(self):
        proj = _create_project()
        source = _create_source(proj["id"])
        assert source["provider"] == "arxiv"
        assert source["source_locator"] == "2401.00001"
        assert source["kind"] == "paper"
        assert source["title"] == "Test Paper Title"
        assert source["project_id"] == proj["id"]
        assert source["data_mode"] == "retrieved"


class TestListSources:
    def test_list_sources(self):
        proj = _create_project()
        _create_source(proj["id"], title="Source A", source_locator="loc-a")
        _create_source(proj["id"], title="Source B", source_locator="loc-b")

        c = _client()
        resp = c.get(f"/api/v1/projects/{proj['id']}/sources")
        assert resp.status_code == 200
        sources = resp.json()
        assert len(sources) == 2


class TestSearchSources:
    def test_search_sources_by_text(self):
        proj = _create_project()
        _create_source(proj["id"], title="Gaussian Splatting Overview", excerpt="3DGS technique")
        _create_source(proj["id"], title="Transformer Architecture", excerpt="Attention mechanism")

        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/sources/search",
            json={"query": "Gaussian"},
        )
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert "Gaussian" in results[0]["title"]

    def test_search_with_filters(self):
        proj = _create_project()
        _create_source(proj["id"], provider="arxiv", kind="paper", title="ArXiv Paper")
        _create_source(proj["id"], provider="openalex", kind="dataset", title="OpenAlex Dataset")

        c = _client()
        resp = c.post(
            f"/api/v1/projects/{proj['id']}/sources/search",
            json={"provider": "arxiv", "kind": "paper"},
        )
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) == 1
        assert results[0]["provider"] == "arxiv"
        assert results[0]["kind"] == "paper"


class TestGetSource:
    def test_get_source_by_id(self):
        proj = _create_project()
        source = _create_source(proj["id"])

        c = _client()
        resp = c.get(f"/api/v1/sources/{source['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == source["id"]

    def test_source_not_found_404(self):
        c = _client()
        resp = c.get("/api/v1/sources/nonexistent-id")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Source not found"
