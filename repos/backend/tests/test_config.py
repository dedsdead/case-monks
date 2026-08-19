"""Tests for app.config module."""

import os
import pytest
import importlib
from unittest.mock import patch


class TestSettings:
    """Tests for Settings class."""

    def test_settings_loads_with_defaults(self):
        """Settings should load with default values when no env vars set."""
        with patch.dict(os.environ, {}, clear=True):
            import app.config
            importlib.reload(app.config)
            settings = app.config.Settings()

            assert settings.DATABASE_URL == "sqlite:///./data/casetecnico.db"
            assert settings.API_HOST == "0.0.0.0"
            assert settings.API_PORT == 8000
            assert settings.DEBUG is False

    def test_settings_loads_from_env(self):
        """Settings should load from environment variables."""
        env_vars = {
            "DATABASE_URL": "sqlite:///./test.db",
            "API_HOST": "127.0.0.1",
            "API_PORT": "9000",
            "DEBUG": "true",
        }
        with patch.dict(os.environ, env_vars, clear=True):
            import app.config
            importlib.reload(app.config)
            settings = app.config.Settings()

            assert settings.DATABASE_URL == "sqlite:///./test.db"
            assert settings.API_HOST == "127.0.0.1"
            assert settings.API_PORT == 9000
            assert settings.DEBUG is True

    def test_cors_origins_contains_localhost(self):
        """CORS origins should contain localhost URLs."""
        with patch.dict(os.environ, {}, clear=True):
            import app.config
            importlib.reload(app.config)
            settings = app.config.Settings()

            assert "http://localhost:3000" in settings.CORS_ORIGINS
            assert "http://localhost:5173" in settings.CORS_ORIGINS

    def test_settings_values_match(self):
        """Settings instances should have matching default values."""
        with patch.dict(os.environ, {}, clear=True):
            import app.config
            importlib.reload(app.config)
            settings1 = app.config.Settings()
            settings2 = app.config.Settings()

            assert settings1.DATABASE_URL == settings2.DATABASE_URL
            assert settings1.API_HOST == settings2.API_HOST
            assert settings1.API_PORT == settings2.API_PORT
            assert settings1.DEBUG == settings2.DEBUG
