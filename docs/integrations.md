# Integrations

## Integration Catalog

| Integration | Type | Auth Model | Owner | Status |
|-------------|------|------------|-------|--------|
| Frontend <-> Backend | Internal | Cookie (employee_id) | CaseTecnico | Active |

## Authentication and Access

### Authentication Model

- **Method:** Cookie-based identification
- **Cookie Name:** `employee_id`
- **Storage:** Browser cookie (no domain restriction)
- **Flow:**
  1. User selects leader from dropdown
  2. Frontend stores `employee_id` in cookie
  3. Frontend sends cookie with every request
  4. Backend reads `employee_id` from cookie
  5. Backend validates hierarchy access

### Cookie Configuration

**Important:** Cookie domain configuration must be handled carefully:

- **Local Development:** No domain parameter (uses current domain)
- **Production:** May require specific domain configuration
- **Debugging:** Use `/api/test-cookies` endpoint to verify cookie transmission (requires `DEBUG=true`; returns 404 otherwise)

### Authorization Rules

| Resource | Rule | Implementation |
|----------|------|----------------|
| Own evaluation | BLOCKED | Backend checks evaluator_id != employee_id |
| Peer evaluation | BLOCKED | Backend checks hierarchy (not same level) |
| Superior evaluation | BLOCKED | Backend checks hierarchy (not ancestor) |
| Subordinate evaluation | ALLOWED | Backend checks hierarchy (is descendant) |

## Contracts and Data Flows

### REST API Endpoints

#### System
| Method | Path | Description | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/health` | Health check | - | `{"status": "ok"}` |
| GET | `/api/test-cookies` | Debug cookies (**requires `DEBUG=true`, else 404**) | - | `{"cookies": {}, "headers": {}}` |

#### Employees

| Method | Path | Description | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/employees` | List all employees | - | `Employee[]` |
| GET | `/api/employees/{id}` | Get employee by ID | - | `Employee` |
| GET | `/api/employees/{id}/subordinates` | Get all subordinates (recursive) | - | `Employee[]` |

#### Evaluations

| Method | Path | Description | Request | Response |
|--------|------|-------------|---------|----------|
| GET | `/api/evaluations/questions` | Get evaluation questions | - | `Question[]` |
| GET | `/api/evaluations/employee/{id}` | Get evaluations for employee | - | `EvaluationSummary[]` |
| POST | `/api/evaluations` | Submit evaluation | `EvaluationCreate` | `EvaluationSummary` |
| GET | `/api/evaluations/subordinates` | Get evaluations for leader's subordinates | - | `SubordinateEvaluation[]` |

### Data Schemas

#### Employee
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@example.com",
  "position_name": "Developer"
}
```

#### Question
```json
{
  "id": 1,
  "title": "Entrega de Resultados",
  "weight": 25,
  "order": 1
}
```

#### EvaluationCreate
```json
{
  "employee_id": 1,
  "scores": [
    {"question_id": 1, "score": 4},
    {"question_id": 2, "score": 3},
    {"question_id": 3, "score": 4},
    {"question_id": 4, "score": 2},
    {"question_id": 5, "score": 3},
    {"question_id": 6, "score": 4}
  ]
}
```

#### EvaluationSummary
```json
{
  "id": 1,
  "employee_id": 1,
  "evaluator_id": 5,
  "total_score": 3.45,
  "evaluation_date": "2026-08-17T20:00:00Z",
  "evaluation_year": 2026,
  "week_number": 33,
  "questions": [
    {
      "question_id": 1,
      "title": "Entrega de Resultados",
      "weight": 25,
      "score": 4
    }
  ]
}
```

## Failure Modes and Retries

| Failure | Impact | Handling |
|---------|--------|----------|
| Database locked | Write fails | SQLite WAL mode + retry |
| Invalid hierarchy | 403 Forbidden | Frontend shows error |
| Weekly limit exceeded | 409 Conflict | Frontend shows message |
| Network error | Request fails | Frontend retry + toast |

### Timeout Configuration

| Service | Timeout | Retry |
|---------|---------|-------|
| Frontend -> Backend | 30s | 1 retry |
| Backend -> SQLite | 5s | None (fail fast) |

## Ownership

| Component | Owner | Contact |
|-----------|-------|---------|
| Frontend | CaseTecnico | - |
| Backend | CaseTecnico | - |
| Database | CaseTecnico | - |

### Upstream Dependencies
- **None** — This is a standalone application

### Downstream Dependencies
- **None** — No external services called

## Debugging and Troubleshooting

### Common Issues

#### 1. "em implementação..." Placeholder Showing
**Symptom:** Frontend shows placeholder text instead of actual content
**Root Causes:**
- Backend service not running
- Database not seeded
- Cookie authentication failing

**Debug Steps:**
1. Check backend health: `curl http://localhost:8000/api/health`
2. Verify database exists: `ls -la repos/backend/data/casetecnico.db`
3. Test cookie transmission: `curl -b cookies.txt -c cookies.txt http://localhost:8000/api/test-cookies` (requires `DEBUG=true` in backend `.env`; a 404 means the flag is off, not that cookies are broken)

#### 2. Cookie Authentication Issues
**Symptom:** User selection not persisting, 401 errors
**Root Causes:**
- Cookie domain misconfiguration
- Browser privacy settings blocking cookies
- CORS issues

**Debug Steps:**
1. Use `/api/test-cookies` to verify cookie transmission (requires `DEBUG=true`; 404 means the flag is disabled)
2. Check browser DevTools > Application > Cookies
3. Verify no `domain=backend` parameter in cookie (local development)

#### 3. Database Connection Issues
**Symptom:** Backend returning 500 errors, no data
**Root Causes:**
- Database file missing
- Database not seeded
- File permissions

**Debug Steps:**
1. Check database file exists: `ls -la repos/backend/data/casetecnico.db`
2. Restart backend to trigger seeding
3. Check backend logs for database errors

### Development Gotchas

#### Cookie Configuration
- **Local Development:** Never use `domain=backend` parameter
- **Production:** May require specific domain configuration
- **Testing:** Use browser DevTools to inspect cookies

#### Service Dependencies
- Backend must be running before frontend
- Database seeding happens automatically on backend startup
- Health check endpoint is unauthenticated (no cookies required)

#### Development Environment
- Use `http://localhost:8000` for backend API
- Use `http://localhost:3000` for frontend
- Both services must run simultaneously for full testing
