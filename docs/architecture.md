# Architecture

## System Overview

Plataforma web para avaliação de liderados seguindo hierarquia organizacional. Arquitetura client-server com frontend React e backend FastAPI, comunicando via REST API.

### Boundary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React + TypeScript + Vite               │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │   │
│  │  │  Pages  │  │Components│  │   Services/API  │   │   │
│  │  └─────────┘  └──────────┘  └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  FastAPI Application                 │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │   │
│  │  │ Routes  │  │ Services │  │    Models/DB    │   │   │
│  │  └─────────┘  └──────────┘  └─────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQLAlchemy ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  employee | leader_lead | evaluation_question |     │   │
│  │  evaluation_response | evaluation_summary            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 18.x | UI framework |
| Frontend | TypeScript | 5.x | Type safety |
| Frontend | Vite | 5.x | Build tool + dev server |
| Frontend | Axios | 1.x | HTTP client |
| Backend | Python | 3.10+ | Runtime |
| Backend | FastAPI | 0.110+ | Web framework |
| Backend | SQLAlchemy | 2.x | ORM |
| Backend | Pydantic | 2.x | Data validation |
| Database | SQLite | 3.x | Data persistence |
| Container | Docker | 24+ | Containerization |
| Container | Docker Compose | 2.x | Orchestration |

## Module and Service Boundaries

### Backend Modules

```
backend/
├── app/
│   ├── main.py              # FastAPI app entrypoint
│   ├── config.py            # Settings and environment
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # SQLAlchemy models
│   │   ├── employee.py
│   │   ├── evaluation_question.py
│   │   ├── evaluation_response.py
│   │   └── evaluation_summary.py
│   ├── routers/             # API endpoints
│   │   ├── employees.py
│   │   └── evaluations.py
│   ├── services/            # Business logic
│   │   ├── hierarchy.py     # Recursive hierarchy queries
│   │   └── evaluation.py    # Evaluation CRUD + validation
│   └── schemas/             # Pydantic schemas
│       ├── employee.py
│       └── evaluation.py
├── alembic/                 # Database migrations
├── requirements.txt
└── Dockerfile
```

### Frontend Modules

```
frontend/
├── src/
│   ├── main.tsx             # App entrypoint
│   ├── App.tsx              # Router setup
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Evaluate.tsx
│   │   └── History.tsx
│   ├── components/          # Reusable components
│   │   ├── LeaderSelector.tsx
│   │   ├── EmployeeList.tsx
│   │   ├── EvaluationForm.tsx
│   │   └── EvaluationHistory.tsx
│   ├── services/            # API calls
│   │   └── api.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   └── hooks/               # Custom hooks
│       └── useAuth.ts
├── package.json
├── vite.config.ts
└── Dockerfile
```

## Data and Request Flows

### Flow 1: Avaliação de Liderado

```
1. Leader selects employee from dropdown
2. Frontend sends GET /api/employees/subordinates
3. Backend queries hierarchy using CTE
4. Frontend displays list of subordinates
5. Leader clicks "Evaluate" on employee
6. Frontend sends GET /api/employees/{id}
7. Backend returns employee details
8. Frontend displays evaluation form (6 questions)
9. Leader fills scores (1-4) and submits
10. Frontend sends POST /api/evaluations
11. Backend validates:
    - Hierarchy access (leader -> employee)
    - Weekly limit (1 eval/week/pair)
12. Backend saves to database
13. Frontend shows success message
```

### Flow 2: Visualização de Avaliações

```
1. Leader navigates to "My Subordinates"
2. Frontend sends GET /api/evaluations/subordinates
3. Backend queries:
    - CTE to find all subordinates (direct/indirect)
    - Latest evaluation for each
4. Frontend displays table with:
    - Employee ID/name
    - Latest score
    - History link
```

## Architecture Invariants

### Business Rules (Never Change)
1. **Score Range:** Always 1-4 per question
2. **Weekly Limit:** One evaluation per leader-employee pair per week
3. **Immutable Evaluations:** Cannot edit after submission
4. **Hierarchical Visibility:** Only see subordinates' evaluations (direct/indirect)
5. **Self-Evaluation Blocked:** Cannot evaluate yourself

### Data Integrity Constraints
1. **Foreign Keys:** All evaluation_response FKs must reference valid employee/question
2. **Score Validation:** Score must be in range 1-4
3. **Week Number:** Must be valid ISO week number (1-53)

### Security Boundaries
1. **Authentication:** Cookie-based (employee_id)
2. **Authorization:** Backend validates hierarchy on every request
3. **SQL Injection:** All queries parameterized via SQLAlchemy

## Safe Change Guidance

### Safe to Change (No Coordination)
- Frontend UI/components (styles, layout)
- Backend service logic (non-API)
- Database indexes (performance)
- Documentation

### Requires Coordination
- API contracts (frontend + backend)
- Database schema (backend + migrations)
- Docker Compose (both services)

### Requires Migration/Downtime
- Database schema changes (alembic migration)
- Breaking API changes (version bump)
