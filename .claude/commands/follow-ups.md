---
description: Lista follow-ups registrados nas tasks de .claude/sdd/*/tasks/ — itens não-bloqueantes adiados durante implementação ou review. Útil pra ver dívida técnica acumulada.
argument-hint: [filtro opcional — palavra-chave, --age=30]
---

O usuário quer ver os follow-ups acumulados. Filtro opcional: **$ARGUMENTS**

As tasks deste projeto registram pendência não-bloqueante em duas seções padrão:

- `## Notas` — observação final do implementador ou do dev na entrega;
- `## Follow-ups identificados em review` — bullets que o `code-reviewer-typescript` deixou ao aprovar com pendência.

Esses pontos somem se ninguém reabre as tasks antigas. Este comando consolida tudo numa lista navegável.

Fluxo:

1. **Coletar as tasks:**

   ```bash
   ls .claude/sdd/*/tasks/*.md 2>/dev/null
   ```

2. **Para cada task**, extrair o id e a feature a que pertence, o título (primeira linha `# <id> — ...`), os bullets das seções de follow-up, e a data do primeiro commit do arquivo (`git log --diff-filter=A --format=%aI -- <arquivo>`), para calcular idade.

3. **Filtrar** se `$ARGUMENTS` veio: match case-insensitive em id, título e conteúdo do bullet. Sem argumento, listar tudo.

4. **Renderizar** agrupado por task, mais recente primeiro:

   ```markdown
   ## Follow-ups acumulados (<N> tasks com pendências)

   ### 09 — Bloco de ofertas da home lê o envelope paginado
   _Primeiro commit: 2026-11-07 (10 dias atrás)_

   - [ ] **`src/components/index/offers/Offers.tsx`** — propagar erro para a UI em vez de `console.error` (review #3)
   - [ ] `rootMargin` do scroll infinito não tem efeito: o scroll é do container do layout, não da viewport
   ```

5. **Resumir no fim:** total de follow-ups, task mais antiga, e a recomendação de agrupar por área quando passar de uma dezena — nesse ponto vale uma spec de limpeza em vez de tasks soltas.

**Detecção de bullet.** É follow-up o bullet (`- `, `- [ ]`, `* `) que está numa seção cujo título casa, sem distinguir maiúsculas, com "follow", "notas", "pendente" ou "polimento", e que tem ação implícita ou explícita.

**Não é follow-up:** item de `## Critérios de aceitação` (é checklist da entrega), de `## Fora do escopo` (foi deliberadamente removido), de `## Decisões pendentes` (é decisão de produto), nem bullet dentro de `### Resultado dos comandos`.

**Vale ler junto os "Aprendizados" dos plans.** Eles não são follow-up — são armadilha já paga —, mas quando um follow-up repete um aprendizado, o relatório deve dizer: é sinal de que a lição não virou regra em lugar nenhum, e aí o conserto é editar a rule ou o `CLAUDE.md`, não abrir mais uma task.

**Argumentos:**

- vazio → tudo;
- palavra → filtra por match em id, título ou conteúdo;
- `--age=30` → só tasks com mais de 30 dias (dívida de verdade).

**Não fazer:**

- Não modificar arquivo — o comando é read-only.
- Não abrir issue automaticamente. Virar follow-up em task é `/create-task`, invocado pelo usuário.
- Não consultar o GitHub: a fonte é o filesystem.
- Não inferir prioridade — listar na ordem de leitura, agrupado por task.
