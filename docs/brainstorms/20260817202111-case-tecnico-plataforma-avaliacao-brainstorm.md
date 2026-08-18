# Brainstorm: Plataforma de Avaliação de Liderados

**Date:** 2026-08-17  
**Status:** Completed  
**Source:** [Software Analyst] Case Tecnico Pré Entrevista.docx

---

## 1. What We're Building

Uma plataforma web para que líderes avaliem seus liderados diretos e indiretos. O sistema permite que gestores avaliem subordinados seguindo uma hierarquia organizacional, com avaliações ponderadas que não podem ser alteradas após o envio.

A plataforma visa simplificar o processo de avaliação 360° dentro de uma organização, permitindo que líderes avaliem seus liderados de forma estruturada, com visibilidade limitada apenas para avaliações dos subordinados (diretos ou indiretos).

**Substitui:** Processos manuais de avaliação (Excel, formulários dispersos)  
**Complementa:** Sistemas existentes de gestão de pessoas

---

## 2. Current State

### Backend
- **Nenhum código existente** — Projeto greenfield
- **Stack escolhida:** Python 3.10+ com FastAPI
- **Banco de dados:** SQLite (para simplificar setup) ou PostgreSQL

### Frontend
- **Nenhum código existente** — Projeto greenfield
- **Stack escolhida:** React + TypeScript + Vite

### Dados
- **Dump SQL fornecido:** Estrutura de tabela `employee` com campos id, first_name, last_name, job_title, department, hire_date, manager_id
- **Tabela de avaliações:** Schema a ser definido (decisão durante implementação)

### Lambda Pipelines
- Nenhum — Projeto monolítico simples

### Brainstorms/Plans Existentes
- Nenhum anterior para esta feature

---

## 3. Architecture & Infrastructure

### Onde a Lógica Vai Viver

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| **Frontend** | React + TypeScript + Vite | Framework moderno, tipagem forte, build rápido |
| **Backend** | Python 3.10+ + FastAPI | Assíncrono,高性能, documentação automática OpenAPI |
| **Banco** | SQLite (dev) / PostgreSQL (prod) | Simples para setup, migração fácil |
| **Container** | Docker + Docker Compose | Todos os serviços na mesma rede |

### Cloud Services
- **Nenhum** — Projeto containerizado localmente

### Data Model

#### Entidade: Employee
```
id: INTEGER (PK)
first_name: VARCHAR
last_name: VARCHAR
job_title: VARCHAR
department: VARCHAR
hire_date: DATE
manager_id: INTEGER (FK -> Employee.id, nullable)
```

#### Entidade: Evaluation Question
```
id: INTEGER (PK)
title: VARCHAR (ex: "Entrega de Resultados")
weight: INTEGER (ex: 25)
order: INTEGER
```

#### Entidade: Evaluation Response
```
id: INTEGER (PK)
employee_id: INTEGER (FK -> Employee.id) -- avaliado
evaluator_id: INTEGER (FK -> Employee.id) -- avaliador
question_id: INTEGER (FK -> EvaluationQuestion.id)
score: INTEGER (1-4)
evaluation_date: DATETIME
week_number: INTEGER -- para controlar 1 avaliação/semana
```

#### Entidade: Evaluation Summary
```
id: INTEGER (PK)
employee_id: INTEGER (FK -> Employee.id)
evaluator_id: INTEGER (FK -> Employee.id)
total_score: DECIMAL -- média ponderada
evaluation_date: DATETIME
week_number: INTEGER
is_submitted: BOOLEAN
```

### Infrastructure Changes
- `docker-compose.yml` para orquestrar frontend, backend e banco
- `Dockerfile` para cada serviço
- `.env` para configurações sensíveis

### Security Approach
- **Autenticação:** Cookie/LocalStorage com ID do líder (conforme especificado)
- **Autorização:** Validação no backend de que o avaliador tem hierarchical_access ao avaliado
- **SQL Injection:** Queries parametrizadas com SQLAlchemy

---

## 4. Integration Impact

### Entity Impact
- **Employee:** Utiliza dump fornecido, sem alterações
- **Nova entidade:** EvaluationQuestion (configuração das perguntas)
- **Nova entidade:** EvaluationResponse (respostas individuais)
- **Nova entidade:** EvaluationSummary (resumo calculado)

### Migration Impact
- **Baixo:** Projeto greenfield, schema criado do zero
- **Risco:** Validação da hierarquia recursiva (manager_id)

### Frontend Impact
- **Componentes novos:** EvaluationForm, EmployeeList, EvaluationHistory, LeaderSelector
- **Rotas novas:** /, /evaluate/:employeeId, /history/:employeeId, /subordinates

### Breaking Changes
- **Nenhum:** Projeto novo

---

## 5. Key Decisions

### ✅ DECIDED: Stack Tecnológica
- **Frontend:** React + TypeScript + Vite
- **Backend:** Python 3.10+ + FastAPI
- **Banco:** SQLite (para setup simples)
- **Container:** Docker Compose

### ✅ DECIDED: Autenticação
- **Método:** Cookie com employee_id
- **Troca:** Dropdown simples para selecionar líder
- **Validação:** Backend verifica hierarquia a cada request

### ✅ DECIDED: Controle de Frequência
- **Granularidade:** Semana do ano (week_number)
- **Validação:** Uma avaliação por semana por par avaliador-avaliado
- **Bloqueio:** Frontend + Backend

### ✅ DECIDED: Hierarquia Recursiva
- **Implementação:** CTE (Common Table Expression) no SQL
- **Acesso:** Líder vê avaliações dos subordinados diretos e indiretos
- **Restrição:** Não vê própria avaliação, nem de pares/superiores

### ✅ DECIDED: Estrutura de Perguntas
- **6 perguntas** com pesos conforme documento
- **Scores:** 1-4 por pergunta
- **Cálculo:** Média ponderada

### ⚠️ OPEN: Persistência
- **Opção A:** SQLite para simplicity
- **Opção B:** PostgreSQL para production-readiness
- **Recomendação:** SQLite para demo, documentar migração

### ⚠️ OPEN: Validação de Hierarquia
- **Opção A:** CTE recursiva no SQL
- **Opção B:** Materialized path (armazenar caminho)
- **Recomendação:** CTE para simplicity

---

## 6. Open Questions

1. **Banco de dados:** SQLite ou PostgreSQL? (afeta setup e deployment)
2. **Seed data:** Usar dump SQL fornecido ou criar dados mockados?
3. **UI/UX:** Seguir algum design system ou criar do zero?
4. **Deploy:** Apenas local ou também configuração para cloud?
5. **Testes:** Cobertura mínima esperada?

---

## 7. Next Steps

### Próximos Comandos
1. `/pwf-plan` para gerar plano de implementação detalhado
2. Definir estrutura de pastas do projeto
3. Criar Docker Compose
4. Implementar backend (models, routes, services)
5. Implementar frontend (components, pages, services)
6. Integrar frontend-backend
7. Testes e validação

### Áreas que Precisam de Investigação
- Dump SQL fornecido (precisa ser extraído do docx)
- Estrutura exata da tabela employee
- Validação de queries hierárquicas

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ para frontend
- Python 3.10+ para backend

---

## 8. Questions and Weights Reference

| # | Questão | Peso |
|---|---------|------|
| 1 | Entrega de Resultados | 25 |
| 2 | Execução e Qualidade do Trabalho | 20 |
| 3 | Capacidade de Aprendizado e Desenvolvimento | 20 |
| 4 | Resolução de Problemas e Pensamento Crítico | 15 |
| 5 | Colaboração, Influência e Liderança | 10 |
| 6 | Visão Estratégica e Potencial de Crescimento | 10 |

**Total:** 100 pontos (média ponderada)

---

## 9. Functional Requirements Summary

### Exibição de Avaliações
- [x] Identificador do avaliado
- [x] Avaliação mais recente
- [x] Histórico de avaliações (opcional)
- [x] Respostas cadastradas (respeitando hierarquia)

### Regras de Negócio
- [x] Scores 1-4 com pesos
- [x] 1 avaliação/semana por par avaliador-avaliado
- [x] Avaliação não editável após envio
- [x] Líder vê avaliações dos subordinados (diretos/indiretos)
- [x] Não vê própria avaliação, nem de pares/superiores

---

## 10. Technical Requirements Checklist

- [x] Frontend: React + TypeScript + Vite
- [x] Backend: Python 3.10+ + FastAPI
- [x] Docker: Todos serviços containerizados
- [x] SQL: Queries parametrizadas
- [x] README.md com setup instructions
- [x] Documentação de endpoints
- [x] Diagrama de arquitetura
