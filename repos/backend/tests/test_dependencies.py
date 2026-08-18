"""Tests for FastAPI dependencies."""

import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch

from app.dependencies import get_db, get_employee_id_from_cookie, get_current_employee


class TestGetDb:
    def test_get_db_yields_session(self):
        gen = get_db()
        session = next(gen)
        assert session is not None
        try:
            pass
        finally:
            try:
                next(gen)
            except StopIteration:
                pass

    def test_get_db_closes_session(self):
        gen = get_db()
        session = next(gen)
        assert session.is_active
        try:
            next(gen)
        except StopIteration:
            pass


class TestGetEmployeeIdFromCookie:
    def test_returns_value_when_present(self):
        result = get_employee_id_from_cookie(employee_id="42")
        assert result == "42"

    def test_raises_401_when_missing(self):
        with pytest.raises(HTTPException) as exc_info:
            get_employee_id_from_cookie(employee_id=None)
        assert exc_info.value.status_code == 401


class TestGetCurrentEmployee:
    def test_returns_employee_when_found(self):
        mock_db = MagicMock()
        mock_emp = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_emp
        result = get_current_employee(employee_id="1", db=mock_db)
        assert result == mock_emp

    def test_raises_404_when_not_found(self):
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(HTTPException) as exc_info:
            get_current_employee(employee_id="999", db=mock_db)
        assert exc_info.value.status_code == 401

    def test_raises_401_when_invalid_id(self):
        mock_db = MagicMock()
        with pytest.raises(HTTPException) as exc_info:
            get_current_employee(employee_id="abc", db=mock_db)
        assert exc_info.value.status_code == 401
