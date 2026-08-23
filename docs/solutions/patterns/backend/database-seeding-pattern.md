---
title: "Database Seeding Pattern — Project Pattern"
problem_type: pattern
category: backend
components:
  - backend
  - database
  - fastapi
  - sqlalchemy
tags:
  - patterns
  - database
  - seeding
  - migrations
  - sqlite
module: database
date: 2026-08-19
established_in: "Implemented during database setup and seeding issues resolution"
---

# Pattern: Database Seeding Pattern

## Problem / When to Use This

When developing FastAPI applications with SQLite databases, you need a reliable approach to initialize database tables and populate them with seed data. This pattern addresses common issues like migration hangs, database setup failures, and partial seeding problems that can occur during development and deployment.

## Source of Truth Files

- `repos/backend/manual_setup.py` - Manual database setup script
- `repos/backend/app/services/seed.py` - Database seeding service
- `repos/backend/app/main.py` - Application lifespan with seeding
- `repos/backend/alembic.ini` - Alembic configuration
- `repos/backend/requirements.txt` - Database dependencies

## Current Implementation Snapshot

- Manual database setup script to avoid Alembic migration hang
- Idempotent seeding service that checks existing data
- Application lifespan integration for automatic seeding
- Proper error handling and logging for database operations
- WAL mode enabled for better SQLite performance
- Comprehensive seed data including employees, relationships, and evaluation questions

## Planned / Optional Extensions (If Applicable)

- Add environment-specific seed data
- Implement seed data versioning
- Add database backup and restore functionality
- Include data validation in seeding process

## Pattern Overview

A robust approach to database initialization and seeding for FastAPI applications with SQLite, avoiding common migration issues while ensuring reliable data population with proper error handling and logging.

## Implementation Steps

### Step 1: Create Manual Database Setup Script

[File to create or modify: `repos/backend/manual_setup.py`]

```python
#!/usr/bin/env python3
"""
Manual database setup script to avoid Alembic migration hang
"""
import sqlite3
import os
from pathlib import Path

def setup_database():
    """Create database tables manually"""
    db_path = Path("/app/data/casetecnico.db")
    
    # Remove existing database if it exists
    if db_path.exists():
        db_path.unlink()
    
    # Create database directory
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Enable WAL mode
    cursor.execute("PRAGMA journal_mode=WAL")
    
    # Create employee table
    cursor.execute("""
        CREATE TABLE employee (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            position_name VARCHAR(100) NOT NULL
        )
    """)
    
    # Create evaluation_question table
    cursor.execute("""
        CREATE TABLE evaluation_question (
            id INTEGER PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            weight INTEGER NOT NULL CHECK (weight > 0),
            "order" INTEGER NOT NULL CHECK ("order" > 0)
        )
    """)
    
    # Create alembic_version table manually
    cursor.execute("""
        CREATE TABLE alembic_version (
            version_num VARCHAR(32) NOT NULL PRIMARY KEY
        )
    """)
    
    # Insert current migration version
    cursor.execute("INSERT INTO alembic_version (version_num) VALUES ('40e92ce529bf')")
    
    conn.commit()
    conn.close()
    
    print("Database setup completed successfully")
```

Key points:
- Use manual setup to avoid Alembic migration hang
- Enable WAL mode for better SQLite performance
- Create alembic_version table manually for migration tracking
- Handle database directory creation and cleanup

### Step 2: Create Database Seeding Service

[File to create or modify: `repos/backend/app/services/seed.py`]

```python
"""Seed data service for initial database population."""

import logging

from sqlalchemy.orm import Session

from app.models.employee import Employee, LeaderLead
from app.models.evaluation_question import EvaluationQuestion

logger = logging.getLogger(__name__)


def seed_database(db: Session) -> None:
    """Populate database with seed data (idempotent).

    Inserts 20 employees, 19 leader_lead relationships, and 6 evaluation questions.
    Checks each table independently to handle partial-seed recovery.
    """
    # Check and insert employees
    if db.query(Employee).first() is None:
        logger.info("Seeding employees...")
        employees = [
            Employee(id=1, name="Alice Hartman", email="alice.hartman@company.com", position_name="CEO"),
            Employee(id=2, name="Bob Sinclair", email="bob.sinclair@company.com", position_name="CTO"),
            # ... more employees
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
            # ... more relationships
        ]
        db.add_all(relationships)
        db.flush()
        logger.info("Seeded 19 leader_lead relationships")

    # Check and insert evaluation questions
    if db.query(EvaluationQuestion).first() is None:
        logger.info("Seeding evaluation questions...")
        questions = [
            EvaluationQuestion(id=1, title="Entrega de Resultados", weight=25, order=1),
            EvaluationQuestion(id=2, title="Trabalho em Equipe", weight=20, order=2),
            # ... more questions
        ]
        db.add_all(questions)
        logger.info("Seeded 6 evaluation questions")

    db.commit()
    logger.info("Seed commit completed")
```

Key points:
- Make seeding idempotent by checking existing data
- Handle each table independently for partial recovery
- Use proper logging for debugging seeding issues
- Flush before commit to catch errors early

### Step 3: Integrate Seeding into Application Lifespan

[File to create or modify: `repos/backend/app/main.py`]

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: setup database manually, then seed database."""
    os.makedirs("data", exist_ok=True)
    try:
        # Import and run manual database setup
        from manual_setup import setup_database
        setup_database()
        logger.info("Database setup completed successfully")
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise

    session = SessionLocal()
    try:
        seed_database(session)
        logger.info("Database seeding completed successfully")
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        raise
    finally:
        session.close()

    yield
```

Key points:
- Handle database setup in lifespan context
- Include proper error handling and logging
- Use try/finally for resource cleanup
- Raise exceptions to fail fast if setup fails

## Complete Example

```python
# manual_setup.py
def setup_database():
    db_path = Path("/app/data/casetecnico.db")
    if db_path.exists():
        db_path.unlink()
    
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("CREATE TABLE employee (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL)")
    cursor.execute("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)")
    cursor.execute("INSERT INTO alembic_version (version_num) VALUES ('40e92ce529bf')")
    
    conn.commit()
    conn.close()

# seed.py
def seed_database(db: Session) -> None:
    if db.query(Employee).first() is None:
        employees = [Employee(id=1, name="Alice Hartman", email="alice@company.com")]
        db.add_all(employees)
        db.flush()
    db.commit()

# main.py
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
```

## Project-Specific Constraints

- [ ] Use manual setup to avoid Alembic migration hang
- [ ] Enable WAL mode for SQLite performance
- [ ] Make seeding idempotent and handle partial failures
- [ ] Include proper error handling and logging
- [ ] Create alembic_version table manually

## Anti-Patterns (What NOT to Do)

- ❌ Don't rely on Alembic migrations for initial setup (can hang)
- ❌ Don't seed without checking existing data (causes duplicates)
- ❌ Don't forget to handle exceptions in database operations
- ❌ Don't skip WAL mode for SQLite (poor performance)
- ❌ Don't commit without flushing (errors not caught early)

## Related Patterns / Docs

- [Backend Service Debugging Pattern](./backend-service-debugging-pattern.md)
- [Authentication Debugging Pattern](./authentication-debugging-pattern.md)

## Safe Change Checklist for Future AI Work

1. Update manual_setup.py when adding new tables
2. Update seed.py when adding new seed data
3. Test seeding after any model changes
4. Verify alembic_version is updated after migrations
5. Check that WAL mode is enabled for all SQLite operations