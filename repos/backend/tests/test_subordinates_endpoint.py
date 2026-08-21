import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db

@pytest.fixture
def client(db_session):
    """Test client with database session and mocked authentication."""
    from app.dependencies import get_current_employee
    from app.models.employee import Employee
    
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    # Mock the authentication dependency
    def mock_get_current_employee():
        # Return a mock employee (Alice as CEO with id=1)
        return Employee(id=1, name="Alice Hartman", email="alice@test.com", position_name="CEO")
    
    app.dependency_overrides[get_current_employee] = mock_get_current_employee
    
    yield TestClient(app)
    app.dependency_overrides = {}


class TestSubordinatesEndpoint:
    
    def test_subordinates_endpoint_success(self, client):
        """Test subordinates endpoint with valid data."""
        with patch("app.routers.evaluations.get_subordinate_evaluations") as mock_get:
            mock_get.return_value = [
                {
                    "employee_id": 1,
                    "employee_name": "John Doe",
                    "position_name": "Developer",
                    "latest_evaluation": None,
                    "depth": 0,
                }
            ]
            
            response = client.get("/api/evaluations/subordinates/")
            assert response.status_code == 200
            assert len(response.json()) == 1

    def test_subordinates_endpoint_database_error(self, client):
        """Test subordinates endpoint with database error."""
        with patch("app.routers.evaluations.get_subordinate_evaluations") as mock_get:
            mock_get.side_effect = Exception("Database connection failed")

            response = client.get("/api/evaluations/subordinates/")
            assert response.status_code == 500
            assert "Error loading evaluations" in response.json()["detail"]

    def test_subordinates_endpoint_empty_result(self, client):
        """Test subordinates endpoint with no subordinates."""
        with patch("app.routers.evaluations.get_subordinate_evaluations") as mock_get:
            mock_get.return_value = []
            
            response = client.get("/api/evaluations/subordinates/")
            assert response.status_code == 200
            assert len(response.json()) == 0

    def test_evaluation_submission_session_cleanup(self, client):
        """Test that evaluation submission properly cleans up database session."""
        with patch("app.routers.evaluations.create_evaluation") as mock_create:
            with patch("app.routers.evaluations.get_subordinate_evaluations") as mock_get:

                mock_create.return_value = {
                    "id": 1,
                    "employee_id": 2,
                    "evaluator_id": 1,
                    "total_score": 3.5,
                    "evaluation_date": "2026-08-20T00:00:00",
                    "evaluation_year": 2026,
                    "week_number": 33,
                    "questions": [],
                }

                # Mock successful evaluation submission
                response = client.post("/api/evaluations/", json={
                    "employee_id": 2,
                    "scores": [
                        {"question_id": 1, "score": 3},
                        {"question_id": 2, "score": 4},
                        {"question_id": 3, "score": 3},
                        {"question_id": 4, "score": 4},
                        {"question_id": 5, "score": 3},
                        {"question_id": 6, "score": 4},
                    ]
                })

                assert response.status_code == 201

                # Now test subordinates endpoint - should not fail
                mock_get.return_value = [
                    {
                        "employee_id": 2,
                        "employee_name": "John Doe",
                        "position_name": "Developer",
                        "latest_evaluation": None,
                        "depth": 0,
                    }
                ]

                response = client.get("/api/evaluations/subordinates/")
                assert response.status_code == 200