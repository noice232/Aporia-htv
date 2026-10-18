"""Deterministic, explicitly mock research workflow for the hackathon demo."""

from __future__ import annotations

import json
import math
import re
from datetime import timedelta, timezone
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.mock_graph import mock_graph
from app.models.demo_research import DemoExperiment, ResearchFeedback, ResearchStep
from app.models.frontier import FrontierEdge, FrontierNode
from app.models.meta import MetaTrial
from app.models.paper import Paper
from app.models.portfolio import PortfolioStrategy
from app.models.profile import ResearcherPrinciple, ResearcherProfile
from app.models.project import Project, ResearchEvent, _utcnow
from app.models.skill import CandidateSkill
from app.models.workspace import User, Workspace, WorkspaceMember
from app.schemas.demo_research import (
    ComparisonBranch, ComparisonCandidate, ComparisonDiff, DemoSeedOut,
    ExperimentIn, ExperimentOut, FeedbackIn, FeedbackOut, FeedbackResult,
    PaperDetail, PaperResult, PolicyComparisonOut, ResearchStartOut,
    ResearchStepOut, TimelineEntry,
)


def require_project(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _next_demo_time(db: Session, project_id: str):
    """Keep the scripted timeline ordered on clocks with millisecond precision."""
    latest_values = (
        db.query(func.max(ResearchStep.created_at)).filter(ResearchStep.project_id == project_id).scalar(),
        db.query(func.max(ResearchFeedback.created_at)).filter(ResearchFeedback.project_id == project_id).scalar(),
        db.query(func.max(DemoExperiment.updated_at)).filter(DemoExperiment.project_id == project_id).scalar(),
        db.query(func.max(ResearchEvent.occurred_at)).filter(ResearchEvent.project_id == project_id).scalar(),
    )
    latest = [value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
              for value in latest_values if value is not None]
    now = _utcnow()
    return max(now, max(latest) + timedelta(milliseconds=1)) if latest else now


def emit(db: Session, project_id: str, event_type: str, entity_id: str | None,
         payload: dict[str, Any], human: bool = False) -> ResearchEvent:
    db.flush()
    sequence = (db.query(func.max(ResearchEvent.sequence)).filter(
        ResearchEvent.project_id == project_id
    ).scalar() or 0) + 1
    event = ResearchEvent(
        project_id=project_id, sequence=sequence, type=event_type,
        entity_id=entity_id, payload_json=json.dumps(payload),
        data_mode="mock" if not human else "manual",
        occurred_at=_next_demo_time(db, project_id),
    )
    db.add(event)
    db.flush()
    return event


def step_out(row: ResearchStep) -> ResearchStepOut:
    return ResearchStepOut(
        id=row.id, project_id=row.project_id, phase=row.phase, content=row.content,
        evidence=json.loads(row.evidence_json), confidence=row.confidence,
        created_at=row.created_at, parent_step_id=row.parent_step_id,
        human_influenced=row.human_influenced,
    )


def append_step(db: Session, project_id: str, phase: str, content: str,
                evidence: list[str], confidence: float,
                parent: ResearchStep | None = None,
                human_influenced: bool = False) -> ResearchStep:
    row = ResearchStep(
        project_id=project_id, phase=phase, content=content,
        evidence_json=json.dumps(evidence), confidence=confidence,
        parent_step_id=parent.id if parent else None,
        human_influenced=human_influenced,
        created_at=_next_demo_time(db, project_id),
    )
    db.add(row)
    db.flush()
    emit(db, project_id, "agent_step", row.id, {
        "phase": phase, "description": content, "evidence": evidence,
        "confidence": confidence, "step_id": row.id,
        "human_influenced": human_influenced,
    })
    return row


def experiment_out(row: DemoExperiment) -> ExperimentOut:
    return ExperimentOut(
        id=row.id, project_id=row.project_id, hypothesis=row.hypothesis,
        method=row.method, config=json.loads(row.config_json), status=row.status,
        results=json.loads(row.results_json) if row.results_json else None,
        evaluation=json.loads(row.evaluation_json) if row.evaluation_json else None,
        human_evaluation=json.loads(row.human_evaluation_json) if row.human_evaluation_json else None,
        created_at=row.created_at, updated_at=row.updated_at,
    )


def create_experiment(db: Session, project_id: str, body: ExperimentIn) -> DemoExperiment:
    row = DemoExperiment(
        project_id=project_id, hypothesis=body.hypothesis, method=body.method,
        config_json=json.dumps(body.config), status="queued",
        created_at=_next_demo_time(db, project_id),
        updated_at=_next_demo_time(db, project_id),
    )
    db.add(row)
    db.flush()
    emit(db, project_id, "experiment.queued", row.id, {
        "description": f"Queued mock experiment: {body.method}",
        "hypothesis": body.hypothesis,
    })
    return row


def complete_experiment(db: Session, row: DemoExperiment, guided: bool) -> None:
    if guided:
        results = {
            "metrics": {
                "nerf_psnr_db": 28.2, "gaussian_psnr_db": 29.4,
                "nerf_training_minutes": 74, "gaussian_training_minutes": 18,
                "nerf_render_fps": 0.4, "gaussian_render_fps": 42.0,
            },
            "findings": [
                "Mock comparison: Gaussian splatting retains comparable novel-view quality while rendering much faster than the NeRF baseline.",
                "The synthetic benchmark is illustrative and is not a measured scientific result.",
            ],
            "artifacts": [{"type": "report", "name": "mock_3d_comparison.json", "data_mode": "mock"}],
        }
        evaluation = {
            "score": 0.87,
            "explanation": "Mock score favors Gaussian splatting for the human-specified speed and quality tradeoff.",
            "next_steps": ["Validate on a real multi-view scene with held-out camera poses."],
        }
    else:
        results = {
            "metrics": {
                "nerf_psnr_db": 28.2, "stereo_psnr_db": 25.8,
                "nerf_training_minutes": 74, "stereo_processing_minutes": 31,
            },
            "findings": [
                "Mock baseline: NeRF improves novel-view quality over classical multi-view stereo, but training is slow.",
                "The synthetic benchmark is illustrative and is not a measured scientific result.",
            ],
            "artifacts": [{"type": "report", "name": "mock_nerf_baseline.json", "data_mode": "mock"}],
        }
        evaluation = {
            "score": 0.69,
            "explanation": "Mock score recognizes image quality but penalizes NeRF training and rendering cost.",
            "next_steps": ["Investigate faster scene representations before a real benchmark."],
        }
    row.status = "completed"
    row.results_json = json.dumps(results)
    row.evaluation_json = json.dumps(evaluation)
    row.updated_at = _next_demo_time(db, row.project_id)
    db.flush()
    emit(db, row.project_id, "experiment.completed", row.id, {
        "description": evaluation["explanation"], "score": evaluation["score"],
        "metrics": results["metrics"],
    })


def run_research_loop(db: Session, project: Project, commit: bool = True) -> ResearchStartOut:
    existing = db.query(ResearchStep).filter(
        ResearchStep.project_id == project.id
    ).order_by(ResearchStep.created_at, ResearchStep.id).all()
    if existing:
        experiment = db.query(DemoExperiment).filter(
            DemoExperiment.project_id == project.id
        ).order_by(DemoExperiment.created_at.desc()).first()
        return ResearchStartOut(
            project_id=project.id, state=project.research_state,
            steps=[step_out(row) for row in existing],
            experiment_id=experiment.id if experiment else None,
        )

    from app.routers.sse import _ensure_demo_graph_events
    _ensure_demo_graph_events(db, project.id, commit=False)

    topic = project.objective or project.title or "the research question"

    project.research_state = "running"
    scan = append_step(db, project.id, "scan",
        f"Surveyed recent literature on {topic}. Identified two competing approaches with distinct tradeoffs in quality and efficiency.",
        [], 0.84)
    hypothesis = append_step(db, project.id, "hypothesize",
        f"Initial hypothesis: the established baseline approach can be outperformed by a newer method on key evaluation metrics for {topic}.",
        [], 0.76, scan)
    experiment = create_experiment(db, project.id, ExperimentIn(
        hypothesis=hypothesis.content, method=f"Baseline versus proposed method",
        config={"topic": topic, "data_mode": "mock"},
    ))
    experiment_step = append_step(db, project.id, "experiment",
        f"Ran comparative evaluation: baseline method versus proposed approach on {topic}.",
        [experiment.id], 0.71, hypothesis)
    complete_experiment(db, experiment, guided=False)
    evaluation = append_step(db, project.id, "evaluate",
        f"Evaluation complete: baseline shows strong results but higher cost; proposed approach trades slight quality for significant efficiency gains.",
        [experiment.id], 0.69, experiment_step)
    append_step(db, project.id, "plan",
        f"Next step: validate the proposed method on real-world data before committing to a full benchmark on {topic}.",
        [experiment.id], 0.73, evaluation)
    project.research_state = "completed"
    if commit:
        db.commit()
    else:
        db.flush()
    steps = db.query(ResearchStep).filter(ResearchStep.project_id == project.id).order_by(
        ResearchStep.created_at, ResearchStep.id
    ).all()
    return ResearchStartOut(
        project_id=project.id, state=project.research_state,
        steps=[step_out(row) for row in steps], experiment_id=experiment.id,
    )


def candidate_from_text(text: str) -> str | None:
    text = text.casefold()
    if "gaussian" in text or "splat" in text or "real-time" in text or "realtime" in text:
        return "gaussian_splatting"
    if "stereo" in text or "mvs" in text:
        return "multi_view_stereo"
    if "nerf" in text or "radiance" in text:
        return "nerf"
    return None


def apply_feedback(db: Session, project_id: str, parent: ResearchStep,
                   body: FeedbackIn, commit: bool = True) -> FeedbackResult:
    parent.human_influenced = True
    feedback = ResearchFeedback(
        project_id=project_id, step_id=parent.id,
        text=body.text.strip(), action=body.action,
        created_at=_next_demo_time(db, project_id),
    )
    db.add(feedback)
    db.flush()
    emit(db, project_id, "human_feedback", feedback.id, {
        "description": body.text.strip(), "action": body.action, "step_id": parent.id,
    }, human=True)

    candidate = (candidate_from_text(body.text)
                 or candidate_from_text(parent.content)
                 or "gaussian_splatting")
    label = {
        "nerf": "Method A", "gaussian_splatting": "the proposed method",
        "multi_view_stereo": "the alternative method",
    }.get(candidate, "the proposed method")
    if body.action == "approve":
        content = f"Human approved the prior step. Agent will continue in the current direction. Feedback: {body.text.strip()}"
        phase = "plan"
    elif body.action == "reject":
        content = f"Human rejected the prior step. Agent will reconsider alternatives. Feedback: {body.text.strip()}"
        phase = "hypothesize"
    else:
        content = f"Human {body.action}: redirecting investigation based on feedback. Agent revises hypothesis accordingly. Feedback: {body.text.strip()}"
        phase = "hypothesize" if body.action == "redirect" else "plan"

    evidence = json.loads(parent.evidence_json)
    response = append_step(db, project_id, phase, content, evidence, 0.82,
                           parent, human_influenced=True)
    feedback.response_step_id = response.id

    if body.action in {"redirect", "refine"}:
        already_guided = db.query(DemoExperiment).filter(
            DemoExperiment.project_id == project_id,
            DemoExperiment.method == "Human-guided comparative evaluation",
        ).first()
        if not already_guided:
            experiment = create_experiment(db, project_id, ExperimentIn(
                hypothesis="The human-preferred approach can match or exceed the baseline on key metrics while improving efficiency.",
                method="Human-guided comparative evaluation",
                config={"data_mode": "mock"},
            ))
            experiment_step = append_step(db, project_id, "experiment",
                "Adapted to human guidance and ran a comparative evaluation of the preferred approach versus baseline.",
                [experiment.id, *evidence], 0.79, response, human_influenced=True)
            complete_experiment(db, experiment, guided=True)
            evaluation = append_step(db, project_id, "evaluate",
                "Comparison favors the human-guided approach: better efficiency with comparable quality metrics.",
                [experiment.id], 0.83, experiment_step, human_influenced=True)
            append_step(db, project_id, "plan",
                "Next step: validate results on real-world data and review findings with the human researcher.",
                [experiment.id], 0.78, evaluation, human_influenced=True)

    if commit:
        db.commit()
    else:
        db.flush()
    return FeedbackResult(
        feedback=FeedbackOut(
            id=feedback.id, step_id=feedback.step_id,
            response_step_id=response.id, text=feedback.text,
            action=feedback.action, created_at=feedback.created_at,
        ),
        step=step_out(response),
    )


_CANDIDATES = (
    ("nerf", "NeRF reconstruction", 0.86),
    ("gaussian_splatting", "3D Gaussian Splatting", 0.72),
    ("multi_view_stereo", "Multi-view stereo", 0.63),
)

_CONDITIONED_DEFAULT = {
    "nerf": 0.70,
    "gaussian_splatting": 0.91,
    "multi_view_stereo": 0.58,
}


def policy_comparison(db: Session, project_id: str) -> PolicyComparisonOut:
    feedback = db.query(ResearchFeedback).filter(
        ResearchFeedback.project_id == project_id
    ).order_by(ResearchFeedback.created_at.desc(), ResearchFeedback.id.desc()).all()
    redirect = next((f for f in feedback if f.action == "redirect"), None)
    source = redirect or (feedback[0] if feedback else None)
    preferred = None
    if source:
        parent = db.get(ResearchStep, source.step_id)
        preferred = (candidate_from_text(source.text)
                     or (candidate_from_text(parent.content) if parent else None)
                     or "gaussian_splatting")
    w = 0.85 if redirect else (0.35 if feedback else 0.5)
    conditioned = {
        "nerf": 0.40, "gaussian_splatting": 0.96, "multi_view_stereo": 0.60,
    } if preferred == "gaussian_splatting" else (
        {candidate_id: (0.96 if candidate_id == preferred else 0.45)
         for candidate_id, _, _ in _CANDIDATES}
        if preferred else _CONDITIONED_DEFAULT
    )
    def ranked(guided: bool) -> list[ComparisonCandidate]:
        scores = []
        for candidate_id, label, base in _CANDIDATES:
            s_c = conditioned[candidate_id]
            s_guided = round((1 - w) * base + w * s_c, 4)
            scores.append((candidate_id, label, base, s_c, s_guided,
                           s_guided if guided else base))
        scores.sort(key=lambda row: (-row[5], row[0]))
        return [ComparisonCandidate(
            candidate_id=row[0], label=row[1], score=row[5], rank=index,
            s_u=row[2], s_c=row[3], s_guided=row[4],
        ) for index, row in enumerate(scores, start=1)]
    with_cfg = ranked(True)
    without_cfg = ranked(False)
    baseline = {candidate.candidate_id: candidate for candidate in without_cfg}
    diffs = [ComparisonDiff(
        candidate_id=candidate.candidate_id, cfg_rank=candidate.rank,
        no_cfg_rank=baseline[candidate.candidate_id].rank,
        rank_delta=baseline[candidate.candidate_id].rank - candidate.rank,
        score_delta=round(candidate.score - baseline[candidate.candidate_id].score, 4),
    ) for candidate in with_cfg]
    return PolicyComparisonOut(
        with_cfg=ComparisonBranch(candidates=with_cfg, w=w),
        without_cfg=ComparisonBranch(candidates=without_cfg), diff=diffs,
    )


def paper_results(project_id: str, query: str, semantic: bool, limit: int) -> list[PaperResult]:
    terms = set(re.findall(r"[a-z0-9]+", query.casefold()))
    synonyms = {
        "3d": {"3d", "three", "dimensional", "scene", "geometry"},
        "reconstruction": {"reconstruction", "radiance", "splatting", "geometry", "view"},
        "nerf": {"nerf", "radiance", "fields"},
        "gaussian": {"gaussian", "splatting"},
    }
    expanded = set(terms)
    if semantic:
        for term in terms:
            expanded.update(synonyms.get(term, set()))
    matches = []
    for node in mock_graph(project_id).nodes:
        metadata = node.metadata or {}
        title_terms = set(re.findall(r"[a-z0-9]+", node.label.casefold()))
        abstract_terms = set(re.findall(r"[a-z0-9]+", str(metadata.get("abstract", "")).casefold()))
        overlap = len(expanded & title_terms) * 2 + len(expanded & abstract_terms)
        if overlap == 0:
            continue
        score = min(1.0, round(overlap / max(3, len(terms) * 3), 3))
        matches.append(PaperResult(
            id=node.id, title=node.label, authors=metadata["authors"],
            venue=metadata["venue"], year=metadata["year"],
            abstract=metadata["abstract"], relevance_score=score,
            cluster=node.cluster or "unclustered",
        ))
    matches.sort(key=lambda paper: (-paper.relevance_score, paper.title))
    return matches[:limit]


def paper_details(project_id: str, paper_ids: list[str]) -> list[PaperDetail]:
    nodes = {node.id: node for node in mock_graph(project_id).nodes}
    details = []
    for paper_id in paper_ids:
        node = nodes.get(paper_id)
        if node is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"Paper not found: {paper_id}")
        metadata = node.metadata or {}
        topic = "3D reconstruction" if "reconstruction" in node.label.casefold() or "splatting" in node.label.casefold() else node.cluster.replace("_", " ")
        details.append(PaperDetail(
            id=node.id, title=node.label, authors=metadata["authors"],
            venue=metadata["venue"], year=metadata["year"],
            abstract=metadata["abstract"], relevance_score=1.0,
            cluster=node.cluster or "unclustered",
            claims=[f"Mock extracted claim: the proposed approach may improve {topic} under the study setup."],
            methods=[f"Mock extracted method: evaluate {node.label.lower()} on a representative benchmark."],
            findings=["Mock extracted finding: results require validation against the original publication."],
        ))
    return details


def timeline(db: Session, project_id: str) -> list[TimelineEntry]:
    entries: list[TimelineEntry] = []
    steps = db.query(ResearchStep).filter(ResearchStep.project_id == project_id).all()
    for row in steps:
        entries.append(TimelineEntry(
            id=row.id, type="research_step", timestamp=row.created_at,
            title=f"Agent: {row.phase.capitalize()}", description=row.content,
            human_involved=row.human_influenced,
            metadata={"phase": row.phase, "evidence": json.loads(row.evidence_json),
                      "confidence": row.confidence, "parent_step_id": row.parent_step_id,
                      "data_mode": "mock"},
        ))
    feedback = db.query(ResearchFeedback).filter(
        ResearchFeedback.project_id == project_id
    ).all()
    for row in feedback:
        entries.append(TimelineEntry(
            id=row.id, type="human_feedback", timestamp=row.created_at,
            title=f"Human {row.action}", description=row.text,
            human_involved=True,
            metadata={"step_id": row.step_id, "response_step_id": row.response_step_id,
                      "action": row.action},
        ))
    events = db.query(ResearchEvent).filter(ResearchEvent.project_id == project_id).all()
    for row in events:
        if row.type in {"agent_step", "human_feedback"}:
            continue
        payload = json.loads(row.payload_json) if row.payload_json else {}
        entries.append(TimelineEntry(
            id=row.id, type=row.type, timestamp=row.occurred_at,
            title=row.type.replace(".", " ").replace("_", " ").title(),
            description=str(payload.get("description") or row.type),
            human_involved=row.data_mode == "manual" or row.type in {
                "experiment.human_evaluated", "fork.created", "fork.replayed",
            },
            metadata={**payload, "entity_id": row.entity_id,
                      "sequence": row.sequence, "data_mode": row.data_mode},
        ))
    judgments = db.query(ResearcherPrinciple).join(
        ResearcherProfile, ResearcherPrinciple.profile_id == ResearcherProfile.id
    ).filter(ResearcherProfile.project_id == project_id).all()
    for row in judgments:
        entries.append(TimelineEntry(
            id=row.id, type="judgment", timestamp=row.created_at,
            title="Human research judgment", description=row.text,
            human_involved=True,
            metadata={"approved": row.approved, "source": row.source,
                      "data_mode": row.data_mode},
        ))
    return sorted(entries, key=lambda entry: (entry.timestamp, entry.id))


def seed_demo(db: Session) -> DemoSeedOut:
    ws = db.get(Workspace, "default")
    if ws is None:
        _team = [
            ("Dr. Sarah Chen", "sarah.chen@aporia.dev", "PI — 3D Vision & Neural Rendering", "admin"),
            ("Marcus Rivera", "marcus.r@aporia.dev", "PhD — Real-time Graphics", "member"),
            ("Anika Patel", "anika.p@aporia.dev", "Postdoc — Differentiable Rendering", "member"),
            ("James Okafor", "james.o@aporia.dev", "Engineer — GPU Optimization", "member"),
        ]
        users = []
        for name, email, expertise, role in _team:
            u = User(email=email, display_name=name,
                     expertise_json=json.dumps([expertise]), bio=expertise)
            db.add(u)
            users.append((u, role))
        db.flush()
        ws = Workspace(id="default", name="Aporia Research Lab",
                       visibility="private", owner_id=users[0][0].id)
        db.add(ws)
        db.flush()
        for u, role in users:
            db.add(WorkspaceMember(workspace_id="default", user_id=u.id, role=role))
        db.flush()

    project = Project(
        title="3D Reconstruction: NeRF to Gaussian Splatting",
        objective="Compare sparse-view 3D reconstruction methods with human guidance on rendering speed and visual quality.",
        status="completed", research_state="idle", created_at=_utcnow(),
        workspace_id="default",
    )
    db.add(project)
    db.flush()
    start = run_research_loop(db, project, commit=False)
    hypothesis = next(step for step in start.steps if step.phase == "hypothesize")
    parent = db.get(ResearchStep, hypothesis.id)
    apply_feedback(db, project.id, parent, FeedbackIn(
        text="Redirect toward 3D Gaussian Splatting. Rendering speed matters as much as novel-view quality.",
        action="redirect",
    ), commit=False)
    guided_plan = db.query(ResearchStep).filter(
        ResearchStep.project_id == project.id,
        ResearchStep.phase == "plan",
        ResearchStep.human_influenced.is_(True),
    ).order_by(ResearchStep.created_at.desc()).first()
    apply_feedback(db, project.id, guided_plan, FeedbackIn(
        text="Keep Gaussian splatting, but validate on real held-out views before claiming a measured win.",
        action="refine",
    ), commit=False)

    profile = ResearcherProfile(project_id=project.id)
    db.add(profile)
    db.flush()
    db.add(ResearcherPrinciple(
        profile_id=profile.id,
        text="Favor real-time 3D rendering, and require real-scene validation before treating mock metrics as evidence.",
        source="manual", data_mode="manual", approved=True,
        approved_at=_next_demo_time(db, project.id),
        weight_adjustments_json="{}",
        created_at=_next_demo_time(db, project.id),
    ))
    _FRONTIER_PAPERS = [
        ("3D Gaussian Splatting for Real-Time Radiance Field Rendering", "paper"),
        ("Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis", "paper"),
        ("SuGaR: Surface-Aligned Gaussian Splatting", "paper"),
        ("GaussianEditor: Swift and Controllable 3D Editing", "paper"),
        ("Deformable 3D Gaussians for Monocular Dynamic Scene Reconstruction", "paper"),
        ("PhysGaussian: Physics-Integrated 3D Gaussians for Generative Dynamics", "paper"),
        ("DreamGaussian: Generative Gaussian Splatting for 3D Content Creation", "paper"),
        ("GaussianDreamer: Fast Generation from Text to 3D Gaussians", "paper"),
        ("Compact 3D Gaussian Representation for Radiance Field", "paper"),
        ("Mip-Splatting: Alias-free 3D Gaussian Splatting", "paper"),
        ("GaussianAvatar: Realistic Human Avatar from a Single Video", "paper"),
        ("Animatable Gaussians: Learning Pose-Dependent Gaussian Maps", "paper"),
        ("Gaussian Head Avatar: Ultra High-Fidelity via Dynamic Gaussians", "paper"),
        ("GPS-Gaussian: Generalizable Pixel-wise 3D Gaussian Splatting", "paper"),
        ("SC-GS: Sparse-Controlled Gaussian Splatting for Editable Scenes", "paper"),
        ("Gaussian Splatting SLAM", "paper"),
        ("SplaTAM: Splat Track & Map 3D Gaussians for Dense RGB-D SLAM", "paper"),
        ("Photo-SLAM: Real-time Localization and Photorealistic Mapping", "paper"),
        ("LangSplat: 3D Language Gaussian Splatting", "paper"),
        ("Gaussian Grouping: Segment and Edit Anything in 3D Scenes", "paper"),
        ("COLMAP-Free 3D Gaussian Splatting", "paper"),
        ("GS-IR: 3D Gaussian Splatting for Inverse Rendering", "paper"),
        ("Scaffold-GS: Structured 3D Gaussians for View-Adaptive Rendering", "paper"),
        ("NeRF: Representing Scenes as Neural Radiance Fields", "paper"),
        ("Instant Neural Graphics Primitives with Multiresolution Hash Encoding", "paper"),
        ("Point-NeRF: Point-based Neural Radiance Fields", "paper"),
        ("Plenoxels: Radiance Fields without Neural Networks", "paper"),
        ("Multi-View Stereo Revisited", "paper"),
        ("PixelSplat: 3D Gaussian Splats from Image Pairs", "paper"),
        ("GauHuman: Articulated Gaussian Splatting for 3D Human Rendering", "paper"),
    ]
    _FRONTIER_EDGES = [
        (0, 1), (0, 2), (0, 4), (0, 8), (0, 9), (0, 14), (0, 22), (0, 28),
        (23, 0), (23, 24), (23, 25), (23, 26), (1, 4), (1, 14), (2, 3),
        (5, 4), (6, 7), (6, 0), (10, 11), (10, 12), (10, 13), (10, 29),
        (15, 16), (15, 17), (18, 19), (20, 0), (21, 0), (24, 25),
        (0, 15), (0, 18), (0, 10), (27, 23), (25, 0),
    ]
    _TOPIC_MAP = [0, 0, 0, 0, 0, 4, 1, 1, 6, 0, 0, 0, 0, 5, 5, 5, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]
    frontier_nodes = []
    for i, (label, node_type) in enumerate(_FRONTIER_PAPERS):
        angle = (i / len(_FRONTIER_PAPERS)) * 2 * math.pi
        radius = 3.0 + (i % 5) * 1.2
        x = round(math.cos(angle) * radius + (i % 3 - 1) * 0.4, 2)
        y = round(math.sin(angle) * radius + (i % 4 - 2) * 0.3, 2)
        z = round((i % 7 - 3) * 0.7, 2)
        topic = _TOPIC_MAP[i] if i < len(_TOPIC_MAP) else i % 8
        node = FrontierNode(
            project_id=project.id, node_type=node_type, label=label,
            detail=json.dumps({"topic_index": topic, "cluster_index": i % 10, "x": x, "y": y, "z": z, "size": round(0.8 + (i % 4) * 0.3, 2)}),
            status="open", priority=round(1.0 - i * 0.02, 2), data_mode="mock",
        )
        db.add(node)
        frontier_nodes.append(node)
    db.flush()
    for src_idx, dst_idx in _FRONTIER_EDGES:
        db.add(FrontierEdge(
            project_id=project.id,
            source_node_id=frontier_nodes[src_idx].id,
            target_node_id=frontier_nodes[dst_idx].id,
            edge_type="derived_from", weight=1.0,
        ))
    db.flush()

    strats = []
    for name, desc, status in [
        ("Gaussian Splatting Optimization", "Improve 3DGS quality via adaptive density control and spherical harmonics refinement", "active"),
        ("NeRF Baseline Comparison", "Establish NeRF baselines (Instant-NGP, Mip-NeRF) for fair comparison against Gaussian methods", "active"),
        ("Real-time Rendering Pipeline", "Optimize rasterization pipeline for 60fps on consumer GPUs using tile-based sorting", "planned"),
        ("Multi-view Capture Protocol", "Standardize capture methodology with structured light and calibrated multi-camera rigs", "active"),
        ("Perceptual Quality Metrics", "Develop evaluation metrics (LPIPS, DISTS) that correlate with human preference judgments", "completed"),
    ]:
        s = PortfolioStrategy(project_id=project.id, name=name, description=desc, status=status)
        db.add(s)
        strats.append(s)
    db.flush()

    if len(strats) >= 4:
        db.add(MetaTrial(workspace_id="default", strategy_a_id=strats[0].id,
                         strategy_b_id=strats[1].id, status="completed",
                         result_json=json.dumps({"winner": "a", "result": "a_wins",
                                                 "metrics": {"a_psnr": 29.4, "b_psnr": 28.2, "a_fps": 42, "b_fps": 0.4}})))
        db.add(MetaTrial(workspace_id="default", strategy_a_id=strats[2].id,
                         strategy_b_id=strats[3].id, status="running"))
    db.flush()

    _LIBRARY_PAPERS = [
        ("3D Gaussian Splatting for Real-Time Radiance Field Rendering", ["B. Kerbl", "G. Kopanas", "T. Leimkuhler", "G. Drettakis"], 2023, 1842, ["3DGS", "Real-time Rendering"], "We present 3D Gaussian Splatting, a method for real-time radiance field rendering that uses anisotropic 3D Gaussians as the scene representation."),
        ("NeRF: Representing Scenes as Neural Radiance Fields", ["B. Mildenhall", "P. Srinivasan", "M. Tancik", "J. Barron"], 2020, 8291, ["NeRF", "View Synthesis"], "We present a method that synthesizes novel views of complex scenes by optimizing an underlying continuous volumetric scene function."),
        ("Instant Neural Graphics Primitives", ["T. Muller", "A. Evans", "C. Schied", "A. Keller"], 2022, 3102, ["Neural Rendering", "Hash Encoding"], "Neural graphics primitives with multiresolution hash encoding for training NeRFs in seconds rather than hours."),
        ("Dynamic 3D Gaussians: Tracking by Persistent Dynamic View Synthesis", ["J. Luiten", "G. Kopanas", "B. Leibe", "D. Ramanan"], 2023, 412, ["Dynamic Scenes", "3DGS"], "We present a method for modeling dynamic scenes using persistent 3D Gaussians tracked across time."),
        ("SuGaR: Surface-Aligned Gaussian Splatting", ["A. Guedon", "V. Lepetit"], 2023, 287, ["Surface Reconstruction", "3DGS"], "A method to extract accurate meshes from Gaussian splatting by aligning Gaussians with scene surfaces."),
        ("DreamGaussian: Generative Gaussian Splatting for 3D Content Creation", ["J. Tang", "J. Ren", "H. Zhou", "Z. Liu", "G. Zeng"], 2023, 356, ["3D Generation", "3DGS"], "Efficient 3D content creation from single-view images by combining Gaussian splatting with score distillation."),
        ("GaussianEditor: Swift and Controllable 3D Editing", ["Y. Chen", "Z. Chen", "C. Zhang", "F. Wang", "H. Yang"], 2023, 198, ["3D Editing", "3DGS"], "A framework for controllable 3D scene editing using Gaussian splatting representations."),
        ("Mip-Splatting: Alias-free 3D Gaussian Splatting", ["Z. Yu", "A. Chen", "B. Huang", "T. Sattler", "A. Geiger"], 2023, 274, ["Anti-aliasing", "3DGS"], "Addressing aliasing artifacts in 3D Gaussian Splatting with a 3D smoothing filter and 2D Mip filter."),
        ("GaussianAvatar: Towards Realistic Human Avatar Modeling", ["Y. Hu", "H. Zhu", "Z. Liang", "F. Lu", "L. Ma"], 2023, 165, ["Avatars", "3DGS"], "Modeling realistic human avatars from monocular video using pose-dependent 3D Gaussians."),
        ("Gaussian Splatting SLAM", ["H. Matsuki", "R. Murai", "P. Kelly", "A. Sherrill"], 2023, 223, ["SLAM", "3DGS"], "Dense visual SLAM using 3D Gaussian Splatting as the scene representation for real-time tracking and mapping."),
        ("LangSplat: 3D Language Gaussian Splatting", ["M. Qin", "W. Li", "J. Zhou", "H. Wang", "H. Pfister"], 2023, 189, ["Language Grounding", "3DGS"], "Open-vocabulary 3D scene understanding by learning language features on 3D Gaussians."),
        ("Scaffold-GS: Structured 3D Gaussians for View-Adaptive Rendering", ["T. Lu", "M. Yu", "L. Xu", "Y. Jiang", "L. Wang", "Y. Ma"], 2023, 145, ["Structure", "3DGS"], "Using anchor points and neural Gaussians for view-adaptive rendering with structured 3D Gaussians."),
        ("Point-NeRF: Point-based Neural Radiance Fields", ["Q. Xu", "Z. Xu", "J. Philip", "S. Bi", "Z. Shu", "K. Sunkavalli"], 2022, 467, ["Point Cloud", "NeRF"], "A point-based neural radiance field that can be efficiently rendered with aggregated neural point features."),
        ("Plenoxels: Radiance Fields without Neural Networks", ["S. Fridovich-Keil", "A. Yu", "M. Tancik", "Q. Chen", "B. Recht", "A. Kanazawa"], 2022, 621, ["Voxel", "Real-time"], "A sparse voxel-based radiance field that trains 100x faster than NeRF with no neural network."),
        ("Compact 3D Gaussian Representation for Radiance Field", ["J. Lee", "D. Rho", "X. Sun", "J. Ko", "E. Park"], 2023, 132, ["Compression", "3DGS"], "Reducing the storage cost of 3D Gaussian Splatting while maintaining visual quality."),
        ("COLMAP-Free 3D Gaussian Splatting", ["Y. Fu", "S. Liu", "A. Kulkarni", "J. Kautz", "A. Efros", "X. Wang"], 2023, 178, ["Pose-free", "3DGS"], "Learning 3D Gaussian Splatting from sequential video frames without pre-computed camera poses."),
        ("Photo-SLAM: Real-time Localization and Photorealistic Mapping", ["H. Huang", "L. Li", "H. Cheng", "S. Yeung"], 2024, 89, ["SLAM", "Photorealism"], "Real-time simultaneous localization and photorealistic mapping using hyper primitives."),
        ("GS-IR: 3D Gaussian Splatting for Inverse Rendering", ["Z. Liang", "Q. Zhang", "Y. Feng", "Y. Shan", "K. Jia"], 2023, 112, ["Inverse Rendering", "3DGS"], "Decomposing scenes into materials and lighting using 3D Gaussian Splatting for relighting."),
        ("PixelSplat: 3D Gaussian Splats from Image Pairs", ["D. Charatan", "S. Li", "A. Tagliasacchi", "V. Sitzmann"], 2023, 156, ["Generalizable", "3DGS"], "Feed-forward prediction of 3D Gaussian Splats from stereo image pairs for scalable reconstruction."),
        ("Multi-View Stereo Revisited", ["J. Gu", "Z. Chen", "F. Dunn"], 2022, 234, ["MVS", "Depth Estimation"], "Revisiting multi-view stereo with modern architectures for dense depth estimation."),
    ]
    for title, authors, year, citations, topics, abstract in _LIBRARY_PAPERS:
        db.add(Paper(title=title, authors_json=json.dumps(authors), publication_year=year,
                     citation_count=citations, topics_json=json.dumps(topics),
                     abstract=abstract, data_mode="synthetic"))
    db.flush()

    for title, desc, conf in [
        ("Novel View Synthesis", "Generate photorealistic images from unseen viewpoints using sparse input views", 0.92),
        ("Differentiable Rendering", "End-to-end gradient computation through the rendering pipeline for optimization", 0.88),
        ("Point Cloud Processing", "Efficient manipulation and analysis of large-scale 3D point sets", 0.85),
        ("GPU Kernel Optimization", "Custom CUDA kernels for real-time inference and rasterization", 0.79),
        ("Perceptual Quality Assessment", "LPIPS, SSIM, DISTS and human preference-based evaluation of rendered images", 0.91),
        ("Camera Calibration", "Intrinsic and extrinsic parameter estimation for multi-view setups", 0.83),
        ("Scene Graph Construction", "Building semantic 3D scene representations from visual observations", 0.76),
        ("Mesh Reconstruction", "Surface extraction from implicit and explicit 3D representations", 0.81),
    ]:
        db.add(CandidateSkill(project_id=project.id, title=title, description=desc,
                              confidence=conf, status="promoted", data_mode="synthetic"))
    db.flush()

    db.commit()
    experiment = db.query(DemoExperiment).filter(
        DemoExperiment.project_id == project.id,
        DemoExperiment.method == "3D Gaussian Splatting versus NeRF",
    ).first()
    return DemoSeedOut(
        project_id=project.id, title=project.title,
        research_step_count=db.query(ResearchStep).filter(
            ResearchStep.project_id == project.id
        ).count(),
        experiment_id=experiment.id,
        timeline_count=len(timeline(db, project.id)),
    )
