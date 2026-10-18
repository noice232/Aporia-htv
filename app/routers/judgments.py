from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile import ResearcherPrinciple, ResearcherProfile
from app.models.project import Project
from app.papiers import PapiersAdapter, PapiersUnavailable, PapiersInvalidResponse
from app.policy.profile import (
    _get_or_create_profile,
    bump_version,
    compile_judgment,
)
from app.schemas.profile import PrincipleOut

_PAPIERS_TYPED_ID = re.compile(r"^(?:doc|pas|hl|nte|eq|cnv)_[A-Za-z0-9_-]+$")


router = APIRouter(prefix="/api/v1", tags=["judgments"])


class CompileJudgmentRequest(BaseModel):
    source_context_id: str | None = None
    context_text: str


class ReviewJudgmentRequest(BaseModel):
    approved: bool
    comment: str | None = None


def _principle_out(p: ResearcherPrinciple) -> PrincipleOut:
    return PrincipleOut(
        id=p.id,
        text=p.text,
        source=p.source,
        scope=p.scope,
        confidence=p.confidence,
        enabled=p.enabled,
        approved=p.approved,
        approved_at=p.approved_at,
        data_mode=p.data_mode,
        weight_adjustments=json.loads(p.weight_adjustments_json),
        created_at=p.created_at,
    )


@router.post("/projects/{project_id}/judgments/compile", response_model=PrincipleOut, status_code=201)
def compile_judgment_endpoint(
    project_id: str,
    body: CompileJudgmentRequest,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profile = _get_or_create_profile(db, project_id)
    adjustments = compile_judgment(body.context_text)

    source = "compiled"
    data_mode = "manual"

    if body.source_context_id:
        source = "papiers"
        if _PAPIERS_TYPED_ID.fullmatch(body.source_context_id):
            access_key = os.getenv("APORIA_PAPIERS_ACCESS_KEY")
            if access_key:
                adapter = PapiersAdapter.from_environment()
                try:
                    adapter.read(body.source_context_id)
                    data_mode = "verified"
                except (PapiersUnavailable, PapiersInvalidResponse, ValueError):
                    raise HTTPException(
                        status_code=422,
                        detail="Source not verified by Papiers",
                    )
            else:
                data_mode = "unverified"
        else:
            data_mode = "unverified"

    principle = ResearcherPrinciple(
        profile_id=profile.id,
        text=body.context_text,
        source=source,
        data_mode=data_mode,
        weight_adjustments_json=json.dumps(adjustments),
    )
    db.add(principle)
    db.flush()

    bump_version(db, profile)
    db.commit()
    return _principle_out(principle)


@router.post("/projects/{project_id}/judgments/{judgment_id}/review", response_model=PrincipleOut)
def review_judgment(
    project_id: str,
    judgment_id: str,
    body: ReviewJudgmentRequest,
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    principle = db.get(ResearcherPrinciple, judgment_id)
    if not principle:
        raise HTTPException(status_code=404, detail="Judgment not found")

    profile = db.get(ResearcherProfile, principle.profile_id)
    if not profile or profile.project_id != project_id:
        raise HTTPException(status_code=404, detail="Judgment not found in this project")

    if body.approved:
        principle.approved = True
        principle.approved_at = datetime.now(timezone.utc)

    bump_version(db, profile)
    db.commit()
    return _principle_out(principle)


@router.get("/projects/{project_id}/judgments", response_model=list[PrincipleOut])
def list_judgments(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profile = db.query(ResearcherProfile).filter(
        ResearcherProfile.project_id == project_id,
    ).first()
    if not profile:
        return []

    rows = db.query(ResearcherPrinciple).filter(
        ResearcherPrinciple.profile_id == profile.id,
    ).order_by(ResearcherPrinciple.created_at).all()
    return [_principle_out(p) for p in rows]
