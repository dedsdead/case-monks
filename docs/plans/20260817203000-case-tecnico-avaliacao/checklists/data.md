# Data Quality Checklist

**Plan:** Plataforma de Avaliação de Liderados
**Generated:** 2026-08-17 (regenerated)

---

## Schema Completeness

- [ ] CHK119 Are all 5 tables specified with complete column definitions (Employee, LeaderLead, EvaluationQuestion, EvaluationResponse, EvaluationSummary)? [Completeness]
- [ ] CHK120 Are all foreign key relationships specified (EvaluationResponse -> EvaluationSummary, EvaluationResponse -> EvaluationQuestion, EvaluationSummary -> Employee x2, LeaderLead -> Employee x2)? [Completeness]
- [ ] CHK121 Is the Employee model aligned with the SQL dump schema (id, name, email, position_name)? [Consistency]
- [ ] CHK122 Is the LeaderLead model specified as M2M junction table with composite PK? [Completeness]
- [ ] CHK123 Is the evaluation_year field specified on EvaluationSummary (not on EvaluationResponse)? [Completeness]

## Constraints

- [ ] CHK124 Is the unique constraint on (evaluator_id, employee_id, evaluation_year, week_number) specified for EvaluationSummary? [Completeness]
- [ ] CHK125 Is the unique constraint on (evaluation_summary_id, question_id) specified for EvaluationResponse? [Completeness]
- [ ] CHK126 Is the CHECK constraint (leader_id <> lead_id) specified for LeaderLead? [Completeness]
- [ ] CHK127 Is the unique constraint on Employee.email specified? [Completeness]
- [ ] CHK128 Is the score range constraint (1-4) specified at the application layer? [Completeness]

## Indexes

- [ ] CHK129 Is the composite index on (evaluator_id, employee_id, evaluation_year, week_number) specified for weekly limit queries? [Completeness]
- [ ] CHK130 Is the composite index on (employee_id, evaluator_id) specified for evaluation lookups? [Completeness]
- [ ] CHK131 Is the composite index on (employee_id, evaluator_id, evaluation_date) specified for latest-evaluation queries? [Completeness]
- [ ] CHK132 Is the reverse index on LeaderLead.lead_id specified? [Completeness]
- [ ] CHK133 Is the index on EvaluationResponse.question_id specified? [Completeness]

## Seed Data

- [ ] CHK134 Are the 20 employees from the SQL dump specified with correct columns (id, name, email, position_name)? [Completeness]
- [ ] CHK135 Are the 19 leader_lead relationships specified with correct hierarchy? [Completeness]
- [ ] CHK136 Are the 6 evaluation questions specified with titles, weights (25,20,20,15,10,10), and order? [Completeness]
- [ ] CHK137 Is the seed data idempotency specified (check-before-insert or OR IGNORE)? [Completeness]
- [ ] CHK138 Is the total weight sum (100) verified in the seed data specification? [Consistency]

## Migration Safety

- [ ] CHK139 Is the Alembic render_as_batch=True setting specified (required for SQLite)? [Completeness]
- [ ] CHK140 Is the migration generation command specified (alembic revision --autogenerate)? [Completeness]
- [ ] CHK141 Is the immediate migration execution specified (alembic upgrade head) to prevent schema drift? [Completeness]
- [ ] CHK142 Is the migration separated from seed data (schema in migration, data in seed service)? [Clarity]

## Data Integrity

- [ ] CHK143 Is the weighted score calculation formula specified (sum(score * weight) / 100, rounded to 2 decimals)? [Clarity]
- [ ] CHK144 Is the ISO 8601 week number calculation specified (datetime.isocalendar())? [Completeness]
- [ ] CHK145 Is the year-scoped weekly limit specified (evaluation_year + week_number pair)? [Completeness]
- [ ] CHK146 Is the immutability of evaluations specified (no update/delete operations)? [Completeness]

## SQLite Configuration

- [ ] CHK147 Is WAL mode (PRAGMA journal_mode=WAL) specified? [Completeness]
- [ ] CHK148 Is synchronous=NORMAL specified? [Completeness]
- [ ] CHK149 Is busy_timeout=5000 specified? [Completeness]
- [ ] CHK150 Is foreign_keys=ON specified (SQLite disables FKs by default)? [Completeness]
- [ ] CHK151 Is cache_size=-64000 (64MB) specified for page cache? [Completeness]
- [ ] CHK152 Is check_same_thread=False specified for FastAPI thread pool? [Completeness]

## Schema Consistency

- [ ] CHK153 Is the EvaluationSummary schema consistent between the data model section, model task (T016), Pydantic schema (T029), and TypeScript types (T035)? [Consistency]
- [ ] CHK154 Is the Employee schema consistent between architecture.md, integrations.md, and the model task (T014)? [Consistency]
- [ ] CHK155 Is the EvaluationResponse schema consistent between model task (T017) and any response schemas? [Consistency]

## CTE Hierarchy Data

- [ ] CHK156 Is the `depth` field (int) tracked in the CTE query for hierarchy-depth sorting? [Completeness]
- [ ] CHK157 Is the CTE anchor correctly defined as direct reports (leader_lead WHERE leader_id = :leader_id)? [Completeness]
- [ ] CHK158 Is the CTE recursive step correctly joining leader_lead to the CTE alias? [Completeness]
- [ ] CHK159 Is the SubordinateEvaluationResponse schema consistent with the depth field from the CTE? [Consistency]
