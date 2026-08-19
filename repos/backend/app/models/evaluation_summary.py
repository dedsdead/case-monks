"""EvaluationSummary SQLAlchemy models."""

from datetime import datetime

from sqlalchemy import ForeignKey, UniqueConstraint, Index, Numeric, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EvaluationSummary(Base):
    """Summary of an evaluation submission (one per leader-employee-week)."""

    __tablename__ = "evaluation_summary"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id", ondelete="CASCADE"))
    evaluator_id: Mapped[int] = mapped_column(ForeignKey("employee.id", ondelete="CASCADE"))
    total_score: Mapped[float] = mapped_column(Numeric(3, 1))
    evaluation_date: Mapped[datetime] = mapped_column(DateTime)
    evaluation_year: Mapped[int] = mapped_column(Integer)
    week_number: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        UniqueConstraint(
            "evaluator_id", "employee_id", "evaluation_year", "week_number",
            name="uq_evaluator_employee_week",
        ),
        Index("ix_eval_summary_latest", "employee_id", "evaluator_id", "evaluation_date"),
    )
