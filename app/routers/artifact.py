from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.artifact import ArtifactBlob, ExperimentSpec
from app.schemas.artifact import (
    ArtifactOut,
    CreateArtifact,
    CreateExperimentSpec,
    ExperimentSpecOut,
)

router = APIRouter(prefix="/api/v1", tags=["artifacts"])


@router.post("/projects/{project_id}/artifacts", response_model=ArtifactOut, status_code=201)
def create_artifact(project_id: str, body: CreateArtifact, db: Session = Depends(get_db)):
    raw = (body.content_json or "").encode()
    content_hash = hashlib.sha256(raw).hexdigest()

    blob = ArtifactBlob(
        project_id=project_id,
        run_id=body.run_id,
        kind=body.kind,
        label=body.label,
        content_hash=content_hash,
        content_json=body.content_json,
        size_bytes=len(raw),
        mime_type=body.mime_type,
        data_mode=body.data_mode,
    )
    db.add(blob)
    db.commit()
    return blob


@router.get("/projects/{project_id}/artifacts", response_model=list[ArtifactOut])
def list_artifacts(project_id: str, db: Session = Depends(get_db)):
    return db.query(ArtifactBlob).filter(ArtifactBlob.project_id == project_id).all()


@router.get("/projects/{project_id}/artifacts/{artifact_id}", response_model=ArtifactOut)
def get_artifact(project_id: str, artifact_id: str, db: Session = Depends(get_db)):
    blob = db.query(ArtifactBlob).filter(
        ArtifactBlob.id == artifact_id,
        ArtifactBlob.project_id == project_id,
    ).first()
    if not blob:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return blob


@router.get("/projects/{project_id}/runs/{run_id}/artifacts", response_model=list[ArtifactOut])
def list_run_artifacts(project_id: str, run_id: str, db: Session = Depends(get_db)):
    return db.query(ArtifactBlob).filter(
        ArtifactBlob.project_id == project_id,
        ArtifactBlob.run_id == run_id,
    ).all()


@router.post("/projects/{project_id}/experiment-specs", response_model=ExperimentSpecOut, status_code=201)
def create_spec(project_id: str, body: CreateExperimentSpec, db: Session = Depends(get_db)):
    spec = ExperimentSpec(
        project_id=project_id,
        plan_id=body.plan_id,
        hypothesis_id=body.hypothesis_id,
        evaluator_version=body.evaluator_version,
        parameters_json=body.parameters_json,
        dataset_hash=body.dataset_hash,
        code_hash=body.code_hash,
    )
    db.add(spec)
    db.commit()
    return spec


@router.get("/projects/{project_id}/experiment-specs", response_model=list[ExperimentSpecOut])
def list_specs(project_id: str, db: Session = Depends(get_db)):
    return db.query(ExperimentSpec).filter(ExperimentSpec.project_id == project_id).all()
