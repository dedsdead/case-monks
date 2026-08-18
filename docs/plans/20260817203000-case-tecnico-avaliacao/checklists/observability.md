# Observability Quality Checklist

**Plan:** Plataforma de Avaliação de Liderados
**Generated:** 2026-08-17 (regenerated)

---

## Health Checks

- [ ] CHK160 Is the health check endpoint specified (GET /api/health returning { status: "ok" })? [Completeness]
- [ ] CHK161 Is the health check endpoint unauthenticated (no cookie required)? [Completeness]
- [ ] CHK162 Is the Docker Compose healthcheck configured using the /api/health endpoint? [Completeness]
- [ ] CHK163 Is the frontend depends_on with condition: service_healthy specified? [Completeness]

## Logging

- [ ] CHK164 Is the FastAPI logging configuration specified (stdout for Docker, configurable level)? [Completeness]
- [ ] CHK165 Is the SQLAlchemy echo parameter specified for debug logging when DEBUG=true? [Clarity]
- [ ] CHK166 Is it specified that structured logging should be used (not print statements)? [Clarity]

## Error Tracking

- [ ] CHK167 Is the custom exception hierarchy specified (WeeklyLimitExceeded, HierarchyViolation, SelfEvaluationBlocked, EmployeeNotFound)? [Completeness]
- [ ] CHK168 Is it specified that unhandled exceptions return 500 with generic message (no stack trace leak)? [Completeness]
- [ ] CHK169 Is the React ErrorBoundary specified for frontend runtime error capture? [Completeness]

## Debugging

- [ ] CHK170 Is the FastAPI Swagger UI (/docs) specified as available in debug mode? [Completeness]
- [ ] CHK171 Is the DEBUG=true environment variable documented for development use? [Completeness]
- [ ] CHK172 Is the Docker exec command documented for container debugging? [Completeness]

## Performance Monitoring

- [ ] CHK173 Is the SQLite WAL mode specified for concurrent read/write monitoring? [Completeness]
- [ ] CHK174 Is the busy_timeout specified to handle database lock contention? [Completeness]
- [ ] CHK175 Is the cache_size PRAGMA (-64000) specified for read performance? [Completeness]

## Deployment Verification

- [ ] CHK176 Is the Docker Compose up --build command documented for full-stack verification? [Completeness]
- [ ] CHK177 Is the seed data verification step specified (20 employees + 19 relationships + 6 questions)? [Completeness]
- [ ] CHK178 Is the API endpoint verification step specified (curl/httpie for each endpoint)? [Completeness]

## Audit Trail

- [ ] CHK179 Is it specified that evaluation submissions are recorded with evaluator_id, employee_id, and timestamp? [Completeness]
- [ ] CHK180 Is it documented that the current scope has no separate audit log (sufficient in EvaluationResponse/EvaluationSummary tables)? [Clarity]

## Cache Observability

- [ ] CHK181 Is the TTL cache hit/miss behavior observable (e.g., logging cache invalidation on writes)? [Completeness]
- [ ] CHK182 Is it documented that the in-memory cache is lost on server restart (acceptable for demo)? [Completeness]
- [ ] CHK183 Is it specified that cache.clear() is called on every create_evaluation to prevent stale data? [Completeness]

## Done Criteria

- [ ] CHK184 Is it specified that project is done when all 49 acceptance criteria pass manual verification? [Completeness]
- [ ] CHK185 Is it specified that verification results should be documented in a verification log? [Completeness]
