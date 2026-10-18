from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CreateMetaTrial(BaseModel):
    strategy_a_id: str
    strategy_b_id: str
    common_conditions_json: str | None = None


class RollbackRequest(BaseModel):
    strategy_version: int


class MetaTrialOut(BaseModel):
    id: str
    workspace_id: str
    strategy_a_id: str
    strategy_b_id: str
    common_conditions_json: str | None
    status: str
    result_json: str | None
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}
