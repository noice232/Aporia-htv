from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lesson import ResearchLesson
from app.schemas.lesson import CreateLesson, LessonOut, ReviewLesson, TransferLesson

router = APIRouter(prefix="/api/v1", tags=["lessons"])


@router.get("/workspaces/{workspace_id}/lessons", response_model=list[LessonOut])
def list_lessons(workspace_id: str, db: Session = Depends(get_db)):
    return (
        db.query(ResearchLesson)
        .filter(ResearchLesson.workspace_id == workspace_id)
        .all()
    )


@router.post("/workspaces/{workspace_id}/lessons", response_model=LessonOut, status_code=201)
def propose_lesson(workspace_id: str, body: CreateLesson, db: Session = Depends(get_db)):
    lesson = ResearchLesson(
        workspace_id=workspace_id,
        title=body.title,
        statement=body.statement,
        evidence_run_ids_json=body.evidence_run_ids_json,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonOut.model_validate(lesson)


@router.post("/lessons/{lesson_id}/review", response_model=LessonOut)
def review_lesson(lesson_id: str, body: ReviewLesson, db: Session = Depends(get_db)):
    lesson = db.query(ResearchLesson).filter(ResearchLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    if lesson.review_state != "proposed":
        raise HTTPException(409, "Lesson already reviewed")
    lesson.review_state = "approved" if body.approved else "rejected"
    lesson.reviewer_comment = body.comment
    db.commit()
    db.refresh(lesson)
    return LessonOut.model_validate(lesson)


@router.post("/lessons/{lesson_id}/transfer", response_model=LessonOut)
def transfer_lesson(lesson_id: str, body: TransferLesson, db: Session = Depends(get_db)):
    lesson = db.query(ResearchLesson).filter(ResearchLesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    existing: list = []
    if lesson.transfer_tests_json:
        existing = json.loads(lesson.transfer_tests_json)
    entry = {"target_project_id": body.target_project_id}
    if body.experiment_spec_id is not None:
        entry["experiment_spec_id"] = body.experiment_spec_id
    existing.append(entry)
    lesson.transfer_tests_json = json.dumps(existing)
    db.commit()
    db.refresh(lesson)
    return LessonOut.model_validate(lesson)
