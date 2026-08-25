---
description: Cria a estrutura SDD de uma feature em .claude/sdd/<issue>-<slug>/ — spec.md (o quê/por quê) e plan.md (como, com a quebra em tasks), abrindo a issue `feature` no GitHub. Primeiro passo do fluxo /create-spec → /create-task → /execute → /ship.
argument-hint: [número da issue de feature e/ou descrição da feature]
---

O usuário quer especificar uma nova feature neste repo. A descrição dele é:

**$ARGUMENTS**

Fluxo:

1. **Resolver a issue de feature no GitHub.**
   - Se o usuário passou um número, validar com `gh issue view <n> --repo sgrande-delivery/delivery-indoor` e usar o título como base do slug. Sem a label `feature`, avisar e perguntar se é pra adicionar.
   - Se passou só a descrição, **perguntar** antes de criar: *"Crio a issue de feature no GitHub, ou você já tem uma?"* Criar issue é ação externa e visível — nunca fazer sem escolha explícita.
   - Ao criar: `gh issue create --repo sgrande-delivery/delivery-indoor --label feature`, título curto descrevendo a frente (não a task), corpo com objetivo em 1–2 parágrafos e a lista de tasks previstas.
   - Sem GitHub disponível ou sem escolha do usuário: seguir com numeração local sequencial (`01`, `02`, …) e registrar no `plan.md` que a pasta deve ser renomeada quando a issue existir.

2. **Definir o slug da feature (pasta SDD).**
   - Formato: `<numero>-<slug>`, onde `<numero>` é o da issue ou o sequencial local.
   - **O slug é em inglês**, mesmo com a issue e a spec em português. Traduzir o sentido do título, não palavra por palavra.
   - Lowercase, kebab-case, sem artigo nem preposição, ~3–5 palavras, começando pelo domínio quando ajudar a agrupar (`board-`, `menu-`, `cart-`, `socket-`).
   - Exemplos no formato deste repo:
     - *"Cardápio não carrega produtos da categoria"* → `board-menu-pagination`
     - *"Cliente não vê lançamento do garçom em tempo real"* → `indoor-socket-recovery`
     - *"Chamar o garçom pela tela da conta"* → `board-waiter-call`
   - Diretório: `.claude/sdd/<numero>-<slug>/`. Se já existir, perguntar: evoluir a spec ou escolher outro nome. **Nunca sobrescrever silenciosamente.**
   - Confirmar o slug com o usuário antes de criar.

3. **Decidir o escopo do repo antes de escrever a spec.**

   Este repo é um front-end sem backend próprio. Todo estado durável mora na `delivery-api`, e todo tempo real vem do `delivery-socket-api-2`. Isso muda a pergunta inicial de toda feature:

   - A feature precisa de **endpoint ou evento que ainda não existe**? Então parte dela é cross-repo. Registrar em "Dependências de outros repos" no `plan.md` e avaliar com o usuário se o planejamento principal deveria morar no `delivery-tasks` (`TASK-XXX`), com este repo executando só a parte de front.
   - A feature depende de **identidade do cliente**? Este app **não tem login** e `state.user` nunca é populado. Qualquer coisa que pressuponha usuário autenticado é decisão de arquitetura, não detalhe — vai para "Decisões pendentes".
   - A feature toca a **conta da mesa** (`boardMovement`)? Então ela concorre com o PDV lançando itens pelo socket. Concorrência entra nas RN.
   - A feature toca **listagem de produto**? A `delivery-api` pagina; assumir array é o erro mais comum aqui.

4. **Coletar informações faltantes** — uma única rodada de perguntas curtas, só se algo essencial não estiver claro:
   - Objetivo e quem é afetado (cliente na mesa, garçom no PDV, gestor)
   - Escopo: resolvível só neste repo, ou depende de contrato novo da `delivery-api`/`delivery-socket-api-2`
   - Regras de negócio já conhecidas

   Se a descrição já cobre tudo, pular.

5. **Inspecionar o código antes de escrever** — ancorar a spec na realidade do repo:
   - `CLAUDE.md` (fluxo da mesa, contratos externos, herança do fork, "O que NÃO fazer")
   - As specs vizinhas em `.claude/sdd/*/spec.md` — especialmente as RN, que costumam valer para mais de uma frente
   - Os contratos reais: `app/Modules/*/routes/client-routes.php` na `delivery-api`, `src/nestjs/modules/*/events.ts` no `delivery-socket-api-2`. **Confirme na fonte**, não na memória
   - O que já existe pra reaproveitar (`SocketStore`, hooks `useFetchX`, middlewares do `cart`)

   Spec que ignora o padrão do repo vira retrabalho no plan.

6. **Escrever `spec.md`** em `.claude/sdd/<feature>/spec.md`:

   ```markdown
   # Spec — <Nome da feature>

   **Status:** rascunho
   **Criada em:** <YYYY-MM-DD>
   **Escopo:** front-end | cross-repo
   **Issue:** [#<n>](<url>) | (sem issue)

   ## Contexto

   <Por que a feature existe. Problema, gap atual, o que dói hoje. 1–3 parágrafos.>

   ## Objetivo

   <O que muda quando a feature estiver entregue. 1 parágrafo.>

   ## Requisitos funcionais

   - **RF-01** — <requisito verificável>

   ## Regras de negócio

   - **RN-01** — <regra, com o porquê quando não for óbvio>

   ## Fora do escopo

   - <Item que poderia confundir mas não está na feature>

   ## Critérios de aceitação

   - [ ] <Item verificável da feature como um todo>

   ## Decisões pendentes

   | # | Tema | Recomendação default |
   |---|------|----------------------|
   | 1 | <tema> | <recomendação — o executor segue se ninguém opinar> |

   <Omitir a seção se não houver decisões pendentes.>
   ```

   **As RN são o que a spec tem de mais durável.** Preferir regra que explique *por quê* ("o socket do `/board` exige cookie de login porque o `BoardGateway` herda o `handleConnection` do `Gateway`") a regra que só afirma. É nelas que uma premissa errada fica visível antes de virar bug.

   Regras que valem para quase toda feature deste repo e devem aparecer quando forem tocadas: **não há login**; **a mesa vem de `router.query.session`**; **listagem de produto é paginada**; **um `socket.off` para cada `socket.on`**; **MUI v4 e Pages Router**.

7. **Escrever `plan.md`** em `.claude/sdd/<feature>/plan.md`:

   ```markdown
   # Plan — <Nome da feature>

   **Spec:** [spec.md](./spec.md)
   **Issue da feature:** [#<n>](<url>) | (sem issue)
   **Branch de trabalho:** uma por task (`task/<id>-<slug>`)

   ## Abordagem técnica

   <Como a feature se encaixa: páginas e componentes afetados, hooks de fetch, módulos Redux,
   namespaces de socket, endpoints consumidos. Citar arquivo:linha do que será reaproveitado.>

   ## Decisões arquiteturais

   - <Decisão e o porquê. Se veio de "Decisões pendentes" da spec, referenciar.>

   ## Tasks

   | # | Task | Issue | Arquivo | Depende de | Status |
   |---|------|-------|---------|------------|--------|
   | 01 | <título curto> | — | — | — | a especificar |

   Status: `a especificar` → `pendente` → `executada` → `shipped`.

   ## Ordem de execução

   <Sequência e o porquê das dependências.>

   ## Dependências de outros repos

   <Endpoint que a `delivery-api` precisa expor, evento que o `delivery-socket-api-2` precisa emitir.
   Dizer qual repo, qual arquivo e se já está em produção. Omitir se a feature for autocontida.>

   ## Aprendizados que valem para as próximas tasks

   <Preenchido ao longo da execução: armadilha encontrada, premissa derrubada, divergência entre
   o contrato documentado e o real. Omitir na criação.>
   ```

8. **Criar o diretório `tasks/`** vazio em `.claude/sdd/<feature>/tasks/`.

9. **Reportar** ao usuário: caminhos criados, link da issue, resumo da quebra em tasks, e o próximo passo (`/create-task <feature> 01`).

**Não fazer:**

- Não criar issue no GitHub sem o usuário ter escolhido — é ação externa e visível
- Não criar os arquivos de task aqui — isso é do `/create-task`
- Não commitar — os artefatos SDD sobem junto com o `/ship`
- Não duplicar o `CLAUDE.md` na spec — referenciar basta
- Não estimar tempo / story points
- Textos em português; código, slugs e branches em inglês
