# Regras de Negócio e Critérios de Aceite

- **RN-01:** líder pode avaliar subordinados diretos e indiretos.
- **RN-02:** autoavaliação é proibida.
- **RN-03:** pares e superiores não são visíveis.
- **RN-04:** limite semanal é por par `(líder, funcionário, evaluation_year, week_number)`.
- **RN-05:** somente uma avaliação semanal por par.
- **RN-06:** avaliação enviada é imutável; não há edição.
- **RN-07:** cada resposta é inteiro de 1 a 4.
- **RN-08:** pesos são 25, 20, 20, 15, 10 e 10 (armazenados na tabela `evaluation_question`).
- **RN-09:** resultado = `(r1*25+r2*20+r3*20+r4*15+r5*10+r6*10)/100`, variando de 1 a 4.
- **RN-10:** líder atual pode ser identificado por localStorage/cookie no escopo do desafio; o backend valida o ID recebido.
- **RN-11:** funcionários e relações vêm do banco local do dump.
- **RN-12:** quando houver avaliações relevantes para o mesmo funcionário, a exibição deve respeitar a avaliação do avaliador de maior hierarquia, conforme o case.
- **RN-13:** `evaluation_year` e `week_number` são calculados a partir da data atual (ISO 8601) e garantem que limites semanais não colidem entre anos.
- **RN-14:** respostas são armazenadas em tabela separada (`evaluation_response`) com referência à tabela `evaluation_summary`.
- **RN-15:** as 6 perguntas são pré-definidas e seedadas; pesos não podem ser alterados pelo usuário.
- **RN-16:** `total_score` é calculado no backend como média ponderada e armazenado como float.
- **RN-17:** cada linha em `evaluation_summary` representa uma avaliação enviada; não há status de draft.

## Checklist de aceite

- [ ] Não avaliar fora da hierarquia.
- [ ] Não avaliar a si mesmo.
- [ ] Não avaliar duas vezes o mesmo par na semana (considerando year+week).
- [ ] Avaliação do líder direto não bloqueia a do superior.
- [ ] Avaliação enviada não pode ser alterada.
- [ ] Respostas fora de 1–4 são rejeitadas.
- [ ] As seis perguntas são obrigatórias.
- [ ] Somente subordinados aparecem na área do líder.
- [ ] Cálculo do total_score está correto (média ponderada).
- [ ] Week number é baseado em ISO 8601.
- [ ] Limites semanais são escopados por ano.