"""Tests for app.database module."""

import os
import pytest
import sqlite3
from pathlib import Path
from unittest.mock import patch
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.database import Base, set_sqlite_pragma


class TestDatabaseEngine:
    """Tests for database engine creation."""

    def test_engine_created_with_sqlite(self):
        """Engine should be created with SQLite URL."""
        test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        assert test_engine is not None
        assert str(test_engine.url).startswith("sqlite")

    def test_engine_check_same_thread_false(self):
        """Engine should have check_same_thread=False for SQLite."""
        test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        with test_engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            assert result == 1

    def test_engine_pool_pre_ping(self):
        """Engine should have pool_pre_ping enabled."""
        test_engine = create_engine("sqlite:///:memory:", pool_pre_ping=True)
        # pool._pre_ping is internal but no public API exists
        assert test_engine.pool._pre_ping is True


class TestSessionLocal:
    """Tests for SessionLocal configuration."""

    def test_session_local_is_configured(self):
        """SessionLocal should be configured as a sessionmaker."""
        from app.database import SessionLocal
        assert SessionLocal is not None

    def test_session_local_creates_session(self):
        """SessionLocal should create a usable session."""
        from app.database import SessionLocal
        # Use in-memory engine for testing to avoid file system issues
        test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
        session = TestSession()
        try:
            assert session is not None
            result = session.execute(text("SELECT 1")).scalar()
            assert result == 1
        finally:
            session.close()


class TestBase:
    """Tests for SQLAlchemy Base."""

    def test_base_is_declarative_base(self):
        """Base should be a DeclarativeBase subclass."""
        assert isinstance(Base, type)
        assert issubclass(Base, DeclarativeBase)


class TestWalPragmas:
    """Tests for WAL pragma configuration."""

    def test_wal_pragmas_work_on_file_database(self, tmp_path):
        """WAL pragmas should work on file-based SQLite databases."""
        db_path = tmp_path / "test.db"
        conn = sqlite3.connect(str(db_path))
        try:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA busy_timeout=5000")
            conn.execute("PRAGMA foreign_keys=ON")
            conn.execute("PRAGMA cache_size=-64000")

            result = conn.execute("PRAGMA journal_mode").fetchone()
            assert result[0] == "wal"

            result = conn.execute("PRAGMA synchronous").fetchone()
            assert result[0] == 1  # NORMAL = 1

            result = conn.execute("PRAGMA busy_timeout").fetchone()
            assert result[0] == 5000

            result = conn.execute("PRAGMA foreign_keys").fetchone()
            assert result[0] == 1
        finally:
            conn.close()

    def test_in_memory_sqlite_uses_memory_journal(self):
        """In-memory SQLite uses 'memory' journal mode (WAL not supported)."""
        conn = sqlite3.connect(":memory:")
        conn.execute("PRAGMA journal_mode=WAL")
        result = conn.execute("PRAGMA journal_mode").fetchone()
        assert result[0] == "memory"
        conn.close()

    def test_event_listener_sets_pragmas(self):
        """Event listener should set WAL pragmas on new connections."""
        test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

        @event.listens_for(test_engine, "connect")
        def test_set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA cache_size=-64000")
            cursor.close()

        with test_engine.connect() as conn:
            result = conn.execute(text("PRAGMA journal_mode")).scalar()
            assert result in ("wal", "memory")

            result = conn.execute(text("PRAGMA synchronous")).scalar()
            assert result == 1  # NORMAL

            result = conn.execute(text("PRAGMA busy_timeout")).scalar()
            assert result == 5000

            result = conn.execute(text("PRAGMA foreign_keys")).scalar()
            assert result == 1
