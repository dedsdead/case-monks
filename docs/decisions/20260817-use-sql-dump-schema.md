# ADR-001: Use SQL Dump Schema for Employee Model

**Date:** 2026-08-17
**Status:** Accepted
**Deciders:** Case Tecnico Team

## Context

The project has two conflicting employee schema definitions:

1. **Architecture.md schema:** `employee` table with `first_name`, `last_name`, `job_title`, `department`, `hire_date`, `manager_id` (FK)
2. **SQL Dump schema:** `employee` table with `id`, `name`, `email`, `position_name` + `leader_lead` M2M table

The SQL dump represents the actual data source for the application. The architecture.md schema was a preliminary design that doesn't match the real data.

## Decision

Use the SQL dump schema as the source of truth:

- **Employee model:** `(id, name, email, position_name)`
- **Hierarchy model:** `leader_lead` M2M table with `(leader_id, lead_id)` composite PK
- **No `manager_id` FK** — hierarchy is fully represented by the M2M table

## Consequences

### Positive
- Matches actual data source (SQL dump)
- Simplifies seed data — direct import from dump
- M2M table supports multiple managers per employee (future-proof)
- Recursive CTE queries work naturally with M2M structure

### Negative
- All documentation updated to reflect new schema
- `manager_id` FK approach abandoned
- Initial architecture.md and integrations.md required updates (completed in T002/T003)

## References

- `docs/[Software Analyst] Dump Employee.sql` — source data
- `docs/features/spec-flow-analysis-avaliacao.md` §G1, §G2 — schema conflict identification
- `docs/pre-desenvolvimento/docs/06-modelo-dados.puml` — updated data model
