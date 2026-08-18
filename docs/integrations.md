# Integrations

## Integration Catalog

| Integration | Type | Auth Model | Owner | Status |
|-------------|------|------------|-------|--------|
| Frontend <-> Backend | Internal | Cookie (employee_id) | CaseTecnico | Active |

## Authentication and Access

### Authentication Model

- **Method:** Cookie-based identification
- **Cookie Name:** `employee_id`
- **Storage:** Browser cookie (or localStorage)
- **Flow:**
  1. User selects leader from dropdown
  2. Frontend stores `employee_id` in cookie
  3. Frontend sends cookie with every request
  4. Backend reads `employee_id` from cookie
  5. Backend validates hierarchy access

### Authorization Rules

| Resource | Rule | Implementation |
|----------|------|----------------|
| Own evaluation | BLOCKED | Backend checks evaluator_id != employee_id |
| Peer evaluation | BLOCKED | Backend checks hierarchy (not same level) |
| Superior evaluation | BLOCKED | Backend checks hierarchy (not ancestor) |
| Subordinate evaluation | ALLOWED | Backend checks hierarchy (is descendant) |

## Contracts and Data Flows

### REST API Endpoints

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
