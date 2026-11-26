# 05 — Recusas do envio e estados da sacola (vazia, limpando, offline)

**Issue:** [#50](https://github.com/sgrande-delivery/delivery-indoor/issues/50)
**Feature:** [Carrinho e envio do pedido pelo carrinho v2](../spec.md) — issue #22
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 03 (#48)
**Status:** shipped
**Reconciliado com a #21 (2026-11-23):** saiu o `useCanWriteCart()`. A regra de quando o CTA do detalhe aparece ou desabilita é uma só, a da tabela do rodapé da [#43](../../21-indoor-menu-v2/tasks/43-product-detail-composer.md), feita com hooks da fundação; o detalhe não importa nada de `src/components/cart/`. Aqui fica a defesa do `useAddCartItem` (recusa offline sem request) e a mensagem de mesa fechada ao adicionar, anunciada pelo `CartAddActionProvider` da #46.
**Alinhado à delivery-api#1608 (2026-11-23):** os códigos de recusa deixaram de ser proposta e foram fixados lá (RN-11 e a tabela "Recusas do caminho de mesa" do plan): movimentação liberada e fechada são **422**, e não 409, com os nomes propostos aqui. A cozinha fechada ganhou `422 kitchen_closed` (#1767), e o produto que a mesa não vende é `422 product_unavailable` na entrada do item e no checkout (#1766). A **loja fechada com a cozinha aberta não recusa** o pedido de mesa (RN-10 da 1608, o comportamento da v1, com teste), então a trava antes do envio passa a ser **só pela cozinha**: a decisão 3 mudou, e o `restaurant-closed` e o `handleRestaurantState` saíram. A posse da sacola é só pelo `x-cart-session-token` (#1629). Contrato, decisões 1 a 4, armadilhas, testes e critérios atualizados.

## Objetivo

O envio passa a dizer por que não foi. Cada recusa tem mensagem própria e a sacola fica intacta: mesa fechada (com o caminho de ler o QR de novo), cozinha fechada, item indisponível na mesa, loja sem pedidos v2, sacola expirada ou já enviada, e falha de rede. Antes de enviar, o botão trava com o motivo escrito quando a cozinha fecha — ao vivo, pelo socket `/client` — e quando o aparelho fica sem conexão. A loja fechada (`is_open`) não trava: o pedido de mesa segue a cozinha, e não a loja (RN-10 da delivery-api#1608). Entra também o "Limpar" com confirmação nas três molduras.

## Contexto

### Estado atual

- **A 03 já trata falha, de forma genérica.** Ela mostra "Não foi possível enviar o pedido.", o código por `resolveErrorCode` e "Tentar novamente", com a regra de chave (03, decisões 1 e 10). Offline, ela só desabilita o CTA (03, decisão 11).
- **O estado da cozinha** vem de `useRestaurant()`, com `staleTime: Infinity` (`src/hooks/use-restaurant.ts:7-10`). O campo é `is_kitchen_open` (`src/types/restaurant.ts:53-54`, ao lado de `is_open`, que esta task não lê).
- **Não há socket na v2.** `SocketStore` existe (`src/store/socket-store.ts`): o construtor recebe `(url, namespace, app)` (`:23-27`), e `connect(id)` põe `x-restaurant-uuid` no `auth` (`:40-46,85-89`). O `SOCKET_APP` está em `src/constants/constants.ts:1`.
- **Na v1** (`master`), o mesmo estado vinha do socket `/client`:
  - `src/hooks/use-socket-events.tsx`, com `kitchen_state_changed` e um `off` cego no cleanup, que a rule `socket-da-mesa` proíbe;
  - a trava do envio só pela cozinha (`src/components/cart/CartButtonts.tsx:53-56`).

  A #39 apagou os dois e deixou a volta para a #22 e a #23 (`39-remove-fork-inheritance.md`, "Fora de escopo").
- **A mesa** é reavaliada por `useBoardSession().retry()`. Com a movimentação fechada, o provider vai a `no-table`/`closed`, e o gate troca a rota pela tela "Leia o QR code da mesa" (`src/providers/board-session/BoardSessionProvider.tsx:82-89`, #36).
- **Offline:** `useIsOffline()` (`src/providers/connectivity/ConnectivityProvider.tsx:57`). A frase do artboard de offline para ação indisponível é a do pagamento (#38, "Copy").
- **O client** tem o modelo de mapa de falha por `internal_code`: `readCheckoutFailure` em `src/services/checkout.ts:329-420` e `src/services/checkout-rules.ts` @ `ceed49a9`. Ele tem também o "Limpar": `CartClearConfirm.tsx` e o `clear` de `use-cart-actions.ts:91-107`.

### Requisitos cobertos

- **RF-11:** "Limpar" com confirmação.
- **RF-15:** falha mantém a sacola e mostra o motivo, com "tentar novamente".
- **RN-08:** mesa fechada no meio da composição.
- **RN-09** (reescrita em 2026-11-23): cozinha fechada bloqueia o envio, e não a composição. Loja fechada com a cozinha aberta não bloqueia.
- **RN-10:** `403 v2_orders_disabled` com mensagem própria.
- **O plan:** "quatro recusas têm mensagem própria".
- **Os estados da linha do plan:**
  - **vazia:** o "Limpar" leva a ela, e a sacola expirada ou já enviada também;
  - **limpando:** a confirmação, a limpeza em voo e o sucesso parcial;
  - **offline:** o motivo escrito, e todas as escritas da sacola desabilitadas.

  O vazio em si já foi entregue: no celular pela 01, na coluna pela 04.

### Contrato consumido

**As recusas do caminho de mesa**, fixadas na [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) em 2026-11-23 (RN-11 da spec e a tabela "Recusas do caminho de mesa" do plan de lá). Mudar um destes códigos lá é divergência de contrato, e não ajuste de execução. O formato do erro de domínio é `{ status_code, internal_code, error, message, detail }`, e `detail` vem `[]` em produção (`bootstrap/app.php`, render de `CoreDomainException`). O 422 de validação de `FormRequest` tem `internal_code` `unprocessable_entity`, e é isso que o separa das recusas abaixo.

| Caso | Rota | Status | `internal_code` | Fonte |
|---|---|---|---|---|
| Movimentação inexistente ou de outra loja (o mesmo código para os dois) | `POST /cart`, checkout | 404 | `board_movement_not_found_for_cart` | [#1628](https://github.com/sgrande-delivery/delivery-api/issues/1628), [#1633](https://github.com/sgrande-delivery/delivery-api/issues/1633) |
| Movimentação liberada (`freed_at`), conferida **antes** de `is_open` | `POST /cart`, checkout | 422 | `board_movement_freed` | #1628, #1633 |
| Movimentação fechada (`is_open = false`, `freed_at` nulo) | `POST /cart`, checkout | 422 | `board_movement_closed` | #1628, #1633 |
| Produto que o ambiente do carrinho não vende (só de entrega, pausado, categoria fora da mesa) | `POST /cart/{id}/items`, checkout | 422 | `product_unavailable`, com `message` "{nome} não está disponível agora." | [#1766](https://github.com/sgrande-delivery/delivery-api/issues/1766) |
| Cozinha fechada | checkout de mesa | 422 | `kitchen_closed`, com `message` "A cozinha de {loja} está fechada" | [#1767](https://github.com/sgrande-delivery/delivery-api/issues/1767) |
| Loja fechada com a cozinha aberta | checkout de mesa | — | **não recusa**: o pedido de mesa nasce (RN-10 da 1608) | #1767, #1633 |
| Loja sem `uses_v2_orders` | preview, checkout | 403 | `v2_orders_disabled` | `EnsureV2OrdersEnabled.php:41-58` |
| Sacola não achada para o token (outro aparelho, expirada e removida, ou token perdido) | toda rota da sacola | 404 | `cart_not_found` | `CartNotFoundException`; posse só pelo `x-cart-session-token` ([#1629](https://github.com/sgrande-delivery/delivery-api/issues/1629)) |
| Sacola já virou pedido | checkout | 422 | `cart_already_checked_out` | `CartAlreadyCheckedOutException` |
| Produto fora do cadastro | `POST /cart/{id}/items` | 404 | `product_not_found_for_cart` | `src/services/cart.ts:174-180` @ `ceed49a9` |
| Chave em voo | escritas | 409 | `idempotency_key_in_flight` | `IdempotencyKeyInFlightException` |
| Mesma chave com outro corpo | escritas | 422 | `idempotency_key_payload_mismatch` | `IdempotencyKeyPayloadMismatchException` |

**Antes da api subir**, medido em `origin/master` @ `8db44045e`, e sem contorno aqui:

- a cozinha fechada no pedido v2 que não é de entrega sai como **400** `bad_request`, com `error` "A cozinha de {loja} está fechada" (`RestaurantOpeningValidator.php:56-70`), até a #1767;
- a entrada de item cobra `isOfferedIn(EnvironmentEnum::DELIVERY)` fixo (`AddCartItemUseCase.php:84`): na sacola de mesa, o produto **só de mesa** é recusado com `product_unavailable` e o só de entrega entra, até a #1766;
- as três recusas de movimentação não existem: o `POST /cart` ignora o `board_movement_id` até a #1628.

**Socket `/client`**, medido em `delivery-socket-api` `origin/master` @ `efd671e`:

- **Conexão** (`src/nestjs/modules/client/client.gateway.ts`): anônima, com `x-restaurant-uuid` no `handshake.auth`. O gateway entra sozinho na sala do restaurante, e esse é o fluxo que serve aqui.
- **Eventos** (`src/nestjs/modules/restaurant/events.ts:2-3`):
  - `kitchen_state_changed` → `{ is_kitchen_open: boolean }`;
  - **`handleRestaurantState`** → `{ state: boolean }`. A skill `contratos-externos` chamava este de `restaurant_state_changed` (corrigida em 2026-11-23): o nome emitido é `handleRestaurantState`, o mesmo que o `delivery-client` ouve (`src/hooks/use-socket-events.tsx:7` @ `ceed49a9`).
- **Sem replay** (rule `socket-da-mesa`): depois de uma reconexão, reler o REST.

### Decisões

1. **O mapa é por `internal_code`, num módulo puro.** `readSendFailure(error)` devolve `{ kind, message, code, action }`. O status nunca decide sozinho, porque o 404 do header de restaurante errado não traz `internal_code` (aprendizado da 05 da #20).

   | `kind` | Códigos | Mensagem | Ação |
   |---|---|---|---|
   | `table-closed` | `board_movement_not_found_for_cart`, `board_movement_freed` e `board_movement_closed` (decisão 2) | "Esta mesa foi fechada no caixa. Para pedir de novo, leia o QR code da mesa." | "Ler o QR code" → `clearStoredCart()` + `session.retry()` |
   | `kitchen-closed` | `kitchen_closed` (decisão 2) | "A cozinha está fechada agora. Sua sacola fica guardada para quando ela abrir." | sem retry; invalida `restaurantQueryKey` |
   | `item-unavailable` | `product_unavailable`, `product_not_found_for_cart` | o `message` do servidor + " Remova o item para enviar o resto." | sem retry |
   | `orders-disabled` | `v2_orders_disabled` | "Os pedidos pelo app ainda não estão disponíveis nesta loja. Chame o garçom para pedir." | nenhuma |
   | `already-sent` | `cart_already_checked_out` | "Este pedido já foi enviado. Confira na conta da mesa." | `clearStoredCart()`, invalida a conta, e "Ver conta da mesa" |
   | `cart-expired` | `cart_not_found` | "Sua sacola expirou. Monte o pedido de novo." | `clearStoredCart()`: a sacola vazia aparece |
   | `in-flight` | `idempotency_key_in_flight` | "O pedido ainda está sendo enviado. Aguarde um instante." | "Tentar novamente", com a mesma chave |
   | `network` | sem resposta, ou 5xx | "Não foi possível enviar o pedido. Verifique a conexão e tente de novo." | "Tentar novamente", com a mesma chave (03, decisão 1) |
   | `unknown` | qualquer outro, inclusive o 400 `bad_request` da cozinha antes da #1767 | "Não foi possível enviar o pedido." | "Tentar novamente", com chave nova |

   - **O código de suporte só acompanha a falha que o mapa não explica** (revisto em 2026-11-26, pedido do dev; a regra original era RF-11 da #20). `unknown` e `network` mantêm o código pequeno (`resolveErrorCode`); `table-closed`, `kitchen-closed`, `item-unavailable`, `orders-disabled`, `in-flight`, `already-sent` e `cart-expired` saem sem código (`code: null`, tabela exaustiva `SHOWS_CODE`).
   - **A copy é derivada.** O canvas não desenha recusa. Confirmar com o dev.
   - **`restaurant_closed` não entra no mapa** (alinhado em 2026-11-23). Ele é a recusa do checkout **de entrega** (`RestaurantClosedException`), e a sacola de mesa nunca o recebe (RN-10 da 1608). Se um dia chegar, cai em `unknown` com o código visível, e é divergência a reportar, e não recusa a traduzir.
   - **O `already-sent` não manda tentar de novo.** Refazer um pedido que talvez exista é pior que conferir. É a mesma razão do `ALREADY_CHECKED_OUT_MESSAGE` do client.
2. **Os códigos são os da delivery-api#1608, fixados lá** (RN-11 da spec de lá e a tabela "Recusas do caminho de mesa" do plan, 2026-11-23). Esta task os propôs quando a api deixava a escolha para a execução, e a api os adotou com uma correção de status:

   | Caso | Código fixado | Task da api |
   |---|---|---|
   | Movimentação inexistente ou de outra loja, no `POST /cart` e no checkout | 404 `board_movement_not_found_for_cart` | #1628, #1633 |
   | Movimentação liberada (`freed_at`), conferida antes de `is_open` | **422** `board_movement_freed` (a proposta era 409) | #1628, #1633 |
   | Movimentação fechada (`is_open = false`) | **422** `board_movement_closed` (a proposta era 409) | #1628, #1633 |
   | Cozinha fechada, no checkout de mesa | 422 `kitchen_closed` | #1767 |
   | Loja fechada, no checkout de mesa | **não recusa** (a proposta era 422 `restaurant_closed`) | RN-10 da 1608 |

   - **O status não muda o mapa**, porque ele é por `internal_code` (decisão 1). A correção de 409 para 422 segue a convenção da api: 422 para recurso num estado que impede a operação, como `cart_already_checked_out`, e 409 só para concorrência, como `idempotency_key_in_flight`.
   - **A regra de chave da 03 confere:** 422 é resposta registrada, e a próxima tentativa sai com chave nova (03, decisão 1).
   - Se um código mudar lá, é divergência de contrato, e a correção é aqui, no mesmo módulo.
3. **A trava antes do envio (RN-09, reescrita em 2026-11-23).** `useSendBlock()` devolve o primeiro motivo que valer, nesta ordem:
   1. `offline`: "Envio indisponível sem conexão. Chame o garçom para pedir.", no molde da frase de pagamento do artboard de offline;
   2. `kitchen-closed`, com `is_kitchen_open === false`.

   - **O motivo aparece acima do CTA, que fica desabilitado.** A composição continua livre: stepper, lixeira e adicionar seguem valendo, exceto offline (decisão 6).
   - **Restaurante não lido ou com erro não trava.** Quem decide é o servidor, e a falha cai no mapa.
   - **`is_open` não trava, e isso é contrato** (a pendência que esta decisão deixava ao dev foi fechada pela api). O pedido de mesa segue a cozinha, e não a loja (RN-10 da delivery-api#1608, reescrita em 2026-11-23): `is_open` é o "aceitando pedidos" do canal de entrega, a v1 separa os dois (`CreateOrderUseCase.php:131-137`), a v2 também, com teste (`CreateOrderRestaurantOpeningTest::test_board_order_is_created_when_only_the_delivery_is_closed`), e o app de mesa v1 em produção trava só pela cozinha (`CartButtonts.tsx:53-56`). Travar a mesa por `is_open` impediria o salão de pedir quando a loja pausa só a entrega.
4. **Socket `/client` para a cozinha.** `src/hooks/use-restaurant-state-socket.ts` (novo).
   - **Um `SocketStore` no escopo do módulo:** `new SocketStore(process.env.NEXT_PUBLIC_SOCKET, 'client', SOCKET_APP)`.
   - Conecta com `NEXT_PUBLIC_RESTAURANT_UUID`, e só no cliente.
   - **Os listeners:**
     - `kitchen_state_changed` invalida `restaurantQueryKey`, que é o caminho confiável da rule `socket-da-mesa`;
     - `connect` depois de um `disconnect` também invalida: não há replay.
   - **`handleRestaurantState` não é ouvido** (alinhado em 2026-11-23). Ele anuncia `is_open`, e nada da v2 lê esse campo depois que a trava passou a ser só pela cozinha (decisão 3). Um listener sem leitor seria um `GET /restaurants` a mais a cada pausa da entrega.
   - **Um `off` por `on`**, com a mesma referência de handler.
   - **O `/client` não é o `/board`.** A sala do restaurante aqui só recebe abertura de loja, cozinha e histórico de pedido inscrito. A proibição da rule é de entrar na sala do restaurante no namespace `/board`.
   - **Montagem:** um componente que não renderiza nada, `RestaurantStateListener`, em `src/App.tsx`, dentro do `QueryClientProvider`.
5. **Mesa fechada (RN-08).**
   - **Recusa no checkout:** ao receber `table-closed`, o rodapé mostra a mensagem e a ação "Ler o QR code".
     - A ação esquece a sacola, que pertence a uma movimentação que não recebe mais pedido.
     - Depois, chama `session.retry()`. O provider relê a movimentação, vê `is_open: false`, e o gate mostra "Leia o QR code da mesa" (#36). Não há segunda tela de mesa fechada.
   - **Recusa ao adicionar** (o `POST /cart` da #1628): a mesma mensagem, em toast, com a mesma ação. Quem anuncia é o `CartAddActionProvider` da #46, dono das falhas ao adicionar; o detalhe da #43 só fica aberto.
6. **Offline desabilita todas as escritas da sacola**, e não só o envio: a mutação nasceria pausada e dispararia quando a rede voltasse (aprendizado da 07 da #20).
   - O `isPending` de `useCartActions` passa a incluir `useIsOffline()`, para stepper, lixeira e "Limpar" ficarem inertes.
   - `useAddCartItem` recusa offline sem request. É defesa do hook: o CTA do detalhe da #21 já fica desabilitado offline pela tabela do rodapé da #43, que lê `useIsOffline()` da fundação. Não há `useCanWriteCart()` exportado para lá — seria a #21 importando a sacola, e uma segunda regra para o mesmo botão.
   - A sacola lida continua na tela, sob o banner da 07.
7. **"Limpar" (RF-11).**
   - **A ação** é a porta do `clear` de `use-cart-actions.ts:91-107` @ `ceed49a9`:
     - `DELETE` por item, **em série**, porque não há rota de esvaziar;
     - releitura no `onSettled`, porque o sucesso parcial mostra o que sobrou;
     - toasts "Sacola limpa." e "Não foi possível limpar a sacola inteira. Veja o que ficou.".
   - **A confirmação** é a porta de `CartClearConfirm.tsx`, no `Overlay`:
     - título "Limpar a sacola?";
     - aviso "O item sai da sua sacola e não dá para desfazer." / "Os {n} itens saem da sua sacola e não dá para desfazer.";
     - "Cancelar" e "Limpar".

     O botão destrutivo fica desabilitado com qualquer escrita em voo, e com spinner na limpeza.
   - **O "Limpar"** é texto em `error.main`, 13/700, com alvo de 44, como nos artboards. Ele vai em três lugares:
     - no `CartHeader` do celular;
     - no slot do cabeçalho da coluna (04);
     - na `action` do cabeçalho do painel (04).

     Ele só aparece com itens e sem envio em voo.
8. **A forma da recusa.** É um bloco no rodapé, acima do CTA (`SendFailureNotice`, da 03, trocado por este mapa), com `role="alert"`.
   - Para quem precisa de ação, a ação vai no bloco (alvo de 44).
   - Os que esvaziam a sacola (`already-sent` e `cart-expired`) viram **toast**, porque o rodapé some com a sacola vazia.
   - No primeiro envio pelo diálogo, a 03 já fecha o diálogo na falha, e o bloco aparece no rodapé.

### Armadilhas

- **`bad_request` não é código de cozinha.** Casar a mensagem "A cozinha de … está fechada" por texto quebraria com a primeira mudança de copy na api. Até a #1767 trocar o 400 por `kitchen_closed`, a trava da decisão 3 é quem evita o envio com a cozinha fechada, e o `bad_request` cai em `unknown`, com o código visível.
- **Produto só de mesa recusado ao adicionar, antes da #1766.** A entrada de item cobra o ambiente de entrega fixo, então o QA vê `product_unavailable` num produto que o cardápio da mesa mostra. É a api, e a mensagem do servidor aparece como está.
- **A cozinha que abre com a recusa na tela.** O bloco `kitchen-closed` sai quando a releitura do restaurante voltar com `is_kitchen_open: true`. Ele é derivado do estado, não fica preso.
- **O `connect` inicial não é reconexão.** Só invalidar depois de ter havido `disconnect`, como o `hasDisconnectedRef` do client. Senão todo boot faz dois `GET /restaurants`.
- **`off('connect', handler)` com a referência.** O `off('connect')` cego derruba o listener interno do `SocketStore` (rule `socket-da-mesa`).
- **A recusa de conexão é silenciosa** (`connect` seguido de `disconnect`). Antes de suspeitar dos listeners, conferir `isConnected`.
- **O `clear` remove o que a tela viu.** Ele recebe os ids da sacola **lida**: item adicionado em outra aba no meio da limpeza fica, e a releitura mostra.

## Mudanças

### 1. Mapa de recusa

`src/components/cart/send-failure.ts` (novo, puro): `readSendFailure`, `SendFailureKind` e as tabelas das decisões 1 e 2.

O módulo lê o código pelo `readErrorCode` de `src/services/api-error-interceptor.ts:22`. **Não recriar o leitor.**

### 2. Bloco da recusa

`src/components/cart/SendFailureNotice.tsx` (alterado, criado pela 03):

- recebe o `SendFailure`;
- desenha a mensagem, o código (só em `unknown` e `network`, decisão 1) e a ação da tabela;
- para `network`, `in-flight` e `unknown`, a ação é "Tentar novamente", que chama o `send` da 03 com a regra de chave dela.

### 3. Trava antes do envio

`src/components/cart/use-send-block.ts` (novo): a decisão 3.

- **`CartFooter`** (alterado, 03): mostra a frase do motivo e passa `disabled` ao `CartSendButton`.
- **`use-send-order.ts`** (alterado, 03): ganha a ação de `table-closed`, e as de `already-sent` e `cart-expired` (esquecer a sacola e invalidar).

### 4. Socket da cozinha

- **`src/hooks/use-restaurant-state-socket.ts`** (novo): a decisão 4.
- **`src/components/restaurant/RestaurantStateListener.tsx`** (novo): chama o hook e devolve `null`.
- **`src/App.tsx`** (alterado): `<RestaurantStateListener />` dentro do `QueryClientProvider`, antes do `ThemeProvider`. Uma linha e um import.

### 5. Offline nas escritas

- **`src/components/cart/use-cart-actions.ts`** (alterado, 01): `isPending` com `useIsOffline()`.
- **`src/components/cart/use-add-cart-item.ts`** (alterado, 01): recusa offline sem request (defesa; a regra da tela é a da #43).
- **`src/components/cart/CartAddActionProvider.tsx`** (alterado, 01): a recusa `table-closed` do `POST /cart` vira o toast da decisão 5, ao lado das outras falhas ao adicionar que a 01 já anuncia.

### 6. "Limpar"

- **`src/components/cart/use-cart-actions.ts`** (alterado): `clear` e `isClearing` (decisão 7).
- **`src/components/cart/CartClearConfirm.tsx`** (novo): a porta da confirmação.
- **`src/components/cart/CartClearAction.tsx`** (novo): o botão de texto. É montado em:
  - `CartHeader.tsx` (01);
  - `dock/CartColumnHeader.tsx` (04);
  - a `action` do cabeçalho de `dock/CartSheet.tsx` (04).

## Testes

Não há suíte automatizada.

Os casos 3, 4 e 7 dependem da [delivery-api#1631](https://github.com/sgrande-delivery/delivery-api/issues/1631), da [#1633](https://github.com/sgrande-delivery/delivery-api/issues/1633) e da [#1767](https://github.com/sgrande-delivery/delivery-api/issues/1767) no ambiente, o caso 6 depende da [#1766](https://github.com/sgrande-delivery/delivery-api/issues/1766), e o caso 2 depende da [#1628](https://github.com/sgrande-delivery/delivery-api/issues/1628). Até lá, a lógica do mapa se confere pelo item 5 dos estáticos, e o caso real roda no harness `.indoor-qa` contra a branch da api.

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui.
4. `grep -rn "socket.off(\|socket.on(" src/hooks/use-restaurant-state-socket.ts`: mesmo número de `on` e `off`, todos com handler.
5. `readSendFailure` por `jiti`, com erros axios montados à mão para cada linha da tabela da decisão 1, inclusive o 404 **sem** `internal_code`. Esperado: o `kind` da tabela, o sem código em `unknown`, e `code: null` nas recusas conhecidas (decisão 1, revista em 2026-11-26).

**No navegador**, com `?session=<uuid-aberto>`, a sacola com dois itens e nome salvo:

1. **Celular, "Limpar".** Esperado:
   - "Limpar a sacola?" com "Os 2 itens saem…";
   - "Limpar" faz dois `DELETE` em série e uma releitura;
   - o toast "Sacola limpa.", e a sacola vazia da 01.
   - Repetir com a API derrubada depois do primeiro `DELETE`: "Não foi possível limpar a sacola inteira. Veja o que ficou.", e a lista com o item que sobrou.
2. **Liberar a mesa no PDV** (ou `UPDATE board_movements SET is_open = 0, freed_at = NOW() WHERE id = '<uuid>'`) e tocar "Enviar pedido". Esperado:
   - a mensagem de mesa fechada, sem o código (decisão 1, revista em 2026-11-26);
   - "Ler o QR code" esquece `indoor:cart`, e a rota troca para "Leia o QR code da mesa".
3. **Fechar a cozinha no admin com a sacola aberta.** Esperado:
   - sem reload, o CTA desabilita com "A cozinha está fechada agora…";
   - stepper e lixeira continuam vivos;
   - reabrir destrava.
   - No Network, um `GET /restaurants` por evento, e nenhum na conexão inicial.
   - Com a trava burlada (o `is_kitchen_open` mudado no banco sem evento), o envio recebe `422 kitchen_closed` e mostra a mesma mensagem.
4. **Fechar a loja (`is_open`) com a cozinha aberta.** Esperado: **nenhuma** trava, nenhum `GET /restaurants` pelo evento da loja, e o envio cria o pedido (201), que entra na conta (RN-10 da 1608).
5. **Derrubar o socket** (parar o `delivery-socket-api`), mudar a cozinha, e subir de novo. Esperado: na reconexão, um `GET /restaurants`, e o estado certo.
6. **Pausar no admin um produto da sacola, ou tirá-lo do ambiente mesa, e enviar.** Esperado: `422 product_unavailable` e "{nome} não está disponível agora. Remova o item para enviar o resto.", com a sacola intacta. Adicionar ao detalhe um produto que a mesa não vende (por `curl` no `POST /cart/{id}/items`) responde o mesmo código.
7. **Loja de teste com `uses_v2_orders` desligado.** Esperado: a mensagem de pedidos indisponíveis, sem "Tentar novamente".
8. **Sacola expirada:** apagar o carrinho no banco (ou trocar o token guardado) e enviar. Esperado: o toast "Sua sacola expirou…", e a sacola vazia.
9. **Já enviada:** mandar o checkout de novo por `curl` com **outra** chave, para a mesma sacola. Esperado: na tela, o toast "Este pedido já foi enviado…", com "Ver conta da mesa".
10. **Offline (DevTools offline).** Esperado:
    - o banner da 07 aparece;
    - o CTA desabilita com "Envio indisponível sem conexão…";
    - stepper, lixeira e "Limpar" inertes.
    - Voltar a rede destrava, e **nenhuma** escrita dispara sozinha.
11. **Falha de rede no meio do envio** (03, roteiro 5). Esperado: "Não foi possível enviar o pedido. Verifique a conexão…", e "Tentar novamente" com a mesma chave.
12. **Tablet nas duas orientações.** Esperado: o "Limpar" no cabeçalho da coluna e no do painel, e os blocos de recusa no rodapé dos dois.

## Critérios de aceitação

- [x] Cada linha da tabela da decisão 1 produz a mensagem dela. Só `unknown` e `network` levam o código de suporte (revisto em 2026-11-26, decisão 1). Erro sem `internal_code` cai em `unknown`, e nunca numa recusa específica.
- [ ] Com a movimentação liberada, o envio mostra a mensagem de mesa fechada, e "Ler o QR code" leva à tela "Leia o QR code da mesa" sem sacola guardada.
- [ ] Com a cozinha fechada, o CTA trava com o motivo, sem reload, e a composição continua livre. A abertura destrava. Com a loja fechada e a cozinha aberta, nada trava e o envio cria o pedido.
- [ ] O socket `/client` ouve só `kitchen_state_changed`, com um `off` por `on`, e relê o restaurante depois de reconectar.
- [x] `readSendFailure` não tem `restaurant-closed`: `restaurant_closed` cai em `unknown`.
- [ ] `403 v2_orders_disabled` tem mensagem própria, sem "Tentar novamente".
- [ ] `cart_already_checked_out` e `cart_not_found` esquecem a sacola e dizem o motivo. O primeiro não manda refazer.
- [ ] Offline nenhuma escrita da sacola dispara, e o motivo está escrito acima do CTA.
- [ ] "Limpar" pede confirmação, apaga em série, e mostra o que sobrou no sucesso parcial, nas três molduras.
- [x] O mapa lê exatamente os códigos da tabela "Recusas do caminho de mesa" da delivery-api#1608: `board_movement_not_found_for_cart`, `board_movement_freed`, `board_movement_closed`, `product_unavailable` e `kitchen_closed`.
- [x] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- ~~Corrigir a skill `contratos-externos`~~ — feito em 2026-11-23 (nome `handleRestaurantState`; os códigos de recusa do carrinho de mesa ficam na seção "Contratos especificados, ainda não publicados", apontando para a 1608).
- **Implementar as recusas na api:** delivery-api#1628, #1633, #1766 e #1767. Conferir `is_open` no pedido de mesa **não** é pedido de ninguém: a RN-10 da 1608 o recusa.
- **A disponibilidade pelo ambiente do carrinho**, na entrada do item e no checkout: delivery-api#1766. Aqui só a mensagem do `product_unavailable`.
- **Tela própria de "mesa fechada":** o `NoTableScreen` da #36 é a tela.
- **Detectar a mesa fechada em tempo real**, sem tentar enviar: socket `/board` da #23 (task 06).
- **Cupom, pedido mínimo e regras de entrega:** não se aplicam à mesa.

## Branch

`task/50-send-refusals-cart-states`, cortada em 2026-11-25 de `task/48-send-order-confirmation` (`edf4263`, commit local), que junta a #49 e a #55 por cima da `feat/indoor-v2`. Antes do PR, ela é rebaseada na `feat/indoor-v2`, depois que a #48 e as bases dela entrarem.

**Rebase de 2026-11-26:** a #49 e a #55 já entraram na `feat/indoor-v2`, e a #48 está em revisão no PR #90 (`task/48-send-order-confirmation` @ `545bd11`). A branch foi rebaseada sobre ela, sem conflito, e o PR desta task sai **empilhado** com base `task/48-send-order-confirmation`. O repo não apaga a branch no merge (`delete_branch_on_merge: false`), então o GitHub não troca a base sozinho: depois que o #90 entrar, a base deste PR passa à mão para `feat/indoor-v2`. Como o merge é por merge commit, os commits da #48 já estarão lá e o diff não muda.

**Contrato medido depois da escrita desta task (2026-11-25):**
- No `PATCH` e no `DELETE /cart/items/{itemId}`, a sacola de outro token ou o item que sumiu respondem **404 `cart_item_not_found`**, e não `cart_not_found`. É o desenho da #533 da delivery-api, confirmado na #1629 de lá. O mapa desta task inclui esse código, que relê a sacola como o `cart_not_found`.
- Há dois follow-ups da #48 para esta task, que é dona dos estados da sacola:
  - no celular, com uma tentativa de envio pendente e a sacola já `checked_out`, o corpo mostra o vazio acima do aviso de falha;
  - o toast global "Conexão restabelecida" cobre parte do rodapé da sacola.

## Implementação

**Concluída em:** 2026-11-25

### Camadas tocadas

- **Serviço:** `src/services/cart.ts` ganha `isCartItemNotFound` (e `cart_item_not_found` entra em `CART_FAILURE_CODES`, para não ser lido como recusa de item).
- **Mapa:** `src/components/cart/send-failure.ts` (novo, puro): `readSendFailure`, `isTableClosedError` e as copies.
- **Rodapé:** `SendFailureNotice.tsx` (recebe o `SendFailure`), `SendBlockNotice.tsx` (novo), `CartFooter.tsx`, `send-metrics.ts`.
- **Hooks do envio:** `use-send-order.ts` (ações por `kind` no `onError`, e recusa com limpeza em voo), `use-send-block.ts`, `use-read-table-qr.ts`, `use-send-status.ts` (todos novos exceto o primeiro), `send-store.ts` (`resetSendState`).
- **Socket:** `src/hooks/use-restaurant-state-socket.ts`, `src/components/restaurant/RestaurantStateListener.tsx`, `src/App.tsx`.
- **Escritas da sacola:** `use-cart-actions.ts` (`clear`, `isClearing`, barreira global por `useIsMutating`, offline), `use-add-cart-item.ts` (recusa offline), `CartAddActionProvider.tsx` (toast de mesa fechada), `cart-query.ts` (chaves de mutação).
- **"Limpar":** `CartClearAction.tsx` e `CartClearConfirm.tsx` (novos), montados em `CartHeader.tsx`, `dock/CartColumn.tsx` (slot `action` do `CartColumnHeader`) e `dock/TabletCartDock.tsx` (slot `action` do `CartSheet`).
- **Follow-ups da #48:** `CartSendPending.tsx` (novo) e `CartPanel.tsx`; `ConnectivityProvider.tsx` (`useRestoredToastAnchor`), registrado em `CartScreen`, `CartColumn` e `CartSheet`.
- Nada em `src/theme/` nem em `src/components/ui/`.

### Contratos consumidos

Conferidos na `delivery-api`, branch `feature/1608-client-board-cart-checkout` (tabela "Recusas do caminho de mesa" do plan e as exceções em `core/`): nenhuma divergência de código, status ou campo.

| `internal_code` | Status | `kind` | Copy | Ação |
|---|---|---|---|---|
| `board_movement_not_found_for_cart` | 404 | `table-closed` | "Esta mesa foi fechada no caixa. Para pedir de novo, leia o QR code da mesa." | "Ler o QR code": `clearStoredCart()`, esquece a falha e `session.retry()` |
| `board_movement_freed` | 422 | `table-closed` | idem | idem |
| `board_movement_closed` | 422 | `table-closed` | idem | idem |
| `kitchen_closed` | 422 | `kitchen-closed` | "A cozinha está fechada agora. Sua sacola fica guardada para quando ela abrir." | sem retry; grava `is_kitchen_open: false` no cache, invalida o restaurante e a trava do CTA mostra a frase |
| `product_unavailable` | 422 | `item-unavailable` | `message` do servidor + " Remova o item para enviar o resto." | nenhuma |
| `product_not_found_for_cart` | 404 | `item-unavailable` | "Um item da sacola não está disponível agora. Remova o item para enviar o resto." (o `message` é técnico e não passa) | nenhuma |
| `v2_orders_disabled` | 403 | `orders-disabled` | "Os pedidos pelo app ainda não estão disponíveis nesta loja. Chame o garçom para pedir." | nenhuma |
| `cart_already_checked_out` | 422 | `already-sent` | "Este pedido já foi enviado. Confira na conta da mesa." | toast com "Ver conta da mesa"; esquece a sacola e invalida a conta |
| `cart_not_found` | 404 | `cart-expired` | "Sua sacola expirou. Monte o pedido de novo." | toast; esquece a sacola |
| `cart_item_not_found` | 404 | `cart-expired` | idem | idem; nas escritas de item (`PATCH`/`DELETE`) só relê a sacola, como o `cart_not_found` |
| `idempotency_key_in_flight` | 409 | `in-flight` | "O pedido ainda está sendo enviado. Aguarde um instante." | "Tentar novamente", mesma chave |
| sem resposta, ou 5xx | — | `network` | "Não foi possível enviar o pedido. Verifique a conexão e tente de novo." | "Tentar novamente", mesma chave |
| qualquer outro (404 sem `internal_code`, `bad_request`, `restaurant_closed`, 422 de validação) | — | `unknown` | "Não foi possível enviar o pedido." | "Tentar novamente", chave nova |

A trava antes do envio (`useSendBlock`): offline ("Envio indisponível sem conexão. Chame o garçom para pedir.") e `is_kitchen_open === false`. `is_open` não trava.

Socket `/client`: só `kitchen_state_changed` (invalida `['restaurant']`) mais `connect`/`disconnect` para reler depois de uma queda. Três `on` e três `off`, com a mesma referência.

### Variáveis de ambiente novas

- Nenhuma. O socket lê `NEXT_PUBLIC_SOCKET` e `NEXT_PUBLIC_RESTAURANT_UUID`, que já existiam.

### Decisões que tomei por conta própria

- **`already-sent` e `cart-expired` não ficam no estado do envio**: viram toast e esvaziam a sacola (`isAnnouncedByToast` em `use-send-order.ts`). A `kitchen-closed` **fica guardada** em `send-store`, e o rodapé a esconde por `isKitchenCovered` quando o restaurante está no cache, porque a trava do CTA (estado derivado) já a diz; sem o restaurante no cache, o rodapé mostra a falha. Consequência: no toast, o código de suporte não aparece.
- **A cozinha recusada grava `is_kitchen_open: false` no cache antes de reler.** Sem isso o CTA continuaria habilitado se a `GET /restaurants` voltasse antes de o servidor refletir o estado, e o cliente tocaria sem ver nada. A releitura corrige se o cache estiver errado.
- **A barreira das escritas é global (`useIsMutating`) e não por instância.** O "Limpar" mora no cabeçalho, fora do `CartPanel`, e não compartilha o `useCartActions` da lista. Toda escrita da sacola (quantidade, remover, limpar, adicionar) leva a mesma `mutationKey`. Efeito colateral: o stepper também fica inerte enquanto o detalhe adiciona.
- **A limpeza em voo trava o envio** (CTA desabilitado e guarda no `run`), e o envio em voo esconde o "Limpar".
- **Os avisos do "Limpar" são do `onSuccess`/`onError` da mutação, e não do `mutate`**, porque a sacola vazia desmonta o botão e o callback do `mutate` morreria com ele.
- **A confirmação guarda a contagem confirmada**, para não mostrar "Os 0 itens" enquanto desce. A contagem é de linhas da sacola, e não da soma das quantidades.
- **"Limpar": 12/700 no celular (`cartHeaderMetrics.clearFontSize`) e 13/700 nos dois do tablet**, porque os artboards desenham assim (a task dizia 13 para os três). Alvo de 44 pelo `touchTargetArea`.
- **Botão da confirmação:** `Button variant="destructive"` e "Cancelar" `neutral`, no rodapé do `Overlay`. O título vai no `header` do `Overlay`.
- **Follow-up da #48, vazio acima da falha:** com tentativa pendente e sacola `null`, o corpo mostra `CartSendPending` ("Seu pedido pode já ter saído", com o convite ao "Tentar novamente"), nas três molduras, e não o `CartEmpty`. A copy é minha e precisa de confirmação.
- **Follow-up da #48, toast cobrindo o rodapé:** o "Conexão restabelecida" (sem âncora) agora sobe da âncora registrada por `useRestoredToastAnchor`, escolhendo a que está visível (a coluna e o painel ficam montados juntos, um oculto por CSS).
- **`isCartItemRejected` passou a tratar `cart_item_not_found` como falha de sacola**, não de item, junto com `cart_not_found`.
- **Só a recusa `item-unavailable` sem tentativa pendente sai do `send-store` quando a sacola perde item** (`dismissAnsweredFailure`: no remover e a cada `DELETE` do "Limpar" que passa, cobrindo o sucesso parcial). Mesa fechada, loja sem v2 e cozinha fechada ficam, porque a api não as confere nas escritas de item; mudar a quantidade também não descarta (o stepper para no 1 e o `product_unavailable` é por produto). A falha com tentativa pendente fica intacta (B1 da #48).
- **"Ler o QR code" também zera a falha do `send-store`**, senão ela reapareceria na sacola da próxima mesa.
- **Toast de offline ao adicionar:** "Sem conexão. Adicione de novo quando a internet voltar." (copy minha).

### Como testar

1. `yarn dev` com `.env.development`, `http://localhost:3000/?session=<uuid-aberto>`, a api na branch `feature/1608-client-board-cart-checkout`.
2. Seguir o roteiro "No navegador" desta task (1 a 12), mais:
   - com uma tentativa de envio pendente (rede cortada no `POST` do checkout e a sacola `checked_out`), o celular mostra "Seu pedido pode já ter saído" e o aviso com "Tentar novamente", e não o vazio;
   - ficar offline e voltar na sacola: o "Conexão restabelecida" sobe acima do rodapé, e não sobre o CTA.
3. Estático do mapa: `readSendFailure` conferido por `jiti` com erros axios montados à mão para cada linha da tabela, inclusive 404 sem `internal_code`, `restaurant_closed` e erro que não é axios.

### O que NÃO foi verificado

Atualizado em 2026-11-26, depois das duas validações abaixo.

- **O socket `/client` ao vivo** (um `GET /restaurants` por evento, nenhum no boot, releitura depois da queda) foi conferido só por leitura do código, porque o socket não sobe na máquina local.
- **`409 idempotency_key_in_flight` vindo do servidor**, só com o checkout simulado.
- **O "Limpar" parcial com a recusa de item na tela** e a **`kitchen-closed` sem o restaurante no cache**, só por leitura do código (segunda passada do review).
- O foco depois do "Limpar" na folha do celular, e o leitor de tela.

### Validado no navegador (2026-11-25), com o checkout simulado

A delivery-api#1631 ainda não existe, então o checkout foi simulado no Playwright com cada recusa da tabela. A sacola, o restaurante e a cozinha vêm da delivery-api local. **18 de 18 verificações passaram** (`/tmp/indoor-qa-22/qa50.mjs`), e o roteiro da #48 também passou contra esta branch, porque o envio dela continua igual.

**Recusas no celular**
- `board_movement_freed`: "Esta mesa foi fechada no caixa…", com o código `erro 422 · board_movement_freed` e a ação "Ler o QR code". A mensagem técnica da api não aparece.
- `kitchen_closed`: a frase da cozinha aparece logo depois da recusa.
- `product_unavailable`: o `message` do servidor seguido de "Remova o item para enviar o resto.".
- `v2_orders_disabled`: mensagem própria, sem "Tentar novamente".
- `cart_already_checked_out`: "Este pedido já foi enviado", e a sacola é esquecida.
- `cart_not_found`: "Sua sacola expirou", e a sacola é esquecida.
- `409 idempotency_key_in_flight`: a mensagem aparece, e o "Tentar novamente" sai com **a mesma** chave.

**Estados**
- **Cozinha fechada, pelo banco local** (`is_kitchen_open = 0`):
  - o CTA trava com "A cozinha está fechada agora…";
  - a composição segue livre;
  - com a cozinha reaberta, o CTA destrava.
- **Offline:** o CTA trava com "Envio indisponível sem conexão…", junto com o banner da fundação.
- **"Limpar", no celular e no tablet deitado:**
  - a confirmação aparece em folha e em painel, com "Os 2 itens saem da sua sacola e não dá para desfazer";
  - confirmar esvazia a sacola;
  - o foco volta ao painel da sacola (`[data-cart-panel]`), como pede o m5.

**Não verificado**
- O checkout real e os códigos vindos do servidor de verdade. Isso fecha com a delivery-api#1631 e a #1633.
- A cozinha mudando ao vivo pelo socket `/client`, porque o socket não sobe na máquina local.
- O "Ler o QR code" até a tela "Leia o QR code da mesa" com a mesa liberada de verdade.
- Leitor de tela.

### Validado contra a delivery-api real (2026-11-26)

A api local estava na branch `feature/1608-client-board-cart-checkout` (#1628 a #1633), com o restaurante 1 e as mesas 003 e 004. Cada recusa foi provocada no banco local, que foi restaurado depois. O vídeo está em `/tmp/indoor-qa-50/video/`, com um combinado e um arquivo por cenário, e o script é o `video50.mjs`.

| # | Cenário | Resposta da api | Na tela |
|---|---|---|---|
| 1 | A cozinha fecha com a sacola aberta | `422 kitchen_closed` | o CTA trava com o motivo; com a cozinha reaberta, o mesmo pedido sai (201, +1 pedido) |
| 2 | O X Salada sai do cardápio da mesa | `422 product_unavailable` | o `message` da api e "Remova o item…"; remover o item tira o aviso, e o resto sai (201) |
| 3 | O caixa fecha a mesa 003 | `422 board_movement_closed` | a mensagem, o código e "Ler o QR code", que leva a "Leia o QR code da mesa" |
| 4 | A sacola é enviada por fora | `422 cart_already_checked_out` | o toast com "Ver conta da mesa"; a sacola é esquecida, sem pedido em dobro |
| 5 | A sacola é removida na api | `404 cart_not_found` | o toast "Sua sacola expirou" e a sacola vazia |
| 6 | `uses_v2_orders = 0` | `403 v2_orders_disabled` | a mensagem própria, sem "Tentar novamente" |
| 7 | A loja fecha com a cozinha aberta | 201 | o envio não trava, e o pedido sai (RN-10 da 1608) |
| 8 | O aparelho fica offline | — | o CTA trava com o motivo; quando a conexão volta, aparece "Conexão restabelecida" e o CTA destrava |
| 9 | "Limpar" no celular e no tablet deitado | `DELETE` por item | a confirmação em folha e em painel; a sacola fica com 0 itens na api |

**Achado e corrigido nesta validação:** o aviso de `product_unavailable` continuava acima do CTA depois que o cliente removia o item. A correção é o `dismissAnsweredFailure`, decidida acima e aprovada na segunda passada do review. A conferência dela, contra a api (`qa-dismiss.mjs`), passou nas 6 verificações:
- `v2_orders_disabled` fica depois de remover um item;
- `board_movement_closed` fica depois de remover um item, e o "Ler o QR code" também;
- `product_unavailable` fica depois do "+" em outro item e sai quando o item é removido;
- a falha de rede, com o "Tentar novamente", fica depois de remover um item.

**Observado, fora do escopo:** no tablet, o toast ocupa a largura toda da tela e atravessa a coluna da sacola. O `Toast` do design system não tem largura máxima, e já era assim na #49. A correção é no `delivery-client`, e chega pelo sync.

### Correções aplicadas em review

- `src/components/cart/send-store.ts`: o JSDoc de `dismissAnsweredFailure` (142 colunas) quebrado em três linhas, no `printWidth` de 120 que o resto do arquivo segue. Sem mudança de texto.
- Review da revisão do código de suporte (2026-11-26), só nesta task:
  - "Mudanças", item 2: o bloco desenha o código só em `unknown` e `network`;
  - roteiro do navegador, caso 2: a mesa fechada aparece **sem** o código. Antes dizia "com o código", e o QA reprovaria o comportamento certo;
  - follow-up 8: entrou o `BoardSessionError.tsx`, que o grep por `resolveErrorCode` não acha. O `use-error-report.ts:40` ficou marcado como payload de log, e não como tela.

## Follow-ups identificados em review

1. **A falha da tentativa A fica visível acima do CTA da sacola B**, e o "Tentar novamente" ali é ambíguo. Vem do desenho do B1 da #48 (a tentativa e a falha vivem no módulo, por aparelho).
2. **O envio em voo não entra na barreira das escritas:** stepper e lixeira seguem vivos durante o checkout. O caminho é `useSendStatus().isSending` dentro do `isPending` de `useCartActions`.
3. **delivery-api:** o `kitchen_state_changed` sai dentro do `DB::transaction`, antes do commit (`OpenClosedRestaurantKitchenUseCase.php:42-46`). Emitir depois do commit, senão o cliente relê o estado antigo.
4. **Rule `socket-da-mesa`:** o "não entre na sala do restaurante" vale para o `/board`. Texto proposto: "No `/board` não entre na sala do restaurante. O `/client` entra nela sozinho pelo handshake, e a sala só leva abertura de loja, cozinha e o histórico de pedido inscrito: pode ouvi-la."
5. **Confirmar com o dev:**
   - a copy do `CartSendPending` e a do offline ao adicionar;
   - ~~a falta do código de suporte nos toasts e na trava~~: decidido em 2026-11-26, a recusa conhecida não mostra código (decisão 1);
   - a frase de motivo acima do CTA, quando o artboard de offline a desenha abaixo.
6. **A escrita em voo não trava o envio** (o inverso do item 2). O `run` de `use-send-order.ts` só recusa com o `CART_CLEAR_MUTATION_KEY`, e o `isDisabled` do `CartFooter` não olha escrita: com um `PATCH`, `DELETE` ou adição em voo, o envio sai com a foto da sacola lida, e o servidor fecha a sacola dele. Efeitos: a tela de pedido enviado lista `attempt.items`, que pode não ser o que foi para a cozinha (o `PlacedOrder` não traz itens), e o `onSuccess` do remover que chega depois de um `422 product_unavailable` descarta a recusa nova pelo `dismissAnsweredFailure`. O caminho: `run` recusar com `isMutating({ mutationKey: CART_WRITE_MUTATION_KEY }) > 0` (prefixo, cobre o "Limpar") e o CTA desabilitar com escrita em voo; com o item 2, envio e escrita não se cruzam mais.
7. **O "Tentar novamente" depois de uma escrita reenvia a foto velha.** Com tentativa pendente, a escrita que dá certo na mesma `cartId` prova que a sacola ainda está aberta, e a tentativa fica (B1 da #48); o `retry` então manda a mesma chave, o servidor fecha a sacola **atual**, e a tela de enviado mostra os itens e a contagem da foto. O caminho: o `retry` atualizar `items`/`itemCount` da tentativa a partir da sacola lida quando ela é a mesma `cartId` e está `open`, mantendo a chave.
8. **Mapear as telas do app que mostram código técnico ao cliente e decidir caso a caso** (decisão do dev, 2026-11-26). Ponto de partida, medido por grep:
   - `src/components/error/RouteErrorState.tsx:49`;
   - `src/components/error/ErrorPage.tsx:178` (variante `server-error`, `Reference`);
   - `src/components/product/sheet/ProductSheetDialog.tsx:231`, no erro de preço;
   - `src/components/product/sheet/ProductSheetDialog.tsx:256`, na tela de erro;
   - `src/components/search/ingredients/IngredientList.tsx:63`;
   - `src/components/board-session/BoardSessionError.tsx:59` e `:70` ("Código erro 404 · …", no `role="alert"` e na tela). Monta o código à mão, com `readErrorCode`, e por isso o grep por `resolveErrorCode` não o acha;
   - `src/components/error/use-error-report.ts:40` não é tela: é o `code` do payload do `/api/log`. Ele fica, seja qual for a decisão sobre a tela.
9. **A exceção do código ainda não chegou às outras fontes que dizem "todo erro".** A RF-11 da #20 (`.claude/sdd/20-indoor-v2-foundation/spec.md:41`), o modo de falha 17 do `code-reviewer-typescript` (`.claude/agents/code-reviewer-typescript.md:92`, "com o código do erro visível") e a decisão do erro do detalhe na #43 ("rule `busca-de-dados`: todo erro mostra o código") seguem absolutos. Hoje a rule vence, mas o revisor lê o modo 17 ao pé da letra. Alinhar junto com o item 8.
10. ~~**`readSendFailure` ainda devolve código em `already-sent` e `cart-expired`**~~ — resolvido no mesmo diff: `KINDS_WITHOUT_CODE` virou a tabela exaustiva `SHOWS_CODE: Record<SendFailureKind, boolean>`, só `network` e `unknown` com `true`.
