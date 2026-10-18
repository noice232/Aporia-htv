from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.skill import CandidateSkill, SkillReview
from app.schemas.skill import ExtractSkill, ReviewOut, SkillOut, SubmitReview
from app.skill_engine import (
    extract_skill,
    promote_skill,
    retrieve_skills,
    review_skill,
)

router = APIRouter(tags=["skills"])

_project_prefix = "/api/v1/projects/{project_id}"


@router.post(f"{_project_prefix}/skills", response_model=SkillOut, status_code=201)
def create_skill(project_id: str, body: ExtractSkill, db: Session = Depends(get_db)):
    result = extract_skill(
        db,
        project_id=project_id,
        source_step_id=body.source_step_id,
        source_run_id=body.source_run_id,
        session_id=body.session_id,
        title=body.title,
        description=body.description,
        domain=body.domain,
    )
    db.commit()
    return result


@router.get(f"{_project_prefix}/skills", response_model=list[SkillOut])
def list_skills(
    project_id: str,
    status: str | None = None,
    domain: str | None = None,
    db: Session = Depends(get_db),
):
    return retrieve_skills(db, project_id=project_id, domain=domain, status=status)


@router.get(f"{_project_prefix}/skills/{{skill_id}}", response_model=SkillOut)
def get_skill(project_id: str, skill_id: str, db: Session = Depends(get_db)):
    skill = (
        db.query(CandidateSkill)
        .filter(CandidateSkill.id == skill_id, CandidateSkill.project_id == project_id)
        .first()
    )
    if not skill:
        raise HTTPException(404, "Skill not found")
    reviews = db.query(SkillReview).filter(SkillReview.skill_id == skill.id).all()
    return SkillOut(
        id=skill.id,
        project_id=skill.project_id,
        session_id=skill.session_id,
        title=skill.title,
        description=skill.description,
        evidence_summary=skill.evidence_summary,
        source_step_id=skill.source_step_id,
        source_run_id=skill.source_run_id,
        status=skill.status,
        domain=skill.domain,
        confidence=skill.confidence,
        data_mode=skill.data_mode,
        created_at=skill.created_at,
        promoted_at=skill.promoted_at,
        reviews=[ReviewOut.model_validate(r) for r in reviews],
    )


@router.post(f"{_project_prefix}/skills/{{skill_id}}/review", response_model=ReviewOut, status_code=201)
def submit_review(project_id: str, skill_id: str, body: SubmitReview, db: Session = Depends(get_db)):
    skill = (
        db.query(CandidateSkill)
        .filter(CandidateSkill.id == skill_id, CandidateSkill.project_id == project_id)
        .first()
    )
    if not skill:
        raise HTTPException(404, "Skill not found")
    try:
        result = review_skill(db, skill_id, body.reviewer, body.verdict, body.comment)
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result


@router.post(f"{_project_prefix}/skills/{{skill_id}}/promote", response_model=SkillOut)
def promote(project_id: str, skill_id: str, db: Session = Depends(get_db)):
    skill = (
        db.query(CandidateSkill)
        .filter(CandidateSkill.id == skill_id, CandidateSkill.project_id == project_id)
        .first()
    )
    if not skill:
        raise HTTPException(404, "Skill not found")
    try:
        result = promote_skill(db, skill_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result


@router.get("/api/v1/skills", response_model=list[SkillOut])
def cross_project_skills(
    domain: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return retrieve_skills(db, project_id=None, domain=domain, status=status)
