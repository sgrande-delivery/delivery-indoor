---
description: Revisa fidelidade da entrega de uma task contra o que a spec prometeu — critérios de aceitação, premissas factuais, inconsistências internas e escopo creep. Diferente do code-reviewer-typescript, foca em "entregou o que prometeu", não em qualidade de código.
argument-hint: [<feature>/<id> | <id> | caminho do arquivo da task]
---

O usuário quer revisar se a entrega de uma task bate com o que a spec prometeu. Alvo: **$ARGUMENTS**

Diferente do `code-reviewer-typescript` (que olha qualidade de código), este comando cruza a **task** com o **diff** para detectar:

- critério de aceitação não cumprido;
- arquivo que a task mandou tocar e não foi tocado, e o contrário;
- **premissa factual** da task que não bate com a realidade (ex.: "`BoardButtons` ainda é usado" → `grep` devolve zero);
- inconsistência interna da task (critério que conflita com "Fora do escopo");
- decisão pendente que ficou sem decisão, ou foi resolvida em silêncio.

Fluxo:

1. **Resolver o alvo** (mesma regra do `/execute`):
   - caminho `.md`: usar direto;
   - `<feature>/<id>` ou só `<id>`: glob `.claude/sdd/<feature>*/tasks/<id>-*.md`, ou `.claude/sdd/*/tasks/<id>*.md`;
   - ambíguo ou vazio: **perguntar**. Não chutar.

   Ler também a `spec.md` e o `plan.md` da feature: **RN violada é achado**, mesmo com todos os critérios da task cumpridos. A task entrega uma fatia; a spec é o contrato da feature.

2. **Ler a task inteira** e extrair: tipo e severidade; mudanças propostas (arquivo + descrição); critérios de aceitação (cada bullet é um item independente); decisões pendentes; "Fora do escopo"; a seção `## Implementação`, comparando o "Arquivos modificados" de lá com o git real e julgando as "Decisões que tomei por conta própria"; e as **premissas factuais** ("X ainda é usado em Y", "a linha N de F faz W"), que **todas** precisam ser verificadas.

3. **Localizar a implementação:**
   - `git log --oneline --all --grep "<id>"`;
   - `git log --oneline --all -- <caminho do arquivo da task>`;
   - a branch da task — **a base está registrada na seção `## Branch` da task**, e aqui cada task tem branch própria (`task/<id>-<slug>`). **Não presumir `master`**: task cortada de outra task compara contra ela.
   - a branch costuma estar numa worktree sob `.claude/worktrees/` — `git worktree list` mostra onde.
   - Se nada bater, perguntar qual commit ou branch revisar.

4. **Para cada critério**, verificar e classificar:
   - menciona arquivo ou componente → ler o arquivo no estado atual;
   - é comportamental ("aparece quando X") → ler a condicional e simular mentalmente;
   - é genérico ("não há regressão") → **não-verificável estaticamente**;
   - ✅ cumprido · ⚠️ parcial · ❌ não cumprido · 🔵 não-verificável (precisa navegador).

   Neste repo, **quase tudo que é de render é 🔵**: o `tsc` limpo e o build verde já conviveram com cardápio quebrado e com `TypeError` fatal na home. Diga o que falta provar no navegador em vez de dar por cumprido.

5. **Verificar as premissas factuais** com `grep` e leitura de `arquivo:linha`. Divergência de premissa geralmente significa que quem escreveu a task assumiu errado e o implementador seguiu — e isso é achado da task, não do código.

   Quando a premissa é de **contrato** (o que uma rota devolve, o que um evento significa), confira contra a skill `contratos-externos` e, se houver dúvida, contra a resposta real. Premissa de contrato errada é o modo de falha mais caro daqui.

6. **Detectar inconsistência interna** da task: critério que conflita com "Fora do escopo", mudança que sobrepõe outra, decisão default que contraria critério explícito.

7. **Detectar escopo creep:** arquivo no diff que não está em "Mudanças propostas" nem em "Arquivos modificados". Pode ser refatoração oportunística (questionável), efeito colateral necessário (anotar) ou arquivo gerado (ignorar). Duas tasks que tocam o mesmo arquivo brigam mesmo quando a mudança é "de passagem" — e o dano costuma ser incoerência, não conflito de merge.

8. **Renderizar o relatório:**

   ```markdown
   # Revisão <id> — <título da task>

   **Task:** `.claude/sdd/<feature>/tasks/<id>-<slug>.md`
   **Commits:** <hash> (mensagem)
   **Branch:** task/<id>-<slug>, cortada de <base registrada>

   ## Sumário
   - <N> critérios cumpridos · <M> parciais · <K> não cumpridos · <P> não-verificáveis
   - <Q> divergências de premissa · <R> inconsistências internas

   ## Critérios de aceitação
   | # | Critério | Status | Observação |
   |---|----------|--------|------------|

   ## Divergências de premissa
   ## Inconsistências internas
   ## Escopo creep
   ## O que falta provar no navegador
   ## Recomendações
   ```

9. **Sugerir o próximo passo:** com crítico, oferecer acrescentar uma task de correção à spec; tudo verde, recomendar o `/ship-pr`; premissa errada, recomendar corrigir a task antes de fechar a issue.

**Não fazer:**

- Não modificar arquivo — o comando é read-only. Fix pedido pelo usuário entra como task nova (`/create-task`), não como emenda.
- Não rodar `eslint`, `tsc` nem build — isso é do `code-reviewer-typescript`. Aqui o foco é fidelidade.
- Não revisar qualidade de código — invocar o `code-reviewer-typescript` em paralelo se quiser cobertura completa.
- Não confiar na seção `## Implementação`: ela diz o que o implementador **intencionou**. Confirmar com `git diff`.
- Não fechar issue nem mergear nada.

**Sinal para escalar:** divergência grave (bug funcional documentado em critério) ou premissa errada que sugere problema sistêmico. Aí pare e pergunte se é para criar task de correção agora ou terminar a revisão primeiro. Para erro menor, siga até o fim e liste tudo.
