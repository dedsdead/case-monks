# API Quality Checklist

**Plan:** Plataforma de Avaliação de Liderados
**Generated:** 2026-08-17 (regenerated)

---

## Endpoint Coverage

- [ ] CHK001 Are all 8 API endpoints specified with HTTP method, path, and response type? [Completeness]
- [ ] CHK002 Is the POST /api/evaluations request body schema fully defined (employee_id + 6 scores with question_id and score)? [Completeness]
- [ ] CHK003 Is the GET /api/evaluations/subordinates response shape defined (one row per subordinate with latest_evaluation, employee_name, position_name, depth, or null)? [Completeness]
- [ ] CHK004 Is the GET /api/evaluations/employee/{id} response shape defined (array of EvaluationSummary ordered by evaluation_date DESC)? [Completeness]
- [ ] CHK005 Is the GET /api/employees/{id}/subordinates response shape defined (array of Employee)? [Completeness]

## Error Responses

- [ ] CHK006 Are all error response bodies specified (401, 403, 404, 409, 422, 500) with consistent JSON shape? [Completeness]
- [ ] CHK007 Is the 409 Conflict response body defined (message + existing_evaluation_id)? [Completeness]
- [ ] CHK008 Is the 422 Validation Error response body defined (field-level errors from Pydantic)? [Completeness]
- [ ] CHK009 Are error response messages specified in Portuguese for user-facing errors and English for system errors? [Clarity]

## Authentication & Authorization

- [ ] CHK010 Is the cookie name (`employee_id`) and format (string integer) specified? [Clarity]
- [ ] CHK011 Is it specified which endpoints require auth and which do not? [Completeness]
- [ ] CHK012 Is the hierarchy validation requirement specified for every endpoint that accesses evaluation data? [Completeness]
- [ ] CHK013 Is the self-evaluation block specified for POST /api/evaluations? [Completeness]
- [ ] CHK014 Is the peer/superior evaluation block specified for GET /api/evaluations/employee/{id}? [Completeness]

## Request Validation

- [ ] CHK015 Is the score range constraint (1-4, integer only) specified for both backend and frontend validation? [Completeness]
- [ ] CHK016 Is the exact-6-scores requirement specified (not 5, not 7)? [Clarity]
- [ ] CHK017 Is the unique question_id requirement specified (question_ids 1-6 must each appear exactly once)? [Completeness]
- [ ] CHK018 Is the employee_id existence check specified (404 if employee doesn't exist)? [Completeness]

## Response Shapes

- [ ] CHK019 Are all response schemas documented with field types and constraints (e.g., total_score is float, week_number is 1-53)? [Completeness]
- [ ] CHK020 Is the EvaluationSummaryResponse shape consistent between the plan's data model section and the API endpoints section? [Consistency]
- [ ] CHK021 Is the SubordinateEvaluationResponse shape specified (employee_id, employee_name, position_name, latest_evaluation | null, depth)? [Completeness]
- [ ] CHK022 Is the QuestionResponse shape specified (id, title, weight, order)? [Completeness]

## Immutability

- [ ] CHK023 Is it explicitly stated that no PUT/PATCH/DELETE endpoints exist for evaluations? [Clarity]
- [ ] CHK024 Is it specified that the weekly limit check uses (evaluation_year, week_number) pair, not week_number alone? [Clarity]

## Pagination & Sorting

- [ ] CHK025 Is it specified whether GET /api/employees returns all employees or supports pagination? [Clarity]
- [ ] CHK026 Is it specified that evaluation history is sorted by evaluation_date descending (most recent first)? [Clarity]
- [ ] CHK027 Is it specified that subordinate evaluations list includes employees with no evaluations (null latest_evaluation)? [Clarity]
- [ ] CHK028 Is it specified that subordinate evaluations are sorted by hierarchy depth ASC (CEO first, then direct reports, then indirect)? [Clarity]

## CORS & Headers

- [ ] CHK029 Are the allowed CORS origins explicitly listed (not wildcard)? [Completeness]
- [ ] CHK030 Is the cookie-based auth header propagation specified (how frontend sends employee_id to backend)? [Clarity]

## Health Check

- [ ] CHK031 Is the health check endpoint specified as unauthenticated (no cookie required)? [Clarity]

## CTE Caching

- [ ] CHK032 Is the dict-based TTL cache specified for subordinate sets (`_subordinate_cache: dict[int, tuple[float, list[int]]]`)? [Completeness]
- [ ] CHK033 Is the 5-minute TTL expiry specified (`time.time() - timestamp > 300`)? [Completeness]
- [ ] CHK034 Is the cache invalidation on write specified (`_subordinate_cache.clear()` on create_evaluation)? [Completeness]
- [ ] CHK035 Is the caching pattern documented as dict-based TTL (not `functools.lru_cache`) per clarification decision? [Consistency]
