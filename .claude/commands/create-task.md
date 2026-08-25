---
description: Materializa uma task de uma feature SDD em .claude/sdd/<feature>/tasks/ — nomeada com o número da issue no GitHub, vinculada como sub-issue da feature — e atualiza a tabela do plan.md. Requer spec/plan criados pelo /create-spec.
argument-hint: [feature] [nº da task no plan | descrição de task nova]
---

O usuário quer criar uma task de uma feature SDD. Argumentos:

**$ARGUMENTS**

Fluxo:

1. **Resolver a feature.**
   - O primeiro argumento é o slug (ou o número) da feature: `.claude/sdd/<feature>/` deve existir com `spec.md` e `plan.md`. Aceitar match parcial (`01` resolve `1-indoor-api-socket-recovery`).
   - Se não existir, parar e sugerir `/create-spec` — task sem spec não tem ancoragem.
   - Ler `spec.md` e `plan.md` **inteiros** antes de escrever qualquer coisa, inclusive a seção "Aprendizados que valem para as próximas tasks".

2. **Resolver a task.**
   - Segundo argumento **numérico** (`01`, `2`): é a linha da tabela do `plan.md` com status `a especificar`. Se já tiver arquivo, perguntar se é pra reescrever.
   - Segundo argumento **descritivo**: task nova — **adicionar a linha** na tabela do plan, com "Depende de" coerente com a ordem de execução.
   - Sem segundo argumento: listar as linhas `a especificar` e perguntar qual materializar.

3. **Resolver a issue no GitHub — SEMPRE perguntar:**

   > "Já existe issue pra esta task?"
   > 1. **Já existe** — o usuário informa o número
   > 2. **Criar** — abro a issue com label `task` e vinculo como sub-issue da feature
   > 3. **Sem issue** — segue só com arquivo local

   Ao criar: `gh issue create --repo sgrande-delivery/delivery-indoor --label task`, com **título** = o mesmo título curto da task e **corpo** = Objetivo (2–3 frases) + 2–3 bullets do Contexto (RF/RN cobertos, dependência) + "o que testar" resumido + caminho do arquivo local. Não colar o md inteiro.

   Se a label `task` ainda não existir, criar antes com `gh label create task --repo sgrande-delivery/delivery-indoor --description "Task de uma feature SDD"` — avisando o usuário.

   **Vincular como sub-issue** — a API exige o **id interno** da issue (não o `number`) e o campo como **inteiro** (`-F`, não `-f`, que manda string e devolve 422):

   ```bash
   R=sgrande-delivery/delivery-indoor
   SUB_ID=$(gh api repos/$R/issues/<numero-da-task> --jq '.id')
   gh api --method POST repos/$R/issues/<numero-da-feature>/sub_issues -F sub_issue_id=$SUB_ID
   ```

   Conferir com `gh api repos/$R/issues/<feature>/sub_issues --jq '.[] | "#\(.number) \(.state)"'` — o `sub_issues_summary` da issue-pai demora a refletir e não serve como confirmação imediata.

4. **Definir o nome do arquivo.**
   - **Regra geral:** `.claude/sdd/<feature>/tasks/<numero-da-issue>-<slug>.md`, com o **slug em inglês**
   - **Sem issue:** `<NN>-<slug>.md`, com `NN` sendo o próximo número livre da pasta
   - **Feature que atravessa repositórios:** quando as tasks de uma mesma feature têm issues em repos diferentes, o prefixo do arquivo passa a ser a **ordem de execução no `plan.md`**, e não o número da issue — que fica no campo `**Issue:**`. Numerar por issue nesse caso colocaria, por exemplo, um `18-*.md` (issue do `delivery-socket-api`) dentro da pasta do `delivery-indoor`, onde `#18` é outra coisa, e embaralharia a ordem. A feature `1-indoor-api-socket-recovery` é o precedente; registre a decisão numa nota abaixo da tabela do plan, como ela faz
   - Escolha **uma** das regras por feature e mantenha até o fim: metade dos arquivos por issue e metade por ordem é o pior dos dois

5. **Inspecionar o código antes de escrever** — abrir os arquivos que a task vai tocar e ancorar em `arquivo:linha` reais. Conferir o `CLAUDE.md` para não propor algo que viole as regras duras:

   - **Não há login.** Nada de `state.user`, `AuthProvider` ou token de cliente como identidade
   - A mesa vem de `router.query.session`; toda tela precisa do caminho "sem mesa"
   - `SocketStore` em module scope, um por namespace; um `socket.off` para cada `socket.on`
   - Listagem de produto é paginada — `{ items, total, current_page, last_page }`, params `page`/`rows`
   - MUI **v4** (`makeStyles`) e **Pages Router**; código do `delivery-client` precisa de tradução
   - `api` de `src/services/api.tsx` não funciona em `getStaticProps`/`getServerSideProps`
   - Total do carrinho é responsabilidade do middleware do módulo `cart`

   Quando a task tocar contrato externo, **abrir a fonte**: `app/Modules/*/routes/client-routes.php` na `delivery-api`, `src/nestjs/modules/*/events.ts` e `shared/gateway.ts` no `delivery-socket-api-2`.

6. **Escrever a task** seguindo o template:

   ```markdown
   # <ID> — <título curto descritivo>

   **Issue:** [#<n>](<url>) | (sem issue)
   **Feature:** [<nome>](../spec.md) — issue #<n>
   **Tipo:** feature | bug | chore | refator
   **Repo:** delivery-indoor | delivery-api | delivery-socket-api-2
   **Depende de:** <ID> | (nenhuma)
   **Status:** pendente

   ## Objetivo

   <2–3 frases: o que entrega, por que importa nesta feature, resultado esperado. Não listar arquivos aqui.>

   ## Contexto

   - Estado atual no código (com `arquivo:linha`)
   - Quais RF/RN da spec esta task cobre
   - Decisões já tomadas e dependências
   - Armadilha conhecida que se aplica aqui (ver "Aprendizados" do plan)

   ## Mudanças

   ### 1. <Primeira mudança nomeada>

   `src/caminho/do/arquivo.tsx` (novo | alterado):

   <Descrição + snippet/diff. Sempre citar o caminho; usar ```diff quando for alteração pontual.>

   ## Testes

   Este repo não tem suíte automatizada. A verificação é **manual e reprodutível** — descreva-a como
   um roteiro que outra pessoa consegue seguir:

   - `npx tsc --noEmit` sem erros
   - `npx eslint src pages --ext .ts,.tsx` sem novos erros (vs baseline)
   - `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` concluindo as 6 rotas
   - Roteiro no navegador: URL exata (incluindo `?session=<uuid>`), passos, o que observar

   ## Critérios de aceitação

   - [ ] <Item verificável — comportamento observável, não "funciona corretamente">
   - [ ] `npx tsc --noEmit` sem erros
   - [ ] `npx next build` concluindo com as vars de restaurante injetadas

   ## Fora de escopo

   - <Item que fica pra outra task — citar o número quando existir>

   ## Branch

   `task/<id>-<slug>`, base sugerida: `master` (ou a branch da task em `Depende de:`, se ela ainda não tiver mergeado).
   ```

   A base aqui é **sugestão**, não decisão: o `/execute` pergunta ao dev de qual branch cortar e reescreve esta seção com a base escolhida e a data.

   **Regras de qualidade:**
   - Critérios **verificáveis**: "com a mesa aberta em outra aba, lançar um produto no PDV faz o item aparecer em `/board` sem reload", não "socket funciona"
   - Quando a task altera contrato consumido, o critério inclui **o shape**: campos, envelope de paginação, nome de evento
   - Numerar e nomear cada mudança; sempre citar `arquivo:linha` do estado atual
   - Em "Fora de escopo", listar o que NÃO fazer, inclusive o que parece relacionado
   - **Não** preencher `## Implementação` — é do `/execute`
   - Não duplicar spec nem `CLAUDE.md` — referenciar basta
   - Não estimar tempo / story points
   - Task de outro repo (`**Repo:**` diferente de `delivery-indoor`) precisa dizer **onde** o trabalho acontece e que o `/execute` daqui não a implementa

7. **Atualizar o `plan.md`** — na linha da task: "Issue" recebe `[#n](url)` (ou `—`), "Arquivo" recebe o link relativo e "Status" vira `pendente`.

8. **Reportar:** caminho do arquivo, link da issue e confirmação do vínculo de sub-issue, linha atualizada no plan, recap de 2–3 linhas (objetivo + o que validar) e o próximo passo (`/execute <feature>/<id>`).

**Não fazer:**

- Não criar issue sem o usuário ter escolhido no passo 3 — é ação externa e visível
- Não commitar — os artefatos SDD sobem com o `/ship`
- Não inventar seções fora do template — o que não couber vai em "Contexto"
- Não deixar Objetivo genérico ("implementar conforme a spec") nem Contexto vazio
- Não tratar como task deste repo algo que depende de endpoint ou evento inexistente sem registrar a dependência e marcar o `**Repo:**` correto
