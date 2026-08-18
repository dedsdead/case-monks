# Fluxos Funcionais

## Fluxo principal
```text
Selecionar líder
      ↓
Carregar subordinados diretos/indiretos
      ↓
Selecionar funcionário
      ↓
Já avaliado na semana?
  ┌───┴────┐
 Sim       Não
  ↓         ↓
Ver      Preencher 6 respostas
            ↓
     Validar no backend
            ↓
     Calcular resultado
            ↓
     Persistir transação
            ↓
      Somente leitura
```

## Autorização
```text
Request → Identificar líder → Descobrir descendentes →
Avaliado pertence ao conjunto?
      ├─ Sim → continuar
      └─ Não → 403 Forbidden
```

## Concorrência
```text
Request A ─┐
           ├→ UNIQUE(evaluator, employee, evaluation_year, week_number) → somente uma vence
Request B ─┘
```
