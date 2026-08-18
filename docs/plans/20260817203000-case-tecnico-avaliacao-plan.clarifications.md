# Clarifications — Plataforma de Avaliação de Liderados

## Source Plan
- `docs/plans/20260817203000-case-tecnico-avaliacao-plan.md`

## Session 2026-08-17

### Ambiguity Scan Results

| # | Category | Status | Notes |
|---|----------|--------|-------|
| 1 | Functional scope & success criteria | ✅ Clear | 49 ACs with Given/When/Then, 6 phases with objectives |
| 2 | Domain/data model & lifecycle | ⚠️ Partial | Data model clear; EvaluationSummary↔Response relationship implicit |
| 3 | UX/interaction flows | ⚠️ Partial | Empty/loading/error states covered; sort order, employee list scope unclear |
| 4 | NFRs (security, performance, reliability) | ⚠️ Partial | Security documented; CTE caching mentioned but not assigned to task |
| 5 | Integration boundaries & failure modes | ✅ Clear | API contracts, error codes, CORS, health check all specified |
| 6 | Edge cases & concurrency | ⚠️ Partial | Weekly limit, self-eval, hierarchy covered; multi-leader edge not addressed |
| 7 | Terminology consistency | ⚠️ Partial | Mixed Portuguese/English in UI; "Líder"/"Leader" used interchangeably |
| 8 | Completion signals | ✅ Clear | Phase checklists, master checklist, verification steps |

### Questions Asked

---

#### Q1: CTE Caching — Implement or Skip?

**Context:** Plan line 108 mentions "Cache subordinate sets per leader (5-min TTL) to avoid redundant CTE execution" but no task (T001-T057) implements this. This is a non-trivial feature (cache invalidation, TTL management) that adds complexity.

**Options:**
- **A) Skip caching** (Recommended) — SQLite CTE with 20 employees is fast enough for demo. Keep it simple.
- **B) Implement basic caching** — Add `functools.lru_cache` with TTL to `get_all_subordinates()`. ~10 lines of code.
- **C) Implement Redis caching** — Overkill for demo; adds infrastructure dependency.

**Recommendation:** Option A. The CTE runs in <50ms for 20 employees. Caching adds complexity with zero perceptible benefit for a demo.

**Final Answer:** Option B — Implement basic caching with dict-based TTL (5-min expiry, invalidation on write).

**Impact on Plan:** Updated T026 with `_subordinate_cache` dict, `time.time()` expiry check, and `_subordinate_cache.clear()` on write operations.

---

#### Q2: Subordinate List Sort Order

**Context:** AC-6 through AC-9 describe the subordinate list but never specify sort order. When Alice sees 18 subordinates, in what order do they appear?

**Options:**
- **A) Alphabetical by name** (Recommended) — Most intuitive for users; easy to implement.
- **B) By hierarchy depth** — CEO first, then direct reports, then indirect. More complex.
- **C) By employee ID** — Matches SQL dump order. Simple but unintuitive.
- **D) No specific order** — Let backend return arbitrary order. Acceptable for demo.

**Recommendation:** Option A. Alphabetical is the standard UX pattern for employee lists.

**Final Answer:** Option B — By hierarchy depth (CEO first, then direct reports, then indirect).

**Impact on Plan:** Update T027 `get_subordinate_evaluations` to include a `depth` column in the CTE (recursive depth tracking) and ORDER BY depth ASC. Update T045 to display hierarchy level indicator.

---

#### Q3: Employee Email Visibility in UI

**Context:** The Employee model includes `email` (VARCHAR(150) UNIQUE). The plan specifies API returns `Employee[]` with all fields. But AC-8 only mentions showing "employee name, position_name" in the list. Should email be visible in the UI?

**Options:**
- **A) Hide email in UI** (Recommended) — Email is in API response for future use but not displayed. Keeps UI clean.
- **B) Show email in list** — Display as secondary text under name. Useful for identification.
- **C) Show email in detail view only** — Not in list, but visible when evaluating.

**Recommendation:** Option A. The case técnico requirements don't mention email display. Keep the UI focused on name + position.

**Final Answer:** Option A — Hide email in UI. Email is in API response but not rendered.

**Impact on Plan:** Clarify in T045 that email is not rendered in the EmployeeList component. No task change needed.

---

#### Q4: Evaluation Form — Employee Not in Subordinate Tree

**Context:** AC-20 covers "Non-subordinate evaluation blocked" (403). But what happens in the UI when a user navigates to `/evaluate/:employeeId` and the employee is NOT in their subordinate tree? The plan says T047 should "validate employee is in subordinate list (redirect if not)" but doesn't specify the exact UX.

**Options:**
- **A) Redirect to home with toast** (Recommended) — Show "Voce nao tem acesso" toast, redirect to `/`. Consistent with AC-20.
- **B) Show 403 page** — Dedicated "Access Denied" page. More formal.
- **C) Show inline error** — Keep on page, show error message. Confusing for user.

**Recommendation:** Option A. Matches the pattern used in AC-19 (self-eval) and is consistent with the redirect behavior described in AC-20.

**Final Answer:** Option A — Redirect to home with toast. Consistent with AC-19 and AC-20 patterns.

**Impact on Plan:** Clarify in T047: "On 403: show toast 'Voce nao tem acesso para avaliar este funcionario', redirect to `/`". No new task needed.

---

#### Q5: Project "Done" Definition

**Context:** The plan has 6 phases with completion checklists, but no overall "project done" criteria. When can we say the case técnico is complete?

**Options:**
- **A) All 49 ACs pass manually** (Recommended) — Run through each AC, verify it works. Document results.
- **B) Docker Compose starts + seed data loads** — Minimum viable "it works" criteria.
- **C) All tasks checked off** — Every T001-T057 marked complete. Most thorough.
- **D) End-to-end demo flow works** — Select identity → evaluate → view history. Minimum demo.

**Recommendation:** Option A. The 49 ACs are the contract. If all pass, the project is done.

**Final Answer:** Option A — All 49 ACs pass manually. The ACs are the contract.

**Impact on Plan:** Add "Done Criteria" section to Phase 6: "All 49 acceptance criteria verified manually. Document results in verification log."

---

## Coverage Summary

| Category | Status | Notes |
|----------|--------|-------|
| Functional scope & success criteria | ✅ Clear | No action needed |
| Domain/data model & lifecycle | ✅ Resolved | Q5 (done criteria) + depth field added to data model |
| UX/interaction flows | ✅ Resolved | Q2 (sort order), Q3 (email hidden), Q4 (403 UX) all resolved |
| NFRs | ✅ Resolved | Q1 (CTE caching) resolved with basic lru_cache implementation |
| Integration boundaries & failure modes | ✅ Clear | No action needed |
| Edge cases & concurrency | ✅ Resolved | Multi-leader inherent in M2M; weekly limit handles concurrency |
| Terminology consistency | ✅ Acceptable | Portuguese UI, English code — consistent within each context |
| Completion signals | ✅ Resolved | Q5 formalized: all 49 ACs must pass manually |

## Deferred Items

1. **Multi-leader edge case**: Employee with multiple leaders — the M2M model supports this inherently. No special handling needed; the CTE traverses all paths. Low risk for demo with 20 employees.
2. **Terminology standardization**: "Líder"/"Leader" mixed use is acceptable — Portuguese for UI, English for code. No action needed.
3. **Observability/logging**: Not in scope for demo. Documented as limitation.

---

## Session 2026-08-17 (Post-Review Clarifications)

### Questions Asked

---

#### Q6: EvaluationSummary Response Shape

**Context:** The plan's `EvaluationSummaryResponse` (T029) does NOT include nested question data, but `integrations.md` shows a `questions` array. Which is correct for the API contract?

**Options:**
- **A) Plan is correct (no nested questions)** — EvaluationSummaryResponse returns only summary fields; question details fetched separately or computed client-side.
- **B) Integrations.md is correct (nested questions)** (Recommended) — Add `questions` array to EvaluationSummaryResponse for history view.
- **C) Create separate endpoint for history detail** — Add `GET /api/evaluations/{id}/responses` for per-question breakdown.

**Recommendation:** Option B. The frontend needs per-question breakdown for history view (AC-30). Including nested questions in the summary response simplifies the frontend and reduces API calls.

**Final Answer:** Option B — Integrations.md is correct. Add `questions` array to EvaluationSummaryResponse.

**Impact on Plan:** Update T029 `EvaluationSummaryResponse` to include `questions: list[QuestionResponse]`. Update T035 frontend type `EvaluationSummary` to include `questions`. Update T027 `get_evaluation_history` to join question responses. Update T051 `EvaluationHistory` component to use nested data.

---

#### Q7: RN-12 Implementation

**Context:** Business rule RN-12 says the subordinate list should show evaluation from the highest-ranking evaluator, but the plan's implementation shows only the current leader's evaluations. Which behavior should be implemented?

**Options:**
- **A) Follow plan (current leader only)** (Recommended) — Show only the logged-in leader's evaluations for each subordinate.
- **B) Follow RN-12 (highest hierarchy)** — Show evaluation from the highest-ranking leader in the hierarchy.
- **C) Defer RN-12 to future enhancement** — Implement current leader only now, note RN-12 as future work.

**Recommendation:** Option A. The plan's implementation is simpler and matches the case técnico requirements. RN-12 can be documented as a future enhancement.

**Final Answer:** Option A — Follow plan (current leader only). RN-12 is not implemented in this version.

**Impact on Plan:** Update `docs/pre-desenvolvimento/docs/02-regras-e-criterios.md` to clarify RN-12 is a future enhancement. No plan task changes needed.

---

#### Q8: Subordinate List Nested Questions

**Context:** Should the `GET /api/evaluations/subordinates` endpoint include nested question data in the `latest_evaluation` field, or keep it lightweight (summary only)?

**Options:**
- **A) Summary only (lightweight)** — `latest_evaluation` contains only summary fields, no nested questions. History endpoint includes questions.
- **B) Include nested questions** (Recommended) — `latest_evaluation` includes full question breakdown (consistent with history view).

**Recommendation:** Option B. Consistent with the decision in Q6. The subordinate list can show the latest evaluation's question breakdown, providing more context to the leader.

**Final Answer:** Option B — Include nested questions in subordinate list.

**Impact on Plan:** Update T027 `get_subordinate_evaluations` to join question responses for the latest evaluation. Update T045 `EmployeeList` to display question breakdown if needed (or keep summary view).

---

### Coverage Summary

| Category | Status | Notes |
|----------|--------|-------|
| Functional scope & success criteria | ✅ Clear | No action needed |
| Domain/data model & lifecycle | ✅ Resolved | Q6 (nested questions) updates data model |
| UX/interaction flows | ✅ Resolved | Q8 (subordinate list payload) affects UI |
| NFRs | ✅ Clear | No action needed |
| Integration boundaries & failure modes | ✅ Clear | No action needed |
| Edge cases & concurrency | ✅ Resolved | Q7 (RN-12) clarifies future enhancement |
| Terminology consistency | ✅ Acceptable | No action needed |
| Completion signals | ✅ Clear | No action needed |

### Updated Deferred Items

4. **RN-12 highest-hierarchy evaluation display**: Deferred to future enhancement. Current implementation shows only logged-in leader's evaluations.
5. **Observability/logging**: Not in scope for demo. Documented as limitation.
