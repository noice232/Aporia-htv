from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


# ---- User / Researcher ----

class CreateUser(BaseModel):
    email: str
    display_name: str
    expertise_json: str | None = None
    bio: str | None = None


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    expertise_json: str | None
    bio: str | None
    created_at: datetime


class UpdateResearcher(BaseModel):
    display_name: str | None = None
    expertise_json: str | None = None
    bio: str | None = None


# ---- Workspace ----

class CreateWorkspace(BaseModel):
    name: str
    visibility: str = "private"
    owner_id: str


class WorkspaceOut(BaseModel):
    id: str
    name: str
    visibility: str
    owner_id: str
    created_at: datetime


# ---- Workspace Member ----

class AddMember(BaseModel):
    user_id: str
    role: str = "member"


class WorkspaceMemberOut(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    joined_at: datetime
