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
from app.routers.artifact import router as artifact_router
from app.routers.plan import router as plan_router
from app.routers.parallax import router as parallax_router
from app.routers.skill import router as skill_router
from app.routers.portfolio import router as portfolio_router
from app.routers.court import router as court_router
from app.routers.runs import router as runs_router
from app.routers.research_control import router as research_control_router
from app.routers.workspace import router as workspace_router
from app.routers.papers import router as papers_router
from app.routers.corpus import router as corpus_router
from app.routers.sources import router as sources_router


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
app.include_router(artifact_router)
app.include_router(plan_router)
app.include_router(parallax_router)
app.include_router(skill_router)
app.include_router(portfolio_router)
app.include_router(court_router)
app.include_router(runs_router)
app.include_router(research_control_router)
app.include_router(workspace_router)
app.include_router(papers_router)
app.include_router(corpus_router)
app.include_router(sources_router)
