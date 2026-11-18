# Spec — Conta da mesa redesenhada

**Status:** rascunho
**Criada em:** 2026-11-16
**Escopo:** cross-repo
**Issue:** [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23)

## Contexto

A conta da mesa é a tela principal do app: é para ela que o cliente volta entre as rodadas, e é por ela que acompanha o que o garçom lança no PDV. Hoje ela existe (`/board`, ~2,1k linhas em `src/components/board/`), mostra produtos lançados, pagamentos e total, e é alimentada por socket. O que ela não tem é o desenho novo — e o desenho novo muda o que a tela diz, não só como ela aparece.

O que o design (`Brasa Punch Indoor - Conta da Mesa`) define e a tela atual não entrega:

- **Um card de destaque no topo** com o que **falta pagar** em primeiro plano, o total da conta e quanto já foi pago, com percentual e barra de progresso. Hoje o destaque é o total.
- **Um contador ao vivo** de "mesa ocupada há", com a hora de abertura ao lado.
- **Itens agrupados por pedido** — "Pedido 2 · 19:48" com o estado da rodada ("EM PREPARO", "ENTREGUE") — e **o nome de quem pediu** em cada item. Hoje a lista é plana.
- **O resumo de valores completo**: subtotal, taxa de serviço com o percentual, total da conta, já pago e falta pagar.
- **O estado de conta paga**, com o tempo de mesa fechado ("1h 52min · 19:05 – 20:57") e os pagamentos que a fecharam.
- **As ações à mão**: pagar a conta, chamar o garçom e pedir mais.

O contrato já serve quase tudo isso, e isso foi medido em 2026-11-16 na `origin/master` da api: `GET /boardMovements/{id}` devolve `subtotal`, `tip_pct`, `tip_amount`, `total_due`, `total_paid`, `is_board_paid`, `opened_at`, `first_order_at`, `bill_requested_at`, `paid_at`, `pax` e `admin_user`; `GET /boardMovements/{id}/products` devolve, por item, `round`, `person`, `category_kind`, `observations`, `order_public_id`, `option_selections` e `removed_ingredients`. O que **não** existe é a chamada de garçom e o pedido de conta pelo lado do cliente — hoje `request-bill` é rota de admin, e chamada de garçom não existe em lugar nenhum da plataforma.

## Objetivo

A conta da mesa ganha o desenho novo em celular e nos dois formatos de tablet, lendo a movimentação, os itens por rodada e os pagamentos do contrato v1 da mesa, com tempo real pelo namespace `/board`, e passa a oferecer chamar o garçom, pedir a conta e pedir mais.

## Contrato consumido

| Rota | O que é usado |
|---|---|
| `GET /boardMovements/{id}` | `board.number`/`board.name`, `pax`, `subtotal`, `tip_pct`, `tip_amount`, `total_due`, `total_paid`, `is_board_paid`, `opened_at`, `first_order_at`, `bill_requested_at`, `paid_at`, `freed_at` |
| `GET /boardMovements/{id}/products` | `{ products: [...], total, discount }`. Por item: `name`, `quantity`, `price`/`final_price`, `round`, `person`, `category_kind`, `observations`, `order_public_id`, `option_selections`, `removed_ingredients` |
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

- **RN-01 — A conta é do servidor; a tela não faz aritmética de dinheiro além do que o contrato não dá.** `subtotal`, `tip_amount`, `total_due`, `total_paid` e `is_board_paid` vêm prontos de `GET /boardMovements/{id}`. O único valor derivado é o desconto, que **não** vem nessa rota — ele só aparece em `GET /boardMovements/{id}/products`, e qualquer aritmética com ele precisa de guarda para ausente.
- **RN-02 — `board_totals_changed` não significa "o total mudou".** Ele é emitido **só** na criação e na exclusão de `OrderProduct` (único chamador: `OrderProductBoardObserver`). Não dispara em pagamento, não dispara quando a gorjeta muda (`PUT /boardMovements/{id}` altera `tip_amount` sem emitir nada) e não dispara em split/join de produto. Tratar esse evento como sinal genérico de "recarregue o total" é o que deixa a conta desatualizada em silêncio — o caminho confiável é invalidar a leitura da movimentação a cada evento da mesa.
- **RN-03 — Um `off` por `on`, com o mesmo nome de evento.** Listener duplicado aqui custa dispatch e render duplicados; os reducers atuais são idempotentes por acaso, e o código novo não pode contar com isso.
- **RN-04 — Sala de socket é por conexão de servidor.** Ao reconectar, a instância do socket é a mesma (efeitos com `[socket]` nas dependências **não** re-executam), mas o servidor perdeu a sala. Sem reemitir `subscribe_channel` no `connect`, qualquer deploy do socket deixa a conta congelada até o reload. E o `off('connect', handler)` tem de ser com a referência — um `off('connect')` cego derruba o listener interno do store.
- **RN-05 — Não há replay no socket.** Quem conecta depois do evento não o recebe. A tela nasce do REST e usa o socket só para os deltas; depois de qualquer reconexão, reler o REST.
- **RN-06 — A conta é compartilhada e concorrente.** O garçom lança item no PDV enquanto o cliente olha a tela, e outra pessoa da mesa pode estar pagando no celular dela. A tela nunca presume que o que ela tem é a verdade mais recente: toda ação que dependa de valor (pagar, pedir a conta) revalida antes de agir.
- **RN-07 — `person` pode ser nulo e pode ser mais de um.** Item lançado pelo garçom no PDV não tem pessoa; item dividido entre duas pessoas aparece com as duas no design ("Marina · Rafael"). A tela não pode assumir uma pessoa por item nem esconder o item sem pessoa.
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
| 2 | Onde fica a ação de pagar no tablet paisagem | Na coluna da direita, abaixo do resumo, como no design — e não numa barra inferior, que em paisagem fica longe das mãos |
| 3 | Intervalo mínimo entre chamadas de garçom | 2 minutos, com o botão mostrando o estado de chamada feita nesse intervalo. Valor a confirmar com o salão |
| 4 | "Pedir a conta" é botão próprio ou consequência de "Pagar conta" | Botão próprio, no bloco de ações: o cliente que vai pagar em dinheiro na maquininha do garçom precisa pedir a conta **sem** passar pelo pagamento no app |
| 5 | Detalhe do item lançado | Manter a tela de detalhe atual só se a execução mostrar que a composição não cabe na linha; o design não a prevê |
