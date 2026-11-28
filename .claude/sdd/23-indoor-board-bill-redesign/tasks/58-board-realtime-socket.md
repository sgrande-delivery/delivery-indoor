# 06 — Tempo real da conta pelo socket `/board`

**Issue:** [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 01 (#53)
**Status:** shipped
**Alinhado a #24 (#61, #63) e à #52 (2026-11-23):** o mapa evento → chaves ganha a tradução de cada grupo para as chaves do React Query num módulo só, exportado, onde a #61 acrescenta `payment-options` e de onde a #63 lê as chaves da conta (mudança 3); a decisão 6 passa a ter o contrato de quem consome o `useBoardSocket()` fora daqui; e a #52 encontra os nomes de hook que esta task cria.

## Objetivo

A conta passa a se atualizar sozinha enquanto o garçom lança no PDV. Um `SocketStore` do namespace `/board`, em module scope, fica conectado enquanto há mesa. Ele entra na sala da movimentação por `subscribe_channel` e reemite a inscrição a cada `connect`. A cada evento da sala, **invalida** as chaves da 01 em vez de aplicar delta. A reconexão relê o REST, a queda causada pelo servidor não vira "sem internet", e a conta registra a sua linha no banner offline. É o hook em que a [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) (feature #2) liga a credencial de sessão de mesa.

## Contexto

### Estado atual

- **O `SocketStore` existe, e nenhuma instância.** `src/store/socket-store.ts` é o porte da v1, parametrizado por `(url, namespace, app)` (`:23-27`). Pontos que importam:
  - `connect(id)` grava `auth: { 'x-restaurant-uuid': id }` (`:88-92`) e **retorna cedo se já há socket** (`:41-43`), então trocar de sessão exige `disconnect()` antes;
  - transporte `['websocket']` e `query.app` (`:51-59`);
  - os listeners internos de `connect`/`disconnect` (`:61-77`), que um `off('connect')` cego derrubaria;
  - `getSnapshot`/`subscribe` para `useSyncExternalStore` (`:100-107`).

  `git grep SocketStore -- src app` só acha a classe.
- **A v1 mostra o que não repetir** (`master:src/hooks/use-board-control-socket.ts`):
  - `subscribe_channel` só no efeito, e não no `connect` (a sala some na reconexão);
  - `off` cego, e `board_products_added` desligado duas vezes (o `board_payment_added` nunca);
  - reducers que aplicam delta.
- **O padrão a portar está no `delivery-client`** (`feat/app-v2@ceed49a9`):
  - `src/hooks/use-client-socket.ts`: o store em module scope e o `useSyncExternalStore`;
  - `src/components/order/use-order-status-socket.ts`: `subscribe` no `connect`, `off` com a mesma referência, "o evento é gatilho, não fonte", a chave lida por ref;
  - `src/hooks/use-socket-events.tsx`: reler a API só no `connect` que vem depois de um `disconnect`.
- **A conectividade espera o dono do socket.** O `ConnectivityProvider` expõe `reportConnectionLost()` (`src/providers/connectivity/ConnectivityProvider.tsx:35,206`) e `useOfflineBannerMessage()` (`:62-76`), e relê as queries ativas quando a rede volta (`:158`). A #38 deixou a chamada no `disconnect` para "quem for dono de um socket".
- **A movimentação é a chave do provider.** Invalidar `boardMovementQueryKey(id)` relê o `GET /boardMovements/{id}` do `BoardSessionProvider`. Em `ready` com refetch a tela não pisca (`board-session-state.ts:52-54`), e se a mesa fechou o portão troca para "sem mesa" sozinho.
- Variáveis: `NEXT_PUBLIC_SOCKET` (`.env.production:2`), `NEXT_PUBLIC_RESTAURANT_UUID` (a mesma do `x-restaurant-id`, `src/services/restaurant-header.ts:9-11`) e `SOCKET_APP = 'indoor'` (`src/constants/constants.ts:1`).

### Contrato (inline)

Namespace `/board` do `delivery-socket-api` (`origin/master` @ `efd671e`). Conexão anônima do indoor: `query.app=indoor` e `auth['x-restaurant-uuid']` UUID, senão o gateway desconecta logo depois do `connect` (`board.gateway.ts:34-53`). Sala da movimentação por `subscribe_channel` com o UUID da movimentação (`:77-93`). O evento de ack **não** confirma a inscrição (rule `socket-da-mesa`). A sala da loja não é alcançável pelo anônimo, e não se tenta. Não há replay.

| Evento | Origem | Payload (não lido) | Chaves invalidadas |
|---|---|---|---|
| `board_products_added` | hoje | itens do pedido | `board-products`, `board-movement` |
| `board_product_deleted` | hoje | `{ order_product_id, board_movement_id }` | `board-products`, `board-movement` |
| `board_payment_added` | hoje | o pagamento | `board-payments`, `board-movement` |
| `board_payment_deleted` | hoje | `{ paymentId }` | `board-payments`, `board-movement` |
| `board_totals_changed` | hoje | totais | `board-movement`, `board-products` |
| `board.order_status_changed` | [delivery-socket-api#75](https://github.com/sgrande-delivery/delivery-socket-api/issues/75) (rota `POST /board-sessions/:id/order-status-changed`, emissor [delivery-api#1756](https://github.com/sgrande-delivery/delivery-api/issues/1756)) | `{ board_movement_id, restaurant_uuid, order_public_id, status, round_status, changed_at }` | `board-products` |
| `board.waiter_called` | [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65) revisada (emissor delivery-api#1648) | `{ id, board_movement_id, board_number, restaurant_uuid, created_at, window_seconds }` | `board-movement` |
| `board.bill_requested` | #65 revisada (emissor #1648; cliente **e** PDV, só na primeira vez) | `{ board_movement_id, bill_requested_at, restaurant_uuid }` | `board-movement` |

E as três reações de conexão:

| Situação | Reação |
|---|---|
| `connect` | `emit('subscribe_channel', sessionId)`; se veio depois de um `disconnect`, invalida as três chaves (RN-05) |
| `disconnect` com `reason === 'io server disconnect'` | **não** é internet: não chama `reportConnectionLost`, e invalida `board-movement` (a mesa pode ter fechado, e é a queda que a #77 e a #78 da feature #2 produzem). O socket.io não reconecta depois desse motivo, e o hook não força: a conta segue pelo REST |
| `disconnect` com `ping timeout`, `transport close` ou `transport error` | `reportConnectionLost()` (o probe decide se é a internet); o socket.io reconecta sozinho |

O `board.order_status_changed` vem em rajada no fechamento da mesa (N pedidos, N eventos). O consumidor coalesce com debounce de borda final, e **não** usa `cancelRefetch: false` (#75, "O que o consumidor faz").

### Requisitos cobertos

- **RF-09**: a tela muda sem reload quando o PDV lança item, remove item, registra pagamento ou altera o total.
- **RF-10**: ao reconectar, a inscrição é reemitida e a conta é relida.
- **RN-02**: nenhum evento é tratado como "o total mudou". Todo evento que mexe em dinheiro relê a movimentação.
- **RN-03**: um `on` e um `off` por evento, com a mesma referência.
- **RN-04**: `subscribe_channel` no `connect`, e `off('connect', handler)` pela referência.
- **RN-05**: a tela nasce do REST, e o socket só dispara releitura.

### Decisões

1. **O socket vive na raiz, e não na tela da conta.** O estado de garçom e de conta pedida aparece na `TableTopBar` em toda rota do tablet (07), e "quem chamou num aparelho precisa aparecer nos outros" (README do `WaiterCallButton`). Um componente `BoardRealtime`, que renderiza `null`, é montado uma vez em `src/App.tsx`, dentro do `BoardSessionProvider`. Invalidar uma query inativa (os itens fora de `/board`) só a marca como velha, e ela é relida quando a tela monta.
2. **Uma conexão por sessão de mesa.** A conexão existe só com `status === 'ready'`. Mudar de `sessionId` (outro QR, `retry` que relê a entrada) é `disconnect()` seguido de `connect()`: o `connect` do store retorna cedo com socket (`:41-43`), e a #52 precisa do handshake novo para levar a credencial da sessão nova. Como a sala é por conexão, a conexão nova não herda a sala antiga, e por isso o `unsubscribe_channel` da rule (escrito para quando a conexão é a mesma) não é emitido. Sair de `ready` desconecta.
3. **Um handler por evento, e todos só invalidam.** O mapa evento → chaves é a tabela acima, num módulo só, e o hook registra um `on` e um `off` por linha, com a mesma referência. Nenhum handler lê o payload. O `board_movement_id` do corpo não é usado: a chave sai do `sessionId` do próprio app (#75).
4. **Toda invalidação passa por um coalescedor de 250 ms, de borda final.** Ele junta as chaves de vários eventos (a rajada do fechamento, um lançamento com `board_products_added` e `board_totals_changed`) e as invalida uma vez por janela. É o debounce que a #75 pede, aplicado a todos os eventos para a regra ser uma. A janela curta deixa o atraso imperceptível. O `cancel()` do coalescedor roda no cleanup, e ele nunca dispara depois de o socket ter sido trocado.
5. **Os eventos de garçom e de conta pedida são registrados aqui, e não na 07.** A #65 aponta a "task 07" como consumidora. Aqui o consumo é só invalidar a movimentação, e manter todos os `on`/`off` do `/board` num hook evita um segundo dono do mesmo socket. A 07 lê o resultado (`waiter_call`, `bill_requested_at`) da movimentação.
6. **O socket é exposto, a conexão não.** `useBoardSocket()` devolve o snapshot (`{ socket, isConnected }`) por `useSyncExternalStore`, para outro consumidor registrar o próprio listener com `on`/`off` (o `board.charge_updated` da #24, por exemplo). Só o `BoardRealtime` chama `connect`/`disconnect`, e nenhum outro arquivo instancia `SocketStore` para o `/board`. O contrato de quem consome, que é o que a #63 (`useBoardChargeEvents`, no provider do pagamento, na raiz) segue:
   - **A inscrição é daqui e vale em toda rota.** O `BoardRealtime` mantém a sala da movimentação enquanto a sessão está `ready`, no cardápio inclusive, e reemite o `subscribe_channel` a cada `connect`. O consumidor **não** emite `subscribe_channel`/`unsubscribe_channel` e não chama `connect`/`disconnect`.
   - **`socket` pode ser `null`** (sem mesa, ou fora de `ready`): o efeito do consumidor retorna cedo.
   - **A instância muda com a sessão** (decisão 2): o consumidor põe o `socket` do snapshot nas dependências do efeito, e não o guarda em ref.
   - **Para reagir à reconexão**, o consumidor registra o próprio `connect`, com `off('connect', handler)` pela referência. A ordem entre o `connect` daqui e o dele não é garantida: o handler dele só faz leitura REST, e não conta com a sala já reinscrita.
   - **Um `on` e um `off` pela referência**, por evento, e nenhum evento desta tabela registrado de novo fora daqui. O consumidor que precisa reler a conta usa `resolveBoardBillQueryKeys` (mudança 3), e não monta a lista de chaves por conta própria.
7. **A linha do banner offline é da conta.** Com a tela da conta montada e offline, o banner diz "Esta é a conta de {HH:mm}. Novos lançamentos do garçom aparecem quando a internet voltar." (artboard `Estado · offline`, literal, e a tabela de copy da #38), com o `dataUpdatedAt` dos itens por `formatClockTime`. A lista de itens e a de pagamentos esmaecem (opacidade 0,72 do artboard), e o card de destaque e as ações não. O esmaecimento é decisão da tela (#38).

### Pontos de encaixe da #52 (credencial de sessão de mesa)

A [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) depende desta task e liga o token sem reescrevê-la. Ela encontra:

- a conexão num lugar só (`useBoardSocketConnection`, em `src/hooks/use-board-socket.ts`), com a identidade da conexão explícita (`restaurantUuid`, a constante de `src/services/restaurant-header.ts` da mudança 1, + `sessionId`). A #52 acrescenta o `sessionToken` do `useBoardSession()` a essa identidade (`useBoardSocketConnection(restaurantUuid, sessionId, sessionToken)`, chamado pelo `use-board-realtime.ts`) e passa `store.connect(restaurantUuid, sessionToken)` (a mudança 5 dela, no `SocketStore`);
- a troca de sessão já como conexão nova (decisão 2);
- o `io server disconnect` já separado da queda de rede no `handleDisconnect` de `use-board-realtime.ts`, sem `reportConnectionLost`, relendo a movimentação. A #52 acrescenta o log `board_session_token=present|absent`, sem o valor.

Esta task **não** lê `#board_session_token`, não muda o `SocketStore` e não manda credencial.

### Armadilhas

- **StrictMode em dev** roda os efeitos duas vezes: `connect` → `disconnect` → `connect`. O store aguenta (o `disconnect` zera o socket), e o critério de "um `subscribe_channel` por conexão" se confere em build de produção ou contando por conexão, e não por montagem.
- **Recusa é silenciosa** (rule `socket-da-mesa`): `connect` seguido de `disconnect` imediato. Antes de suspeitar dos listeners, olhar o `isConnected` do snapshot e o log do gateway.
- **`invalidateQueries` cancela e recomeça a leitura em voo** (`cancelRefetch: true`, o default). É o comportamento certo (#75). Não passar `cancelRefetch: false`.
- **A chave entra por ref, não por dependência**, se algum handler precisar de valor que muda a cada render (o caso da chave do client). Aqui as chaves dependem só do `sessionId`, que já é dependência do efeito.
- **Offline não é socket caído.** Com a rede fora, o socket cai com `transport close`, o provider marca offline pelo probe, e quando a rede volta ele relê as queries ativas (`ConnectivityProvider.tsx:158`) **e** o socket reconecta e relê as três chaves. São duas releituras seguidas, aceitas: a do provider pode ter acontecido antes da reinscrição, e só a segunda cobre o intervalo sem sala.

## Mudanças

### 1. O UUID do restaurante num lugar só

`src/services/restaurant-header.ts` (alterado): `export const restaurantUuid = process.env.NEXT_PUBLIC_RESTAURANT_UUID;`, e `restaurantHeaders` passa a usá-lo. O socket e o header do tenant leem a mesma constante, e o socket não espera o `GET /restaurants`.

### 2. O socket

`src/hooks/use-board-socket.ts` (novo), no molde de `use-client-socket.ts` @ `ceed49a9`, sem contador de consumidores (a conexão tem um dono só, decisão 6):

```ts
const store = new SocketStore(process.env.NEXT_PUBLIC_SOCKET ?? '', 'board', SOCKET_APP);

export function useBoardSocket(): SocketSnapshot; // useSyncExternalStore
export function useBoardSocketConnection(restaurantUuid: string | undefined, sessionId: string | null): void;
```

`useBoardSocketConnection` conecta quando os dois existem, desconecta no cleanup e quando um deles muda (decisão 2). `SocketSnapshot` é exportado do `socket-store.ts` (hoje é `type` local, `:3-6`).

### 3. Os eventos e o coalescedor

- `src/components/board/realtime/board-socket-events.ts` (novo): os nomes da tabela como constantes, e `BOARD_EVENT_INVALIDATIONS: Record<BoardSocketEvent, readonly BoardBillKey[]>`, com `BoardBillKey = 'movement' | 'products' | 'payments'`.
- `src/components/board/realtime/board-bill-keys.ts` (novo), **a lista única** de chaves da conta, exportada:

  ```ts
  type BoardBillQueryKeyBuilder = (movementId: string) => QueryKey;

  /** Cada grupo e as chaves que ele relê. `movement` é o dinheiro da movimentação: quem deriva dele entra aqui. */
  export const BOARD_BILL_QUERY_KEYS: Record<BoardBillKey, readonly BoardBillQueryKeyBuilder[]> = {
    movement: [boardMovementQueryKey],
    products: [boardProductsQueryKey],
    payments: [boardPaymentsQueryKey],
  };

  export const ALL_BOARD_BILL_KEYS: readonly BoardBillKey[] = ['movement', 'products', 'payments'];

  export function resolveBoardBillQueryKeys(movementId: string, groups: Iterable<BoardBillKey>): QueryKey[];
  ```

  O `flush` do coalescedor chama `resolveBoardBillQueryKeys`, e mais nenhum arquivo desta task monta chave. A #61 acrescenta `boardPaymentOptionsQueryKey` ao grupo `movement`, numa linha: o `amount_due` e o `amount_paid` de `payment-options` são o `total_due` e o `total_paid` da movimentação, e mudam nos mesmos eventos (e na reconexão, que relê os três grupos). A #63 relê a conta, no desfecho de uma cobrança, com `resolveBoardBillQueryKeys(id, ALL_BOARD_BILL_KEYS)`.
- `src/components/board/realtime/invalidation-batcher.ts` (novo): `createInvalidationBatcher(flush: (keys: ReadonlySet<BoardBillKey>) => void, delayMs: number)` → `{ schedule(keys), cancel() }`. Puro, com `setTimeout`, sem React, para testar no `node`.

### 4. O hook da conta ao vivo

`src/components/board/realtime/use-board-realtime.ts` (novo). Lê `useBoardSession()`, `useQueryClient()`, `useConnectivity().reportConnectionLost` e `useBoardSocket()`, e chama `useBoardSocketConnection(restaurantUuid, ready ? sessionId : null)`. Num efeito com `[socket, sessionId, queryClient, reportConnectionLost]`:

- cria o coalescedor, cujo `flush` traduz os grupos em chaves por `resolveBoardBillQueryKeys(sessionId, keys)` e chama `invalidateQueries` para cada uma;
- `handleConnect`: `emit('subscribe_channel', sessionId)`; se `hasDisconnected`, agenda as três chaves e zera a marca;
- `handleDisconnect(reason)`: marca `hasDisconnected`; `io server disconnect` agenda `movement`; `io client disconnect` não faz nada; os outros motivos chamam `reportConnectionLost()`;
- um handler por evento da tabela, cada um `() => batcher.schedule(BOARD_EVENT_INVALIDATIONS[evento])`;
- se `socket.connected` já for verdade, chama `handleConnect` na hora (a inscrição não pode esperar o próximo `connect`);
- cleanup: `off` de cada um com a mesma referência, `off('connect', handleConnect)`, `off('disconnect', handleDisconnect)` e `batcher.cancel()`.

`src/components/board/realtime/BoardRealtime.tsx` (novo, `'use client'`): chama `useBoardRealtime()` e devolve `null`.

### 5. Ligação na árvore

`src/App.tsx` (alterado), uma linha no lugar que a decisão 1 escolhe:

```diff
             <BoardSessionProvider>
+              <BoardRealtime />
               <AppShell>
```

### 6. A linha do banner e o esmaecimento

- `src/components/board/realtime/use-board-offline-line.ts` (novo): `useBoardOfflineLine(products: UseQueryResult<BoardProducts>)` registra a linha da decisão 7 com `useOfflineBannerMessage` quando `useIsOffline()` e há dado, e `null` fora disso.
- `src/components/board/realtime/OfflineDimmed.tsx` (novo): `styled('div')` que aplica a opacidade do artboard com `useIsOffline()`, com a transição desligada sob `REDUCED_MOTION_QUERY` (`src/helpers/reduced-motion.ts:1`).
- `src/components/board/BoardScreen.tsx` (alterado): `useBoardOfflineLine(products)` no ramo `content`, e o `OfflineDimmed` em volta do card de itens e do de pagamentos, pelo mapa de encaixe da 01.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars.
2. `git grep -n "new SocketStore" -- src app` acha **uma** instância, a de `src/hooks/use-board-socket.ts`.
3. `grep -n "\.on(\|\.off(" src/components/board/realtime/use-board-realtime.ts`: o mesmo número de `on` e de `off`, os dois com o mesmo identificador de handler, e nenhum `off` com um argumento só.
4. **Coalescedor (node, com timers falsos):** três `schedule` em 100 ms (`products`; `movement`; `products`) dão **um** `flush` 250 ms depois do último, com `{ products, movement }`; `cancel()` antes da janela não chama `flush`.

**No navegador.** O harness `.indoor-qa` usa um stub no lugar do socket-api. Aqui é preciso o real: subir o `delivery-socket-api` local (`/home/ricardo/workspace/sgrande-delivery/delivery-socket-api`, `yarn start:dev`, porta e `API_SECRET` do `.env` de lá) e o `next dev` com `NEXT_PUBLIC_SOCKET=http://localhost:<porta>`. Os eventos de hoje são disparados direto nas rotas HTTP do socket-api, com `Authorization: Bearer $API_SECRET` e `content-type: application/json`:

```bash
S=http://localhost:<porta>; ID=<uuid-da-mesa-aberta>; H="Authorization: Bearer $API_SECRET"
curl -s -X POST "$S/board-sessions/$ID/products" -H "$H" -H 'content-type: application/json' -d '[]'
curl -s -X DELETE "$S/board-sessions/$ID/products/1" -H "$H"
curl -s -X POST "$S/board-sessions/$ID/payments" -H "$H" -H 'content-type: application/json' -d '{}'
curl -s -X DELETE "$S/board-sessions/$ID/payments/x" -H "$H"
curl -s -X POST "$S/board-sessions/$ID/totals-changed" -H "$H" -H 'content-type: application/json' -d '{}'
```

DevTools: Network (WS e Fetch/XHR filtrados por `boardMovements`).

1. `/board?session=<aberta>`. **Observar:** um handshake `40/board,` com `x-restaurant-uuid`, e um `subscribe_channel` com o UUID da mesa no frame.
2. Cada `curl` acima. **Observar:** depois de ~250 ms, **uma** releitura de cada chave da tabela (por exemplo, `payments` → `GET /payments` e `GET /boardMovements/{id}`), sem reload e sem skeleton. Três `curl` de `products` em sequência rápida dão uma leitura só.
3. **Ponta a ponta com a API** (`SOCKET_API_URL` da API local apontando para o socket-api local): lançar um item no PDV, remover um item e registrar um pagamento. **Observar:** a conta muda sem reload.
4. **Reinício do socket:** parar e subir o `delivery-socket-api`. **Observar:** depois da reconexão, um `subscribe_channel` novo no frame e uma releitura das três chaves; o `curl` de pagamento seguinte ainda atualiza a conta. O banner offline **não** aparece (a internet está de pé: o probe responde).
5. **Rede:** DevTools → Offline por 20 s e de volta. **Observar:** o banner com "Esta é a conta de {HH:mm}. Novos lançamentos do garçom aparecem quando a internet voltar.", com a hora da última leitura dos itens; a lista de itens e a de pagamentos esmaecidas, e o card não. Na volta: o banner sai, o socket reconecta, `subscribe_channel` de novo, e a conta relida.
6. **Queda pelo servidor.** Hoje liberar a mesa **não** derruba o socket do indoor: o `board_session_completed` vai para a sala da loja, e a tela só percebe na próxima releitura (um evento, "Atualizar" ou reconexão). A queda por servidor só existe com a [socket-api#77](https://github.com/sgrande-delivery/delivery-socket-api/issues/77) (feature #2) no socket-api local, ou forçando `client.disconnect()` no gateway local. Com uma das duas e a mesa liberada no PDV, **observar:** a releitura da movimentação e a tela "sem mesa", sem banner offline e sem tentativa de reconexão.
7. **Navegação:** ir ao cardápio e voltar à conta três vezes. **Observar:** nenhum handshake novo e nenhum `subscribe_channel` a mais (a conexão é da raiz); um `curl` de pagamento continua dando uma releitura só.
8. **Eventos novos** (`board.order_status_changed`, `board.waiter_called`, `board.bill_requested`): só disparáveis com as rotas da #75 e da #65 na branch local do socket-api. Com elas, o mesmo roteiro do passo 2, com as chaves da tabela. Sem elas, conferir por leitura que os três nomes estão no mapa exatamente como no contrato (com ponto, não sublinhado).

## Critérios de aceitação

- [ ] Existe uma instância de `SocketStore` do `/board`, em module scope, e só o `BoardRealtime` conecta e desconecta.
- [ ] Lançar item, remover item, registrar e excluir pagamento no PDV muda a conta sem reload, relendo as chaves da tabela, e cada evento que mexe em dinheiro relê a movimentação.
- [ ] Rajada de eventos dá uma leitura por chave, depois do último evento.
- [ ] Depois de reiniciar o socket ou de a rede voltar, o `subscribe_channel` é reemitido e as três chaves são relidas, sem reload.
- [ ] `io server disconnect` relê a movimentação e não liga o banner offline; os outros motivos de queda chamam `reportConnectionLost`.
- [ ] Trocar de sessão abre conexão nova; sair de `ready` desconecta.
- [ ] Cada `on` tem um `off` com o mesmo evento e a mesma referência; nenhum `off` cego.
- [ ] As chaves invalidadas saem de `BOARD_BILL_QUERY_KEYS`/`resolveBoardBillQueryKeys`, exportados de `board-bill-keys.ts`, e nenhum outro arquivo desta task monta chave da conta.
- [ ] Offline, a conta registra a linha literal do artboard no banner e esmaece as listas.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- A credencial de sessão de mesa no handshake: [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) (feature #2), sobre este hook.
- O que a tela mostra de garçom e conta pedida: 07 (aqui só se relê a movimentação).
- `board.charge_updated` e o acompanhamento da cobrança: #24, pelo `useBoardSocket()` exportado aqui.
- Aplicar delta de item, pagamento ou total no cache.
- Reconectar à força depois de `io server disconnect`, ou qualquer outro namespace (`/client`).
- Sala da loja (`board_session_completed`, `board_order_created`): o anônimo não entra nela.

## Branch

`task/58-board-realtime-socket`, cortada de `task/56-board-bill-totals` (`c1da7d7`) em 2026-11-27, no checkout principal. É a terceira da pilha sequencial da #23: o PR mira a branch da #56 até o #95 mergear, e a #57 sai desta branch.

## Implementação

**Concluída em:** 2026-11-27 (código; navegador e socket real ficam com o dev)

### Camadas tocadas

- `src/services/restaurant-header.ts`: exporta `restaurantUuid`, usado pelo header.
- `src/store/socket-store.ts`: `SocketSnapshot` exportado (única mudança).
- `src/hooks/use-board-socket.ts` (novo): o único `SocketStore` do `/board`, `useBoardSocket`, `useBoardSocketConnection`.
- `src/components/board/realtime/`: `board-socket-events.ts`, `board-bill-keys.ts`, `invalidation-batcher.ts`, `use-board-realtime.ts`, `BoardRealtime.tsx`, `use-board-offline-line.ts`, `OfflineDimmed.tsx` (todos novos).
- `src/App.tsx`: `<BoardRealtime />` dentro do `BoardSessionProvider`.
- `src/components/board/ReadyBoardScreen.tsx`: `useBoardOfflineLine(products)` e `OfflineDimmed` em volta do `BoardItemsCard`.

### Contratos consumidos

- `/board` com `auth['x-restaurant-uuid']`, `query.app=indoor`, `subscribe_channel` com o UUID da movimentação, e os 8 eventos da tabela (nomes novos com ponto). Não conferi na fonte do socket-api, só no contrato inline.

### Variáveis de ambiente novas

- Nenhuma (`NEXT_PUBLIC_SOCKET` e `NEXT_PUBLIC_RESTAURANT_UUID` já existiam).

### Decisões que tomei por conta própria

- O `useBoardOfflineLine(products)` é chamado no topo do `ReadyBoardScreen`, e não "no ramo content": hook não pode ser condicional. Ele só registra a linha com offline e dado presente, então o efeito é o mesmo.
- O `ReadyBoardScreen` ainda não renderiza card de pagamentos (vem na #57), então o `OfflineDimmed` envolve só o card de itens. A #57 deve envolver o de pagamentos.
- Transição de opacidade de 200 ms com `ease` quando há movimento; `none` sob `REDUCED_MOTION_QUERY`. A duração não vinha da task.
- A linha de banner usa o `dataUpdatedAt` da query de itens, como pedido.
- `handleDisconnect` marca `hasDisconnected` também no `io client disconnect`, mas não faz mais nada nele; o cleanup do efeito já remove o listener antes disso na prática.
- A cópia da linha do banner mora em `use-board-offline-line.ts` (não em `board-copy.ts`).

### Como testar

Roteiro 1 a 8 da seção Testes (socket-api local e `next dev`). Não executei.

### Verificação feita

- `npx tsc --noEmit`: limpo. `npx eslint src app scripts`: limpo (só o aviso de versão do React).
- Grep 2 (por `grep -rn`, porque `git grep` ignora os arquivos ainda não rastreados): uma instância `'board'` em `use-board-socket.ts`; a outra é a do `/client`, pré-existente.
- Grep 3: 5 `on` e 5 `off` no arquivo (`on(event, handler)` e `off(event, handler)` dentro de loop sobre os mesmos 8 eventos, mais `connect` e `disconnect`), todos com 2 argumentos.
- Teste 4 (node, jiti, timers falsos): três `schedule` em t=0, 50 e 100 dão um `flush` em t=350 com `["movement","products"]`; `cancel()` antes da janela dá 0 flushes.

### O que NÃO foi verificado

- Navegador e socket real (handshake, sala, releituras, reconexão, `io server disconnect`, banner, esmaecimento).
- `next typegen` e `next build`, por pedido (há `next dev` rodando).
- Eventos novos (`board.*`) contra um socket-api que os emita.

### Correções aplicadas em review

- `src/components/board/realtime/OfflineDimmed.tsx`: `transition: 'opacity 200ms ease'` (literal) virou `theme.transitions.create(['opacity'])`, que é o `motion.duration.standard` (200 ms) com o `motion.easing.standard` do tema, como os outros componentes de `src/components/ui/`. O `useIsOffline()` saiu do JSX e foi para uma constante.
- `src/components/board/realtime/use-board-realtime.ts`: `(Object.keys(BOARD_EVENT_INVALIDATIONS) as BoardSocketEvent[])` virou `Object.values(BOARD_SOCKET_EVENTS)`, que tem o mesmo tipo sem o `as`. Também entrou um comentário de WHY no ramo `io client disconnect`: o cleanup do `useBoardSocketConnection` roda **antes** do cleanup do efeito dos listeners, então o próprio `disconnect()` chega ao `handleDisconnect` de forma síncrona. É por isso que o ramo é necessário, e a nota da `## Implementação` ("o cleanup do efeito já remove o listener antes disso") está invertida. Sem o ramo, toda troca de sessão e toda saída de `ready` chamariam `reportConnectionLost()`.
- `src/components/board/realtime/BoardRealtime.tsx`: `import React from 'react'`, como os outros componentes que usam `React.FC`.

### Validação no navegador (2026-11-27, orquestrador)

Contra o **`delivery-socket-api` real**, a `origin/master` @ `8eb1f45`, extraída por `git archive` e rodando local na 3030. Ela usa o `node_modules` do clone, com as dependências idênticas às da `master`, e um `.env` sem Grafana. A api local (`master` @ `819683112`) chegava ao socket por `socket_app` → gateway da rede `backend`, com uma linha temporária no `/etc/hosts` do container. Mesa 003, a 390 × 844. O roteiro (`qa58.mjs`) contou os quadros do websocket e as leituras REST da conta. Resultado: 19 de 19 e mais 3 de 3 no ponta a ponta.

| # | Passo da task | Resultado |
|---|---|---|
| 1 | Handshake e sala | `40/board,{"x-restaurant-uuid":"38691b7e-…"}` e um `subscribe_channel` com o uuid da mesa na conexão viva |
| 2 | Cada evento pela rota HTTP do socket | `board_products_added`, `board_product_deleted` e `board_totals_changed` releem `products` + `movement`; `board_payment_added` e `board_payment_deleted` releem `payments` + `movement`. Uma leitura por chave, ~250 ms depois. Rajada de 3 `board_products_added`: uma leitura por chave |
| 3 | Ponta a ponta | outro aparelho manda um pedido pela api do carrinho (201); a api emite pelo socket, e a conta passa de 4 para 5 rodadas sem reload ("Pedido 5 · 1× X Salada · Rafael"), com o falta pagar atualizado. Vídeo `58a-pedido-de-outro-aparelho.mp4` |
| 4 | Socket derrubado e de pé de novo | conexão nova com um `subscribe_channel`, releitura das três chaves, **sem** banner offline (a queda foi `transport close` e o probe viu a internet de pé). O evento seguinte relê |
| 5 | Offline (`context.setOffline`) | o banner com "Esta é a conta de 12:17. Novos lançamentos do garçom aparecem quando a internet voltar.", itens a 0,72 e o card de destaque a 1. Na volta, o banner sai e a conta é relida. O offline emulado do Chromium **não** derruba o websocket aberto, então a reconexão depois de queda de rede foi provada pelo passo 4, e não por este |
| 7 | Cardápio e volta 3× pela navegação do app | nenhum handshake novo, nenhum `subscribe_channel` a mais, e o evento seguinte dá uma leitura |
| 8 | `board.*` | conferido por leitura: os três nomes estão com ponto. A `master` do socket ainda não os emite. O `board_bill_requested` de lá vai para a sala da loja, e não é o mesmo evento |

O StrictMode está desligado (`next.config.ts:7`). As 2 conexões contadas no boot são a do `loading` → `ready`, e só a viva tem `subscribe_channel`.

**Não verificado:** `io server disconnect` (o socket local não derruba o cliente; precisa da socket-api#77 ou de forçar no gateway) e a queda de rede real com o websocket caindo.

**Efeito colateral no banco de dev:** o passo 3 gravou um pedido real na mesa 003 (1× X Salada, "Rafael", R$ 7,99). Ele ficou lá, como os pedidos de QA anteriores dessa mesa.

## Follow-ups identificados em review

- **(média) O primeiro `connect` depois de `connect_error` não relê a conta.** Um tablet que abre a conta durante um deploy ou uma queda do socket-api lê o REST no boot e se inscreve minutos depois. Como nunca houve `disconnect`, o `hasDisconnected` fica falso e o intervalo sem sala não é relido. Um pagamento perdido nesse intervalo deixa a lista de pagamentos sem a linha até o próximo evento de pagamento, mesmo quando um evento de item relê a movimentação. O código segue a tabela de reações da task ("se veio depois de um `disconnect`"), então a correção pede uma emenda: marcar a releitura também em `connect_error`, com o seu par `on`/`off`.
- **(média) `src/hooks/use-refresh-board-bill.ts:75-79` monta a própria lista de chaves da conta.** Quando a #61 puser `payment-options` no grupo `movement` de `BOARD_BILL_QUERY_KEYS`, o "Atualizar" não vai reler esse grupo. Trocar por `resolveBoardBillQueryKeys(movementId, ALL_BOARD_BILL_KEYS)`, para a lista ser única de fato.
- **(média, cross-repo) O nome do evento de conta pedida diverge entre as specs.** A spec do socket-api mergeada em 2026-11-27 (PR #67, `origin/master` `8eb1f45`, `.claude/sdd/65-board-attendance-client-events/spec.md:66`) recomenda `board.bill_requested_session` na decisão pendente 1. Esta task e a delivery-api#1648 dizem `board.bill_requested`. Quem implementar a #65 no socket-api precisa fechar a decisão com `board.bill_requested`: com o outro nome, o indoor nunca ouve o evento, e nada dá erro.
- **(média) A #57 envolve o card de pagamentos no `OfflineDimmed`.** O critério "esmaece as listas" só fecha quando ela fizer isso.
- **(baixa) 0,72 não é token.** Promover o valor para `interactionOpacities`, em `src/theme/interaction.ts`, e para `design-system/tokens.json` (por exemplo, `opacity-stale`). Hoje ele é constante local do `OfflineDimmed`, copiada do artboard.
- **(baixa) No celular, o esmaecimento pega também o resumo de valores.** O `BoardTotals` é o footer do `BoardItemsCard`. No artboard `Estado · offline` (tablet) o resumo fica na coluna da direita, sem esmaecer. Decidir na #57 ou na #60 se o `OfflineDimmed` desce para envolver só a lista de rodadas.
- **(baixa) O texto do teste estático 2 está velho.** O `/client` da #50 (`src/hooks/use-restaurant-state-socket.ts:12`) já estava na base. Trocar "acha uma instância" por "acha uma instância do `/board`".
- **(baixa) A rule `socket-da-mesa` não cobre conexão nova.** A linha "Ao trocar de mesa, emitir `unsubscribe_channel`" vale só quando a conexão é a mesma (decisão 2). Escrever isso na rule.
- **(nit) `src/hooks/use-restaurant-state-socket.ts:23` lê `process.env.NEXT_PUBLIC_RESTAURANT_UUID` direto**, em vez da constante `restaurantUuid` de `src/services/restaurant-header.ts`.
- **(nit) A copy da linha do banner mora em `use-board-offline-line.ts`.** O resto da copy da conta está em `board-copy.ts`.
