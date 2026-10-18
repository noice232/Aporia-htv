from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paper import Paper
from app.schemas.paper import PaperOut

router = APIRouter(prefix="/api/v1", tags=["corpus"])


class CorpusSyncRequest(BaseModel):
    query: str
    max_works: int = 10


class CorpusSyncResponse(BaseModel):
    synced_count: int
    papers: list[PaperOut]


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


@router.post("/corpus/sync", response_model=CorpusSyncResponse)
def corpus_sync(body: CorpusSyncRequest, db: Session = Depends(get_db)):
    """Demo corpus sync stub.

    In production this would call OpenAlex / arXiv APIs. In demo mode it
    creates synthetic Paper records based on the query.
    """
    papers = []
    for i in range(body.max_works):
        paper = Paper(
            title=f"{body.query} — demo result {i + 1}",
            abstract=f"Demo abstract for query '{body.query}', result {i + 1}.",
            authors_json=json.dumps(["Demo Author"]),
            topics_json=json.dumps([body.query]),
            data_mode="demo_sync",
        )
        db.add(paper)
        papers.append(paper)

    db.commit()
    for p in papers:
        db.refresh(p)

    return CorpusSyncResponse(
        synced_count=len(papers),
        papers=[_paper_out(p) for p in papers],
    )
