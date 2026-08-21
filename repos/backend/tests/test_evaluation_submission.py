"""Tests for evaluation submission endpoint."""

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


class TestEvaluationSubmission:
    def test_submit_evaluation_returns_complete_response(self, client):
        """Test that submitting an evaluation returns a complete response with questions."""
        response = client.post(
            "/api/evaluations/",
            json={
                "employee_id": 2,
                "scores": [
                    {"question_id": i, "score": 3} for i in range(1, 7)
                ]
            }
        )
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert "employee_id" in data
        assert "evaluator_id" in data
        assert "total_score" in data
        assert "evaluation_date" in data
        assert "evaluation_year" in data
        assert "week_number" in data
        assert "questions" in data
        assert isinstance(data["questions"], list)
        assert len(data["questions"]) == 6

        # Verify each question has required fields
        for question in data["questions"]:
            assert "question_id" in question
            assert "title" in question
            assert "weight" in question
            assert "score" in question
