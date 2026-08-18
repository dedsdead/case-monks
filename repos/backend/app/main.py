"""FastAPI application for CaseTecnico - Avaliação de Liderados."""

import logging
import os
from contextlib import asynccontextmanager

from alembic.config import Config
from alembic import command
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal
from app.routers import employees, evaluations, health
from app.services.seed import seed_database

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: setup database manually, then seed database."""
    os.makedirs("data", exist_ok=True)
    try:
        # Import and run manual database setup
        from manual_setup import setup_database
        setup_database()
        logger.info("Database setup completed successfully")
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise

    session = SessionLocal()
    try:
        seed_database(session)
        logger.info("Database seeding completed successfully")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        session.close()

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
