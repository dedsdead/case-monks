# Data Requirements Quality Checklist

## Data Model & Schema
- [ ] CHK001 Are all entities and their attributes documented with data types and constraints? [Completeness]
- [ ] CHK002 Are relationships between entities (one-to-many, many-to-many) specified? [Completeness]
- [ ] CHK003 Are primary keys, foreign keys, and unique constraints documented? [Completeness]
- [ ] CHK004 Are check constraints (e.g., score range 1-4) specified? [Completeness]

## Data Integrity
- [ ] CHK005 Are referential integrity rules documented (cascade, restrict, set null)? [Completeness]
- [ ] CHK006 Are transactional requirements for multi-table operations specified? [Completeness]
- [ ] CHK007 Are idempotency requirements for seed data operations documented? [Edge Case]

## Data Validation
- [ ] CHK008 Are field-level validation rules documented (length, format, range)? [Clarity]
- [ ] CHK009 Are business rule validations at data layer specified (e.g., unique evaluator-employee-week)? [Completeness]
- [ ] CHK010 Are data sanitization rules for user inputs documented? [Completeness]

## Data Migration & Seeding
- [ ] CHK011 Are data migration strategies from SQL dump to SQLite documented? [Completeness]
- [ ] CHK012 Are seed data requirements (employees, hierarchy, questions) specified? [Completeness]
- [ ] CHK013 Are idempotent seed operations documented (check before insert)? [Edge Case]

## Data Storage & Performance
- [ ] CHK014 Are SQLite configuration requirements (WAL mode, pragmas) documented? [Completeness]
- [ ] CHK015 Are indexing strategies for query performance specified? [Completeness]
- [ ] CHK016 Are caching requirements (CTE caching with TTL) documented? [Completeness]

## Data Lifecycle
- [ ] CHK017 Are data retention policies for evaluations specified? [Completeness]
- [ ] CHK018 Are immutability requirements for submitted evaluations documented? [Completeness]
- [ ] CHK019 Are data archival or cleanup strategies specified? [Completeness]

## Data Consistency
- [ ] CHK020 Are consistency requirements between frontend and backend data models documented? [Consistency]
- [ ] CHK021 Are data synchronization requirements for real-time updates specified? [Completeness]
- [ ] CHK022 Are conflict resolution strategies for concurrent updates documented? [Edge Case]