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
| Frontend | Vitest | 3.x | Unit/integration testing |
| Frontend | React Testing Library | 16.x | Component testing utilities |
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
│   │   ├── health.py         # Health check and debugging
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
│   ├── main.tsx                 # App entrypoint (wraps in LanguageProvider + AuthProvider + ErrorBoundary)
│   ├── App.tsx                  # React Router setup
│   ├── index.css                # CSS custom properties (color palette)
│   ├── test-setup.ts            # Vitest global test setup (jsdom, testing-library)
│   ├── i18n/                    # Internationalization (PT-BR / EN)
│   │   ├── LanguageContext.tsx   # LanguageProvider + useLanguage hook
│   │   └── translations.ts      # Translation strings for PT-BR and EN
│   ├── pages/                   # Page components
│   │   ├── Home.tsx             # Home page with subordinate evaluations
│   │   ├── Evaluate.tsx         # Evaluation form page (Phase 5)
│   │   ├── History.tsx          # Evaluation history page (Phase 5)
│   │   └── NotFound.tsx         # 404 page with home link
│   ├── components/
│   │   ├── layout/              # App shell components
│   │   │   ├── Layout.tsx       # App shell: header + Outlet (uses useLanguage for translations)
│   │   │   ├── LeaderSelector.tsx  # Identity selection dropdown
│   │   │   └── LanguageSwitcher.tsx  # PT/EN language toggle buttons
│   │   ├── employee/            # Employee-related components
│   │   │   └── EmployeeList.tsx # Subordinate table with action buttons
│   │   ├── evaluation/          # Evaluation form components (Phase 5)
│   │   │   ├── EvaluationForm.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── history/             # History components (Phase 5)
│   │   │   ├── EvaluationHistory.tsx
│   │   │   └── EvaluationDetail.tsx
│   │   └── ui/                  # Shared UI primitives
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   ├── services/                # API calls
│   │   └── api.ts               # Axios instance with cookie auth interceptor
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Interfaces matching backend schemas
│   └── hooks/                   # Custom hooks
│       └── useAuth.tsx          # Auth context (AuthProvider + useAuth)
├── package.json
├── vite.config.ts               # Vite config with /api proxy + Vitest config
├── tsconfig.app.json            # TypeScript config (excludes test files)
└── Dockerfile
```

## Data and Request Flows

### Flow 1: Avaliação de Liderado

```
1. Leader selects employee from dropdown
2. Frontend sends GET /api/evaluations/subordinates
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

### Cookie Configuration Invariants
1. **Local Development:** Never use `domain=backend` parameter in cookies
2. **Debug Access:** `/api/test-cookies` endpoint available for cookie inspection
3. **Health Check:** `/api/health` endpoint unauthenticated for service monitoring
4. **Identity Change:** Automatic redirection on cookie/localStorage changes
5. **Error Handling:** Comprehensive error messages for authentication failures

### Error Handling Invariants
1. **Input Validation:** All inputs validated before processing (employee IDs, scores, question IDs)
2. **Sanitization:** User input sanitized to prevent security issues
3. **Graceful Degradation:** Individual processing failures don't break entire operations
4. **Request Cancellation:** AbortController used to cancel stale requests
5. **Detailed Logging:** All errors logged with traceback information for debugging

### Frontend Error Handling Patterns
1. **Separated Fetch Operations:** Employee data fetched separately from evaluation/history data
2. **Status Code Handling:** Specific error messages for different HTTP status codes
3. **Automatic Redirection:** Users redirected to appropriate pages on errors
4. **User Feedback:** Toast notifications for success/error states
5. **Loading States:** Proper loading indicators during API calls

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
