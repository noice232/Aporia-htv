from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.plan import PlanVersion, ResearchPlan
from app.plan_compiler import approve_plan, compile_plan, update_plan
from app.schemas.plan import (
    CompilePlanRequest,
    PlanOut,
    PlanSummaryOut,
    PlanVersionOut,
    UpdatePlanRequest,
)

router = APIRouter(prefix="/api/v1", tags=["plans"])


@router.post("/projects/{project_id}/plans", response_model=PlanOut, status_code=201)
def post_plan(project_id: str, body: CompilePlanRequest, db: Session = Depends(get_db)):
    result = compile_plan(db, project_id, body.goal_text)
    db.commit()
    return result


@router.get("/projects/{project_id}/plans", response_model=list[PlanSummaryOut])
def list_plans(project_id: str, db: Session = Depends(get_db)):
    return db.query(ResearchPlan).filter(ResearchPlan.project_id == project_id).all()


@router.get("/projects/{project_id}/plans/{plan_id}", response_model=PlanOut)
def get_plan(project_id: str, plan_id: str, db: Session = Depends(get_db)):
    from app.plan_compiler import _plan_dict
    plan = db.query(ResearchPlan).filter(
        ResearchPlan.id == plan_id,
        ResearchPlan.project_id == project_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _plan_dict(db, plan)


@router.put("/projects/{project_id}/plans/{plan_id}", response_model=PlanOut)
def put_plan(project_id: str, plan_id: str, body: UpdatePlanRequest, db: Session = Depends(get_db)):
    plan = db.query(ResearchPlan).filter(
        ResearchPlan.id == plan_id,
        ResearchPlan.project_id == project_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    try:
        result = update_plan(db, plan_id, body.model_dump(exclude_unset=True))
        db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/projects/{project_id}/plans/{plan_id}/approve", response_model=PlanOut)
def post_approve(project_id: str, plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(ResearchPlan).filter(
        ResearchPlan.id == plan_id,
        ResearchPlan.project_id == project_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    try:
        result = approve_plan(db, plan_id)
        db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/projects/{project_id}/plans/{plan_id}/history", response_model=list[PlanVersionOut])
def get_history(project_id: str, plan_id: str, db: Session = Depends(get_db)):
    plan = db.query(ResearchPlan).filter(
        ResearchPlan.id == plan_id,
        ResearchPlan.project_id == project_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return db.query(PlanVersion).filter(
        PlanVersion.plan_id == plan_id
    ).order_by(PlanVersion.version).all()
