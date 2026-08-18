"""Tests for SQLAlchemy models (Employee, LeaderLead, EvaluationQuestion, EvaluationSummary, EvaluationResponse)."""

import pytest
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import Session, DeclarativeBase

from app.database import Base


class TestEmployeeModel:
    """Tests for Employee model."""

    def test_employee_model_exists(self):
        """Employee model should be importable."""
        from app.models.employee import Employee
        assert Employee is not None

    def test_employee_table_name(self):
        """Employee should map to 'employee' table."""
        from app.models.employee import Employee
        assert Employee.__tablename__ == "employee"

    def test_employee_has_required_columns(self):
        """Employee should have id, name, email, position_name columns."""
        from app.models.employee import Employee
        mapper = inspect(Employee)
        columns = {c.key for c in mapper.columns}
        assert "id" in columns
        assert "name" in columns
        assert "email" in columns
        assert "position_name" in columns

    def test_employee_email_is_unique(self):
        """Employee email column should have unique constraint."""
        from app.models.employee import Employee
        mapper = inspect(Employee)
        email_col = mapper.columns["email"]
        assert email_col.unique is True

    def test_employee_can_be_created(self, tmp_path):
        """Employee can be inserted into database."""
        from app.models.employee import Employee
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            emp = Employee(id=1, name="Alice", email="alice@example.com", position_name="CEO")
            session.add(emp)
            session.commit()
            result = session.query(Employee).filter_by(id=1).first()
            assert result is not None
            assert result.name == "Alice"
            assert result.email == "alice@example.com"


class TestLeaderLeadModel:
    """Tests for LeaderLead model."""

    def test_leader_lead_model_exists(self):
        """LeaderLead model should be importable."""
        from app.models.employee import LeaderLead
        assert LeaderLead is not None

    def test_leader_lead_table_name(self):
        """LeaderLead should map to 'leader_lead' table."""
        from app.models.employee import LeaderLead
        assert LeaderLead.__tablename__ == "leader_lead"

    def test_leader_lead_has_composite_pk(self):
        """LeaderLead should have composite primary key (leader_id, lead_id)."""
        from app.models.employee import LeaderLead
        mapper = inspect(LeaderLead)
        pk_cols = mapper.primary_key
        pk_names = {c.key for c in pk_cols}
        assert pk_names == {"leader_id", "lead_id"}

    def test_leader_lead_has_foreign_keys(self):
        """LeaderLead should have FK references to employee table."""
        from app.models.employee import LeaderLead
        mapper = inspect(LeaderLead)
        leader_fk = mapper.columns["leader_id"].foreign_keys
        lead_fk = mapper.columns["lead_id"].foreign_keys
        assert len(leader_fk) == 1
        assert len(lead_fk) == 1

    def test_leader_lead_can_be_created(self, tmp_path):
        """LeaderLead relationship can be inserted."""
        from app.models.employee import Employee, LeaderLead
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            session.add(Employee(id=1, name="Alice", email="alice@example.com", position_name="CEO"))
            session.add(Employee(id=2, name="Bob", email="bob@example.com", position_name="Dev"))
            session.commit()
            ll = LeaderLead(leader_id=1, lead_id=2)
            session.add(ll)
            session.commit()
            result = session.query(LeaderLead).first()
            assert result is not None
            assert result.leader_id == 1
            assert result.lead_id == 2


class TestEvaluationQuestionModel:
    """Tests for EvaluationQuestion model."""

    def test_evaluation_question_model_exists(self):
        """EvaluationQuestion model should be importable."""
        from app.models.evaluation_question import EvaluationQuestion
        assert EvaluationQuestion is not None

    def test_evaluation_question_table_name(self):
        """EvaluationQuestion should map to 'evaluation_question' table."""
        from app.models.evaluation_question import EvaluationQuestion
        assert EvaluationQuestion.__tablename__ == "evaluation_question"

    def test_evaluation_question_has_required_columns(self):
        """EvaluationQuestion should have id, title, weight, order columns."""
        from app.models.evaluation_question import EvaluationQuestion
        mapper = inspect(EvaluationQuestion)
        columns = {c.key for c in mapper.columns}
        assert "id" in columns
        assert "title" in columns
        assert "weight" in columns
        assert "order" in columns

    def test_evaluation_question_can_be_created(self, tmp_path):
        """EvaluationQuestion can be inserted."""
        from app.models.evaluation_question import EvaluationQuestion
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            q = EvaluationQuestion(id=1, title="Entrega de Resultados", weight=25, order=1)
            session.add(q)
            session.commit()
            result = session.query(EvaluationQuestion).first()
            assert result is not None
            assert result.title == "Entrega de Resultados"
            assert result.weight == 25


class TestEvaluationSummaryModel:
    """Tests for EvaluationSummary model."""

    def test_evaluation_summary_model_exists(self):
        """EvaluationSummary model should be importable."""
        from app.models.evaluation_summary import EvaluationSummary
        assert EvaluationSummary is not None

    def test_evaluation_summary_table_name(self):
        """EvaluationSummary should map to 'evaluation_summary' table."""
        from app.models.evaluation_summary import EvaluationSummary
        assert EvaluationSummary.__tablename__ == "evaluation_summary"

    def test_evaluation_summary_has_required_columns(self):
        """EvaluationSummary should have all required columns."""
        from app.models.evaluation_summary import EvaluationSummary
        mapper = inspect(EvaluationSummary)
        columns = {c.key for c in mapper.columns}
        assert "id" in columns
        assert "employee_id" in columns
        assert "evaluator_id" in columns
        assert "total_score" in columns
        assert "evaluation_date" in columns
        assert "evaluation_year" in columns
        assert "week_number" in columns

    def test_evaluation_summary_has_unique_constraint(self):
        """EvaluationSummary should have unique constraint on (evaluator_id, employee_id, evaluation_year, week_number)."""
        from app.models.evaluation_summary import EvaluationSummary
        mapper = inspect(EvaluationSummary)
        table = mapper.local_table
        unique_constraints = [c for c in table.constraints if hasattr(c, 'columns') and len(c.columns) == 4]
        assert len(unique_constraints) >= 1

    def test_evaluation_summary_has_no_is_submitted(self):
        """EvaluationSummary should NOT have is_submitted column."""
        from app.models.evaluation_summary import EvaluationSummary
        mapper = inspect(EvaluationSummary)
        columns = {c.key for c in mapper.columns}
        assert "is_submitted" not in columns

    def test_evaluation_summary_can_be_created(self, tmp_path):
        """EvaluationSummary can be inserted."""
        from app.models.employee import Employee
        from app.models.evaluation_summary import EvaluationSummary
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            session.add(Employee(id=1, name="Alice", email="alice@example.com", position_name="CEO"))
            session.add(Employee(id=2, name="Bob", email="bob@example.com", position_name="Dev"))
            session.commit()
            from datetime import datetime
            summary = EvaluationSummary(
                id=1, employee_id=2, evaluator_id=1, total_score=3.5,
                evaluation_date=datetime.now(), evaluation_year=2026, week_number=33
            )
            session.add(summary)
            session.commit()
            result = session.query(EvaluationSummary).first()
            assert result is not None
            assert result.total_score == 3.5


class TestEvaluationResponseModel:
    """Tests for EvaluationResponse model."""

    def test_evaluation_response_model_exists(self):
        """EvaluationResponse model should be importable."""
        from app.models.evaluation_response import EvaluationResponse
        assert EvaluationResponse is not None

    def test_evaluation_response_table_name(self):
        """EvaluationResponse should map to 'evaluation_response' table."""
        from app.models.evaluation_response import EvaluationResponse
        assert EvaluationResponse.__tablename__ == "evaluation_response"

    def test_evaluation_response_has_required_columns(self):
        """EvaluationResponse should have id, evaluation_summary_id, question_id, score columns."""
        from app.models.evaluation_response import EvaluationResponse
        mapper = inspect(EvaluationResponse)
        columns = {c.key for c in mapper.columns}
        assert "id" in columns
        assert "evaluation_summary_id" in columns
        assert "question_id" in columns
        assert "score" in columns

    def test_evaluation_response_has_unique_constraint(self):
        """EvaluationResponse should have unique constraint on (evaluation_summary_id, question_id)."""
        from app.models.evaluation_response import EvaluationResponse
        mapper = inspect(EvaluationResponse)
        table = mapper.local_table
        unique_constraints = [c for c in table.constraints if hasattr(c, 'columns') and len(c.columns) == 2]
        assert len(unique_constraints) >= 1

    def test_evaluation_response_can_be_created(self, tmp_path):
        """EvaluationResponse can be inserted."""
        from app.models.employee import Employee
        from app.models.evaluation_question import EvaluationQuestion
        from app.models.evaluation_summary import EvaluationSummary
        from app.models.evaluation_response import EvaluationResponse
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            session.add(Employee(id=1, name="Alice", email="alice@example.com", position_name="CEO"))
            session.add(Employee(id=2, name="Bob", email="bob@example.com", position_name="Dev"))
            session.add(EvaluationQuestion(id=1, title="Test Q", weight=25, order=1))
            session.commit()
            from datetime import datetime
            summary = EvaluationSummary(
                id=1, employee_id=2, evaluator_id=1, total_score=4.0,
                evaluation_date=datetime.now(), evaluation_year=2026, week_number=33
            )
            session.add(summary)
            session.commit()
            resp = EvaluationResponse(id=1, evaluation_summary_id=1, question_id=1, score=4)
            session.add(resp)
            session.commit()
            result = session.query(EvaluationResponse).first()
            assert result is not None
            assert result.score == 4
