from __future__ import annotations

from pydantic import BaseModel


class ProviderStatus(BaseModel):
    name: str
    status: str
    detail: str


class IntegrationStatus(BaseModel):
    providers: list[ProviderStatus]
