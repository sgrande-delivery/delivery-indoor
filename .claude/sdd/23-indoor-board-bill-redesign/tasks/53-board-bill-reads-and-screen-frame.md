# 01 — Leituras e tipos da conta, e a moldura de `/board`

**Issue:** [#53](https://github.com/sgrande-delivery/delivery-indoor/issues/53)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`: Next 15 App Router, MUI 9, React Query)
**Depende de:** #20 (a fundação inteira: #33 a #39)
**Status:** pendente
**Alinhado a #24 (#61) e à spec da #23 (2026-11-23):** o `BoardScreen` é tela sem dependência de rota, montada também em `/board/payment` pela #61 (mudança 7, "Quem mais monta"); e a RN-01, a tabela de contrato da spec e a skill `contratos-externos` foram corrigidas quanto ao `discount`, ao `amount` e ao `person` (sobra o `BoardTotals/README.md`).

## Objetivo

A conta ganha a camada de dados da v2 e a moldura da rota `/board`. Entram os tipos e os serviços de `GET /boardMovements/{id}/products` e `/payments`, as chaves `['board-products', id]` e `['board-payments', id]`, o tipo da movimentação ajustado ao payload restrito com `waiter_call`, os derivados puros que mais de uma task usa (falta pagar, percentual pago, contagem de pedidos e itens, hora) e a tela com skeleton, erro de rota, erro de releitura e "atualizar". As tasks 02 a 08 só acrescentam blocos sobre ela, no lugar que o "mapa de encaixe" (mudança 9) reserva para cada uma.

## Contexto

### Estado atual no código

- **A movimentação já é lida, e é ela que a conta usa.** O `BoardSessionProvider` (`src/providers/board-session/BoardSessionProvider.tsx:49`) busca `['board-movement', id]` por `useBoardMovement` (`src/hooks/use-board-movement.ts:13-19`), e em `ready` entrega `movement` como `OpenBoardMovement` (`src/providers/board-session/board-session-state.ts:52-56`). Refetch de mesa `ready` **não** volta para `loading` (`:52-54`, a `data` fica): a conta pode invalidar essa chave sem piscar skeleton. Esta task **não** cria segunda leitura da movimentação.
- **O tipo declara campos que vão sair.** `src/types/board-movement.ts:33` (`board_id`), `:10` (`board.id`) e `:50` (`admin_user`, com `BoardMovementAdminUser` em `:18-22`). Nada em `src` ou `app` lê esses campos: o único leitor da movimentação fora do provider é o chip da barra (`src/components/shell/AppShell.tsx:108`, `board.number`).
- **O serviço já normaliza o payload.** `src/services/board-movement.ts:28-37` rejeita 200 sem `is_open` booleano e corta `customer` para `{ id, name }`. É aqui que o `waiter_call` ausente vira `null`.
- **Não há rota `/board`.** `src/routes/app-routes.ts:12` declara `BOARD_ROUTE`, e a aba Conta está inerte: `isAvailable: false` em `src/components/shell/shell-tabs.ts:21`.
- **Os estados de tela da fundação estão prontos:** `useQueryScreenState` (`src/hooks/use-query-screen-state.ts:34-65`, a ordem dado → skeleton → erro), `RouteErrorState` (`src/components/error/RouteErrorState.tsx:16-25`, com `secondaryAction`, onde a 07 põe o garçom), `InlineError` (`src/components/error/InlineError.tsx:11-16`), `useIsOffline` (`src/providers/connectivity/ConnectivityProvider.tsx:57`), `formatClockTime` (`src/helpers/clock-time.ts:3-5`) e `moneyFormat` (`src/helpers/numberFormat.js:23-33`, que recebe **reais**).
- **Sem `session` a tela não monta.** O `BoardSessionGate` troca qualquer rota pela tela "sem mesa" em `no-table`, e `/board` não está em `BROWSABLE_WITHOUT_TABLE`: a RF-16 já está cumprida pela #36. Dentro da tela só chegam `loading` e `ready`.

### Contrato (inline)

Medido em `delivery-api` `origin/master` @ `8db44045e` (2026-11-23), com as specs irmãs em worktree. **Valores da mesa em float, em real.**

**`GET /boardMovements/{id}`** — `ShowBoardMovementUseCase` → `BoardMovementDetailPresenter.php:19-46`. Os campos que a conta lê: `is_open`, `pax`, `tip_pct` (int), `tip_amount`, `subtotal`, `discount` (desde `2aaf0d30d`, `:34`), `total_due` (`max(0, subtotal − discount) + tip_amount`, `BoardBillAmounts.php:28-36`), `total_paid` (Σ `value` dos pagamentos, `BoardMovementRepository::sumPayments`), `is_board_paid` (`subtotal > 0 && total_paid >= total_due`, sem tolerância, `BoardBillAmounts.php:52-56`), `opened_at`, `first_order_at`, `bill_requested_at`, `paid_at`, `freed_at` (ISO com fuso ou `null`), `board.number`, `customer: { id, name } | null`.

A lista fechada da [delivery-api#1757](https://github.com/sgrande-delivery/delivery-api/issues/1757) (spec 1753) **tira** `board_id`, `board.id`, `board.qr_code`, `admin_user`, `restaurant_id`, `admin_user_id` e `customer_id`, e a [#1647](https://github.com/sgrande-delivery/delivery-api/issues/1647) (spec 1610 emendada) **acrescenta**:

```
waiter_call: { id: uuid, created_at: string (ISO, "2026-11-23T20:12:00-03:00"), window_seconds: number } | null
```

`null` fora da janela, pela hora do servidor. O `id` e o `created_at` são os mesmos do 201 de `POST .../waiter-calls` e do evento `board.waiter_called` (07).

**`GET /boardMovements/{id}/products`** → `{ products: Item[], total, discount }` (`GetBoardMovementProductsUseCase.php:39-45`). `total` é Σ `final_price` (sem taxa), e `discount` é a mesma Σ de descontos de pedido que o GET já devolve: a conta não lê nenhum dos dois. O item é o `OrderProduct` do `findFormattedOrdersByBoardMovement` (`OrderRepository.php:378-407`) mais o `BoardMovementProductPresenter.php:21-44`:

| Campo | Tipo | Observação |
|---|---|---|
| `id` | int | `order_products.id`, chave estável da linha |
| `name` | string | |
| `amount` | float | **não é `quantity`.** Fracionário no item dividido (`SplitBoardSessionProductUseCase.php:51`: `amount / quantity`) |
| `price` | float | unitário **já com adicionais e complementos** (`master:src/store/redux/modules/cart/cases/addProduct.ts:23-33`) |
| `final_price` | float | valor da linha (`price × amount`; 0 no item de promoção) |
| `person` | `string \| null` | **uma string**, não lista. Nulo no lançamento do PDV |
| `image` | `{ id, imageUrl, imageThumbUrl, selected } \| null` | append do model (`OrderProduct.php:60`), o `Image` de `src/types/image.ts` |
| `category_kind` | `string \| null` | `CategoryKindEnum`: `comida`, `bebida`, `sobremesa`, `entrada`, `outros` |
| `observations` | `string \| null` | o `annotation` do item |
| `round` | int | `DENSE_RANK` por movimentação, 1 por padrão |
| `order_public_id` | uuid | `orders.uuid` |
| `round_status` | `'sent' \| 'preparing' \| 'ready' \| 'delivered' \| 'canceled'` | **novo**, [delivery-api#1754](https://github.com/sgrande-delivery/delivery-api/issues/1754), nunca nulo, igual em todos os itens do pedido |
| `order_created_at` | string (ISO, `"2026-11-23T22:48:09.000000Z"`) | **novo**, #1754: a hora do pedido, não a do item |
| `option_selections` | `{ option_group_item_id, option_group_id, name, quantity, unit_price, option_group_kind, option_group_name }[]` | `unit_price` é **inteiro em centavos** (`OrderProductCompositionPresenter.php:21`), no meio de um payload em real |
| `removed_ingredients` | `{ public_id, name }[]` | `public_id` é `''` no item legado (`OrderProductCompositionPresenter.php:116-119`) |

O item também traz `status` (o código cru de `orders.status`), `admin_user_name`, `split_meta`, `category` e as relações de complemento. **A conta não lê nenhum deles:** o estado é o `round_status` (RN-03 da 1752: traduzir o código é regra de domínio), e o nome do garçom é dado de funcionário.

**`GET /boardMovements/{id}/payments`** → array do model `BoardMovementPayment` com `paymentMethod` no `$with` (`BoardMovementPayment.php`), **sem `ORDER BY`** (`BoardMovementPaymentRepository.php:63-68`):

| Campo | Tipo | Observação |
|---|---|---|
| `id` | uuid | |
| `value` | float | o que soma em `total_paid` |
| `tip_amount` | float | parcela de gorjeta do pagamento; a conta não soma |
| `person` | `string \| null` | quem pagou, quando informado |
| `split_mode` | `string \| null` | |
| `created_at` | string | |
| `payment_method` | `{ id, method, kind, mode } \| null` | `method` é o nome ("Pix", "Crédito"); `kind` ∈ `money`, `pix`, `credit_card`, `picpay`, `card`, `debit_card`, `other`, `on_account`; `mode` ∈ `online`, `offline` |

As três rotas respondem 404 `internal_code: "not_found"` para movimentação inexistente ou de outra loja.

> **Divergências com textos antigos, não com contrato.** A skill `contratos-externos` dizia que `discount` não vem no GET e que `total_due` não o desconta; a spec desta feature (RN-01, tabela "Contrato consumido") dizia o mesmo e chamava o item de `quantity`; e o `design-system/components/BoardTotals/README.md` repete `total_due = subtotal + tip_amount`. Todos ficaram defasados com o `2aaf0d30d` (2026-11-19). A skill e a spec foram corrigidas em 2026-11-23 ("Decisões tomadas" da spec); o README do DS continua defasado. Vale o contrato acima.

### Requisitos cobertos

- **RF-11**: "atualizar" relê a conta.
- **RF-16**: sem `session`, inexistente ou liberada: pelo portão da #36, sem nada novo aqui.
- **RF-18**: skeleton na forma dos blocos e erro de rota da fundação com o código.
- **RN-01**: a conta é do servidor. O único derivado de dinheiro é o que falta pagar (e o percentual), num lugar só, espelhando a fórmula da API.
- **RN-05**: a tela nasce do REST.
- **RN-08**: cada tipo diz de qual rota veio; real em toda a conta, centavo só no `unit_price` da composição, que a conta não exibe.

### Decisões

1. **A moldura da rota nasce aqui, e não na 02.** O plan põe a 02, a 03, a 04 e a 05 em paralelo, cada uma num bloco. Elas só correm em paralelo se a tela, as leituras e os estados já existirem. Cada uma acrescenta uma linha no `BoardScreen`, no lugar do mapa de encaixe, e o conflito da junção é de linha vizinha, resolvido mantendo os dois lados (o mesmo arranjo do `src/App.tsx` na #20).
2. **"Falta pagar" é derivado, e só aqui.** O GET não devolve o restante. `resolveAmountDue` espelha `BoardBillAmounts::remainingWith` (`BoardBillAmounts.php:41-44`): `max(0, roundToCents(total_due − total_paid))`, com o `roundToCents` de lá (`floor(v × 100 + 0,5) / 100`, `:23-26`), que é o mesmo `Math.round(v * 100) / 100` do admin. O percentual pago é `round(total_paid / total_due × 100)`, limitado a `[0, 100]`, e 0 com `total_due` zero. A 02, a 04, a 07 e a 08 importam daqui, e nenhuma outra tela subtrai dinheiro.
3. **Campo novo do contrato entra no tipo, e a ausência é normalizada na fronteira.** `round_status` e `order_created_at` (#1754) e `waiter_call` (#1647) estão escritos e entram no tipo agora. Enquanto a API publicada não os devolve, o serviço transforma ausente (ou `round_status` fora do vocabulário) em `null`, e a tela mostra o que é verdade: cabeçalho de rodada sem selo e sem hora, botão de garçom sem estado vindo do servidor. Não há fallback por `status` cru nem pela hora do item.
4. **O cache guarda só o que o tipo declara.** `fetchBoardProducts` monta cada item com os campos da tabela, como `fetchBoardMovement` já faz com `customer`. `admin_user_name` e as relações de complemento não chegam ao cache.
5. **O erro de rota é o dos itens.** Os itens são o conteúdo principal. Falha sem dado dá `RouteErrorState`. Pagamentos são bloco secundário: a falha deles fica no bloco (05). A falha da movimentação é do portão (`BoardSessionError`).

### Armadilhas

- **Tela dentro do `AppShell`** (Aprendizados da #20): sem `<main>` e sem `100dvh`. A raiz preenche o `Scroller` com `blockSize: 100%`, o corpo rola por dentro, e a barra de ações (07) fica fora da área que rola. No celular ela fica **acima** da navegação inferior, como o rodapé da sacola (#46).
- **Ordem do React Query 5** (Aprendizados da #20): dado → skeleton → erro, pelo `useQueryScreenState`. Não testar `isError` antes de `isFetching`.
- **`refetch()` com `skipToken` rejeita.** Releitura manual só com id válido (`isBoardMovementId`).
- **`amount` é float**, `1.0` e `0.5`: o formatador é `Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })`, nunca `toString()`.
- **Duas unidades no mesmo payload de itens.** `final_price`/`price` em real, `option_selections[].unit_price` em centavos. A conta não exibe preço de opção (o design não mostra), e o tipo comenta a unidade para ninguém o somar com `final_price`.
- **`removed_ingredients[].public_id` vazio** no legado: não serve de `key` sozinho (03).
- **Pagamentos sem ordem garantida:** quem exibe ordena por `created_at` (05).
- **SSR:** no servidor e na hidratação o status da sessão é `loading`, então a tela renderiza o skeleton. Nada que dependa de relógio (contador da 02) roda no servidor.
- **API local do harness defasada:** a `.indoor-qa` sobe a API master em `501414ea4`, sem `discount` no GET (follow-up da #36). Atualizar o `api-master/` antes do roteiro, senão o desconto chega `undefined`.

## Mudanças

### 1. Tipo da movimentação ao payload restrito

`src/types/board-movement.ts` (alterado):

```diff
-export interface BoardMovementAdminUser {
-  id: number;
-  name: string;
-  color_hue: number | null;
-}
+/** `waiter_call` de `GET /boardMovements/{id}` (delivery-api#1647): a chamada em aberto na janela, pela hora do servidor. */
+export interface BoardWaiterCall {
+  id: string;
+  created_at: string;
+  window_seconds: number;
+}

 export interface BoardMovementBoard {
-  id: string;
   number: string;
 …
 export interface BoardMovementDetail {
   id: string;
-  board_id: string;
   restaurant_uuid: string;
 …
-  admin_user: BoardMovementAdminUser | null;
+  waiter_call: BoardWaiterCall | null;
   customer: BoardMovementCustomer | null;
   board: BoardMovementBoard | null;
 }
```

O resto do tipo fica como está. Os demais campos da lista fechada da #1757 (`board.description`, `board.delivery_location_required`) não entram porque ninguém os lê.

### 2. `waiter_call` normalizado no serviço

`src/services/board-movement.ts:28-37` (alterado). `waiter_call` que não for objeto com `id` e `created_at` string e `window_seconds` número vira `null`, e o objeto válido é recortado para essas três chaves. Um guard puro `isBoardWaiterCall(value: unknown): value is BoardWaiterCall`, no mesmo arquivo.

### 3. Tipos da conta

`src/types/board-bill.ts` (novo), com o comentário de rota em cada tipo:

```ts
/** `round_status` do item (delivery-api#1754, `BoardRoundStatusEnum`). */
export type BoardRoundStatus = 'sent' | 'preparing' | 'ready' | 'delivered' | 'canceled';

export interface BoardOptionSelection {
  option_group_item_id: number | null;
  option_group_id: number | null;
  name: string;
  quantity: number;
  /** Centavos inteiros (`Money::getValue()`), ao contrário do resto do payload. A conta não o exibe nem soma. */
  unit_price: number;
  option_group_kind: string | null;
  option_group_name: string | null;
}

export interface BoardRemovedIngredient {
  /** Vazio no item legado: não é chave única. */
  public_id: string;
  name: string;
}

/** Item de `GET /boardMovements/{id}/products` (`BoardMovementProductPresenter`). Dinheiro em real (float). */
export interface BoardProductItem {
  id: number;
  name: string;
  /** Float; fracionário no item dividido. */
  amount: number;
  /** Unitário, já com adicionais e complementos. */
  price: number;
  final_price: number;
  person: string | null;
  image: Image | null;
  category_kind: string | null;
  observations: string | null;
  round: number;
  order_public_id: string;
  /** `null` enquanto a api publicada não traz o campo, ou com valor fora do vocabulário. */
  round_status: BoardRoundStatus | null;
  /** `null` enquanto a api publicada não traz o campo. */
  order_created_at: string | null;
  option_selections: BoardOptionSelection[];
  removed_ingredients: BoardRemovedIngredient[];
}

export interface BoardProducts {
  products: BoardProductItem[];
}

/** `payment_method` de `GET /boardMovements/{id}/payments`. */
export interface BoardPaymentMethod {
  id: number;
  method: string;
  kind: string;
  mode: string;
}

/** Item de `GET /boardMovements/{id}/payments` (model `BoardMovementPayment`). Dinheiro em real (float). */
export interface BoardPayment {
  id: string;
  value: number;
  person: string | null;
  created_at: string;
  payment_method: BoardPaymentMethod | null;
}
```

`kind` e `category_kind` ficam `string`: quem escolhe ícone por eles usa mapa explícito com padrão (03 e 05), nunca cast para `IconName`.

### 4. Serviços

`src/services/board-bill.ts` (novo). O modelo é `src/services/board-movement.ts`:

- `boardProductsQueryKey(id)` → `['board-products', id]` e `boardPaymentsQueryKey(id)` → `['board-payments', id]`, exportadas, `readonly`. São as chaves que o socket (06), a sacola (#48) e o pagamento (#24) invalidam.
- `fetchBoardProducts(id)` → `api.get<unknown>(`/boardMovements/${encodeURIComponent(id)}/products`)`. Rejeita resposta sem `products` array com `InvalidBoardBillResponseError` (mesmo desenho do `InvalidBoardMovementResponseError`), e monta cada item com os campos do tipo (decisão 4). `round_status` passa por `isBoardRoundStatus`; ausente ou desconhecido vira `null`. `order_created_at` não string vira `null`. `option_selections` e `removed_ingredients` ausentes viram `[]`.
- `fetchBoardPayments(id)` → `/payments`, rejeita o que não for array e recorta cada pagamento para o tipo.
- `isBoardRoundStatus(value: unknown): value is BoardRoundStatus`, exportado (a 03 e a #48 não o reescrevem).

### 5. Hooks de leitura

`src/hooks/use-board-products.ts` e `src/hooks/use-board-payments.ts` (novos), no molde de `src/hooks/use-board-movement.ts:13-19`: `queryFn` com `skipToken` sem id válido, `retry` que não repete `isBoardMovementNotFound`. Os dois devolvem o `UseQueryResult`, e a interpretação fica na tela.

`src/hooks/use-refresh-board-bill.ts` (novo): `useRefreshBoardBill(movementId)` → `{ refresh: () => Promise<void>; isRefreshing: boolean }`. `refresh` invalida as três chaves (`boardMovementQueryKey`, `boardProductsQueryKey`, `boardPaymentsQueryKey`) num `Promise.all` e resolve quando as três releituras terminam. `isRefreshing` é estado do próprio hook, e não `isFetching` das queries, para o botão não girar quando quem relê é o socket.

### 6. Derivados puros

Todos sem import de React nem de MUI, para rodar no `jiti`/`node` sem DOM, como na #36:

- **`src/components/board/bill-amounts.ts`** (novo): `resolveAmountDue(movement)` e `resolvePaidPercent(movement)`, pela decisão 2, com o `roundToCents` local e o comentário apontando `BoardBillAmounts.php`.
- **`src/components/board/board-summary.ts`** (novo):
  - `summarizeBoardProducts(products) → { orderCount, itemCount }`: `orderCount` são os `order_public_id` distintos, e `itemCount` é Σ `amount` (o "7 itens" do design soma `2× Classic Smash` como dois).
  - `describeOrderCount(n)` ("1 pedido", "2 pedidos"), `describeItemCount(n)` ("1 item", "7 itens", com o formatador de quantidade) e `describeBoardCount(summary)` ("2 pedidos · 7 itens"). A 03 usa no cabeçalho dos itens, e a 04 no subtotal pago.
- **`src/components/board/board-time.ts`** (novo):
  - `parseBoardTimestamp(iso: string | null): number | null`, que devolve `null` para `NaN`;
  - `formatBoardClock(iso, now: Date)`: "19:48" no dia corrente (local do aparelho), e "22/11 19:48" em outro dia. A hora sai de `formatClockTime`;
  - `formatBoardMoment(iso, now)`: "hoje às 20:05" ou "22/11 às 20:05", o formato do `BoardPaymentRow/README.md` ("mesa aberta ontem acontece").

### 7. Rota e tela

- **`app/board/page.tsx`** (novo): server component que renderiza `<BoardScreen />`. Sem `generateMetadata` com dado de API (não há boot de servidor, #20).
- **Quem mais monta o `BoardScreen`:** a #61 (feature #24) o monta em `app/board/payment/page.tsx`, atrás do `Sheet` de pagamento no tablet em pé e como a própria tela no tablet deitado. Por isso o `BoardScreen` não lê rota, `pathname` nem `searchParams`: a mesa vem do `useBoardSession()`, e as chaves que a #24 relê são as exportadas pela mudança 4 (`boardProductsQueryKey`, `boardPaymentsQueryKey`) e o `boardMovementQueryKey` de `src/services/board-movement.ts`. Nada nesta task depende de estar em `/board`.
- **`src/components/board/BoardScreen.tsx`** (novo, `'use client'`):
  1. `useBoardSession()`. Fora de `ready`, `<BoardScreenSkeleton />` (o portão só deixa chegar `loading` e `ready`).
  2. `useBoardProducts(sessionId)`, `useBoardPayments(sessionId)`, `useBoardMovement(sessionId)` (a mesma chave do provider: é um segundo observador, sem requisição a mais, só para ler `isRefetchError`) e `useRefreshBoardBill(sessionId)`.
  3. `useQueryScreenState(products)`:
     - `skeleton` → `<BoardScreenSkeleton />`;
     - `error` → `<RouteErrorState>` com a copy do artboard `Estado · erro de rota`, literal: título "Não conseguimos carregar a conta" e descrição "A mesa continua aberta e nada foi perdido. Verifique a conexão e tente de novo — ou chame o garçom, que ele vê a conta no caixa.". O `secondaryAction` fica para a 07;
     - `content` → a moldura do item 4.
  4. **Moldura:** `Root` (`styled('div')`, coluna, `blockSize: '100%'`), `BoardHeader`, `Body` (`flex: 1`, `minBlockSize: 0`, `overflowY: 'auto'`, padding e gap do `board-metrics.ts`) e o lugar da barra de ações embaixo, fora do `Body`.
  5. **Releitura que falhou com conteúdo:** `InlineError` no topo do `Body`, "Não foi possível atualizar a conta.", com retry em `refresh` e `isRetrying={isRefreshing}`, quando `screen.isRefreshFailed` ou a movimentação tem `isRefetchError` e não está offline. A copy é **derivada**; confirmar com o dev.
- **`src/components/board/BoardHeader.tsx`** (novo), o cabeçalho de `Conta · celular · em aberto`:
  - voltar: `Link` para `HOME_ROUTE` com `arrow_back`, alvo de 44. Não é `router.back()`: a entrada é o redirect do QR, e o histórico pode sair do app (mesma decisão do `CartHeader` da #46);
  - título "Conta da mesa" em `typographyTokens.h3` e a linha "{restaurante} · Mesa {número}" em `caption`/`muted`, com o nome por `useRestaurant()`. Sem nome carregado, só "Mesa {número}";
  - "Atualizar" (RF-11): `IconButton` `md` (44, acima dos 36 do artboard) com `refresh` e `aria-label` "Atualizar a conta". Desabilitado e com `aria-busy` enquanto `isRefreshing`, sem skeleton;
  - escondido sob `tabletShellMediaQuery`: no tablet a `TableTopBar` é o cabeçalho, e o "atualizar" do tablet é da 08.
- **`src/components/board/BoardScreenSkeleton.tsx`** (novo): o skeleton do celular, na forma e na altura dos blocos do artboard `Conta · celular · em aberto`: o card de destaque (chip, valor de 34, barra, rodapé), o card de itens (título, um cabeçalho de rodada com selo e três linhas de 44) e o card de pagamentos (uma linha de 40). Só `Skeleton` do DS. A forma do tablet (artboard `Estado · carregando`) é da 08.
- **`src/components/board/board-copy.ts`** e **`src/components/board/board-metrics.ts`** (novos): a copy e as medidas próprias da conta (padding 18, gap 12, raio 20 dos cards), fora de `src/theme/`. Sem hex.

### 8. Aba Conta

`src/components/shell/shell-tabs.ts:21` (alterado): `isAvailable: true` em `board`. A #46 liga a linha `:20` (`cart`) e a #44 a `:19` (`search`), em paralelo. O conflito da junção é de linha vizinha, resolvido mantendo as três.

### 9. Mapa de encaixe do `BoardScreen`

O `content` desta task tem só o `BoardHeader`, o `InlineError` e o `Body` vazio. As outras tasks acrescentam, **nesta ordem e neste lugar**, e o conflito na junção se resolve mantendo os dois lados como abaixo:

```tsx
<Root>
  <BoardHeader … />                                                      {/* 01 */}
  <Body>
    {refreshFailed && <InlineError … />}                                 {/* 01 */}
    {movement.is_board_paid ? (                                          /* 05 */
      <>
        <BoardBillCard movement={movement} />                            {/* 02 */}
        <BoardPaymentsCard query={payments} tone="ink" />                {/* 05 */}
        <BoardTotals movement={movement} variant="paid" appearance="card" itemCount={summary.itemCount} /> {/* 04, posto pela 05 */}
      </>
    ) : (
      <>
        <BoardBillCard movement={movement} action={<RequestBillAction movement={movement} />} /> {/* 02; action pela 07 */}
        <OfflineDimmed>                                                  {/* 06 */}
          <BoardItemsCard products={products.data.products} footer={<BoardTotals movement={movement} appearance="footer" />} /> {/* 03; footer pela 04 */}
          <BoardPaymentsCard query={payments} />                         {/* 05 */}
        </OfflineDimmed>
      </>
    )}
  </Body>
  {!movement.is_board_paid && <BoardActionBar movement={movement} />}    {/* 07 */}
</Root>
```

O `secondaryAction` do erro de rota é da 07, e a linha do banner offline (`useBoardOfflineLine`) é da 06. A recomposição em duas colunas e em coluna com barra fixa é da 08, sobre esta árvore.

## Testes

Não há suíte automatizada. A verificação é manual e reprodutível.

**Estáticos:**

1. `npx next typegen` numa árvore limpa, depois `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` concluindo, com `/board` na lista de rotas e sem erro de prerender por `window` ou `sessionStorage`.
4. `grep -rn "board_id\|admin_user\|\.status\b" src/types/board-movement.ts src/types/board-bill.ts src/services/board-bill.ts` não encontra leitura de `board_id`, `admin_user` nem do `status` cru.
5. `grep -rn "console.error\|toFixed\|\* 100" src/components/board src/services/board-bill.ts src/hooks/use-board-*.ts`: só o `* 100` do `roundToCents` e do percentual em `bill-amounts.ts`.
6. **Derivados**, por `jiti` contra os módulos puros:
   - `resolveAmountDue({ total_due: 155.43, total_paid: 60 })` → `95.43`; `{ total_due: 10, total_paid: 12 }` → `0`; `{ total_due: 0.3, total_paid: 0.1 }` → `0.2`;
   - `resolvePaidPercent` → `39`, `100` e `0` com `total_due: 0`;
   - `summarizeBoardProducts` sobre a mesa do design (cinco linhas, `amount` 1, 1, 2, 1, 2, dois pedidos) → `{ orderCount: 2, itemCount: 7 }`, e `describeBoardCount` → "2 pedidos · 7 itens";
   - `formatBoardClock` com `now` no mesmo dia → "19:48", e com `now` no dia seguinte → "22/11 19:48".

**No navegador** (harness `.indoor-qa`, API master em `:8093` atualizada para `origin/master`, `next dev` com `NEXT_PUBLIC_API=http://localhost:8093/api/client/`; restaurante 1, mesa aberta `c10e064f-…`, fechada `0eb6af6a-…`). DevTools: Network filtrada por `boardMovements`.

1. `http://localhost:3000/board?session=<aberta>` a 390 × 844. **Observar:** skeleton e depois a moldura com "Conta da mesa" e "{loja} · Mesa {n}"; **uma** requisição para cada rota (a movimentação é a do provider, sem segunda leitura); a aba Conta acesa na navegação inferior.
2. Na resposta de `/products`, conferir que o cache (React Query, ou `console` com `queryClient.getQueryData(['board-products', id])`) não tem `admin_user_name` nem `status`, e que `round_status` é `null` na API que ainda não tem a #1754.
3. Request blocking em `*/boardMovements/*/products*` e recarregar. **Observar:** "Não conseguimos carregar a conta" com `Código erro de rede` (tela cheia a 390, `Sheet` a 820, painel a 1180), "Tentar novamente" volta ao skeleton. Tirar o bloqueio e tentar: a moldura volta.
4. Request blocking só em `*/payments*`. **Observar:** a tela **não** vai para erro.
5. Com conteúdo, tocar "Atualizar". **Observar:** três requisições, o botão desabilitado durante, nenhum skeleton.
6. Com conteúdo, bloquear `*/boardMovements/*` e tocar "Atualizar". **Observar:** o `InlineError` "Não foi possível atualizar a conta." no topo, com a conta ainda na tela.
7. Aba nova sem `?session`, `http://localhost:3000/board`. **Observar:** a tela "sem mesa" da #36, sem requisição de itens nem de pagamentos.
8. A 1180 × 820, a aba Conta acesa na `TableTopBar`, e o cabeçalho do celular não aparece.

## Critérios de aceitação

- [ ] `src/types/board-bill.ts` declara `BoardProductItem` com `amount` (não `quantity`), `round_status: BoardRoundStatus | null`, `order_created_at: string | null`, e `BoardPayment` com `value` e `payment_method`; o `unit_price` da composição diz que é centavo.
- [ ] `BoardMovementDetail` não tem `board_id`, `board.id` nem `admin_user`, e tem `waiter_call: BoardWaiterCall | null`; sem o campo na resposta, o cache guarda `null`.
- [ ] `boardProductsQueryKey` e `boardPaymentsQueryKey` são exportadas de `src/services/board-bill.ts` com os valores `['board-products', id]` e `['board-payments', id]`.
- [ ] `/board?session=<aberta>` faz uma requisição a `/products` e uma a `/payments`, e nenhuma segunda à movimentação.
- [ ] Falha dos itens sem dado mostra o erro de rota da fundação com a copy literal do artboard e o código; falha só dos pagamentos não derruba a tela.
- [ ] "Atualizar" relê as três chaves sem skeleton, com o botão desabilitado durante; falha com conteúdo mostra o `InlineError`.
- [ ] `resolveAmountDue` e `resolvePaidPercent` dão os valores do roteiro, e nenhum outro arquivo de `src/components/board/` subtrai dinheiro.
- [ ] A aba Conta está disponível no celular e no tablet.
- [ ] Nenhum arquivo de `src/theme/` ou `src/components/ui/` é alterado; sem hex, sem `<main>`, sem `100dvh` nos arquivos novos.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` com as vars de restaurante passam.

## Fora de escopo

- Os blocos: card de destaque (02), itens por rodada (03), resumo (04), pagamentos e conta paga (05). Esta task não renderiza nenhum dado da conta além do cabeçalho.
- Socket, invalidação por evento e banner offline da conta: 06.
- Ações (garçom, pedir a conta, pedir mais, pagar) e o `secondaryAction` do erro: 07.
- Duas colunas, barra fixa do tablet em pé, skeleton e "atualizar" do tablet: 08.
- Corrigir o `BoardTotals/README.md` quanto ao desconto: follow-up de doc. A skill `contratos-externos`, a RN-01 e a tabela de contrato da spec já foram corrigidas em 2026-11-23.
- Ler o `status` cru, `admin_user_name`, `split_meta` ou o `total` de `/products`.
- A tela de detalhe do item lançado (decisão pendente 5 da spec): o design não a prevê, e a 03 decide se a composição cabe na linha.

## Branch

`task/53-board-bill-reads-and-screen-frame`, base sugerida: `feat/indoor-v2` depois que a fila da #20 mergear nela (hoje a ponta é `task/39-remove-fork-inheritance`; se ainda não tiver mergeado, cortar dela). É a base da 02, da 03, da 04 e da 06.
