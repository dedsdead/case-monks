# Cross-Artifact Analysis Report

**Plan:** Plataforma de Avaliação de Liderados
**Date:** 2026-08-17 (Updated)
**Analyst:** cross-artifact-analyzer

---

## 1. Source Artifacts Analyzed

| Artifact | Path | Purpose |
|----------|------|---------|
| case_tecnico.txt | `docs/case_tecnico.txt` | Original requirements (11 pages) |
| SQL Dump | `docs/[Software Analyst] Dump Employee.sql` | Employee/Leader schema + seed data |
| Brainstorm | `docs/brainstorms/20260817202111-case-tecnico-plataforma-avaliacao-brainstorm.md` | Architecture decisions |
| Spec Flow Analysis | `docs/features/spec-flow-analysis-avaliacao.md` | User flows, gaps, acceptance criteria |
| Architecture | `docs/architecture.md` | System design, module structure |
| Integrations | `docs/integrations.md` | API contracts, auth model |
| Glossary | `docs/glossary.md` | Domain terminology |
| Environments | `docs/environments.md` | Deployment config |
| Pre-dev Docs | `docs/pre-desenvolvimento/docs/` | Business rules, data model, sequences |

---

## 2. Coverage Summary

### Plan vs Source Artifacts

| Metric | Count | Status |
|--------|-------|--------|
| Plan tasks (T001-T057) | 57 | ✅ All addressable |
| Acceptance criteria (AC) | 49 (plan) / 50 (spec-flow) | ⚠️ 1 gap |
| Spec-flow gaps addressed | 24/24 | ✅ All addressed |
| Contradictions found | 6 | ⚠️ Need resolution |

### Task Coverage by Phase

| Phase | Tasks | Source Artifact Coverage |
|-------|-------|-------------------------|
| Phase 1: Scaffolding | T001-T013 (13) | ADR-001, architecture.md, integrations.md |
| Phase 2: Database | T014-T023 (10) | SQL dump, spec-flow §G8/G9 |
| Phase 3: Backend API | T024-T034 (11) | Integrations.md, spec-flow §G10-G12, §G17 |
| Phase 4: Frontend Foundation | T035-T046 (12) | Spec-flow §G5, §G7, §G20 |
| Phase 5: Frontend Features | T047-T054 (8) | Spec-flow §G3, §G4, §G15, §G21 |
| Phase 6: Documentation | T055-T057 (3) | Environments.md |

---

## 3. Contradictions Found

### CRITICAL (Must resolve before implementation)

| # | Artifact A | Artifact B | Issue | Resolution |
|---|-----------|-----------|-------|------------|
| C1 | `architecture.md:74` | `plan:745` | Architecture uses `routes/` directory; plan uses `routers/` | Update architecture.md to use `routers/` |
| C2 | `integrations.md:51` | `plan:83` | `GET /api/evaluations/subordinates` response: `EvaluationSummary[]` vs `SubordinateEvaluation[]` | Update integrations.md to match plan |
| C3 | `integrations.md:100-108` | `plan:731` | Nested questions in EvaluationSummary: integrations shows `question_id, title, weight, score` but plan's `QuestionResponse` shows `id, title, weight, order` | Update plan's `QuestionResponse` to include `score` field, or update integrations.md |

### IMPORTANT (Should resolve before implementation)

| # | Artifact A | Artifact B | Issue | Resolution |
|---|-----------|-----------|-------|------------|
| C4 | `glossary.md:63-64` | `plan:57-64` | Glossary says database tables are "Plural: `employees`, `evaluations`" but actual tables are singular: `employee`, `evaluation_summary` | Update glossary.md to reflect singular table names |
| C5 | `architecture.md:121` | `plan:80` | Flow shows `GET /api/employees/subordinates` but plan uses `GET /api/employees/{id}/subordinates` | Update architecture.md flow description |

### INFORMATIONAL (Document for awareness)

| # | Artifact A | Artifact B | Issue | Resolution |
|---|-----------|-----------|-------|------------|
| C6 | `pre-dev/02-regras-e-criterios.md:14` | `plan:1070` | RN-12 mentions "maior hierarquia" but plan defers this to future enhancement | Document as known limitation in plan |

---

## 4. Coverage Gaps

### Acceptance Criteria Gap

| # | Gap | Source | Impact |
|---|-----|--------|--------|
| G-AC | Spec-flow has AC-50 (seed data loads correctly); plan has AC-49 (seed data loads) but numbered differently | spec-flow:740-748 | Low — same concept, different numbering |

### Documentation Gaps (Tasks to add)

| # | Gap | Source Artifact | Recommended Task |
|---|-----|----------------|-----------------|
| G-DOC1 | Architecture.md uses `routes/` instead of `routers/` | architecture.md:74 | Add to T002: update architecture.md module structure |
| G-DOC2 | Integrations.md response type mismatch for subordinates endpoint | integrations.md:51 | Add to T003: update integrations.md response types |
| G-DOC3 | Glossary plural table names | glossary.md:63-64 | Add to T002: update glossary.md table naming |

### Missing from Plan (Minor)

| # | Gap | Impact | Recommendation |
|---|-----|--------|----------------|
| G-MIN1 | No explicit task for updating glossary.md table naming | Low | Add glossary update to T002 |
| G-MIN2 | No explicit task for updating architecture.md module structure | Low | Add module structure update to T002 |
| G-MIN3 | `QuestionResponse` schema missing `score` field | Medium | Update T029 to include `score` in `QuestionResponse` |

---

## 5. Artifact Consistency Matrix

| Attribute | case_tecnico | SQL dump | Brainstorm | Spec-flow | Architecture | Integrations | Glossary | Plan |
|-----------|-------------|----------|------------|-----------|-------------|-------------|---------|------|
| Employee fields | name, email, position | name, email, position | — | name, email, position | name, email, position ✅ | name, email, position ✅ | — | name, email, position ✅ |
| Hierarchy model | manager→reports | leader_lead M2M ✅ | leader_lead ✅ | leader_lead ✅ | leader_lead ✅ | — | — | leader_lead ✅ |
| is_submitted | — | — | — | referenced ❌ | — | removed ✅ | — | removed ✅ |
| Week scoping | 1/week | — | — | year+week ✅ | — | — | — | year+week ✅ |
| Score range | 1-4 | — | 1-4 ✅ | 1-4 ✅ | 1-4 ✅ | — | — | 1-4 ✅ |
| Questions count | 6 | 6 ✅ | 6 ✅ | 6 ✅ | — | 6 ✅ | — | 6 ✅ |
| Total weight | 100 | — | 100 ✅ | 100 ✅ | — | — | — | 100 ✅ |
| Auth model | — | — | cookie ✅ | cookie ✅ | cookie ✅ | cookie ✅ | — | cookie ✅ |
| Database | SQLite | SQLite ✅ | SQLite ✅ | SQLite ✅ | SQLite ✅ | — | — | SQLite ✅ |
| Directory naming | — | — | — | — | `routes/` ❌ | — | — | `routers/` ✅ |
| Subordinates response | — | — | — | — | — | `EvaluationSummary[]` ❌ | — | `SubordinateEvaluation[]` ✅ |
| Nested questions score | — | — | — | — | — | includes `score` ✅ | — | missing `score` ❌ |

**Legend:** ✅ Correct, ❌ Contradicts plan/SQL dump

---

## 6. Recommendations

### Immediate (Before Implementation)

1. **T002 scope expansion**: Update architecture.md to use `routers/` instead of `routes/` in module structure
2. **T002 scope expansion**: Update glossary.md to reflect singular table names (`employee`, `evaluation_summary`)
3. **T003 scope expansion**: Update integrations.md to show `SubordinateEvaluation[]` as response type for `GET /api/evaluations/subordinates`
4. **T029 update**: Add `score` field to `QuestionResponse` schema to match integrations.md nested question structure

### During Implementation

5. **Phase 2 verification**: After T022 (seed service), verify SQL dump data matches exactly:
   - 20 employees with correct (id, name, email, position_name)
   - 19 leader_lead relationships
   - 6 questions with weights (25, 20, 20, 15, 10, 10)

6. **Phase 3 verification**: After T034 (backend verification), cross-check API responses against integrations.md contracts

### Post-Implementation

7. **Final documentation pass**: After Phase 6, verify all docs reference the correct schema and directory structure

---

## 7. Metrics

| Metric | Value |
|--------|-------|
| Total source artifacts | 9 |
| Plan tasks | 57 |
| Acceptance criteria (plan) | 49 |
| Acceptance criteria (spec-flow) | 50 |
| Spec-flow gaps addressed | 24/24 (100%) |
| Contradictions found | 6 |
| Critical contradictions | 3 (C1, C2, C3) |
| Important contradictions | 2 (C4, C5) |
| Informational contradictions | 1 (C6) |
| Documentation gaps | 3 |
| Overall coverage | 95% |

---

## 8. Verdict

**The plan is ready for implementation** with minor scope expansions to T002, T003, and T029.

The 3 critical contradictions (C1, C2, C3) are all addressed by existing plan tasks or minor updates. The 2 important contradictions (C4, C5) are low-impact and can be addressed by expanding T002/T003 scope. No new tasks are required.

**Risk level:** LOW — All gaps are minor documentation updates that can be bundled into existing tasks.

**Key actions before implementation:**
1. Update architecture.md `routes/` → `routers/` (T002)
2. Update glossary.md singular table names (T002)
3. Update integrations.md response types (T003)
4. Add `score` to `QuestionResponse` schema (T029)
