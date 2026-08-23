"""Evaluation routers."""

import logging
import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_current_employee, get_db, validate_hierarchy_access
from app.exceptions import HierarchyViolation
from app.rate_limit import rate_limit
from app.models.employee import Employee
from app.models.evaluation_question import EvaluationQuestion
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationSummaryResponse,
    QuestionResponse,
    SubordinateEvaluationResponse,
)
from app.services.evaluation import (
    build_summary_response,
    create_evaluation,
    get_evaluation_history,
    get_subordinate_evaluations,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


def validate_employee_id(emp_id: int) -> int:
    """Validate employee ID is a positive integer."""
    if not isinstance(emp_id, int) or emp_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid employee ID")
    return emp_id


def sanitize_input(value: str, max_length: int = 255) -> str:
    """Sanitize input by removing potentially dangerous characters.
    WARNING: This is for display purposes only. Never use this for input that goes into SQL queries.
    Always use parameterized queries instead.
    """
    if not isinstance(value, str):
        raise HTTPException(status_code=400, detail="Invalid input")

    # Remove potentially dangerous characters for display purposes only
    sanitized = re.sub(r'[<>"\'\\;&|]', '', value)

    # Truncate to max length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()


@router.get("/questions/", response_model=list[QuestionResponse])
def list_questions(db: Session = Depends(get_db)):
    """Return all evaluation questions ordered by display order."""
    try:
        questions = db.query(EvaluationQuestion).order_by(EvaluationQuestion.order).all()
        return questions
    except Exception as e:
        logger.error(f"Error loading questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error loading questions. Please try again later.")


@router.post(
    "/",
    response_model=EvaluationSummaryResponse,
    status_code=201,
    dependencies=[Depends(rate_limit(times=10, seconds=60))],
)
def submit_evaluation(
    data: EvaluationCreate,
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Create a new evaluation for a subordinate."""
    try:
        # Validate input data
        if not data.scores or len(data.scores) != 6:
            raise HTTPException(status_code=422, detail="All 6 questions must be evaluated")
        
        # Sanitize input
        sanitized_data = EvaluationCreate(
            employee_id=validate_employee_id(data.employee_id),
            scores=[
                {
                    "question_id": validate_question_id(s.question_id),
                    "score": validate_score(s.score)
                } for s in data.scores
            ]
        )
        
        return create_evaluation(db, current.id, sanitized_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in submit_evaluation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error submitting evaluation. Please try again later.")


@router.get("/subordinates/", response_model=list[SubordinateEvaluationResponse])
def subordinate_evaluations(
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Get latest evaluation for each subordinate."""
    try:
        results = get_subordinate_evaluations(db, current.id)
        return [
            SubordinateEvaluationResponse(
                employee_id=r["employee_id"],
                employee_name=sanitize_input(r["employee_name"]),
                position_name=sanitize_input(r["position_name"]),
                latest_evaluation=(
                    build_summary_response(db, r["latest_evaluation"])
                    if r["latest_evaluation"]
                    else None
                ),
                depth=r["depth"],
            )
            for r in results
        ]
    except Exception as e:
        logger.error(f"Error in subordinate_evaluations for employee {current.id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error loading evaluations. Please try again later.")


@router.get("/employee/{emp_id}/", response_model=list[EvaluationSummaryResponse])
def evaluation_history(
    emp_id: int,
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Get evaluation history for an employee."""
    try:
        # Validate employee ID
        validated_emp_id = validate_employee_id(emp_id)
        
        # Check hierarchy access
        if current.id != validated_emp_id and not validate_hierarchy_access(current, validated_emp_id, db):
            raise HierarchyViolation()

        summaries = get_evaluation_history(db, current.id, validated_emp_id)
        if not summaries:
            # Return empty list instead of error when no history exists
            return []

        return [build_summary_response(db, s) for s in summaries]
    except HTTPException:
        raise
    except HierarchyViolation:
        raise HTTPException(status_code=403, detail="You do not have access to this employee")
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Full error in evaluation_history: {error_details}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error loading history. Please try again later.")


def validate_question_id(question_id: int) -> int:
    """Validate question ID is a positive integer."""
    if not isinstance(question_id, int) or question_id <= 0:
        raise HTTPException(status_code=422, detail="Invalid question ID")
    return question_id


def validate_score(score: int) -> int:
    """Validate score is between 1 and 4."""
    if not isinstance(score, int) or score < 1 or score > 4:
        raise HTTPException(status_code=422, detail="Score must be between 1 and 4")
    return score
