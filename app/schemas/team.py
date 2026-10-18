from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreateTeamSession(BaseModel):
    project_id: str | None = None
    workspace_id: str | None = None
    visibility: str = "team"


class ParticipantOut(BaseModel):
    id: str
    session_id: str
    user_id: str
    display_name: str | None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: str
    session_id: str
    author_id: str | None
    body: str
    source_refs_json: str | None
    sequence: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamSessionOut(BaseModel):
    id: str
    project_id: str
    workspace_id: str | None
    visibility: str
    state: str
    started_at: datetime
    last_sequence: int
    participants: list[ParticipantOut] = []
    comment_count: int = 0

    model_config = {"from_attributes": True}


class JoinRequest(BaseModel):
    user_id: str
    display_name: str | None = None
    role: str = "observer"


class CreateComment(BaseModel):
    body: str
    author_id: str | None = None
    source_refs_json: str | None = None
