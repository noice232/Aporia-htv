from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import TeamComment, TeamParticipant, TeamSession
from app.schemas.team import (
    CommentOut,
    CreateComment,
    CreateTeamSession,
    JoinRequest,
    ParticipantOut,
    TeamSessionOut,
)

router = APIRouter(prefix="/api/v1", tags=["team"])


def _session_to_out(session: TeamSession, db: Session) -> TeamSessionOut:
    participants = (
        db.query(TeamParticipant)
        .filter(TeamParticipant.session_id == session.id)
        .all()
    )
    comment_count = (
        db.query(func.count(TeamComment.id))
        .filter(TeamComment.session_id == session.id)
        .scalar()
    ) or 0
    return TeamSessionOut(
        id=session.id,
        project_id=session.project_id,
        workspace_id=session.workspace_id,
        visibility=session.visibility,
        state=session.state,
        started_at=session.started_at,
        last_sequence=session.last_sequence,
        participants=[ParticipantOut.model_validate(p) for p in participants],
        comment_count=comment_count,
    )


@router.get("/workspaces/{workspace_id}/sessions", response_model=list[TeamSessionOut])
def list_sessions(workspace_id: str, db: Session = Depends(get_db)):
    sessions = (
        db.query(TeamSession)
        .filter(TeamSession.workspace_id == workspace_id)
        .all()
    )
    return [_session_to_out(s, db) for s in sessions]


@router.post("/projects/{project_id}/sessions", response_model=TeamSessionOut, status_code=201)
def create_session(project_id: str, body: CreateTeamSession, db: Session = Depends(get_db)):
    session = TeamSession(
        project_id=project_id,
        workspace_id=body.workspace_id,
        visibility=body.visibility,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_to_out(session, db)


@router.post("/sessions/{session_id}/join", response_model=ParticipantOut, status_code=201)
def join_session(session_id: str, body: JoinRequest, db: Session = Depends(get_db)):
    session = db.query(TeamSession).filter(TeamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    participant = TeamParticipant(
        session_id=session_id,
        user_id=body.user_id,
        display_name=body.display_name,
        role=body.role,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return ParticipantOut.model_validate(participant)


@router.get("/sessions/{session_id}", response_model=TeamSessionOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(TeamSession).filter(TeamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return _session_to_out(session, db)


@router.get("/sessions/{session_id}/comments", response_model=list[CommentOut])
def list_comments(session_id: str, db: Session = Depends(get_db)):
    return (
        db.query(TeamComment)
        .filter(TeamComment.session_id == session_id)
        .order_by(TeamComment.sequence)
        .all()
    )


@router.post("/sessions/{session_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(session_id: str, body: CreateComment, db: Session = Depends(get_db)):
    session = db.query(TeamSession).filter(TeamSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    max_seq = (
        db.query(func.max(TeamComment.sequence))
        .filter(TeamComment.session_id == session_id)
        .scalar()
    ) or 0
    next_seq = max_seq + 1
    comment = TeamComment(
        session_id=session_id,
        author_id=body.author_id,
        body=body.body,
        source_refs_json=body.source_refs_json,
        sequence=next_seq,
    )
    db.add(comment)
    session.last_sequence = next_seq
    db.commit()
    db.refresh(comment)
    return CommentOut.model_validate(comment)
