"""FastAPI dependency injection functions."""

from collections.abc import Generator
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.employee import Employee


def get_db() -> Generator[Session]:
    """Yield a database session and ensure cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_employee_id_from_cookie(employee_id: str | None = Cookie(default=None)) -> str:
    """Extract employee_id from cookie; raise 401 if missing."""
    if employee_id is None:
        raise HTTPException(status_code=401, detail="Employee ID cookie not found")
    return employee_id


def get_current_employee(
    employee_id: Annotated[str, Depends(get_employee_id_from_cookie)],
    db: Session = Depends(get_db),
) -> Employee:
    """Fetch the current employee from the database."""
    try:
        emp_id = int(employee_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid employee ID")
    employee = db.query(Employee).filter(Employee.id == emp_id).first()
    if employee is None:
        raise HTTPException(status_code=401, detail="Employee not found")
    return employee
