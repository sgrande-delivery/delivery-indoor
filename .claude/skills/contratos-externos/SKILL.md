---
name: contratos-externos
description: Contratos que o app de mesa consome — rotas da delivery-api (restaurante, catálogo v1 e v2, movimentação de mesa, produtos e pagamentos da conta, carrinho v2), eventos e salas do namespace /board do delivery-socket-api, e os payloads da conta. Use ao tocar em integração, tipo de src/types ou hook de busca, e antes de afirmar o que uma rota devolve.
---

# Contratos externos do app de mesa

Tudo aqui foi medido na `origin/master` dos repos de origem em **2026-11-16**. **Quando o código local divergir do que a API devolve, o código local está errado** — e o inverso também vale: se a medição aqui divergir do que você vê na resposta real, acredite na resposta e corrija esta skill.

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
| `GET /boardMovements/{id}/payments` | pagamentos lançados |
| `POST /boardMovements/{id}/orders` | envio do pedido na `master`, validado por `OrderBaseRequest`; cai no `CreateOrderUseCase` **v1** |

`/pushTokens` **não existe mais** — virou `push-tokens`.

### Payload da movimentação

`GET /boardMovements/{id}` devolve o model mais o que o `BoardMovementDetailPresenter` acrescenta:

```
pax, tip_pct, tip_amount, subtotal, total_due, total_paid, is_board_paid,
opened_at, first_order_at, bill_requested_at, paid_at, freed_at, admin_user,
board (com section), customer
```

`total_due = subtotal + tip_amount`, **sem** desconto. `is_board_paid` é `total_due > 0 && total_paid + 0.01 >= total_due`.

**`discount` não vem nesta rota** — ele só aparece em `GET /boardMovements/{id}/products`. Qualquer aritmética com ele precisa de guarda para ausente.

### Payload dos itens da conta

`GET /boardMovements/{id}/products` → `{ products: [...], total, discount }`. Por item, o `BoardMovementProductPresenter` acrescenta ao model:

```
round            número da rodada (o "Pedido 2" do design)
person           quem pediu — pode ser nulo (item lançado pelo garçom)
category_kind
observations     o annotation do item
order_public_id
option_selections    composição no formato v2
removed_ingredients
```

**O status do pedido da rodada não vem aqui** — o item traz `round` e `order_public_id`, e não o estado ("EM PREPARO", "ENTREGUE") que o design mostra no cabeçalho do grupo. Lacuna conhecida, registrada no plan da [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23).

**Valores da mesa são float em real.** O catálogo v2 e o carrinho v2 são **inteiro em centavos**.

### Catálogo v2 (o redesign)

| Rota | Resposta |
|---|---|
| `GET /categories/v2` | `{ data: [{ id, name, relevance, activated, is_available_on_delivery, products_count }] }` |
| `GET /products/v2` | `{ data: [ProductSummary], meta: { total, per_page, current_page, last_page, has_more, facets } }` |
| `GET /products/v2/{publicId}` | `option_groups[]`, `size_prices`, `recipe`, `price`, `special_price`, `discount_percent` |
| `POST /products/v2/{publicId}/price` | preço da montagem, calculado no servidor |

`option_groups[]`: `{ id, public_id, name, kind, min_quantity, max_quantity, is_required, items: [{ id, product_public_id, name, description, price_override, taste_amount, flavor_slots, position, is_default }] }`.

**Duas armadilhas medidas:** `GET /categories/v2` fixa `EnvironmentEnum::DELIVERY` dentro do use case (inclusive na chave de cache) e **não** aceita `environment`; `GET /products/v2` tem lista fechada de parâmetros e responde **422** a qualquer outro, `environment` incluído. A abertura está em [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) — até subir, a chamada com o parâmetro responde 422, e isso é o esperado.

### Carrinho v2 (o redesign)

Grupo `api/client/cart`, com `x-cart-session-token`. `client.session` e `client.customer` **passam sem login**.

| Rota | Corpo |
|---|---|
| `POST /cart` | `{ board_movement_id }` — hoje o controller **não** repassa esse campo |
| `GET /cart/{cartId}` | a sacola |
| `POST /cart/{cartId}/items` | `{ product_id, quantity, option_selections: [{ option_group_item_id, quantity }], removed_ingredients: [uuid], notes, person }` — ids **numéricos** |
| `PATCH /cart/items/{itemId}` · `DELETE /cart/items/{itemId}` | |
| `POST /cart/{cartId}/preview` · `POST /cart/{cartId}/checkout` | exigem o gate `orders.v2` |

**O domínio já tem mesa e pessoa** (`CartEntity::$board_movement_id`, `CartItemEntity::$person`, `assertPersonRequiresBoardMovement`); falta a superfície HTTP, e o checkout chama `assertHasCustomer()`, que é o bloqueio de um app sem login. É [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608).

### Pagamento da conta pelo cliente

**Não existe.** `POST /boardMovements/{id}/payments` é rota de **admin** (`role:board-order`), e `GET /payment-config` — que devolve o `capabilities` com os canais habilitados — exige `jwt.auth`. O contrato novo está em [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609) e, do lado do app, na [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24).

Chamada de garçom também não existe, e `request-bill` é só do admin: [delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610).

## `delivery-socket-api`

Base `${NEXT_PUBLIC_SOCKET}`. Clone local: `~/projects/sgrande-delivery/delivery-socket-api` (sem sufixo — ver skill `inventario-repos`).

**`/client`** — `ClientGateway`, anônimo, autentica só com `x-restaurant-uuid` no `handshake.auth`. Eventos: `kitchen_state_changed`, `restaurant_state_changed`.

**`/board`** — `BoardGateway`. Conexão anônima do indoor com `query.app=indoor` + `x-restaurant-uuid`; o anônimo **só** entra na sala da movimentação, via `subscribe_channel`, nunca na sala do restaurante.

| Evento | Direção | Sala |
|---|---|---|
| `subscribe_channel` / `unsubscribe_channel` | emit | — |
| `board_products_added` | on | movimentação |
| `board_product_deleted` | on | movimentação |
| `board_payment_added` | on | movimentação |
| `board_payment_deleted` | on | movimentação |
| `board_totals_changed` | on | movimentação |
| `board_session_created` / `board_session_completed` | on | restaurante |
| `board_order_created`, `board_bill_requested`, `print_board`, `print_board_billing` | on | restaurante (é o PDV, **não** o app de mesa) |

Eventos novos especificados: chamada de garçom e "conta pedida" na sala da movimentação ([delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65)) e ciclo de vida da cobrança ([#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66)).

**O que o serviço não faz:** não há replay (quem conecta depois do evento não o recebe) e a inscrição se perde na reconexão. Ver a rule `socket-da-mesa`.
