import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from config import settings
from database import ping, create_indexes
from routes import projects, communications, tasks, decisions, search

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("projectpulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await ping()
        await create_indexes()
        logger.info("Connected to MongoDB and ensured indexes.")
    except PyMongoError as e:
        logger.error("Could not connect to MongoDB at startup: %s", e)
    yield


app = FastAPI(title="ProjectPulse AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(PyMongoError)
async def mongo_error_handler(request: Request, exc: PyMongoError):
    logger.error("MongoDB error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is currently unavailable. Please try again shortly."},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}


app.include_router(projects.router)
app.include_router(communications.router)
app.include_router(tasks.router)
app.include_router(decisions.router)
app.include_router(search.router)
