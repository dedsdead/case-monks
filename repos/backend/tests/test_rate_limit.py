"""Tests for the evaluation submission rate limiter."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_db, get_current_employee
from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion


@pytest.fixture
def seed_evaluation_data(db_session):
    """Seed leader (id=1), subordinate (id=2), hierarchy link, and 6 questions."""
    db_session.add_all([
        Employee(id=1, name="Alice Hartman", email="alice@test.com", position_name="CEO"),
        Employee(id=2, name="Bob Sinclair", email="bob@test.com", position_name="CTO"),
    ])
    db_session.flush()
    db_session.add(LeaderLead(leader_id=1, lead_id=2))
    weights = [25, 20, 20, 15, 10, 10]
    db_session.add_all([
        EvaluationQuestion(id=i, title=f"Question {i}", weight=w, order=i)
        for i, w in enumerate(weights, start=1)
    ])
    db_session.commit()


@pytest.fixture
def client(db_session, seed_evaluation_data):
    """Test client with database session and mocked authentication."""
    from app.models.employee import Employee as Emp

    def override_get_db():
        yield db_session

    def mock_get_current_employee():
        return Emp(id=1, name="Alice Hartman", email="alice@test.com", position_name="CEO")

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_employee] = mock_get_current_employee
    yield TestClient(app)
    app.dependency_overrides = {}


def _submit(client):
    return client.post(
        "/api/evaluations/",
        json={
            "employee_id": 2,
            "scores": [{"question_id": i, "score": 3} for i in range(1, 7)],
        },
    )


class TestRateLimiting:
    def test_requests_within_limit_succeed(self, client):
        """Submissions below the threshold are never rate limited."""
        statuses = [_submit(client).status_code for _ in range(10)]
        # First submission of the week succeeds; later ones hit the weekly
        # business rule — but never the rate limiter.
        assert statuses[0] == 201
        assert all(s == 409 for s in statuses[1:])

    def test_requests_beyond_limit_are_rejected(self, client):
        """Once over the threshold, requests return 429 with Retry-After."""
        statuses = [_submit(client).status_code for _ in range(12)]
        assert statuses[:10] == [201] + [409] * 9
        # Beyond the limit: rate limited before reaching business logic
        assert statuses[10] == 429
        assert statuses[11] == 429

        response = _submit(client)
        assert response.status_code == 429
        assert "retry-after" in {k.lower() for k in response.headers}
        assert "too many requests" in response.json()["detail"].lower()

    def test_rate_limit_is_per_identity(self, client):
        """Different identities have independent counters."""
        from app.rate_limit import RateLimiter

        limiter = RateLimiter(times=2, seconds=60)
        assert limiter.hit("emp-1")[0] is True
        assert limiter.hit("emp-1")[0] is True
        assert limiter.hit("emp-1")[0] is False
        # Different key unaffected
        assert limiter.hit("emp-2")[0] is True

    def test_limiter_reset_clears_counters(self, client):
        """reset() allows requests again after the counter was exhausted."""
        from app.rate_limit import RateLimiter, reset_all_limiters

        limiter = RateLimiter(times=1, seconds=60)
        assert limiter.hit("emp-1")[0] is True
        assert limiter.hit("emp-1")[0] is False

        reset_all_limiters()
        assert limiter.hit("emp-1")[0] is True
