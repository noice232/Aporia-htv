from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workspace import User, Workspace, WorkspaceMember
from app.schemas.workspace import (
    AddMember,
    CreateUser,
    CreateWorkspace,
    UpdateResearcher,
    UserOut,
    WorkspaceMemberOut,
    WorkspaceOut,
)

router = APIRouter(prefix="/api/v1", tags=["workspaces"])


# ---- helpers ----

def _user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        display_name=u.display_name,
        expertise_json=u.expertise_json,
        bio=u.bio,
        created_at=u.created_at,
    )


# ---- users (internal helper) ----

@router.post("/users", response_model=UserOut, status_code=201)
def create_user(body: CreateUser, db: Session = Depends(get_db)):
    user = User(
        email=body.email,
        display_name=body.display_name,
        expertise_json=body.expertise_json,
        bio=body.bio,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_out(user)


# ---- GET /me ----

@router.get("/me", response_model=UserOut)
def get_me(
    request: Request,
    user_id: str | None = Query(None),
    db: Session = Depends(get_db),
):
    # Try Authorization header first
    resolved_id: str | None = None
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        resolved_id = auth[len("Bearer "):]

    # Fall back to query param
    if not resolved_id:
        resolved_id = user_id

    if not resolved_id:
        raise HTTPException(status_code=401, detail="No authentication provided")

    user = db.get(User, resolved_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return _user_out(user)


# ---- workspaces ----

@router.get("/workspaces", response_model=list[WorkspaceOut])
def list_workspaces(
    owner_id: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Workspace)
    if owner_id:
        q = q.filter(Workspace.owner_id == owner_id)
    rows = q.order_by(Workspace.created_at).all()
    return [
        WorkspaceOut(
            id=w.id,
            name=w.name,
            visibility=w.visibility,
            owner_id=w.owner_id,
            created_at=w.created_at,
        )
        for w in rows
    ]


@router.post("/workspaces", response_model=WorkspaceOut, status_code=201)
def create_workspace(body: CreateWorkspace, db: Session = Depends(get_db)):
    ws = Workspace(
        name=body.name,
        visibility=body.visibility,
        owner_id=body.owner_id,
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return WorkspaceOut(
        id=ws.id,
        name=ws.name,
        visibility=ws.visibility,
        owner_id=ws.owner_id,
        created_at=ws.created_at,
    )


# ---- workspace members ----

@router.get("/workspaces/{workspace_id}/members", response_model=list[WorkspaceMemberOut])
def list_members(workspace_id: str, db: Session = Depends(get_db)):
    ws = db.get(Workspace, workspace_id)
    if ws is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    rows = (
        db.query(WorkspaceMember)
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at)
        .all()
    )
    return [
        WorkspaceMemberOut(
            id=m.id,
            workspace_id=m.workspace_id,
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
        )
        for m in rows
    ]


@router.post("/workspaces/{workspace_id}/members", response_model=WorkspaceMemberOut, status_code=201)
def add_member(workspace_id: str, body: AddMember, db: Session = Depends(get_db)):
    ws = db.get(Workspace, workspace_id)
    if ws is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=body.user_id,
        role=body.role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return WorkspaceMemberOut(
        id=member.id,
        workspace_id=member.workspace_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
    )


# ---- researcher profiles ----

@router.get("/researchers/{user_id}", response_model=UserOut)
def get_researcher(user_id: str, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Researcher not found")
    return _user_out(user)


@router.patch("/researchers/{user_id}", response_model=UserOut)
def update_researcher(user_id: str, body: UpdateResearcher, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Researcher not found")

    if body.display_name is not None:
        user.display_name = body.display_name
    if body.expertise_json is not None:
        user.expertise_json = body.expertise_json
    if body.bio is not None:
        user.bio = body.bio

    db.commit()
    db.refresh(user)
    return _user_out(user)
