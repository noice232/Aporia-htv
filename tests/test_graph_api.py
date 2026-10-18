"""FRONTIER visualization graph and demo stream contract."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from app.main import app


def _project(client: TestClient) -> str:
    response = client.post("/api/v1/projects", json={"title": "Graph API"})
    assert response.status_code == 201
    return response.json()["id"]


def test_mock_graph_is_stable_and_filterable():
    client = TestClient(app)
    project_id = _project(client)
    url = f"/api/v1/projects/{project_id}/graph"

    first = client.get(url)
    assert first.status_code == 200
    graph = first.json()
    assert len(graph["nodes"]) == 50
    assert len({node["cluster"] for node in graph["nodes"]}) == 5
    assert len(graph["edges"]) >= 50
    assert client.get(url).json() == graph

    node_ids = {node["id"] for node in graph["nodes"]}
    for node in graph["nodes"]:
        assert node["type"] == "paper"
        assert len(node["position"]) == len(node["color"]) == 3
        assert node["size"] > 0
    for edge in graph["edges"]:
        assert edge["type"] == "citation"
        assert edge["source"] in node_ids and edge["target"] in node_ids
        assert edge["weight"] > 0

    cluster = client.get(url, params={"cluster": "nlp"}).json()
    assert len(cluster["nodes"]) == 10
    assert all(node["cluster"] == "nlp" for node in cluster["nodes"])
    cluster_ids = {node["id"] for node in cluster["nodes"]}
    assert all(edge["source"] in cluster_ids and edge["target"] in cluster_ids
               for edge in cluster["edges"])

    search = client.get(url, params={"q": "DIFFUSION"}).json()
    assert search["nodes"]
    assert all("diffusion" in node["label"].lower() for node in search["nodes"])
    assert not search["edges"]


def test_node_detail_and_project_scope():
    client = TestClient(app)
    project_id = _project(client)
    other_id = _project(client)
    node = client.get(f"/api/v1/projects/{project_id}/graph").json()["nodes"][0]
    url = f"/api/v1/projects/{project_id}/graph/node/{node['id']}"

    detail = client.get(url)
    assert detail.status_code == 200
    assert detail.json() == node
    metadata = detail.json()["metadata"]
    assert metadata["abstract"]
    assert metadata["authors"]
    assert isinstance(metadata["year"], int)
    assert metadata["venue"]
    assert isinstance(metadata["citation_count"], int)
    assert metadata["data_mode"] == "mock"
    assert client.get(f"/api/v1/projects/{other_id}/graph/node/{node['id']}").status_code == 404
    assert client.get(f"/api/v1/projects/{project_id}/graph/node/unknown").status_code == 404
    assert client.get("/api/v1/projects/unknown/graph").status_code == 404


def test_mock_sse_graph_events_reference_snapshot():
    client = TestClient(app)
    project_id = _project(client)
    graph = client.get(f"/api/v1/projects/{project_id}/graph").json()
    response = client.get(f"/api/v1/projects/{project_id}/stream")

    assert response.status_code == 200
    events = [json.loads(line.removeprefix("data: "))
              for line in response.text.splitlines() if line.startswith("data: ")]
    assert [event["type"] for event in events] == [
        "node_added", "edge_added", "cluster_updated",
    ]
    assert [event["sequence"] for event in events] == [1, 2, 3]
    assert all(event["data_mode"] == "mock" for event in events)
    assert events[0]["payload"]["node"] in graph["nodes"]
    assert events[1]["payload"]["edge"] in graph["edges"]
    assert events[2]["payload"]["node_id"] == events[0]["payload"]["node"]["id"]
    assert events[2]["payload"]["cluster"] == events[0]["payload"]["node"]["cluster"]
    assert client.get(f"/api/v1/projects/{project_id}/events").json()["events"] == events
    assert client.get(f"/api/v1/projects/{project_id}/stream").text == response.text
    resumed = client.get(f"/api/v1/projects/{project_id}/stream", params={"after": 1})
    assert [json.loads(line.removeprefix("data: "))["type"]
            for line in resumed.text.splitlines() if line.startswith("data: ")] == [
                "edge_added", "cluster_updated",
            ]
    assert client.get(f"/api/v1/projects/{project_id}/stream", params={"after": 3}).text == ""
