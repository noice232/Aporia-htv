from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import settings
from app.schemas.health import HealthStatus, ProviderHealth

router = APIRouter(prefix="/api/v1", tags=["health"])


def _scoring_provider() -> ProviderHealth:
    if settings.scoring_mode == "gemini" and settings.gemini_api_key:
        from app.policy.scoring import _get_gemini_client
        client = _get_gemini_client()
        if client:
            try:
                health = client.check_health()
                return ProviderHealth(**health)
            except Exception:
                pass
        return ProviderHealth(
            provider="gemini",
            connected=False,
            mode="live",
            model_id=settings.gemini_model_id,
            checked_at=datetime.now(timezone.utc).isoformat(),
            last_error="client not initialized",
        )
    return ProviderHealth(
        provider="scoring",
        connected=True,
        mode="stub",
        model_id=None,
        checked_at=datetime.now(timezone.utc).isoformat(),
        last_error=None,
    )


@router.get("/health", response_model=HealthStatus)
def get_health() -> HealthStatus:
    return HealthStatus(
        status="ok",
        api_version=settings.api_version,
        providers=[_scoring_provider()],
        database_mode="sqlite",
        last_event_sequence=None,
    )
