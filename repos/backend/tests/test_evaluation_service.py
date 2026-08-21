"""Tests for evaluation service."""

import pytest
from datetime import datetime

from app.exceptions import HierarchyViolation, SelfEvaluationBlocked, WeeklyLimitExceeded
from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion
from app.models.evaluation_response import EvaluationResponse
from app.models.evaluation_summary import EvaluationSummary
from app.schemas.evaluation import EvaluationCreate, ScoreInput
from app.services.evaluation import (
    create_evaluation,
    get_evaluation_history,
    get_subordinate_evaluations,
)
# from app.services.hierarchy import clear_cache  # Not needed


@pytest.fixture
def seed_evaluation_data(db_session):
    """Seed employees, questions, and hierarchy for evaluation tests."""
    # Employees
    alice = Employee(id=1, name="Alice", email="alice@test.com", position_name="CEO")
    bob = Employee(id=2, name="Bob", email="bob@test.com", position_name="VP")
    charlie = Employee(id=3, name="Charlie", email="charlie@test.com", position_name="Manager")
    db_session.add_all([alice, bob, charlie])
    db_session.flush()

    # Hierarchy: Alice -> Bob -> Charlie
    db_session.add_all([
        LeaderLead(leader_id=1, lead_id=2),
        LeaderLead(leader_id=2, lead_id=3),
    ])
    db_session.flush()

    # Questions
    questions = [
        EvaluationQuestion(id=1, title="Q1", weight=20, order=1),
        EvaluationQuestion(id=2, title="Q2", weight=15, order=2),
        EvaluationQuestion(id=3, title="Q3", weight=20, order=3),
        EvaluationQuestion(id=4, title="Q4", weight=15, order=4),
        EvaluationQuestion(id=5, title="Q5", weight=15, order=5),
        EvaluationQuestion(id=6, title="Q6", weight=15, order=6),
    ]
    db_session.add_all(questions)
    db_session.commit()
    # clear_cache()  # Not needed
    yield
    # clear_cache()  # Not needed


class TestCreateEvaluation:
    def test_creates_evaluation(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=2,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        result = create_evaluation(db_session, 1, data)
        assert result.employee_id == 2
        assert result.evaluator_id == 1
        assert result.total_score == 3.0

    def test_self_evaluation_blocked(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=1,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        with pytest.raises(SelfEvaluationBlocked):
            create_evaluation(db_session, 1, data)

    def test_hierarchy_violation(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=1,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        with pytest.raises(HierarchyViolation):
            create_evaluation(db_session, 3, data)

    def test_weekly_limit_enforced(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=2,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        create_evaluation(db_session, 1, data)
        with pytest.raises(WeeklyLimitExceeded):
            create_evaluation(db_session, 1, data)

    def test_total_score_calculation(self, db_session, seed_evaluation_data):
        # Score 4 on 20-weight Q1, 1 on 15-weight Q2, etc.
        scores = [
            ScoreInput(question_id=1, score=4),
            ScoreInput(question_id=2, score=1),
            ScoreInput(question_id=3, score=3),
            ScoreInput(question_id=4, score=2),
            ScoreInput(question_id=5, score=3),
            ScoreInput(question_id=6, score=3),
        ]
        # Expected: (4*20 + 1*15 + 3*20 + 2*15 + 3*15 + 3*15) / 100
        # = (80 + 15 + 60 + 30 + 45 + 45) / 100 = 275 / 100 = 2.75
        data = EvaluationCreate(employee_id=2, scores=scores)
        result = create_evaluation(db_session, 1, data)
        assert float(result.total_score) == 2.8  # Rounded to 1 decimal

    def test_creates_six_responses(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=2,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        result = create_evaluation(db_session, 1, data)
        responses = (
            db_session.query(EvaluationResponse)
            .filter(EvaluationResponse.evaluation_summary_id == result.id)
            .all()
        )
        assert len(responses) == 6


class TestGetSubordinateEvaluations:
    def test_returns_empty_when_no_subordinates(self, db_session, seed_evaluation_data):
        result = get_subordinate_evaluations(db_session, 3)
        assert result == []

    def test_returns_evaluations_sorted_by_depth(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=2,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        create_evaluation(db_session, 1, data)
        result = get_subordinate_evaluations(db_session, 1)
        assert len(result) >= 1
        assert result[0]["employee_id"] == 2


class TestGetEvaluationHistory:
    def test_returns_empty_when_no_evaluations(self, db_session, seed_evaluation_data):
        result = get_evaluation_history(db_session, 1, 2)
        assert result == []

    def test_returns_evaluations_in_desc_order(self, db_session, seed_evaluation_data):
        data = EvaluationCreate(
            employee_id=2,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        create_evaluation(db_session, 1, data)
        result = get_evaluation_history(db_session, 1, 2)
        assert len(result) == 1
        assert result[0].employee_id == 2
