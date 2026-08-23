"""Seed data service for initial database population."""

import logging

from sqlalchemy.orm import Session

from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion

logger = logging.getLogger(__name__)

# Canonical questions/weights required by docs/case_tecnico.txt.
# Single source of truth for both fresh inserts and correction of existing rows.
CASE_QUESTIONS = [
    {"id": 1, "title": "Entrega de Resultados", "weight": 25, "order": 1},
    {"id": 2, "title": "Execução e Qualidade do Trabalho", "weight": 20, "order": 2},
    {"id": 3, "title": "Capacidade de Aprendizado e Desenvolvimento", "weight": 20, "order": 3},
    {"id": 4, "title": "Resolução de Problemas e Pensamento Crítico", "weight": 15, "order": 4},
    {"id": 5, "title": "Colaboração, Influência e Liderança", "weight": 10, "order": 5},
    {"id": 6, "title": "Visão Estratégica e Potencial de Crescimento", "weight": 10, "order": 6},
]


def _correct_questions(db: Session) -> None:
    """Align existing question rows with CASE_QUESTIONS (self-correcting seed).

    Older databases may contain outdated titles/weights; this updates them on
    startup so demo databases converge to the case spec without manual deletes.
    """
    corrected = 0
    for spec in CASE_QUESTIONS:
        question = db.query(EvaluationQuestion).filter_by(id=spec["id"]).first()
        if question is None:
            continue
        changes = {}
        if question.title != spec["title"]:
            changes["title"] = spec["title"]
        if int(question.weight) != spec["weight"]:
            changes["weight"] = spec["weight"]
        if question.order != spec["order"]:
            changes["order"] = spec["order"]
        if changes:
            for field, value in changes.items():
                setattr(question, field, value)
            corrected += 1
            logger.warning(
                "Corrected evaluation_question id=%s: %s",
                spec["id"],
                ", ".join(f"{k}->{v}" for k, v in changes.items()),
            )
    if corrected:
        db.flush()
        logger.info("Corrected %d evaluation question(s)", corrected)


def seed_database(db: Session) -> None:
    """Populate database with seed data (idempotent).

    Inserts 20 employees, 19 leader_lead relationships, and 6 evaluation questions.
    Checks each table independently to handle partial-seed recovery.
    Evaluation questions are also self-correcting: existing rows that deviate
    from CASE_QUESTIONS (titles/weights per the case spec) are updated on startup.
    """
    # Check and insert employees
    if db.query(Employee).first() is None:
        logger.info("Seeding employees...")
        employees = [
            Employee(id=1, name="Alice Hartman", email="alice.hartman@company.com", position_name="CEO"),
            Employee(id=2, name="Bob Sinclair", email="bob.sinclair@company.com", position_name="CTO"),
            Employee(id=3, name="Carol Nguyen", email="carol.nguyen@company.com", position_name="CFO"),
            Employee(id=4, name="David Okafor", email="david.okafor@company.com", position_name="Engineering Manager"),
            Employee(id=5, name="Eva Müller", email="eva.muller@company.com", position_name="Engineering Manager"),
            Employee(id=6, name="Frank Rossi", email="frank.rossi@company.com", position_name="Product Manager"),
            Employee(id=7, name="Grace Kim", email="grace.kim@company.com", position_name="UX Designer"),
            Employee(id=8, name="Henry Patel", email="henry.patel@company.com", position_name="Senior Software Engineer"),
            Employee(id=9, name="Isabelle Dubois", email="isabelle.dubois@company.com", position_name="Senior Software Engineer"),
            Employee(id=10, name="James Watanabe", email="james.watanabe@company.com", position_name="Software Engineer"),
            Employee(id=11, name="Karen Oliveira", email="karen.oliveira@company.com", position_name="Software Engineer"),
            Employee(id=12, name="Liam Johansson", email="liam.johansson@company.com", position_name="Software Engineer"),
            Employee(id=13, name="Mia Fernandez", email="mia.fernandez@company.com", position_name="Data Engineer"),
            Employee(id=14, name="Noah Chukwu", email="noah.chukwu@company.com", position_name="Data Analyst"),
            Employee(id=15, name="Olivia Brooks", email="olivia.brooks@company.com", position_name="QA Engineer"),
            Employee(id=16, name="Paul Nakamura", email="paul.nakamura@company.com", position_name="QA Engineer"),
            Employee(id=17, name="Quinn Santos", email="quinn.santos@company.com", position_name="DevOps Engineer"),
            Employee(id=18, name="Rachel Ivanova", email="rachel.ivanova@company.com", position_name="Finance Analyst"),
            Employee(id=19, name="Samuel Osei", email="samuel.osei@company.com", position_name="Finance Analyst"),
            Employee(id=20, name="Tina Bergmann", email="tina.bergmann@company.com", position_name="HR Specialist"),
        ]
        db.add_all(employees)
        db.flush()
        logger.info("Seeded 20 employees")

    # Check and insert leader_lead relationships
    if db.query(LeaderLead).first() is None:
        logger.info("Seeding leader_lead relationships...")
        relationships = [
            LeaderLead(leader_id=1, lead_id=2),   # Alice → Bob
            LeaderLead(leader_id=1, lead_id=3),   # Alice → Carol
            LeaderLead(leader_id=1, lead_id=6),   # Alice → Frank
            LeaderLead(leader_id=1, lead_id=20),  # Alice → Tina
            LeaderLead(leader_id=2, lead_id=4),   # Bob → David
            LeaderLead(leader_id=2, lead_id=5),   # Bob → Eva
            LeaderLead(leader_id=2, lead_id=7),   # Bob → Grace
            LeaderLead(leader_id=2, lead_id=17),  # Bob → Quinn
            LeaderLead(leader_id=2, lead_id=16),  # Bob → Paul
            LeaderLead(leader_id=4, lead_id=8),   # David → Henry
            LeaderLead(leader_id=4, lead_id=12),  # David → Liam
            LeaderLead(leader_id=8, lead_id=10),  # Henry → James
            LeaderLead(leader_id=8, lead_id=11),  # Henry → Karen
            LeaderLead(leader_id=5, lead_id=9),   # Eva → Isabelle
            LeaderLead(leader_id=5, lead_id=13),  # Eva → Mia
            LeaderLead(leader_id=5, lead_id=14),  # Eva → Noah
            LeaderLead(leader_id=3, lead_id=18),  # Carol → Rachel
            LeaderLead(leader_id=3, lead_id=19),  # Carol → Samuel
            LeaderLead(leader_id=6, lead_id=15),  # Frank → Olivia
        ]
        db.add_all(relationships)
        db.flush()
        logger.info("Seeded 19 leader_lead relationships")

    # Check and insert evaluation questions (then correct any drift)
    if db.query(EvaluationQuestion).first() is None:
        logger.info("Seeding evaluation questions...")
        questions = [
            EvaluationQuestion(id=q["id"], title=q["title"], weight=q["weight"], order=q["order"])
            for q in CASE_QUESTIONS
        ]
        db.add_all(questions)
        logger.info("Seeded 6 evaluation questions")

    _correct_questions(db)

    db.commit()
    logger.info("Seed commit completed")
