# Plan — Conta da mesa redesenhada

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortadas de `feat/indoor-v2`
**Alinhado à #24 e à #2 (2026-11-23):** a rota do pagamento é `/board/payment` (07); a 06 exporta a lista única de chaves da conta e o contrato de consumidor do socket; a 08 fecha o contrato do lugar de pagamento da coluna direita; a 07 documenta as peças que a #24 monta. Nenhuma dependência nem ordem desta feature mudou; ver "Donos de módulo compartilhado".

## Abordagem técnica

> **Fonte do design.** Token vem de `.claude/design-system/tokens.json` (versionado pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26)); layout, copy e estado vêm do protótipo citado em "Referência de design" na spec. Carregar a skill `modelo-de-design` antes de implementar tela. Ver a RN-11 da [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20).

Esta é a tela que **não** vem do `delivery-client` — ele não tem conta de mesa. O que vem de lá são os primitivos e a linguagem do detalhe do pedido (`src/components/order/detail/`: `OrderPaymentCard.tsx`, `OrderTotals`, a lista de status e a lista de itens), que o design diz explicitamente estar seguindo. O domínio é daqui: `src/components/board/` (~2,1k linhas) e os hooks `useFetchBoardMovement`, `useFecthBoardMovementProducts`, `useFetchBoardMovementPayments`, `use-board-socket`, `use-board-control-socket`.

**Dado.** Três leituras por React Query, com chaves `['board-movement', id]`, `['board-products', id]` e `['board-payments', id]`. Cada evento de socket **invalida** as chaves afetadas em vez de aplicar delta à mão — é o que resolve de uma vez a RN-02 (o `board_totals_changed` que não cobre pagamento nem gorjeta) e dispensa o middleware que hoje recalcula `total`, `totalPaid` e `isPaid` depois de oito ações. O custo é uma requisição por evento; numa mesa isso é desprezível e paga o erro de total desatualizado, que já aconteceu aqui.

**Agrupamento.** O agrupamento por rodada é função pura sobre `products` (`round` + `order_public_id`), testável sem render: entra lista plana, sai lista de grupos com cabeçalho, estado e itens. A hora do grupo é a do pedido e o estado é o do pedido: `order_created_at` e `round_status`, que a [delivery-api#1752](https://github.com/sgrande-delivery/delivery-api/issues/1752) acrescenta a cada item (task 03; ver "Dependências").

**Contador ao vivo.** `use-now.ts` do `delivery-client` (tique de 15 s, porque o design mostra minutos, e releitura no `visibilitychange`) mais um formatador puro de duração. O design mostra `{{ elapsed }}` em dois lugares — card de destaque e, no estado pago, o intervalo fechado.

**Socket.** O `SocketStore` do `/board` fica em module scope (regra do repo), o hook expõe por `useSyncExternalStore`, e o `subscribe_channel` é reemitido no `connect` com `off('connect', handler)` pela referência. Os cinco eventos da sala da movimentação ganham um handler só, que invalida as chaves — um `on`, um `off`, por evento.

**Ações.** "Chamar garçom" e "pedir a conta" são mutações cuja resposta é gravada no cache da movimentação, que é a fonte do estado para todos os botões; o intervalo mínimo entre chamadas é o `window_seconds` do servidor. "Pedir mais" é navegação. "Pagar conta" mostra o valor que falta e navega para a frente [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24), que relê o valor ao cobrar (task 07).

**Layout.** Três composições da mesma tela: celular (card, itens, resumo, pagamentos, barra de ações), tablet paisagem (duas colunas com rolagem independente, ações na coluna direita) e tablet retrato (coluna única, barra fixa embaixo). O design traz as três, e o shell da fundação já dá a barra superior do tablet.

## Decisões arquiteturais

- **Invalidar, não aplicar delta.** Decisão que troca o modelo atual (reducer + middleware que recalcula derivados). O motivo é medido: `UPDATE_TOTAL` é hoje o único escritor de `total`/`totalPaid`/`isPaid`, e o `SET_TOTALS` vindo do socket era apagado por ele no mesmo tick. Com invalidação, a fonte do total é uma só — o servidor.
- **O agrupamento é função pura.** É a regra mais visível da tela e a que mais vai mudar; fora do componente, ela é testável e reaproveitável pelo tablet.
- **A tela não liga a conta paga à liberação da mesa.** `is_board_paid` e `freed_at` são fatos diferentes, e confundi-los faria o app prometer algo que só o PDV faz.
- **Chamar garçom tem intervalo mínimo.** Sem ele, o botão vira ruído no PDV — e o PDV não tem como distinguir dez chamadas da mesma mesa de dez mesas chamando.
- **Implementar contra o contrato, sem esperar as outras pontas.** Garçom e pedido de conta ficam escritos contra o contrato das specs irmãs; o relatório da task avisa que as duas ações fecham quando a api e o socket subirem.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Leituras e tipos da conta: movimentação, itens e pagamentos por React Query, e a moldura de `/board` | [#53](https://github.com/sgrande-delivery/delivery-indoor/issues/53) | [53-board-bill-reads-and-screen-frame.md](./tasks/53-board-bill-reads-and-screen-frame.md) | #20 | shipped |
| 02 | Card de destaque: falta pagar, total, pago, percentual e contador ao vivo | [#54](https://github.com/sgrande-delivery/delivery-indoor/issues/54) | [54-board-bill-highlight-card.md](./tasks/54-board-bill-highlight-card.md) | 01 | shipped |
| 03 | Itens agrupados por rodada, com quem pediu e a composição do item | [#55](https://github.com/sgrande-delivery/delivery-indoor/issues/55) | [55-board-round-grouped-items.md](./tasks/55-board-round-grouped-items.md) | 01 | shipped |
| 04 | Resumo de valores: subtotal, taxa de serviço, desconto, pago e falta pagar | [#56](https://github.com/sgrande-delivery/delivery-indoor/issues/56) | [56-board-bill-totals.md](./tasks/56-board-bill-totals.md) | 01 | shipped |
| 05 | Pagamentos lançados e estado de conta paga | [#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57) | [57-board-payments-and-paid-state.md](./tasks/57-board-payments-and-paid-state.md) | 01, 02, 04 | shipped |
| 06 | Tempo real do `/board`: inscrição, reinscrição no `connect` e invalidação | [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58) | [58-board-realtime-socket.md](./tasks/58-board-realtime-socket.md) | 01 | shipped |
| 07 | Chamar garçom, pedir a conta, pedir mais e pagar | [#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59) | [59-board-attendance-actions.md](./tasks/59-board-attendance-actions.md) | 02, 06 | shipped |
| 08 | Tablet: paisagem em duas colunas e retrato com barra de ações fixa | [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60) | [60-tablet-board-bill-layouts.md](./tasks/60-tablet-board-bill-layouts.md) | 02–05, 07, #40 | pendente |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

Nesta feature todas as tasks são deste repo, então o arquivo leva o número da issue (`53-…` a `60-…`), e a coluna `#` guarda a ordem do plan. É a regra da [#20](../20-indoor-v2-foundation/plan.md); a feature 1 e a 2 numeram por ordem por serem cross-repo. As oito issues estão vinculadas como sub-issues da #23.

**Mapa de encaixe.** A 01 cria o `BoardScreen` e reserva, na mudança 9 dela, o lugar de cada bloco. A 02, a 03, a 04 e a 06 correm em paralelo sobre ela e se tocam só nesse arquivo. Na junção, o conflito é de linha vizinha, resolvido mantendo os dois lados pelo mapa, como o `src/App.tsx` na #20.

**Donos de módulo compartilhado com outras features:**

- `src/components/board/round-status.ts` e `RoundStatusPill.tsx` (03), reusados pela #48 da #22;
- `src/components/board/payments/payment-method-icon.ts` (05), reusado pela #24;
- `src/services/board-bill.ts` com as chaves `['board-products', id]` e `['board-payments', id]` (01), invalidadas pela #48 e pela #24;
- o `BoardScreen` (01), sem dependência de rota, que a #61 monta também em `/board/payment`;
- `useBoardSocket()` e o contrato de consumidor (06, decisão 6), por onde a #24 escuta `board.charge_updated` sem um segundo `SocketStore`, e `useBoardSocketConnection`, onde a #52 (feature #2) liga a credencial;
- `BOARD_BILL_QUERY_KEYS`/`resolveBoardBillQueryKeys` (06), a lista única de chaves da conta, em que a #61 põe `payment-options` no grupo `movement` e de onde a #63 relê a conta;
- `BOARD_PAYMENT_ROUTE = '/board/payment'` (07), a entrada do fluxo da #24, e o `ConnectedWaiterCallButton` e o `RequestBillAction` (07), que a #61 e a #63 montam ("Consumidores fora da conta" da 07);
- o lugar `payment` do `BoardBillAside` (08), ocupado pela #61, com o contrato da decisão 4 da 08.

## Ordem de execução

1. **`01` primeiro** — todas as outras leem dela, e a moldura de `/board` com o mapa de encaixe nasce nela.
2. **`02`, `03`, `04` e `06` em paralelo**, cada uma cortada da `01`: blocos diferentes da mesma tela, que só se tocam no `BoardScreen`. A `06` só é **validável** em navegador depois que os blocos existem.
3. **`05` depois da `02` e da `04`**: o cartão de pagamentos não depende delas, mas a composição da conta paga usa a variante paga do card (02) e do resumo (04).
4. **`07` depois da `02` e da `06`**: o "Pedir a conta" vai no espaço de ação do card, e o estado da chamada chega aos outros aparelhos pela releitura da `06`.
5. **`08` por último**, porque recompõe o que as outras entregaram, e com a #40 (task 01 da #21) na base, pelos cortes de orientação.

Se for preciso escolher uma só: a **`03`**. É a diferença mais visível entre a conta atual e a do design — item por rodada, com nome de quem pediu.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | Chamada de garçom e pedido de conta pelo cliente: `POST /boardMovements/{id}/waiter-calls`, `PATCH /boardMovements/{id}/request-bill` e `waiter_call: { id, created_at, window_seconds } \| null` no GET, com o pedido de conta do PDV chegando à mesa. Spec irmã: [delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610), emendada em 2026-11-23 (tasks #1645 a #1648) | **Spec escrita, não implementada.** Consumida pela `07` (contrato inline lá) |
| `delivery-api` | **Estado da rodada no payload dos itens:** `round_status` (`sent`, `preparing`, `ready`, `delivered`, `canceled`) e `order_created_at` em cada item de `GET /boardMovements/{id}/products` (#1754), os mesmos campos no `board_products_added` (#1755) e o post do evento de mudança de status (#1756). Spec irmã: [delivery-api#1752](https://github.com/sgrande-delivery/delivery-api/issues/1752) | **Spec escrita, não implementada.** Fecha a lacuna medida em 2026-11-16. Consumida pela `01` (tipo) e pela `03` (cabeçalho) |
| `delivery-api` | `GET /boardMovements/{id}` de lista fechada: sai `board_id`, `board.id`, `qr_code`, `admin_user` e o cadastro do cliente. Spec irmã: [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753) (task #1757) | **Spec escrita, não implementada.** A `01` ajusta o tipo; nada da conta lê o que sai |
| `delivery-socket-api` | `board.waiter_called` (sala da loja e da sessão, numa emissão) e `board.bill_requested` (sala da sessão). Spec irmã: [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65), a versão revisada (não o PR #67) | **Spec escrita, não implementada.** Escutados pela `06` |
| `delivery-socket-api` | `board.order_status_changed` na sala da movimentação, com debounce no consumidor. Spec irmã: [delivery-socket-api#75](https://github.com/sgrande-delivery/delivery-socket-api/issues/75) | **Spec escrita, não implementada.** Escutado pela `06` |
| `delivery-socket-api` | Os cinco eventos da sala da movimentação que a tela já consome | **Em produção.** Verificado em `src/nestjs/modules/board/events.ts` em 2026-11-16 e em `origin/master` `efd671e` em 2026-11-23 |
| `delivery-indoor` (feature [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)) | A credencial de sessão de mesa no handshake do `/board`: a [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) liga o token no hook da `06` | **Depende da `06`.** Os pontos de encaixe estão na `06` |

Ordem de deploy: a conta sobe em qualquer ordem em relação a essas specs. Escutar evento que ainda não chega não quebra, e campo ausente é normalizado para `null` na `01`. O que fica visível enquanto a API não publica: o cabeçalho da rodada sem selo e sem hora (até a #1754), e as ações de garçom e de conta respondendo 404 `route_not_found` (até a #1645–#1647). Os detalhes estão no relatório de cada task.

## Aprendizados que valem para as próximas tasks
