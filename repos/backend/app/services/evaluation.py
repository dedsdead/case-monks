"""Evaluation service with business logic for creating and querying evaluations."""

import logging
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.exceptions import HierarchyViolation, SelfEvaluationBlocked, WeeklyLimitExceeded
from app.models.employee import Employee
from app.models.evaluation_question import EvaluationQuestion
from app.models.evaluation_response import EvaluationResponse
from app.models.evaluation_summary import EvaluationSummary
from app.schemas.evaluation import EvaluationCreate, EvaluationSummaryResponse, QuestionScoreResponse
from app.services.hierarchy import get_all_subordinates, get_all_subordinates_with_depth, is_ancestor_of
from app.utils.week import get_current_iso_week

logger = logging.getLogger(__name__)


def build_summary_response(
    db: Session, summary: EvaluationSummary
) -> EvaluationSummaryResponse:
    """Build an EvaluationSummaryResponse from an ORM summary.

    Loads the evaluation responses and their question details with two
    batch queries. The ORM model intentionally has no `questions`
    relationship, so serialization must go through this builder.
    """
    responses = (
        db.query(EvaluationResponse)
        .filter(EvaluationResponse.evaluation_summary_id == summary.id)
        .order_by(EvaluationResponse.question_id)
        .all()
    )

    question_ids = {r.question_id for r in responses}
    questions = (
        db.query(EvaluationQuestion)
        .filter(EvaluationQuestion.id.in_(question_ids))
        .all()
        if question_ids
        else []
    )
    question_map = {q.id: q for q in questions}

    built_questions = []
    for r in responses:
        question = question_map.get(r.question_id)
        if question is None:
            logger.warning(
                "Skipping response %s: unknown question_id %s in summary %s",
                r.id, r.question_id, summary.id,
            )
            continue
        built_questions.append(
            QuestionScoreResponse(
                question_id=r.question_id,
                title=question.title,
                weight=question.weight,
                score=r.score,
            )
        )

    return EvaluationSummaryResponse(
        id=summary.id,
        employee_id=summary.employee_id,
        evaluator_id=summary.evaluator_id,
        total_score=float(summary.total_score),
        evaluation_date=summary.evaluation_date,
        evaluation_year=summary.evaluation_year,
        week_number=summary.week_number,
        questions=built_questions,
    )


def create_evaluation(
    db: Session, evaluator_id: int, data: EvaluationCreate
) -> EvaluationSummaryResponse:
    """Create a new evaluation with all validations."""
    try:
        # Self-evaluation check
        if evaluator_id == data.employee_id:
            raise SelfEvaluationBlocked()

        # Hierarchy check
        if not is_ancestor_of(db, evaluator_id, data.employee_id):
            raise HierarchyViolation()

        # Weekly limit check
        year, week = get_current_iso_week()
        
        # Check for existing evaluation
        existing = (
            db.query(EvaluationSummary)
            .filter(
                EvaluationSummary.evaluator_id == evaluator_id,
                EvaluationSummary.employee_id == data.employee_id,
                EvaluationSummary.evaluation_year == year,
                EvaluationSummary.week_number == week,
            )
            .first()
        )
        if existing:
            raise WeeklyLimitExceeded(existing.id)

        # Calculate total score
        questions = db.execute(
            select(EvaluationQuestion.id, EvaluationQuestion.weight)
            .order_by(EvaluationQuestion.id)
        ).all()
        weight_map = {q.id: q.weight for q in questions}

        total_score = sum(
            s.score * weight_map[s.question_id] for s in data.scores
        ) / 100.0

        # Create summary
        summary = EvaluationSummary(
            employee_id=data.employee_id,
            evaluator_id=evaluator_id,
            total_score=round(total_score, 1),
            evaluation_date=datetime.now(),
            evaluation_year=year,
            week_number=week,
        )
        db.add(summary)
        db.flush()

        # Create responses
        for s in data.scores:
            response = EvaluationResponse(
                evaluation_summary_id=summary.id,
                question_id=s.question_id,
                score=s.score,
            )
            db.add(response)

        db.commit()
        db.refresh(summary)

        return build_summary_response(db, summary)

    except HTTPException:
        # Re-raise business rule exceptions without wrapping
        try:
            db.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {str(rollback_error)}", exc_info=True)
        raise
    except Exception as e:
        # Rollback any changes if something went wrong
        try:
            db.rollback()
        except Exception as rollback_error:
            logger.error(f"Error during rollback: {str(rollback_error)}", exc_info=True)

        logger.error(f"Error in create_evaluation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error submitting evaluation. Please try again later.")


def get_subordinate_evaluations(
    db: Session, leader_id: int
) -> list[dict]:
    """Get latest evaluation for each subordinate, sorted by depth ASC."""
    try:
        # Get subordinates with error handling
        subordinate_ids = get_all_subordinates(db, leader_id)
        if not subordinate_ids:
            return []

        # Get depth mapping with error handling
        depth_map = {}
        try:
            depth_map = {
                sid: depth
                for sid, depth in get_all_subordinates_with_depth(db, leader_id)
            }
        except Exception as depth_error:
            logger.error(f"Error getting depth map: {str(depth_error)}")
            # Fallback: assume depth 0 for all subordinates
            depth_map = {sid: 0 for sid in subordinate_ids}

        # For each subordinate, get their latest evaluation (most recent date)
        results = []
        for emp_id in subordinate_ids:
            try:
                emp = db.query(Employee).filter(Employee.id == emp_id).first()
                if not emp:
                    continue

                latest = (
                    db.query(EvaluationSummary)
                    .filter(
                        EvaluationSummary.employee_id == emp_id,
                        EvaluationSummary.evaluator_id == leader_id,
                    )
                    .order_by(desc(EvaluationSummary.evaluation_date))
                    .first()
                )

                results.append({
                    "employee_id": emp_id,
                    "employee_name": emp.name,
                    "position_name": emp.position_name,
                    "latest_evaluation": latest,
                    "depth": depth_map.get(emp_id, 0),
                })
            except Exception as emp_error:
                logger.error(f"Error processing subordinate {emp_id}: {str(emp_error)}")
                continue

        # Sort by depth ASC (top-down hierarchy)
        results.sort(key=lambda x: x["depth"])
        return results
        
    except Exception as e:
        logger.error(f"Error in get_subordinate_evaluations for leader {leader_id}: {str(e)}", exc_info=True)
        # Return empty list instead of raising exception to prevent cascade failures
        return []


def get_evaluation_history(
    db: Session, evaluator_id: int, employee_id: int
) -> list[EvaluationSummary]:
    """Get all evaluations for a specific employee by this evaluator."""
    return (
        db.query(EvaluationSummary)
        .filter(
            EvaluationSummary.employee_id == employee_id,
            EvaluationSummary.evaluator_id == evaluator_id,
        )
        .order_by(desc(EvaluationSummary.evaluation_date))
        .all()
    )
