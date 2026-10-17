from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db
import app.models  # noqa: F401 — register ORM models so init_db creates tables
from app.routers.health import router as health_router
from app.routers.projects import router as projects_router
from app.routers.policy import router as policy_router
from app.routers.profile import router as profile_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="APORIA", version="1.0.0", lifespan=lifespan)
app.include_router(health_router)
app.include_router(projects_router)
app.include_router(policy_router)
app.include_router(profile_router)
