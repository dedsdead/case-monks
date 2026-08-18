"""Evaluation routers."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_employee, get_db
from app.exceptions import EmployeeNotFound, HierarchyViolation
from app.models.employee import Employee
from app.models.evaluation_question import EvaluationQuestion
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationSummaryResponse,
    QuestionResponse,
    QuestionScoreResponse,
    SubordinateEvaluationResponse,
)
from app.services.evaluation import (
    create_evaluation,
    get_evaluation_history,
    get_subordinate_evaluations,
    is_ancestor_of,
)

router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])


@router.get("/questions", response_model=list[QuestionResponse])
def list_questions(db: Session = Depends(get_db)):
    """Return all evaluation questions ordered by display order."""
    return db.query(EvaluationQuestion).order_by(EvaluationQuestion.order).all()


@router.post("/", response_model=EvaluationSummaryResponse, status_code=201)
def submit_evaluation(
    data: EvaluationCreate,
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Create a new evaluation for a subordinate."""
    return create_evaluation(db, current.id, data)


@router.get("/subordinates", response_model=list[SubordinateEvaluationResponse])
def subordinate_evaluations(
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Get latest evaluation for each subordinate."""
    results = get_subordinate_evaluations(db, current.id)
    return [
        SubordinateEvaluationResponse(
            employee_id=r["employee_id"],
            employee_name=r["employee_name"],
            position_name=r["position_name"],
            latest_evaluation=(
                EvaluationSummaryResponse.model_validate(r["latest_evaluation"])
                if r["latest_evaluation"]
                else None
            ),
            depth=r["depth"],
        )
        for r in results
    ]


@router.get("/employee/{emp_id}", response_model=list[EvaluationSummaryResponse])
def evaluation_history(
    emp_id: int,
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Get evaluation history for an employee."""
    if current.id != emp_id and not is_ancestor_of(db, current.id, emp_id):
        raise HierarchyViolation()

    summaries = get_evaluation_history(db, current.id, emp_id)

    result = []
    for s in summaries:
        from app.models.evaluation_response import EvaluationResponse

        responses = (
            db.query(EvaluationResponse)
            .filter(EvaluationResponse.evaluation_summary_id == s.id)
            .all()
        )
        questions = [
            QuestionScoreResponse(
                question_id=r.question_id,
                title=_get_question_title(db, r.question_id),
                weight=_get_question_weight(db, r.question_id),
                score=r.score,
            )
            for r in responses
        ]
        result.append(
            EvaluationSummaryResponse(
                id=s.id,
                employee_id=s.employee_id,
                evaluator_id=s.evaluator_id,
                total_score=float(s.total_score),
                evaluation_date=s.evaluation_date,
                evaluation_year=s.evaluation_year,
                week_number=s.week_number,
                questions=questions,
            )
        )
    return result


def _get_question_title(db: Session, question_id: int) -> str:
    q = db.query(EvaluationQuestion).filter(EvaluationQuestion.id == question_id).first()
    return q.title if q else ""


def _get_question_weight(db: Session, question_id: int) -> int:
    q = db.query(EvaluationQuestion).filter(EvaluationQuestion.id == question_id).first()
    return q.weight if q else 0
