# Plan — Carrinho e envio do pedido pelo carrinho v2

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortadas de `feat/indoor-v2`

## Abordagem técnica

> **Fonte do design.** Token vem de `.claude/design-system/tokens.json` (versionado pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26)); layout, copy e estado vêm do protótipo citado em "Referência de design" na spec. Carregar a skill `modelo-de-design` antes de implementar tela. Ver a RN-11 da [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20).

A sacola do `delivery-client` já é o carrinho v2, e é a fonte: `src/services/cart.ts`, `src/components/cart/` (`CartScreen.tsx`, `CartItemList.tsx`, `CartItemCard.tsx`, `CartFooter.tsx`, `CartSummary.tsx`, `CartEmpty.tsx`, `CartError.tsx`, `CartClearConfirm.tsx`, `use-cart.ts`, `use-cart-actions.ts`, `cart-query.ts`, `cart-item-composition.ts`) e `src/services/client-session.ts`. O que cai na tradução: endereço, frete, cupom, checkout de pagamento, barra de carrinho com rota de checkout. O que entra: a linha da mesa, o diálogo de nome, o envio para a cozinha e os dois formatos de tablet.

**Estado.** O `cart_id` e o `x-cart-session-token` vivem em `localStorage`; a sacola em si é React Query com chave `['cart', cartId]`, invalidada por cada mutação. O middleware de `cart` do Redux sai: o total passa a ser do servidor (RN-04). O que sobra de estado local é a visibilidade do painel no tablet, que é UI.

**Nome de quem pede.** Um módulo puro resolve a identidade (`indoor:person:<movement>` em `localStorage`), e um provider expõe `{ person, setPerson, needsPerson }`. O diálogo é o `Sheet`/`Dialog` dos primitivos, com `badge` como ícone, o texto do design e validação de vazio. No tablet em paisagem o diálogo ancora no topo (RF-14) — o design mostra a tela com o teclado ocupando 40% da altura, e é por isso que o modal não é centralizado ali.

**Envio.** `POST /cart/{cartId}/checkout` com `Idempotency-Key`, o nome como `customer_name` e o `shipment_method` de mesa. A resposta é o pedido v2 (`OrderPresenter`), e é dela que sai o número do pedido para a tela de confirmação. Depois do envio: limpar `cart_id` do `localStorage`, invalidar a conta da mesa (`['board-movement', id]` e os produtos) e navegar para a confirmação. O socket do `/board` vai trazer `board_products_added` para a conta — o que fecha a volta sem polling.

**Erros.** Quatro recusas têm mensagem própria: movimentação fechada, loja/cozinha fechada, item fora do ambiente da mesa e `403 v2_orders_disabled`. As demais caem no tratamento padrão da fundação. O `delivery-client` tem o mapa de erro de checkout em `src/components/checkout/` e o `http-error-code.ts` para ler o código da api — é o modelo.

## Decisões arquiteturais

- **Sacola no servidor, não local.** É o que permite ao pedido nascer v2 e aparecer com composição no painel v2; é também o que elimina o recálculo de total no cliente.
- **Uma sacola por aparelho (RN-01).** Sacola compartilhada entre os celulares da mesa seria outro produto: exigiria tempo real na composição, resolução de conflito e um dono para o "limpar". O design não pede.
- **O nome vai no checkout, não por item.** Um envio é de uma pessoa; replicar o nome em cada item é trabalho do servidor (frente irmã). Isso mantém o payload do app simples e deixa a regra num lugar só.
- **Idempotência no app e no servidor.** A chave cobre o retry de rede; o bloqueio do botão cobre o duplo toque. Os dois, porque pedido duplicado na cozinha é prejuízo e vergonha na frente do cliente.
- **Implementar contra o contrato, sem esperar a api.** Hoje `POST /cart` ignora `board_movement_id` e o checkout recusa mesa. A task escreve o payload do contrato; o relatório avisa que o envio fecha quando a [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) subir.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Carrinho v2 da mesa: criação com `board_movement_id`, token de sessão, itens e totais | — | — | #20, #21 | a especificar |
| 02 | Identidade de quem pede: diálogo de nome, persistência e troca | — | — | #20 | a especificar |
| 03 | Envio do pedido e tela de "pedido enviado" | — | — | 01, 02 | a especificar |
| 04 | Sacola no tablet: coluna fixa em paisagem e painel inferior em retrato | — | — | 01 | a especificar |
| 05 | Recusas do envio e estados da sacola (vazia, limpando, offline) | — | — | 03 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

## Ordem de execução

1. **`01` e `02` em paralelo** — a sacola é dado e serviço; o nome é provider e diálogo. Não se tocam.
2. **`03`** depois das duas, porque o envio precisa da sacola e do nome.
3. **`04`** depois da `01`.
4. **`05`** por último, porque mapeia as recusas que a `03` já exercitou.

Se for preciso escolher uma só: a **`01`**. Sem o carrinho no servidor, o resto é fachada sobre o modelo antigo.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | `board_movement_id` aceito no `POST /cart` e como eixo de posse; checkout de mesa (`shipment_method`/`kind` de mesa, sem `customer_address_id`); `person` por item a partir do `customer_name`. Spec irmã: [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608), `.claude/sdd/1608-client-board-cart-checkout/` | **Não existe.** Medido em `origin/master` em 2026-11-16: o `CreateCartController` não repassa o campo, e `CheckoutCartRequest` tem `in:delivery,pickup` |
| `delivery-api` | Setting `uses_v2_orders` ligada na loja de teste — o `orders.v2` guarda o preview e o checkout | Configuração por restaurante, não código |
| `delivery-socket-api` | Nada. `board_products_added` na sala da sessão já existe e é o que atualiza a conta depois do envio | Verificado em 2026-11-16 |

## Aprendizados que valem para as próximas tasks
