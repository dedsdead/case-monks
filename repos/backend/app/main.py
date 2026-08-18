"""FastAPI application for CaseTecnico - Avaliação de Liderados."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal
from app.routers import employees, evaluations, health
from app.services.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: seed database on startup."""
    os.makedirs("data", exist_ok=True)
    seed_database(SessionLocal())
    yield


app = FastAPI(
    title="CaseTecnico - Avaliação de Liderados",
    description="API for leader evaluation platform",
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Cookie"],
)

app.include_router(health.router)
app.include_router(employees.router)
app.include_router(evaluations.router)
