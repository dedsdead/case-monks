"""Integration tests for the subordinates endpoint with real evaluation data.

Reproduces the production 500: after submitting an evaluation, GET
/api/evaluations/subordinates/ crashed because EvaluationSummaryResponse
requires `questions`, which the bare EvaluationSummary ORM object does not
carry. These tests exercise the real service + serialization path (no mocks).
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_db, get_current_employee
from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion
from app.schemas.evaluation import EvaluationCreate
from app.services.evaluation import create_evaluation


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
    def override_get_db():
        yield db_session

    def mock_get_current_employee():
        return Employee(id=1, name="Alice Hartman", email="alice@test.com", position_name="CEO")

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_employee] = mock_get_current_employee
    yield TestClient(app)
    app.dependency_overrides = {}


SCORES = [{"question_id": i, "score": s} for i, s in
          zip(range(1, 7), [4, 3, 3, 4, 2, 3])]


class TestSubordinatesAfterEvaluation:
    def test_subordinates_returns_latest_evaluation_with_questions(self, client, db_session):
        """After a real submission, the subordinates list must return 200
        with latest_evaluation fully populated including questions."""
        created = create_evaluation(
            db_session, 1, EvaluationCreate(employee_id=2, scores=SCORES)
        )
        assert len(created.questions) == 6

        response = client.get("/api/evaluations/subordinates/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        row = data[0]
        assert row["employee_id"] == 2
        assert row["employee_name"] == "Bob Sinclair"
        assert row["latest_evaluation"] is not None

        latest = row["latest_evaluation"]
        assert latest["id"] == created.id
        assert latest["total_score"] == pytest.approx(3.3)
        assert len(latest["questions"]) == 6

        first = next(q for q in latest["questions"] if q["question_id"] == 1)
        assert first["title"] == "Question 1"
        assert first["weight"] == 25
        assert first["score"] == 4

    def test_subordinates_without_evaluation_has_null_latest(self, client):
        """Subordinate without evaluations still lists with null latest_evaluation."""
        response = client.get("/api/evaluations/subordinates/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["employee_id"] == 2
        assert data[0]["latest_evaluation"] is None

    def test_history_after_submission_returns_questions(self, client, db_session):
        """The per-employee history endpoint returns full question details
        after a real submission."""
        create_evaluation(
            db_session, 1, EvaluationCreate(employee_id=2, scores=SCORES)
        )

        response = client.get("/api/evaluations/employee/2/")

        assert response.status_code == 200
        history = response.json()
        assert len(history) == 1

        entry = history[0]
        assert entry["total_score"] == pytest.approx(3.3)
        assert len(entry["questions"]) == 6
        assert all(q["title"] and q["weight"] > 0 for q in entry["questions"])
