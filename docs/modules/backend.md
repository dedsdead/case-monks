# Backend Module

## Purpose
Main backend with API and business logic.

## Source of Truth
- `repos/backend/app/main.py`

## Implementation
- ✅ Data validation added
- ✅ Error handling robust
- ✅ Endpoints implemented
- ✅ Health check endpoint (`/api/health`)
- ✅ Cookie debugging endpoint (`/api/test-cookies`, gated: 404 unless `settings.DEBUG=true`)
- ✅ Input sanitization functions implemented
- ✅ Comprehensive error handling with detailed logging
- ✅ Request cancellation support

## Key Improvements
### Enhanced Error Handling
- Added input validation functions (`validate_employee_id`, `validate_question_id`, `validate_score`)
- Implemented input sanitization (`sanitize_input`) to prevent security issues
- Added comprehensive error logging with traceback information
- Graceful handling of individual question/summary processing errors
- Fixed `create_evaluation` to remove `db.begin()` block that caused 500 errors

### Hierarchy Access Fix (2026-08-20)
- **Fixed**: `validate_hierarchy_access` was calling `is_ancestor_of` with wrong parameter order
- **Bug**: `is_ancestor_of(current_employee.id, target_employee_id, db)` — `db` (Session) was last instead of first
- **Fix**: `is_ancestor_of(db, current_employee.id, target_employee_id)` — `db` is now first param
- **Gotcha**: `is_ancestor_of(db: Session, ancestor_id: int, descendant_id: int)` — Session is always first. Getting parameter order wrong causes silent 500 errors.

### Recursive CTE Query Error Handling (2026-08-20)
- **Fixed**: `get_all_subordinates_with_depth` now has comprehensive error handling
- **Improvements**:
  - Added try/except blocks around recursive CTE queries
  - Implemented fallback behavior that returns direct reports when query fails
  - Added cycle prevention with `WHERE ll.lead_id != :leader_id`
  - Used UNION ALL instead of UNION for better performance
  - Added comprehensive error logging with traceback information
- **Gotcha**: Recursive CTE queries can fail with database errors or cycles. Always implement error handling with fallback behavior and log all errors.

### Individual Processing Error Isolation (2026-08-20)
- **Fixed**: `create_evaluation` now isolates errors when processing individual questions
- **Improvements**:
  - Added helper functions `_get_question_title()` and `_get_question_weight()` with error handling
  - Wrapped individual question processing in try/except blocks
  - Errors are logged but don't fail the entire evaluation creation
  - Returns partial results with safe default values for failed questions
- **Gotcha**: Never let processing errors in one item break the entire operation. Isolate errors and continue with other items.
- **Update (2026-08-21)**: `_get_question_title()` / `_get_question_weight()` were removed in favor of batch loading in `build_summary_response()`. Unknown `question_id`s are still logged (warning) and skipped rather than failing the operation — same invariant, fewer queries.

### Evaluation Creation Fix (2026-08-20)
- **Fixed**: `create_evaluation` function was using `db.begin()` block which caused 500 errors
- **Bug**: `db.begin()` creates a nested transaction that conflicts with SQLAlchemy's session management
- **Fix**: Removed `db.begin()` block and let the session handle transactions naturally
- **Gotcha**: In SQLAlchemy, `db.begin()` starts a new transaction which can conflict with the session's existing transaction. Use `db.commit()` directly instead of wrapping in `db.begin()`.

### Subordinates Serialization Fix (2026-08-21)
- **Fixed**: `GET /api/evaluations/subordinates/` returned 500 after the first evaluation was submitted
- **Bug**: Router called `EvaluationSummaryResponse.model_validate(orm_summary)`, but `EvaluationSummaryResponse` requires `questions` and the `EvaluationSummary` ORM model has **no** `questions` relationship → pydantic `Field required [type=missing]`
- **Trigger**: Only fired when a subordinate already had an evaluation (`latest_evaluation is None` skipped validation) — which is why it appeared "after evaluating"
- **Fix**: New shared builder `build_summary_response(db, summary)` in `app/services/evaluation.py` loads responses + question details with two batch queries and constructs the response explicitly. Used by all three consumers: `create_evaluation`, `subordinate_evaluations`, and `evaluation_history` (removed ~90 duplicated lines)
- **Gotcha**: Never `model_validate()` an `EvaluationSummary` ORM object. The ORM model intentionally carries no `questions` relationship; always serialize via `build_summary_response`. Note that `EvaluationSummaryResponse` keeps `from_attributes=True` — this does NOT make it safe to validate ORM objects directly (questions would still be missing); it is a standing trap inviting the bug back.
- **Generalized rule**: Before `model_validate()`/`from_orm()` on any ORM object, verify every required nested field has a backing ORM relationship. Bugs like this fire only when optional data is populated (`latest_evaluation is None` masked it) — tests exercising only the empty case will not catch it.
- **Test gap fixed**: `tests/test_subordinates_after_evaluation.py` exercises the real service + serialization path end-to-end (previous tests mocked `get_subordinate_evaluations` and always used `latest_evaluation: None`, hiding the bug)

### Debug Endpoint Gating + Self-Correcting Seed (2026-08-22)
- **Fixed**: `/api/test-cookies` echoed cookies/headers to any caller. It now returns 404 unless `settings.DEBUG=true` (`app/routers/health.py`). Covered by `tests/test_health.py`.
- **Fixed**: Question seeding is no longer insert-only. `seed_database()` calls `_correct_questions()`, which upserts title/weight/order by id against canonical `CASE_QUESTIONS` (mirrors `docs/case_tecnico.txt`). Legacy rows with retired titles ("Trabalho em Equipe", "Comunicação", "Iniciativa e Proatividade") are corrected on startup instead of persisting.
- **Gotcha**: Never expose endpoints that reflect request cookies/headers without a DEBUG guard — they leak credentials in any non-dev environment.

### Request Management
- Added AbortController support for request cancellation
- Separated complex operations into smaller, manageable steps
- Improved error recovery and user feedback

## Next Steps
- Validate all endpoints
- Test error scenarios
- Add monitoring and logging
- Implement automated testing for edge cases
- Create comprehensive tests for recursive CTE queries

## Testing

### Unit Tests
- Test recursive CTE queries with valid input
- Test recursive CTE queries with invalid input
- Test recursive CTE queries with database errors
- Test recursive CTE queries with cycles
- Test fallback behavior for database errors

### Integration Tests
- Test subordinates endpoint with various hierarchy structures
- Test evaluation creation with question processing errors
- Test error handling in production-like scenarios

### Test File
- `repos/backend/tests/test_subordinates_endpoint.py` - Comprehensive tests for subordinates endpoint

## Debug Endpoints
- **Health Check:** `GET /api/health` - Returns `{"status": "ok"}`
- **Cookie Debug:** `GET /api/test-cookies` - Returns cookies and headers for debugging (**requires `DEBUG=true`; returns 404 otherwise**)

## Error Handling Patterns
### HTTP Status Codes
- **400:** Invalid input parameters
- **403:** Hierarchy access violation
- **404:** Employee not found
- **409:** Weekly limit exceeded
- **422:** Validation errors (missing scores, invalid scores)
- **500:** Server errors with detailed logging

### Error Recovery
- Automatic redirection on authentication errors
- Graceful degradation when individual items fail
- Comprehensive error messages for users
- Detailed logging for developers

## Frontend Integration Notes
### i18n System
- **All user-facing text across the entire app** (pages, layout, dialogs, toasts, tables) uses the i18n system — no hardcoded strings (completed 2026-08-22)
- Translation keys are defined in `repos/frontend/src/i18n/translations.ts` (pt-BR/en parity)
- Components use `useLanguage()` hook to access translations; `t(key, {param})` is memoized using useMemo([language]) to prevent unnecessary re-renders on language change
- Locale-aware formatting helpers are exported from `repos/frontend/src/i18n/LanguageContext.tsx`: `formatScore(value, language)` and `formatDate(date, language, options?)` — Intl-based, pt-BR renders comma decimals, en renders en-US. Do not use `.toFixed(2)` or hardcoded `"pt-BR"` date formatting in components.
- `document.documentElement.lang` is synced on language change; support for both Portuguese (pt-BR) and English (en) languages
- **Performance**: Include `t` in useEffect and useCallback dependency arrays to prevent stale translations during language changes; removed premature optimization that caused race conditions
