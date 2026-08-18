"""Evaluation service with business logic for creating and querying evaluations."""

from datetime import datetime

from sqlalchemy import desc, func, literal, select, union
from sqlalchemy.orm import Session

from app.exceptions import HierarchyViolation, SelfEvaluationBlocked, WeeklyLimitExceeded
from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion
from app.models.evaluation_response import EvaluationResponse
from app.models.evaluation_summary import EvaluationSummary
from app.schemas.evaluation import EvaluationCreate
from app.services.hierarchy import clear_cache, get_all_subordinates, get_all_subordinates_with_depth
from app.utils.week import get_current_iso_week


def create_evaluation(
    db: Session, evaluator_id: int, data: EvaluationCreate
) -> EvaluationSummary:
    """Create a new evaluation with all validations."""
    # Self-evaluation check
    if evaluator_id == data.employee_id:
        raise SelfEvaluationBlocked()

    # Hierarchy check
    if not is_ancestor_of(db, evaluator_id, data.employee_id):
        raise HierarchyViolation()

    # Weekly limit check
    year, week = get_current_iso_week()
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
    clear_cache()
    return summary


def _is_ancestor_of(db: Session, ancestor_id: int, descendant_id: int) -> bool:
    """Check if ancestor_id is an ancestor of descendant_id."""
    subordinates = get_all_subordinates(db, ancestor_id)
    return descendant_id in subordinates


def get_subordinate_evaluations(
    db: Session, leader_id: int
) -> list[dict]:
    """Get latest evaluation for each subordinate, sorted by depth ASC."""
    subordinate_ids = get_all_subordinates(db, leader_id)
    depth_map = {
        sid: depth
        for sid, depth in get_all_subordinates_with_depth(db, leader_id)
    }

    if not subordinate_ids:
        return []

    # For each subordinate, get their latest evaluation (most recent date)
    results = []
    for emp_id in subordinate_ids:
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

    # Sort by depth ASC (top-down hierarchy)
    results.sort(key=lambda x: x["depth"])
    return results


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


def is_ancestor_of(db: Session, ancestor_id: int, descendant_id: int) -> bool:
    """Check if ancestor_id is an ancestor of descendant_id."""
    subordinates = get_all_subordinates(db, ancestor_id)
    return descendant_id in subordinates
