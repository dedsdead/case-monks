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
    
    # Create evaluation_summary table
    cursor.execute("""
        CREATE TABLE evaluation_summary (
            id INTEGER PRIMARY KEY,
            employee_id INTEGER NOT NULL,
            evaluator_id INTEGER NOT NULL,
            total_score NUMERIC(3,1) NOT NULL,
            evaluation_date DATETIME NOT NULL,
            evaluation_year INTEGER NOT NULL,
            week_number INTEGER NOT NULL,
            UNIQUE(evaluator_id, employee_id, evaluation_year, week_number),
            FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
            FOREIGN KEY (evaluator_id) REFERENCES employee(id) ON DELETE CASCADE
        )
    """)
    
    # Create leader_lead table
    cursor.execute("""
        CREATE TABLE leader_lead (
            leader_id INTEGER NOT NULL,
            lead_id INTEGER NOT NULL,
            PRIMARY KEY (leader_id, lead_id),
            CHECK (leader_id <> lead_id),
            FOREIGN KEY (leader_id) REFERENCES employee(id) ON DELETE CASCADE,
            FOREIGN KEY (lead_id) REFERENCES employee(id) ON DELETE CASCADE
        )
    """)
    
    # Create evaluation_response table
    cursor.execute("""
        CREATE TABLE evaluation_response (
            id INTEGER PRIMARY KEY,
            evaluation_summary_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 4),
            UNIQUE(evaluation_summary_id, question_id),
            FOREIGN KEY (evaluation_summary_id) REFERENCES evaluation_summary(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES evaluation_question(id) ON DELETE RESTRICT
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX ix_eval_summary_latest ON evaluation_summary(employee_id, evaluator_id, evaluation_date)")
    cursor.execute("CREATE INDEX ix_leader_lead_reverse ON leader_lead(lead_id)")
    cursor.execute("CREATE INDEX ix_eval_response_question ON evaluation_response(question_id)")
    
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

if __name__ == "__main__":
    setup_database()