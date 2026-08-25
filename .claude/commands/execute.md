---
description: Executa a implementação de uma task SDD — resolve o arquivo em .claude/sdd/<feature>/tasks/, lê spec e plan da feature, pergunta de qual branch cortar, cria a branch numa worktree isolada e delega ao indoor-agent → code-reviewer-typescript, em loop até aprovar. Não comita (isso é do /ship).
argument-hint: [<feature>/<id> | <id> | caminho do arquivo da task]
---

Execute a implementação da task: **$ARGUMENTS**

**Resolução do arquivo da task** (nesta ordem):

1. Se o argumento já for um caminho `.md`, usar direto e derivar `<feature>` do path
2. Se for `<feature>/<id>` (ex.: `01/03`, `1-indoor-api-socket-recovery/03`), resolver via glob `.claude/sdd/<feature>*/tasks/<id>-*.md`
3. Se for só um id (ex.: `03`), resolver via glob `.claude/sdd/*/tasks/<id>*.md` e derivar `<feature>` do path
4. Se for `TASK-XXX` (cross-repo, planejada no `delivery-tasks`), resolver nesta ordem:
   1. `.claude/tasks/TASK-XXX*.md` (cópia local — prioritário)
   2. `~/projects/sgrande-delivery/delivery-tasks/active/TASK-XXX*.md`
   3. `~/projects/sgrande-delivery/delivery-tasks/done/TASK-XXX*.md`
5. Se for só `<feature>`, ler a tabela do `plan.md` e propor a primeira task `pendente` respeitando "Depende de" — confirmar antes de seguir

Se não achar, reportar e parar. Se achar múltiplos, perguntar qual.

**Antes de implementar, ler nesta ordem:** a task, o `spec.md` e o `plan.md` da feature (inclusive "Aprendizados que valem para as próximas tasks" — é onde moram as armadilhas já pagas) e o `CLAUDE.md`.

**Conferir o campo `**Repo:**` da task.** Se não for `delivery-indoor`, o trabalho **não acontece aqui**: reportar em qual repo ele mora, confirmar com o dev se já foi feito e se está em produção, e só então seguir com a parte de front que depende dele. Codar contra endpoint ou evento que ainda não existe é a forma mais cara de descobrir que ele não existe.

**Verificar dependências:** se a task depende de outra que ainda não está `executada`/`shipped` no plan, avisar e perguntar se segue mesmo assim.

**Branch e worktree:** toda task é executada em **branch própria dentro de uma worktree própria**, nunca no checkout principal. Working tree sujo no checkout principal: nunca descartar — parar e perguntar antes de criar a worktree.

**A base da branch é sempre perguntada ao dev, nunca presumida.** Cortar da base errada é caro de descobrir: quem corta de `master` uma task que depende de outra ainda não mergeada começa sem o que a task pressupõe, e quem corta de uma branch alheia por engano leva trabalho de outra pessoa dentro do PR.

**Pré-requisito:** o arquivo da task, a `spec.md` e o `plan.md` precisam estar **commitados**. A worktree é um checkout de um commit — arquivo não commitado não existe lá dentro.

Fluxo:

1. **Resolver o arquivo da task** conforme a regra acima. Ler a task, a `spec.md` e o `plan.md` antes de qualquer coisa.

2. **Perguntar de qual branch cortar, e criar a branch e a worktree** — antes de qualquer alteração de arquivo:

   a. **Conferir o checkout principal:** `git status --porcelain`. Se a task, a spec ou o plan estiverem sem commit, **parar**.

   b. **`git fetch origin`** e levantar os candidatos reais de base:

   ```bash
   git fetch origin
   git branch --list "task/*" --sort=-committerdate | head -12
   git log --oneline -1 origin/master
   ```

   Para cada task em `Depende de:`, descobrir se a branch dela já foi mergeada:

   ```bash
   git branch --merged origin/master --list "task/<id-da-dependencia>-*"
   ```

   Vazio = **não mergeada**, e é o sinal que muda o default.

   c. **Perguntar ao dev — sempre, mesmo quando a resposta parecer óbvia:**

   > "A partir de qual branch cortar a `task/<id>-<slug>`?"
   > - `master` atualizado (`origin/master`)
   > - `task/<id>-<slug-da-dependencia>` — quando a task depende dela e ela ainda **não** foi mergeada
   > - outra branch existente (listar as candidatas do passo b)

   Ofereça como **default** a branch da dependência não mergeada, dizendo o porquê em voz alta. Sem dependência pendente, o default é `origin/master`.

   d. **Criar a branch e a worktree a partir da base escolhida:**

   ```bash
   git worktree add .claude/worktrees/task-<id>-<slug> -b task/<id>-<slug> <base-escolhida>
   ```

   E entrar nela com **`EnterWorktree` passando `path`** (não `name`): o `EnterWorktree` por `name` cria a worktree a partir do `worktree.baseRef` global do `settings.json`, que não aceita base por chamada — e base explícita é o ponto deste passo.

   e. **Bootstrap do que o git não carrega.** Worktree é checkout de commit: arquivo ignorado não vem junto.

   ```bash
   ln -s <repo-principal>/node_modules node_modules
   cp <repo-principal>/.env.development .env.development
   ```

   Sem o symlink, todo comando falha por dependência ausente; sem o `.env.development`, `yarn dev` sobe sem `NEXT_PUBLIC_API` e a falha aparece como tela em branco, não como erro de configuração. Valide o bootstrap com `npx tsc --noEmit` antes de delegar.

   f. **Registrar a base escolhida na seção `## Branch` da task**, com a data:

   ```markdown
   ## Branch

   `task/<id>-<slug>`, cortada de `<base-escolhida>` em <YYYY-MM-DD>.
   ```

   É esse registro que o `/ship` lê para saber contra qual branch abrir o PR.

   g. Não fazer commit — commit, push e PR são do `/ship`.

3. **Conferir a issue da task** — o campo `**Issue:**`. Se estiver vazio e o dev quiser rastreio, perguntar se é pra criar (label `task`, sub-issue da feature) e preencher o campo.

4. **Delegar ao agente `indoor-agent`** — passar o caminho da task, da spec e do plan. Ele lê os três + o `CLAUDE.md`, identifica a camada (página, componente, hook de fetch, módulo Redux, socket, serviço) e implementa. Repassar explicitamente as armadilhas registradas em "Aprendizados que valem para as próximas tasks".

5. **Delegar ao `code-reviewer-typescript`** pra validar padrões (tipagem rigorosa, MUI v4, Pages Router, `off` para cada `on`, fetch em hook e não em componente, nada apoiado na herança de auth) e os modos de falha conhecidos desta base. Pedir julgamento explícito sobre as decisões que o implementador tomou por conta própria.

6. Se o review apontar violação, voltar ao `indoor-agent` — loop até aprovar. **Verificar por conta própria** o que for barato: rodar `tsc`, `eslint` e `next build` com as vars de restaurante injetadas.

7. **Validar no navegador antes de dar a task por executada.** Este repo não tem teste automatizado — o build passando não diz que a mesa funciona. Rodar `yarn dev`, abrir `/?session=<uuid-de-uma-movimentação-aberta>` e seguir o roteiro da seção `## Testes` da task. Se não houver mesa aberta pra testar, **dizer isso no relatório** em vez de declarar sucesso.

8. **Atualizar o estado** quando aprovado:
   - `**Status:**` da task → `executada`
   - Linha correspondente na tabela do `plan.md` → `executada`
   - Seção `## Implementação` preenchida no arquivo da task (pelo agente)
   - Aprendizado novo que valha para as próximas tasks → acrescentar em "Aprendizados" no `plan.md`

9. **Reportar:**
   - Caminho da worktree e branch criada, prontas pro `/ship`
   - Arquivos criados/alterados, agrupados por camada
   - Resultado de `npx tsc --noEmit`, do eslint e do `next build`, **verificados por você**
   - O que foi validado no navegador e o que **não** foi
   - Decisões que o implementador tomou por conta própria e o veredito do review sobre elas
   - Variáveis de ambiente novas, se houver — e o lembrete de que `NEXT_PUBLIC_*` vira público no bundle
   - Próximo passo: `/ship <feature>/<id>`

**Importante:** criar worktree e branch é esperado, mas **NÃO fazer commits** — commit, push e PR são do `/ship`. Também **não** chamar `ExitWorktree` ao final: o `/ship` roda dentro da mesma worktree.

**Sobre o ambiente:**

- `npx next build` **exige** `NEXT_PUBLIC_RESTAURANT_ID` e `NEXT_PUBLIC_RESTAURANT_UUID` no ambiente — sem elas a API devolve 404 e o export falha nas 6 rotas. Isso é falha de ambiente, não de código; não "corrija" o código por causa dela
- Dentro da worktree, `node_modules` é um **symlink** para o do checkout principal. Se a task mexer em `package.json`, isso deixa de valer: instalar de verdade na worktree (`yarn install`) e dizer no relatório
- Uma branch só pode estar em check-out em **uma** worktree — `git checkout` de uma branch já usada em outra falha, e a saída do erro é a pista
- Task cortada da branch de outra task **enxerga o trabalho dela**. Ao encontrar comportamento estranho em código que a task não tocou, conferir `git log <base>..HEAD` antes de sair corrigindo
