from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio import AgendaPriority, PortfolioStrategy
from app.schemas.portfolio import AgendaPriorityOut, StrategyOut

router = APIRouter(prefix="/api/v1/workspaces/{workspace_id}", tags=["ws-portfolio"])


@router.get("/portfolio", response_model=list[AgendaPriorityOut])
def workspace_portfolio(workspace_id: str, db: Session = Depends(get_db)):
    """Aggregate portfolio across all projects in workspace.

    Best-effort workspace filtering: returns all agenda priorities since
    projects don't have a workspace_id column yet.
    """
    priorities = (
        db.query(AgendaPriority)
        .order_by(AgendaPriority.score.desc())
        .all()
    )
    return priorities


@router.post("/portfolio/reprioritize", response_model=AgendaPriorityOut)
def reprioritize(
    workspace_id: str,
    body: dict,
    db: Session = Depends(get_db),
):
    """Update or create an AgendaPriority."""
    agenda_item_id = body["agenda_item_id"]
    priority_val = body["priority"]
    reason = body.get("reason", "")

    existing = (
        db.query(AgendaPriority)
        .filter(AgendaPriority.agenda_item_id == agenda_item_id)
        .first()
    )
    if existing:
        existing.score = priority_val
        existing.rationale = reason
        db.commit()
        db.refresh(existing)
        return existing
    else:
        ap = AgendaPriority(
            project_id="",  # workspace-level, no specific project
            agenda_item_id=agenda_item_id,
            rank=1,
            score=priority_val,
            rationale=reason,
        )
        db.add(ap)
        db.commit()
        db.refresh(ap)
        return ap


@router.get("/strategies", response_model=list[StrategyOut])
def workspace_strategies(workspace_id: str, db: Session = Depends(get_db)):
    """List all portfolio strategies.

    Best-effort workspace filtering: returns all strategies since
    projects don't have a workspace_id column yet.
    """
    strategies = (
        db.query(PortfolioStrategy)
        .order_by(PortfolioStrategy.created_at.desc())
        .all()
    )
    return strategies
