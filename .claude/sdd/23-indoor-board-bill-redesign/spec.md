# Spec — Conta da mesa redesenhada

**Status:** entregue
**Criada em:** 2026-11-16
**Escopo:** cross-repo
**Issue:** [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23)
**Emendada em:** 2026-11-23 — a RN-01, a RN-07 e a tabela "Contrato consumido" passam a dizer o contrato de hoje (`discount` no `GET` da movimentação, `amount` no item, `person` texto ou nulo), e as decisões pendentes 2, 3 e 4 registram o que as tasks aplicaram. Ver "Decisões tomadas".

## Contexto

A conta da mesa é a tela principal do app: é para ela que o cliente volta entre as rodadas, e é por ela que acompanha o que o garçom lança no PDV. Hoje ela existe (`/board`, ~2,1k linhas em `src/components/board/`), mostra produtos lançados, pagamentos e total, e é alimentada por socket. O que ela não tem é o desenho novo — e o desenho novo muda o que a tela diz, não só como ela aparece.

O que o design (`Brasa Punch Indoor - Conta da Mesa`) define e a tela atual não entrega:

- **Um card de destaque no topo** com o que **falta pagar** em primeiro plano, o total da conta e quanto já foi pago, com percentual e barra de progresso. Hoje o destaque é o total.
- **Um contador ao vivo** de "mesa ocupada há", com a hora de abertura ao lado.
- **Itens agrupados por pedido** — "Pedido 2 · 19:48" com o estado da rodada ("EM PREPARO", "ENTREGUE") — e **o nome de quem pediu** em cada item. Hoje a lista é plana.
- **O resumo de valores completo**: subtotal, taxa de serviço com o percentual, total da conta, já pago e falta pagar.
- **O estado de conta paga**, com o tempo de mesa fechado ("1h 52min · 19:05 – 20:57") e os pagamentos que a fecharam.
- **As ações à mão**: pagar a conta, chamar o garçom e pedir mais.

O contrato já serve quase tudo isso, e isso foi medido em 2026-11-16 na `origin/master` da api: `GET /boardMovements/{id}` devolve `subtotal`, `tip_pct`, `tip_amount`, `total_due`, `total_paid`, `is_board_paid`, `opened_at`, `first_order_at`, `bill_requested_at`, `paid_at`, `pax` e `admin_user`; `GET /boardMovements/{id}/products` devolve, por item, `round`, `person`, `category_kind`, `observations`, `order_public_id`, `option_selections` e `removed_ingredients`. Desde o `2aaf0d30d` da api (2026-11-19), o `GET /boardMovements/{id}` também devolve `discount`, e o `total_due` o desconta (remedido em 2026-11-23 na `origin/master` `8db44045e`; ver "Decisões tomadas"). O que **não** existe é a chamada de garçom e o pedido de conta pelo lado do cliente — hoje `request-bill` é rota de admin, e chamada de garçom não existe em lugar nenhum da plataforma.

## Objetivo

A conta da mesa ganha o desenho novo em celular e nos dois formatos de tablet, lendo a movimentação, os itens por rodada e os pagamentos do contrato v1 da mesa, com tempo real pelo namespace `/board`, e passa a oferecer chamar o garçom, pedir a conta e pedir mais.

## Contrato consumido

| Rota | O que é usado |
|---|---|
| `GET /boardMovements/{id}` | `board.number`/`board.name`, `pax`, `subtotal`, `discount`, `tip_pct`, `tip_amount`, `total_due` (`max(0, subtotal − discount) + tip_amount`), `total_paid`, `is_board_paid`, `opened_at`, `first_order_at`, `bill_requested_at`, `paid_at`, `freed_at` |
| `GET /boardMovements/{id}/products` | `{ products: [...], total, discount }`; a conta não lê o `total` nem o `discount` daqui. Por item: `name`, `amount` (float, fracionário no item dividido; **não** é `quantity`), `price`/`final_price`, `round`, `person` (`string \| null`), `category_kind`, `observations`, `order_public_id`, `option_selections`, `removed_ingredients` |
| `GET /boardMovements/{id}/payments` | por pagamento: `value`, `tip_amount`, `person`, `split_mode`, `created_at` e `payment_method` (nome e tipo) |

Socket, namespace `/board`, sala da movimentação (`subscribe_channel` com o uuid): `board_products_added`, `board_product_deleted`, `board_payment_added`, `board_payment_deleted`, `board_totals_changed`.

**Valores da mesa são float em real** — este é o contrato v1, e é diferente do catálogo e do carrinho v2, que falam centavos.

## Requisitos funcionais

- **RF-01** — O card de destaque mostra o que falta pagar como valor principal, o total da conta, o valor já pago, o percentual pago e o estado da conta.
- **RF-02** — O contador "mesa ocupada há" é ao vivo, calculado de `opened_at`, e a hora de abertura aparece ao lado.
- **RF-03** — Os itens são agrupados por rodada (`round`), em ordem decrescente, com o cabeçalho do pedido, a hora e o estado da rodada.
- **RF-04** — Cada item mostra quantidade, nome, o nome de quem pediu, o valor unitário quando a quantidade é maior que 1, a composição (adicionais e ingredientes removidos) e o valor da linha.
- **RF-05** — Item sem imagem usa o ícone da categoria, como no design.
- **RF-06** — O resumo mostra subtotal, taxa de serviço com o percentual (`tip_pct`), desconto quando houver, total da conta, já pago e falta pagar.
- **RF-07** — A lista de pagamentos mostra forma, quem pagou, quando e o valor, com o ícone da forma.
- **RF-08** — Com a conta paga, a tela troca para o estado de conta paga: total pago, tempo de mesa fechado com o intervalo, e os pagamentos.
- **RF-09** — A tela se atualiza sem reload quando o PDV lança item, remove item, registra pagamento ou altera o total.
- **RF-10** — Ao reconectar, a inscrição na sala da movimentação é reemitida, e a tela recarrega a conta.
- **RF-11** — Há ação de atualizar manualmente, como no design.
- **RF-12** — "Chamar garçom" chama o garçom e mostra que a chamada foi feita, com a hora; a ação não pode ser disparada repetidamente sem retorno.
- **RF-13** — "Pedir a conta" marca o pedido de fechamento e a tela passa a mostrar esse estado (`bill_requested_at`).
- **RF-14** — "Pedir mais" leva ao cardápio.
- **RF-15** — "Pagar conta" leva ao fluxo de pagamento da frente [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24), com o valor que falta.
- **RF-16** — Sem `session`, ou com movimentação inexistente ou já liberada, a tela mostra o estado de "sem mesa" da fundação.
- **RF-17** — No tablet em paisagem, itens à esquerda e o bloco de conta e pagamento à direita, cada coluna com rolagem própria; em retrato, coluna única com barra de ações fixa embaixo.
- **RF-18** — Carregamento usa skeleton com a forma dos blocos; falha que impede a tela usa a tela de erro da fundação, com o código do erro.
- **RF-19** — Conta quitada no tablet em paisagem: a coluna da direita vira o bloco de encerramento — `check_circle` em `success`, "Conta paga", o total quitado, **a lista dos pagamentos com forma, nome e hora**, e a ação de chamar garçom; os itens continuam legíveis à esquerda e o chip da mesa na barra superior passa a "Mesa 12 · paga". Nada de pagar aparece mais na tela.

## Regras de negócio

- **RN-01 — A conta é do servidor; a tela não faz aritmética de dinheiro além do que o contrato não dá.** `subtotal`, `discount`, `tip_amount`, `total_due`, `total_paid` e `is_board_paid` vêm prontos de `GET /boardMovements/{id}`, e `total_due = max(0, subtotal − discount) + tip_amount` já desconta o desconto (`BoardBillAmounts`, api). O único valor derivado é o que falta pagar, com o percentual pago: `max(0, roundToCents(total_due − total_paid))`, espelhando o `BoardBillAmounts::remainingWith` da api, num lugar só (`bill-amounts.ts`, task 01). O desconto exibido é o do `GET` da movimentação, e não o de `/products`, para o total e as parcelas saírem da mesma resposta. *Texto corrigido em 2026-11-23: a versão anterior dizia que o desconto não vinha no `GET` e era o único derivado, o que valia até o `2aaf0d30d`.*
- **RN-02 — `board_totals_changed` não significa "o total mudou".** Ele é emitido **só** na criação e na exclusão de `OrderProduct` (único chamador: `OrderProductBoardObserver`). Não dispara em pagamento, não dispara quando a gorjeta muda (`PUT /boardMovements/{id}` altera `tip_amount` sem emitir nada) e não dispara em split/join de produto. Tratar esse evento como sinal genérico de "recarregue o total" é o que deixa a conta desatualizada em silêncio — o caminho confiável é invalidar a leitura da movimentação a cada evento da mesa.
- **RN-03 — Um `off` por `on`, com o mesmo nome de evento.** Listener duplicado aqui custa dispatch e render duplicados; os reducers atuais são idempotentes por acaso, e o código novo não pode contar com isso.
- **RN-04 — Sala de socket é por conexão de servidor.** Ao reconectar, a instância do socket é a mesma (efeitos com `[socket]` nas dependências **não** re-executam), mas o servidor perdeu a sala. Sem reemitir `subscribe_channel` no `connect`, qualquer deploy do socket deixa a conta congelada até o reload. E o `off('connect', handler)` tem de ser com a referência — um `off('connect')` cego derruba o listener interno do store.
- **RN-05 — Não há replay no socket.** Quem conecta depois do evento não o recebe. A tela nasce do REST e usa o socket só para os deltas; depois de qualquer reconexão, reler o REST.
- **RN-06 — A conta é compartilhada e concorrente.** O garçom lança item no PDV enquanto o cliente olha a tela, e outra pessoa da mesa pode estar pagando no celular dela. A tela nunca presume que o que ela tem é a verdade mais recente: toda ação que dependa de valor (pagar, pedir a conta) revalida antes de agir.
- **RN-07 — `person` pode ser nulo, e é texto.** O contrato é `person: string | null`: item lançado pelo garçom no PDV não tem pessoa, e o "Marina · Rafael" do design é o texto como ele vem, e não uma lista. A tela não quebra nem junta nomes, não esconde o item sem pessoa, e não deduz quem pediu de outro campo. Item dividido aparece como linhas com `amount` fracionário. *Texto corrigido em 2026-11-23: a versão anterior dizia "pode ser mais de um", o que o contrato não tem.*
- **RN-08 — Dinheiro da mesa é float em real; dinheiro do catálogo e do carrinho é centavo.** As duas convenções convivem no app enquanto a mesa for v1. Cada tipo diz de qual rota veio, e a formatação passa por um helper só.
- **RN-09 — O estado da rodada vem do pedido, não do item.** "EM PREPARO" e "ENTREGUE" são estado do pedido daquela rodada; o item não tem status próprio. Agrupar por `round` e pelo `order_public_id` é o que permite mostrar o estado uma vez por grupo.
- **RN-10 — Chamar o garçom é ação sem resultado visível no salão para o cliente.** O cliente não sabe se o garçom viu. A tela diz o que é verdade — "garçom chamado às 20:12" — e não promete atendimento; e a ação tem um intervalo mínimo entre chamadas, para não virar um botão de spam contra o PDV.
- **RN-11 — Conta paga não libera a mesa.** `is_board_paid` é saldo zerado; liberar a mesa é ação do PDV (`PATCH /boardMovements/{id}/free`). A tela de conta paga agradece a visita e **não** oferece liberar a mesa.

## Referência de design

Canvas [Brasa Punch Indoor](https://claude.ai/artifact/E8mKAq2MKaCRXcRVLeDh1u): `Conta · tablet deitado` (itens à esquerda, conta e pagamento à direita), `Conta · tablet em pé` (coluna única com barra de ações fixa) e `Conta · tablet deitado · conta paga`; no celular, `Conta · celular · em aberto` e `Conta · celular · paga`, e `Conta · desktop 1440`. Os estados da tela em tablet são `Estado · carregando (skeleton)`, `Estado · erro de rota`, `Estado · offline` e `Estado · sem mesa (sem session)`.

O protótipo é fonte de **layout, hierarquia, copy e estados**. **Token — cor, fonte, raio, espaçamento e sombra — vem de `design-system/tokens.json`, e os três formatos de layout da tabela "Os três formatos" do `design-system/README.md`**, não do protótipo, e a cor da marca vem de `restaurant.primary_color` em runtime. Antes de implementar, carregar a skill `modelo-de-design`.

## Fora do escopo

- O fluxo de pagamento em si — frente [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24). Aqui só existe a entrada ("Pagar conta") e o reflexo do pagamento na conta.
- Detalhe de produto lançado em tela própria (o `src/components/board/` atual tem essa tela): avaliar na execução se o desenho novo a mantém, porque o design mostra a composição direto na linha do item.
- Dividir a conta por item (o `coverage` e o `split_mode` que o PDV já grava). O design divide por **valor**, não por item.
- Avaliação da visita e recibo por e-mail.
- A implementação da chamada de garçom e do pedido de conta na api e no socket — são [delivery-api#1610](https://github.com/sgrande-delivery/delivery-api/issues/1610) e [delivery-socket-api#65](https://github.com/sgrande-delivery/delivery-socket-api/issues/65).

## Critérios de aceitação

- [ ] A conta abre pelo QR com `?session=` e mostra falta pagar, total, pago, percentual e o contador correndo.
- [ ] O contador avança sem reload e confere com `opened_at`.
- [ ] Os itens aparecem agrupados por rodada, na ordem do design, com o nome de quem pediu.
- [ ] Um item com adicional e ingrediente removido mostra a composição na linha.
- [ ] Subtotal + taxa de serviço − desconto = total da conta, e total − pago = falta pagar, conferidos com o payload.
- [ ] Lançar um item no PDV faz a conta mudar sem reload; registrar um pagamento no PDV também.
- [ ] Reiniciar o socket (ou derrubar a rede e voltar) mantém a conta atualizando, sem reload.
- [ ] Pagar tudo pelo PDV troca a tela para o estado de conta paga, com o intervalo de tempo de mesa.
- [ ] "Chamar garçom" mostra o estado de chamada feita e não dispara duas vezes seguidas.
- [ ] Em tablet paisagem as duas colunas rolam independentemente; em retrato a barra de ações fica fixa.
- [ ] Com a conta quitada, a coluna da direita mostra os pagamentos (forma, nome e hora) e nenhuma ação de pagar.
- [ ] Sem `session`, a tela de "sem mesa" aparece em vez de conta vazia.

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Taxa de serviço quando `tip_pct` é zero | Esconder a linha. Loja que não cobra taxa não deve ver "Taxa de serviço (0%) R$ 0,00" |
| 2 | Onde fica a ação de pagar no tablet paisagem | Na coluna da direita, abaixo do card de destaque, como no design — e não numa barra inferior, que em paisagem fica longe das mãos. *Aplicado em 2026-11-23 pela [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60) (o lugar `payment` do `BoardBillAside`, decisão 4 de lá) e pela [#61](https://github.com/sgrande-delivery/delivery-indoor/issues/61), que o ocupa com o formulário de pagamento e tira o botão "Pagar conta" em paisagem. O texto anterior dizia "abaixo do resumo", mas no tablet o resumo fica na coluna dos itens (#60, decisão 2)* |
| 3 | Intervalo mínimo entre chamadas de garçom | 2 minutos, com o botão mostrando o estado de chamada feita nesse intervalo. Valor a confirmar com o salão. *Em 2026-11-23: a janela é a `window_seconds` da api (delivery-api#1647, decisão pendente 2 da 1610), lida do contrato; o app não a fixa ([#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59))* |
| 4 | "Pedir a conta" é botão próprio ou consequência de "Pagar conta" | Botão próprio, no bloco de ações: o cliente que vai pagar em dinheiro na maquininha do garçom precisa pedir a conta **sem** passar pelo pagamento no app. *Em 2026-11-23, pendente para o dev: a [#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59) (decisão 1) mantém o botão próprio, mas o põe no card de destaque, e não na barra de ações, porque nenhum formato do design desenha a ação e a barra do celular não comporta um terceiro botão. A mesma peça (`RequestBillAction`) aparece no estado "loja sem canal online" da [#61](https://github.com/sgrande-delivery/delivery-indoor/issues/61), com o mesmo estado. Confirmar o lugar* |
| 5 | Detalhe do item lançado | Manter a tela de detalhe atual só se a execução mostrar que a composição não cabe na linha; o design não a prevê |
| 6 | Nome de quem pagou no tablet compartilhado | **Sem default: divergência entre fontes, registrada em 2026-11-23 e a decidir pelo dev.** O princípio 4 do `design-system/README.md` (e a skill `modelo-de-design`) diz que no tablet não aparece "o nome de quem pagou antes"; a RF-07, a RF-19 e o artboard `Conta · tablet deitado · conta paga` ("Pix · Rafael") o mostram. **O comportamento escrito não muda até a decisão:** a [#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57) (decisão 8) e a [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60) mostram o nome. A mesma pendência está na spec da #24 (decisão pendente 9) |

## Decisões tomadas

- **2026-11-23 — o texto da RN-01, da RN-07 e da tabela "Contrato consumido" passa a ser o contrato de hoje** (passada de consistência entre a #23, a #24 e a #2). Medido na `delivery-api` `origin/master` `8db44045e`: o `GET /boardMovements/{id}` devolve `discount` e `total_due = max(0, subtotal − discount) + tip_amount` (`BoardMovementDetailPresenter.php:34`, `BoardBillAmounts.php`, desde o `2aaf0d30d` de 2026-11-19), e `is_board_paid` é `subtotal > 0 && total_paid >= total_due`, sem tolerância; o item de `/products` tem `amount` (float) e `person` (`string | null`). As tasks já eram escritas contra esse contrato (#53, "Contrato"; #55, decisão 7; #56); o que muda é o texto da spec.
- **2026-11-23 — a rota do pagamento é `/board/payment`**, a `BOARD_PAYMENT_ROUTE` que a [#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59) declara e a #24 usa (antes, a #24 escrevia `/board/pay`).
- **2026-11-23 — o socket da conta é o da [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58), para a conta, para a #24 e para a feature #2.** A conexão e a sala são do `BoardRealtime`, na raiz, em toda rota; a #24 escuta o `board.charge_updated` pelo `useBoardSocket()` e acrescenta `payment-options` à lista única de chaves da #58; a [#52](https://github.com/sgrande-delivery/delivery-indoor/issues/52) (feature #2) liga a credencial no mesmo hook.
- **2026-11-23 — o lugar de pagamento da coluna direita do tablet deitado tem um contrato só**, na decisão 4 da [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60), seguido pela #61 e pela #66.
- **2026-11-23 — "O garçom já foi avisado" sai por default** do encerramento ([#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60), decisão 9) e da confirmação do pagamento (#63, decisão 10), a confirmar com o dev. Medido no `delivery-admin` `origin/master`: a tela de gestão de mesas assina a sala de cada movimentação, mas não escuta `board_payment_added`, e nenhum caminho avisa o garçom de um pagamento. É a RN-10.
