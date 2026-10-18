"""Tests for papers search, corpus sync, and paper retrieval."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def _client():
    return TestClient(app, raise_server_exceptions=False)


class TestSearchPapers:
    def test_search_returns_empty_initially(self):
        c = _client()
        resp = c.get("/api/v1/papers")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_search_by_title(self):
        c = _client()
        # Create papers via corpus sync
        c.post("/api/v1/corpus/sync", json={"query": "neural rendering", "max_works": 3})

        resp = c.get("/api/v1/papers", params={"q": "neural rendering"})
        assert resp.status_code == 200
        papers = resp.json()
        assert len(papers) == 3
        for p in papers:
            assert "neural rendering" in p["title"].lower()
            assert p["data_mode"] == "demo_sync"


class TestGetPaper:
    def test_get_existing_paper(self):
        c = _client()
        sync = c.post("/api/v1/corpus/sync", json={"query": "transformers", "max_works": 1})
        paper_id = sync.json()["papers"][0]["id"]

        resp = c.get(f"/api/v1/papers/{paper_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == paper_id
        assert "transformers" in resp.json()["title"].lower()

    def test_get_missing_paper_404(self):
        c = _client()
        resp = c.get("/api/v1/papers/nonexistent-id")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Paper not found"


class TestCorpusSync:
    def test_sync_creates_papers(self):
        c = _client()
        resp = c.post("/api/v1/corpus/sync", json={"query": "3D Gaussian splatting", "max_works": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["synced_count"] == 5
        assert len(data["papers"]) == 5
        for p in data["papers"]:
            assert p["data_mode"] == "demo_sync"
            assert "3D Gaussian splatting" in p["title"]

    def test_sync_with_query_populates_topics(self):
        c = _client()
        resp = c.post("/api/v1/corpus/sync", json={"query": "diffusion models", "max_works": 2})
        assert resp.status_code == 200
        papers = resp.json()["papers"]
        for p in papers:
            assert p["topics_json"] is not None
            assert "diffusion models" in p["topics_json"]
