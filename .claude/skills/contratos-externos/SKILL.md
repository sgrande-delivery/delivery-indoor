---
name: contratos-externos
description: Contratos que o app de mesa consome — rotas da delivery-api (restaurante, catálogo v1 e v2, movimentação de mesa, produtos e pagamentos da conta, carrinho v2), eventos e salas do namespace /board do delivery-socket-api, e os payloads da conta. Use ao tocar em integração, tipo de src/types ou hook de busca, e antes de afirmar o que uma rota devolve.
---

# Contratos externos do app de mesa

Esta skill descreve o que está **publicado hoje** na `origin/master` dos repos de origem. A parte da mesa (movimentação, itens, pagamentos) e a do socket foram remedidas em **2026-11-23** (api `8db44045e`, socket `efd671e`); o catálogo e o carrinho, em **2026-11-16**. **Quando o código local divergir do que a API devolve, o código local está errado** — e o inverso também vale: se a medição aqui divergir do que você vê na resposta real, acredite na resposta e corrija esta skill.

O que está especificado e ainda não subiu **não** está descrito aqui: está na seção do fim, com um ponteiro por spec. O contrato inline de cada task é o que vale para implementar.

## `delivery-api`

Base `${NEXT_PUBLIC_API}` = `.../api/client/`. Header canônico **`x-restaurant-id` com o UUID**. Rotas registradas por módulo em `app/Modules/*/routes/client-routes.php`.

### O que o app consome hoje (v1)

| Rota | Observação |
|---|---|
| `GET /restaurants` | tema, cores, `is_open`, `is_kitchen_open`, `working_hours`, `addresses` |
| `GET /categories?environment=board` | array simples de categorias |
| `GET /categories/{url}?environment=board` | **`products` vem paginado** — objeto, não array |
| `GET /products?environment=board&page&rows` | **paginado**; sem `environment` devolve as ofertas da entrega |
| `GET /products/{id}` | produto completo, com complemento legado |
| `GET /promotions` | |
| `GET /boardMovements/{id}` | a mesa — ver payload abaixo |
| `GET /boardMovements/{id}/products` | `{ products, total, discount }` — ver payload abaixo |
| `GET /boardMovements/{id}/payments` | pagamentos lançados — ver payload abaixo |
| `POST /boardMovements/{id}/orders` | envio do pedido na `master`, validado por `OrderBaseRequest`; cai no `CreateOrderUseCase` **v1** |

`/pushTokens` **não existe mais** — virou `push-tokens`. As três rotas da mesa respondem 404 `internal_code: "not_found"` para movimentação inexistente ou de outra loja.

### Payload da movimentação

`GET /boardMovements/{id}` (`ShowBoardMovementUseCase` → `BoardMovementDetailPresenter`) devolve o model, com `customer`, `board.section` e `adminUser` carregados, mais:

```
pax, tip_pct (int), tip_amount, subtotal, discount, total_due, total_paid, is_board_paid,
opened_at, first_order_at, bill_requested_at, paid_at, freed_at   (ISO com fuso, ou null)
admin_user: { id, name, color_hue } | null
```

- **`discount` vem nesta rota** (desde o `2aaf0d30d`, 2026-11-19), e **`total_due = max(0, subtotal − discount) + tip_amount`** (`BoardBillAmounts::totalDueWith`).
- **`is_board_paid` = `subtotal > 0 && total_paid >= total_due`, sem tolerância** (`BoardBillAmounts::isSettled`). O `paid_at` segue a mesma regra.
- **O que falta pagar não vem.** O derivado é o do admin: `max(0, roundToCents(total_due − total_paid))`, com `roundToCents(v) = floor(v × 100 + 0,5) / 100` (`BoardBillAmounts::remainingWith`).
- O model ainda traz `board_id`, `board.id`, `board.qr_code`, `admin_user` e os ids internos. Saem com a [#1757](https://github.com/sgrande-delivery/delivery-api/issues/1757) (spec 1753, abaixo): código novo não lê nenhum deles.

### Payload dos itens da conta

`GET /boardMovements/{id}/products` → `{ products: [...], total, discount }`. `total` é Σ `final_price` (sem taxa), e `discount` é a mesma soma de descontos de pedido que o `GET` da movimentação já devolve. Por item, o model `OrderProduct` mais o que o `BoardMovementProductPresenter` acrescenta:

```
amount            float — NÃO é quantity; fracionário no item dividido
price             unitário, já com adicionais e complementos (real)
final_price       valor da linha (real)
person            string | null — uma string, não lista; null no lançamento do PDV
round             a rodada (o "Pedido 2" do design), 1 por padrão
category_kind     comida | bebida | sobremesa | entrada | outros | null
observations      o annotation do item
order_public_id   orders.uuid
split_meta
option_selections   composição no formato v2; unit_price em CENTAVOS inteiros, no meio de um payload em real
removed_ingredients { public_id, name } — public_id é '' no item legado
```

**O estado do pedido da rodada não vem aqui** — o item traz `round` e `order_public_id`, e o `status` cru de `orders.status`, mas não o estado ("EM PREPARO", "ENTREGUE") que o design mostra. A tradução é a spec 1752 (abaixo); não traduzir o código cru no app.

### Payload dos pagamentos da conta

`GET /boardMovements/{id}/payments` → array do model `BoardMovementPayment`, **sem `ORDER BY`**: `id`, `value` (o que soma em `total_paid`), `tip_amount` (parcela do próprio `value`), `person` (`string | null`), `split_mode`, `created_at`, `payment_method: { id, method, kind, mode } | null`. `kind` não descreve o cadastro com fidelidade (Pix offline aparece como `other`).

**Valores da mesa são float em real.** O catálogo v2, o carrinho v2 e o pagamento especificado na 1609 são **inteiro em centavos**.

### Catálogo v2 (o redesign)

| Rota | Resposta |
|---|---|
| `GET /categories/v2` | `{ data: [{ id, name, relevance, activated, is_available_on_delivery, products_count }] }` |
| `GET /products/v2` | `{ data: [ProductSummary], meta: { total, per_page, current_page, last_page, has_more, facets } }` |
| `GET /products/v2/{publicId}` | `option_groups[]`, `size_prices`, `recipe`, `price`, `special_price`, `discount_percent` |
| `POST /products/v2/{publicId}/price` | preço da montagem, calculado no servidor |

`option_groups[]`: `{ id, public_id, name, kind, min_quantity, max_quantity, is_required, items: [{ id, product_public_id, name, description, price_override, taste_amount, flavor_slots, position, is_default }] }`.

**Duas armadilhas medidas:** `GET /categories/v2` fixa `EnvironmentEnum::DELIVERY` dentro do use case (inclusive na chave de cache) e **não** aceita `environment`; `GET /products/v2` tem lista fechada de parâmetros e responde **422** a qualquer outro, `environment` incluído. A abertura é a spec 1607 (abaixo) — até subir, a chamada com o parâmetro responde 422, e isso é o esperado.

### Carrinho v2 (o redesign)

Grupo `api/client/cart`, com `x-cart-session-token`. `client.session` e `client.customer` **passam sem login**.

| Rota | Corpo |
|---|---|
| `POST /cart` | `{ board_movement_id }` — hoje o controller **não** repassa esse campo |
| `GET /cart/{cartId}` | a sacola |
| `POST /cart/{cartId}/items` | `{ product_id, quantity, option_selections: [{ option_group_item_id, quantity }], removed_ingredients: [uuid], notes, person }` — ids **numéricos** |
| `PATCH /cart/items/{itemId}` · `DELETE /cart/items/{itemId}` | |
| `POST /cart/{cartId}/preview` · `POST /cart/{cartId}/checkout` | exigem o gate `orders.v2` |

**O domínio já tem mesa e pessoa** (`CartEntity::$board_movement_id`, `CartItemEntity::$person`, `assertPersonRequiresBoardMovement`); falta a superfície HTTP, e o checkout chama `assertHasCustomer()`, que é o bloqueio de um app sem login. É a spec 1608 (abaixo).

### Pagamento, garçom e pedido de conta pelo cliente

**Não existem hoje.** `POST /boardMovements/{id}/payments` é rota de **admin** (`role:board-order`), `GET /payment-config` — que devolve o `capabilities` com os canais habilitados — exige `jwt.auth`, e `PATCH .../request-bill` só existe no admin. Chamada de garçom não existe em lugar nenhum da plataforma. As specs são a 1609 e a 1610 (abaixo).

## `delivery-socket-api`

Base `${NEXT_PUBLIC_SOCKET}`. Clone local: `~/workspace/sgrande-delivery/delivery-socket-api` (sem sufixo; ver skill `inventario-repos`).

**`/client`** — `ClientGateway`, anônimo, autentica só com `x-restaurant-uuid` no `handshake.auth` e entra na sala da loja. Eventos na sala da loja: **`handleRestaurantState`** com `{ state }` (o `is_open`; o nome no fio é esse, e não `restaurant_state_changed`, que é só o nome da constante) e `kitchen_state_changed` com `{ is_kitchen_open }`. O `subscribe_channel` daqui é de sala de pedido (`orderStatusChange`), que o app de mesa não usa.

**`/board`** — `BoardGateway`. Conexão anônima do indoor com `query.app=indoor` + `auth['x-restaurant-uuid']` UUID; sem isso, o gateway desconecta logo depois do `connect`. O anônimo **só** entra na sala da movimentação (`board_session:<uuid>`), via `subscribe_channel` com o UUID dela, nunca na sala do restaurante.

| Evento | Direção | Sala |
|---|---|---|
| `subscribe_channel` / `unsubscribe_channel` | emit | — |
| `board_products_added` | on | movimentação |
| `board_product_deleted` | on | movimentação |
| `board_payment_added` | on | movimentação |
| `board_payment_deleted` | on | movimentação |
| `board_totals_changed` | on | movimentação — **só** na criação e na exclusão de item; não sai em pagamento nem em mudança de gorjeta |
| `board_session_created` / `board_session_completed` | on | restaurante |
| `board_order_created`, `board_bill_requested`, `print_board`, `print_board_billing` | on | restaurante (é o PDV, **não** o app de mesa) |

**O que o serviço não faz:** não há replay (quem conecta depois do evento não o recebe) e a inscrição se perde na reconexão. Ver a rule `socket-da-mesa`.

## Contratos especificados, ainda não publicados

Uma linha por spec, só para achar a fonte. **O contrato está na spec de lá e, inline, na task daqui que o consome** — não copiar para cá. Estado em 2026-11-23.

| Spec | O que muda | Onde está a spec | Quem consome aqui |
|---|---|---|---|
| [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) | `environment=board` aceito em `GET /categories/v2` e `GET /products/v2` | api `.claude/sdd/1607-client-catalog-board-environment/` (na `master`) | #21 |
| [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) | carrinho v2 de mesa: `board_movement_id`, `person` e checkout sem login, gravando composição v2 | api `.claude/sdd/1608-client-board-cart-checkout/` (na `master`) | #22 |
| [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609) | pagamento da conta pelo cliente: `payment-options`, cobrança, cancelamento e `refusal_reason`, em centavos | api `.claude/sdd/1609-client-board-payment-online/` (na `master`; a emenda de 2026-11-23 ainda sem commit) | #24 (#61–#66) |
| [delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610) | `POST .../waiter-calls`, `PATCH .../request-bill` de cliente e `waiter_call` no `GET` | api `.claude/sdd/1610-client-board-waiter-call/` (na `master`; a emenda de 2026-11-23 ainda sem commit) | #23 (#53, #59) |
| [delivery-api#1752](https://github.com/sgrande-delivery/delivery-api/issues/1752) | `round_status` e `order_created_at` em cada item de `/products` e do `board_products_added`, e o emissor da mudança de status | api `.claude/sdd/1752-board-round-status/` (ainda sem commit) | #23 (#53, #55), #22 (#48) |
| [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753) | `GET /boardMovements/{id}` de lista fechada e a credencial de sessão de mesa no redirect do QR (#1760) | api `.claude/sdd/1753-client-board-movement-hardening/` (ainda sem commit) | #23 (#53), #2 |
| [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65) | `board.waiter_called` e `board.bill_requested` na sala da movimentação | socket `.claude/sdd/65-board-attendance-client-events/` (ainda sem commit; o rascunho do PR #67 **não** vale) | #23 (#58, #59) |
| [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66) | `board.charge_updated` na sala da movimentação | socket `.claude/sdd/66-board-charge-lifecycle-events/` (ainda sem commit; vale a versão revisada, não o PR #67) | #24 (#63) |
| [delivery-socket-api#75](https://github.com/sgrande-delivery/delivery-socket-api/issues/75) | `board.order_status_changed` na sala da movimentação | socket `.claude/sdd/75-board-order-status-event/` (ainda sem commit) | #23 (#58) |

Quando uma delas subir, o contrato dela passa para as seções de cima, medido, e a linha sai daqui.
