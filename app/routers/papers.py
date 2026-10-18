from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paper import Paper
from app.schemas.paper import PaperOut

router = APIRouter(prefix="/api/v1", tags=["papers"])


def _paper_out(p: Paper) -> PaperOut:
    return PaperOut(
        id=p.id,
        arxiv_id=p.arxiv_id,
        openalex_id=p.openalex_id,
        doi=p.doi,
        title=p.title,
        authors_json=p.authors_json,
        abstract=p.abstract,
        url=p.url,
        publication_year=p.publication_year,
        citation_count=p.citation_count,
        topics_json=p.topics_json,
        position_json=p.position_json,
        data_mode=p.data_mode,
        created_at=p.created_at,
    )


@router.get("/papers", response_model=list[PaperOut])
def search_papers(
    q: str | None = Query(default=None),
    topic: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Paper)

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            Paper.title.ilike(pattern) | Paper.abstract.ilike(pattern)
        )

    if topic:
        topic_pattern = f"%{topic}%"
        query = query.filter(Paper.topics_json.ilike(topic_pattern))

    rows = query.order_by(Paper.created_at.desc()).limit(limit).all()
    return [_paper_out(p) for p in rows]


@router.get("/papers/{paper_id}", response_model=PaperOut)
def get_paper(paper_id: str, db: Session = Depends(get_db)):
    paper = db.get(Paper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return _paper_out(paper)
