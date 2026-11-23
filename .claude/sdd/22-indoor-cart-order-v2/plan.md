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

**Erros.** Quatro recusas têm mensagem própria: movimentação fechada, cozinha fechada, item fora do ambiente da mesa e `403 v2_orders_disabled`. Os códigos são os da tabela "Recusas do caminho de mesa" da delivery-api#1608. A loja fechada com a cozinha aberta não recusa o pedido de mesa (RN-09 daqui, RN-10 de lá; *alinhado em 2026-11-23, o texto dizia "loja/cozinha"*). As demais caem no tratamento padrão da fundação. O `delivery-client` tem o mapa de erro de checkout em `src/components/checkout/` e o `http-error-code.ts` para ler o código da api — é o modelo.

## Decisões arquiteturais

- **Sacola no servidor, não local.** É o que permite ao pedido nascer v2 e aparecer com composição no painel v2; é também o que elimina o recálculo de total no cliente.
- **Uma sacola por aparelho (RN-01).** Sacola compartilhada entre os celulares da mesa seria outro produto: exigiria tempo real na composição, resolução de conflito e um dono para o "limpar". O design não pede.
- **O nome vai no checkout, não por item.** Um envio é de uma pessoa; replicar o nome em cada item é trabalho do servidor (frente irmã). Isso mantém o payload do app simples e deixa a regra num lugar só.
- **Idempotência no app e no servidor.** A chave cobre o retry de rede; o bloqueio do botão cobre o duplo toque. Os dois, porque pedido duplicado na cozinha é prejuízo e vergonha na frente do cliente.
- **Implementar contra o contrato, sem esperar a api.** Hoje `POST /cart` ignora `board_movement_id` e o checkout recusa mesa. A task escreve o payload do contrato; o relatório avisa que o envio fecha quando a [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608) subir.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Carrinho v2 da mesa: criação com `board_movement_id`, token de sessão, itens e totais | [#46](https://github.com/sgrande-delivery/delivery-indoor/issues/46) | [46-board-cart-v2.md](./tasks/46-board-cart-v2.md) | #20, #21 (01 e 04) | pendente |
| 02 | Identidade de quem pede: diálogo de nome, persistência e troca | [#47](https://github.com/sgrande-delivery/delivery-indoor/issues/47) | [47-ordering-person-identity.md](./tasks/47-ordering-person-identity.md) | #20 | pendente |
| 03 | Envio do pedido e tela de "pedido enviado" | [#48](https://github.com/sgrande-delivery/delivery-indoor/issues/48) | [48-send-order-confirmation.md](./tasks/48-send-order-confirmation.md) | 01, 02, 04, #23 (01 e 03) | pendente |
| 04 | Sacola no tablet: coluna fixa em paisagem e painel inferior em retrato | [#49](https://github.com/sgrande-delivery/delivery-indoor/issues/49) | [49-tablet-cart-panel.md](./tasks/49-tablet-cart-panel.md) | 01 (e, para o roteiro em navegador, #21 03 e 05) | pendente |
| 05 | Recusas do envio e estados da sacola (vazia, limpando, offline) | [#50](https://github.com/sgrande-delivery/delivery-indoor/issues/50) | [50-send-refusals-cart-states.md](./tasks/50-send-refusals-cart-states.md) | 03 | pendente |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

Nesta feature todas as tasks são deste repo, então o arquivo leva o número da issue (`46-…` a `50-…`), e a coluna `#` guarda a ordem do plan. É a regra da #20, e não a da feature 1, que numera por ordem por ser cross-repo.

**A 03 passou a depender da 04 e das tasks 01 e 03 da #23** (materialização de 2026-11-23; a 03 da #23 entrou no alinhamento do mesmo dia). A confirmação do envio no tablet (RF-09a) mora na coluna e no painel que a 04 cria. O selo "Pedido 3 · enviado" sai do item de `GET /boardMovements/{id}/products` casado pelo `order_public_id`: o `round` e o `round_status` vêm da leitura da [#53](../23-indoor-board-bill-redesign/tasks/53-board-bill-reads-and-screen-frame.md) (`useBoardProducts`), e o rótulo, o tom e o selo vêm de `round-status.ts` e `RoundStatusPill`, de que a [#55](../23-indoor-board-bill-redesign/tasks/55-board-round-grouped-items.md) é dona. O selo muda ao vivo com a [#58](../23-indoor-board-bill-redesign/tasks/58-board-realtime-socket.md) na base. A 04 continua dependendo só da 01, e por isso corre junto da 02.

**O gerador de UUID é um só** (alinhamento com a #24, 2026-11-23): a 01 cria `src/helpers/random-uuid.ts`, e a 03 (chave do envio) e a [#24](../24-indoor-board-payment/plan.md) (chave do pagamento) o importam.

**Reconciliação com a #21 (2026-11-23).** As tasks das duas features foram escritas em paralelo e divergiam em quatro encaixes; ficou assim, e as tasks citadas carregam a linha "Reconciliado com a #21":

- **Adicionar à sacola.** O encaixe é o da [#43](../21-indoor-menu-v2/tasks/43-product-detail-composer.md): o detalhe chama `useProductAddAction().add(selection)` e não importa nada da sacola. A 01 cria o `CartAddActionProvider` sobre `useAddCartItem()` e o monta em `app/(menu)/layout.tsx`, em volta do host. O corpo de `POST /cart/{cartId}/items` é a `ProductSelection` de `src/types/product-selection.ts` ([#40](../21-indoor-menu-v2/tasks/40-catalog-v2-services-types.md)), mandada sem tradução: saiu o `AddCartItemPayload` camelCase. As mensagens de falha ao adicionar são desta feature (01 e 05); a regra de quando o CTA aparece ou desabilita é da #43, e o `useCanWriteCart()` da 05 saiu.
- **Coluna da sacola no tablet.** Dono único: o `AppShell`, pela 04. A [#45](../21-indoor-menu-v2/tasks/45-tablet-menu-grid.md) perdeu o `MenuFrame`/`aside`. `isCartDockRoute` lista as rotas do grupo `app/(menu)/`, e rota nova no grupo entra no predicado no mesmo commit.
- **Cortes de orientação e `formatCents`.** Nascem na #40 (`shell-metrics.ts` e `src/helpers/money.ts`), e esta feature só os importa; a porta de reserva de `formatCents` que a 01 previa saiu.
- **Stepper de 40.** O follow-up é um só, na #43; a 01 e a 04 apontam para lá.

## Ordem de execução

1. **`01` e `02` em paralelo** — a sacola é dado e serviço; o nome é provider e diálogo. Não se tocam.
2. **`04`** depois da `01`, ainda em paralelo com a `02`: monta a coluna e o painel do tablet em volta do `CartPanel` da `01`. O roteiro em navegador dela navega por `/menu` e `/search`, que a 03 e a 05 da #21 criam; com elas fora da base, esse passo vai para a junção.
3. **`03`** depois de `01`, `02` e `04`, e com as tasks 01 e 03 da #23 (#53 e #55) na base: o envio precisa da sacola, do nome, das molduras do tablet onde a confirmação aparece, da leitura da conta e do selo da rodada.
4. **`05`** por último, porque mapeia as recusas que a `03` já exercitou.

Se for preciso escolher uma só: a **`01`**. Sem o carrinho no servidor, o resto é fachada sobre o modelo antigo.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | `board_movement_id` aceito no `POST /cart` (#1628); checkout de mesa (`shipment_method: board`, `kind=board`, sem `customer_address_id`, sem login, #1631); `person` por item a partir do `customer_name` (#1630, #1631). Spec irmã: [delivery-api#1608](https://github.com/sgrande-delivery/delivery-api/issues/1608), `.claude/sdd/1608-client-board-cart-checkout/` | **Especificado, não implementado.** Medido em `origin/master` @ `8db44045e` em 2026-11-23: o `CreateCartController` não repassa o campo, e `CheckoutCartRequest` tem `in:delivery,pickup` |
| `delivery-api` | **Códigos de recusa.** `404 board_movement_not_found_for_cart`, `422 board_movement_freed`, `422 board_movement_closed` (#1628, #1633), `422 product_unavailable` (#1766), `422 kitchen_closed` (#1767), e a loja fechada sem recusa no pedido de mesa (RN-10) | **Fixados lá em 2026-11-23** (RN-11 e a tabela "Recusas do caminho de mesa"), com a proposta da [#50](./tasks/50-send-refusals-cart-states.md) adotada nos nomes. "Fechada" e "liberada" são 422, e não 409. Mudar um código depois é divergência de contrato |
| `delivery-api` | **Disponibilidade pelo ambiente do carrinho**, na entrada do item e no checkout: o produto só de mesa entra, e o que a mesa não vende é `422 product_unavailable` | [#1766](https://github.com/sgrande-delivery/delivery-api/issues/1766), task nova de 2026-11-23. Hoje o `AddCartItemUseCase.php:84` cobra entrega fixo, e o checkout de mesa não confere nada (`OrderIntegrityValidator.php:206,239-244`) |
| `delivery-api` | **Cozinha fechada com código próprio** no pedido de mesa v2 | [#1767](https://github.com/sgrande-delivery/delivery-api/issues/1767), task nova de 2026-11-23. Hoje é `400 bad_request` (`RestaurantOpeningValidator.php:68-70`) |
| `delivery-api` | **Posse da sacola** | **Fechada pela [#1629](https://github.com/sgrande-delivery/delivery-api/issues/1629) em 2026-11-23:** só o `x-cart-session-token`, sem eixo nem header de movimentação. É o que a [#46](./tasks/46-board-cart-v2.md) já manda |
| `delivery-api` | Setting `uses_v2_orders` ligada na loja de teste — o `orders.v2` guarda o preview e o checkout | Configuração por restaurante, não código |
| `delivery-socket-api` | Nada. `board_products_added` na sala da sessão já existe e é o que atualiza a conta depois do envio | Verificado em 2026-11-16 |

## Aprendizados que valem para as próximas tasks

- **2026-11-23 — Regra de bloqueio que a spec escreve de memória precisa ser conferida contra a v1 em produção e contra a api.** A RN-09 dizia "loja ou cozinha fechada bloqueia o envio". A v1 trava só pela cozinha (`CartButtonts.tsx:53-56`), e as duas versões da api também (`CreateOrderUseCase.php:131-137`, `RestaurantOpeningValidator.php:24-31`). A #50 chegou a travar pelos dois "seguindo a spec", com a pendência registrada, até a 1608 fechar a regra. Antes de escrever uma trava de UI, procurar a regra no servidor: a tela que trava mais que o servidor recusa pedido que a loja aceitaria.
