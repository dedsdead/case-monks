"""EvaluationResponse SQLAlchemy models."""

from sqlalchemy import ForeignKey, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EvaluationResponse(Base):
    """Individual question response within an evaluation."""

    __tablename__ = "evaluation_response"

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_summary_id: Mapped[int] = mapped_column(ForeignKey("evaluation_summary.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(ForeignKey("evaluation_question.id", ondelete="RESTRICT"))
    score: Mapped[int]

    __table_args__ = (
        UniqueConstraint(
            "evaluation_summary_id", "question_id",
            name="uq_eval_response_summary_question",
        ),
        Index("ix_eval_response_question", "question_id"),
        CheckConstraint("score BETWEEN 1 AND 4", name="ck_response_score_range"),
    )
