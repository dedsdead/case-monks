"""Employee routers."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_employee, get_db
from app.exceptions import EmployeeNotFound, HierarchyViolation
from app.models.employee import Employee
from app.schemas.employee import EmployeeResponse
from app.services.hierarchy import get_all_subordinates

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)):
    """Return all employees."""
    return db.query(Employee).order_by(Employee.id).all()


@router.get("/{emp_id}/", response_model=EmployeeResponse)
def get_employee(emp_id: int, db: Session = Depends(get_db)):
    """Return employee by ID."""
    employee = db.query(Employee).filter(Employee.id == emp_id).first()
    if not employee:
        raise EmployeeNotFound()
    return employee


@router.get("/{emp_id}/subordinates/", response_model=list[EmployeeResponse])
def list_subordinates(
    emp_id: int,
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Return subordinates of the given employee (hierarchy validation required)."""
    from app.services.evaluation import is_ancestor_of

    if current.id != emp_id and not is_ancestor_of(db, current.id, emp_id):
        raise HierarchyViolation()

    subordinate_ids = get_all_subordinates(db, emp_id)
    if not subordinate_ids:
        return []
    return db.query(Employee).filter(Employee.id.in_(subordinate_ids)).order_by(Employee.id).all()
