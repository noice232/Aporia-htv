from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db
from app.routers.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="APORIA", version="1.0.0", lifespan=lifespan)
app.include_router(health_router)
