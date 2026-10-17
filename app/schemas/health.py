from pydantic import BaseModel


class ProviderHealth(BaseModel):
    provider: str
    connected: bool
    mode: str
    model_id: str | None = None
    checked_at: str
    last_error: str | None = None


class HealthStatus(BaseModel):
    status: str
    api_version: str
    providers: list[ProviderHealth]
    database_mode: str
    last_event_sequence: int | None = None


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: list | None = None
    correlation_id: str | None = None
