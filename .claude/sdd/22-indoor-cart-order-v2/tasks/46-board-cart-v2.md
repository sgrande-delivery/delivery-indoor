# 01 — Carrinho v2 da mesa: criação com `board_movement_id`, token de sessão, itens e totais

**Issue:** [#46](https://github.com/sgrande-delivery/delivery-indoor/issues/46)
**Feature:** [Carrinho e envio do pedido pelo carrinho v2](../spec.md) — issue #22
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** #20 (na base); #21 — task 01 ([#40](../../21-indoor-menu-v2/tasks/40-catalog-v2-services-types.md): tipos do catálogo v2, `ProductSelection` e `formatCents`) e task 04 ([#43](../../21-indoor-menu-v2/tasks/43-product-detail-composer.md): o detalhe, `app/(menu)/layout.tsx` e o `ProductAddActionProvider`)
**Status:** shipped
**Reconciliado com a #21 (2026-11-23):** o encaixe do "adicionar" é o da #43 — o detalhe chama `useProductAddAction().add(selection)` e não importa nada da sacola; esta task cria o `CartAddActionProvider`, que monta o valor a partir de `useAddCartItem()` e entra em `app/(menu)/layout.tsx` em volta do host. O corpo de `POST /cart/{cartId}/items` é a `ProductSelection` da #40 (snake_case), mandada como está: saiu o `AddCartItemPayload` camelCase. As mensagens de falha ao adicionar são desta task; a regra de quando o CTA aparece ou desabilita é da #43. `formatCents` vem só da #40, sem porta de reserva aqui. O stepper de 40 aponta para o follow-up único da #43.
**Alinhado à #24 e à delivery-api#1608 (2026-11-23):** o gerador de UUID sai do serviço da sacola para `src/helpers/random-uuid.ts` (`randomUuid()`), que esta task cria e que a #48 (chave do envio) e a #24 (chave do pagamento) importam: um gerador só, com o fallback de `crypto.getRandomValues`. Do lado da api: a posse da sacola é **só** pelo `x-cart-session-token`, sem header de movimentação (#1629); o `POST /cart` recusa movimentação inexistente, liberada ou fechada com os códigos fixados na 1608 (#1628, a mensagem é da 05); e a entrada de item passa a cobrar o ambiente do carrinho, de modo que o produto só de mesa entra e o que a mesa não vende é `422 product_unavailable` (#1766).

## Objetivo

A sacola passa a viver no servidor: é o carrinho v2 da `delivery-api`, criado na primeira adição de item com o `board_movement_id` da mesa e um token de sessão gerado no aparelho, com quantidade e remoção indo ao servidor e a tela desenhando o que ele devolveu — total e promoção inclusive. A task entrega o tipo, o serviço, os hooks, a tela `/cart` do celular (linha da mesa, itens e total), a aba Sacola com contador e o provedor de adicionar que o detalhe do produto da #21 consome. Envio e nome (03), tablet (04) e "Limpar" (05) ficam para as próximas.

## Contexto

### Estado atual

Lido na worktree `docs/indoor-v2-tasks-21-24` @ `39366b5`, ponta da fila da #20.

- **Não há sacola na v2.** A #39 removeu `src/components/cart/` e o módulo Redux `cart` da v1. `CART_ROUTE = '/cart'` existe (`src/routes/app-routes.ts:9`), sem página em `app/`.
- **A aba Sacola está inerte.** `shellTabs` tem `isAvailable: false` em `cart` (`src/components/shell/shell-tabs.ts:20`), e a `ShellNav` monta os itens uma vez, no escopo do módulo (`src/components/shell/ShellNav.tsx:12-18`), sem contador. A 37 deixou o contador para cá, por `BottomNavItem.visual` com `Badge variant="count"` (`37-responsive-shell-navigation.md`, "Sem `Badge` na Sacola").
- **`api`** (`src/services/api.ts:5-8`) manda `x-restaurant-id` com o UUID e não toca `window`. Não existe `skipGlobalErrorHandler` aqui: o diálogo global do client não veio (#38).
- **A mesa** vem de `useBoardSession()` (`src/providers/board-session/BoardSessionProvider.tsx:20-29`). `status === 'ready'` estreita `movement` para `OpenBoardMovement`, com `movement.id` (o uuid da movimentação) e `movement.board.number`. `hasTable` é, nas palavras do próprio tipo, "o que a sacola consulta para permitir enviar" (`:23`).
- **O restaurante** vem de `useRestaurant()` (`src/hooks/use-restaurant.ts:9-10`); o nome é `name` (`src/types/restaurant.ts:55`).
- **Estados da fundação:** `useQueryScreenState` (`src/hooks/use-query-screen-state.ts`), `RouteErrorState`, `InlineError` (`src/components/error/InlineError.tsx:11-16`) e `useToast` com `anchorRef` (`src/components/ui/Toast.tsx:34,193`).
- **O tema vendorado já traz as medidas da sacola do client:** `cartHeaderMetrics`, `cartRowMetrics`, `cartItemMetrics`, `cartSummaryMetrics`, `cartFooterMetrics` e `cartScreenMetrics` (`src/theme/component-tokens.ts:3109-3411`). O que a mesa precisar além disso vai para um arquivo de medidas próprio, fora de `src/theme/`.

### Requisitos cobertos

- **RF-01, RF-02, RF-03.** Sacola criada no servidor, escritas no servidor, total do servidor.
- **RF-04 no celular.** A linha da mesa e a nota da taxa de serviço.
- **RF-12 no celular.** O vazio, com a ação de ver o cardápio.
- **RN-01, RN-04 e RN-05.**
- **Decisões pendentes da spec.** A 3 (descartar a sacola local) já está cumprida pela #39: não há sacola local para migrar. A 4 (token UUID v4 em `localStorage`, mandado em `x-cart-session-token`) é a desta task.

### Contrato consumido

Medido em `delivery-api` `origin/master` @ `8db44045e` (2026-11-23).

**O grupo de rotas** está em `app/Modules/Cart/routes/client-routes.php:16-42`. Os middlewares são três:

- `RestaurantMiddleware`;
- `client.session`, que só recusa sessão revogada (`EnsureClientSessionIsActive`);
- `client.customer`, que resolve `null` sem login.

**Headers:** todo pedido leva `x-restaurant-id` (do `api`) e `x-cart-session-token`. A posse é lida do header em toda rota (`ResolvesCartRequesterTrait.php:17-23`), e é **só** dele: a delivery-api#1629 (reescrita em 2026-11-23) fixou que o `board_movement_id` é propriedade do carrinho, e não eixo de posse, e que não há header de movimentação. Outro aparelho da mesma mesa, com outro token, recebe `404 cart_not_found` na sacola alheia (RN-01 da spec daqui).

| Rota | Corpo | Resposta |
|---|---|---|
| `POST /cart` | `{ board_movement_id: uuid }` — contrato da [delivery-api#1628](https://github.com/sgrande-delivery/delivery-api/issues/1628). Detalhes abaixo da tabela | **201** `CartPresenter` (`CreateCartController.php:42`), com `board_movement_id` depois da #1628 |
| `GET /cart/{cartId}` | — | 200 `CartPresenter`. **404 `cart_not_found`** quando não acha o carrinho para aquele token |
| `POST /cart/{cartId}/items` | `{ product_id: int, quantity: int > 0, option_selections: [{ option_group_item_id: int, quantity?: int > 0 }], removed_ingredients?: [uuid], notes?: string \| null }` (`AddCartItemRequest.php:29-38`). Campo de preço é descartado (`IgnoresClientPricingFieldsTrait`) | **201** com a **sacola inteira**, e não o item (`AddCartItemController.php:45`) |
| `PATCH /cart/items/{itemId}` | `{ quantity }`. A escrita é parcial: sem `option_selections`, `removed_ingredients` e `notes`, a composição fica (`UpdateCartItemController.php:41-48`) | 200 `CartPresenter` |
| `DELETE /cart/items/{itemId}` | — | 200 `CartPresenter` (`RemoveCartItemController.php:38`) |

- **`POST /cart` hoje ignora a mesa.** O `CreateCartRequest` valida só `session_token` (`:19`), e o controller não repassa o campo (`CreateCartController.php:36-40`). Até a #1628 subir, a sacola nasce sem mesa.
- **Com a #1628, o `POST /cart` recusa a movimentação** com os códigos fixados na tabela "Recusas do caminho de mesa" da 1608: `404 board_movement_not_found_for_cart` (inexistente ou de outra loja), `422 board_movement_freed` (conferida antes de `is_open`) e `422 board_movement_closed`. A mensagem ao adicionar é da 05, no `CartAddActionProvider` desta task.
- **O token vai no header.** O controller aceita `session_token` no corpo ou `x-cart-session-token` (`:32-34`); esta task manda só o header.
- **O `DELETE` devolve a sacola.** O comentário do client que fala em texto `OK` está defasado.

**`CartPresenter`** (`core/Cart/Application/Presenters/CartPresenter.php:21-45`):

- `id` (uuid), `restaurant_id`, `customer_id`, `session_token`;
- `status`: `open`, `checked_out` ou `abandoned`;
- `subtotal`, `discount`, `delivery_fee`, `total`, `coupon_id`, `promotion_id`, `coupon_code`, `free_shipping`, `applied_promotions[]`;
- `expires_at`: ISO, 24 h depois da criação (`CreateCartUseCase.php`);
- `items[]`, `created_at`, `updated_at`;
- e `board_movement_id`, pela #1628.

**O item** (`CartItemPresenter.php:20-43`):

- `id`, `cart_id`, `product_id`, `product_public_id`, `name`, `image_url`, `quantity`, `unit_price`, `line_total`, `notes`;
- `options[]`: `{ id, option_group_id, option_group_item_id, name, quantity, unit_price }`;
- `removed_ingredients[]`: `{ ingredient_public_id, name }`;
- `promotion`: `{ id, name, kind } | null`;
- e `person`, pela [#1630](https://github.com/sgrande-delivery/delivery-api/issues/1630).

**Dinheiro em centavos inteiros.**

**Recusas na escrita de item.** A tabela do client (`src/services/cart.ts:167-190` @ `ceed49a9`) confere com o código de hoje:

- 404 `product_not_found_for_cart`;
- 422 `invalid_option_selection`, `missing_required_size` e `ingredient_not_removable`;
- 422 `product_unavailable` (`ProductUnavailableException`), com `message` "<nome> não está disponível agora.". Na sacola de mesa, a regra é o **ambiente do carrinho** ([delivery-api#1766](https://github.com/sgrande-delivery/delivery-api/issues/1766)): o produto só de mesa entra, e o que a mesa não vende (só de entrega, pausado, categoria fora da mesa) é recusado. **Antes da #1766**, a entrada cobra entrega fixo (`AddCartItemUseCase.php:84`), e o produto só de mesa é recusado com esse código. É a api, e a mensagem aparece como vem.

Do carrinho: 404 `cart_not_found` e 422 `cart_already_checked_out`.

**Promoção.** O carrinho de mesa já avalia promoção no ambiente `BOARD` e acumula descontos (`CartPromotionHandler.php:89,122`). O `total` que volta é o mesmo que o pedido de mesa cobra (`OrderPricingOrchestrator.php:223-227`).

**Divergência de contrato: nenhuma.** O corpo de item, o envelope e a unidade conferem com a spec da #22 e com a da [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608). O que falta lá (a mesa no `POST /cart` e o `person` no item) é ausência de implementação, não divergência.

### Decisões

1. **Uma sacola por aparelho e por movimentação (RN-01).** O `localStorage` guarda `{ id, sessionToken, movementId }` numa chave só, `indoor:cart`.
   - A sacola guardada só vale para a movimentação em que nasceu.
   - Com outra mesa (outro QR), a tela mostra a sacola vazia, e a próxima adição descarta a guardada. Sem isso, o aparelho que muda de mesa mandaria o pedido para a conta da mesa anterior.
   - O vínculo é **local**, e não pelo `board_movement_id` da resposta: até a #1628 subir o campo não vem, e comparar com o ausente recriaria a sacola a cada adição.
2. **Um token por sacola, gerado no aparelho.** Cada `POST /cart` sai com um token novo no header `x-cart-session-token`, e o par `{ id, token }` é guardado junto, como faz o `createGuestCart` do client (`src/services/cart.ts:229-234` @ `ceed49a9`).
   - O token fica em `localStorage`, pela decisão 4 da spec.
   - O `?session` é diferente: ele fica em `sessionStorage` (#36). O token só dá acesso a uma sacola de 24 h, e a sacola sem a mesa da aba não envia nada.
3. **`crypto.randomUUID` com fallback, num helper compartilhado.** Ele só existe em contexto seguro, e o tablet de teste em `http://192.168.x.x:3000` não é. O gerador cai para um v4 montado com `crypto.getRandomValues`, que existe em qualquer contexto.
   - Ele mora em `src/helpers/random-uuid.ts`, e não no serviço da sacola, porque três chaves o usam: o token desta task, a `Idempotency-Key` do envio (#48) e a do pagamento (#24, que não depende da sacola). *(Alinhado em 2026-11-23: o texto anterior o deixava como `createSessionToken()` dentro de `src/services/cart.ts`, e a #24 previa extraí-lo depois.)*
4. **Uma criação de sacola por vez.** Dois toques em "adicionar" antes da primeira resposta fariam dois `POST /cart`, e o item do primeiro iria para uma sacola órfã. O `ensureCart` guarda a promessa em voo no escopo do módulo, como o `claimInFlight` do client (`:321-339`).
5. **A sacola é `useQuery(['cart', cartId])` e nada mais** (plan, "Estado").
   - Cada escrita invalida `['cart']` e relê.
   - O `onSuccess` devolve a promessa da invalidação, para o controle só destravar com a tela já redesenhada (`use-cart-actions.ts:53-66` @ `ceed49a9`).
   - Nenhum total é somado na tela (RN-04).
6. **Sacola sem `cart_id` é "vazia", não "carregando".** Sem id guardado, a query é `skipToken`, e a tela mostra o vazio sem request. O `useQueryScreenState` só entra quando há id: com `skipToken` a query fica `pending` para sempre, e ele mostraria skeleton para sempre.
7. **A composição sai do payload.** `buildCartItemComposition` (`cart-item-composition.ts` @ `ceed49a9`) monta a linha a partir de `options[].name` e `removed_ingredients[].name`, sem consultar o produto.
   - O canvas escreve "+ bacon extra", mas o payload não diz qual grupo é adicional e qual é tamanho: "400ml cremoso" vem sem `+`. O prefixo não entra.
   - **Divergência com o canvas, para o dev confirmar.**
8. **Lixeira na linha do nome, stepper parando no 1.** O README do `CartItemRow` diz que o stepper mostra `delete` no `1`.
   - O `QuantityStepper` vendorado não tem esse modo (`src/components/ui/QuantityStepper.tsx:110-161`), e o DS não se bifurca aqui.
   - Fica como no client e no artboard do celular: `min={1}` no stepper e `IconButton` `delete` na linha do nome.
   - No tablet, onde o artboard não desenha lixeira, é também o único jeito de remover.
9. **Stepper `md`.** O `design-system/README.md` ("Os três formatos") manda controle de quantidade em `md` ou maior. O `md` tem 52 de altura, com botões de 40 (`component-tokens.ts:199-209`). O client usa `xs` (32), que fica abaixo dos 44 da RF-13. Os botões de 40 são do primitivo compartilhado, e subir para 44 é mudança no client: é o **follow-up único** registrado na [#43](../../21-indoor-menu-v2/tasks/43-product-detail-composer.md) ("Follow-ups"), que cobre o detalhe e a sacola. Não se registra outro aqui.
10. **Total e promoção.**
    - O rodapé mostra "Total do pedido" com `cart.total`.
    - Quando `cart.discount > 0`, entram acima "Subtotal" (`cart.subtotal`) e "Promoções" (`− cart.discount`), como no `CartSummary` do client. Sem elas, a soma das linhas não bate com o total na frente do cliente.
    - O canvas da mesa não desenha promoção, então as duas linhas são **derivadas**; confirmar com o dev.
    - Não vêm a faixa de promoção por item (`CartItemPromotionRow`), o banner (`CartPromotionBanner`) e a nota de economia.
11. **Copy do vazio.** A da coluna do tablet é "Nenhum item ainda" / "Toque no + de um produto para montar o pedido da mesa. Ele só vai para a cozinha quando você enviar." (`Cardápio · tablet deitado`). Mas o card da mesa **não tem `+`** (RF-13 da #21). Ficam:
    - título "Nenhum item ainda";
    - descrição "Toque num produto para montar o pedido da mesa. Ele só vai para a cozinha quando você enviar.";
    - ação "Ver o cardápio", a mesma da tela "sem mesa".

    A frase é **derivada**; confirmar com o dev. A #21 não escreve copy de sacola, e a menção a um `add` de 44 no canto do card, que o plan dela trazia, foi corrigida para a RF-13 na reconciliação: as duas features dizem que o card não tem `+`.

### Armadilhas

- **Hidratação.** Servidor e hidratação não têm `localStorage`. `undefined` ("ainda não sei") precisa ser diferente de `null` ("não há sacola"), senão a tela pisca o vazio para quem tem sacola (`use-cart.ts:35-43` @ `ceed49a9`).
- **`refetch()` com `skipToken` rejeita** (`use-cart.ts:49-59` @ `ceed49a9`). O `retry` só relê quando há id.
- **Tela dentro do `AppShell`** (aprendizado da 06 na #20):
  - não usa `<main>` nem `100dvh`;
  - a raiz preenche o `Scroller` com `blockSize: 100%`;
  - o corpo rola por dentro, e o rodapé fica fora da área que rola.
- **Toast sobre o rodapé.** O toast cai em cima do rodapé da sacola, que é mais alto que a navegação inferior. Ele sobe de uma âncora no limite inferior do corpo (`ToastAnchor`, `CartScreen.tsx:67-80` @ `ceed49a9`).
- **Dinheiro em centavos.** A conversão é pelo `formatCents` de `src/helpers/money.ts`, que a #40 (task 01 da #21) cria. O `moneyFormat` de `src/helpers/numberFormat.js` espera reais e não serve aqui. A #40 é dependência dura desta task: sem ela na base, a task não começa, e **não** se porta uma segunda cópia do helper — dois escritores do mesmo arquivo em paralelo é o conflito que a #40 existe para evitar.
- **Ícones.** `shopping_bag`, `table_restaurant`, `delete`, `add`, `remove`, `arrow_back` e `error` já estão na união (`src/components/ui/icon-names.ts`). Ícone novo é pedido a uma task só, que regera o woff2 (aprendizado da 03 da #20).

## Mudanças

### 1. Tipo do contrato

`src/types/cart.ts` (novo). Porta `src/types/cart.ts` @ `ceed49a9` e acrescenta o que a #1628 e a #1630 escrevem:

```ts
export type CartStatus = 'open' | 'checked_out' | 'abandoned';

export interface CartItemOption { id: number; option_group_id: number; option_group_item_id: number; name: string | null; quantity: number; unit_price: number }
export interface CartItemRemovedIngredient { ingredient_public_id: string; name: string }
export interface CartItemPromotion { id: number; name: string; kind: string | null }
export interface AppliedPromotion { promotion_id: number; name: string; kind: string | null; trigger_kind: string | null; discount_value: number; cart_item_id: number | null; reason_code: 'applied' }

/** `CartItemPresenter`. Valores em centavos. */
export interface CartItem {
  id: number; cart_id: string; product_id: number; product_public_id: string | null; name: string | null; image_url: string | null;
  quantity: number; unit_price: number; line_total: number; notes: string | null;
  options: CartItemOption[]; removed_ingredients: CartItemRemovedIngredient[]; promotion: CartItemPromotion | null;
  person: string | null; // delivery-api#1630
}

/** `CartPresenter`. Valores em centavos. */
export interface Cart {
  id: string; restaurant_id: number; customer_id: number | null; session_token: string | null; status: CartStatus;
  subtotal: number; discount: number; delivery_fee: number; total: number;
  coupon_id: number | null; promotion_id: number | null; coupon_code: string | null; free_shipping: boolean;
  applied_promotions: AppliedPromotion[]; expires_at: string | null; items: CartItem[];
  created_at: string | null; updated_at: string | null;
  board_movement_id: string | null; // delivery-api#1628
}
```

`kind` fica `string | null` porque `src/types/promotion.ts` não existe aqui e a sacola não lê o tipo da promoção. `board_movement_id` e `person` são declarados pelo contrato e **não são lidos** em lógica nenhuma desta task (decisão 1).

### 2. Serviço

`src/services/cart.ts` (novo). Porta `src/services/cart.ts` @ `ceed49a9`.

**Fica, com a tradução:**

- **O guardado.** `subscribeToStoredCart`, `readStoredCart` e `peekStoredCart` com o guard de shape, mais `clearStoredCart`. O shape passa a ser `StoredCart = { id: string; sessionToken: string; movementId: string }`, e o guard recusa o que não tiver os três (decisão 1).
- **A chave.** `const CART_STORAGE_KEY = 'indoor:cart'` é constante do módulo. **Não** é `NEXT_PUBLIC_LOCALSTORAGE_CART`, que saiu na #39 e não volta.
- **O acesso a `localStorage`** fica em `try/catch`, como no `entry-session.ts` da #36: navegação privada pode negar.
- **`readStoredCartIdFor(movementId)`** é o snapshot do `useSyncExternalStore`. Lê sem escrever e devolve `null` quando a movimentação guardada é outra.
- **`cartRequestConfig()`** devolve `{ headers: { 'x-cart-session-token': token } }`, sem `skipGlobalErrorHandler`.
- **O token de uma sacola nova** é `randomUuid()`, de `src/helpers/random-uuid.ts` (abaixo). O serviço não tem gerador próprio.
- **`ensureCart(movementId)`:**
  - guardado de outra movimentação → descarta;
  - guardado e usável (`status === 'open'` e `expires_at` futuro, o `isUsable` do client) → reaproveita;
  - senão, `POST /cart` com `{ board_movement_id: movementId }`, o header do token novo e guarda `{ id, sessionToken: response.data.session_token ?? token, movementId }`;
  - **uma promessa em voo por vez** (decisão 4).
- **As leituras e escritas.** `fetchCart`, `fetchStoredCart` (404 `cart_not_found` esquece o guardado e devolve `null`), `isCartNotFound`, `isCartItemRejected` (tabela da seção "Contrato"), `addCartItem(cartId, selection)`, `updateCartItemQuantity(itemId, quantity)` (só `{ quantity }`) e `removeCartItem`.
- **O corpo do item é a `ProductSelection`** de `src/types/product-selection.ts` (#40), que o detalhe da #43 monta: `addCartItem(cartId: string, selection: ProductSelection)` faz `api.post(\`/cart/${cartId}/items\`, selection, cartRequestConfig())`, **sem** tradução. O `AddCartItemPayload` camelCase e o `buildOptionSelections` do client não vêm: seriam um segundo tipo para o mesmo corpo. `removed_ingredients: []` e `notes: null` vão como estão — `AddCartItemRequest.php:29-38` tem `sometimes|array` nos dois arrays e `sometimes|nullable|string` em `notes`.

`src/helpers/random-uuid.ts` (novo; decisão 3):

```ts
/**
 * UUID v4. `crypto.randomUUID` só existe em contexto seguro, e o tablet de teste abre o dev server
 * em `http://` de rede local: lá o v4 é montado com `crypto.getRandomValues`, que existe sempre.
 */
export function randomUuid(): string;
```

Puro, sem React e sem `window` além de `globalThis.crypto`. O fallback acerta os bits de versão (`4`) e de variante (`10xx`). Quem gera chave neste app importa daqui: o token da sacola, a `Idempotency-Key` do envio (#48) e a do pagamento (#24).

**Sai:**

- `claimStoredCart`, `claimCart`, `isCartAlreadyCheckedOut` do claim e `hasAccessToken`;
- `createCustomerCart` e `isCustomerCartWithoutSession` (RN-01: não há login);
- cupom (`redeemCoupon`, `removeCoupon`, `readCouponCodeError`, `readFieldErrors`), que está fora do escopo da spec;
- a edição de composição (`UpdateCartItemPayload` com `optionSelections`): a mesa não edita item na sacola (ver "Fora de escopo").

### 3. Chave da query e hooks

- **`src/components/cart/cart-query.ts`** (novo), porta literal: `CART_QUERY_KEY = 'cart'` e `cartQueryKey(id)`.
- **`src/components/cart/use-cart.ts`** (novo). Porta o `useCart` @ `ceed49a9` sem `useWhoami`, claim e `needsLoginToReadCart`.
  - O id vem de `useSyncExternalStore(subscribeToStoredCart, () => readStoredCartIdFor(movementId), () => undefined)`. A movimentação é `session.status === 'ready' ? session.movement.id : null`.
  - Devolve `{ cart: Cart | null | undefined, query, isLoading, isFetching, isError, retry }`.
  - `cart` é `undefined` enquanto não se sabe, `null` sem sacola, ou a sacola lida.
  - `query.data` com `status !== 'open'` ou expirado também é `null`: a sacola que virou pedido em outra aba não é sacola.
- **`src/components/cart/use-cart-item-count.ts`** (novo). Soma `quantity` dos itens, como `countItems` de `use-cart-bar.ts` @ `ceed49a9`. Devolve `undefined` enquanto a sacola nunca foi lida ("sem resposta, sem afirmação", RN-456.3 do client). A aba (mudança 6) e o tablet (04) leem daqui.
- **`src/components/cart/use-cart-actions.ts`** (novo). Porta `useCartActions` @ `ceed49a9` **com quantidade e remoção**.
  - Mesma barreira (`isPending`), `subjectItemId` e toasts de erro ("Não foi possível mudar a quantidade. Tente de novo.", "Não foi possível remover este item. Tente de novo.", "Item removido da sacola.").
  - O `clear` e o `isClearing` entram na 05.
- **`src/components/cart/use-add-cart-item.ts`** (novo). Porta `src/components/product/use-add-cart-item.ts` @ `ceed49a9`.
  - A variável da mutação é a `ProductSelection`; `mutationFn` chama `ensureCart(movementId)` e depois `addCartItem(cart.id, selection)`.
  - Sem mesa (`!session.hasTable`), recusa **sem request**, com `NoTableForCartError`. É **defesa** do hook, e não a regra da tela: quem decide se o CTA aparece é o rodapé da #43 (ver mudança 7), que não deveria ter oferecido o botão.

### 4. Componentes da sacola

`src/components/cart/` (novos). Todo container de layout é `styled()`. Sem hex, sem `#FF5A1F`. A cor de destaque é `theme.vars.palette.brand.text`.

| Arquivo | Origem @ `ceed49a9` | Tradução |
|---|---|---|
| `CartItemRow.tsx` | `CartItemCard.tsx` | Saem o alvo de edição (`pushCartItemSheet`) e a `CartItemPromotionRow`. O stepper é `size="md"`, `min={1}` (decisão 9), e a lixeira é `IconButton` `md` (44) com `delete` (decisão 8). Os rótulos acessíveis com o nome do produto ficam. É a anatomia do `design-system/components/CartItemRow/`. A forma é **linha com separador** (`.ci` do artboard), e não o cartão com sombra do client: a borda inferior vai em `line`, e a tipografia e os espaços vêm de `cartItemMetrics` |
| `CartItemThumb.tsx` | `CartItemThumb.tsx` | Porta. `next/image` já tem o `remotePattern` do S3 (`next.config.ts:4-6`) |
| `CartItemList.tsx` | `CartItemList.tsx` | Sem `readItemPromotionDiscount`. Recebe `cart` e `actions` |
| `cart-item-composition.ts` | idem | Porta literal (decisão 7) |
| `CartTableRow.tsx` | `CartRestaurantRow.tsx` | Vira a linha da mesa (RF-04): `table_restaurant` em `brand.text`, "Mesa {movement.board.number} · {restaurant.name}" e "Vai direto para a cozinha". Variante `compact` com uma linha ("Mesa 12 · vai direto para a cozinha"), para o retrato da 04. Saem o link para o cardápio e o `useBranding` |
| `CartTotals.tsx` | `CartSummary.tsx` | "Total do pedido" com `formatCents(cart.total)`. As duas linhas da decisão 10 só com `discount > 0`. A nota "Taxa de serviço calculada na conta da mesa." vai sempre. Saem taxa de entrega, cupom, `cart-fee-rule` e `useSelector`. O valor fica com opacidade de carregamento durante a releitura (`isFetching`), como no client |
| `CartEmpty.tsx` | `CartEmpty.tsx` | `EmptyState` com `shopping_bag` e a copy da decisão 11. A ação é `Button size="md"` para `HOME_ROUTE` por `Link`. Sai o ramo de login |
| `CartScreenSkeleton.tsx` | idem | Porta: a forma do item, sem as linhas de cupom e de restaurante |
| `CartPanel.tsx` | o corpo de `CartScreen.tsx` | O conteúdo da sacola, **sem cromo**: linha da mesa (opcional, por prop), lista, totais e o estado de carregamento, erro ou vazio. É o que a tela do celular e os dois formatos do tablet (04) montam. Recebe `toastAnchorRef` e a forma do erro (`'route' \| 'inline'`) |
| `cart-metrics.ts` | — | O que a anatomia da mesa tem e o tema não: miniatura e borda da linha. Nada de token novo em `src/theme/` |

Nenhum destes nasce em `src/components/ui/`, onde fica só o DS vendorado (RN-12 da #20).

### 5. Tela `/cart` do celular

- **`app/cart/page.tsx`** (novo): casca que renderiza `CartScreen`, como `app/carrinho/page.tsx` @ `ceed49a9`. Sem `generateMetadata` com `loadBoot`, porque não há boot de servidor (#20, "Sem `loadBoot`").
- **`src/components/cart/CartScreen.tsx`** (novo): a moldura do celular.
  - Raiz `styled('div')` com `blockSize: '100%'`, em coluna.
  - O `CartHeader` fica sempre montado.
  - O corpo é `CartPanel`, que rola por dentro.
  - A âncora do toast fica no limite inferior do corpo.
  - O rodapé é `CartTotals` quando há itens. O botão de enviar e o nome entram na 03.
- **`src/components/cart/CartHeader.tsx`** (novo). Porta `CartHeader.tsx` @ `ceed49a9`: `arrow_back` e "Sua sacola", com `cartHeaderMetrics`.
  - O voltar é `Link` para `HOME_ROUTE`, e não `useBackNavigation`: a entrada do app é o redirect do QR, e voltar no histórico pode sair do app.
  - O alvo do voltar é de 44.
  - O "Limpar" é da 05.
- **Os estados de leitura**, pela regra de `useQueryScreenState` (decisão 6):
  - sem id: `CartEmpty`, sem request;
  - com id: skeleton na primeira leitura;
  - `RouteErrorState` com título "Não conseguimos carregar a sacola", descrição "Verifique a conexão e tente de novo — ou chame o garçom." e retry por `retry`;
  - releitura que falha com dado na tela: `InlineError` acima do total, e a lista fica.

  A copy do erro é **derivada** do `CartError` do client e do `Estado · erro de rota` do canvas.

### 6. Aba Sacola

- **`src/components/shell/shell-tabs.ts:20`** (alterado): `isAvailable: true` em `cart`. A [#44](../../21-indoor-menu-v2/tasks/44-menu-search-v2.md) liga a linha de cima (`search`, `:19`) no mesmo arquivo; as duas podem correr em paralelo, e o conflito na junção é de linha vizinha, resolvido mantendo as duas.
- **`src/components/shell/ShellNav.tsx`** (alterado):
  - `items` passa a ser montado no render;
  - a aba `cart` ganha `visual` com o `Icon` `shopping_bag` e o `Badge variant="count"` com `useCartItemCount()`, quando maior que zero;
  - `accessibleLabel` "Sacola, 2 itens".

  Sem contagem conhecida, a aba mostra só o ícone. As outras abas não mudam.

### 7. Ligação no detalhe do produto (#21)

O ponto de ligação é o da [#43](../../21-indoor-menu-v2/tasks/43-product-detail-composer.md): o contexto `ProductAddAction` de `src/components/product/product-add-action.tsx`, com `add(selection: ProductSelection): Promise<void>` e `isPending`. O detalhe **não** importa nada de `src/components/cart/`; a dependência vai da sacola para o detalhe, nunca o contrário. A `ProductSelection` já chega com os ids **numéricos** (RN-05): `product_id` é o `id` do `GET /products/v2/{publicId}`, `option_group_item_id` é o `items[].id` dos grupos e `removed_ingredients` são os uuid da receita.

- **`src/components/cart/CartAddActionProvider.tsx`** (novo, `'use client'`). Chama `useAddCartItem()` e entrega ao `ProductAddActionProvider` da #43:
  - `add(selection)` → `mutateAsync(selection)`; resolve quando o item entrou (o `onSuccess` já devolve a invalidação de `['cart']`, decisão 5);
  - `isPending` da mutação, que é o giro do CTA do detalhe.
- **`app/(menu)/layout.tsx`** (alterado; criado pela #43): `<CartAddActionProvider>` em volta do `<Suspense>` do host, e só dele. É a única mudança do arquivo; a coluna do tablet não passa por aqui (é do `AppShell`, 04).
- **As mensagens de falha ao adicionar são desta task**, porque é ela que lê os códigos da sacola. O provedor anuncia e depois rejeita, e o detalhe só fica aberto, sem toast próprio:
  - recusa do item (`isCartItemRejected`): toast com o `message` do servidor ("Classic Smash não está disponível agora.");
  - outra falha: toast "Não foi possível adicionar à sacola. Tente de novo." (derivada; é a única frase de falha genérica ao adicionar nas duas features);
  - a recusa de mesa fechada no `POST /cart` entra na 05, no mesmo lugar.
- **Sucesso:** o detalhe fecha. A sacola reflete pela invalidação: a contagem na aba e, no tablet, a coluna da 04.
- **Quando o CTA aparece, desabilita ou vira a nota "só para olhar"** é a tabela do rodapé da #43, feita com `useBoardSession()` e `useIsOffline()` da fundação. Esta task não tem regra de tela para o CTA e não exporta `useCanWriteCart()`; a recusa sem mesa do `useAddCartItem` é só defesa.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` conclui.
4. `grep -rn "localStorage" src/services/cart.ts` só dentro de `try/catch`. `grep -rn "moneyFormat\|numberFormat" src/components/cart` não retorna nada.
5. `grep -rn "AddCartItemPayload\|optionGroupItemId\|removedIngredients\|useCanWriteCart" src` não retorna nada. `grep -rn "components/cart" src/components/product` não retorna nada: só `app/(menu)/layout.tsx` junta os dois.
6. `grep -rn "randomUUID\|getRandomValues" src` só acha `src/helpers/random-uuid.ts`. `randomUuid()` por `jiti`, com `crypto.randomUUID` apagado do `globalThis.crypto`: mil chamadas casam `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/` e não se repetem.

**No navegador** (`yarn dev` com `.env.development` apontando para a API local; `rm -rf .next` antes se houve `build`, aprendizado da junção da onda 3 da #20). Precisa de:

- uma movimentação aberta (`SELECT id FROM board_movements WHERE restaurant_id = 1 AND is_open = 1 ORDER BY created_at DESC LIMIT 1`);
- a loja de teste com o catálogo v2;
- DevTools com Network filtrada por `cart` e Application → Local Storage.

1. `http://localhost:3000/cart?session=<uuid-aberto>`, com o `localStorage` limpo. Esperado: "Nenhum item ainda", **nenhuma** requisição a `/cart`, e a aba Sacola acesa e sem contador.
2. Abrir um produto com grupo de opção e ingrediente removível, montar "+ bacon extra · sem cebola" e adicionar. Esperado:
   - um `POST /cart` com `{ board_movement_id: "<uuid-aberto>" }` e o header `x-cart-session-token`;
   - um `POST /cart/{id}/items` com ids inteiros e `removed_ingredients` em uuid;
   - `indoor:cart` com `{ id, sessionToken, movementId }`;
   - a aba Sacola com "1".

   Antes da #1628, a resposta do `POST /cart` vem sem `board_movement_id`. É o esperado.
3. Com o `localStorage` limpo, tocar duas vezes rápido em adicionar (dois produtos ou o mesmo). Esperado: **um** `POST /cart`, e os dois itens na mesma sacola.
4. Em `/cart`, conferir:
   - a linha "Mesa <n> · <loja>" e "Vai direto para a cozinha";
   - o item com a composição igual à do detalhe;
   - `line_total` e "Total do pedido" iguais ao `total` da resposta, em reais;
   - a nota da taxa de serviço.
5. Tocar `+`. Esperado:
   - `PATCH /cart/items/{id}` com `{ quantity: 2 }`;
   - um `GET /cart/{id}` depois;
   - total e linha redesenhados a partir da resposta;
   - durante o round-trip, stepper e lixeira inertes.
6. Tocar `−` no 1: desabilitado. Tocar a lixeira: `DELETE`, a linha some só depois da releitura, e o toast "Item removido da sacola." aparece acima do rodapé, não sobre ele.
7. Com um produto em promoção automática: "Subtotal", "Promoções − R$ x" e o total iguais aos campos da resposta. Sem promoção, só "Total do pedido".
8. Recarregar `/cart`. Esperado: skeleton e depois a lista, **sem piscar** o vazio.
9. Abrir com `?session=<outra-movimentação-aberta>`. Esperado: sacola vazia. Adicionar cria um `POST /cart` novo com a outra movimentação, e `indoor:cart` é sobrescrito.
10. Derrubar a API com a sacola guardada e recarregar `/cart`. Esperado: o erro de rota com código. Subir a API e tocar "Tentar novamente": volta para o skeleton e depois para a lista.
11. Pelo IP da LAN (`http://192.168.x.x:3000`, sem contexto seguro): adicionar funciona, porque o token sai pelo fallback.
12. A 390 × 844: nenhum alvo abaixo de 44 (stepper com 52 e botões de 40, ver decisão 9), e o rodapé acima da navegação inferior, sem sobrepor.

## Critérios de aceitação

- [x] A primeira adição cria a sacola com `POST /cart { board_movement_id }` e `x-cart-session-token`, e o `localStorage` guarda `{ id, sessionToken, movementId }` em `indoor:cart`.
- [x] O token sai de `randomUuid()` (`src/helpers/random-uuid.ts`), que funciona em `http://` de rede local, e nenhum outro arquivo gera UUID.
- [x] Duas adições antes da primeira resposta produzem um `POST /cart` só.
- [x] Quantidade e remoção vão ao servidor (`PATCH { quantity }`, `DELETE`), e a tela só muda depois da releitura. Nenhum total, subtotal ou desconto é somado no cliente (`grep` por `reduce` em `src/components/cart` acha só a contagem de itens).
- [x] A composição da linha bate com o que o detalhe montou, lida de `options[].name` e `removed_ingredients[].name`.
- [x] O "Total do pedido" é `cart.total` formatado de centavos. Com desconto, as linhas mostram `subtotal` e `discount` da resposta.
- [x] A sacola de outra movimentação não aparece nem é reaproveitada.
- [x] Sem sacola guardada, `/cart` mostra o vazio sem request. Com sacola, o reload não pisca o vazio.
- [x] A aba Sacola leva a `/cart` e mostra a soma das quantidades.
- [x] O `CartAddActionProvider` em `app/(menu)/layout.tsx` liga o CTA do detalhe da #43 ao `POST /cart/{cartId}/items`, com a `ProductSelection` da #40 como corpo, sem tradução e com ids numéricos. A falha ao adicionar é anunciada pelo provedor, e o detalhe fica aberto.
- [x] Nenhum arquivo de `src/components/product/` importa de `src/components/cart/`, e não existe `useCanWriteCart()`.
- [x] Sem `<main>`, sem `100dvh`, sem hex nos arquivos novos. Ícones só da união atual.
- [x] `npx tsc --noEmit`, o lint e o `yarn build` com as vars de restaurante passam.

## Implementação

**Concluída em:** 2026-11-25

### Camadas tocadas

- **Helper:** `src/helpers/random-uuid.ts` (`randomUuid()`, com fallback por `crypto.getRandomValues`).
- **Tipo:** `src/types/cart.ts`.
- **Serviço:** `src/services/cart.ts` (guardado `indoor:cart` com `{ id, sessionToken, movementId }`, `ensureCart` com uma criação em voo por vez, leituras e escritas).
- **Hooks e medidas:** `src/components/cart/` — `cart-query.ts`, `use-cart.ts`, `use-cart-item-count.ts`, `use-cart-actions.ts`, `use-add-cart-item.ts`, `cart-item-composition.ts`, `cart-metrics.ts`.
- **Componentes:** `CartScreen`, `CartHeader`, `CartPanel`, `CartTableRow`, `CartItemList`, `CartItemRow`, `CartItemThumb`, `CartTotals`, `CartEmpty`, `CartScreenSkeleton`, `CartLoadError`, `CartAddActionProvider`.
- **Página:** `app/cart/page.tsx`.
- **Ligação no detalhe:** `app/(menu)/layout.tsx` (`CartAddActionProvider` em volta do `Suspense` do `ProductSheet`).
- **Aba Sacola:** `src/components/shell/shell-tabs.ts` (`cart` com `isAvailable: true`), `ShellNav.tsx` (itens montados no render), `ShellNavCartIcon.tsx` (novo) e `shell-metrics.ts` (deslocamento do contador).

### Contratos consumidos

- `POST /cart` com `{ board_movement_id }` e `x-cart-session-token`; `GET /cart/{id}`; `POST /cart/{id}/items` com a `ProductSelection` como está (resposta: sacola inteira); `PATCH /cart/items/{id}` com `{ quantity }`; `DELETE /cart/items/{id}` (resposta: sacola). Todos em centavos. Conferido contra a task (`CartPresenter`/`CartItemPresenter`); a delivery-api não foi reaberta.
- Códigos lidos: `cart_not_found` (esquece o guardado), recusas de item (`product_not_found_for_cart`, `invalid_option_selection`, `missing_required_size`, `ingredient_not_removable`, `product_unavailable`), e só o `product_unavailable` leva o `message` do servidor ao toast (ver "Correções do review").
- Aviso de ordem de deploy: até a delivery-api#1628 subir, a sacola nasce sem mesa (o `POST /cart` ignora `board_movement_id`) e a recusa de mesa fechada não chega; o payload já é o do contrato. A #1766 decide se o produto só de mesa entra.

### Variáveis de ambiente novas

Nenhuma.

### Decisões que tomei por conta própria

- **Forma da linha: cartão com sombra, e não linha com separador.** A mudança 4 pede "linha com separador (`.ci`)", mas o artboard `Carrinho-Celular` desenha o cartão (raio 18, sombra, foto de 62) e só os artboards de tablet usam `.ci`. Segui o celular, com `cartItemMetrics`. A 04 precisa de uma variante de linha para o tablet.
- **Totais no corpo, sem rodapé.** O texto da task diz "o rodapé é `CartTotals`" na mudança 5 e coloca os totais no `CartPanel` na mudança 4. O artboard põe o cartão do total dentro da área que rola (`margin-top: 14`) e deixa o rodapé para o "Enviar pedido" (03). Montei `CartTotals` no `CartPanel`, e `CartScreen` não tem rodapé; a 03 acrescenta o dela. O passo 12 do roteiro ("rodapé acima da navegação") fica sem objeto até a 03.
- **Lixeira e voltar são `ButtonBase` de 44, e não `IconButton`.** O `IconButton` não tem variante sem fundo, e o artboard desenha o glifo solto. O alvo de 44 (`controlSizes.md.height`) sangra por fora do glifo com margem negativa (`cart-metrics.ts`), sem mudar a altura do cabeçalho nem da linha do nome.
- **Linha do total só ganha filete com desconto.** O artboard sem promoção não tem borda entre o total e o resto; com "Subtotal" e "Promoções" acima, o filete do `CartSummary` do client entra.
- **A linha da mesa só aparece com itens**, e a variante `compact` escreve "Mesa 12 · vai direto para a cozinha" numa linha.
- **Esqueleto com a altura do stepper `md`.** `cartScreenMetrics.skeleton.itemBlockSize` do tema parte do `xs`, então o item do esqueleto tem medida própria em `cart-metrics.ts`.
- **`cart` de `useCart()` é `undefined` enquanto a sessão da mesa carrega**, para a tela não piscar o vazio antes de saber qual é a mesa. Sacola com `items: []` também mostra o vazio.
- **Foco depois de remover:** o painel é focável (`tabIndex={-1}`) e recebe o foco quando a linha some, como o corpo da sacola do client.
- **Espelho em memória do guardado** (`memoryStoredCart` em `src/services/cart.ts`): com o `localStorage` negado, a escrita vai para a memória e a leitura cai nela, senão o `POST /items` sairia sem o token e voltaria 404. Vale até o reload.
- **`CartLoadError` na forma `inline`** é um `EmptyState` com o código de erro na descrição; a 04 pode trocar se o tablet desenhar outra coisa.

### Correções do review

- **Diverge do texto da task (mudança 7: "toast com o `message` do servidor").** O `message` da api só aparece quando `internal_code === 'product_unavailable'` (`readProductUnavailableMessage`, `src/services/cart.ts:196`), porque é a única recusa com copy para o cliente. Medido: 4 dos 5 códigos de recusa vêm técnicos e em inglês ("Option group item 45 not found.", "validation error"). Todo o resto cai em "Não foi possível adicionar à sacola. Tente de novo." (`CartAddActionProvider.tsx:27`). `isCartItemRejected` ficou sem consumidor, para a #50.
- `PATCH`/`DELETE` que falham com `cart_not_found` ou `cart_already_checked_out` invalidam `['cart']` (`use-cart-actions.ts:49`); o `fetchStoredCart` devolve `null` e a tela mostra o vazio.
- O 404 só apaga o guardado se ele ainda é o da sacola lida (`cart.ts:286`).
- Lixeira com `marginInlineStart: 'auto'` (`CartItemRow.tsx:74`); foco depois de remover só se estiver no `body` (`CartPanel.tsx:75`); `filter` com type guard na composição (`cart-item-composition.ts:20`); comentário dos tipos sem citar issue (`types/cart.ts:48,72`); deslocamento do contador derivado de `badgeMetrics.countSize` e `bottomNavMetrics.iconSize` (`shell-metrics.ts:40-41`).

### Como testar

1. `yarn dev` (com `.env.development`).
2. Abrir `http://localhost:3000/cart?session=<uuid-aberto>` com o `localStorage` limpo: "Nenhum item ainda", sem requisição a `/cart`, aba Sacola acesa e sem contador.
3. Seguir o roteiro "No navegador" desta task (passos 2 a 12), tendo em mente as decisões acima (linha em cartão, totais no corpo, sem rodapé).

### Validado no navegador (2026-11-25)

Playwright com o Chromium do sistema, contra a delivery-api local (`master` com a #1793, nginx em `127.0.0.1:8095`), restaurante 1 (`uses_v2_orders = 1`, 82 produtos de mesa), mesas 004 e 003. **39 de 39 verificações passaram** (roteiro em `/tmp/indoor-qa-22/qa46.mjs`):

- **1.** Vazio sem nenhuma requisição a `/cart`, e aba sem contador.
- **2.** `X Salada Bacon` com "+ Bacon" e "Sem Alface":
  - `POST /cart` com `{ board_movement_id }` e `x-cart-session-token`;
  - `POST /items` com `product_id: 132`, `option_group_item_id: 693` inteiros e `removed_ingredients` em uuid;
  - `indoor:cart` com `{ id, sessionToken, movementId }`;
  - aba "Sacola, 1 item".
- **3.** Dois toques no CTA fazem um `POST /cart` só.
- **4.** Na sacola:
  - "Mesa 004 · SGrande Delivery" e "Vai direto para a cozinha";
  - a composição "Bacon · sem Alface", igual à resposta;
  - a linha e o total iguais a `cart.total`;
  - a nota da taxa.
- **5.** `PATCH { quantity: 2 }`, seguido de `GET`, e o total redesenhado a partir da resposta. Toques no `+` e na lixeira durante o round-trip não saem (um `PATCH`, nenhum `DELETE`).
- **6.**
  - o `−` fica desabilitado no 1;
  - o `DELETE` vai ao servidor, e a linha só some depois da releitura;
  - o toast "Item removido da sacola." termina em 761, e a navegação começa em 771.
- **7.** O desconto foi simulado na resposta do `GET`, porque não há promoção de mesa no banco local. Com ele aparecem "Subtotal", "Promoções − R$ 2,00" e o total, todos lidos da resposta.
- **8.** O reload de `/cart` não pisca o vazio (conferido com MutationObserver).
- **9.** Na mesa 003 a sacola está vazia. Adicionar faz um `POST /cart` novo com a 003, e o `indoor:cart` é sobrescrito.
- **10.** Com a api fora (`/cart` abortado), aparece o erro de rota. "Tentar novamente" volta à lista.
- **11.** Por `http://192.168.0.169:3462` (`isSecureContext: false`, sem `crypto.randomUUID`) a sacola é criada, com o token v4 do fallback.
- **12.** A 390×844:
  - voltar e lixeira têm 44, e o stepper `md` tem botões de 40 (follow-up da #43);
  - os respiros são 14 do cabeçalho à mesa, 16 da mesa ao item e 14 do item ao total.
- **Storage negado** (`localStorage` lançando): o item entra (`201`, com o token) e a aba conta 1. É o espelho em memória.
- **Recusa ao adicionar** (422 simulado):
  - `invalid_option_selection` mostra "Não foi possível adicionar à sacola. Tente de novo.", sem o texto cru;
  - `product_unavailable` mostra o `message` do servidor;
  - nos dois casos o detalhe fica aberto.

### O que NÃO foi verificado

- **Promoção calculada pelo servidor.** Só a exibição foi conferida, com o desconto simulado.
- **`board_movement_id` na resposta e recusa de mesa fechada no `POST /cart`.** A api local ainda é a de antes da #1628: ignora o campo e não recusa.
- **Tablet real e celular real.** No tablet, `/cart` é a tela do celular esticada, com margens de 18, até a #49 trocar pela coluna e pelo painel.
- O `[api] request failed` que o interceptor de `src/services/api.ts` escreve no console a cada 4xx acende o indicador de "issue" do `next dev`. É anterior a esta task.

## Follow-ups identificados em review

- Forma `inline` do `CartLoadError` (hoje um `EmptyState` com o código na descrição): desenhar na #49.
- Ação do `CartEmpty` ("Ver o cardápio") na coluna do tablet: rever na #49.
- Anúncio do toast de falha ao adicionar fora do modal do detalhe, para leitor de tela.

## Fora de escopo

- **Envio, nome de quem pede, "Pedindo como" e tela de enviado:** tasks 02 e 03.
- **Coluna do tablet em paisagem e barra e painel em retrato:** task 04. Esta task entrega o `CartPanel` que elas montam.
- **"Limpar" com confirmação, recusas de envio, loja e cozinha fechadas e mensagem de offline:** task 05.
- **Editar a composição de um item na sacola** (`CartItemSheet`, `CartItemEditDialog`, `?cart-item=`). Não está no design da mesa nem nos RF.
- **Cupom** (`POST /cart/{cartId}/coupon`), `preview`, claim e barra flutuante do client (`ShellCartBar`/`CartBar`): o celular da mesa tem a aba (decisão 4 da 37), e o tablet tem a barra própria da 04.
- **Aviso de "item adicionado"** (`cart-added-notice.ts` do client): o design da mesa não desenha.
- **`person` por item no `POST /items`.** O nome vai no checkout (plan, "O nome vai no checkout, não por item").
- **Regras do restaurante no envio** (pedido mínimo e afins). O `RestaurantOrderRulesValidator` não as aplica a pedido de mesa (`:83`).

## Branch

`task/46-board-cart-v2`, cortada de `feat/indoor-v2` (`b453dc9`) em 2026-11-25. A #20 e as tasks 01 (#40) e 04 (#43) da #21 já estão na base.
