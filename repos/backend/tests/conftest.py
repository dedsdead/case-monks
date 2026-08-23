"""Pytest configuration for backend tests."""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Ensure clean environment for each test using monkeypatch."""
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("API_HOST", raising=False)
    monkeypatch.delenv("API_PORT", raising=False)
    monkeypatch.delenv("DEBUG", raising=False)


@pytest.fixture(autouse=True)
def reset_rate_limiters():
    """Reset in-memory rate limiter state before each test."""
    from app.rate_limit import reset_all_limiters
    reset_all_limiters()
    yield


@pytest.fixture
def db_session():
    """Create an in-memory SQLite session for testing.

    Uses StaticPool so all threads (TestClient portal included) share
    the same connection — required for :memory: databases.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Reset module-level hierarchy cache so tests never see stale data
    from app.services.hierarchy import clear_cache
    clear_cache()

    try:
        yield session
    finally:
        clear_cache()
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
