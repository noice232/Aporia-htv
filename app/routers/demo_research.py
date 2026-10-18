from __future__ import annotations

import json
import threading
import time

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.demo_research import (
    _next_demo_time, apply_feedback, create_experiment, emit, experiment_out, paper_details,
    paper_results, policy_comparison, require_project, run_research_loop,
    seed_demo, step_out, timeline,
)
from app.models.demo_research import DemoExperiment, ResearchStep
from app.models.project import Project
from app.schemas.demo_research import (
    DemoSeedOut, EvaluateIn, ExperimentIn, ExperimentOut, FeedbackIn,
    FeedbackResult, PaperDetail, PaperResult, PaperRetrieveIn, PaperSearchIn,
    PolicyComparisonOut, ResearchStartOut, ResearchStepOut, TimelineEntry,
)

router = APIRouter(prefix="/api/v1", tags=["demo-research"])


@router.post("/projects/{project_id}/research/start", response_model=ResearchStartOut)
def start_research(
    project_id: str,
    live: bool = Body(False, embed=True),
    topic: str | None = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    project = require_project(db, project_id)
    if not live:
        return run_research_loop(db, project)

    project.research_state = "running"
    db.commit()

    def _run_live():
        session = SessionLocal()
        try:
            p = session.get(Project, project_id)
            if not p:
                return
            from app.demo_research import run_research_loop as _loop
            _loop(session, p, commit=True)
        except Exception:
            p2 = session.get(Project, project_id)
            if p2:
                p2.research_state = "failed"
                session.commit()
        finally:
            session.close()

    threading.Thread(target=_run_live, daemon=True).start()

    return ResearchStartOut(
        project_id=project_id,
        state="running",
        steps=[],
        experiment_id=None,
    )


@router.get("/projects/{project_id}/research/steps", response_model=list[ResearchStepOut])
def list_research_steps(
    project_id: str,
    human_only: bool = False,
    autonomous_only: bool = False,
    db: Session = Depends(get_db),
):
    require_project(db, project_id)
    if human_only and autonomous_only:
        raise HTTPException(status_code=422, detail="Choose one step filter")
    query = db.query(ResearchStep).filter(ResearchStep.project_id == project_id)
    if human_only:
        query = query.filter(ResearchStep.human_influenced.is_(True))
    if autonomous_only:
        query = query.filter(ResearchStep.human_influenced.is_(False))
    return [step_out(row) for row in query.order_by(
        ResearchStep.created_at, ResearchStep.id
    ).all()]


@router.post("/projects/{project_id}/research/steps/{step_id}/feedback",
             response_model=FeedbackResult, status_code=201)
def submit_step_feedback(
    project_id: str, step_id: str, body: FeedbackIn,
    db: Session = Depends(get_db),
):
    require_project(db, project_id)
    parent = db.query(ResearchStep).filter(
        ResearchStep.id == step_id, ResearchStep.project_id == project_id,
    ).first()
    if parent is None:
        raise HTTPException(status_code=404, detail="Research step not found")
    return apply_feedback(db, project_id, parent, body)


@router.get("/projects/{project_id}/policy/comparison",
            response_model=PolicyComparisonOut)
def get_policy_comparison(project_id: str, db: Session = Depends(get_db)):
    require_project(db, project_id)
    return policy_comparison(db, project_id)


@router.post("/projects/{project_id}/papers/search",
             response_model=list[PaperResult])
def search_project_papers(
    project_id: str, body: PaperSearchIn, db: Session = Depends(get_db),
):
    require_project(db, project_id)
    return paper_results(project_id, body.query, body.semantic, body.limit)


@router.post("/projects/{project_id}/papers/retrieve",
             response_model=list[PaperDetail])
def retrieve_project_papers(
    project_id: str, body: PaperRetrieveIn, db: Session = Depends(get_db),
):
    require_project(db, project_id)
    return paper_details(project_id, body.paper_ids)


@router.post("/projects/{project_id}/experiments",
             response_model=ExperimentOut, status_code=201)
def post_experiment(
    project_id: str, body: ExperimentIn, db: Session = Depends(get_db),
):
    require_project(db, project_id)
    row = create_experiment(db, project_id, body)
    db.commit()
    return experiment_out(row)


@router.get("/projects/{project_id}/experiments/{exp_id}",
            response_model=ExperimentOut)
def get_experiment(project_id: str, exp_id: str, db: Session = Depends(get_db)):
    require_project(db, project_id)
    row = db.query(DemoExperiment).filter(
        DemoExperiment.id == exp_id, DemoExperiment.project_id == project_id,
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment_out(row)


@router.post("/projects/{project_id}/experiments/{exp_id}/evaluate",
             response_model=ExperimentOut)
def evaluate_experiment(
    project_id: str, exp_id: str, body: EvaluateIn,
    db: Session = Depends(get_db),
):
    require_project(db, project_id)
    row = db.query(DemoExperiment).filter(
        DemoExperiment.id == exp_id, DemoExperiment.project_id == project_id,
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Experiment not found")
    row.human_evaluation_json = json.dumps({
        "override_score": body.score,
        "notes": body.notes.strip(), "redirect": body.redirect,
    })
    row.updated_at = _next_demo_time(db, project_id)
    emit(db, project_id, "experiment.human_evaluated", row.id, {
        "description": body.notes.strip(), "override_score": body.score,
        "redirect": body.redirect,
    }, human=True)
    db.commit()
    return experiment_out(row)


@router.get("/projects/{project_id}/timeline",
            response_model=list[TimelineEntry])
def get_timeline(project_id: str, db: Session = Depends(get_db)):
    require_project(db, project_id)
    return timeline(db, project_id)


@router.post("/demo/seed", response_model=DemoSeedOut, status_code=201)
def post_demo_seed(db: Session = Depends(get_db)):
    return seed_demo(db)
