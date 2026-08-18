# Glossary

## Domain Terms

| Term | Definition | Source of Truth |
|------|------------|-----------------|
| Líder | Employee who evaluates subordinates | Case Tecnico doc |
| Liderado | Employee being evaluated | Case Tecnico doc |
| Avaliação | Evaluation with 6 weighted questions | Case Tecnico doc |
| Hierarquia | Organizational tree (manager -> reports) | Case Tecnico doc |
| Peso | Weight of each question (total = 100) | Case Tecnico doc |
| Score | Individual answer (1-4) per question | Case Tecnico doc |
| Média Ponderada | Weighted average of all scores | Case Tecnico doc |
| Subordinado Direto | Direct report (via `leader_lead` M2M table) | Case Tecnico doc |
| Subordinado Indireto | Indirect report (recursive hierarchy) | Case Tecnico doc |
| Par | Employee at same hierarchy level | Case Tecnico doc |
| Superior | Employee at higher hierarchy level | Case Tecnico doc |

## Technical Terms

| Term | Definition | Context |
|------|------------|---------|
| CTE | Common Table Expression | Recursive hierarchy queries |
| ORM | Object-Relational Mapping | SQLAlchemy models |
| REST | Representational State Transfer | API architecture |
| TypeScript | JavaScript with types | Frontend type safety |
| FastAPI | Python web framework | Backend API |
| Vite | Frontend build tool | Dev server + bundler |
| SQLAlchemy | Python ORM | Database access |
| Pydantic | Data validation | Request/response schemas |
| Docker Compose | Container orchestration | Multi-service setup |

## Disambiguation

| Term | Meaning 1 | Meaning 2 |
|------|-----------|-----------|
| Score | Individual question answer (1-4) | Total weighted average |
| Evaluation | Single submission event | Historical record |
| Manager | Employee with reports | System administrator |
| Employee | Any person in the system | Specific employee record |
| Week | Calendar week (ISO 8601) | Business week |

## Acronyms

| Acronym | Full Form | Domain |
|---------|-----------|--------|
| API | Application Programming Interface | Backend |
| CRUD | Create, Read, Update, Delete | Database |
| CTE | Common Table Expression | SQL |
| ORM | Object-Relational Mapping | Database |
| PK | Primary Key | Database |
| FK | Foreign Key | Database |
| DTO | Data Transfer Object | API |
| JWT | JSON Web Token | Auth (not used) |
| HMR | Hot Module Replacement | Frontend dev |
| HTTPS | HTTP Secure | Network |
| SQL | Structured Query Language | Database |
| WAL | Write-Ahead Logging | SQLite |

## Naming Conventions

### Database Tables
- Snake case: `employee`, `evaluation_response`
- Singular: `employee`, `evaluation_summary`, `evaluation_question`, `evaluation_response`, `leader_lead`

### API Endpoints
- Kebab-case: `/api/employees/{id}/subordinates`
- Plural nouns: `/api/evaluations`

### Frontend Components
- PascalCase: `EvaluationForm`, `EmployeeList`
- Suffix: `Form`, `List`, `Page`, `Hook`

### Backend Modules
- Snake case: `evaluation_service.py`
- Descriptive: `hierarchy.py` (not `tree.py`)
