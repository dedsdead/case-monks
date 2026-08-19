"""Tests for Pydantic schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.employee import EmployeeResponse
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationSummaryResponse,
    QuestionResponse,
    QuestionScoreResponse,
    ScoreInput,
    SubordinateEvaluationResponse,
)


class TestScoreInput:
    def test_valid_score(self):
        s = ScoreInput(question_id=1, score=3)
        assert s.question_id == 1
        assert s.score == 3

    def test_invalid_question_id(self):
        with pytest.raises(ValidationError):
            ScoreInput(question_id=0, score=3)

    def test_invalid_score(self):
        with pytest.raises(ValidationError):
            ScoreInput(question_id=1, score=5)


class TestEvaluationCreate:
    def test_valid_creation(self):
        data = EvaluationCreate(
            employee_id=2,
            scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
        )
        assert len(data.scores) == 6

    def test_rejects_extra_fields(self):
        with pytest.raises(ValidationError):
            EvaluationCreate(
                employee_id=2,
                scores=[ScoreInput(question_id=i, score=3) for i in range(1, 7)],
                extra_field="bad",
            )

    def test_rejects_wrong_count(self):
        with pytest.raises(ValidationError):
            EvaluationCreate(
                employee_id=2,
                scores=[ScoreInput(question_id=i, score=3) for i in range(1, 5)],
            )

    def test_rejects_duplicate_question_ids(self):
        with pytest.raises(ValidationError):
            EvaluationCreate(
                employee_id=2,
                scores=[ScoreInput(question_id=1, score=3)] * 6,
            )


class TestQuestionScoreResponse:
    def test_from_attributes(self):
        from unittest.mock import MagicMock
        mock = MagicMock()
        mock.question_id = 1
        mock.title = "Test"
        mock.weight = 20
        mock.score = 3
        r = QuestionScoreResponse.model_validate(mock)
        assert r.question_id == 1


class TestEmployeeResponse:
    def test_from_attributes(self):
        from unittest.mock import MagicMock
        mock = MagicMock()
        mock.id = 1
        mock.name = "Alice"
        mock.email = "alice@test.com"
        mock.position_name = "CEO"
        r = EmployeeResponse.model_validate(mock)
        assert r.name == "Alice"
