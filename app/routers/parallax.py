from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.parallax import Claim, ClaimEvidence, Dispute
from app.parallax import (
    add_evidence,
    open_dispute,
    propose_discriminating_experiment,
    register_claim,
    resolve_dispute,
)
from app.schemas.parallax import (
    ClaimOut,
    CreateClaim,
    CreateDispute,
    CreateEvidence,
    DisputeOut,
    EvidenceOut,
    ResolveDispute,
)

router = APIRouter(prefix="/api/v1/projects/{project_id}", tags=["parallax"])


@router.post("/claims", response_model=ClaimOut, status_code=201)
def create_claim(project_id: str, body: CreateClaim, db: Session = Depends(get_db)):
    result = register_claim(
        db,
        project_id=project_id,
        text=body.text,
        claim_type=body.claim_type,
        confidence=body.confidence,
        source_node_id=body.source_node_id,
    )
    db.commit()
    return result


@router.get("/claims", response_model=list[ClaimOut])
def list_claims(project_id: str, status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Claim).filter(Claim.project_id == project_id)
    if status:
        q = q.filter(Claim.status == status)
    claims = q.order_by(Claim.created_at.desc()).all()
    results = []
    for c in claims:
        evidence = db.query(ClaimEvidence).filter(ClaimEvidence.claim_id == c.id).all()
        results.append(ClaimOut(
            id=c.id,
            project_id=c.project_id,
            text=c.text,
            claim_type=c.claim_type,
            status=c.status,
            confidence=c.confidence,
            source_node_id=c.source_node_id,
            created_at=c.created_at,
            evidence=[EvidenceOut.model_validate(e) for e in evidence],
        ))
    return results


@router.get("/claims/{claim_id}", response_model=ClaimOut)
def get_claim(project_id: str, claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id, Claim.project_id == project_id).first()
    if not claim:
        raise HTTPException(404, "Claim not found")
    evidence = db.query(ClaimEvidence).filter(ClaimEvidence.claim_id == claim.id).all()
    return ClaimOut(
        id=claim.id,
        project_id=claim.project_id,
        text=claim.text,
        claim_type=claim.claim_type,
        status=claim.status,
        confidence=claim.confidence,
        source_node_id=claim.source_node_id,
        created_at=claim.created_at,
        evidence=[EvidenceOut.model_validate(e) for e in evidence],
    )


@router.post("/claims/{claim_id}/evidence", response_model=EvidenceOut, status_code=201)
def create_evidence(project_id: str, claim_id: str, body: CreateEvidence, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id, Claim.project_id == project_id).first()
    if not claim:
        raise HTTPException(404, "Claim not found")
    result = add_evidence(
        db,
        claim_id=claim_id,
        evidence_type=body.evidence_type,
        description=body.description,
        run_id=body.run_id,
        strength=body.strength,
        data_mode=body.data_mode,
    )
    db.commit()
    return result


@router.post("/disputes", response_model=DisputeOut, status_code=201)
def create_dispute(project_id: str, body: CreateDispute, db: Session = Depends(get_db)):
    try:
        result = open_dispute(db, project_id, body.claim_a_id, body.claim_b_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result


@router.get("/disputes", response_model=list[DisputeOut])
def list_disputes(project_id: str, status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Dispute).filter(Dispute.project_id == project_id)
    if status:
        q = q.filter(Dispute.status == status)
    return q.order_by(Dispute.created_at.desc()).all()


@router.get("/disputes/{dispute_id}", response_model=DisputeOut)
def get_dispute(project_id: str, dispute_id: str, db: Session = Depends(get_db)):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id, Dispute.project_id == project_id).first()
    if not dispute:
        raise HTTPException(404, "Dispute not found")
    return dispute


@router.post("/disputes/{dispute_id}/propose-experiment", response_model=DisputeOut)
def propose_experiment(project_id: str, dispute_id: str, db: Session = Depends(get_db)):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id, Dispute.project_id == project_id).first()
    if not dispute:
        raise HTTPException(404, "Dispute not found")
    try:
        result = propose_discriminating_experiment(db, dispute.id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result


@router.post("/disputes/{dispute_id}/resolve", response_model=DisputeOut)
def resolve(project_id: str, dispute_id: str, body: ResolveDispute, db: Session = Depends(get_db)):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id, Dispute.project_id == project_id).first()
    if not dispute:
        raise HTTPException(404, "Dispute not found")
    try:
        result = resolve_dispute(db, dispute.id, body.resolution)
    except ValueError as e:
        raise HTTPException(400, str(e))
    db.commit()
    return result
