"""Evaluation routers."""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Path, Cookie
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.dependencies import get_current_employee, get_db, validate_hierarchy_access
from app.exceptions import EmployeeNotFound, HierarchyViolation, SelfEvaluationBlocked
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


def validate_employee_id(emp_id: int) -> int:
    """Validate employee ID is a positive integer."""
    if not isinstance(emp_id, int) or emp_id <= 0:
        raise HTTPException(status_code=400, detail="ID de funcionário inválido")
    return emp_id


def sanitize_input(value: str, max_length: int = 255) -> str:
    """Sanitize input by removing potentially dangerous characters."""
    if not isinstance(value, str):
        raise HTTPException(status_code=400, detail="Entrada inválida")
    
    # Remove potentially dangerous characters
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
        raise HTTPException(status_code=500, detail=f"Erro ao carregar perguntas: {str(e)}")


@router.post("/", response_model=EvaluationSummaryResponse, status_code=201)
def submit_evaluation(
    data: EvaluationCreate,
    current: Annotated[Employee, Depends(get_current_employee)],
    db: Session = Depends(get_db),
):
    """Create a new evaluation for a subordinate."""
    try:
        # Validate input data
        if not data.scores or len(data.scores) != 6:
            raise HTTPException(status_code=422, detail="É necessário avaliar todas as 6 perguntas")
        
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
        raise HTTPException(status_code=500, detail=f"Erro ao submeter avaliação: {str(e)}")


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
                    EvaluationSummaryResponse.model_validate(r["latest_evaluation"])
                    if r["latest_evaluation"]
                    else None
                ),
                depth=r["depth"],
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar avaliações: {str(e)}")


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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar histórico: {str(e)}")


def validate_question_id(question_id: int) -> int:
    """Validate question ID is a positive integer."""
    if not isinstance(question_id, int) or question_id <= 0:
        raise HTTPException(status_code=422, detail="ID de pergunta inválido")
    return question_id


def validate_score(score: int) -> int:
    """Validate score is between 1 and 4."""
    if not isinstance(score, int) or score < 1 or score > 4:
        raise HTTPException(status_code=422, detail="Avaliação deve ser entre 1 e 4")
    return score


def _get_question_title(db: Session, question_id: int) -> str:
    """Get question title with error handling."""
    try:
        q = db.query(EvaluationQuestion).filter(EvaluationQuestion.id == question_id).first()
        return sanitize_input(q.title) if q else ""
    except Exception:
        return ""


def _get_question_weight(db: Session, question_id: int) -> int:
    """Get question weight with error handling."""
    try:
        q = db.query(EvaluationQuestion).filter(EvaluationQuestion.id == question_id).first()
        return q.weight if q else 0
    except Exception:
        return 0
