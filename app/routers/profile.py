from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile import ProfileVersion, ResearcherPrinciple, ResearcherProfile
from app.models.project import Project, ResearchEvent
from app.policy.profile import (
    build_human_context,
    bump_version,
    compile_judgment,
    _get_or_create_profile,
)
from app.schemas.profile import (
    JudgmentRequest,
    PrincipleOut,
    ProfileOut,
    ProfileVersionOut,
    UpdatePrinciple,
)

router = APIRouter(prefix="/api/v1", tags=["profile"])


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
        weight_adjustments=json.loads(p.weight_adjustments_json),
        created_at=p.created_at,
    )


def _next_seq(db: Session, project_id: str) -> int:
    from sqlalchemy import func
    cur = db.query(func.max(ResearchEvent.sequence)).filter(
        ResearchEvent.project_id == project_id
    ).scalar()
    return (cur or 0) + 1


def _emit(db: Session, project_id: str, event_type: str,
          entity_id: str | None = None,
          payload: dict | None = None) -> None:
    seq = _next_seq(db, project_id)
    evt = ResearchEvent(
        project_id=project_id,
        sequence=seq,
        type=event_type,
        entity_id=entity_id,
        payload_json=json.dumps(payload) if payload else None,
        data_mode="measured",
        correlation_id=str(uuid.uuid4()),
    )
    db.add(evt)
    db.flush()


@router.post("/projects/{project_id}/judgments", response_model=PrincipleOut, status_code=201)
def submit_judgment(project_id: str, body: JudgmentRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profile = _get_or_create_profile(db, project_id)
    adjustments = compile_judgment(body.text)

    principle = ResearcherPrinciple(
        profile_id=profile.id,
        text=body.text,
        weight_adjustments_json=json.dumps(adjustments),
    )
    db.add(principle)
    db.flush()

    bump_version(db, profile)
    db.commit()
    return _principle_out(principle)


@router.post("/projects/{project_id}/principles/{principle_id}/approve", response_model=PrincipleOut)
def approve_principle(project_id: str, principle_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    principle = db.get(ResearcherPrinciple, principle_id)
    if not principle:
        raise HTTPException(status_code=404, detail="Principle not found")

    profile = db.get(ResearcherProfile, principle.profile_id)
    if not profile or profile.project_id != project_id:
        raise HTTPException(status_code=404, detail="Principle not found in this project")

    before_approved = principle.approved
    principle.approved = True
    principle.approved_at = datetime.now(timezone.utc)

    bump_version(db, profile)

    _emit(db, project_id, "intervention.approved", entity_id=principle.id,
          payload={
              "principle_id": principle.id,
              "before": {"approved": before_approved},
              "after": {"approved": True},
              "profile_version": profile.version,
          })

    db.commit()
    return _principle_out(principle)


@router.get("/projects/{project_id}/principles", response_model=list[PrincipleOut])
def list_principles(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profile = db.query(ResearcherProfile).filter(
        ResearcherProfile.project_id == project_id
    ).first()
    if not profile:
        return []

    rows = db.query(ResearcherPrinciple).filter(
        ResearcherPrinciple.profile_id == profile.id
    ).order_by(ResearcherPrinciple.created_at).all()
    return [_principle_out(p) for p in rows]


@router.put("/projects/{project_id}/principles/{principle_id}", response_model=PrincipleOut)
def update_principle(project_id: str, principle_id: str, body: UpdatePrinciple, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    principle = db.get(ResearcherPrinciple, principle_id)
    if not principle:
        raise HTTPException(status_code=404, detail="Principle not found")

    profile = db.get(ResearcherProfile, principle.profile_id)
    if not profile or profile.project_id != project_id:
        raise HTTPException(status_code=404, detail="Principle not found in this project")

    if body.text is not None:
        principle.text = body.text
        principle.weight_adjustments_json = json.dumps(compile_judgment(body.text))
    if body.enabled is not None:
        principle.enabled = body.enabled
    if body.confidence is not None:
        principle.confidence = body.confidence

    bump_version(db, profile)
    db.commit()
    return _principle_out(principle)


@router.delete("/projects/{project_id}/principles/{principle_id}", status_code=204)
def delete_principle(project_id: str, principle_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    principle = db.get(ResearcherPrinciple, principle_id)
    if not principle:
        raise HTTPException(status_code=404, detail="Principle not found")

    profile = db.get(ResearcherProfile, principle.profile_id)
    if not profile or profile.project_id != project_id:
        raise HTTPException(status_code=404, detail="Principle not found in this project")

    db.delete(principle)
    bump_version(db, profile)
    db.commit()


@router.get("/projects/{project_id}/profile", response_model=ProfileOut)
def get_profile(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profile = db.query(ResearcherProfile).filter(
        ResearcherProfile.project_id == project_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile exists for this project")

    principles = db.query(ResearcherPrinciple).filter(
        ResearcherPrinciple.profile_id == profile.id
    ).order_by(ResearcherPrinciple.created_at).all()

    ctx = build_human_context(db, project_id)
    scoring_weights = ctx["scoring_weights"] if ctx else None

    return ProfileOut(
        id=profile.id,
        project_id=profile.project_id,
        version=profile.version,
        principles=[_principle_out(p) for p in principles],
        scoring_weights=scoring_weights,
    )


@router.get("/projects/{project_id}/profile/history", response_model=list[ProfileVersionOut])
def get_profile_history(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    profile = db.query(ResearcherProfile).filter(
        ResearcherProfile.project_id == project_id
    ).first()
    if not profile:
        return []

    versions = db.query(ProfileVersion).filter(
        ProfileVersion.profile_id == profile.id
    ).order_by(ProfileVersion.version).all()

    return [
        ProfileVersionOut(
            version=v.version,
            principles_snapshot=json.loads(v.principles_snapshot_json),
            created_at=v.created_at,
        )
        for v in versions
    ]
