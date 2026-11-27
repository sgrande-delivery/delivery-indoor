# CLAUDE.md — delivery-indoor

App web que o **cliente sentado à mesa** usa: chega pelo QR code da mesa, que abre a aplicação com `?session=<uuid-da-movimentação>`, navega o cardápio, envia o pedido para a cozinha e acompanha a conta em tempo real. Repo canônico: **`sgrande-delivery/delivery-indoor`**. Este arquivo tem só o que vale em **toda** sessão; o resto carrega sob demanda (ver "Onde está o resto", no fim).

> **Confira o remote antes de qualquer push.** O `origin` local pode apontar para o fork pessoal `raphaelcarreiro/delivery-board-client`. `git remote -v`.

## O que diferencia este app do `delivery-client`

Este repo é fork do `delivery-client` (histórico git compartilhado desde o `1d341e8 first commit`), e três ausências explicam quase toda decisão aqui:

- **Não tem login.** Nenhuma rota `/login`. O cliente é identificado pela movimentação de mesa, não por usuário autenticado. `state.user` nunca é populado e **não é fonte de identidade**.
- **Não tem checkout.** O pedido vai para a cozinha e entra na conta da mesa; não há pagamento no envio do pedido.
- **Não tem entrega.** `shipment_method` é sempre de mesa; endereço, frete e área de entrega não se aplicam.

A **conta da mesa é a tela principal**: mostra produtos lançados, pagamentos e total, atualizados por socket enquanto o garçom lança coisas no PDV. O carrinho local é só a área de composição do pedido antes do envio — não sobrevive ao envio e não representa estado do servidor.

## Duas stacks, duas branches

| | `master` (v1, em produção) | `feat/indoor-v2` (o redesign) |
|---|---|---|
| Framework | Next.js 13.2 — **Pages Router** (`pages/`) | Next.js 15 — App Router |
| UI | **Material-UI v4** (`@material-ui/core`, `makeStyles`/JSS) | MUI 9 + Emotion, `styled()` |
| Estado | Redux + `@reduxjs/toolkit`, middleware por módulo | React Query (servidor) + contexto (UI) |
| Ícones | `@material-ui/icons` | subset do Material Symbols por `Icon` |

Runtime: Node 18 local, `engines.node: >=16`. O `server.js` (express + `heroku-ssl-redirect`) é herança do Heroku, e **não há GitHub Actions neste repo** — mas isso não quer dizer que nada deploya. Este repo é publicado na Vercel, **um projeto por restaurante**, todos da `master` pela integração git: medido em 2026-11-18, os deploys de produção chegam com `source=git`, `ref=master`. **Push na `master` é deploy em todos os restaurantes**, sem tag e sem release no meio — e quantos são muda a cada cliente novo, então a lista sai do dashboard, não daqui.

Como acessar a Vercel (e a VM): `delivery-infra/docs/acessos.md`. Em resumo: o token de escrita já existe, é o `VERCEL_TOKEN` do `.env` da `delivery-api`, e a production branch de um projeto só muda pelo dashboard.

**A `master` é o app que os clientes usam hoje.** O redesign está especificado nas features [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20) a [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24) e acumula na `feat/indoor-v2`, que vai para a `master` quando fechar. Correção do app em produção sai da `master`; trabalho do redesign sai da branch de integração. **Nenhum dos dois lados importa código do outro para preencher lacuna.**

Código copiado do `delivery-client` vem da `feat/app-v2` de lá e **precisa ser traduzido** para a stack de destino. Nunca cole `sx`, `'use client'` ou import de `@mui/*` em código da `master`.

## Ambientes: produção e dev

| | Endereço | Branch | Fala com |
|---|---|---|---|
| **Produção** | `mesas.sgrande.delivery` e os demais projetos de mesa, um por restaurante | `master` | `api.sgrande.delivery` — a VM EC2 |
| **Dev** | local (`yarn dev`) | — | `api-dev.sgrande.delivery` e os outros hosts `*-dev` |

**Este app não tem ambiente de dev publicado** — conferido em 2026-11-19, nenhum dos 8 projetos de mesa tem ambiente ligado a uma branch `dev`. O único host `-dev` da zona é `admin-dev.sgrande.delivery`, que é o **painel**, não este app.

Um endereço `*-dev.sgrande.delivery` **nunca é produção**: são registros A para o IP fixo da rede da máquina de desenvolvimento, e quem responde são os containers dela. Mesa, pedido e pagamento vistos ali não existem em produção — e o contrário também. O mapa completo está em `delivery-infra/docs/ambientes.md`.

## A branch `dev` — ambiente de desenvolvimento

**`dev` é o nome da branch de desenvolvimento em toda a organização** — nunca `develop`, nunca `staging`. É a branch ligada ao projeto de hospedagem com as variáveis apontando para o **ambiente de dev**, para olhar a tela no ar antes de ela chegar à mesa do cliente. Commit nela gera build; merge nela **não é entrega**, e o que sai dela não é evidência do que está em produção.

Ela **não é branch de integração** e não substitui nenhuma das duas acima: correção de produção continua saindo da `master` e o redesign continua acumulando na `feat/indoor-v2`. Não abrir PR de spec contra a `dev`, não cortar branch de spec dela.

**Ela não existe neste repo hoje** — conferido em 2026-11-17, não há `dev` no remoto. Confirmar com `git ls-remote --heads origin dev` antes de citá-la. No `delivery-admin` ela já existe e builda no projeto Vercel `sgrande-admin`; aqui o equivalente seria um dos projetos Vercel de mesa deste repo (`ohamburgues-indoor`, `topezeira-board` e os outros), que são por tenante.

## O fluxo da mesa

```
QR code → /?session=<board_movement_uuid>
   ├── GET /restaurants                      tema, cores, is_open, is_kitchen_open
   ├── GET /boardMovements/{id}              a mesa
   ├── socket /board, subscribe_channel      tempo real da conta
   ├── /menu, /offers                        cardápio (composição do pedido)
   ├── /cart                                 revisão e envio do pedido
   └── /board                                a conta da mesa
```

**`session` é a chave de tudo.** Sem ela o app não tem mesa: os hooks recebem `undefined` e retornam cedo, e a conta renderiza o estado "sem mesa". Toda feature que dependa da mesa precisa lidar com esse estado.

## Contratos externos

Este app não tem banco nem backend próprio. Tudo vem de dois serviços, e **o contrato deles é a fonte de verdade** — quando o código local divergir do que a API devolve, o código local está errado.

- **`delivery-api`** (`~/projects/sgrande-delivery/delivery-api`), base `${NEXT_PUBLIC_API}` = `.../api/client/`. O header canônico é **`x-restaurant-id` com o UUID** (`NEXT_PUBLIC_RESTAURANT_UUID`); os legados `restaurantid`/`restaurant_id` com id numérico ainda são aceitos, e código novo **não** os usa.
- **`delivery-socket-api`** (clone local: `~/projects/sgrande-delivery/delivery-socket-api`), base `${NEXT_PUBLIC_SOCKET}`. Namespaces que interessam: `/client` (anônimo, `x-restaurant-uuid`) e `/board` (anônimo com `query.app=indoor`, sala por movimentação via `subscribe_channel`).

Duas armadilhas que já quebraram tela aqui, e que valem em toda chamada:

- **`environment=board` em toda chamada de catálogo.** A API assume `delivery` quando o parâmetro falta: a omissão não dá erro, dá **cardápio errado**.
- **Listagem de produto é paginada, e os dois envelopes diferem.** v1: `{ items, total, current_page, last_page }`, **sem** `per_page`. v2: `{ data, meta: { total, per_page, current_page, last_page, has_more, facets } }`. Tipo que fala dos dois é tipo que mente.

A tabela de rotas, a de eventos de socket e os payloads estão na skill `contratos-externos`.

## A v1 e a v2 da plataforma

A `delivery-api` publica as rotas v2 **no mesmo deploy** da v1, com chave por restaurante (`uses_v2_orders`, `uses_payment_connectors`) decidindo qual caminho serve cada loja. **A v1 não acaba:** ela atende quem não migrou, sem data para o fim.

- **Não propor fallback de v2 para v1**, migração de rota ou ramificação por versão **sem spec que peça**.
- **Não apagar nem "modernizar" o que atende a v1**, e não perguntar se é para fazer: a resposta é não.
- **Não presumir que a v2 da API é a fonte ao conferir contrato** do app na `master`: ele mede contra as rotas v1, e ler a v2 por engano descreve um formato que estas telas não recebem (dinheiro em centavos inteiro, `option_groups` em vez de complemento legado).

**Uma fronteira de dado que não é para "consertar" por conta própria:** o pedido que a `master` cria grava nas tabelas de complemento legadas, enquanto o leitor v2 do painel carrega só `products.usages` e `products.removedIngredients` — um pedido lançado da mesa aparece no painel v2 **sem** complementos, adicionais e ingredientes. A saída está especificada ([#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22) aqui, [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) lá). Não implementar outra por conta própria.

## Comandos

```bash
yarn dev                       # next dev
yarn build                     # precisa das vars de restaurante no ambiente
yarn start                     # server.js em produção
npx tsc --noEmit               # type-check
npx eslint src pages --ext .ts,.tsx
```

**O build precisa das vars de restaurante.** `.env.production` não traz `NEXT_PUBLIC_RESTAURANT_ID` nem `NEXT_PUBLIC_RESTAURANT_UUID` — em produção o provisionamento injeta:

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build
```

Sem isso, `getStaticProps` e `_document` recebem 404 da API e o export falha nas 6 rotas — é falha de ambiente, não de código. **O repo só tem `.env.production`, e o `next dev` não carrega esse arquivo**: sem criar `.env.development` (gitignored), `NEXT_PUBLIC_API` e `NEXT_PUBLIC_SOCKET` ficam `undefined` e a falha aparece como tela em branco.

**`next build` e `next start` carregam `.env.production`** — testar em modo de produção sem injetar as vars sobe o app apontando para a produção de verdade. Confirme com `grep -r "api.sgrande.delivery" .next/static` antes de abrir o navegador.

Para exercitar a mesa localmente é preciso uma movimentação aberta: `/?session=<uuid>`.

**`.env.production` está versionado e o repo é público.** Toda var `NEXT_PUBLIC_*` é inlinada no bundle do browser — ela é pública por construção. Nunca coloque segredo real numa `NEXT_PUBLIC_*`, e nunca acrescente var não pública a esse arquivo.

## Fluxo de trabalho (SDD)

O trabalho é organizado por **feature**, não por task solta. Cada feature vive em `.claude/sdd/<issue>-<slug>/` com `spec.md` (o quê e por quê), `plan.md` (como, tabela de tasks e aprendizados) e `tasks/<id>-<slug>.md`, numerados pelas issues do GitHub — feature com label `feature`, cada task como sub-issue com label `task`.

```
/create-spec      → spec.md + plan.md + tasks/ (e a issue da feature)
/create-task      → acrescenta uma task à spec
/execute          → branch + worktree, implementação via indoor-agent, review
/ship-pr             → commits atômicos, push e PR contra a base de que a task foi cortada
```

**O comando chama-se `/ship-pr`, e não `/ship`, porque `/ship` virou comando nativo do Claude Code.** Command do repo com nome de built-in **não carrega**, então `/ship` passaria a rodar o nativo — commit, push, PR e vigília do PR até o merge, sem tag e sem release. **Não renomear de volta.**

**O `/create-spec` escreve na worktree `docs/<issue>-<slug>` e abre PR contra a `master`.** Os artefatos da spec sobem **antes** da execução, e a branch da task é cortada de uma base que já contém a spec — ou seja, depois do merge desse PR.

Fora do ciclo: `/review-task` confere a entrega contra o que a task prometeu, `/follow-ups` consolida a dívida adiada, e `/report-bug` e `/request-feature` abrem issue a partir de relato livre de tester ou PO.

**Status da task** no `plan.md`: `a especificar` → `pendente` → `executada` → `shipped`.

**Leia a `spec.md` e o `plan.md` da feature antes de executar qualquer task dela** — inclusive a seção "Aprendizados que valem para as próximas tasks", que é onde uma armadilha já paga fica registrada.

**Contrato escrito é contrato para implementar.** Feature que depende de rota ou evento novo nasce como spec no repo de destino, e aqui a spec e cada task carregam o contrato **inline**. A tela é construída inteira contra ele, mesmo com a rota ainda não publicada. É proibido esconder UI porque "a rota não subiu", trocar implementação por mock, stub ou TODO, ou transformar isso em pergunta. O aviso de ordem de deploy vai no relatório, nunca na execução. O único motivo real para parar é **divergência medida** entre as duas specs no contrato (campo, status, unidade, nome de evento) — ausência de implementação do outro lado **não** é divergência.

**Subagentes** (`.claude/agents/`): `indoor-agent` implementa, `code-reviewer-typescript` revisa contra os modos de falha desta base, `git-agent` faz commit, push e PR. O `/execute` e o `/ship-pr` os orquestram — não invocar direto.

**Identificadores:** código, nomes de arquivo, branches e slugs de pasta SDD em **inglês**; specs, tasks, issues, PRs e mensagens de UI em **português**, minúsculo, seguindo o que já existe (`"cardápio"`, `"nenhum produto para mostrar"`).

## O que NÃO fazer

- **Não** trate `state.user` como identidade — este app não tem login
- **Não** copie código do `delivery-client` sem traduzir para a stack de destino
- **Não** chame `api` (de `src/services/api.tsx`) dentro de `getStaticProps`/`getServerSideProps` — ele toca `localStorage`
- **Não** instancie `SocketStore` dentro de componente
- **Não** registre `socket.on` sem o `socket.off` correspondente no cleanup
- **Não** assuma que `products` de `/categories/{url}` é array — é envelope paginado
- **Não** assuma `per_page` no envelope da v1 — lá o campo é `current_page`
- **Não** coloque segredo em var `NEXT_PUBLIC_*`
- **Não** calcule total do carrinho em componente — é o middleware do módulo `cart` (na `master`) ou o servidor (na v2)
- **Não** construa em cima de `AuthProvider`, `GoogleProvider`, `FacebookProvider` ou `src/components/login/` — é herança morta do fork, cuja remoção está na [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20)
- **Não** migre rota para v2 nem ramifique por versão da plataforma sem spec que peça
- Se o contrato real da API divergir do que a task diz, **pare e reporte** em vez de adaptar em silêncio

## Onde está o resto

Nada abaixo carrega nesta conversa até ser preciso — é por isso que não está aqui.

| Preciso de | Onde está | Carrega quando |
|---|---|---|
| Hook de busca, React Query, envelope de paginação, erro na UI | rule `busca-de-dados` | tocar em `src/**` |
| `SocketStore`, salas, `subscribe_channel`, cleanup de listener | rule `socket-da-mesa` | tocar em `src/hooks/**`, `src/store/**` |
| Extração de componente, `styled` × `sx`, MUI v4 × MUI 9, dinheiro | rule `componentes-e-estilos` | tocar em `src/**/*.tsx` |
| Rotas da `delivery-api`, eventos do `/board`, payloads da mesa | skill `contratos-externos` | tocar em integração |
| Design system, tokens versionados (`.claude/design-system/tokens.json`) e protótipo da tela | skill `modelo-de-design` | especificar, implementar ou redesenhar tela, e antes de criar protótipo |
| Inventário dos repos, branches e clones da plataforma | skill `inventario-repos` | citar outro repo |
