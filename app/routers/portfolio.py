from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio import PortfolioStrategy, StrategyVersion
from app.portfolio import (
    compare_strategies,
    create_strategy,
    rank_priorities,
    suggest_next,
    update_strategy,
)
from app.schemas.portfolio import (
    AgendaPriorityOut,
    CompareRequest,
    ComparisonOut,
    CreateStrategy,
    StrategyOut,
    StrategyVersionOut,
    SuggestNextRequest,
    SuggestionOut,
    UpdateStrategy,
)

router = APIRouter(prefix="/api/v1/projects/{project_id}", tags=["portfolio"])


@router.post("/strategies", response_model=StrategyOut, status_code=201)
def create(project_id: str, body: CreateStrategy, db: Session = Depends(get_db)):
    result = create_strategy(
        db,
        project_id=project_id,
        name=body.name,
        description=body.description,
        parameters_json=body.parameters_json,
        status=body.status,
    )
    db.commit()
    return result


@router.get("/strategies", response_model=list[StrategyOut])
def list_strategies(
    project_id: str,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(PortfolioStrategy).filter(
        PortfolioStrategy.project_id == project_id
    )
    if status:
        q = q.filter(PortfolioStrategy.status == status)
    return q.order_by(PortfolioStrategy.created_at.desc()).all()


@router.get("/strategies/{strategy_id}", response_model=StrategyOut)
def get_strategy(
    project_id: str,
    strategy_id: str,
    db: Session = Depends(get_db),
):
    s = (
        db.query(PortfolioStrategy)
        .filter(
            PortfolioStrategy.id == strategy_id,
            PortfolioStrategy.project_id == project_id,
        )
        .first()
    )
    if not s:
        raise HTTPException(404, "Strategy not found")
    return s


@router.put("/strategies/{strategy_id}", response_model=StrategyOut)
def update(
    project_id: str,
    strategy_id: str,
    body: UpdateStrategy,
    db: Session = Depends(get_db),
):
    s = (
        db.query(PortfolioStrategy)
        .filter(
            PortfolioStrategy.id == strategy_id,
            PortfolioStrategy.project_id == project_id,
        )
        .first()
    )
    if not s:
        raise HTTPException(404, "Strategy not found")
    try:
        result = update_strategy(
            db,
            strategy_id=strategy_id,
            name=body.name,
            description=body.description,
            parameters_json=body.parameters_json,
            status=body.status,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result


@router.get(
    "/strategies/{strategy_id}/history",
    response_model=list[StrategyVersionOut],
)
def version_history(
    project_id: str,
    strategy_id: str,
    db: Session = Depends(get_db),
):
    s = (
        db.query(PortfolioStrategy)
        .filter(
            PortfolioStrategy.id == strategy_id,
            PortfolioStrategy.project_id == project_id,
        )
        .first()
    )
    if not s:
        raise HTTPException(404, "Strategy not found")
    versions = (
        db.query(StrategyVersion)
        .filter(StrategyVersion.strategy_id == strategy_id)
        .order_by(StrategyVersion.version.asc())
        .all()
    )
    return versions


@router.post("/strategies/compare", response_model=ComparisonOut)
def compare(project_id: str, body: CompareRequest, db: Session = Depends(get_db)):
    try:
        result = compare_strategies(
            db,
            project_id=project_id,
            strategy_a_id=body.strategy_a_id,
            strategy_b_id=body.strategy_b_id,
            metric_name=body.metric_name,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result


@router.get("/priorities", response_model=list[AgendaPriorityOut])
def get_priorities(
    project_id: str,
    strategy_id: str | None = None,
    db: Session = Depends(get_db),
):
    priorities = rank_priorities(db, project_id, strategy_id)
    db.commit()
    return priorities


@router.post("/suggest-next", response_model=SuggestionOut)
def suggest(
    project_id: str,
    body: SuggestNextRequest | None = None,
    db: Session = Depends(get_db),
):
    strategy_id = body.strategy_id if body else None
    result = suggest_next(db, project_id, strategy_id)
    db.commit()
    return result
