"""Tests for app.services.seed module."""

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.database import Base
from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion


class TestSeedDatabase:
    """Tests for seed_database function."""

    def test_seed_function_exists(self):
        """Seed function should be importable."""
        from app.services.seed import seed_database
        assert callable(seed_database)

    def test_seed_inserts_20_employees(self, tmp_path):
        """Seed should insert 20 employees."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            count = session.query(Employee).count()
            assert count == 20

    def test_seed_inserts_19_leader_lead_relationships(self, tmp_path):
        """Seed should insert 19 leader_lead relationships."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            count = session.query(LeaderLead).count()
            assert count == 19

    def test_seed_inserts_6_questions(self, tmp_path):
        """Seed should insert 6 evaluation questions."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            count = session.query(EvaluationQuestion).count()
            assert count == 6

    def test_seed_is_idempotent(self, tmp_path):
        """Seed should not duplicate data on second run."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            seed_database(session)  # Run again
            emp_count = session.query(Employee).count()
            ll_count = session.query(LeaderLead).count()
            q_count = session.query(EvaluationQuestion).count()
            assert emp_count == 20
            assert ll_count == 19
            assert q_count == 6

    def test_seed_creates_alice_as_ceo(self, tmp_path):
        """Seed should create Alice Hartman as CEO with id=1."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            alice = session.query(Employee).filter_by(id=1).first()
            assert alice is not None
            assert alice.name == "Alice Hartman"
            assert alice.position_name == "CEO"

    def test_seed_questions_have_weights_summing_to_100(self, tmp_path):
        """Seed questions should have weights summing to 100."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            questions = session.query(EvaluationQuestion).all()
            total_weight = sum(q.weight for q in questions)
            assert total_weight == 100

    def test_seed_leader_lead_has_no_self_leads(self, tmp_path):
        """Seed should not create any self-referencing leader_lead."""
        from app.services.seed import seed_database
        engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(engine)
        with Session(engine) as session:
            seed_database(session)
            relationships = session.query(LeaderLead).all()
            for rel in relationships:
                assert rel.leader_id != rel.lead_id
