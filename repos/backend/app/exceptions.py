"""Custom HTTP exceptions for the application."""

from fastapi import HTTPException


class WeeklyLimitExceeded(HTTPException):
    """Raised when a leader already evaluated this employee this week."""

    def __init__(self, existing_evaluation_id: int):
        super().__init__(
            status_code=409,
            detail={
                "message": "Weekly evaluation limit exceeded",
                "existing_evaluation_id": existing_evaluation_id,
            },
        )


class HierarchyViolation(HTTPException):
    """Raised when a leader tries to evaluate someone not in their hierarchy."""

    def __init__(self):
        super().__init__(
            status_code=403,
            detail="You do not have access to evaluate this employee",
        )


class SelfEvaluationBlocked(HTTPException):
    """Raised when a leader tries to evaluate themselves."""

    def __init__(self):
        super().__init__(
            status_code=403,
            detail="Self-evaluation is not allowed",
        )


class EmployeeNotFound(HTTPException):
    """Raised when an employee is not found."""

    def __init__(self):
        super().__init__(status_code=404, detail="Employee not found")
