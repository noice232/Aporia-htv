"""Private Papiers reads require a separate server-configured research key.

This temporary single-user gate prevents unauthenticated access to someone's
private paper annotations while APORIA lacks user authentication.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException

from app.papiers import PapiersAdapter, PapiersInvalidResponse, PapiersUnavailable
from app.schemas.papiers import PapiersReadIn, PapiersResultOut, PapiersSearchIn, PapiersStatusOut

router = APIRouter(prefix="/api/v1/papiers", tags=["papiers"])


def get_adapter() -> PapiersAdapter:
    return PapiersAdapter.from_environment()


def require_research_key(x_aporia_research_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("APORIA_PAPIERS_ACCESS_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="Private Papiers access is not configured")
    if not x_aporia_research_key or not secrets.compare_digest(expected, x_aporia_research_key):
        raise HTTPException(status_code=403, detail="Private Papiers access denied")


def _result(payload: object) -> PapiersResultOut:
    return PapiersResultOut(retrieved_at=datetime.now(timezone.utc), result=payload)


def _raise_unavailable(exc: Exception) -> None:
    raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/status", response_model=PapiersStatusOut)
def status(adapter: PapiersAdapter = Depends(get_adapter)) -> PapiersStatusOut:
    return PapiersStatusOut(**vars(adapter.status()))


@router.post("/search", response_model=PapiersResultOut, dependencies=[Depends(require_research_key)])
def search(body: PapiersSearchIn, adapter: PapiersAdapter = Depends(get_adapter)) -> PapiersResultOut:
    try:
        return _result(adapter.search(body.query, body.limit))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except (PapiersUnavailable, PapiersInvalidResponse) as exc:
        _raise_unavailable(exc)


@router.post("/read", response_model=PapiersResultOut, dependencies=[Depends(require_research_key)])
def read(body: PapiersReadIn, adapter: PapiersAdapter = Depends(get_adapter)) -> PapiersResultOut:
    try:
        return _result(adapter.read(body.source_id))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except (PapiersUnavailable, PapiersInvalidResponse) as exc:
        _raise_unavailable(exc)
