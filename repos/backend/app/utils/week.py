"""Week number utilities for evaluation scheduling."""

from datetime import datetime


def get_current_iso_week() -> tuple[int, int]:
    """Return (year, week_number) for the current date using ISO 8601."""
    now = datetime.now()
    iso = now.isocalendar()
    return (iso[0], iso[1])


def get_week_number(dt: datetime) -> tuple[int, int]:
    """Return (year, week_number) for a given datetime using ISO 8601."""
    iso = dt.isocalendar()
    return (iso[0], iso[1])
