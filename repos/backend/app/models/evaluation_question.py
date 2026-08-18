"""EvaluationQuestion SQLAlchemy models with domain constraints."""

from sqlalchemy import String, CheckConstraint

from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EvaluationQuestion(Base):
    """Evaluation question with title, weight, and display order."""

    __tablename__ = "evaluation_question"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    weight: Mapped[int] = mapped_column()
    order: Mapped[int] = mapped_column()

    __table_args__ = (
        CheckConstraint("weight > 0", name="ck_question_weight_positive"),
        CheckConstraint('"order" > 0', name="ck_question_order_positive"),
    )
