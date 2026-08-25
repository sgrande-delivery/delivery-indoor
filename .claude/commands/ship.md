---
description: Ship de uma task SDD — commits atômicos, push e PR contra a branch de que a task foi cortada (confirmada com o dev). Este repo não tem CI: nenhum merge ou tag dispara deploy.
argument-hint: [<feature>/<id> | <id> | caminho do arquivo da task]
---

A task **$ARGUMENTS** foi aprovada por mim após testes locais. Prossiga com o ship.

> **Não há pipeline neste repo.** O `delivery-indoor` não tem `.github/workflows` — nenhum merge, tag ou release dispara build ou deploy. O deploy é feito fora do GitHub (`server.js` em runtime estilo Heroku, com as vars de restaurante injetadas pelo provisionamento). Consequência prática: **não crie tag nem release** aqui a menos que o dev peça explicitamente, e nunca diga que "o merge sobe pra produção" — não sobe.

> **Onde este comando roda.** O `/execute` deixa a task numa worktree própria (`.claude/worktrees/task-<id>-<slug>/`). O `/ship` roda **dentro dela**. Se a sessão estiver no checkout principal, entrar na worktree com `EnterWorktree` passando o `path`; se a worktree não existir, é sinal de que a task não foi executada por este fluxo — perguntar em vez de supor.

> **A base do PR vem da base da branch, não de um default.** O `/execute` registra na seção `## Branch` da task de qual branch ela foi cortada. Task cortada de `origin/master` abre PR contra `master`; task cortada de `task/<outra>` abre PR **contra essa branch** — apontar para `master` faria o diff carregar a task alheia inteira.

Fluxo:

1. **Resolver o arquivo da task** — mesma regra do `/execute`. Ler a task, a `spec.md` e o `plan.md`. Registrar:
   - `<task_id>` e `<slug>`
   - número da issue da task (campo `**Issue:**`) e o da feature
   - **a base registrada na seção `## Branch`** — é ela que define o alvo do PR
   - o campo `**Repo:**` — se não for `delivery-indoor`, este `/ship` não é o lugar; reportar e parar

2. **Conferir o remote.** O `origin` local pode apontar para o fork pessoal `raphaelcarreiro/delivery-board-client`. O repo canônico é `sgrande-delivery/delivery-indoor`:

   ```bash
   git remote -v
   ```

   Se estiver apontando para o fork, **parar e perguntar** antes de qualquer push — empurrar a branch para o repo errado espalha o trabalho em dois lugares.

3. **Confirmar o alvo do PR com o dev**, oferecendo a base registrada como default. Se a seção `## Branch` não registrar base, descobrir com `git merge-base` contra os candidatos e **perguntar**, sem presumir `master`.

4. **Delegar ao `git-agent` em duas etapas** — ele não consegue perguntar ao usuário, então a confirmação acontece aqui:

   **Etapa 1 — planejar.** Passar: branch atual, caminhos da task/spec/plan, **base do PR já confirmada pelo dev**, número das issues, e o que **não** pode entrar nos commits (spec de outra task, mudança pré-existente alheia, `.claude/settings.local.json`, `.env.development`). Pedir:
   a. Estado do git (`git status`, `git diff --stat`), incluindo varredura de segredo
   b. Garantir que a branch é `task/<task_id>-<slug>`; se não for, criar a partir do HEAD com confirmação
   c. Plano de commits atômicos em Conventional Commits, com os arquivos de cada um — **atômico aqui significa "cada commit compila"**, não "um commit por assunto"
   d. Título e corpo do PR

   **Etapa 2 — executar**, depois que o usuário confirmar o plano: commits, `git push -u origin <branch>` e `gh pr create --repo sgrande-delivery/delivery-indoor --base <alvo-confirmado>`.

5. **Corpo do PR** — o que faz um PR revisável aqui:
   - Começar pelo **problema concreto**, não pela lista de arquivos
   - Decisões que valem revisão, com o porquê — em especial as que o implementador tomou por conta própria e as que divergem da spec
   - **Contrato consumido** quando a task mexeu em integração: endpoint, envelope de resposta, nome de evento de socket. É o que quebra de novo quando a API mudar
   - Limitações honestas: o que ficou fora e **o que não foi verificado** — inclusive "não consegui testar com mesa aberta"
   - Variáveis de ambiente novas, se houver, com o lembrete de que `NEXT_PUBLIC_*` é público no bundle
   - `Closes #<issue-da-task>` no fim, literal e fora de bloco de código
   - Como testar: URL com `?session=<uuid>`, passos, o que observar

6. **Verificar o resultado, não confiar no exit code** — o `gh` já falhou em silêncio e já devolveu `HTTP 503` no meio de um `pr create`. Reler o corpo publicado pela API (`gh api repos/sgrande-delivery/delivery-indoor/pulls/<n>`) e comparar com o enviado. Em caso de 503, conferir pela REST se o PR chegou a ser criado **antes** de tentar de novo — senão nascem dois.

7. **Atualizar o estado SDD** (na branch, entrando nos commits):
   - `**Status:**` da task → `shipped`
   - Linha da task no `plan.md` → `shipped`
   - Se era a última task pendente da feature, `spec.md` → `**Status:** entregue`

8. **Tag e release: só sob pedido explícito.** Sem CI, tag aqui é marcação manual de versão, não gatilho de nada. Se o dev pedir:
   - `git fetch --tags`; última tag: `git tag --sort=-version:refname | head -1`
   - Calcular a próxima a partir dela (o `package.json` está fixo em `1.0.0` e **não** é fonte de versão)
   - Perguntar o bump: patch (default), minor ou major
   - Criar apontando pro HEAD da branch da task, e o release **sem** `--prerelease` (não há promoção a esperar aqui)

9. **Fechar issues relacionadas** — só as que o PR não fecha sozinho. A issue da task fecha no merge pelo `Closes #N`; **não fechar à mão**.

10. **Encerrar a worktree** — só depois do push e do PR confirmados pela API:
   - Perguntar ao dev: **manter** (revisão pode pedir ajuste) ou **remover** (trabalho despachado). Manter é o default
   - **Manter:** `ExitWorktree` com `action: "keep"`
   - **Remover:** a worktree do `/execute` é criada por `git worktree add` e entrada por `path`, e o `ExitWorktree` **não remove** worktree entrada assim. Na ordem: conferir `git status --porcelain` limpo **dentro** dela, sair com `ExitWorktree` (`action: "keep"`) e remover do checkout principal:

     ```bash
     git worktree remove .claude/worktrees/task-<id>-<slug>
     ```

     O `git worktree remove` recusa worktree com alteração não commitada, e essa recusa é proteção: **nunca** passar `--force`
   - A branch **não** é apagada junto — ela é o que o PR aponta
   - Só remover depois de confirmar que a branch está no remoto (`git rev-parse HEAD` igual ao de `origin/<branch>`)

11. **Reportar:**
   - Link do PR e base de verdade dele (lida da API), hash e assunto de cada commit, `git status` final
   - Issues vinculadas
   - Destino da worktree
   - O que **não** foi verificado
   - Lembrete: "Este repo não tem CI. O merge não deploya nada — a subida é manual."

**Não fazer:**

- Não fazer push sem conferir que o `origin` é `sgrande-delivery/delivery-indoor`
- Não incluir nos commits arquivo que não pertence à task — `git add` por caminho explícito, nunca `git add .`
- Não commitar `.env.development` (é gitignored) nem acrescentar segredo a `.env.production` (o repo é público e `NEXT_PUBLIC_*` vai pro bundle de qualquer forma)
- Não fechar à mão a issue que o `Closes #N` fecha no merge
- Não criar tag ou release sem o dev pedir
- Não afirmar que o merge sobe pra produção
