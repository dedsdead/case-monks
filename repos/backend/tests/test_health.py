"""Tests for the health router."""

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthCheck:
    """Tests for GET /api/health."""

    def test_health_check_returns_ok(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestCookiesDebugEndpoint:
    """Tests for GET /api/test-cookies."""

    def test_returns_cookies_when_debug_enabled(self, client):
        settings.DEBUG = True
        try:
            response = client.get(
                "/api/test-cookies", cookies={"employee_id": "1"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["cookies"]["employee_id"] == "1"
        finally:
            settings.DEBUG = False

    def test_returns_404_when_debug_disabled(self, client):
        settings.DEBUG = False
        response = client.get(
            "/api/test-cookies", cookies={"employee_id": "1"}
        )
        assert response.status_code == 404
