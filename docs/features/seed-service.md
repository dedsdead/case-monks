# Seed Service

## Purpose
Database seeding with robust error handling.

## Source of Truth
- `repos/backend/app/services/seed.py`

## Implementation
- ✅ Error handling implemented
- ✅ Detailed logging
- ✅ Idempotent operations
- ✅ Self-correcting evaluation questions (2026-08-22)

## Canonical Questions Invariant
`CASE_QUESTIONS` in `repos/backend/app/services/seed.py` is the single source of truth for question ids/titles/weights/order (mirrors `docs/case_tecnico.txt`):

| # | Title | Weight |
|---|-------|--------|
| 1 | Entrega de Resultados | 25 |
| 2 | Execução e Qualidade do Trabalho | 20 |
| 3 | Capacidade de Aprendizado e Desenvolvimento | 20 |
| 4 | Resolução de Problemas e Pensamento Crítico | 15 |
| 5 | Colaboração, Influência e Liderança | 10 |
| 6 | Visão Estratégica e Potencial de Crescimento | 10 |

On every startup `_correct_questions(db)` upserts existing rows (title/weight/order by id) toward `CASE_QUESTIONS`. Legacy databases containing retired questions ("Trabalho em Equipe", "Comunicação", "Iniciativa e Proatividade") converge automatically — no manual DB deletes required. Corrections are logged as warnings.

## Next Steps
- Test rollback scenarios
