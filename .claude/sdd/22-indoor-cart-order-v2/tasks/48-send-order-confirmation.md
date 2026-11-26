# 03 — Envio do pedido e tela de "pedido enviado"

**Issue:** [#48](https://github.com/sgrande-delivery/delivery-indoor/issues/48)
**Feature:** [Carrinho e envio do pedido pelo carrinho v2](../spec.md) — issue #22
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 (#46), 02 (#47), 04 (#49) e, da #23, as tasks 01 ([#53](../../23-indoor-board-bill-redesign/tasks/53-board-bill-reads-and-screen-frame.md): `useBoardProducts`, `boardProductsQueryKey` e o tipo `BoardProductItem`) e 03 ([#55](../../23-indoor-board-bill-redesign/tasks/55-board-round-grouped-items.md): `round-status.ts` e `RoundStatusPill`). Para o selo mudar ao vivo no roteiro, também a 06 da #23 ([#58](../../23-indoor-board-bill-redesign/tasks/58-board-realtime-socket.md)), que transforma `board.order_status_changed` em releitura.
**Status:** shipped
**Reconciliado com a #21 (2026-11-23):** `formatCents` é o de `src/helpers/money.ts` criado pela [#40](../../21-indoor-menu-v2/tasks/40-catalog-v2-services-types.md), e não "da 01" desta feature, que só o consome. A coluna e o painel em que a confirmação aparece seguem no `AppShell` (#49), único dono. Nada mais muda.
**Alinhado à #23 e à delivery-api#1752 (2026-11-23):** o selo da rodada deixa de traduzir o `status` cru da resposta do checkout. Sai o `order-round-status.ts`, e o estado passa a ser o `round_status` do item da rodada (delivery-api#1754), lido por `useBoardProducts` da #53 e casado pelo `order_public_id`. O rótulo, o tom e o selo vêm de `src/components/board/round-status.ts` e `RoundStatusPill.tsx`, de que a #55 é dona. O selo sai "enviado" até a cozinha imprimir e muda ao vivo com `board.order_status_changed`. O `PlacedOrder` perde o `status`, que ninguém lê mais, e a pendência do `o` sem rótulo foi fechada pela 1752.
**Alinhado à #24 (2026-11-23):** a `Idempotency-Key` sai de `randomUuid()`, de `src/helpers/random-uuid.ts`, que a #46 cria e a #24 importa. Não há gerador próprio aqui.

## Objetivo

O pedido sai da sacola para a cozinha pelo checkout de mesa do carrinho v2, com o nome de quem pede como `customer_name`, uma `Idempotency-Key` e o bloqueio do segundo toque. No primeiro envio o app pede o nome; nos seguintes mostra "Pedindo como". Enviado, a sacola esvazia, o `cart_id` consumido não volta, a conta da mesa é invalidada, e a tela mostra a confirmação do design: tela cheia no celular, e coluna ou painel com o selo da rodada no tablet.

## Contexto

### Estado atual

- **A 01** entrega a sacola no servidor:
  - `src/services/cart.ts`, com o guardado `{ id, sessionToken, movementId }` e `clearStoredCart`;
  - `useCart` e `useCartItemCount`;
  - `CartPanel` e `CartTotals`;
  - a tela `/cart` do celular, cujo rodapé tem só os totais.
- **A 02** entrega `usePerson()` (`{ person, needsPerson, setPerson }`), o `PersonNameDialog` com os modos `first-send` e `change` e `isSubmitting`, o `OrderingAsRow` e `firstName`.
- **A 04** entrega a coluna de paisagem (`CartColumn`) e o painel de retrato (`TabletCartDock` + `CartSheet`) no `AppShell`. Os rodapés deles têm só `CartTotals`, e o painel continua aberto quando a sacola esvazia (04, decisão 6).
- **A task 01 da #23** ([#53](../../23-indoor-board-bill-redesign/tasks/53-board-bill-reads-and-screen-frame.md)) entrega a leitura da conta por React Query:
  - `useBoardProducts(movementId)` (`src/hooks/use-board-products.ts`), que devolve o `UseQueryResult` de `BoardProducts`;
  - `boardProductsQueryKey(id)` → `['board-products', id]`, em `src/services/board-bill.ts`;
  - o tipo `BoardProductItem` em `src/types/board-bill.ts`, com `round`, `order_public_id` e `round_status: BoardRoundStatus | null`. O `null` cobre a api publicada que ainda não traz o campo, e o `round_status` fora do vocabulário; o serviço normaliza os dois.
- **A task 03 da #23** ([#55](../../23-indoor-board-bill-redesign/tasks/55-board-round-grouped-items.md)) é a dona do mapa do estado da rodada, e o deixa na raiz de `src/components/board/` para esta task importar (decisão 3 de lá):
  - `BOARD_ROUND_STATUS_LABEL` e `BOARD_ROUND_STATUS_TONE`, em `src/components/board/round-status.ts`;
  - o selo `RoundStatusPill` (`{ status: BoardRoundStatus }`), em `src/components/board/RoundStatusPill.tsx`.
- **A task 06 da #23** ([#58](../../23-indoor-board-bill-redesign/tasks/58-board-realtime-socket.md)) monta o `BoardRealtime` na raiz do app. A cada `board.order_status_changed` da sala da movimentação, ele invalida `boardProductsQueryKey`. Esta task não registra listener de socket.
- **Na fundação:**
  - `boardMovementQueryKey(id)` está em `src/services/board-movement.ts:8`;
  - `useIsOffline()` está em `src/providers/connectivity/ConnectivityProvider.tsx:57`;
  - `resolveErrorCode` (`src/services/http-error-code.ts:13`) dá o código para suporte.

  Aprendizado da 07 da #20: uma mutação offline **fica pausada** e dispara sozinha quando a rede volta. Por isso o envio desabilita com `useIsOffline()`.

### Requisitos cobertos

- **RF-05:** a ligação do diálogo ao primeiro envio.
- **RF-07:** o nome vai como `customer_name`.
- **RF-08:** spinner e o segundo toque bloqueado.
- **RF-09:** a confirmação do celular.
- **RF-09a:** a confirmação do tablet, na coluna e no painel.
- **RF-10:** a sacola vazia e o `cart_id` descartado.
- **RF-12 no tablet:** o CTA desabilitado na coluna vazia.
- **RN-02, RN-03, RN-06 e RN-07.**
- **Decisão pendente 2 da spec:** o nome vai como `customer_name` no checkout, e a api o replica como `person` de cada item. É o default, assumido.

### Contrato consumido

`POST /cart/{cartId}/checkout`, no contrato da [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) (plan, "Contrato HTTP") e da task [#1631](https://github.com/sgrande-delivery/delivery-api/issues/1631):

```
POST /api/client/cart/{cartId}/checkout
  headers: x-restaurant-id, x-cart-session-token, Idempotency-Key
  middleware: RestaurantMiddleware, client.session, client.customer, orders.v2, internal.caller, idempotency
  body: { "customer_name": string, "shipment_method": "board" }
  → 201 OrderPresenter — kind=board, board_movement_id do carrinho, itens com person = customer_name
```

**Hoje**, medido em `origin/master` @ `8db44045e`, a rota recusa esse corpo:

- `shipment_method` é `in:delivery,pickup`, e `restaurant_address_id` é `required` (`CheckoutCartRequest.php:55-57`). Isso dá 422 de validação.
- Passando a validação, o `assertHasCustomer()` (`CheckoutCartUseCase.php:97`) dá 401 `cart_requires_customer`.

A task escreve o corpo do contrato. O relatório avisa que o envio fecha quando a #1631 subir.

**Divergência medida com a spec da #22: nenhuma.**

- O corpo, o valor `board` (decisão 1 da spec de lá), o `customer_name` e a resposta conferem.
- Ficam fora do corpo, porque não se aplicam à mesa (RN-07 e "Fora do escopo" da spec):
  - `restaurant_address_id` e `customer_address_id`;
  - `payment_method_id`, `scheduled_at`, `deliverer_id` e `change`;
  - `annotation`.

**`OrderPresenter`** (`core/Order/V2/Application/Presenters/OrderPresenter.php:28-67`), em centavos. Esta task lê só:

- `id`, o uuid do pedido. É o mesmo valor de `order_public_id` no item da conta: `OrderMapper.php:94` (`new OrderId($model->uuid)`) e `BoardMovementRepository.php:152` (`orders.uuid as order_uuid`);
- `customer_name`;
- `total`;
- `board_movement_id`.

O `status` cru (`p`, `o`, `a`, …) também vem, e **não é lido**: traduzir o código é regra de domínio da api (RN-03 da delivery-api#1752), e o estado da rodada chega pronto no item da conta.

**O estado da rodada** vem do item de `GET /boardMovements/{id}/products` (contrato da [#53](../../23-indoor-board-bill-redesign/tasks/53-board-bill-reads-and-screen-frame.md), campo da [delivery-api#1754](https://github.com/sgrande-delivery/delivery-api/issues/1754)): `round_status` ∈ `sent` · `preparing` · `ready` · `delivered` · `canceled`, igual em todos os itens do pedido. O pedido de mesa criado pelo carrinho nasce `o`, que a api traduz para `sent`, e vira `preparing` quando a cozinha imprime (`a`). A mudança chega pelo `board.order_status_changed` da sala da movimentação (`{ board_movement_id, restaurant_uuid, order_public_id, status, round_status, changed_at }`, delivery-socket-api#75 e delivery-api#1756), que a #58 transforma em invalidação de `boardProductsQueryKey`.

**Idempotência** (`app/Modules/Idempotency/Middleware/IdempotencyKeyMiddleware.php`, `ExecuteIdempotentRequestUseCase.php`):

- **A chave é opcional.** Sem o header, a rota roda sem proteção.
- **O que o servidor grava:** a resposta **2xx e 4xx** fica registrada e é **repetida** para a mesma chave. 5xx não é registrado.
- **Chave em voo:** 409 `idempotency_key_in_flight`, com `Retry-After: 1`.
- **Mesma chave com outro corpo:** 422 `idempotency_key_payload_mismatch`.
- **O header de repetição não é legível.** O `Idempotent-Replayed` não está em `exposed_headers` (`config/cors.php`), e o navegador não o lê. O app não depende dele.

**Conta da mesa depois do envio:** o pedido entra pela existência com `board_movement_id`. O socket `/board` emite `board_products_added` na sala da movimentação (plan, "Envio"; #1632 confere os eventos). Aqui a tela só invalida as leituras.

### Decisões

1. **Uma chave por tentativa de conteúdo, e não por toque.** O hook guarda `{ cartId, customerName, key }`.
   - **Reaproveita a chave** quando a tentativa anterior com o mesmo carrinho e o mesmo nome terminou:
     - sem resposta (rede);
     - com 5xx;
     - com 409 `idempotency_key_in_flight`.

     É o caso em que o pedido pode ter entrado. A repetição devolve o mesmo 201 em vez de criar outro.
   - **Gera uma chave nova:**
     - depois de qualquer resposta 2xx ou 4xx registrada. Repetir a chave depois de um 4xx devolveria o mesmo 4xx para sempre, mesmo com a cozinha já aberta;
     - quando o nome ou o carrinho mudam, porque a mesma chave com outro corpo dá 422.

   A chave sai de `randomUuid()` (`src/helpers/random-uuid.ts`, criado pela 01), com o fallback de `crypto.getRandomValues` fora de contexto seguro. É o mesmo gerador que a #24 importa para a chave do pagamento.
2. **Duas travas contra o duplo toque (RN-06).**
   - O botão fica desabilitado e com spinner enquanto a mutação está em voo (RF-08).
   - Antes disso, um `ref` de "em voo" recusa a segunda chamada **no mesmo tick**: dois toques antes do re-render chamam `mutate` duas vezes, e o `isPending` ainda é `false` no segundo.

   A chave cobre o retry de rede, e o bloqueio cobre o toque.
3. **Fluxo do primeiro envio (RF-05).** Tocar "Enviar pedido":
   - **com `needsPerson`:** abre o `PersonNameDialog` em `first-send`, com o total no CTA. Confirmar grava o nome (`setPerson`) **e** dispara o envio.
     - O diálogo fica aberto com `isSubmitting` até a resposta.
     - Sucesso: fecha e mostra a confirmação.
     - Falha: fecha, e a falha aparece no rodapé, com o nome já salvo.
   - **com `person`:** envia direto. O `OrderingAsRow` já estava visível acima do botão (RF-06).

   "trocar" abre o modo `change` (02), que não envia. O nome fica salvo mesmo que o envio falhe: o cliente o digitou, e a promessa "só pedimos uma vez" vale para a próxima tentativa.
4. **Depois do 201** (RF-10). Nesta ordem:
   1. guarda o retrato do que foi enviado: os itens da sacola lida e a contagem;
   2. `clearStoredCart()`;
   3. `queryClient.removeQueries({ queryKey: cartQueryKey(cartId) })`;
   4. invalida `boardMovementQueryKey(movementId)` e `boardProductsQueryKey(movementId)` (`src/services/board-bill.ts`, #53).

   A tela passa ao estado de enviado. A próxima adição cria outra sacola, com outro token (01, decisão 2).
5. **O que a confirmação mostra:**
   - itens, composição e preço da linha: do **retrato da sacola enviada**, pelo mesmo `buildCartItemComposition` da 01 e o `formatCents` de `src/helpers/money.ts` (#40, task 01 da #21);
   - o valor: o `total` **do pedido**, que é o que entrou na conta;
   - o nome: o `customer_name` da resposta.

   Não há segundo montador de composição para o `OrderProductPresenter`.
6. **O estado de enviado é local de cada moldura**, e não um contexto global.
   - **No celular**, a tela `/cart` troca o corpo pela confirmação. Sair da rota a descarta.
   - **Na coluna de paisagem**, a confirmação fica até "Continuar no cardápio" ou até a sacola voltar a ter item.
   - **No painel de retrato**, a confirmação fica até fechar o painel.

   O estado vive no componente que já é dono daquela moldura. Ele não precisa sobreviver a trocas de formato.
7. **Copy por formato, a do artboard de cada um:**
   - **Celular** (`Carrinho · celular · primeiro pedido`, README do `OrderSentPanel`):
     - círculo de 64 em `success` com `check`;
     - título "Pedido enviado, {primeiro nome}!";
     - corpo "A cozinha já recebeu. Os itens entraram na conta da Mesa {número}.";
     - ações "Ver conta da mesa" (primária, com `receipt_long`) e "Voltar ao cardápio" (`neutral`).
   - **Tablet** (`Pedido enviado · tablet deitado`):
     - `check_circle`;
     - título "Pedido enviado";
     - corpo "Foi direto para a cozinha e já entrou na conta da mesa, no nome de {primeiro nome}.";
     - selo "Pedido {rodada}" seguido do `RoundStatusPill` (decisão 8);
     - "{n} itens · {total}";
     - os itens ("1× Classic Smash", composição e preço da linha);
     - ações "Ver na conta da mesa" (primária) e "Continuar no cardápio".

   O artboard diz "no nome **da** Marina". Com nome arbitrário o artigo erra o gênero ("da João"), então fica "de". É ajuste **derivado**; confirmar com o dev.
8. **O selo da rodada (RF-09a), lido da conta.** *(Reescrita em 2026-11-23, alinhada à #23. O texto anterior traduzia o `status` cru da resposta do checkout num `order-round-status.ts` próprio.)*
   - **O item da rodada** é o primeiro item de `useBoardProducts(movementId)` cujo `order_public_id` é o `id` do pedido. A invalidação do item 4 refaz a leitura, e é dela que sai tudo do selo.
   - **A rodada** é o `round` desse item, e **o estado** é o `round_status` dele, pelo `RoundStatusPill` da #55. Esta task não tem mapa de estado: rótulo e tom são `BOARD_ROUND_STATUS_LABEL` e `BOARD_ROUND_STATUS_TONE` de `src/components/board/round-status.ts`, os mesmos do cabeçalho da rodada na conta.
   - **Logo depois do envio, o selo diz "enviado"** (`sent`), e não "em preparo" como o artboard. Ele muda para "em preparo" quando a cozinha imprime, **sem reload**, porque o `board.order_status_changed` faz a #58 invalidar `boardProductsQueryKey`, e a confirmação é um observador ativo dessa chave. Sem a #58 na base, o selo muda na próxima releitura.
   - **Enquanto a leitura não chega**, o número é skeleton de texto, e o selo de estado não aparece.
   - **Se a leitura falhar, ou o item ainda não estiver nela**, o selo sai sem número e sem estado. Não se inventa rodada.
   - **`round_status: null`** (api publicada sem a #1754) sai só com "Pedido {rodada}", como o cabeçalho da conta (decisão 5 da #55: "rodada sem estado conhecido sai só com o título"). Não há fallback pelo `status` cru.
   - A cor do selo é o tom da #55 (`toneOnCard.badge` do tema), e não a do canvas.
9. **Rodapé por moldura.** O `CartFooter` compõe:
   - os totais (01);
   - o `OrderingAsRow` (02), quando há nome;
   - o CTA.

   **O CTA** é porta do `CartFooter.tsx` @ `ceed49a9`:
   - `ButtonBase` com `cartFooterMetrics` (54, raio `lg` e sombra do primário);
   - rótulo à esquerda e valor à direita: "Enviar pedido" e `formatCents(cart.total)`;
   - sai o `Link` para o checkout e entra um `onClick` com spinner;
   - sacola vazia: "Enviar pedido" sem valor, **desabilitado** (RF-12).

   **A disposição** é a do artboard de cada formato:
   - celular e coluna: empilhado, com o "Pedindo como" centrado acima do CTA;
   - painel de retrato: "Pedindo como" e o CTA lado a lado, com o CTA em `flex: 1`.
10. **Falha neste corte.** Qualquer falha mantém a sacola intacta e mostra, no rodapé acima do CTA:
    - "Não foi possível enviar o pedido.";
    - o código de suporte, por `resolveErrorCode` (RF-11 da #20);
    - "Tentar novamente", que reenvia com a regra de chave da decisão 1.

    As mensagens próprias por recusa (mesa fechada, cozinha, item indisponível, `v2_orders_disabled`, sacola expirada ou já enviada) são da 05, que troca este bloco pelo mapa dela.
11. **Offline:** o CTA fica desabilitado com `useIsOffline()`, e a mutação não nasce (aprendizado da 07 da #20). A frase que explica o porquê é da 05.

### Armadilhas

- **`customer_name` é o nome normalizado do `usePerson()`**, nunca o texto cru do campo. A 02 já devolve normalizado.
- **O retrato precisa ser guardado antes de esquecer o carrinho.** Depois do `removeQueries` não há mais `cart` para ler.
- **Invalidar a conta não é ler a conta.** A tela de enviado não espera a releitura para aparecer. O número da rodada chega depois, e só ele (decisão 8).
- **"Ver conta da mesa" leva a `BOARD_ROUTE`**, que a #23 entrega. Até ela subir, o link existe e a rota ainda não. É aviso de ordem de deploy, não motivo para esconder o botão.
- **No primeiro envio, sem nome**, não há o que mandar: o CTA abre o diálogo e **não** chama a API. É o critério "Tentar enviar sem nome… não chama a API".

## Mudanças

### 1. Tipo da resposta

`src/types/order.ts` (novo). É o subconjunto do `OrderPresenter` que o app lê, com o comentário dizendo de qual rota vem:

```ts
/** `POST /cart/{cartId}/checkout` → `OrderPresenter`. Valores em centavos. O `status` cru não entra: o estado da rodada vem da conta (`round_status`). */
export interface PlacedOrder {
  id: string;              // uuid; é o `order_public_id` do item da conta
  customer_name: string;
  board_movement_id: string | null;
  total: number;
}
```

### 2. Serviço do envio

`src/services/cart.ts` (alterado, criado pela 01):

- **`checkoutCart(cartId, customerName, idempotencyKey): Promise<PlacedOrder>`.**
  - Faz `POST /cart/${cartId}/checkout` com `{ customer_name, shipment_method: 'board' }`.
  - Leva os headers `x-cart-session-token` (do guardado) e `Idempotency-Key`.
  - O corpo é montado **aqui, e só aqui**, como o `buildCheckoutBody` do client, sem nenhum campo de entrega.
- **`BOARD_SHIPMENT_METHOD = 'board'`**, constante do módulo.

### 3. Hook do envio

`src/components/cart/use-send-order.ts` (novo).

```ts
export interface UseSendOrder {
  send: (customerName: string) => void;   // recusa se já em voo (ref) ou offline
  isSending: boolean;
  error: unknown;                         // a última falha, até a próxima tentativa
  sent: SentOrder | null;                 // o pedido e o retrato da sacola enviada
  resetSent: () => void;
}
export interface SentOrder { order: PlacedOrder; items: CartItem[]; itemCount: number; personFirstName: string }
```

`useMutation` com `retry: 0`. A chave segue a decisão 1, o `onSuccess` segue a decisão 4, e o `onError` mantém a sacola. Nada vai para `console.error` como único destino.

### 4. Rodapé com o envio

`src/components/cart/CartFooter.tsx` e `src/components/cart/CartSendButton.tsx` (novos), e `src/components/cart/SendFailureNotice.tsx` (novo, decisão 10).

- **`CartFooter`:** `{ cart: Cart | null; layout: 'stacked' | 'inline'; send: UseSendOrder }`. Compõe os totais, o `OrderingAsRow`, a falha e o `CartSendButton`, e é dono do `PersonNameDialog` (decisão 3).
- **`CartSendButton`:** a porta do CTA (decisão 9), com `aria-busy` e `disabled` quando enviando, vazio ou offline.

### 5. Confirmações

`src/components/cart/sent/` (novos):

- `OrderSentPanel.tsx`: a do celular, decisão 7;
- `OrderSentColumn.tsx`: a do tablet;
- `SentItemList.tsx` e `SentItemRow.tsx`: um por arquivo, pela regra do `map`;
- `SentRoundSeal.tsx`: "Pedido {round}" e o `RoundStatusPill` importado de `src/components/board/RoundStatusPill.tsx` (#55) quando há `round_status`;
- `use-sent-order-round.ts`: lê `useBoardProducts(movementId)` (#53), acha o item pelo `order_public_id` e devolve `{ round: number; status: BoardRoundStatus | null } | null | undefined` (`undefined` carregando, `null` sem leitura ou sem o item), com `BoardRoundStatus` de `src/types/board-bill.ts`.

**Não há `order-round-status.ts`** (decisão 8).

Ícones: `check`, `check_circle` e `receipt_long` já estão na união.

### 6. Ligação nas três molduras

- **`src/components/cart/CartScreen.tsx`** (alterado, 01). O rodapé passa a ser `CartFooter layout="stacked"`. Com `send.sent`, o corpo vira `OrderSentPanel`, sem rodapé:
  - "Ver conta da mesa" é `Link` para `BOARD_ROUTE`;
  - "Voltar ao cardápio" é `Link` para `HOME_ROUTE`.
- **`src/components/cart/dock/CartColumn.tsx`** (alterado, 04). O rodapé passa a ser `CartFooter layout="stacked"`, também com a sacola vazia (RF-12). Com `send.sent`, a coluna mostra `OrderSentColumn`:
  - "Continuar no cardápio" chama `resetSent`;
  - "Ver na conta da mesa" leva a `BOARD_ROUTE`;
  - a confirmação sai sozinha quando `useCartItemCount()` volta a ser maior que zero.
- **`src/components/cart/dock/CartSheet.tsx`** (alterado, 04). O rodapé passa a ser `CartFooter layout="inline"`. Com `send.sent`, o corpo do painel mostra `OrderSentColumn`, sem rodapé, e fechar o painel descarta.

## Testes

Não há suíte automatizada. O envio de verdade só fecha com a [delivery-api#1631](https://github.com/sgrande-delivery/delivery-api/issues/1631) no ambiente. Até lá, o roteiro abaixo roda no harness `.indoor-qa`, com a API apontada para a branch `feature/1608-client-board-cart-checkout` quando ela existir, e a loja de teste com o setting `uses_v2_orders` ligado (plan, "Dependências").

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui.
4. `grep -rn "restaurant_address_id\|customer_address_id\|payment_method_id\|scheduled_at" src` não retorna nada (RN-07).
5. `grep -rn "order-round-status\|OrderStatusV2" src` não retorna nada, e `grep -rn "components/board/round-status\|components/board/RoundStatusPill" src/components/cart` acha os imports do selo. `grep -rn "crypto.randomUUID\|getRandomValues" src` só acha `src/helpers/random-uuid.ts`.

**No navegador**, com `?session=<uuid-aberto>`, a sacola da 01 com dois itens e o DevTools em Network (filtro `checkout`) e Local Storage:

1. **Celular, 390 × 844, sem nome salvo.** Tocar "Enviar pedido R$ X". Esperado:
   - o diálogo "Como podemos te chamar?" com "Enviar pedido · R$ X";
   - **nenhum** request.
   - Confirmar vazio: o erro, e nenhum request.
2. **Confirmar "Marina".** Esperado:
   - spinner no CTA do diálogo;
   - **um** `POST /cart/{id}/checkout` com `{ customer_name: "Marina", shipment_method: "board" }`, `Idempotency-Key` e `x-cart-session-token`.
   - No 201: "Pedido enviado, Marina!", "A cozinha já recebeu. Os itens entraram na conta da Mesa <n>.", com as duas ações.
   - `indoor:cart` ausente, e a aba Sacola sem contador.
3. **Montar outra sacola e enviar.** Esperado:
   - "Pedindo como **Marina** · trocar" acima do CTA, e o envio direto, sem diálogo;
   - chave **diferente** da anterior;
   - `x-cart-session-token` diferente.
4. **Duplo toque:** com o throttling "Slow 3G", tocar duas vezes rápido no CTA. Esperado: **um** request.
5. **Rede caindo no meio:** com o DevTools offline logo depois do toque (ou bloqueando a URL do checkout), e depois "Tentar novamente".
   - Esperado na falha: a sacola intacta, "Não foi possível enviar o pedido." e o código "erro de rede".
   - Esperado na nova tentativa: **a mesma** `Idempotency-Key`. Com a API que já registrou o primeiro, a resposta é o mesmo 201 e a conta tem **um** pedido.
6. **Offline antes de tocar** (banner da 07). Esperado: o CTA desabilitado, e a mutação não fica pausada esperando a rede.
7. **Conta da mesa:** `GET /boardMovements/{id}/products` depois do envio. Esperado: os itens do pedido com `person: "Marina"` e o `order_public_id` igual ao `id` da resposta do checkout. É critério da spec, e depende da #1631.
8. **Tablet deitado, 1180 × 820, enviar pela coluna.** Esperado:
   - a coluna troca para "Pedido enviado";
   - "Foi direto para a cozinha e já entrou na conta da mesa, no nome de Marina.";
   - o selo "Pedido <rodada> · ENVIADO", com o `round_status` do item da conta casado pelo `id` do pedido (na api sem a #1754, só "Pedido <rodada>");
   - imprimir o pedido na cozinha (ou avançá-lo para `a` no PDV): o selo vira "EM PREPARO" **sem reload**, com a #58 na base e a delivery-api#1756 e a delivery-socket-api#75 no ambiente. Sem elas, muda na próxima releitura;
   - "2 itens · R$ X" e os itens com a composição.
   - "Continuar no cardápio" volta para a coluna vazia com "Pedindo como Marina · trocar" e o CTA desabilitado.
9. **Adicionar um produto com a confirmação na coluna.** Esperado: a coluna volta para a sacola sozinha.
10. **Tablet em pé, 820 × 1180, pelo painel.** Esperado:
    - "Pedindo como" e o CTA lado a lado;
    - a confirmação dentro do painel;
    - fechar o painel descarta, e a barra some, porque a sacola está vazia.
11. **Tablet deitado, primeiro envio com teclado** (aparelho real). Esperado: o diálogo no topo, com o spinner no CTA, e a coluna atrás com a confirmação depois do 201.

## Critérios de aceitação

- [ ] O checkout sai com `{ customer_name, shipment_method: "board" }`, `Idempotency-Key` e `x-cart-session-token`, sem nenhum campo de endereço, frete, pagamento, agendamento ou observação.
- [ ] O primeiro envio sem nome abre o diálogo e não chama a API. Depois de salvo o nome, o envio seguinte não pede o nome e mostra "Pedindo como <nome>".
- [ ] Dois toques rápidos geram um request só. A nova tentativa depois de falha sem resposta ou 5xx reaproveita a chave; depois de 4xx, ou com nome trocado, a chave é nova.
- [ ] No 201 a sacola é esquecida (`indoor:cart` ausente e a query removida), e `['board-movement', id]` e os itens da conta são invalidados.
- [ ] O celular mostra "Pedido enviado, <primeiro nome>!" com as duas ações. A coluna e o painel do tablet mostram a confirmação da RF-09a, sem tomar a tela, e com o cardápio navegável ao lado em paisagem.
- [ ] O número da rodada vem de `round` da conta, e o estado de `round_status`, os dois do item casado por `order_public_id`, pelo `RoundStatusPill` e pelo mapa da #55. Sem item, ou com `round_status: null`, nada de rodada ou estado inventado, e o `status` cru do checkout não é lido.
- [ ] O selo sai "enviado" depois do envio e muda para "em preparo" sem reload quando a cozinha imprime (com a #58 na base).
- [ ] Na coluna vazia o CTA aparece desabilitado.
- [ ] Offline o CTA fica desabilitado. Qualquer falha mantém a sacola e mostra o código com "Tentar novamente".
- [x] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **Mensagens próprias por recusa** (mesa fechada, cozinha fechada, item indisponível, `v2_orders_disabled`, `cart_not_found`, `cart_already_checked_out`), a trava pelo estado da cozinha (a loja fechada não trava o pedido de mesa, RN-10 da delivery-api#1608), o socket `/client` e a frase do offline: task 05.
- **"Limpar"**: task 05.
- **`POST /cart/{cartId}/preview`.** O total do `GET /cart` já é o do servidor, e o pedido de mesa não tem frete a pré-calcular. A recusa `403 v2_orders_disabled` aparece no checkout e é tratada na 05.
- **Tempo de preparo na confirmação:** o app não tem essa informação (README do `OrderSentPanel`).
- **O mapa `round_status` → rótulo e tom, e o selo:** são da [#55](../../23-indoor-board-bill-redesign/tasks/55-board-round-grouped-items.md). Esta task os importa e não os copia, nem cria outro para o `status` cru.
- **O listener de `board.order_status_changed`:** é da [#58](../../23-indoor-board-bill-redesign/tasks/58-board-realtime-socket.md). Aqui a confirmação só observa `boardProductsQueryKey`.
- **A tela da conta, o socket `/board` e o `board_products_added`:** #23.

## Branch

`task/48-send-order-confirmation`, cortada em 2026-11-25 de `task/55-board-round-grouped-items` (`768fbf0`, PR #88), com `task/49-tablet-cart-panel` (`6b1e409`, PR #87) mergeada por cima (`5150aff`). A #46 e a #47 já estão na `feat/indoor-v2`. Antes do PR, a branch foi rebaseada na `feat/indoor-v2` (`440d59b`, com o #86, o #87 e o #89 dentro), e o diff ficou só com a #48. Depois do rebase: `tsc`, `eslint` e `next build` limpos.

## Implementação

**Concluída em:** 2026-11-25

### Camadas tocadas

- **Tipo:** `src/types/order.ts` (`PlacedOrder`).
- **Serviço:** `src/services/cart.ts` ganha `BOARD_SHIPMENT_METHOD`, `checkoutCart` e `isIdempotencyKeyReusable`.
- **Hook:** `src/components/cart/use-send-order.ts` (`useSendOrder`, `SentOrder`).
- **Rodapé:** `CartFooter.tsx`, `CartSendButton.tsx`, `SendFailureNotice.tsx` e `send-metrics.ts`, em `src/components/cart/`.
- **Confirmações:** `src/components/cart/sent/` (`OrderSentPanel`, `OrderSentColumn`, `SentItemList`, `SentItemRow`, `SentRoundSeal`, `SentSuccessMark`, `use-sent-order-round.ts`, `sent-metrics.ts`).
- **Molduras:** `CartScreen.tsx` (celular), `dock/CartColumn.tsx` (o `:empty` do rodapé saiu) e `dock/CartSheet.tsx` (painel de retrato).
- Nada em `src/theme/` nem em `src/components/ui/`. Sem `order-round-status.ts`: o selo vem de `round-status.ts` e `RoundStatusPill` da #55.

### Contratos consumidos

- `POST /cart/{cartId}/checkout`, com `{ customer_name, shipment_method: "board" }` e os headers `x-cart-session-token` e `Idempotency-Key`. Conferido contra o plan e a spec da 1608 (branch `feature/1608-client-board-cart-checkout`): corpo, valor `board` e headers batem. A api ainda não o implementa (delivery-api#1631): o envio de verdade só fecha com ela no ambiente.
- Resposta lida: `id`, `customer_name`, `board_movement_id` e `total` (centavos). O `status` cru não é lido.
- `internal_code` `idempotency_key_in_flight` (409), conferido em `IdempotencyKeyInFlightException.php`.
- `GET /boardMovements/{id}/products` (pela `useBoardProducts` da #53): `round` e `round_status` do item cujo `order_public_id` é o `id` do pedido.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **`isSending` liga no próprio `send`, antes do `mutate`**, num `useState` junto com o `ref` de "em voo", e não vem de `mutation.isPending`: o `isPending` só chega no render seguinte, e o dialog e o CTA precisam do spinner no mesmo toque.
- **`send(customerName, { onSettled })`**: a interface da task era `send(customerName)`. O callback existe para o diálogo do primeiro envio fechar ao fim da tentativa (sucesso ou falha), como a decisão 3 manda, sem o `CartFooter` espiar o `isSending`.
- **`flushSync` na confirmação.** A troca do `cart_id` guardado é por `useSyncExternalStore` (síncrona), e o `setSent` é de lane padrão: sem `flushSync` o `setSent` vem depois do `clearStoredCart` e a coluna piscaria o vazio antes da confirmação. Por isso o `SentOrder` leva o `cartId`, e a coluna descarta a confirmação quando aparece uma sacola de **outro id** com itens (e não "count > 0", que mataria a confirmação no commit em que a sacola ainda existe).
- **O painel de retrato descarta a confirmação por efeito em `open === false`**, e não só no clique de fechar: o 201 pode chegar com o painel já fechado, e a confirmação apareceria por cima da próxima sacola.
- **Celular: o rodapé só aparece com a sacola lida e com itens.** A task só pede o CTA desabilitado na coluna do tablet (RF-12); no celular o vazio já tem "Ver o cardápio", e um "Enviar pedido" desabilitado embaixo seria ruído. Painel de retrato mantém a regra que já tinha (`hasItems`).
- **Retry da tentativa, e não da sacola lida (review B1).** Quando o pedido entra e a resposta se perde, a releitura devolve `checked_out` e a sacola vira `null`. O `send-store.ts` (escopo do módulo) guarda a foto da tentativa reaproveitável (`cartId`, nome, chave, `sessionToken`, itens, contagem, mesa), e `retry()` a reenvia sem olhar a sacola. O `checkoutCart` aceita o token explícito. As três molduras mantêm a falha e o "Tentar novamente" com `isRetryable`, mesmo com sacola `null`; o 201 do replay mostra a confirmação normalmente.
- **Trava e chave no módulo (M3):** `isSending`, a tentativa e o erro vivem em `send-store.ts`, lidos por `useSyncExternalStore`. Coluna, painel e celular compartilham a trava, e girar o tablet com envio em voo não dispara outro. O erro e o fim do spinner mudam no mesmo `setSendState`. `send` devolve se aceitou, e o diálogo fecha quando recusa.
- **Painel de retrato (M1):** a confirmação é descartada no `onExited` da transição; só o 201 que chega com o painel já fechado a descarta na hora.
- **Acessibilidade (M4):** `role="status"` só no selo da rodada; o título da confirmação recebe o foco ao montar (`tabIndex={-1}`).
- **O diálogo de nome desmonta junto com o rodapé no 201**, sem animação de saída: a confirmação substitui o corpo e o rodapé não existe nela. O alternativo (manter o rodapé montado só pelo diálogo) trazia um componente de pé só para a animação.
- **CTA a 54 em todas as molduras** (`cartFooterMetrics`), como a task manda; os artboards de tablet desenham 56 e 58.
- **Linha "Pedindo como" com margem negativa de 5** (`sendMetrics.orderingBleed`): o `OrderingAsRow` tem o alvo de 44 do "trocar", e o artboard desenha ~34. Sem a compensação o respiro entre totais, linha e CTA sairia 10px maior que o desenho.
- **`SendFailureNotice` é próprio**, e não o `InlineError`, porque a task pede o código de suporte e o rótulo "Tentar novamente" (o do `InlineError` é "Tentar de novo"). Cor da mensagem: `toneOnCard.danger`. O `message` da api não passa (aprendizado de 2026-11-25).
- **O selo da rodada** é "PEDIDO {n}" em caixa alta (o estilo do cabeçalho da rodada na conta) seguido do `RoundStatusPill`, e não o chip único verde do artboard, porque a task manda o `RoundStatusPill` da #55.
  - Com a leitura em voo e sem o item: "Pedido" mais um esqueleto de texto no lugar do número, sem estado.
  - Falha ou item ausente depois da leitura: nada.
- **Celular segue o README do `OrderSentPanel`** (`design-system/components/OrderSentPanel/README.md`, que está no repo): círculo de 64 com ícone de 34, título `h3` 19/800 e corpo de 13. O artboard desenha círculo de 92 com título de 24; o 64 do artboard é a miniatura do item, e não o círculo. Para o dev confirmar.
- **A confirmação é `role="status"`**, o que faz o leitor de tela anunciar também a mudança do selo ("enviado" para "em preparo").
- **Follow-up 5 da #55 (contraste do selo):** a confirmação desenha o `RoundStatusPill` sobre `surface.card` nas duas molduras (coluna e corpo do painel), que é a superfície contra a qual `toneOnCard.badge` é derivado. Não mexi no tom; não medi a razão de contraste em navegador.

### Como testar

1. `yarn dev` (com `.env.development`) e `http://localhost:3000/?session=<uuid-aberto>`, com a api na branch `feature/1608-client-board-cart-checkout` quando existir e a loja com `uses_v2_orders`.
2. Seguir o roteiro "No navegador" desta task, passos 1 a 11.
3. Para provar o duplo toque, usar `click({ force: true })` duas vezes seguidas e contar os `POST` (o `aria-disabled` do CTA em voo faz o Playwright esperar sem `force`).
4. Pontos a olhar: o respiro entre totais, "Pedindo como" e o CTA nas três molduras; a coluna vazia com o CTA desabilitado; a confirmação sem piscar o vazio; o selo mudando para "em preparo" sem reload (precisa da #58 e da delivery-api#1756).

### O que NÃO foi verificado

- **O teclado em paisagem** (passo 11, aparelho real). O resto do roteiro passou no navegador (ver as duas seções abaixo).
- **A regra de chave** (reuso depois de rede, 5xx ou 409 em voo; chave nova depois de 4xx ou com outro nome) foi escrita e revisada, não exercitada.
- **O `flushSync`** (sem piscar o vazio) e o contraste do selo na superfície da confirmação dependem de olhar na tela.
- A `/board` ("Ver conta da mesa") existe nesta base, mas a conta em tempo real depende da #58.

### Validado com o checkout real (2026-11-25)

Contra a delivery-api local na branch `feature/1608-client-board-cart-checkout` (#1628 a #1633), restaurante 1, mesa 004, sem nada simulado. Rodou no servidor da #50, que traz esta task sem mudar o caminho do envio que dá certo.

- A sacola nasce com a mesa no servidor (`carts.board_movement_id`).
- O primeiro envio pede o nome, o checkout responde 201 e a mesa ganha um pedido. Os itens entram na conta com o `person` digitado e a composição ("Marina · + Bacon · S/ Alface").
- A sacola consumida é esquecida no aparelho e fica `checked_out` no servidor.
- Dois toques rápidos no envio: um POST e um pedido.
- No tablet deitado, a confirmação na coluna mostra o número lido da conta ("PEDIDO 9").
- O selo segue sem estado, porque o `round_status` só chega com a delivery-api#1754.

### Validado no navegador (2026-11-25), com o checkout simulado

A delivery-api#1631 ainda não existe, então o `POST /cart/{id}/checkout` foi simulado no Playwright: devolve 201 com o `OrderPresenter`, ou corta a rede, ou devolve 422. O resto é real e vem da delivery-api local (restaurante 1, mesa 004): sacola, itens, conta e sessão. **18 de 18 verificações passaram** (`/tmp/indoor-qa-22/qa48.mjs`).

**Celular, 390×844**
- O primeiro envio abre o diálogo do nome e não faz POST antes. Com o nome vazio, aparece o erro e o POST também não sai.
- Com o nome "Marina Souza", sai `{ customer_name: "Marina Souza", shipment_method: "board" }`, só esses dois campos, com `Idempotency-Key` e `x-cart-session-token`. A tela mostra "Pedido enviado, Marina!", e `indoor:cart` é esquecido (RF-10).
- No segundo pedido aparece "Pedindo como Marina Souza · trocar". Dois toques rápidos no envio, com 1,5 s de latência, fazem **um** POST.
- **B1, falha sem resposta:**
  - a rede corta o POST, a sacola passa a voltar `checked_out` e a conexão cai e volta;
  - o "Tentar novamente" continua na tela;
  - o retry sai com **a mesma** `Idempotency-Key` e o mesmo token;
  - o 201 do replay abre a confirmação.
- No 422, a tela mostra "Não foi possível enviar o pedido." com o código `erro 422 · unprocessable_entity`, e não a mensagem da api. O envio seguinte usa chave nova.

**Tablet**
- **Deitado:** na coluna vazia, "Enviar pedido" fica desabilitado. A confirmação aparece na coluna, com "Ver na conta da mesa" e "Continuar no cardápio", e o cardápio segue navegável ao lado.
- **Em pé:** o envio pelo painel mostra a confirmação no painel. Ao fechar por "Continuar no cardápio", o painel não mostra a sacola vazia durante a descida (MutationObserver), o que confirma a correção do M1.

**Não verificado**
- O selo com estado ("Pedido N · estado"): o número já sai com o checkout real (seção acima), o estado depende da delivery-api#1754.
- O roteiro 8 ao vivo, que depende da #58.
- O teclado do tablet e o leitor de tela.
- Na tela do B1, enquanto há tentativa pendente, o celular mostra o vazio da sacola acima do aviso de falha, e o toast "Conexão restabelecida" cobre parte do rodapé. É follow-up para a #50, que é dona dos estados da sacola.

## Follow-ups identificados em review

1. **delivery-api (#1631/#1633):** o checkout não serializa a mesma sacola entre chaves de idempotência diferentes, porque `findByIdForRequester` não tem `lockForUpdate`. O app trava por aparelho; dois aparelhos com o mesmo token não existem (RN-01), mas a garantia é do servidor.
2. **Confirmar com o dev:**
   - a anatomia da confirmação no celular (README ou artboard);
   - o CTA de 54 contra os 56/58 do tablet;
   - "de {nome}" no lugar de "da Marina";
   - o selo "PEDIDO N" mais o `RoundStatusPill`, no lugar do chip único do artboard.
3. **Roteiro 8 ao vivo** ("em preparo" sem reload), quando a #58 entrar.
