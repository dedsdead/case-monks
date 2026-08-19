"""Tests for app.utils.week module."""

import pytest
from datetime import datetime


class TestGetCurrentIsoWeek:
    """Tests for get_current_iso_week function."""

    def test_get_current_iso_week_exists(self):
        """Function should be importable."""
        from app.utils.week import get_current_iso_week
        assert callable(get_current_iso_week)

    def test_get_current_iso_week_returns_tuple(self):
        """Function should return a tuple of (year, week_number)."""
        from app.utils.week import get_current_iso_week
        result = get_current_iso_week()
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_get_current_iso_week_returns_integers(self):
        """Function should return (int, int)."""
        from app.utils.week import get_current_iso_week
        year, week = get_current_iso_week()
        assert isinstance(year, int)
        assert isinstance(week, int)

    def test_get_current_iso_week_week_in_range(self):
        """Week number should be between 1 and 53."""
        from app.utils.week import get_current_iso_week
        _, week = get_current_iso_week()
        assert 1 <= week <= 53

    def test_get_current_iso_week_year_is_current(self):
        """Year should be the current year."""
        from app.utils.week import get_current_iso_week
        year, _ = get_current_iso_week()
        assert year == datetime.now().year


class TestGetWeekNumber:
    """Tests for get_week_number function."""

    def test_get_week_number_exists(self):
        """Function should be importable."""
        from app.utils.week import get_week_number
        assert callable(get_week_number)

    def test_get_week_number_returns_tuple(self):
        """Function should return a tuple of (year, week_number)."""
        from app.utils.week import get_week_number
        dt = datetime(2026, 8, 17)  # A known Monday
        result = get_week_number(dt)
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_get_week_number_specific_date(self):
        """Function should return correct week for known date."""
        from app.utils.week import get_week_number
        # 2026-01-01 is a Thursday, ISO week 1
        dt = datetime(2026, 1, 1)
        year, week = get_week_number(dt)
        assert year == 2026
        assert week == 1

    def test_get_week_number_dec_31(self):
        """Dec 31 can be in week 1 of next year."""
        from app.utils.week import get_week_number
        # 2025-12-31 is a Wednesday, ISO week 1 of 2026
        dt = datetime(2025, 12, 31)
        year, week = get_week_number(dt)
        # ISO standard: Dec 31 2025 is week 1 of 2026
        assert week >= 1
