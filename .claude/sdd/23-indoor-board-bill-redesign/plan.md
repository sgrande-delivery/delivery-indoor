# Plan — Conta da mesa redesenhada

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortadas de `feat/indoor-v2`

## Abordagem técnica

> **Fonte do design.** O design system está sendo centralizado neste repo (PR a caminho, padrão do `delivery-admin`). Antes de implementar tela, conferir se a centralização já entrou: entrou, a fonte é o arquivo versionado; não entrou, é a página do canvas "Brasa Punch". Ver a feature [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20), RN-11.

Esta é a tela que **não** vem do `delivery-client` — ele não tem conta de mesa. O que vem de lá são os primitivos e a linguagem do detalhe do pedido (`src/components/order/detail/`: `OrderPaymentCard.tsx`, `OrderTotals`, a lista de status e a lista de itens), que o design diz explicitamente estar seguindo. O domínio é daqui: `src/components/board/` (~2,1k linhas) e os hooks `useFetchBoardMovement`, `useFecthBoardMovementProducts`, `useFetchBoardMovementPayments`, `use-board-socket`, `use-board-control-socket`.

**Dado.** Três leituras por React Query, com chaves `['board-movement', id]`, `['board-products', id]` e `['board-payments', id]`. Cada evento de socket **invalida** as chaves afetadas em vez de aplicar delta à mão — é o que resolve de uma vez a RN-02 (o `board_totals_changed` que não cobre pagamento nem gorjeta) e dispensa o middleware que hoje recalcula `total`, `totalPaid` e `isPaid` depois de oito ações. O custo é uma requisição por evento; numa mesa isso é desprezível e paga o erro de total desatualizado, que já aconteceu aqui.

**Agrupamento.** O agrupamento por rodada é função pura sobre `products` (`round` + `order_public_id`), testável sem render: entra lista plana, sai lista de grupos com cabeçalho, estado e itens. A hora do grupo é a do pedido; o estado da rodada precisa vir do pedido — hoje o item traz `round` e `order_public_id`, e **não** traz o status do pedido. Ver "Dependências".

**Contador ao vivo.** `use-now.ts` do `delivery-client` (tick por segundo, com `visibilitychange`) mais um formatador puro de duração. O design mostra `{{ elapsed }}` em dois lugares — card de destaque e, no estado pago, o intervalo fechado.

**Socket.** O `SocketStore` do `/board` fica em module scope (regra do repo), o hook expõe por `useSyncExternalStore`, e o `subscribe_channel` é reemitido no `connect` com `off('connect', handler)` pela referência. Os cinco eventos da sala da movimentação ganham um handler só, que invalida as chaves — um `on`, um `off`, por evento.

**Ações.** "Chamar garçom" e "pedir a conta" são mutações com estado otimista curto e intervalo mínimo entre chamadas. "Pedir mais" é navegação. "Pagar conta" é navegação para a frente [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24), levando o valor que falta.

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
| 01 | Leituras e tipos da conta: movimentação, itens e pagamentos por React Query | — | — | #20 | a especificar |
| 02 | Card de destaque: falta pagar, total, pago, percentual e contador ao vivo | — | — | 01 | a especificar |
| 03 | Itens agrupados por rodada, com quem pediu e a composição do item | — | — | 01 | a especificar |
| 04 | Resumo de valores: subtotal, taxa de serviço, desconto, pago e falta pagar | — | — | 01 | a especificar |
| 05 | Pagamentos lançados e estado de conta paga | — | — | 01 | a especificar |
| 06 | Tempo real do `/board`: inscrição, reinscrição no `connect` e invalidação | — | — | 01 | a especificar |
| 07 | Chamar garçom, pedir a conta e pedir mais | — | — | 02 | a especificar |
| 08 | Tablet: paisagem em duas colunas e retrato com barra de ações fixa | — | — | 02–05 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

## Ordem de execução

1. **`01` primeiro** — todas as outras leem dela.
2. **`02`, `03`, `04` e `05` em paralelo**: blocos diferentes da mesma tela, arquivos diferentes.
3. **`06`** pode correr junto das quatro, porque só invalida chaves — mas só é **validável** depois que os blocos existem.
4. **`07`** depois da `02`, que define o bloco de ações.
5. **`08`** por último, porque recompõe o que as outras entregaram.

Se for preciso escolher uma só: a **`03`**. É a diferença mais visível entre a conta atual e a do design — item por rodada, com nome de quem pediu.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | Chamada de garçom e pedido de conta pelo cliente. Spec irmã: [delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610), `.claude/sdd/1610-client-board-waiter-call/` | **Não existe.** Chamada de garçom não existe na plataforma; `request-bill` é rota de admin |
| `delivery-api` | **Estado da rodada no payload dos itens.** O design mostra "EM PREPARO"/"ENTREGUE" por pedido, e `GET /boardMovements/{id}/products` devolve `round` e `order_public_id`, mas **não** o status do pedido. Medido em 2026-11-16 no `BoardMovementProductPresenter` | **Lacuna.** Precisa entrar na spec irmã da api ou em task própria — decidir na execução da task `03`; sem isso, o cabeçalho do grupo sai sem o estado |
| `delivery-socket-api` | Chamada de garçom e conta pedida alcançando a sala da sessão, para os outros aparelhos da mesa. Spec irmã: [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65) | **Não existe** |
| `delivery-socket-api` | Os cinco eventos da sala da movimentação que a tela já consome | **Em produção.** Verificado em `src/nestjs/modules/board/events.ts` em 2026-11-16 |

## Aprendizados que valem para as próximas tasks
