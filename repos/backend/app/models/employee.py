"""Employee and LeaderLead SQLAlchemy models."""

import re
from sqlalchemy import String, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database import Base


class Employee(Base):
    """Employee model representing organizational members."""

    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    position_name: Mapped[str] = mapped_column(String(100), nullable=False)

    __table_args__ = (
        Index("ix_employee_email", "email"),
    )


class LeaderLead(Base):
    """Many-to-many relationship between leaders and their direct reports."""

    __tablename__ = "leader_lead"

    leader_id: Mapped[int] = mapped_column(ForeignKey("employee.id", ondelete="SET NULL"), primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("employee.id", ondelete="SET NULL"), primary_key=True)

    __table_args__ = (
        CheckConstraint("leader_id <> lead_id", name="chk_no_self_lead"),
        Index("ix_leader_lead_leader", "leader_id"),
        Index("ix_leader_lead_lead", "lead_id"),
    )
