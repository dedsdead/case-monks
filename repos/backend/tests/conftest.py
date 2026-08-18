"""Pytest configuration for backend tests."""

import pytest


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    """Ensure clean environment for each test using monkeypatch."""
    # Remove test-specific env vars so Settings uses defaults
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("API_HOST", raising=False)
    monkeypatch.delenv("API_PORT", raising=False)
    monkeypatch.delenv("DEBUG", raising=False)
