# Histórias de Usuário

## Épico A — Identificação do líder

### US-01 — Selecionar liderança
**Como** usuário do sistema, **quero** selecionar qual liderança estou representando, **para** realizar avaliações no contexto correto.

**Aceite:** selecionar um funcionário que possua subordinados; persistir a escolha no navegador; trocar de líder atualiza o escopo; backend recebe e valida a identidade. **Prioridade:** Must Have.

## Épico B — Consulta

### US-02 — Visualizar subordinados avaliáveis
**Como** líder, **quero** visualizar meus subordinados diretos e indiretos, **para** identificar quem posso avaliar.

**Aceite:** listar todos os descendentes hierárquicos; não mostrar o próprio líder, pares ou superiores; indicar se há avaliação recente. **Prioridade:** Must Have.

### US-03 — Visualizar avaliação mais recente
**Como** líder, **quero** visualizar a avaliação mais recente de um subordinado, **para** acompanhar sua performance.

**Aceite:** somente subordinados; mostrar identificador e resultado; mostrar respostas quando existentes; respeitar a avaliação do avaliador de maior hierarquia conforme o requisito. **Prioridade:** Must Have.

### US-04 — Consultar histórico
**Como** líder, **quero** consultar o histórico de avaliações de um subordinado, **para** acompanhar evolução. **Prioridade:** Could Have.

## Épico C — Avaliação

### US-05 — Avaliar subordinado
**Como** líder, **quero** responder as seis questões de 1 a 4, **para** registrar uma avaliação.

**Aceite:** avaliado pertence à hierarquia; todas as seis respostas obrigatórias; valores inteiros 1–4; pesos 25/20/20/15/10/10; cálculo ponderado; persistência transacional; sem edição após envio. **Prioridade:** Must Have.

### US-06 — Impedir segunda avaliação semanal
**Como** sistema, **quero** impedir mais de uma avaliação por semana para o mesmo par líder-funcionário, **para** garantir a regra de negócio.

**Aceite:** nova avaliação do mesmo par na semana é rejeitada; regra garantida no backend/banco; avaliação de outro líder não é bloqueada. **Prioridade:** Must Have.

### US-07 — Permitir avaliação por líder superior
**Como** líder superior, **quero** avaliar um funcionário abaixo de um subordinado meu, **para** registrar uma avaliação independente.

**Aceite:** subordinado indireto pode ser avaliado; avaliação do líder direto não bloqueia a do superior. **Prioridade:** Must Have.

## Épico D — Segurança

### US-08 — Bloquear acesso indevido
**Como** sistema, **quero** validar a relação hierárquica no backend, **para** impedir acesso fora do escopo.

**Aceite:** bloquear própria avaliação, pares, superiores e pessoas fora da hierarquia; alterar IDs no cliente não permite bypass. **Prioridade:** Must Have.
