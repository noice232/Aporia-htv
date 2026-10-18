from __future__ import annotations

import os

from fastapi import APIRouter

from app.config import settings
from app.schemas.integrations import IntegrationStatus, ProviderStatus

router = APIRouter(prefix="/api/v1", tags=["integrations"])


@router.get("/integrations/status", response_model=IntegrationStatus)
def integration_status():
    providers = []

    # Gemini
    if settings.gemini_api_key:
        providers.append(
            ProviderStatus(name="gemini", status="configured", detail="API key set")
        )
    else:
        providers.append(
            ProviderStatus(
                name="gemini", status="unconfigured", detail="GEMINI_API_KEY not set"
            )
        )

    # Papiers
    papiers_key = os.environ.get("APORIA_PAPIERS_ACCESS_KEY")
    if papiers_key:
        providers.append(
            ProviderStatus(
                name="papiers", status="configured", detail="Access key set"
            )
        )
    else:
        providers.append(
            ProviderStatus(
                name="papiers",
                status="unconfigured",
                detail="APORIA_PAPIERS_ACCESS_KEY not set",
            )
        )

    # Tiger
    providers.append(
        ProviderStatus(
            name="tiger", status="unconfigured", detail="Not yet integrated"
        )
    )

    return IntegrationStatus(providers=providers)
