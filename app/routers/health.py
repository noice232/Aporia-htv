from fastapi import APIRouter

from app.config import settings
from app.schemas.health import HealthStatus

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health", response_model=HealthStatus)
def get_health() -> HealthStatus:
    return HealthStatus(
        status="ok",
        api_version=settings.api_version,
        providers=[],
        database_mode="sqlite",
        last_event_sequence=None,
    )
