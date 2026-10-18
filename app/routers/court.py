from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.frontier import FrontierNode
from app.models.parallax import Claim, Dispute
from app.parallax import open_dispute, propose_discriminating_experiment, resolve_dispute
from app.schemas.court import (
    DisagreementOut,
    InvalidateRequest,
    InvalidateResult,
    OpenDisputeRequest,
    TestDisagreementRequest,
)

router = APIRouter(prefix="/api/v1/projects/{project_id}", tags=["court"])


def _dispute_to_disagreement(d: Dispute) -> DisagreementOut:
    return DisagreementOut(
        id=d.id,
        claim_ids=[d.claim_a_id, d.claim_b_id],
        status=d.status,
        discriminating_experiment_json=d.discriminating_experiment_json,
        resolution=d.resolution,
        notes=None,
        created_at=d.created_at,
    )


@router.get("/court", response_model=list[DisagreementOut])
def list_court(project_id: str, db: Session = Depends(get_db)):
    disputes = (
        db.query(Dispute)
        .filter(Dispute.project_id == project_id)
        .order_by(Dispute.created_at.desc())
        .all()
    )
    return [_dispute_to_disagreement(d) for d in disputes]


@router.post("/court", response_model=DisagreementOut, status_code=201)
def open_court_dispute(project_id: str, body: OpenDisputeRequest, db: Session = Depends(get_db)):
    if len(body.claim_ids) != 2:
        raise HTTPException(400, "Exactly 2 claim_ids required")
    try:
        result = open_dispute(db, project_id, body.claim_ids[0], body.claim_ids[1])
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    dispute = db.query(Dispute).filter(Dispute.id == result["id"]).first()
    return _dispute_to_disagreement(dispute)


@router.post("/court/{disagreement_id}/test", response_model=DisagreementOut)
def test_disagreement(
    project_id: str,
    disagreement_id: str,
    body: TestDisagreementRequest,
    db: Session = Depends(get_db),
):
    dispute = db.query(Dispute).filter(
        Dispute.id == disagreement_id,
        Dispute.project_id == project_id,
    ).first()
    if not dispute:
        raise HTTPException(404, "Disagreement not found")

    if not dispute.discriminating_experiment_json:
        try:
            propose_discriminating_experiment(db, dispute.id)
        except ValueError as e:
            raise HTTPException(400, str(e))
    else:
        if body.approved is not None:
            dispute.status = "approved" if body.approved else "rejected"

    db.commit()
    dispute = db.query(Dispute).filter(Dispute.id == disagreement_id).first()
    return _dispute_to_disagreement(dispute)


@router.post("/claims/{claim_id}/invalidate", response_model=InvalidateResult)
def invalidate_claim(
    project_id: str,
    claim_id: str,
    body: InvalidateRequest,
    db: Session = Depends(get_db),
):
    claim = db.query(Claim).filter(
        Claim.id == claim_id,
        Claim.project_id == project_id,
    ).first()
    if not claim:
        raise HTTPException(404, "Claim not found")

    claim.status = "needs_revalidation"

    affected = 0
    if claim.source_node_id:
        nodes = db.query(FrontierNode).filter(
            FrontierNode.id == claim.source_node_id,
        ).all()
        for node in nodes:
            node.status = "needs_revalidation"
            affected += 1

    db.commit()
    return InvalidateResult(
        claim_id=claim.id,
        status=claim.status,
        affected_frontier_nodes=affected,
    )
