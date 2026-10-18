from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.source import SourceContext
from app.schemas.source import CreateSource, SourceOut, SourceSearch

router = APIRouter(prefix="/api/v1", tags=["sources"])


def _source_out(s: SourceContext) -> SourceOut:
    return SourceOut(
        id=s.id,
        provider=s.provider,
        source_locator=s.source_locator,
        kind=s.kind,
        title=s.title,
        excerpt=s.excerpt,
        access_scope=s.access_scope,
        data_mode=s.data_mode,
        project_id=s.project_id,
        retrieved_at=s.retrieved_at,
    )


@router.get("/projects/{project_id}/sources", response_model=list[SourceOut])
def list_sources(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rows = (
        db.query(SourceContext)
        .filter(SourceContext.project_id == project_id)
        .order_by(SourceContext.retrieved_at.desc())
        .all()
    )
    return [_source_out(s) for s in rows]


@router.post("/projects/{project_id}/sources", response_model=SourceOut, status_code=201)
def create_source(project_id: str, body: CreateSource, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source = SourceContext(
        provider=body.provider,
        source_locator=body.source_locator,
        kind=body.kind,
        title=body.title,
        excerpt=body.excerpt,
        access_scope=body.access_scope,
        data_mode=body.data_mode,
        project_id=project_id,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return _source_out(source)


@router.post("/projects/{project_id}/sources/search", response_model=list[SourceOut])
def search_sources(project_id: str, body: SourceSearch, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(SourceContext).filter(SourceContext.project_id == project_id)

    if body.query:
        pattern = f"%{body.query}%"
        query = query.filter(
            SourceContext.title.ilike(pattern) | SourceContext.excerpt.ilike(pattern)
        )

    if body.provider:
        query = query.filter(SourceContext.provider == body.provider)

    if body.kind:
        query = query.filter(SourceContext.kind == body.kind)

    rows = query.order_by(SourceContext.retrieved_at.desc()).all()
    return [_source_out(s) for s in rows]


@router.get("/sources/{source_context_id}", response_model=SourceOut)
def get_source(source_context_id: str, db: Session = Depends(get_db)):
    source = db.get(SourceContext, source_context_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return _source_out(source)
