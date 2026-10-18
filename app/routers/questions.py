from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.question import HumanQuestion
from app.schemas.question import AnswerRequest, CreateQuestion, ExpertRequest, QuestionOut

router = APIRouter(prefix="/api/v1", tags=["questions"])


def _question_out(q: HumanQuestion) -> QuestionOut:
    return QuestionOut(
        id=q.id,
        project_id=q.project_id,
        prompt=q.prompt,
        reason_for_asking=q.reason_for_asking,
        options_json=q.options_json,
        status=q.status,
        evidence_refs_json=q.evidence_refs_json,
        routed_to=q.routed_to,
        answer_text=q.answer_text,
        answer_choice=q.answer_choice,
        answered_at=q.answered_at,
        created_at=q.created_at,
    )


@router.get("/projects/{project_id}/questions", response_model=list[QuestionOut])
def list_questions(
    project_id: str,
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(HumanQuestion).filter(HumanQuestion.project_id == project_id)
    if status is not None:
        query = query.filter(HumanQuestion.status == status)
    rows = query.order_by(HumanQuestion.created_at).all()
    return [_question_out(q) for q in rows]


@router.post("/projects/{project_id}/questions", response_model=QuestionOut, status_code=201)
def create_question(project_id: str, body: CreateQuestion, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    question = HumanQuestion(
        project_id=project_id,
        prompt=body.prompt,
        reason_for_asking=body.reason_for_asking,
        options_json=body.options_json,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return _question_out(question)


@router.post("/questions/{question_id}/answer", response_model=QuestionOut)
def answer_question(question_id: str, body: AnswerRequest, db: Session = Depends(get_db)):
    question = db.get(HumanQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.status == "answered":
        raise HTTPException(status_code=409, detail="Question already answered")

    question.answer_text = body.rationale
    question.answer_choice = body.choice
    question.status = "answered"
    question.answered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(question)
    return _question_out(question)


@router.post("/projects/{project_id}/experts/request", response_model=QuestionOut)
def route_to_expert(project_id: str, body: ExpertRequest, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    question = db.get(HumanQuestion, body.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    question.routed_to = body.researcher_id
    db.commit()
    db.refresh(question)
    return _question_out(question)
