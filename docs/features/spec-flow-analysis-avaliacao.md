# Spec Flow Analysis: Plataforma de Avalia\u00e7\u00e3o de Liderados

**Date:** 2026-08-17
**Status:** Completed
**Analyst:** UX Flow Analyst (spec-flow-analyzer role)
**Source docs:** architecture.md, integrations.md, brainstorm, case_tecnico.txt, Dump Employee.sql

---

## Critical Schema Inconsistency (Found During Analysis)

> **BLOCKER -- Must resolve before any implementation.**
>
> The **SQL dump** uses a **many-to-many** `leader_lead` join table with columns `(leader_id, lead_id)` and a flat `employee` table with `(id, name, email, position_name)`.
>
> The **brainstorm/architecture** documents assume a **single-FK** `manager_id` on the `employee` table with columns `(id, first_name, last_name, job_title, department, hire_date, manager_id)`.
>
> These two approaches produce fundamentally different queries, API contracts, and frontend components. The entire spec flow analysis below documents both paths and recommends a resolution.

---

## 1. User Flow Overview

### User Roles

| Role | Description | Access Level |
|------|-------------|-------------|
| **Leader (Avaliador)** | Employee who evaluates subordinates (direct + indirect) | Full: evaluate, view history, view subordinate evaluations |
| **Employee (Avaliado)** | Employee being evaluated | Read-only: own evaluation NOT visible in this version. No UI interaction. |
| **System** | Backend service | Validates hierarchy, enforces weekly limits, computes weighted scores |

> **Note:** There is no admin role. Leader switching is done via cookie/localStorage dropdown (simulated auth).

### User Journey Map

#### Journey 1: Leader Selects Identity (Auth Simulation)

```
Entry: Application loads (any page)
  |
  +---> LeaderSelector component renders in persistent header/sidebar
  |     +---> Fetches GET /api/employees (all employees)
  |     +---> Displays dropdown with employee names
  |     +---> User selects self from dropdown
  |           +---> Frontend stores employee_id in cookie/localStorage
  |           +---> Frontend reads cookie on subsequent requests
  |           +---> Backend reads employee_id from cookie header on API calls
  |
  +---> If no employee_id stored: show "Select your identity" prompt
  +---> If employee_id exists: auto-load as that leader
```

#### Journey 2: Leader Evaluates a Subordinate (Happy Path)

```
Entry: Leader navigates to /evaluate or clicks "Evaluate" on subordinate
  |
  +---> Step 1: Fetch subordinate list
  |     +---> GET /api/employees/{id}/subordinates (current leader id)
  |     +---> Backend executes CTE recursive query
  |     +---> Returns Employee[] (all direct + indirect reports)
  |     +---> Frontend renders EmployeeList component
  |
  +---> Step 2: Leader selects employee to evaluate
  |     +---> Click on employee row -> Navigate to /evaluate/:employeeId
  |     +---> Frontend fetches GET /api/employees/{employeeId}
  |     +---> Validates: employee IS in leader subordinate tree
  |
  +---> Step 3: Load evaluation form
  |     +---> GET /api/evaluations/questions
  |     +---> Returns 6 questions with weights
  |     +---> Frontend renders EvaluationForm (6 input fields, 1-4 slider/number)
  |     +---> Displays weighted score calculation in real-time
  |
  +---> Step 4: Leader fills scores
  |     +---> Enters 1-4 for each question
  |     +---> Real-time weighted average preview:
  |     |     total = Sum(score_i x weight_i) / 100
  |     +---> "Submit" button enabled only when all 6 scored
  |
  +---> Step 5: Leader submits
        +---> POST /api/evaluations
        |     Body: { employee_id, scores: [{question_id, score} x 6] }
        +---> Backend validates:
        |     +-- evaluator_id (from cookie) != employee_id (no self-eval)
        |     +-- evaluator_id IS ancestor of employee_id (CTE check)
        |     +-- No existing evaluation for this pair in current ISO week
        |     +-- All scores in [1, 4], all 6 questions present
        +---> Backend creates EvaluationResponse rows (6 rows)
        +---> Backend creates/updates EvaluationSummary (1 row)
        +---> Returns EvaluationSummary with total_score
        +---> Frontend shows success toast, redirect to subordinate list
```

#### Journey 3: Leader Views Subordinate Evaluations

```
Entry: Leader navigates to /subordinates or Home page
  |
  +---> GET /api/evaluations/subordinates
  |     +---> Backend: CTE to find all subordinates of leader
  |     +---> JOIN with EvaluationSummary (latest per subordinate)
  |     +---> Returns EvaluationSummary[] (may be empty for un-evaluated)
  |
  +---> Frontend renders table:
        +---> Columns: Employee Name, Position, Latest Score, Date, Actions
        +---> Actions: "View History" link -> /history/:employeeId
        +---> Empty state: "No evaluations submitted yet"
```

#### Journey 4: Leader Views Evaluation History

```
Entry: Leader clicks "View History" for a subordinate
  |
  +---> Navigate to /history/:employeeId
  +---> GET /api/evaluations/employee/{employeeId}
  |     +---> Backend: validates evaluator is ancestor of employeeId
  |     +---> Returns EvaluationSummary[] (all weeks, sorted by date desc)
  |
  +---> Frontend renders EvaluationHistory component:
        +---> Table: Week, Date, Score, Status (submitted)
        +---> Expandable rows: show per-question breakdown
        +---> Empty state: "No evaluation history for this employee"
```

### Role x Feature Visibility Matrix

| Feature | Leader (evaluator) | Employee (evaluated, no eval access) |
|---------|-------------------|--------------------------------------|
| Leader Selector | Visible | Visible (can switch identity) |
| Subordinate List | Shows own subordinates | Empty (no subordinates) |
| Evaluate Employee | Opens form | Not accessible (no subordinates) |
| View Subordinate Evaluations | Shows evaluations | Empty state |
| View Evaluation History | Shows for subordinates | Empty state |
| Own Evaluation | Blocked by design | Not shown |
| Peer Evaluations | Blocked by design | Not shown |

---

## 2. Flow Permutations Matrix

### 2.1 Entry Point Permutations

| # | Entry Point | Role | Expected Outcome |
|---|------------|------|-----------------|
| 1.1 | Direct URL `/` | Leader (no cookie) | Show leader selector prompt |
| 1.2 | Direct URL `/` | Leader (with cookie) | Show home/dashboard |
| 1.3 | Direct URL `/evaluate` | Leader | Redirect to `/` then to form after selecting employee |
| 1.4 | Direct URL `/evaluate/5` | Leader | Load form for employee 5 (if subordinate) |
| 1.5 | Direct URL `/evaluate/5` | Leader, employee 5 NOT subordinate | 403 error / redirect to home |
| 1.6 | Direct URL `/evaluate/1` (self) | Leader is employee 1 | Blocked -- cannot self-evaluate |
| 1.7 | Direct URL `/history/5` | Leader | Show history for employee 5 |
| 1.8 | Direct URL `/subordinates` | Leader | Show subordinate list |
| 1.9 | Browser back button | Any | State preserved (cookie persists) |
| 1.10 | Page refresh during evaluation | Leader | Form data LOST (no draft persistence) |

### 2.2 Evaluation Submission Permutations

| # | Scenario | Expected Outcome |
|---|---------|-----------------|
| 2.1 | All 6 scores valid, first eval this week | Success 201 |
| 2.2 | Missing 1 score | 422 Validation Error |
| 2.3 | Score = 0 (out of range) | 422 Validation Error |
| 2.4 | Score = 5 (out of range) | 422 Validation Error |
| 2.5 | Score = 3.5 (non-integer) | 422 Validation Error |
| 2.6 | Already evaluated this pair this week | 409 Conflict |
| 2.7 | Employee not in subordinate tree | 403 Forbidden |
| 2.8 | Employee does not exist | 404 Not Found |
| 2.9 | Leader evaluates same employee in different week | Success 201 |
| 2.10 | Leader evaluates different subordinate same week | Success 201 |
| 2.11 | Two leaders evaluate same employee same week | Success for both (different evaluator_id) |
| 2.12 | Duplicate submission (double-click) | 409 Conflict on second request |
| 2.13 | Network timeout during submission | Frontend error toast, form state preserved |
| 2.14 | Backend crash during submission | 500 error, no data written (atomic) |

### 2.3 Hierarchy Permutations

| # | Scenario | Expected Outcome |
|---|---------|-----------------|
| 3.1 | Alice (CEO) evaluates James (4 levels down) | Allowed (indirect subordinate) |
| 3.2 | Alice evaluates Bob (direct) | Allowed |
| 3.3 | Bob evaluates Alice (upward) | 403 Forbidden |
| 3.4 | Henry evaluates James (direct) | Allowed |
| 3.5 | James evaluates Henry (upward) | 403 Forbidden |
| 3.6 | David evaluates Liam (direct) | Allowed |
| 3.7 | David evaluates James (indirect, under Henry) | Allowed |
| 3.8 | Henry evaluates Liam (peer under same manager David) | 403 Forbidden (not in hierarchy) |
| 3.9 | Employee with no manager (top-level CEO) | No subordinates -> empty state |
| 3.10 | Employee with no reports (leaf node) | Empty subordinate list |
| 3.11 | Circular manager reference (data corruption) | CTE should terminate (no infinite loop) |

### 2.4 State Transition Permutations

| # | State A | Event | State B |
|---|---------|-------|---------|
| 4.1 | No evaluation exists | POST /api/evaluations | EvaluationSummary created, is_submitted=true |
| 4.2 | Evaluation exists (submitted) | Attempt to edit | Blocked (immutability) |
| 4.3 | Evaluation exists (submitted) | Attempt re-submit same week | 409 Conflict |
| 4.4 | No evaluation exists | Navigate to evaluate form | Form displayed (draft state) |
| 4.5 | Form in draft state | Leader closes tab | Draft lost |
| 4.6 | Form in draft state | Leader clicks submit | Evaluation created |
| 4.7 | Leader changes identity via dropdown | All data re-fetched | New leader subordinates shown |

### 2.5 Error Recovery Permutations

| # | Error | Recovery Path |
|---|-------|--------------|
| 5.1 | API returns 500 | Frontend shows error toast, user retries manually |
| 5.2 | API returns 403 | Frontend shows "access denied" message, redirect to home |
| 5.3 | API returns 404 | Frontend shows "employee not found" |
| 5.4 | API returns 409 | Frontend shows "already evaluated this week" |
| 5.5 | API returns 422 | Frontend highlights invalid fields |
| 5.6 | Network disconnected | Frontend shows "connection error" toast |
| 5.7 | Cookie cleared mid-session | Next API call fails, frontend prompts re-selection |
| 5.8 | Invalid employee_id in cookie | Backend returns 401, frontend prompts re-selection |

### 2.6 Data Volume Permutations

| # | Scenario | Expected Behavior |
|---|---------|-------------------|
| 6.1 | 20 employees, 0 evaluations | Empty state on all views |
| 6.2 | 20 employees, 50 evaluations | Paginated or full list |
| 6.3 | 1000+ employees | Performance concern: CTE query, list rendering |
| 6.4 | Leader with 0 subordinates | Empty state |
| 6.5 | Leader with 15 subordinates | Full list, no pagination needed |
| 6.6 | Employee evaluated 20 weeks in a row | History shows 20 rows |

### 2.7 Concurrency Permutations

| # | Scenario | Expected Behavior |
|---|---------|-------------------|
| 7.1 | Two browser tabs same leader, same employee | Second submit gets 409 (week limit) |
| 7.2 | Two leaders, same employee, same week | Both succeed (different evaluator_id) |
| 7.3 | Leader submits while switching identity | Submission uses cookie value at request time |
| 7.4 | SQLite write lock during concurrent submit | WAL mode handles; second request waits or fails |

---

## 3. Gaps & Missing Elements

| # | Gap | Impact | Problem Description | Proposed Handling |
|---|-----|--------|-------------------|------------------|
| G1 | **Schema conflict: leader_lead M2M vs manager_id FK** | **CRITICAL** | SQL dump uses many-to-many `leader_lead` table. Architecture/brainstorm docs assume `manager_id` FK on `employee`. These produce different CTE queries, different models, different API contracts. | **Decision required.** Recommend: Use the SQL dump `leader_lead` table (official data source). Adapt architecture docs to match. |
| G2 | **Employee schema mismatch** | **CRITICAL** | SQL dump has `(id, name, email, position_name)`. Brainstorm has `(id, first_name, last_name, job_title, department, hire_date, manager_id)`. Different columns, different types. | **Decision required.** Recommend: Use dump schema for Employee model. Derive first_name/last_name from name if needed. |
| G3 | **No draft/save functionality** | **High** | If leader fills 4/6 scores and closes tab, all progress is lost. No localStorage draft persistence. | Add localStorage draft save per leader-employee pair. Restore on page load. |
| G4 | **No confirmation before submit** | **Medium** | Leader can accidentally submit with wrong scores. No undo possible. | Add confirmation dialog: "Submit evaluation? This cannot be changed." |
| G5 | **No loading states specified** | **Medium** | API calls may take time (especially CTE queries). No loading indicators defined. | Add skeleton/spinner components for: subordinate list, evaluation form, history view. |
| G6 | **No pagination for subordinate list** | **Low** | If leader has many subordinates (100+), list may be slow. No pagination spec. | Add client-side pagination or virtual scrolling for lists > 50 items. |
| G7 | **No error boundary for React** | **Medium** | Runtime errors in components crash entire app. No error boundary defined. | Add React ErrorBoundary wrapping main routes. |
| G8 | **Week number calculation ambiguity** | **Medium** | ISO week vs. calendar week vs. business week. Not specified which to use. | Use ISO 8601 week number (datetime.isocalendar().week). Document in glossary. |
| G9 | **Year boundary edge case** | **Medium** | Employee evaluated in week 52 of 2026, then again in week 1 of 2027. Different year, same week number -> should be allowed. | Week number must be scoped by year: (year, week_number) pair. |
| G10 | **No API response for "already evaluated this week"** | **Medium** | Integrations.md mentions 409 but no response body schema defined. | Define 409 response: `{ detail: "Already evaluated this employee this week", existing_evaluation_id: N }`. |
| G11 | **GET /api/evaluations/subordinates returns what exactly?** | **High** | Endpoint returns "EvaluationSummary[]" but unclear: latest only? All time? Per-subordinate? Does it include employees never evaluated? | Define: Returns one row per subordinate, with latest evaluation OR null if never evaluated. |
| G12 | **GET /api/evaluations/employee/{id} access control** | **High** | History endpoint must verify the requesting leader IS an ancestor of the employee. Not specified what happens if not. | Return 403 if requester is not an ancestor of the target employee. |
| G13 | **No "mark as reviewed" or status workflow** | **Low** | `is_submitted` field exists but no workflow beyond it. No draft-to-submitted transition spec. | For this version: `is_submitted` always true after POST. No draft state persisted server-side. |
| G14 | **Weighted score calculation not fully specified** | **Medium** | total_score = Sum(score_i x weight_i) / 100. But: integer division or float? Rounding? Decimal places? | Use float with 2 decimal places: round(total, 2). |
| G15 | **No mobile/responsive spec** | **Medium** | No mention of mobile layout, touch targets, or responsive breakpoints. | Define: responsive layout, form inputs minimum 44px touch targets, stack columns on mobile. |
| G16 | **Cookie/localStorage sync** | **Low** | If user sets cookie in one tab, does another tab see it? localStorage is tab-scoped in some cases. | Use localStorage (shared across tabs in same origin). Sync on storage event. |
| G17 | **Backend does not validate all 6 questions submitted** | **High** | POST /api/evaluations body has scores[] array. What if only 5 are sent? | Backend must validate exactly 6 scores, one per question_id 1-6. Return 422 if incomplete. |
| G18 | **No audit logging** | **Low** | No spec for logging who evaluated whom and when beyond the evaluation tables. | For demo: sufficient in EvaluationResponse. Production: add audit_log table. |
| G19 | **Seed data not using architecture schema** | **Medium** | SQL dump creates different tables than architecture.md specifies. Migration will conflict. | Generate Alembic migration from dump schema, NOT from architecture.md. |
| G20 | **Frontend routes not fully specified** | **Low** | Architecture mentions routes but not all navigation flows. Missing: 404 page, unauthorized redirect. | Add catch-all route -> 404 page. Unauthenticated -> leader selector. |
| G21 | **No evaluation detail view (per-question breakdown)** | **Medium** | History shows total_score but no way to see individual question scores in UI. | Add expandable row or detail modal showing per-question score and weight. |
| G22 | **Concurrent leader switching** | **Low** | If user switches leader while API call is in flight, stale data may display. | Cancel in-flight requests on leader switch (AbortController). |
| G23 | **Backend CORS configuration** | **Medium** | Frontend and backend on different ports. CORS must be configured for development. | Add CORS middleware in FastAPI: allow `http://localhost:3000`. |
| G24 | **No health check endpoint** | **Low** | Docker Compose depends_on needs health check for proper startup ordering. | Add GET /api/health returning `{ status: "ok" }`. |

---

## 4. Draft Acceptance Criteria

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

**Given** I am logged in as Alice (CEO, employee_id=1) who has subordinates at all hierarchy levels
**When** I navigate to the home page or subordinate list
**Then** I see a list containing ALL employees in my subtree (Bob, Carol, Frank, Tina, David, Eva, Grace, Quinn, Paul, Henry, Liam, Isabelle, Mia, Noah, James, Karen, Rachel, Samuel, Olivia) -- 18 employees total

**Roles:** Leader
**Priority:** Must-have

#### AC-7: Leader with no subordinates sees empty state

**Given** I am logged in as James (employee_id=10, a leaf node with no reports)
**When** I navigate to the home page
**Then** I see an empty state message: "Voce nao possui subordinados para avaliar"

**Roles:** Leader
**Priority:** Must-have

#### AC-8: Subordinate list shows key employee info

**Given** I am logged in as David (employee_id=4) with subordinates Henry, Liam, James, Karen
**When** the subordinate list loads
**Then** each row displays: employee name, job title/position, and an "Avaliar" (Evaluate) action button

**Roles:** Leader
**Priority:** Must-have

#### AC-9: Subordinate list shows evaluation status

**Given** I am logged in as David and have already evaluated Henry this week
**When** the subordinate list loads
**Then** Henry row shows a green checkmark or "Avaliado" badge indicating this week evaluation is complete, and the "Avaliar" button is disabled or replaced with "Ja avaliado esta semana"

**Roles:** Leader
**Priority:** Should-have

### Evaluation Form

#### AC-10: Leader opens evaluation form for valid subordinate

**Given** I am logged in as David (employee_id=4) and Henry (employee_id=8) is my direct subordinate
**When** I click "Avaliar" on Henry row or navigate to /evaluate/8
**Then** I see Henry name and position at the top, followed by 6 evaluation questions, each with a numeric input (1-4), question title, and weight displayed

**Roles:** Leader
**Priority:** Must-have

#### AC-11: Evaluation form shows 6 questions with correct weights

**Given** I have opened the evaluation form
**When** I view the form
**Then** I see exactly 6 questions in order:
1. Entrega de Resultados (Peso: 25)
2. Execucao e Qualidade do Trabalho (Peso: 20)
3. Capacidade de Aprendizado e Desenvolvimento (Peso: 20)
4. Resolucao de Problemas e Pensamento Critico (Peso: 15)
5. Colaboracao, Influencia e Lideranca (Peso: 10)
6. Visao Estrategica e Potencial de Crescimento (Peso: 10)

**Roles:** Leader
**Priority:** Must-have

#### AC-12: Real-time weighted score preview

**Given** I have opened the evaluation form and scored 3 questions so far
**When** I view the preview section
**Then** I see a partial weighted calculation showing the running total based on the questions scored, and a note indicating "X de 6 questoes respondidas"

**Roles:** Leader
**Priority:** Should-have

#### AC-13: Submit button disabled until all scores entered

**Given** I have opened the evaluation form and scored only 4 of 6 questions
**When** I look at the submit button
**Then** the "Enviar Avaliacao" button is disabled/grayed out

**Roles:** Leader
**Priority:** Must-have

#### AC-14: Submit button enabled with all valid scores

**Given** I have entered scores 1-4 for all 6 questions
**When** I look at the submit button
**Then** the "Enviar Avaliacao" button is enabled and clickable

**Roles:** Leader
**Priority:** Must-have

#### AC-15: Submit triggers confirmation dialog

**Given** I have entered all valid scores and the submit button is enabled
**When** I click "Enviar Avaliacao"
**Then** I see a confirmation dialog: "Confirmar envio da avaliacao? Esta acao nao pode ser desfeita." with "Confirmar" and "Cancelar" buttons

**Roles:** Leader
**Priority:** Should-have

#### AC-16: Successful evaluation submission

**Given** I have confirmed the evaluation submission
**When** the POST /api/evaluations request completes successfully
**Then** I see a success toast "Avaliacao enviada com sucesso!", and I am redirected to the subordinate list

**Roles:** Leader
**Priority:** Must-have

### Validation & Error Handling -- Evaluation

#### AC-17: Score out of range rejected

**Given** I am on the evaluation form
**When** I enter a score of 0 or 5 for any question
**Then** the field shows a validation error "Pontuacao deve ser entre 1 e 4" and the submit button remains disabled

**Roles:** Leader
**Priority:** Must-have

#### AC-18: Non-integer score rejected

**Given** I am on the evaluation form
**When** I enter a score of 3.5 or "abc" for any question
**Then** the field shows a validation error "Pontuacao deve ser um numero inteiro entre 1 e 4"

**Roles:** Leader
**Priority:** Must-have

#### AC-19: Self-evaluation blocked

**Given** I am logged in as Alice (employee_id=1)
**When** I try to navigate to /evaluate/1 (evaluate myself)
**Then** the backend returns 403 Forbidden, and the frontend shows "Voce nao pode avaliar a si mesmo" and redirects to the home page

**Roles:** Leader
**Priority:** Must-have

#### AC-20: Evaluating non-subordinate blocked

**Given** I am logged in as Henry (employee_id=8)
**When** I try to navigate to /evaluate/18 (Rachel, who is under Carol, not in Henry tree)
**Then** the backend returns 403 Forbidden, and the frontend shows "Voce nao tem acesso para avaliar este funcionario"

**Roles:** Leader
**Priority:** Must-have

#### AC-21: Weekly limit exceeded

**Given** I am logged in as David and already evaluated Henry this week
**When** I try to submit another evaluation for Henry in the same week
**Then** the backend returns 409 Conflict with message "Voce ja avaliou este funcionario esta semana", and the frontend shows this message and prevents submission

**Roles:** Leader
**Priority:** Must-have

#### AC-22: Evaluation allowed in different week

**Given** I am logged in as David and evaluated Henry in week 33
**When** I evaluate Henry again in week 34
**Then** the submission succeeds (201 Created) as it is a new week

**Roles:** Leader
**Priority:** Must-have

#### AC-23: Employee not found

**Given** I navigate to /evaluate/999 (non-existent employee)
**When** the backend processes the request
**Then** the backend returns 404 Not Found, and the frontend shows "Funcionario nao encontrado"

**Roles:** Leader
**Priority:** Must-have

#### AC-24: Backend rejects incomplete question set

**Given** I am on the evaluation form
**When** I try to submit with only 5 scores (missing question 4)
**Then** the backend returns 422 Validation Error: "Todas as 6 questoes devem ser respondidas"

**Roles:** Leader
**Priority:** Must-have

#### AC-25: Network error during submission

**Given** I have filled all scores and clicked submit
**When** the network connection fails (backend unreachable)
**Then** the frontend shows an error toast "Erro de conexao. Tente novamente." and my form data is preserved so I can retry

**Roles:** Leader
**Priority:** Must-have

#### AC-26: Double-click submission protection

**Given** I have clicked "Confirmar" on the submission dialog
**When** the POST request is in flight and I click submit again
**Then** the button is disabled during the request (loading state), preventing duplicate submissions

**Roles:** Leader
**Priority:** Must-have

### Viewing Evaluations

#### AC-27: Leader sees subordinate evaluations overview

**Given** I am logged in as David and have evaluated Henry and Liam
**When** I navigate to the home page or subordinate evaluations view
**Then** I see a table with Henry and Liam, each showing: name, latest total_score (e.g., 3.45), evaluation date, and a "Historico" link

**Roles:** Leader
**Priority:** Must-have

#### AC-28: Subordinates without evaluations show appropriately

**Given** I am logged in as David and have not yet evaluated anyone
**When** I navigate to the evaluations view
**Then** I see all my subordinates listed, with their latest score column showing "--" or "Nao avaliado"

**Roles:** Leader
**Priority:** Must-have

#### AC-29: Leader views evaluation history for a subordinate

**Given** I am logged in as David and Henry has been evaluated in weeks 30, 31, 32, 33
**When** I click "Historico" on Henry row
**Then** I see a chronological table (most recent first) with: week number, date, total_score, and expandable rows for per-question detail

**Roles:** Leader
**Priority:** Must-have

#### AC-30: Evaluation detail shows per-question breakdown

**Given** I am viewing Henry evaluation history
**When** I expand a specific evaluation row
**Then** I see 6 rows with: question title, weight, score, and weighted contribution (score x weight / 100)

**Roles:** Leader
**Priority:** Should-have

#### AC-31: Empty evaluation history

**Given** I am logged in as David and Henry has never been evaluated
**When** I click "Historico" on Henry row
**Then** I see "Nenhuma avaliacao registrada para este funcionario"

**Roles:** Leader
**Priority:** Must-have

#### AC-32: Viewing evaluations of non-subordinate blocked

**Given** I am logged in as Henry (employee_id=8)
**When** I try to navigate to /history/18 (Rachel, not in my tree)
**Then** the backend returns 403 Forbidden and the frontend redirects to home with error message

**Roles:** Leader
**Priority:** Must-have

### Security & Access Control

#### AC-33: Leader cannot see own evaluations

**Given** I am logged in as Alice (employee_id=1)
**When** I look at the subordinate list
**Then** Alice is NOT listed (cannot evaluate or view own evaluations)

**Roles:** Leader
**Priority:** Must-have

#### AC-34: Leader cannot see peer evaluations

**Given** I am logged in as Bob (employee_id=2) and Carol (employee_id=3) is my peer (both report to Alice)
**When** I navigate to the subordinate list
**Then** Carol does NOT appear in my list

**Roles:** Leader
**Priority:** Must-have

#### AC-35: Leader cannot see superior evaluations

**Given** I am logged in as David (employee_id=4) and Bob (employee_id=2) is my manager
**When** I navigate to the subordinate list
**Then** Bob does NOT appear in my list

**Roles:** Leader
**Priority:** Must-have

#### AC-36: Backend validates hierarchy on every request

**Given** any API request that accesses evaluation data
**When** the backend processes it
**Then** the evaluator_id (from cookie) is validated as an ancestor of the target employee_id using the CTE hierarchy query, and 403 is returned if not

**Roles:** Leader
**Priority:** Must-have

#### AC-37: Unauthenticated user cannot access API

**Given** I have no employee_id in my cookie/localStorage
**When** I try to call any API endpoint directly
**Then** the backend returns 401 Unauthorized

**Roles:** System
**Priority:** Must-have

### Immutability

#### AC-38: Submitted evaluation cannot be edited

**Given** I have submitted an evaluation for Henry in week 33
**When** I try to call PUT /api/evaluations/{id} or PATCH
**Then** the backend returns 405 Method Not Allowed (no update endpoint exists)

**Roles:** Leader
**Priority:** Must-have

#### AC-39: Submitted evaluation cannot be deleted

**Given** I have submitted an evaluation for Henry in week 33
**When** I try to call DELETE /api/evaluations/{id}
**Then** the backend returns 405 Method Not Allowed (no delete endpoint exists)

**Roles:** Leader
**Priority:** Must-have

### Data Integrity

#### AC-40: EvaluationSummary total_score is correctly calculated

**Given** I submit an evaluation with scores: Q1=4, Q2=3, Q3=4, Q4=2, Q5=3, Q6=4
**When** the backend calculates total_score
**Then** total_score = (4x25 + 3x20 + 4x20 + 2x15 + 3x10 + 4x10) / 100 = (100 + 60 + 80 + 30 + 30 + 40) / 100 = 3.40

**Roles:** System
**Priority:** Must-have

#### AC-41: Evaluation week_number uses ISO 8601

**Given** I submit an evaluation on August 17, 2026
**When** the backend records the week_number
**Then** week_number = 33 (ISO 8601 week for that date)

**Roles:** System
**Priority:** Must-have

#### AC-42: Evaluation year is recorded alongside week_number

**Given** I submit an evaluation on December 31, 2026 (week 52) and another on January 1, 2027 (week 1)
**When** the backend checks the weekly limit
**Then** these are treated as DIFFERENT weeks (different year+week pairs), and both submissions succeed

**Roles:** System
**Priority:** Must-have

### Performance & UX

#### AC-43: Loading state for subordinate list

**Given** I navigate to the home page
**When** the subordinate list is being fetched from the API
**Then** I see a loading spinner or skeleton UI, not a blank page

**Roles:** Leader
**Priority:** Should-have

#### AC-44: Loading state for evaluation form

**Given** I click "Avaliar" on a subordinate
**When** the evaluation form is loading questions from the API
**Then** I see a loading indicator

**Roles:** Leader
**Priority:** Should-have

#### AC-45: Error boundary catches runtime errors

**Given** a React component throws a rendering error
**When** the error occurs
**Then** I see a fallback error UI "Algo deu errado" with a "Tentar novamente" button, not a blank white page

**Roles:** Any user
**Priority:** Should-have

#### AC-46: Application is responsive on mobile

**Given** I open the application on a mobile device (320px-768px width)
**When** I navigate through the app
**Then** all content is readable, buttons are tappable (44px minimum), and the form stacks vertically

**Roles:** Any user
**Priority:** Should-have

#### AC-47: 404 page for unknown routes

**Given** I navigate to /unknown-route
**When** the router cannot match the path
**Then** I see a 404 page with message "Pagina nao encontrada" and a link back to home

**Roles:** Any user
**Priority:** Should-have

### Health & Infrastructure

#### AC-48: Health check endpoint

**Given** the backend is running
**When** I call GET /api/health
**Then** I receive `{ "status": "ok" }` with HTTP 200

**Roles:** System
**Priority:** Should-have

#### AC-49: CORS allows frontend origin

**Given** the frontend is running on http://localhost:3000
**When** it makes an API request to http://localhost:8000
**Then** the request succeeds and the response includes the appropriate CORS headers

**Roles:** System
**Priority:** Must-have

#### AC-50: Database seed data loads correctly

**Given** the backend starts for the first time
**When** the database is initialized
**Then** the 20 employees from the SQL dump are present, and the leader_lead relationships form the expected hierarchy tree

**Roles:** System
**Priority:** Must-have

---

## 5. Tasks to Add to the Plan

### Tasks to Address Gap G1: Schema Conflict Resolution

**Add to Phase 0 (Setup):**

0. **Resolve schema conflict between SQL dump and architecture docs** (`docs/architecture.md`, `docs/integrations.md`, `docs/brainstorms/*.md`):
   - Decide: use SQL dump `leader_lead` M2M table OR architecture `manager_id` FK approach
   - If `leader_lead`: update architecture.md Employee model, update integrations.md API schemas, update brainstorm data model section
   - If `manager_id`: adapt SQL dump to add `manager_id` column to employee and remove `leader_lead` table
   - Document decision in `docs/decisions/` as ADR-001

### Tasks to Address Gap G2: Employee Schema Alignment

**Add to Phase 0 (Setup):**

0. **Align Employee model with chosen schema** (`docs/architecture.md`, `docs/integrations.md`):
   - If using dump schema: update all API schemas to use `name`, `email`, `position_name` instead of `first_name`, `last_name`, `job_title`, `department`, `hire_date`
   - Update frontend TypeScript types to match
   - Update all acceptance criteria and component specs accordingly

### Tasks to Address Gap G3: Draft Persistence

**Add to Phase 4 (Frontend - Evaluation Form):**

4. **Implement localStorage draft save for evaluation form** (`frontend/src/components/evaluation/EvaluationForm.tsx`, `frontend/src/hooks/useEvaluationDraft.ts`):
   - Create `useEvaluationDraft` hook that auto-saves form state to localStorage keyed by `{leaderId}-{employeeId}`
   - On form mount: check for existing draft and restore scores
   - On successful submit: clear draft from localStorage
   - On leader switch: clear all drafts

### Tasks to Address Gap G4: Submission Confirmation

**Add to Phase 4 (Frontend - Evaluation Form):**

4. **Add confirmation dialog before evaluation submission** (`frontend/src/components/evaluation/EvaluationForm.tsx`, `frontend/src/components/evaluation/ConfirmDialog.tsx`):
   - Create `ConfirmDialog` component with message "Confirmar envio da avaliacao? Esta acao nao pode ser desfeita."
   - Wire to submit button: show dialog before POST request
   - Two buttons: "Confirmar" (proceed) and "Cancelar" (dismiss)

### Tasks to Address Gap G5: Loading States

**Add to Phase 4 (Frontend - Components):**

4. **Add loading states and skeleton UI components** (`frontend/src/components/ui/LoadingSpinner.tsx`, `frontend/src/components/ui/SkeletonList.tsx`):
   - Create `LoadingSpinner` component
   - Create `SkeletonList` component for subordinate list placeholder
   - Wrap API calls in subordinate list, evaluation form, and history view with loading state

### Tasks to Address Gap G7: Error Boundary

**Add to Phase 4 (Frontend - App Structure):**

4. **Add React ErrorBoundary** (`frontend/src/components/ui/ErrorBoundary.tsx`, `frontend/src/App.tsx`):
   - Create `ErrorBoundary` class component with fallback UI
   - Wrap main route content in ErrorBoundary
   - Fallback shows "Algo deu errado" with retry button

### Tasks to Address Gap G8/G9: Week+Year Scoping

**Add to Phase 2 (Backend - Models):**

2. **Add evaluation_year field to EvaluationResponse and EvaluationSummary models** (`backend/app/models/evaluation_response.py`, `backend/app/models/evaluation_summary.py`):
   - Add `evaluation_year: Integer` column (ISO week year)
   - Update weekly limit validation to check `(evaluation_year, week_number)` pair
   - Update Alembic migration

**Add to Phase 3 (Backend - Services):**

3. **Update evaluation service weekly limit check** (`backend/app/services/evaluation.py`):
   - Change query from `WHERE week_number = X` to `WHERE evaluation_year = X AND week_number = Y`
   - Validate on POST /api/evaluations

### Tasks to Address Gap G10: 409 Response Schema

**Add to Phase 2 (Backend - Schemas):**

2. **Define 409 Conflict response schema** (`backend/app/schemas/evaluation.py`):
   - Create `WeeklyLimitExceeded` response model: `{ detail: str, existing_evaluation_id: int | null }`
   - Use in evaluation service when weekly limit check fails

### Tasks to Address Gap G11: Subordinates Evaluations Endpoint Spec

**Add to Phase 3 (Backend - Services):**

3. **Implement GET /api/evaluations/subordinates response contract** (`backend/app/routes/evaluations.py`, `backend/app/services/evaluation.py`):
   - Query: CTE to get all subordinates, LEFT JOIN with latest EvaluationSummary per (evaluator_id=subordinate, evaluator_id=current_leader)
   - Return one row per subordinate: `{ employee_id, employee_name, latest_evaluation: EvaluationSummary | null }`
   - If no evaluation exists for a subordinate, `latest_evaluation` is null (frontend shows "Nao avaliado")

### Tasks to Address Gap G12: History Endpoint Access Control

**Add to Phase 3 (Backend - Services):**

3. **Add hierarchy validation to GET /api/evaluations/employee/{id}** (`backend/app/routes/evaluations.py`, `backend/app/services/hierarchy.py`):
   - Before returning evaluation history, verify current leader IS an ancestor of the target employee
   - Return 403 if not authorized
   - Reuse CTE hierarchy check from evaluation submission

### Tasks to Address Gap G17: Incomplete Question Set Validation

**Add to Phase 3 (Backend - Services):**

3. **Validate exactly 6 scores in POST /api/evaluations** (`backend/app/services/evaluation.py`, `backend/app/schemas/evaluation.py`):
   - Pydantic schema: `scores: List[ScoreInput]` with validator `len(scores) == 6`
   - Validate all question_ids 1-6 are present and unique
   - Return 422 with specific error if incomplete

### Tasks to Address Gap G15: Responsive Layout

**Add to Phase 4 (Frontend - Styles):**

4. **Implement responsive layout** (`frontend/src/index.css`, all page components):
   - Add CSS breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
   - Stack form columns vertically on mobile
   - Ensure minimum 44px touch targets for buttons and inputs
   - Test all pages at 320px, 768px, and 1200px widths

### Tasks to Address Gap G19: Seed Data Migration

**Add to Phase 1 (Database):**

1. **Create Alembic migration from SQL dump** (`backend/alembic/versions/`):
   - Generate initial migration that creates `employee` table matching SQL dump schema
   - Create `leader_lead` table (or `manager_id` FK depending on G1 decision)
   - Create `evaluation_question` table with 6 seeded questions
   - Create `evaluation_response` and `evaluation_summary` tables
   - Include seed data SQL for 20 employees and hierarchy relationships

### Tasks to Address Gap G20: Route Handling

**Add to Phase 4 (Frontend - Router):**

4. **Add catch-all route and unauthorized redirect** (`frontend/src/App.tsx`):
   - Add `path="*"` route pointing to NotFoundPage component
   - Create `NotFoundPage` component: "Pagina nao encontrada" with link to `/`
   - Add route guard: if no employee_id in localStorage, redirect all routes to leader selector

### Tasks to Address Gap G21: Evaluation Detail View

**Add to Phase 4 (Frontend - Components):**

4. **Add per-question evaluation detail breakdown** (`frontend/src/components/history/EvaluationDetail.tsx`):
   - Create expandable row component in EvaluationHistory
   - On expand: show table with question title, weight, score, weighted contribution
   - Calculate contribution: `(score x weight) / 100`

### Tasks to Address Gap G23: CORS Configuration

**Add to Phase 3 (Backend - Setup):**

3. **Configure CORS middleware in FastAPI** (`backend/app/main.py`):
   - Add `CORSMiddleware` with `allow_origins=["http://localhost:3000"]`
   - Allow methods: GET, POST, OPTIONS
   - Allow headers: Content-Type, Cookie
   - Allow credentials: true

### Tasks to Address Gap G24: Health Check

**Add to Phase 3 (Backend - Routes):**

3. **Add health check endpoint** (`backend/app/routes/health.py`, `backend/app/main.py`):
   - Create `GET /api/health` returning `{ "status": "ok" }`
   - Register router in main.py
   - Use in Docker Compose `healthcheck` configuration

### Tasks to Address Gap G16: Tab Sync

**Add to Phase 4 (Frontend - Auth):**

4. **Implement cross-tab identity sync** (`frontend/src/hooks/useAuth.tsx`):
   - Use localStorage with `storage` event listener
   - When another tab changes `employee_id`, re-fetch data in current tab
   - Use `AbortController` to cancel stale requests on identity change

### Tasks to Address Gap G22: Request Cancellation

**Add to Phase 4 (Frontend - API):**

4. **Implement request cancellation on leader switch** (`frontend/src/services/api.ts`, `frontend/src/hooks/useAuth.tsx`):
   - Maintain an `AbortController` per API service
   - On leader switch: abort all in-flight requests, create new controller
   - Pass signal to Axios requests

---

## Appendix A: Hierarchy Tree Reference (from SQL dump)

```
Alice (1) -- CEO
+-- Bob (2) -- CTO
|   +-- David (4) -- Engineering Manager
|   |   +-- Henry (8) -- Senior Software Engineer
|   |   |   +-- James (10) -- Software Engineer
|   |   |   +-- Karen (11) -- Software Engineer
|   |   +-- Liam (12) -- Software Engineer
|   +-- Eva (5) -- Engineering Manager
|   |   +-- Isabelle (9) -- Senior Software Engineer
|   |   +-- Mia (13) -- Data Engineer
|   |   +-- Noah (14) -- Data Analyst
|   +-- Grace (7) -- UX Designer
|   +-- Quinn (17) -- DevOps Engineer
|   +-- Paul (16) -- QA Engineer
+-- Carol (3) -- CFO
|   +-- Rachel (18) -- Finance Analyst
|   +-- Samuel (19) -- Finance Analyst
+-- Frank (6) -- Product Manager
|   +-- Olivia (15) -- QA Engineer
+-- Tina (20) -- HR Specialist
```

**Subordinate counts:**
- Alice: 18 subordinates (all others)
- Bob: 10 subordinates (David, Eva, Grace, Quinn, Paul, Henry, Liam, Isabelle, Mia, Noah)
- David: 4 subordinates (Henry, Liam, James, Karen)
- Henry: 2 subordinates (James, Karen)
- Eva: 3 subordinates (Isabelle, Mia, Noah)
- Carol: 2 subordinates (Rachel, Samuel)
- Frank: 1 subordinate (Olivia)
- Grace, Quinn, Paul, Liam, James, Karen, Isabelle, Mia, Noah, Olivia, Rachel, Samuel, Tina: 0 subordinates

## Appendix B: Weighted Score Calculation Example

**Formula:** `total_score = Sum(score_i x weight_i) / 100`

**Example submission:**
| Question | Weight | Score | Contribution |
|----------|--------|-------|-------------|
| Entrega de Resultados | 25 | 4 | 1.00 |
| Execucao e Qualidade | 20 | 3 | 0.60 |
| Capacidade de Aprendizado | 20 | 4 | 0.80 |
| Resolucao de Problemas | 15 | 2 | 0.30 |
| Colaboracao e Lideranca | 10 | 3 | 0.30 |
| Visao Estrategica | 10 | 4 | 0.40 |
| **Total** | **100** | | **3.40** |

## Appendix C: API Contract Summary

| Method | Path | Auth | Success | Error Codes |
|--------|------|------|---------|-------------|
| GET | `/api/health` | No | 200 `{status, version}` | -- |
| GET | `/api/employees` | Yes (cookie) | 200 `Employee[]` | 401 |
| GET | `/api/employees/{id}` | Yes | 200 `Employee` | 401, 404 |
| GET | `/api/employees/{id}/subordinates` | Yes | 200 `Employee[]` | 401, 403 |
| GET | `/api/evaluations/questions` | Yes | 200 `Question[]` | 401 |
| GET | `/api/evaluations/subordinates` | Yes | 200 `SubordinateEvaluation[]` | 401 |
| POST | `/api/evaluations` | Yes | 201 `EvaluationSummary` | 401, 403, 404, 409, 422 |
| GET | `/api/evaluations/employee/{id}` | Yes | 200 `EvaluationSummary[]` | 401, 403, 404 |

## Appendix D: Recommended Schema Decision (ADR-001 Draft)

### Context

The project provides an SQL dump with `employee` (id, name, email, position_name) and `leader_lead` (leader_id, lead_id) tables. The architecture and brainstorm documents assume a different schema with `manager_id` FK and different column names.

### Decision

**Use the SQL dump schema as-is** because:
1. It is the official data source from the case tecnico
2. The many-to-many `leader_lead` model is more flexible (an employee could theoretically have multiple leaders)
3. The data is already seeded with the correct hierarchy
4. The `name` field is simpler than `first_name`/`last_name` split

### Consequences

- All architecture.md, integrations.md, and brainstorm docs must be updated to reflect `(id, name, email, position_name)` Employee model
- The `manager_id` FK approach must be abandoned
- CTE queries must join through `leader_lead` table
- Frontend TypeScript types must use `name` (string) instead of `first_name`/`last_name`
- API response schemas must be updated accordingly
