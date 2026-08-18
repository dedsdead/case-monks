# Security Quality Checklist

**Plan:** Plataforma de Avaliação de Liderados
**Generated:** 2026-08-17 (regenerated)

---

## Authentication Model

- [ ] CHK086 Is the simulated auth model (localStorage employee_id) explicitly documented as intentional? [Completeness]
- [ ] CHK087 Is it stated that identity spoofing is acceptable for this demo project? [Clarity]
- [ ] CHK088 Is the case técnico requirement cited as justification for no real auth? [Completeness]
- [ ] CHK089 Is it documented that production would require real authentication (JWT/OAuth2)? [Completeness]

## Authorization Enforcement

- [ ] CHK090 Is it specified that backend validates hierarchy on EVERY request accessing evaluation data? [Completeness]
- [ ] CHK091 Is the self-evaluation block specified (evaluator_id != employee_id)? [Completeness]
- [ ] CHK092 Is the peer evaluation block specified (employees at same hierarchy level)? [Completeness]
- [ ] CHK093 Is the superior evaluation block specified (employees above in hierarchy)? [Completeness]
- [ ] CHK094 Is the employee list endpoint (GET /api/employees) specified as requiring auth? [Clarity]

## Input Validation

- [ ] CHK095 Is score range validation (1-4, integer) specified for both backend (Pydantic) and frontend? [Completeness]
- [ ] CHK096 Is the exact-6-scores validation specified (not 5, not 7)? [Completeness]
- [ ] CHK097 Is the question_id uniqueness validation specified (each question 1-6 appears exactly once)? [Completeness]
- [ ] CHK098 Is the employee_id existence check specified (404 if not found)? [Completeness]
- [ ] CHK099 Is the Pydantic `extra="forbid"` config specified to reject unexpected fields? [Completeness]

## SQL Injection Prevention

- [ ] CHK100 Is it specified that all database queries use parameterized/ORM queries (no raw SQL with interpolation)? [Completeness]
- [ ] CHK101 Is it specified that CTE queries use SQLAlchemy expression language, not text() with f-strings? [Clarity]

## CORS Configuration

- [ ] CHK102 Are allowed origins explicitly listed (not wildcard `*`)? [Completeness]
- [ ] CHK103 Is `allow_credentials=True` specified with explicit origins (not `*`)? [Completeness]
- [ ] CHK104 Is the Vite proxy configuration specified for development (eliminates CORS in dev)? [Completeness]

## Cookie Security

- [ ] CHK105 Is it specified that employee_id is stored in localStorage (not httpOnly cookie)? [Clarity]
- [ ] CHK106 Is it documented that localStorage is readable via JavaScript (XSS risk, acceptable for demo)? [Completeness]

## Known Limitations

- [ ] CHK107 Is the identity spoofing limitation documented in architecture.md? [Completeness]
- [ ] CHK108 Is the lack of session expiration documented? [Completeness]
- [ ] CHK109 Is the lack of rate limiting documented? [Completeness]
- [ ] CHK110 Is the lack of HTTPS documented? [Completeness]
- [ ] CHK111 Is the SQLite file-level access risk documented (no DB authentication)? [Completeness]

## CTE Recursion Safety

- [ ] CHK112 Is the cycle guard specified (UNION instead of UNION ALL)? [Completeness]
- [ ] CHK113 Is the depth guard specified (max 100 levels, configurable)? [Completeness]

## Data Exposure

- [ ] CHK114 Is it specified that GET /api/employees returns email addresses (acceptable for demo, restrict in production)? [Clarity]
- [ ] CHK115 Is it documented that OpenAPI docs at /docs should be disabled in production? [Completeness]

## CTE Cache Security

- [ ] CHK116 Is the dict-based TTL cache module-level (not per-request) to avoid memory leaks? [Completeness]
- [ ] CHK117 Is the cache cleared on every write operation to prevent stale hierarchy data? [Completeness]
- [ ] CHK118 Is it documented that cache is in-memory only (lost on server restart, acceptable for demo)? [Completeness]
