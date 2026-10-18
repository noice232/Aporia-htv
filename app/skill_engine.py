from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.skill import CandidateSkill, SkillReview
from app.models.research_session import SessionStep


def extract_skill(
    db: Session,
    project_id: str,
    source_step_id: str | None = None,
    source_run_id: str | None = None,
    session_id: str | None = None,
    title: str | None = None,
    description: str | None = None,
    domain: str | None = None,
) -> dict[str, Any]:
    """Extract a candidate skill from session step evidence.

    Stub mode: uses step title + detail as the skill content.
    """
    evidence_summary = ""

    if source_step_id:
        step = db.query(SessionStep).filter(SessionStep.id == source_step_id).first()
        if step:
            title = title or step.title
            description = description or step.detail or step.title
            evidence_summary = f"Extracted from step: {step.title}"
            if step.detail:
                evidence_summary += f" — {step.detail}"
            session_id = session_id or step.session_id

    skill = CandidateSkill(
        project_id=project_id,
        session_id=session_id,
        title=title or "Untitled skill",
        description=description or "No description",
        evidence_summary=evidence_summary,
        source_step_id=source_step_id,
        source_run_id=source_run_id,
        domain=domain,
    )
    db.add(skill)
    db.flush()
    return _skill_dict(db, skill)


def review_skill(
    db: Session,
    skill_id: str,
    reviewer: str,
    verdict: str,
    comment: str = "",
) -> dict[str, Any]:
    """Submit a review for a candidate skill."""
    skill = db.query(CandidateSkill).filter(CandidateSkill.id == skill_id).first()
    if not skill:
        raise ValueError("Skill not found")

    review = SkillReview(
        skill_id=skill_id,
        reviewer=reviewer,
        verdict=verdict,
        comment=comment,
    )
    db.add(review)

    if skill.status == "candidate":
        skill.status = "under_review"

    if verdict == "reject":
        skill.status = "rejected"

    db.flush()
    return _review_dict(review)


def promote_skill(
    db: Session,
    skill_id: str,
) -> dict[str, Any]:
    """Promote a skill — requires at least one approve review."""
    skill = db.query(CandidateSkill).filter(CandidateSkill.id == skill_id).first()
    if not skill:
        raise ValueError("Skill not found")

    approvals = (
        db.query(SkillReview)
        .filter(SkillReview.skill_id == skill_id, SkillReview.verdict == "approve")
        .count()
    )
    if approvals < 1:
        raise ValueError("Cannot promote without at least one approval")

    skill.status = "promoted"
    skill.promoted_at = datetime.now(timezone.utc)
    db.flush()
    return _skill_dict(db, skill)


def retrieve_skills(
    db: Session,
    project_id: str | None = None,
    domain: str | None = None,
    status: str | None = None,
) -> list[dict[str, Any]]:
    """Retrieve skills with optional filters. Cross-project when project_id is None."""
    q = db.query(CandidateSkill)
    if project_id:
        q = q.filter(CandidateSkill.project_id == project_id)
    if domain:
        q = q.filter(CandidateSkill.domain == domain)
    if status:
        q = q.filter(CandidateSkill.status == status)
    skills = q.order_by(CandidateSkill.created_at.desc()).all()
    return [_skill_dict(db, s) for s in skills]


def _skill_dict(db: Session, skill: CandidateSkill) -> dict[str, Any]:
    reviews = db.query(SkillReview).filter(SkillReview.skill_id == skill.id).all()
    return {
        "id": skill.id,
        "project_id": skill.project_id,
        "session_id": skill.session_id,
        "title": skill.title,
        "description": skill.description,
        "evidence_summary": skill.evidence_summary,
        "source_step_id": skill.source_step_id,
        "source_run_id": skill.source_run_id,
        "status": skill.status,
        "domain": skill.domain,
        "confidence": skill.confidence,
        "data_mode": skill.data_mode,
        "created_at": skill.created_at,
        "promoted_at": skill.promoted_at,
        "reviews": [_review_dict(r) for r in reviews],
    }


def _review_dict(review: SkillReview) -> dict[str, Any]:
    return {
        "id": review.id,
        "skill_id": review.skill_id,
        "reviewer": review.reviewer,
        "verdict": review.verdict,
        "comment": review.comment,
        "created_at": review.created_at,
    }
