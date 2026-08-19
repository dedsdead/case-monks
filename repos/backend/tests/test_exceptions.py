"""Tests for custom exceptions."""

import pytest

from app.exceptions import (
    EmployeeNotFound,
    HierarchyViolation,
    SelfEvaluationBlocked,
    WeeklyLimitExceeded,
)


class TestWeeklyLimitExceeded:
    def test_has_status_409(self):
        exc = WeeklyLimitExceeded(existing_evaluation_id=1)
        assert exc.status_code == 409

    def test_detail_contains_existing_id(self):
        exc = WeeklyLimitExceeded(existing_evaluation_id=42)
        assert exc.detail["existing_evaluation_id"] == 42


class TestHierarchyViolation:
    def test_has_status_403(self):
        exc = HierarchyViolation()
        assert exc.status_code == 403


class TestSelfEvaluationBlocked:
    def test_has_status_403(self):
        exc = SelfEvaluationBlocked()
        assert exc.status_code == 403


class TestEmployeeNotFound:
    def test_has_status_404(self):
        exc = EmployeeNotFound()
        assert exc.status_code == 404
