"""Employee and LeaderLead SQLAlchemy models."""

from sqlalchemy import String, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Employee(Base):
    """Employee model representing organizational members."""

    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    position_name: Mapped[str] = mapped_column(String(100))


class LeaderLead(Base):
    """Many-to-many relationship between leaders and their direct reports."""

    __tablename__ = "leader_lead"

    leader_id: Mapped[int] = mapped_column(ForeignKey("employee.id", ondelete="CASCADE"), primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("employee.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        CheckConstraint("leader_id <> lead_id", name="chk_no_self_lead"),
        Index("ix_leader_lead_reverse", "lead_id"),
    )
