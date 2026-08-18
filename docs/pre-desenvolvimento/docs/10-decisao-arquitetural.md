# Decisões Arquiteturais Pré-Desenvolvimento

## Frontend
React + TypeScript para formulário, estado, validação e componentes reutilizáveis. `localStorage` guarda o líder atual no escopo do desafio. Vite como bundler. React Router v6 para rotas.

## Backend
FastAPI/Python para REST, validação, OpenAPI e regras de negócio. SQLAlchemy 2.x (síncrono) para ORM. Pydantic 2.x para schemas.

## Banco
SQLite com modo WAL para simplificar o demo (sem necessidade de servidor externo). CTE recursiva com `UNION` (não `UNION ALL`) para navegar na hierarquia e constraints para reforçar invariantes.

## Invariante crítico
`UNIQUE (evaluator_id, employee_id, evaluation_year, week_number)` protege contra double-click, múltiplas abas e concorrência. Cada linha em `evaluation_summary` representa uma avaliação enviada (sem drafts).

## Segurança
O `employee_id` vindo do cliente é não confiável. Toda consulta e criação deve validar a relação `líder → descendentes` no backend via CTE recursiva.

## Evolução para produção
Autenticação real/JWT, RBAC, auditoria, versionamento das perguntas/pesos, paginação e observabilidade.