from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class TeamSession(Base):
    __tablename__ = "team_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), index=True)
    workspace_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    visibility: Mapped[str] = mapped_column(String(32), default="team")
    state: Mapped[str] = mapped_column(String(32), default="active")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    last_sequence: Mapped[int] = mapped_column(Integer, default=0)


class TeamParticipant(Base):
    __tablename__ = "team_participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("team_sessions.id"), index=True)
    user_id: Mapped[str] = mapped_column(String(36))
    display_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="observer")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class TeamComment(Base):
    __tablename__ = "team_comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("team_sessions.id"), index=True)
    author_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    source_refs_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    sequence: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
