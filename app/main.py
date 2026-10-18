from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db
import app.models  # noqa: F401 — register ORM models so init_db creates tables
from app.routers.health import router as health_router
from app.routers.projects import router as projects_router
from app.routers.policy import router as policy_router
from app.routers.profile import router as profile_router
from app.routers.fork import router as fork_router
from app.routers.research_session import router as research_session_router
from app.routers.papiers import router as papiers_router
from app.routers.frontier import router as frontier_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="APORIA", version="1.0.0", lifespan=lifespan)
app.include_router(health_router)
app.include_router(projects_router)
app.include_router(policy_router)
app.include_router(profile_router)
app.include_router(fork_router)
app.include_router(research_session_router)
app.include_router(papiers_router)
app.include_router(frontier_router)
