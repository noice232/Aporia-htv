from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.parallax import Claim, ClaimEvidence, Dispute


def register_claim(
    db: Session,
    project_id: str,
    text: str,
    claim_type: str,
    confidence: float = 0.5,
    source_node_id: str | None = None,
) -> dict[str, Any]:
    claim = Claim(
        project_id=project_id,
        text=text,
        claim_type=claim_type,
        confidence=confidence,
        source_node_id=source_node_id,
    )
    db.add(claim)
    db.flush()
    return _claim_dict(db, claim)


def add_evidence(
    db: Session,
    claim_id: str,
    evidence_type: str,
    description: str,
    run_id: str | None = None,
    strength: float = 0.5,
    data_mode: str = "measured",
) -> dict[str, Any]:
    ev = ClaimEvidence(
        claim_id=claim_id,
        evidence_type=evidence_type,
        description=description,
        run_id=run_id,
        strength=strength,
        data_mode=data_mode,
    )
    db.add(ev)
    db.flush()
    return _evidence_dict(ev)


def open_dispute(
    db: Session,
    project_id: str,
    claim_a_id: str,
    claim_b_id: str,
) -> dict[str, Any]:
    if claim_a_id == claim_b_id:
        raise ValueError("Cannot dispute a claim with itself")

    a = db.query(Claim).filter(Claim.id == claim_a_id).first()
    b = db.query(Claim).filter(Claim.id == claim_b_id).first()
    if not a or not b:
        raise ValueError("One or both claims not found")

    a.status = "disputed"
    b.status = "disputed"

    dispute = Dispute(
        project_id=project_id,
        claim_a_id=claim_a_id,
        claim_b_id=claim_b_id,
    )
    db.add(dispute)
    db.flush()
    return _dispute_dict(dispute)


def propose_discriminating_experiment(
    db: Session,
    dispute_id: str,
) -> dict[str, Any]:
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise ValueError("Dispute not found")

    a = db.query(Claim).filter(Claim.id == dispute.claim_a_id).first()
    b = db.query(Claim).filter(Claim.id == dispute.claim_b_id).first()

    proposal = {
        "experiment": f"Design experiment to discriminate between claims",
        "claim_a": a.text if a else "",
        "claim_b": b.text if b else "",
        "proposed_metric": "outcome_metric",
        "success_criterion": "If metric > threshold, claim A is supported; otherwise claim B",
    }

    dispute.discriminating_experiment_json = json.dumps(proposal)
    dispute.status = "investigating"
    db.flush()
    return _dispute_dict(dispute)


def resolve_dispute(
    db: Session,
    dispute_id: str,
    resolution: str,
) -> dict[str, Any]:
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise ValueError("Dispute not found")

    ev_a = db.query(ClaimEvidence).filter(ClaimEvidence.claim_id == dispute.claim_a_id).count()
    ev_b = db.query(ClaimEvidence).filter(ClaimEvidence.claim_id == dispute.claim_b_id).count()
    if ev_a == 0 or ev_b == 0:
        raise ValueError("Both claims require evidence before resolution")

    dispute.resolution = resolution
    dispute.status = "resolved"
    dispute.resolved_at = datetime.now(timezone.utc)
    db.flush()

    if resolution == "a_wins":
        a = db.query(Claim).filter(Claim.id == dispute.claim_a_id).first()
        b = db.query(Claim).filter(Claim.id == dispute.claim_b_id).first()
        if a:
            a.status = "supported"
        if b:
            b.status = "refuted"
    elif resolution == "b_wins":
        a = db.query(Claim).filter(Claim.id == dispute.claim_a_id).first()
        b = db.query(Claim).filter(Claim.id == dispute.claim_b_id).first()
        if a:
            a.status = "refuted"
        if b:
            b.status = "supported"
    elif resolution == "both_wrong":
        for cid in (dispute.claim_a_id, dispute.claim_b_id):
            c = db.query(Claim).filter(Claim.id == cid).first()
            if c:
                c.status = "refuted"

    db.flush()
    return _dispute_dict(dispute)


def _claim_dict(db: Session, claim: Claim) -> dict[str, Any]:
    evidence = db.query(ClaimEvidence).filter(ClaimEvidence.claim_id == claim.id).all()
    return {
        "id": claim.id,
        "project_id": claim.project_id,
        "text": claim.text,
        "claim_type": claim.claim_type,
        "status": claim.status,
        "confidence": claim.confidence,
        "source_node_id": claim.source_node_id,
        "created_at": claim.created_at,
        "evidence": [_evidence_dict(e) for e in evidence],
    }


def _evidence_dict(ev: ClaimEvidence) -> dict[str, Any]:
    return {
        "id": ev.id,
        "claim_id": ev.claim_id,
        "evidence_type": ev.evidence_type,
        "run_id": ev.run_id,
        "description": ev.description,
        "strength": ev.strength,
        "data_mode": ev.data_mode,
        "created_at": ev.created_at,
    }


def _dispute_dict(dispute: Dispute) -> dict[str, Any]:
    return {
        "id": dispute.id,
        "project_id": dispute.project_id,
        "claim_a_id": dispute.claim_a_id,
        "claim_b_id": dispute.claim_b_id,
        "status": dispute.status,
        "resolution": dispute.resolution,
        "discriminating_experiment_json": dispute.discriminating_experiment_json,
        "created_at": dispute.created_at,
        "resolved_at": dispute.resolved_at,
    }
