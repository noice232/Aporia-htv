"""Stable demo papers for projects without a persisted FRONTIER graph."""

from __future__ import annotations

import random
import uuid

from app.schemas.project_state import GraphEdge, GraphNode, GraphOut


_CLUSTERS = (
    (
        "computer_vision", (-28.0, -12.0, -5.0), (0.30, 0.68, 1.0), "CVPR",
        (
            "Hierarchical Visual Features for Open World Recognition",
            "Dense Object Detection with Adaptive Feature Pyramids",
            "Learning Robust Image Representations from Sparse Labels",
            "Multi Scale Attention for Fine Grained Image Classification",
            "Neural Radiance Fields for Sparse View 3D Reconstruction",
            "Efficient Vision Transformers for High Resolution Scenes",
            "Occlusion Aware Tracking in Crowded Environments",
            "Fast 3D Reconstruction with Gaussian Splatting",
            "Visual Grounding through Region Level Contrastive Learning",
            "Reliable Image Retrieval under Domain Shift",
        ),
    ),
    (
        "nlp", (27.0, -13.0, 3.0), (0.68, 0.48, 1.0), "ACL",
        (
            "Contextual Sentence Representations for Scientific Text",
            "Retrieval Augmented Reasoning over Long Documents",
            "Calibrating Language Models for Factual Question Answering",
            "Cross Lingual Transfer with Shared Semantic Anchors",
            "Efficient Attention for Long Form Document Understanding",
            "Grounded Summarization with Citation Aware Decoding",
            "Instruction Following from Diverse Human Feedback",
            "Detecting Unsupported Claims in Generated Text",
            "Compositional Semantic Parsing with Sparse Supervision",
            "Robust Named Entity Recognition across Research Domains",
        ),
    ),
    (
        "reinforcement_learning", (-1.0, 25.0, -6.0), (1.0, 0.66, 0.34), "NeurIPS",
        (
            "Sample Efficient Control with Learned World Models",
            "Offline Reinforcement Learning under Dataset Shift",
            "Exploration through Predictive State Uncertainty",
            "Hierarchical Policies for Long Horizon Tasks",
            "Safe Policy Improvement with Conservative Value Bounds",
            "Multi Agent Coordination from Sparse Rewards",
            "Planning with Latent Dynamics and Adaptive Horizons",
            "Generalist Agents through Task Conditioned Policies",
            "Model Based Control for Partially Observed Systems",
            "Reward Design with Human Preference Comparisons",
        ),
    ),
    (
        "generative_models", (-27.0, 25.0, 12.0), (1.0, 0.43, 0.68), "ICLR",
        (
            "Denoising Diffusion Models for Structured Images",
            "Controllable Generation with Disentangled Latent Factors",
            "Fast Sampling for Conditional Diffusion Models",
            "Text Guided Image Synthesis with Spatial Constraints",
            "Flow Matching for High Fidelity Visual Generation",
            "Latent Generative Models for Three Dimensional Scenes",
            "Evaluating Diversity in Synthetic Image Collections",
            "Consistent Video Generation from Sparse Keyframes",
            "Data Efficient Adaptation of Generative Priors",
            "Generative Editing with Localized Semantic Controls",
        ),
    ),
    (
        "graph_learning", (27.0, 25.0, 12.0), (0.34, 0.88, 0.69), "KDD",
        (
            "Scalable Message Passing for Heterogeneous Networks",
            "Graph Representation Learning with Structural Priors",
            "Predicting Scientific Links from Citation Context",
            "Temporal Graph Models for Evolving Knowledge Bases",
            "Contrastive Learning of Research Paper Networks",
            "Uncertainty Aware Link Prediction in Sparse Graphs",
            "Graph Transformers with Local and Global Attention",
            "Interpretable Node Embeddings for Citation Analysis",
            "Community Detection in Dynamic Research Networks",
            "Evidence Propagation across Scientific Claim Graphs",
        ),
    ),
)

_AUTHORS = (
    ["Maya Chen", "Elias Novak"],
    ["Priya Shah", "Daniel Kim"],
    ["Amira Hassan", "Lucas Martin"],
    ["Sofia Rivera", "Noah Patel"],
    ["Elena Rossi", "Arjun Mehta"],
)


def mock_graph(project_id: str) -> GraphOut:
    """Return the same project-scoped graph on every request or process restart."""
    rng = random.Random(f"aporia-demo-graph:{project_id}")
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    groups: list[list[GraphNode]] = []

    for cluster_index, (cluster, center, color, venue, titles) in enumerate(_CLUSTERS):
        group = []
        for index, title in enumerate(titles):
            node_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"aporia:{project_id}:{cluster}:{index}"))
            node = GraphNode(
                id=node_id,
                label=title,
                type="paper",
                cluster=cluster,
                position=tuple(round(center[axis] + rng.uniform(-8, 8), 3) for axis in range(3)),
                color=color,
                size=round(1.2 + rng.uniform(0, 1.4), 2),
                metadata={
                    "abstract": f"This mock study investigates {title.lower()} and evaluates its behavior across representative research tasks.",
                    "authors": _AUTHORS[(cluster_index + index) % len(_AUTHORS)],
                    "year": 2016 + index,
                    "venue": venue,
                    "citation_count": 15 + (9 - index) * 60 + cluster_index * 12,
                    "data_mode": "mock",
                },
            )
            nodes.append(node)
            group.append(node)
        groups.append(group)

    def cite(source: GraphNode, target: GraphNode, weight: float) -> None:
        edges.append(GraphEdge(
            id=str(uuid.uuid5(uuid.NAMESPACE_URL, f"aporia:{project_id}:citation:{source.id}:{target.id}")),
            source=source.id,
            target=target.id,
            type="citation",
            weight=weight,
        ))

    for group in groups:
        for index in range(1, len(group)):
            cite(group[index], group[index - 1], 0.8)
            if index >= 3:
                cite(group[index], group[index - 3], 0.55)
    for cluster_index in range(1, len(groups)):
        cite(groups[cluster_index][4], groups[cluster_index - 1][2], 0.35)
        cite(groups[cluster_index][8], groups[0][1], 0.3)

    return GraphOut(nodes=nodes, edges=edges)
