# CaseTecnico — Plataforma de Avaliação de Liderados

Plataforma web que permite a um líder avaliar seus liderados (diretos e indiretos) seguindo a hierarquia organizacional, com perguntas ponderadas e limite de uma avaliação por semana por par líder–funcionário.

## Funcionalidades

- Seleção simples de identidade (sem login completo): escolha um líder em um dropdown e troque quando quiser
- Lista de todos os subordinados diretos e indiretos do líder autenticado, com profundidade hierárquica
- Formulário de avaliação com 6 perguntas ponderadas e nota parcial em tempo real
- Histórico de avaliações por subordinado, com detalhamento por questão (peso, nota e contribuição)
- Alternância de idioma **pt-BR / en** (padrão: pt-BR), incluindo formatação de números e datas
- Regras de negócio garantidas no backend: notas 1–4, imutabilidade das avaliações, 1 avaliação/semana por par, visibilidade apenas de subordinados

## Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, React Router, Axios, Vitest + React Testing Library |
| Backend | Python 3.10+, FastAPI, SQLAlchemy 2.x, Pydantic v2 |
| Banco de dados | SQLite (modo WAL) |
| Infraestrutura | Docker + Docker Compose (frontend nginx, backend uvicorn, mesma rede) |

## Arquitetura e Fluxo

```
┌─────────────────────────────────────────────┐
│                Navegador                    │
│   React SPA (Vite build servida pelo nginx  │
│   em Docker; vite dev server em dev)        │
└──────────────────┬──────────────────────────┘
                   │  HTTP REST (/api via proxy)
                   ▼
┌─────────────────────────────────────────────┐
│           Backend FastAPI (:8000)           │
│  routers → services → models (SQLAlchemy)   │
│  - Identidade via cookie `employee_id`      │
│  - Hierarquia via CTE recursiva             │
│  - Rate limit no envio de avaliações        │
└──────────────────┬──────────────────────────┘
                   │ SQLAlchemy ORM
                   ▼
┌─────────────────────────────────────────────┐
│              SQLite (WAL mode)              │
│  employee · leader_lead · evaluation_question│
│  evaluation_response · evaluation_summary   │
└─────────────────────────────────────────────┘
```

**Fluxo principal (avaliar um liderado):**

1. Usuário seleciona sua identidade de líder (o frontend grava o cookie `employee_id`).
2. O frontend lista os subordinados: `GET /api/evaluations/subordinates` — o backend resolve a árvore hierárquica completa com uma CTE recursiva.
3. O líder clica em "Avaliar": o formulário carrega o funcionário (`GET /api/employees/{id}`) e as perguntas (`GET /api/evaluations/questions`).
4. No envio (`POST /api/evaluations`), o backend valida: identidade do avaliador (cookie), acesso hierárquico (avaliado deve ser subordinado direto ou indireto), notas inteiras 1–4, exatamente as 6 perguntas e o limite semanal (1 por par líder–funcionário por semana ISO).
5. A nota total é calculada no backend (média ponderada pelos pesos) e persistida; avaliações não podem mais ser alteradas.

### Identificação do usuário (sem login completo)

Conforme o caso, não há sistema de login. A identificação funciona assim:

1. Na tela inicial, o usuário escolhe um funcionário no seletor ("Selecione sua identidade").
2. O frontend grava o cookie `employee_id=<id>` (`path=/`, validade de 24h) e espelha o valor no `localStorage`.
3. Toda requisição leva esse cookie; o backend lê `employee_id` e trata esse funcionário como o líder autenticado, validando a hierarquia em cada operação.
4. Para trocar de líder, use o botão **Trocar líder** na barra lateral (ícone 🔄 quando ela está recolhida): o cookie/localStorage é limpo e o seletor reaparece.

## Como Rodar

### Pré-requisitos

- **Docker + Docker Compose** (recomendado), **ou**
- Node.js 20+ e Python 3.10+ para rodar localmente

### Opção 1 — Docker Compose (tudo conteinerizado na mesma rede)

```bash
cd repos
docker compose up --build
```

- Aplicação: http://localhost:3000
- API: http://localhost:8000/api/health · Docs OpenAPI: http://localhost:8000/docs

O banco SQLite persiste no volume `backend-data`. Na inicialização, o backend cria o esquema e popula dados automaticamente (idempotente).

### Opção 2 — Desenvolvimento local

**Backend:**

```bash
cd repos/backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend (em outro terminal):**

```bash
cd repos/frontend
npm install
npm run dev          # porta 3000, com proxy /api → localhost:8000
```

Acesse http://localhost:3000.

### Variáveis de ambiente e chaves

**Nenhuma chave de API é necessária.** A configuração é opcional e feita via `.env`:

| Local | Variáveis | Padrão |
|-------|-----------|--------|
| `repos/backend/.env` | `DATABASE_URL`, `API_HOST`, `API_PORT`, `DEBUG`, `CORS_ORIGINS`, `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW` | SQLite local, porta 8000, `DEBUG=false` |
| `repos/frontend/.env` | `VITE_API_URL`, `VITE_APP_TITLE` | não utilizados pelo código (a API é acessada via proxy `/api`) |

O arquivo `repos/backend/.env` já está commitado com valores padrão de desenvolvimento.

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/test-cookies` | Debug de cookies (somente com `DEBUG=true`; retorna 404 em produção) |
| GET | `/api/employees` | Lista todos os funcionários |
| GET | `/api/employees/{id}` | Detalhes de um funcionário |
| GET | `/api/employees/{id}/subordinates` | Todos os subordinados (recursivo) |
| GET | `/api/evaluations/questions` | Perguntas e pesos da avaliação |
| GET | `/api/evaluations/subordinates` | Subordinados + última avaliação feita por você |
| GET | `/api/evaluations/employee/{id}` | Seu histórico de avaliações de um subordinado |
| POST | `/api/evaluations` | Envia uma avaliação (com rate limit) |

## Regras de Negócio Implementadas

- **Notas:** inteiros de 1 a 4, validadas no schema Pydantic, no router e por constraint no banco.
- **Perguntas e pesos (soma = 100):** Entrega de Resultados (25), Execução e Qualidade do Trabalho (20), Capacidade de Aprendizado e Desenvolvimento (20), Resolução de Problemas e Pensamento Crítico (15), Colaboração, Influência e Liderança (10), Visão Estratégica e Potencial de Crescimento (10).
- **Imutabilidade:** não existem rotas de edição/exclusão de avaliações.
- **Limite semanal:** uma avaliação por par (líder, funcionário) por semana ISO, reforçado por constraint de unicidade `(evaluator_id, employee_id, evaluation_year, week_number)` — cada líder tem seu próprio limite, independente de outros líderes.
- **Hierarquia:** um líder pode avaliar liderados diretos e indiretos (subordinados dos seus subordinados); é vedado avaliar/ver a própria avaliação, a de pares ou superiores.
- **Visibilidade das respostas:** cada líder visualiza as respostas **registradas por ele mesmo** para seus subordinados (identificador do avaliado, avaliação mais recente e histórico). Interpretação adotada para "respeitando sempre a maior hierarquia": a consulta sempre respeita a cadeia hierárquica — um líder só enxerga avaliações dentro da sua linha de subordinação, nunca acima dela.
- **Segurança SQL:** todas as consultas são parametrizadas (ORM + parâmetros vinculados na CTE recursiva).

## Dados de Exemplo (Seed)

Na primeira inicialização, o backend popula:

- 20 funcionários e 19 relações de hierarquia (`leader_lead`) — nomes sintéticos, pois o `db_dump.txt` fornecido contém apenas o **esquema** das tabelas (usado como base, ver `docs/decisions/20260817-use-sql-dump-schema.md`);
- As 6 perguntas oficiais com os pesos do caso. A seed é **autocorretiva**: se o banco já existir com perguntas desatualizadas, títulos/pesos são corrigidos na inicialização.

Para recomeçar do zero, apague o volume/banco (`backend-data` no Docker ou `repos/backend/data/casetecnico.db` local).

## Testes

```bash
# Backend
cd repos/backend
python -m pytest tests/ -q

# Frontend
cd repos/frontend
npm test            # única passada (CI)
npm run lint
npm run build       # inclui typecheck (tsc -b)
```

## Estrutura do Projeto

```
repos/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI + lifespan (setup/seed do banco)
│   │   ├── config.py          # Settings (pydantic-settings)
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models/            # Employee, LeaderLead, EvaluationQuestion/Response/Summary
│   │   ├── routers/           # health, employees, evaluations
│   │   ├── services/          # hierarchy (CTE recursiva), evaluation, seed
│   │   └── schemas/           # Pydantic request/response
│   └── tests/
└── frontend/
    ├── src/
    │   ├── i18n/              # LanguageContext + traduções pt-BR/en
    │   ├── pages/             # Home, Evaluate, History, GlobalHistory, NotFound
    │   ├── components/        # layout/, employee/, evaluation/, history/, ui/
    │   ├── hooks/useAuth.tsx  # identidade (cookie + localStorage)
    │   └── services/api.ts    # cliente axios (/api)
    └── tests/
docs/                           # documentação de arquitetura, decisões e pré-desenvolvimento
```

A documentação detalhada (arquitetura, integrações, ambientes, padrões e decisões) está em [`docs/`](docs/README.md). Os documentos de pré-desenvolvimento (histórias de usuário, regras, fluxos e protótipos) estão em [`docs/pre-desenvolvimento/`](docs/pre-desenvolvimento/README.md).
