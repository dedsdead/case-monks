---
title: "Plataforma de Avaliação de Liderados — Implementation Plan"
type: enhancement
status: active
date: 2026-08-17
phased: true
---

## Overview

### Problem / Motivation
Build a web platform that allows leaders to evaluate their direct and indirect subordinates using 6 weighted questions (scores 1-4). Evaluations are immutable after submission, limited to one per leader-employee pair per week, and visible only to hierarchy ancestors.

### What We're Building
A full-stack application (React + FastAPI + SQLite + Docker) that:
- Lets leaders select their identity via a simple dropdown (simulated auth)
- Displays all subordinates via recursive CTE through the `leader_lead` M2M table
- Provides an evaluation form with real-time weighted score preview
- Stores evaluations with weekly limit enforcement and immutability
- Shows evaluation history with per-question breakdowns

### Who It's For
Internal demo/assessment — no real authentication needed. The `employee_id` is stored in `localStorage` and sent as a cookie.

### Key Decisions (from Brainstorm)
- **Schema:** Use SQL dump `leader_lead` M2M table (not `manager_id` FK)
- **Employee model:** `(id, name, email, position_name)` per dump
- **Auth:** Cookie/localStorage with backend hierarchy validation on every request
- **Database:** SQLite with WAL mode
- **Containerization:** Docker Compose (frontend + backend)

---

## Scope / Work Breakdown

| Group | Layer | Requirements | Phase |
|-------|-------|-------------|-------|
| A1: Schema Resolution | Docs | Resolve SQL dump vs architecture schema conflict, write ADR-001 | 1 |
| A2: Project Scaffolding | Infra | Backend/Frontend project init, Docker Compose, env config | 1 |
| B1: Database Schema | Backend | SQLAlchemy models, Alembic migration, seed data | 2 |
| C1: Backend Core | Backend | Dependencies, services (hierarchy + evaluation), routers, schemas | 3 |
| C2: Backend Polish | Backend | CORS, health check, error handling | 3 |
| D1: Frontend Core | Frontend | Auth hook, API services, types, routing, layout, home page | 4 |
| D2: Frontend Features | Frontend | Evaluation form, history, error/loading states, responsive | 5 |
| E1: Documentation | Docs | README, setup instructions, architecture diagram | 6 |

---

## Proposed Solution

### Architecture
- **Frontend:** React 18 + TypeScript 5 + Vite 5 + Axios + React Router v6
- **Backend:** Python 3.10+ + FastAPI 0.110+ + SQLAlchemy 2.x (sync) + Pydantic 2.x + Alembic
- **Database:** SQLite with WAL mode, foreign keys enforced
- **Container:** Docker Compose with health checks

### Data Model
- **Employee:** `(id SERIAL PK, name VARCHAR(100), email VARCHAR(150) UNIQUE, position_name VARCHAR(100))`
- **LeaderLead:** `(leader_id INT FK, lead_id INT FK, PK(leader_id, lead_id), CHECK(leader_id <> lead_id))`
- **EvaluationQuestion:** `(id PK, title VARCHAR, weight INT, order INT)` — 6 seeded rows
- **EvaluationResponse:** `(id PK, evaluation_summary_id FK, question_id FK, score INT 1-4)`
- **EvaluationSummary:** `(id PK, employee_id FK, evaluator_id FK, total_score FLOAT, evaluation_date DATETIME, evaluation_year INT, week_number INT)`
  - Unique constraint on `(evaluator_id, employee_id, evaluation_year, week_number)`
  - No `is_submitted` field — every row is a submitted evaluation (no draft persistence)

### Key Design Decisions
1. **CTE with `UNION` (not `UNION ALL`)** — inherently cycle-safe, prevents infinite recursion from circular hierarchy data
2. **Synchronous SQLAlchemy** — SQLite is inherently sync; async adds complexity with zero benefit
3. **Dependency injection chain** — `get_employee_id → get_current_employee → require_subordinate_access`
4. **Vite proxy for dev** — eliminates CORS issues in development; CORS middleware as fallback
5. **evaluation_year + week_number** — year-scoped weekly limit prevents cross-year collisions
6. **Remove `is_submitted` field** — every EvaluationSummary is submitted; no draft persistence server-side

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/health` | No | `{ status: "ok" }` |
| GET | `/api/employees` | Yes | `Employee[]` |
| GET | `/api/employees/{id}` | Yes | `Employee` |
| GET | `/api/employees/{id}/subordinates` | Yes | `Employee[]` |
| GET | `/api/evaluations/questions` | Yes | `Question[]` |
| POST | `/api/evaluations` | Yes | `EvaluationSummary` (201) |
| GET | `/api/evaluations/subordinates` | Yes | `SubordinateEvaluation[]` |
| GET | `/api/evaluations/employee/{id}` | Yes | `EvaluationSummary[]` |

---

## Technical Considerations

### SQLite Configuration (mandatory in `database.py`)
```python
PRAGMA journal_mode=WAL       -- concurrent reads during writes
PRAGMA synchronous=NORMAL     -- speed + safety balance
PRAGMA busy_timeout=5000      -- wait instead of fail on lock
PRAGMA foreign_keys=ON        -- enforce referential integrity
PRAGMA cache_size=-64000      -- 64MB page cache
```

### Pydantic 2.x Patterns
- Response schemas: `model_config = ConfigDict(from_attributes=True)`
- Input schemas: `model_config = ConfigDict(extra="forbid")`
- Validators: `@field_validator` (not legacy `@validator`)
- Score validation: `Field(ge=1, le=4)` on `ScoreInput.score`

### CTE Hierarchy Query
- Use `UNION` (not `UNION ALL`) for cycle safety
- Depth guard: max 100 levels (configurable)
- Cache subordinate sets per leader (5-min TTL) to avoid redundant CTE execution

### Security Notes (demo scope)
- Identity spoofing via localStorage is **intentional** (case técnico requirement)
- Backend hierarchy validation on every request is the primary authorization mechanism
- No real auth, no HTTPS, no rate limiting — acceptable for local demo
- Document known limitations in architecture.md

### Design System — Color Palette
All UI components must use these colors consistently via CSS custom properties:

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#2c2c2c` | Dark gray — primary text, headers, buttons, strong emphasis |
| `--color-background` | `#e8e7e2` | Light beige/cream — page background, card backgrounds |
| `--color-muted` | `#767573` | Medium gray — secondary text, borders, subtle elements |
| `--color-border` | `#949492` | Light gray — input borders, table dividers, disabled states |
| `--color-secondary` | `#8c8c8c` | Medium-light gray — hover states, placeholder text, tertiary elements |

**Application rules:**
- Background: `--color-background` on `body` and main containers
- Text: `--color-primary` for headings and body text; `--color-muted` for secondary/caption text
- Buttons: `--color-primary` background with `--color-background` text (primary); `--color-border` background with `--color-primary` text (secondary)
- Inputs: `--color-border` border, `--color-background` background, `--color-primary` text
- Disabled states: `--color-border` background, `--color-muted` text
- Links/interactive: `--color-primary` with underline or `--color-muted` hover

### Commit Convention
- Every commit must use `[TICKET-XXXX]` prefix + conventional format in English
- User must provide ticket number before first commit

---

## Acceptance Criteria

### Auth & Identity Selection

#### AC-1: First-time user sees leader selector prompt
**Given** I have no employee_id stored (fresh browser or cleared storage)
**When** I navigate to any page of the application
**Then** I see a prompt "Selecione sua identidade" with a dropdown listing all employees, and I cannot access any feature until I select one
**Roles:** Any user
**Priority:** Must-have

#### AC-2: Leader selects identity from dropdown
**Given** I am on the leader selector prompt
**When** I select an employee from the dropdown
**Then** my employee_id is stored in localStorage, the page reloads, and I see the dashboard as that leader
**Roles:** Any user
**Priority:** Must-have

#### AC-3: Returning user auto-loads identity
**Given** I have previously selected an identity (employee_id in localStorage)
**When** I navigate to the application
**Then** I am automatically loaded as that leader without seeing the selector prompt
**Roles:** Any user
**Priority:** Must-have

#### AC-4: Leader switches identity
**Given** I am logged in as leader A and the LeaderSelector is visible in the header
**When** I open the dropdown and select leader B
**Then** my localStorage is updated, all data re-fetches for leader B, and I see leader B subordinates and evaluations
**Roles:** Any user
**Priority:** Must-have

#### AC-5: Invalid employee_id in storage
**Given** I have a corrupted or deleted employee_id in my localStorage
**When** the application tries to fetch data
**Then** the API returns 401/404, and I am shown the leader selector prompt to re-choose my identity
**Roles:** Any user
**Priority:** Should-have

### Subordinate List

#### AC-6: Leader sees all direct and indirect subordinates
**Given** I am logged in as Alice (CEO, employee_id=1)
**When** I navigate to the home page
**Then** I see a list containing ALL 18 employees in my subtree
**Roles:** Leader
**Priority:** Must-have

#### AC-7: Leader with no subordinates sees empty state
**Given** I am logged in as James (employee_id=10, leaf node)
**When** I navigate to the home page
**Then** I see "Voce nao possui subordinados para avaliar"
**Roles:** Leader
**Priority:** Must-have

#### AC-8: Subordinate list shows key employee info
**Given** I am logged in as David (employee_id=4)
**When** the subordinate list loads
**Then** each row displays: employee name, position_name, and an "Avaliar" button
**Roles:** Leader
**Priority:** Must-have

#### AC-9: Subordinate list shows evaluation status
**Given** I am logged in as David and have already evaluated Henry this week
**When** the subordinate list loads
**Then** Henry row shows "Avaliado" badge and "Avaliar" is disabled
**Roles:** Leader
**Priority:** Should-have

### Evaluation Form

#### AC-10: Leader opens evaluation form for valid subordinate
**Given** I am logged in as David and Henry is my subordinate
**When** I click "Avaliar" on Henry
**Then** I see Henry's name/position and 6 evaluation questions with numeric inputs (1-4) and weights
**Roles:** Leader
**Priority:** Must-have

#### AC-11: Form shows 6 questions with correct weights
**Given** I have opened the evaluation form
**When** I view the form
**Then** I see exactly 6 questions: Entrega de Resultados (25), Execucao e Qualidade (20), Capacidade de Aprendizado (20), Resolucao de Problemas (15), Colaboracao e Lideranca (10), Visao Estrategica (10)
**Roles:** Leader
**Priority:** Must-have

#### AC-12: Real-time weighted score preview
**Given** I have scored 3 of 6 questions
**When** I view the preview section
**Then** I see partial weighted calculation and "3 de 6 questoes respondidas"
**Roles:** Leader
**Priority:** Should-have

#### AC-13: Submit disabled until all scores entered
**Given** I have scored only 4 of 6 questions
**When** I look at the submit button
**Then** "Enviar Avaliacao" is disabled/grayed out
**Roles:** Leader
**Priority:** Must-have

#### AC-14: Submit enabled with all valid scores
**Given** I have entered scores 1-4 for all 6 questions
**When** I look at the submit button
**Then** "Enviar Avaliacao" is enabled
**Roles:** Leader
**Priority:** Must-have

#### AC-15: Confirmation dialog before submit
**Given** all scores are valid and submit is enabled
**When** I click "Enviar Avaliacao"
**Then** I see "Confirmar envio da avaliacao? Esta acao nao pode ser desfeita." with Confirmar/Cancelar
**Roles:** Leader
**Priority:** Should-have

#### AC-16: Successful submission
**Given** I confirmed the submission
**When** POST /api/evaluations succeeds
**Then** I see "Avaliacao enviada com sucesso!" and redirect to subordinate list
**Roles:** Leader
**Priority:** Must-have

### Validation & Error Handling

#### AC-17: Score out of range rejected
**Given** I enter 0 or 5 for any question
**When** I view the field
**Then** validation error "Pontuacao deve ser entre 1 e 4" and submit remains disabled
**Roles:** Leader
**Priority:** Must-have

#### AC-18: Non-integer score rejected
**Given** I enter 3.5 or "abc"
**When** I view the field
**Then** validation error "Pontuacao deve ser um numero inteiro entre 1 e 4"
**Roles:** Leader
**Priority:** Must-have

#### AC-19: Self-evaluation blocked
**Given** I am Alice (employee_id=1)
**When** I try /evaluate/1
**Then** 403 "Voce nao pode avaliar a si mesmo", redirect to home
**Roles:** Leader
**Priority:** Must-have

#### AC-20: Non-subordinate evaluation blocked
**Given** I am Henry (employee_id=8)
**When** I try /evaluate/18 (Rachel, not in my tree)
**Then** 403 "Voce nao tem acesso para avaliar este funcionario"
**Roles:** Leader
**Priority:** Must-have

#### AC-21: Weekly limit exceeded
**Given** I already evaluated Henry this week
**When** I try again same week
**Then** 409 "Voce ja avaliou este funcionario esta semana"
**Roles:** Leader
**Priority:** Must-have

#### AC-22: Different week allowed
**Given** I evaluated Henry in week 33
**When** I evaluate Henry in week 34
**Then** submission succeeds (201)
**Roles:** Leader
**Priority:** Must-have

#### AC-23: Employee not found
**Given** I navigate to /evaluate/999
**When** backend processes
**Then** 404 "Funcionario nao encontrado"
**Roles:** Leader
**Priority:** Must-have

#### AC-24: Incomplete question set rejected
**Given** I submit with only 5 scores
**When** backend validates
**Then** 422 "Todas as 6 questoes devem ser respondidas"
**Roles:** Leader
**Priority:** Must-have

#### AC-25: Network error preserves form
**Given** I filled all scores and submitted
**When** network fails
**Then** error toast "Erro de conexao. Tente novamente." and form data preserved
**Roles:** Leader
**Priority:** Must-have

#### AC-26: Double-click protection
**Given** I clicked Confirmar
**When** POST is in flight
**Then** button disabled during request
**Roles:** Leader
**Priority:** Must-have

### Viewing Evaluations

#### AC-27: Subordinate evaluations overview
**Given** I am David and have evaluated Henry and Liam
**When** I view the home page
**Then** table shows Henry and Liam with latest total_score, date, and "Historico" link
**Roles:** Leader
**Priority:** Must-have

#### AC-28: Un-evaluated subordinates
**Given** I am David and have not evaluated anyone
**When** I view evaluations
**Then** all subordinates listed with "Nao avaliado" in score column
**Roles:** Leader
**Priority:** Must-have

#### AC-29: Evaluation history
**Given** Henry has evaluations in weeks 30-33
**When** I click "Historico" on Henry
**Then** chronological table (most recent first): week, date, total_score, expandable rows
**Roles:** Leader
**Priority:** Must-have

#### AC-30: Per-question breakdown
**Given** I am viewing Henry's history
**When** I expand an evaluation row
**Then** 6 rows: question title, weight, score, weighted contribution
**Roles:** Leader
**Priority:** Should-have

#### AC-31: Empty evaluation history
**Given** Henry has never been evaluated
**When** I click "Historico"
**Then** "Nenhuma avaliacao registrada para este funcionario"
**Roles:** Leader
**Priority:** Must-have

#### AC-32: History access control
**Given** I am Henry (employee_id=8)
**When** I try /history/18 (Rachel, not in my tree)
**Then** 403, redirect to home
**Roles:** Leader
**Priority:** Must-have

### Security & Access Control

#### AC-33: No self in subordinate list
**Given** I am Alice (employee_id=1)
**When** subordinate list loads
**Then** Alice is NOT listed
**Roles:** Leader
**Priority:** Must-have

#### AC-34: No peers in subordinate list
**Given** I am Bob (employee_id=2) and Carol is my peer
**When** subordinate list loads
**Then** Carol does NOT appear
**Roles:** Leader
**Priority:** Must-have

#### AC-35: No superiors in subordinate list
**Given** I am David (employee_id=4) and Bob is my manager
**When** subordinate list loads
**Then** Bob does NOT appear
**Roles:** Leader
**Priority:** Must-have

#### AC-36: Backend validates hierarchy on every request
**Given** any API request accessing evaluation data
**When** backend processes
**Then** evaluator_id validated as ancestor via CTE; 403 if not
**Roles:** Leader
**Priority:** Must-have

#### AC-37: Unauthenticated access blocked
**Given** no employee_id in cookie
**When** I call any API endpoint
**Then** 401 Unauthorized
**Roles:** System
**Priority:** Must-have

### Immutability

#### AC-38: No update endpoint
**Given** I submitted an evaluation
**When** I try PUT/PATCH
**Then** 405 Method Not Allowed
**Roles:** Leader
**Priority:** Must-have

#### AC-39: No delete endpoint
**Given** I submitted an evaluation
**When** I try DELETE
**Then** 405 Method Not Allowed
**Roles:** Leader
**Priority:** Must-have

### Data Integrity

#### AC-40: Correct weighted score
**Given** scores: Q1=4, Q2=3, Q3=4, Q4=2, Q5=3, Q6=4
**When** backend calculates
**Then** total_score = 3.40
**Roles:** System
**Priority:** Must-have

#### AC-41: ISO 8601 week number
**Given** submission on August 17, 2026
**When** backend records week
**Then** week_number = 33
**Roles:** System
**Priority:** Must-have

#### AC-42: Year-scoped weekly limit
**Given** evaluation in week 52 of 2026 and week 1 of 2027
**When** backend checks limit
**Then** treated as different weeks, both succeed
**Roles:** System
**Priority:** Must-have

### Performance & UX

#### AC-43: Loading states
**Given** API call in progress
**When** data loads
**Then** spinner/skeleton shown, not blank page
**Roles:** Leader
**Priority:** Should-have

#### AC-44: Error boundary
**Given** React component throws
**When** error occurs
**Then** "Algo deu errado" with retry button
**Roles:** Any
**Priority:** Should-have

#### AC-45: Responsive layout
**Given** mobile device (320-768px)
**When** navigating
**Then** readable, 44px touch targets, stacked columns
**Roles:** Any
**Priority:** Should-have

#### AC-46: 404 page
**Given** unknown route
**When** router can't match
**Then** "Pagina nao encontrada" with home link
**Roles:** Any
**Priority:** Should-have

### Infrastructure

#### AC-47: Health check
**Given** backend running
**When** GET /api/health
**Then** `{ "status": "ok" }` with 200
**Roles:** System
**Priority:** Should-have

#### AC-48: CORS allows frontend
**Given** frontend on localhost:3000
**When** it calls backend on localhost:8000
**Then** request succeeds with CORS headers
**Roles:** System
**Priority:** Must-have

#### AC-49: Seed data loads
**Given** backend starts first time
**When** database initializes
**Then** 20 employees + hierarchy + 6 questions present
**Roles:** System
**Priority:** Must-have

---

## Implementation Plan

| Phase | Name | Depends On | Status |
|-------|------|------------|--------|
| 1 | Project Scaffolding & Schema Resolution | None | ⬜ Pending |
| 2 | Database Layer | Phase 1 | ⬜ Pending |
| 3 | Backend API | Phase 2 | ⬜ Pending |
| 4 | Frontend Foundation | Phase 1, Phase 3 | ⬜ Pending |
| 5 | Frontend Features | Phase 4 | ⬜ Pending |
| 6 | Documentation & Polish | Phase 5 | ⬜ Pending |

---

### Phase 1: Project Scaffolding & Schema Resolution

**Status**: ⬜ Pending
**Objective**: Resolve schema conflict, create project structure, Docker Compose, environment config
**Dependencies**: None

**Tasks**:

- [ ] T001 [ADR] Write ADR-001 in `docs/decisions/20260817-use-sql-dump-schema.md`
  - Decision: Use SQL dump schema `(id, name, email, position_name)` + `leader_lead` M2M table
  - Consequences: All docs updated, `manager_id` FK approach abandoned
  - Reference: spec-flow-analysis §G1, §G2, Appendix D

- [x] T002 [P] Update `docs/architecture.md` Employee model section
  - Replace `first_name, last_name, job_title, department, hire_date, manager_id` with `name, email, position_name`
  - Replace `manager_id` FK description with `leader_lead` M2M table
  - Add `evaluation_year` field to EvaluationResponse and EvaluationSummary
  - Remove `is_submitted` from EvaluationSummary (every row is submitted)

- [x] T003 [P] Update `docs/integrations.md` Employee schema
  - Replace JSON schema: `{ "id": 1, "name": "Alice Hartman", "email": "alice@co.com", "position_name": "CEO" }`
  - Update API contract table with correct response shapes

- [ ] T004 Create backend project structure in `repos/backend/`
  - Create directory tree: `app/`, `app/models/`, `app/routers/`, `app/services/`, `app/schemas/`, `app/utils/`
  - Create `app/__init__.py`, `app/models/__init__.py`, etc.
  - Create `requirements.txt` with: fastapi, uvicorn[standard], sqlalchemy, alembic, pydantic, python-dotenv

- [ ] T005 [P] Create `repos/backend/app/config.py`
  - Pydantic Settings class reading from `.env`
  - Fields: `DATABASE_URL` (default `sqlite:///./data/casetecnico.db`), `API_HOST`, `API_PORT`, `DEBUG`
  - CORS origins list: `["http://localhost:3000", "http://localhost:5173"]`

- [ ] T006 [P] Create `repos/backend/app/database.py`
  - SQLAlchemy `create_engine` with `check_same_thread=False`, `pool_pre_ping=True`
  - `@event.listens_for(engine, "connect")` setting WAL pragmas: `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`, `foreign_keys=ON`, `cache_size=-64000`
  - `SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)`
  - `Base = DeclarativeBase` (SQLAlchemy 2.x style)

- [ ] T007 Create `repos/backend/.env` with default values
  - `DATABASE_URL=sqlite:///./data/casetecnico.db`
  - `API_HOST=0.0.0.0`, `API_PORT=8000`, `DEBUG=true`

- [ ] T008 Initialize frontend project in `repos/frontend/`
  - Run `npm create vite@latest . -- --template react-ts` (or manually create package.json + vite.config.ts + tsconfig.json)
  - Install dependencies: `react-router-dom`, `axios`
  - Create `src/` directory structure
  - Create `src/index.css` with CSS custom properties for color palette:
    ```css
    :root {
      --color-primary: #2c2c2c;
      --color-background: #e8e7e2;
      --color-muted: #767573;
      --color-border: #949492;
      --color-secondary: #8c8c8c;
    }
    body { background-color: var(--color-background); color: var(--color-primary); }
    ```

- [ ] T009 [P] Create `repos/frontend/vite.config.ts`
  - Configure proxy: `/api` -> `http://localhost:8000`
  - Set port to 3000

- [ ] T010 Create `repos/frontend/.env`
  - `VITE_API_URL=http://localhost:8000`
  - `VITE_APP_TITLE=CaseTecnico - Avaliacao de Liderados`

- [ ] T011 Create `repos/backend/Dockerfile`
  - FROM python:3.10-slim
  - WORKDIR /app, COPY requirements.txt, RUN pip install
  - COPY . .
  - CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

- [ ] T012 [P] Create `repos/frontend/Dockerfile`
  - FROM node:18-alpine as build
  - WORKDIR /app, COPY package*.json, RUN npm install, COPY . , RUN npm run build
  - FROM nginx:alpine, COPY --from=build /app/dist /usr/share/nginx/html
  - COPY `repos/frontend/nginx.conf` to `/etc/nginx/conf.d/default.conf`
  - EXPOSE 80

- [ ] T012b [P] Create `repos/frontend/nginx.conf`
  - `server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } location /api { proxy_pass http://backend:8000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; } }`
  - Proxies `/api` to backend service in Docker network
  - SPA fallback for client-side routing

- [ ] T013 Create `docker-compose.yml`
  - Services: `backend` (port 8000, volume for SQLite data), `frontend` (port 3000, proxy to backend)
  - Backend healthcheck: `curl -f http://localhost:8000/api/health || exit 1`
  - Frontend depends_on backend with condition: service_healthy
  - Volume: `backend-data` mounted to `/app/data`

**After completing this phase**:
1. TypeScript/Python validation — Run `pip install -r requirements.txt` and verify imports; Run `npm install` and verify build
2. Update this plan — mark Phase 1 as `✅ Completed` in the table

---

### Phase 2: Database Layer

**Status**: ⬜ Pending
**Objective**: Define all SQLAlchemy models, create Alembic migration, seed data
**Dependencies**: Phase 1

**Tasks**:

- [ ] T014 Create `repos/backend/app/models/employee.py`
  - `class Employee(Base)`: `__tablename__ = "employee"`, columns: `id: Mapped[int] = mapped_column(primary_key=True)`, `name: Mapped[str] = mapped_column(String(100))`, `email: Mapped[str] = mapped_column(String(150), unique=True)`, `position_name: Mapped[str] = mapped_column(String(100))`
  - `class LeaderLead(Base)`: `__tablename__ = "leader_lead"`, columns: `leader_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), primary_key=True)`, `lead_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), primary_key=True)`
  - Table args: `CheckConstraint("leader_id <> lead_id", name="chk_no_self_lead")`, `Index("ix_leader_lead_reverse", "lead_id")`

- [ ] T015 [P] Create `repos/backend/app/models/evaluation_question.py`
  - `class EvaluationQuestion(Base)`: `__tablename__ = "evaluation_question"`
  - Columns: `id: Mapped[int] (PK)`, `title: Mapped[str]`, `weight: Mapped[int]`, `order: Mapped[int]`

- [ ] T016 [P] Create `repos/backend/app/models/evaluation_summary.py`
  - `class EvaluationSummary(Base)`: `__tablename__ = "evaluation_summary"`
  - Columns: `id: Mapped[int] (PK)`, `employee_id: Mapped[int] (FK employee.id)`, `evaluator_id: Mapped[int] (FK employee.id)`, `total_score: Mapped[float]`, `evaluation_date: Mapped[datetime]`, `evaluation_year: Mapped[int]`, `week_number: Mapped[int]`
  - Table args: `UniqueConstraint("evaluator_id", "employee_id", "evaluation_year", "week_number", name="uq_evaluator_employee_week")`, `Index("ix_eval_summary_employee_evaluator", "employee_id", "evaluator_id")`, `Index("ix_eval_summary_latest", "employee_id", "evaluator_id", "evaluation_date")`
  - Note: No `is_submitted` column — every row represents a submitted evaluation

- [ ] T017 [P] Create `repos/backend/app/models/evaluation_response.py`
  - `class EvaluationResponse(Base)`: `__tablename__ = "evaluation_response"`
  - Columns: `id: Mapped[int] (PK)`, `evaluation_summary_id: Mapped[int] (FK evaluation_summary.id)`, `question_id: Mapped[int] (FK evaluation_question.id)`, `score: Mapped[int]`
  - Table args: `UniqueConstraint("evaluation_summary_id", "question_id", name="uq_eval_response_summary_question")`, `Index("ix_eval_response_question", "question_id")`
  - UNIQUE constraint prevents duplicate responses per question per evaluation

- [ ] T018 [P] Update `repos/backend/app/models/__init__.py`
  - Import all models: `Employee`, `LeaderLead`, `EvaluationQuestion`, `EvaluationSummary`, `EvaluationResponse`
  - Export `Base` for Alembic

- [ ] T019 Initialize Alembic in `repos/backend/`
  - Run `alembic init alembic`
  - Configure `alembic.ini`: `sqlalchemy.url = sqlite:///./data/casetecnico.db`
  - Configure `alembic/env.py`: import `Base.metadata` for autogenerate target
  - Set `render_as_batch=True` in Alembic config (required for SQLite)

- [ ] T020 Generate initial Alembic migration
  - Run `alembic revision --autogenerate -m "initial schema"`
  - Verify generated migration creates: employee, leader_lead, evaluation_question, evaluation_response, evaluation_summary
  - Verify indexes and constraints are included

- [ ] T021 Run migration locally IMMEDIATELY (atomic chain)
  - Run `alembic upgrade head`
  - Verify tables exist in SQLite database
  - This prevents schema drift in subsequent migrations

- [ ] T022 Create `repos/backend/app/services/seed.py`
  - `def seed_database(db: Session) -> None`
  - Check if `employee` table already has data; return early if so (idempotent)
  - Insert 20 employees from SQL dump (adapted for SQLite: no `SERIAL`, no `setval`)
  - Insert 19 `leader_lead` relationships from SQL dump
  - Insert 6 `evaluation_question` rows with titles, weights, and order from brainstorm
  - Use SQLAlchemy `insert()` with `prefixes=["OR IGNORE"]` or check-before-insert for idempotency

- [ ] T023 [P] Create `repos/backend/app/utils/week.py`
  - `def get_current_iso_week() -> tuple[int, int]`: returns `(year, week_number)` using `datetime.now().isocalendar()`
  - `def get_week_number(dt: datetime) -> tuple[int, int]`: returns `(year, week_number)` for a given datetime

**After completing this phase**:
1. Run `alembic upgrade head` — verify database schema
2. Run seed function — verify 20 employees + 19 relationships + 6 questions loaded
3. Update this plan — mark Phase 2 as `✅ Completed`

---

### Phase 3: Backend API

**Status**: ⬜ Pending
**Objective**: Implement all API endpoints with auth, hierarchy validation, evaluation logic
**Dependencies**: Phase 2

**Tasks**:

- [ ] T024 Create `repos/backend/app/dependencies.py`
  - `def get_db() -> Generator[Session]`: yield SessionLocal, close in finally
  - `def get_employee_id_from_cookie(employee_id: str | None = Cookie(default=None)) -> str`: raise 401 if missing
  - `def get_current_employee(employee_id: Annotated[str, Depends(get_employee_id_from_cookie)], db: Session = Depends(get_db)) -> Employee`: query Employee by id, raise 401 if not found

- [ ] T025 [P] Create `repos/backend/app/exceptions.py`
  - `class WeeklyLimitExceeded(HTTPException)`: status 409, detail with message and existing_evaluation_id
  - `class HierarchyViolation(HTTPException)`: status 403
  - `class SelfEvaluationBlocked(HTTPException)`: status 403
  - `class EmployeeNotFound(HTTPException)`: status 404

- [ ] T026 Create `repos/backend/app/services/hierarchy.py`
  - `def get_all_subordinates(db: Session, leader_id: int) -> list[int]`: CTE recursive query through `leader_lead` using `UNION` (not `UNION ALL`) for cycle safety. Anchor: `SELECT lead_id FROM leader_lead WHERE leader_id = :leader_id`. Recursive: join `leader_lead` to CTE alias. Return list of lead_id values.
  - `def get_all_subordinates_with_depth(db: Session, leader_id: int) -> list[tuple[int, int]]`: Same CTE but also tracks recursion depth (0 for direct reports, incremented per level). Returns `(lead_id, depth)` tuples. Used for hierarchy-depth sorting.
  - `def is_ancestor_of(db: Session, ancestor_id: int, descendant_id: int) -> bool`: call `get_all_subordinates(ancestor_id)`, check `descendant_id in result`
  - **CTE caching:** Implement `_subordinate_cache: dict[int, tuple[float, list[int]]]` module-level dict. On lookup, check if `time.time() - timestamp > 300`; if expired or missing, recompute CTE and store. On write operations (create_evaluation), call `_subordinate_cache.clear()` to invalidate. Wrap in helper `_get_cached_subordinates(db, leader_id)` for clean usage.

- [ ] T027 Create `repos/backend/app/services/evaluation.py`
  - `def create_evaluation(db: Session, evaluator_id: int, data: EvaluationCreate) -> EvaluationSummary`:
    1. Validate `evaluator_id != data.employee_id` (self-eval check)
    2. Validate `is_ancestor_of(db, evaluator_id, data.employee_id)` (hierarchy check)
    3. Compute `(year, week) = get_current_iso_week()` from `datetime.now()`
    4. Check weekly limit: query `EvaluationSummary` WHERE `evaluator_id AND employee_id AND evaluation_year AND week_number`; raise `WeeklyLimitExceeded` if exists
    5. Calculate `total_score = sum(score * weight for score, weight in scores_with_weights) / 100`; round to 2 decimals
    6. Create `EvaluationSummary` row
    7. Create 6 `EvaluationResponse` rows (one per question)
    8. Commit and return summary
  - `def get_subordinate_evaluations(db: Session, leader_id: int) -> list[SubordinateEvaluationResponse]`: Use CTE to rank evaluations: `WITH ranked AS (SELECT es.*, ROW_NUMBER() OVER (PARTITION BY es.employee_id ORDER BY es.evaluation_date DESC) AS rn FROM evaluation_summary es JOIN subordinate_ids s ON es.employee_id = s.lead_id WHERE es.evaluator_id = :leader_id)`. Then LEFT JOIN ranked (WHERE rn = 1) with employee info. Return one `SubordinateEvaluationResponse` per subordinate with `latest_evaluation` or null. **Sort by depth ASC** (hierarchy top-down: CEO first, then direct reports, then indirect).
  - `def get_evaluation_history(db: Session, evaluator_id: int, employee_id: int) -> list[EvaluationSummaryResponse]`: Validate hierarchy, return all summaries with nested question responses ordered by evaluation_date DESC

- [ ] T028 Create `repos/backend/app/schemas/employee.py`
  - `class EmployeeResponse(BaseModel)`: `model_config = ConfigDict(from_attributes=True)`. Fields: `id: int`, `name: str`, `email: str`, `position_name: str`

- [ ] T029 [P] Create `repos/backend/app/schemas/evaluation.py`
  - `class ScoreInput(BaseModel)`: `model_config = ConfigDict(extra="forbid")`. Fields: `question_id: int = Field(ge=1, le=6)`, `score: int = Field(ge=1, le=4)`
  - `class EvaluationCreate(BaseModel)`: `model_config = ConfigDict(extra="forbid")`. Fields: `employee_id: int`, `scores: list[ScoreInput]`. Validator: `len(scores) == 6`, all question_ids unique and == {1,2,3,4,5,6}
  - `class EvaluationSummaryResponse(BaseModel)`: `model_config = ConfigDict(from_attributes=True)`. Fields: `id, employee_id, evaluator_id, total_score, evaluation_date, evaluation_year, week_number, questions: list[QuestionScoreResponse]`
  - `class QuestionResponse(BaseModel)`: `model_config = ConfigDict(from_attributes=True)`. Fields: `id, title, weight, order`
  - `class QuestionScoreResponse(BaseModel)`: `model_config = ConfigDict(from_attributes=True)`. Fields: `question_id, title, weight, score`
  - `class SubordinateEvaluationResponse(BaseModel)`: `employee_id: int`, `employee_name: str`, `position_name: str`, `latest_evaluation: EvaluationSummaryResponse | None`, `depth: int`

- [ ] T030 Create `repos/backend/app/routers/health.py`
  - `router = APIRouter(tags=["health"])`
  - `@router.get("/api/health")`: return `{"status": "ok"}`

- [ ] T031 Create `repos/backend/app/routers/employees.py`
  - `router = APIRouter(prefix="/api/employees", tags=["employees"])`
  - `@router.get("/")`: return all employees (for identity selector dropdown)
  - `@router.get("/{employee_id}"): return employee by id; 404 if not found
  - `@router.get("/{employee_id}/subordinates")`: get current user from cookie, validate hierarchy, return `get_all_subordinates()` as Employee list

- [ ] T032 [P] Create `repos/backend/app/routers/evaluations.py`
  - `router = APIRouter(prefix="/api/evaluations", tags=["evaluations"])`
  - `@router.get("/questions")`: return all EvaluationQuestion rows ordered by `order`
  - `@router.post("/", status_code=201)`: get current user from cookie, call `create_evaluation()`, return EvaluationSummaryResponse
  - `@router.get("/subordinates")`: get current user from cookie, call `get_subordinate_evaluations()`, return list
  - `@router.get("/employee/{employee_id}")`: get current user from cookie, validate hierarchy, call `get_evaluation_history()`, return list

- [ ] T033 Create `repos/backend/app/main.py`
  - Import FastAPI, CORSMiddleware
  - Create `app = FastAPI(title="CaseTecnico API", version="1.0.0")`
  - Add CORSMiddleware: `allow_origins=["http://localhost:3000", "http://localhost:5173"]`, `allow_credentials=True`, `allow_methods=["GET", "POST", "OPTIONS"]`, `allow_headers=["Content-Type", "Cookie"]`
  - Include routers: health, employees, evaluations
  - Use `lifespan` async context manager (not deprecated `on_event`): `@asynccontextmanager async def lifespan(app): os.makedirs("data", exist_ok=True); seed_database(SessionLocal()); yield`
  - Create data directory if not exists: `os.makedirs("data", exist_ok=True)`

- [ ] T034 Verify backend starts and API works
  - Run `uvicorn app.main:app --reload --port 8000`
  - Verify `GET /api/health` returns 200
  - Verify `GET /api/employees` returns 20 employees
  - Verify `GET /api/evaluations/questions` returns 6 questions
  - Verify `GET /api/employees/1/subordinates` returns 18 subordinates for Alice

**After completing this phase**:
1. Run backend server and verify all endpoints with curl/httpie
2. Verify hierarchy CTE works for all employees
3. Verify seed data is correct
4. Update this plan — mark Phase 3 as `✅ Completed`

---

### Phase 4: Frontend Foundation

**Status**: ⬜ Pending
**Objective**: Set up auth, API services, types, routing, layout, home page
**Dependencies**: Phase 1, Phase 3

**Tasks**:

- [ ] T035 Create `repos/frontend/src/types/index.ts`
  - `interface Employee { id: number; name: string; email: string; position_name: string; }`
  - `interface Question { id: number; title: string; weight: number; order: number; }`
  - `interface QuestionScore { question_id: number; title: string; weight: number; score: number; }`
  - `interface ScoreInput { question_id: number; score: number; }`
  - `interface EvaluationCreate { employee_id: number; scores: ScoreInput[]; }`
  - `interface EvaluationSummary { id: number; employee_id: number; evaluator_id: number; total_score: number; evaluation_date: string; evaluation_year: number; week_number: number; questions: QuestionScore[]; }`
  - `interface SubordinateEvaluation { employee_id: number; employee_name: string; position_name: string; latest_evaluation: EvaluationSummary | null; depth: number; }`

- [ ] T036 Create `repos/frontend/src/services/api.ts`
  - `const api = axios.create({ baseURL: '/api' })` (works with Vite proxy)
  - Interceptor: read `employee_id` from localStorage, set as `Cookie: employee_id=...` header on every request
  - Export methods: `getEmployees()`, `getEmployee(id)`, `getSubordinates(id)`, `getQuestions()`, `submitEvaluation(data)`, `getSubordinateEvaluations()`, `getEvaluationHistory(employeeId)`

- [ ] T037 Create `repos/frontend/src/hooks/useAuth.ts`
  - `AuthContext` with `employeeId: number | null`, `setEmployeeId(id: number)`, `clearEmployee()`
  - Provider reads from `localStorage` on mount
  - `setEmployeeId` writes to `localStorage` and updates state
  - `clearEmployee` removes from `localStorage` and updates state

- [ ] T038 Create `repos/frontend/src/components/layout/Layout.tsx`
  - App shell: header with LeaderSelector + main content area
  - Uses `useAuth` to get current employee
  - If no employee_id: render LeaderSelector full-page prompt
  - Otherwise: render header + `<Outlet />`

- [ ] T039 [P] Create `repos/frontend/src/components/layout/LeaderSelector.tsx`
  - Fetches all employees via `getEmployees()`
  - Dropdown with employee names — use `--color-border` border, `--color-background` background, `--color-primary` text
  - On select: call `setEmployeeId(id)`, page reloads/re-fetches
  - Shows "Selecione sua identidade" prompt when no identity selected — use `--color-primary` text, `--color-background` background

- [ ] T040 Create `repos/frontend/src/App.tsx`
  - `BrowserRouter` with routes:
    - `/` -> `Layout` -> `Home`
    - `/evaluate/:employeeId` -> `Layout` -> `Evaluate`
    - `/history/:employeeId` -> `Layout` -> `History`
    - `*` -> `NotFound`
  - Wrap in `AuthProvider`

- [ ] T041 Create `repos/frontend/src/components/ui/LoadingSpinner.tsx`
  - Simple centered spinner component
  - Accept optional `size` prop

- [ ] T042 [P] Create `repos/frontend/src/components/ui/EmptyState.tsx`
  - Accept `message: string` prop
  - Centered text with optional icon

- [ ] T043 [P] Create `repos/frontend/src/components/ui/ErrorBoundary.tsx`
  - Class component with `componentDidCatch`
  - Fallback UI: "Algo deu errado" with "Tentar novamente" button (reloads page)

- [ ] T044 Create `repos/frontend/src/pages/Home.tsx`
  - On mount: fetch subordinate evaluations via `getSubordinateEvaluations()`
  - Render `EmployeeList` component with data
  - Show `LoadingSpinner` while loading
  - Show `EmptyState` if no subordinates

- [ ] T045 [P] Create `repos/frontend/src/components/employee/EmployeeList.tsx`
  - Accept `evaluations: SubordinateEvaluation[]` prop
  - Table: Employee Name, Position, Latest Score (or "Nao avaliado"), Date, Actions
  - **Note:** Email is NOT rendered in the UI (hidden from display)
  - "Avaliar" button links to `/evaluate/:id` — use `--color-primary` background, `--color-background` text
  - "Historico" button links to `/history/:id` — use `--color-border` background, `--color-primary` text
  - If `latest_evaluation` exists and is from current week: show "Avaliado" badge (use `--color-muted` background), disable "Avaliar"
  - Display hierarchy depth indicator (e.g., indentation or badge showing "Direct" vs "Indirect")

- [ ] T046 Create `repos/frontend/src/pages/NotFound.tsx`
  - "Pagina nao encontrada" with link to `/`

**After completing this phase**:
1. Run `npm run dev` and verify: identity selection, home page loads, subordinate list displays
2. Verify auth context persists across navigation
3. Update this plan — mark Phase 4 as `✅ Completed`

---

### Phase 5: Frontend Features

**Status**: ⬜ Pending
**Objective**: Evaluation form, history view, error/loading states, responsive design
**Dependencies**: Phase 4 (transitively depends on Phase 1 + Phase 3)

**Tasks**:

- [ ] T047 Create `repos/frontend/src/pages/Evaluate.tsx`
  - Read `employeeId` from URL params
  - Fetch employee details + questions on mount
  - Validate employee is in subordinate list (redirect if not)
  - **On 403:** show toast "Voce nao tem acesso para avaliar este funcionario", redirect to `/`
  - **On 404:** show toast "Funcionario nao encontrado", redirect to `/`
  - Render `EvaluationForm` component
  - Show `LoadingSpinner` while loading

- [ ] T048 [P] Create `repos/frontend/src/components/evaluation/EvaluationForm.tsx`
  - Accept `employee: Employee`, `questions: Question[]` props
  - Local state: `scores: Record<number, number>` (question_id -> score)
  - For each question: display title, weight, numeric input (1-4)
  - Real-time weighted score preview: `sum(score * weight) / 100` for scored questions
  - Show "X de 6 questoes respondidas"
  - Submit button disabled until all 6 scores entered and valid — use `--color-border` background when disabled, `--color-primary` when enabled
  - On submit: show `ConfirmDialog`, then POST via `submitEvaluation()`
  - On success: show toast, navigate to `/`
  - On 409: show "Ja avaliou esta semana"
  - On 403: show access denied, navigate to `/`

- [ ] T049 Create `repos/frontend/src/components/evaluation/ConfirmDialog.tsx`
  - Accept `isOpen: boolean`, `onConfirm: () => void`, `onCancel: () => void`
  - Modal: "Confirmar envio da avaliacao? Esta acao nao pode ser desfeita."
  - Two buttons: "Confirmar" (`--color-primary` background) and "Cancelar" (`--color-border` background)

- [ ] T050 [P] Create `repos/frontend/src/pages/History.tsx`
  - Read `employeeId` from URL params
  - Fetch employee details + evaluation history on mount
  - Validate hierarchy (redirect if 403)
  - Render `EvaluationHistory` component

- [ ] T051 Create `repos/frontend/src/components/history/EvaluationHistory.tsx`
  - Accept `history: EvaluationSummary[]`, `employeeName: string`
  - Table: Week, Year, Date, Total Score, expandable rows
  - Expandable row: `EvaluationDetail` component with per-question breakdown
  - Empty state: "Nenhuma avaliacao registrada para este funcionario"

- [ ] T052 [P] Create `repos/frontend/src/components/history/EvaluationDetail.tsx`
  - Accept `summary: EvaluationSummary` prop
  - Table: Question Title, Weight, Score, Weighted Contribution (score * weight / 100)
  - Total row at bottom

- [ ] T053 Expand responsive CSS in `repos/frontend/src/index.css`
  - CSS custom properties already defined in T008 — verify tokens are present
  - Add responsive breakpoints using the color palette tokens:
    - Mobile breakpoint: `< 768px` — stack columns, full-width buttons
    - Tablet breakpoint: `768-1024px` — 2-column layout
    - Desktop breakpoint: `> 1024px` — full layout
  - Minimum touch targets: 44px height for buttons and inputs
  - Table horizontal scroll on mobile

- [ ] T054 Create `repos/frontend/src/components/ui/Toast.tsx`
  - Simple toast notification component (no external library)
  - Props: `message: string`, `type: 'success' | 'error'`, `onClose: () => void`
  - Success: `--color-primary` background, `--color-background` text, auto-dismiss after 3s
  - Error: red background (#c0392b), `--color-background` text, manual dismiss
  - Render via `createPortal` to body, positioned top-right
  - Used in: evaluation submission success (AC-16), API errors (AC-25)

**After completing this phase**:
1. Full end-to-end flow test: select identity -> view subordinates -> evaluate -> view history
2. Verify all acceptance criteria from AC-10 to AC-32
3. Verify responsive layout on mobile/tablet/desktop
4. Update this plan — mark Phase 5 as `✅ Completed`

---

### Phase 6: Documentation & Polish

**Status**: ⬜ Pending
**Objective**: README, setup instructions, architecture diagram, final cleanup
**Dependencies**: Phase 5
**Done Criteria**: All 49 acceptance criteria verified manually. Document results in verification log.

**Tasks**:

- [ ] T055 Create `README.md` (or `repos/README.md`)
  - Project overview
  - Architecture diagram (ASCII or description)
  - Setup instructions: prerequisites, install, run
  - API endpoint documentation
  - Docker instructions

- [ ] T056 [P] Verify all Docker Compose services start correctly
  - Run `docker-compose up --build`
  - Verify frontend accessible at http://localhost:3000
  - Verify backend API at http://localhost:8000
  - Verify Swagger docs at http://localhost:8000/docs
  - Verify seed data loaded

- [ ] T057 Final cleanup and consistency check
  - Verify all file paths match plan
  - Verify all acceptance criteria are testable
  - Remove any debug/placeholder code
  - Ensure consistent code style across files

**After completing this phase**:
1. Full Docker Compose test from clean state
2. Verify all 49 acceptance criteria
3. Update this plan — mark Phase 6 as `✅ Completed`

---

## ✅ Master Checklist

### Phase 1: Project Scaffolding & Schema Resolution
- [ ] T001 Write ADR-001 for schema decision
- [ ] T002 Update architecture.md Employee model
- [x] T003 Update integrations.md Employee schema
- [ ] T004 Create backend project structure
- [ ] T005 Create config.py
- [ ] T006 Create database.py with WAL pragmas
- [ ] T007 Create backend .env
- [ ] T008 Initialize frontend project
- [ ] T009 Create vite.config.ts with proxy
- [ ] T010 Create frontend .env
- [ ] T011 Create backend Dockerfile
- [ ] T012 Create frontend Dockerfile
- [ ] T012b Create frontend nginx.conf
- [ ] T013 Create docker-compose.yml
- [ ] Python dependencies install and verify

### Phase 2: Database Layer
- [ ] T014 Create Employee + LeaderLead models
- [ ] T015 Create EvaluationQuestion model
- [ ] T016 Create EvaluationSummary model (with evaluation_year, unique constraint)
- [ ] T017 Create EvaluationResponse model
- [ ] T018 Update models/__init__.py
- [ ] T019 Initialize Alembic with SQLite config
- [ ] T020 Generate initial migration
- [ ] T021 Run migration locally (atomic chain)
- [ ] T022 Create seed.py service
- [ ] T023 Create week.py utility

### Phase 3: Backend API
- [ ] T024 Create dependencies.py (DI chain)
- [ ] T025 Create exceptions.py (custom errors)
- [ ] T026 Create hierarchy.py service (CTE with UNION)
- [ ] T027 Create evaluation.py service (CRUD + validation)
- [ ] T028 Create employee schema
- [ ] T029 Create evaluation schemas (Pydantic 2.x)
- [ ] T030 Create health router
- [ ] T031 Create employees router
- [ ] T032 Create evaluations router
- [ ] T033 Create main.py (app factory + CORS)
- [ ] T034 Verify backend endpoints

### Phase 4: Frontend Foundation
- [ ] T035 Create TypeScript types
- [ ] T036 Create API service (Axios)
- [ ] T037 Create useAuth hook (context)
- [ ] T038 Create Layout component
- [ ] T039 Create LeaderSelector component
- [ ] T040 Create App.tsx (routing)
- [ ] T041 Create LoadingSpinner
- [ ] T042 Create EmptyState
- [ ] T043 Create ErrorBoundary
- [ ] T044 Create Home page
- [ ] T045 Create EmployeeList component
- [ ] T046 Create NotFound page

### Phase 5: Frontend Features
- [ ] T047 Create Evaluate page
- [ ] T048 Create EvaluationForm component
- [ ] T049 Create ConfirmDialog component
- [ ] T050 Create History page
- [ ] T051 Create EvaluationHistory component
- [ ] T052 Create EvaluationDetail component
- [ ] T053 Add responsive CSS
- [ ] T054 Add toast notification system

### Phase 6: Documentation & Polish
- [ ] T055 Create README.md
- [ ] T056 Verify Docker Compose
- [ ] T057 Final cleanup

---

## Clarifications

**Detailed clarifications:** [20260817203000-case-tecnico-avaliacao-plan.clarifications.md](./20260817203000-case-tecnico-avaliacao-plan.clarifications.md)

### Open Items (from Brainstorm)
1. **SQLite vs PostgreSQL:** Resolved — SQLite for demo, document migration path
2. **Seed data:** Use SQL dump adapted for SQLite
3. **UI/UX design system:** No external library — custom CSS with responsive breakpoints
4. **Cloud deployment:** Local only
5. **Test coverage:** Not in scope for this plan (case técnico focuses on implementation)

### Resolved During Planning
1. **Schema conflict (G1/G2):** Use SQL dump schema — ADR-001 in Phase 1
2. **Week year scoping (G8/G9):** Add `evaluation_year` field — Phase 2
3. **Draft persistence (G3):** Not implemented — form data lost on tab close (acceptable for demo)
4. **Confirmation dialog (G4):** Implemented in Phase 5
5. **Loading states (G5):** Implemented in Phase 4/5

### Resolved via Clarification (2026-08-17)
1. **CTE caching:** Implement basic caching with `functools.lru_cache` + 5-min TTL on `get_all_subordinates()`. Add task to Phase 3.
2. **Subordinate list sort:** By hierarchy depth (CEO → direct → indirect). Add depth tracking to CTE query.
3. **Email visibility:** Hide email in UI. API returns it but UI doesn't render it.
4. **403 on evaluate:** Redirect to home with toast "Voce nao tem acesso para avaliar este funcionario". Consistent with AC-19/AC-20.
5. **Done criteria:** All 49 acceptance criteria must pass manually. Document results in verification log.

### Resolved via Clarification (2026-08-17 Post-Review)
1. **EvaluationSummary response shape:** Add nested `questions` array to `EvaluationSummaryResponse` (aligns with integrations.md). Update T029, T035, T027, T051.
2. **RN-12 implementation:** Follow plan (current leader only). RN-12 deferred to future enhancement.
3. **Subordinate list nested questions:** Include nested questions in `GET /api/evaluations/subordinates` response for consistency.
