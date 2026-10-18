from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.research_session import HumanCheckpoint, ResearchSession, SessionStep
from app.schemas.research_session import (
    AnswerCheckpoint,
    CheckpointOut,
    CreateCheckpoint,
    CreateSession,
    CreateStep,
    SessionDetail,
    SessionSummary,
    StepOut,
)

router = APIRouter(prefix="/api/v1/research-sessions", tags=["research-sessions"])


def _require_session(db: Session, session_id: str) -> ResearchSession:
    research_session = db.get(ResearchSession, session_id)
    if research_session is None:
        raise HTTPException(status_code=404, detail="Research session not found")
    return research_session


def _summary(row: ResearchSession) -> SessionSummary:
    return SessionSummary.model_validate(row, from_attributes=True)


def _checkpoint(row: HumanCheckpoint) -> CheckpointOut:
    return CheckpointOut.model_validate(row, from_attributes=True)


@router.post("", response_model=SessionSummary, status_code=201)
def create_session(body: CreateSession, db: Session = Depends(get_db)):
    if body.project_id is not None and db.get(Project, body.project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    row = ResearchSession(**body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _summary(row)


@router.get("", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db)):
    rows = db.query(ResearchSession).order_by(ResearchSession.created_at.desc()).limit(100).all()
    return [_summary(row) for row in rows]


@router.get("/{session_id}", response_model=SessionDetail)
def get_session(session_id: str, db: Session = Depends(get_db)):
    row = _require_session(db, session_id)
    steps = (
        db.query(SessionStep)
        .filter(SessionStep.session_id == session_id)
        .order_by(SessionStep.sequence)
        .all()
    )
    checkpoints = (
        db.query(HumanCheckpoint)
        .filter(HumanCheckpoint.session_id == session_id)
        .order_by(HumanCheckpoint.sequence)
        .all()
    )
    return SessionDetail(
        **_summary(row).model_dump(),
        steps=[StepOut.model_validate(step, from_attributes=True) for step in steps],
        checkpoints=[_checkpoint(checkpoint) for checkpoint in checkpoints],
    )


@router.post("/{session_id}/steps", response_model=StepOut, status_code=201)
def append_step(session_id: str, body: CreateStep, db: Session = Depends(get_db)):
    research_session = _require_session(db, session_id)
    sequence = research_session.next_sequence
    research_session.next_sequence += 1
    row = SessionStep(session_id=session_id, sequence=sequence, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return StepOut.model_validate(row, from_attributes=True)


@router.post("/{session_id}/checkpoints", response_model=CheckpointOut, status_code=201)
def open_checkpoint(session_id: str, body: CreateCheckpoint, db: Session = Depends(get_db)):
    research_session = _require_session(db, session_id)
    sequence = research_session.next_sequence
    research_session.next_sequence += 1
    row = HumanCheckpoint(session_id=session_id, sequence=sequence, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _checkpoint(row)


@router.post("/{session_id}/checkpoints/{checkpoint_id}/answer", response_model=CheckpointOut)
def answer_checkpoint(
    session_id: str,
    checkpoint_id: str,
    body: AnswerCheckpoint,
    db: Session = Depends(get_db),
):
    research_session = _require_session(db, session_id)
    row = db.get(HumanCheckpoint, checkpoint_id)
    if row is None or row.session_id != session_id:
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    if row.status == "answered":
        raise HTTPException(status_code=409, detail="Checkpoint already answered")
    row.answer = body.answer
    row.guidance_weight = body.guidance_weight
    row.status = "answered"
    row.answer_sequence = research_session.next_sequence
    row.answered_at = datetime.now(timezone.utc)
    research_session.next_sequence += 1
    db.commit()
    db.refresh(row)
    return _checkpoint(row)
