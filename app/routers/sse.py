from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project, ResearchEvent

router = APIRouter(prefix="/api/v1", tags=["sse"])


def _event_generator(db: Session, project_id: str):
    rows = (
        db.query(ResearchEvent)
        .filter(ResearchEvent.project_id == project_id)
        .order_by(ResearchEvent.sequence)
        .all()
    )
    for evt in rows:
        data = {
            "id": evt.id,
            "sequence": evt.sequence,
            "type": evt.type,
            "entity_id": evt.entity_id,
            "payload": json.loads(evt.payload_json) if evt.payload_json else None,
            "data_mode": evt.data_mode,
            "occurred_at": evt.occurred_at.isoformat(),
        }
        yield f"data: {json.dumps(data)}\n\n"


@router.get("/projects/{project_id}/stream")
def stream_events(project_id: str, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return StreamingResponse(
        _event_generator(db, project_id),
        media_type="text/event-stream",
    )
