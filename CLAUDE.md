# delivery-indoor — CLAUDE.md

## Contexto do Projeto

Este repositório é o **delivery-indoor** (nome histórico do diretório e do `package.json`: `delivery-board-client`). Repo canônico no GitHub: **`sgrande-delivery/delivery-indoor`**, branch principal `master`.

> **Atenção ao remote.** O `origin` local ainda pode apontar para o fork pessoal `raphaelcarreiro/delivery-board-client`. O repo canônico é `sgrande-delivery/delivery-indoor` — confira com `git remote -v` antes de qualquer push.

## O que é este projeto

App web que o **cliente sentado à mesa** usa. Ele chega pelo QR code da mesa, que abre a aplicação com `?session=<uuid-da-movimentação>`, navega o cardápio, envia o pedido e acompanha a conta em tempo real até pedir o fechamento.

O que o diferencia do `delivery-client` (do qual este repo é fork, com histórico git compartilhado desde o `1d341e8 first commit`):

- **Não tem login.** Nenhuma rota `/login` existe em `pages/`. O cliente é identificado pela movimentação de mesa, não por usuário autenticado.
- **Não tem checkout.** O pedido é enviado direto para `POST /boardMovements/{id}/orders`; não há pagamento no app.
- **Não tem entrega.** `shipment_method` é sempre `board`; endereço, frete e área de entrega não se aplicam.
- **A conta é a tela principal.** `/board` mostra produtos lançados, pagamentos e total da mesa, atualizados por socket enquanto o garçom lança coisas no PDV.

O carrinho local existe apenas como área de composição do pedido antes do envio — ele não sobrevive ao envio nem representa estado do servidor.

## Stack

| | |
|---|---|
| Framework | Next.js 13.2 — **Pages Router** (`pages/`), não App Router |
| UI | **Material-UI v4** (`@material-ui/core`, `makeStyles`/JSS) — não é `@mui` v5+ |
| Estado | Redux + `@reduxjs/toolkit`, com middlewares próprios por módulo |
| HTTP | axios, instância única em `src/services/api.tsx` |
| Realtime | `socket.io-client` via `SocketStore` (`src/store/socket-store.ts`) |
| Runtime | Node 18 local; `engines.node: >=16` |
| Deploy | `server.js` (express + `heroku-ssl-redirect`), estilo Heroku. **Não há GitHub Actions neste repo** — nenhum merge ou tag dispara deploy |

O `delivery-client` já migrou para Next 15 + App Router + MUI v6. **Este repo não migrou.** Código copiado de lá precisa ser traduzido para MUI v4 e Pages Router — não cole `sx`, `'use client'` nem imports de `@mui/*`.

## Arquitetura — o fluxo da mesa

```
QR code da mesa
   └── /?session=<board_movement_uuid>
         │
         ├── src/App.tsx
         │     ├── useFecthRestaurant()                      → GET /restaurants        (tema, cores, is_open)
         │     ├── useFetchBoardMovement(session)            → GET /boardMovements/{id}
         │     ├── useBoardControlSocket(session)            → namespace /board, subscribe_channel
         │     ├── useSocketEvents()                         → namespace /client, kitchen_state_changed
         │     └── useFetchPromotions()                      → GET /promotions
         │
         ├── /menu, /menu/[url], /offers   → cardápio (composição do pedido)
         ├── /cart                         → revisão e POST /boardMovements/{id}/orders
         └── /board                        → a conta da mesa
               ├── useFecthBoardMovementProducts(id)  → GET /boardMovements/{id}/products
               └── useFetchBoardMovementPayments(id)  → GET /boardMovements/{id}/payments
```

**`router.query.session` é a chave de tudo.** Sem ele o app não tem mesa: `useFetchBoardMovement` e `useBoardControlSocket` recebem `undefined` e retornam cedo, e `/board` renderiza `BoardNoMovement`. Toda feature que dependa da mesa precisa lidar com esse estado.

### Redux

`src/store/redux/modules/`:

| Módulo | Papel |
|---|---|
| `restaurant` | dados do restaurante, tema, `is_open`, `is_kitchen_open` |
| `boardMovement` | **a conta da mesa** — produtos lançados, pagamentos, desconto, total |
| `cart` | composição local do pedido (some após o envio) |
| `promotion` | promoções ativas, aplicadas pelo middleware do `cart` |
| `order` | último pedido enviado |
| `user` | herança do fork — **sem login, nunca é populado** |

O `cart` tem middleware que recalcula total e promoções a cada ação (`src/store/redux/modules/cart/middleware.ts`). Não recalcule total em componente.

## Contratos externos

Este app não tem banco nem backend próprio. Tudo vem de dois serviços, e **o contrato deles é a fonte de verdade** — quando o código local divergir do que a API devolve, o código local está errado.

### `delivery-api` (`~/projects/sgrande-delivery/delivery-api`)

Base: `${NEXT_PUBLIC_API}` = `.../api/client/`. Rotas registradas por módulo em `app/Modules/*/routes/client-routes.php`.

**Identificação do restaurante.** O header canônico é **`x-restaurant-id`, com o UUID** (`NEXT_PUBLIC_RESTAURANT_UUID`). O `RestaurantMiddleware` ainda aceita os legados `restaurantid`/`restaurant_id` com id numérico, e o repo hoje mistura os dois — `src/services/api.tsx` manda `RestaurantId` numérico, `pages/_document.tsx` e `pages/menu/*` mandam `x-restaurant-id` com UUID. Código novo usa **sempre** `x-restaurant-id` + UUID.

Rotas que este app consome:

| Rota | Observação |
|---|---|
| `GET /restaurants` | tema, cores, `is_open`, `working_hours`, `addresses` |
| `GET /categories?environment=board` | array simples de categorias |
| `GET /categories/{url}?environment=board` | **`products` vem paginado** — objeto, não array |
| `GET /products?environment=board&page&rows` | **paginado** |
| `GET /products/{id}` | produto completo com complementos |
| `GET /promotions` | |
| `GET /boardMovements/{id}` | a mesa |
| `GET /boardMovements/{id}/products` | `{ products, discount }` |
| `GET /boardMovements/{id}/payments` | |
| `POST /boardMovements/{id}/orders` | envio do pedido — validado por `app/Modules/Order/Request/OrderBaseRequest.php` |

**Paginação.** O envelope é `{ items, total, current_page, last_page }` — repare que é **`current_page`**, não `per_page`. Os parâmetros são `page` e `rows`. Isso vale tanto para `/products` quanto para o `products` de dentro de `/categories/{url}`.

`/pushTokens` **não existe mais** — virou `push-tokens` (`app/Modules/PushNotification/routes/client-routes.php`).

### `delivery-socket-api-2` (`~/projects/sgrande-delivery/delivery-socket-api-2`)

> **O diretório local e o repo no GitHub têm nomes diferentes.** O checkout local é `delivery-socket-api-2`, mas o repositório é **`sgrande-delivery/delivery-socket-api`**, sem sufixo. Use o nome sem sufixo em qualquer `gh` — com ele o comando devolve *"Could not resolve to a Repository"*.

Base: `${NEXT_PUBLIC_SOCKET}`. Dois namespaces interessam:

**`/client`** — `ClientGateway` autentica **só** com `x-restaurant-uuid` no `handshake.auth`. Anônimo. Eventos: `kitchen_state_changed`, `restaurant_state_changed`.

**`/board`** — `BoardGateway` (`src/nestjs/modules/board/board.gateway.ts`). Eventos, todos em `board/events.ts`:

| Evento | Direção | Sala |
|---|---|---|
| `subscribe_channel` / `unsubscribe_channel` | emit | — |
| `board_products_added` | on | `board_movement_id` |
| `board_product_deleted` | on | `board_movement_id` |
| `board_payment_added` | on | `board_movement_id` |
| `board_payment_deleted` | on | `board_movement_id` |
| `board_totals_changed` | on | `board_movement_id` |
| `board_session_created` / `board_session_completed` | on | `restaurant_uuid` |

> **Autenticação do `/board`.** O `BoardGateway` herda `handleConnection` de `src/nestjs/modules/shared/gateway.ts`, que exige o cookie `socket-${app}-access-token` e derruba a conexão sem ele. Esse cookie só é emitido no login (`AuthController` da `delivery-api`), e **este app não tem login** — por isso o socket do indoor está morto. O destravamento está especificado em `.claude/sdd/1-indoor-api-socket-recovery/`, e o endurecimento (cookie por sessão de mesa) em `.claude/sdd/2-indoor-socket-session-token/`.

## Estrutura atual

```
pages/                        Pages Router
  _app.tsx                    Provider redux → src/App.tsx
  _document.tsx               SSR de estilos JSS + geração do manifest.json do PWA
  index.tsx                   home (ISR 60s)
  menu/index.tsx              lista de categorias (SSR)
  menu/[url].tsx              produtos de uma categoria (SSR)
  offers.tsx                  ofertas (ISR 300s)
  cart.tsx                    revisão e envio do pedido
  board.tsx                   a conta da mesa

src/
  App.tsx                     árvore de providers + hooks globais da mesa
  components/
    board/                    ~2.1k LOC — a conta da mesa e o detalhe de produto lançado
    cart/                     ~1.7k LOC — composição e envio do pedido
    products/                 listagem e detalhe do cardápio
    index/, category/, offers/, menu/
    login/                    HERANÇA DO FORK — inalcançável, não há rota /login
    appbar/, sidebar/, layout/, dialog/, modal/, loading/, nodata/, ...
  providers/
    AppProvider.ts            viewport, menu, visibilidade do carrinho
    MessageProvider.tsx       snackbar
    LocationProvider.tsx      geolocalização
    AuthProvider.tsx          HERANÇA DO FORK — login/social/jwt.verify, sem uso real
    GoogleProvider.tsx        HERANÇA DO FORK — login social
    FacebookProvider.tsx      HERANÇA DO FORK — login social
    FirebaseProvider.tsx      push; só dispara com user.id, que nunca existe aqui
  hooks/
    useFetchBoardMovement.ts  a mesa
    use-board-socket.ts       SocketStore do namespace /board
    use-board-control-socket.ts  listeners dos eventos da mesa
    use-client-socket.ts      SocketStore do namespace /client
    use-socket-events.ts      kitchen_state_changed
  store/
    socket-store.ts           orquestra as conexões socket.io
    redux/modules/            restaurant, boardMovement, cart, promotion, order, user
  services/api.tsx            instância axios
  types/                      contratos da API em TS
```

## Herança do fork — o que não pertence a este app

Este repo carrega código do `delivery-client` que **nunca executa aqui**, porque depende de login ou de entrega. Ele confunde quem lê e dá a impressão de que existe fluxo de autenticação:

| O que | Por que não pertence |
|---|---|
| `src/providers/AuthProvider.tsx` | login, logout, social login, `jwt.verify` client-side. Nenhuma tela chama |
| `src/providers/GoogleProvider.tsx`, `FacebookProvider.tsx` | login social |
| `src/components/login/` | inalcançável — não há rota `/login` em `pages/` |
| `src/store/redux/modules/user` | `state.user` nunca é populado |
| `src/providers/FirebaseProvider.tsx` | só pede token quando `user.id` existe; sem login, nunca |
| `NEXT_PUBLIC_SECRET` | usado apenas pelo `jwt.verify` do `AuthProvider` |
| dependência `jsonwebtoken` | idem |

A remoção está especificada em `.claude/sdd/1-indoor-api-socket-recovery/tasks/05-*`. Até lá, **não construa nada em cima desse código** e não trate `state.user` como fonte de identidade.

## Padrões de desenvolvimento

### Busca de dados

- **SSR/ISR** (`getStaticProps`/`getServerSideProps`): cria uma instância axios própria na página, porque `src/services/api.tsx` toca `localStorage` no interceptor e quebra no servidor. Mantenha o padrão; não importe `api` dentro de `getStaticProps`.
- **Client-side:** `import { api } from 'src/services/api'`, sempre dentro de um hook `useFetchX` em `src/hooks/` ou em `src/components/<área>/hooks/`, que despacha para o Redux. Componente não chama `api` direto.
- Erro de fetch some no `console.error` em vários hooks. Em código novo, propague estado de erro para a UI.

### Socket

- Uma instância de `SocketStore` **por namespace**, criada em **module scope** do hook (`const store = new SocketStore(...)` fora do componente). Instanciar dentro do componente abre uma conexão por render.
- O hook expõe o socket via `useSyncExternalStore`.
- Todo `socket.on(...)` dentro de `useEffect` precisa do `socket.off(...)` correspondente no cleanup — **um `off` por `on`, com o mesmo nome de evento**. Listener duplicado aqui vira produto lançado duas vezes na conta.
- Ao trocar de mesa, emitir `unsubscribe_channel` antes de `subscribe_channel` na nova.

### Componentes

- MUI **v4**: `makeStyles`/`useStyles`, `<Grid container>` com API v4, `@material-ui/icons`. Nada de `sx` ou `styled` do `@mui`.
- `if` sempre com `{}`.
- Sem `any`; `unknown` quando inevitável.
- Tipagem dos contratos da API mora em `src/types/` — se a API mudou, o tipo muda junto, no mesmo commit.
- Formatação de dinheiro sempre por `src/helpers/numberFormat`.
- Textos de UI em português, minúsculo, seguindo o que já existe (`"cardápio"`, `"nenhum produto para mostrar"`).

### Identificadores

Código, nomes de arquivo, branches e slugs de pasta SDD em **inglês**. Specs, tasks, issues, PRs e mensagens de UI em **português**.

## Fluxo de trabalho (SDD)

```
/create-spec      → .claude/sdd/<n>-<slug>/{spec.md, plan.md, tasks/}
/create-task      → .claude/sdd/<n>-<slug>/tasks/<id>-<slug>.md
/execute          → branch + worktree, implementação via indoor-agent, review
/ship             → commits atômicos, push, PR
```

`/report-bug` e `/request-feature` abrem issue no GitHub a partir de relato livre.

Specs e tasks vivas ficam em `.claude/sdd/`. Leia a `spec.md` e o `plan.md` da feature — inclusive a seção "Aprendizados que valem para as próximas tasks" — antes de executar qualquer task dela.

Features abertas hoje:

| Pasta | Issue | O que é |
|---|---|---|
| `1-indoor-api-socket-recovery` | [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1) | As três quebras em produção: cardápio de categoria, tempo real e paginação. 5 tasks especificadas |
| `2-indoor-socket-session-token` | [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2) | Endurecer a autenticação do socket. Tasks `a especificar` — seis decisões pendentes antes |

## Comandos

```bash
yarn dev                       # next dev
yarn build                     # next build  (precisa de NEXT_PUBLIC_RESTAURANT_ID/UUID no ambiente)
yarn start                     # server.js em produção
npx tsc --noEmit               # type-check
npx eslint src pages --ext .ts,.tsx
```

**O build precisa das vars de restaurante.** `.env.production` não traz `NEXT_PUBLIC_RESTAURANT_ID` nem `NEXT_PUBLIC_RESTAURANT_UUID` — em produção o provisionamento injeta. Localmente:

```bash
NEXT_PUBLIC_RESTAURANT_ID=1 \
NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad \
npx next build
```

Sem isso, `getStaticProps` e `_document` recebem 404 da API e o export falha nas 6 rotas — é falha de ambiente, não de código.

Para exercitar a mesa localmente é preciso uma movimentação aberta: `/?session=<uuid>`.

## Variáveis de ambiente

| Var | Uso |
|---|---|
| `NEXT_PUBLIC_API` | base da `delivery-api`, terminando em `/api/client/` |
| `NEXT_PUBLIC_SOCKET` | base do `delivery-socket-api-2` |
| `NEXT_PUBLIC_RESTAURANT_UUID` | valor do header `x-restaurant-id` |
| `NEXT_PUBLIC_RESTAURANT_ID` | id numérico, usado pelo header legado |
| `NEXT_PUBLIC_TOKEN_NAME` | chave de token no localStorage — herança do fork |
| `NEXT_PUBLIC_SECRET` | **a remover** — só alimenta o `jwt.verify` do `AuthProvider` |
| `NEXT_PUBLIC_LOCALSTORAGE_CART` | chave do carrinho local |
| `NEXT_PUBLIC_FIREBASE_*` | push |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Google Maps |

> **`.env.production` está versionado e o repo é público.** Toda var `NEXT_PUBLIC_*` é inlinada no bundle do browser pelo Next — ela é pública por construção, versionada ou não. Nunca coloque segredo real numa `NEXT_PUBLIC_*`, e nunca acrescente var não pública a esse arquivo.

## O que NÃO fazer

- **Não** trate `state.user` como identidade — este app não tem login
- **Não** copie código do `delivery-client` sem traduzir de MUI v6 → v4 e de App Router → Pages Router
- **Não** chame `api` (de `src/services/api.tsx`) dentro de `getStaticProps`/`getServerSideProps` — ele toca `localStorage`
- **Não** instancie `SocketStore` dentro de componente
- **Não** registre `socket.on` sem o `socket.off` correspondente no cleanup
- **Não** assuma que `products` de `/categories/{url}` é array — é `{ items, total, current_page, last_page }`
- **Não** assuma `per_page` no envelope de paginação — o campo é `current_page`
- **Não** coloque segredo em var `NEXT_PUBLIC_*`
- **Não** calcule total do carrinho em componente — é o middleware do módulo `cart`
- **Não** construa em cima de `AuthProvider`, `GoogleProvider`, `FacebookProvider` ou `src/components/login/` — são herança morta do fork
- Se o contrato real da `delivery-api` ou do `delivery-socket-api-2` divergir do que a task diz, **pare e reporte** em vez de adaptar em silêncio
