# Plan — Pagamento da conta da mesa pelo app

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24)
**Branch de trabalho:** uma por task (`task/<issue>-<slug>`), cortadas de `feat/indoor-v2` ou da branch da task de que dependem
**Emendado em:** 2026-11-23 — materialização das tasks (#61 a #66) e as decisões do dev registradas na spec (centavos, socket da #66 revisada, RN-08, cancelamento e motivo da recusa na api).
**Alinhado à #23 e à #2 (2026-11-23):** a rota é `/board/payment`, a `BOARD_PAYMENT_ROUTE` da #59; a 01 passa a depender também da 07 da #23 (#59) e a 06 da 08 (#60); a chave de `payment-options` entra no grupo `movement` da lista única da #58; a coluna do tablet deitado segue o contrato do lugar `payment` da #60; e o aparelho sem credencial de sessão de mesa (feature #2) espera o pagamento sem socket.

## Abordagem técnica

> **Fonte do design.** Token vem de `design-system/tokens.json` e do tema em `src/theme/`; layout, copy e estado vêm do protótipo citado em "Referência de design" na spec (o export do canvas usado na materialização: `Pagamento-EmPe-Valor`, `Pagamento-EmPe-Pix`, `Pagamento-EmPe-Confirmado`, `Conta-Celular-Pagar`, `Conta-Celular-Pix`, `Conta-Tablet-Pix`, `Main` e os dois `Conta-*-Paga`). Carregar a skill `modelo-de-design` antes de implementar tela.

A frente tem três partes bem separadas: **quanto pagar** (regra de valor, sem rede), **como pagar** (canais e coletores, que é onde o `delivery-client` ajuda) e **a espera** (tempo real, que é onde o indoor já tem músculo).

**A unidade.** Tudo o que esta frente lê de dinheiro é da 1609 e é **inteiro em centavos**: `payment-options`, o objeto da cobrança e o `board.charge_updated` (RN-11, decisão do dev de 2026-11-23). A conta da mesa continua em real, e **as telas de pagamento não leem dinheiro da conta**: o que falta pagar, o total e o já pago saem de `payment-options`. Da movimentação o pagamento lê só o que não é dinheiro (`board.number`, `is_open`). A única conversão do app é o valor digitado em "outro valor", que vira centavos num módulo só (task 02). A formatação é o `formatCents` de `src/helpers/money.ts` ([#40](../21-indoor-menu-v2/tasks/40-catalog-v2-services-types.md)).

**Quanto pagar.** Módulo puro: entra `{ amount_due, amount_paid, pax }` e a escolha do cliente, sai `{ amount, split_mode }` ou o erro. Três opções do design — tudo que falta, divisão igualitária e valor livre — com as regras de faixa da RF-04. É a parte que precisa estar certa: é dinheiro, e o `tsc` não protege.

**Como pagar.** A lista de formas é projeção de `channels`/`unavailable_channels`, no mesmo formato que o `capabilities` do `GET /payment-config` já usa (`PaymentCapabilitiesPresenter`: `channel`, `provider`, `environment`, `homologated`, `public_key`, `google_pay`). O app conhece quatro canais, os do design: `pix`, `card`, `wallet_googlepay` e `wallet_nupay`. Do `delivery-client` (`feat/app-v2@ceed49a9`) vêm a lista e o grupo de rádio (`CheckoutOptionCard`, `CheckoutRadioGroup`, `checkout-radio.ts`), a copy de canal indisponível (`payment-offer-copy.ts`), as peças do Pix (`src/components/checkout/pix/`) e o coletor de cartão (`collectors/`, com Mercado Pago). O que cai na tradução: cartão salvo, CVV de cartão salvo, troco, carteira do cliente e tudo que depende de login (RN-05, RN-10). Google Pay e NuPay **não têm código** lá, só desenho (tasks 362 e 363 de lá).

**A espera.** A cobrança tem uma máquina só, que o Pix cria e o cartão e as carteiras reaproveitam (task 03):

- **Criação idempotente:** a `Idempotency-Key` nasce por tentativa (valor, modo e canal), e o retry de rede da mesma tentativa a reusa (RN-07).
- **A tentativa no aparelho:** um provider na raiz guarda a cobrança em curso em memória; o `charge_id`, o `cancel_token` e o canal vão também para `sessionStorage`, por movimentação, e saem quando a cobrança termina ou é cancelada. Nada vai para `localStorage`, e nada de pessoa, de cartão ou do código Pix vai para storage nenhum (RN-05).
- **Sair da espera:** só o `board.charge_updated` com o próprio `charge_id`, ou o `GET` dessa cobrança (RN-08 corrigida). O `board_payment_added` só invalida a conta, e isso já é da [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58) (linha 06 do plan da #23).
- **Rede de segurança:** sem replay (RN-09), o `GET` roda quando chega o `pending` de uma cobrança ainda sem código, no `connect` do socket, ao voltar o foco e quando a contagem chega a zero.
- **Os outros aparelhos:** um `board.charge_updated` de outra cobrança invalida `payment-options`, e o aviso de pagamento em andamento sai do `amount_pending` (RN-03).

**Os três formatos.** A diferença não é `max-width`: são três lugares para o mesmo fluxo (RF-10a).

| Formato | Escolha de valor e forma | Pix gerado, cartão, carteira e confirmação |
|---|---|---|
| Celular (fora do shell de tablet) | página `/board/payment`, sem a navegação inferior | a mesma página, no passo seguinte |
| Tablet em pé (shell de tablet, < 1024) | `Sheet` ancorado embaixo, sobre a conta | tela cheia, num painel próprio da mesa sobre o `Modal` |
| Tablet deitado (≥ 1024) | inline na coluna da direita da conta, no lugar `payment` da [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60), sem botão "Pagar conta" | `Overlay` centrado de 540, sobre a conta |

**O lugar do tablet deitado tem contrato, e o dono é a #60** (decisão 4 de lá): a coluna ocupa o `payment` do `BoardBillAside`, traz a própria frase offline, não desenha "conta paga" (com `is_board_paid` a coluna é o encerramento da #60) e não oferece "Ver a conta da mesa", porque já está nela.

Onde o artboard diverge do primitivo, vale o primitivo, como na #38 e na #43: o `Sheet` para em 480 (o artboard em pé tem 820), e o painel do Pix deitado tem 540 numa coluna (o artboard tem 720 em duas). A tela cheia do tablet em pé é exigência da RF-10a, e é componente da mesa sobre o `Modal`, no molde do `PersonNamePanel` da [#47](../22-indoor-cart-order-v2/tasks/47-ordering-person-identity.md).

**Erro.** A falha de tokenização do cartão tem copy própria (o `card-failure.ts` do `delivery-client` é o mapa, e ele é de tokenização). A recusa da cobrança tem o `refusal_reason`, num conjunto fechado de sete códigos, que a 03 traduz. A expiração do Pix oferece gerar outro. A falha de rede na criação não deixa cobrança órfã, porque a chave é por tentativa. As recusas da criação e do cancelamento por status são da 06.

## Decisões arquiteturais

- **A regra de valor é módulo puro, fora do componente.** É dinheiro, é a parte que o `tsc` não protege, e é o que um teste de função cobre bem.
- **O pagamento só fala centavos.** O dinheiro sai de `payment-options` e da cobrança, e a conta em real nunca entra numa conta de pagamento. Resposta de `payment-options` com valor que não é inteiro é erro de contrato, e não valor a converter: é o sinal de uma api ainda no formato antigo, e adivinhar a unidade erra por 100×.
- **A tela não declara "pago".** Só o `status: paid` da própria cobrança, pelo evento com o `charge_id` dela ou pelo `GET`, muda a tela. É a RN-08, e é a regra que evita o pior erro possível aqui: dizer ao cliente que ele pagou quando o provedor recusou, ou quando quem pagou foi outra pessoa no caixa.
- **Invalidar a conta, não aplicar delta.** Mesma decisão da frente [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23), pelo mesmo motivo: fonte única do saldo. A chave de `payment-options` entra no grupo `movement` da lista única de chaves da [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58) (`BOARD_BILL_QUERY_KEYS`), que o handler de lá invalida a cada evento que mexe em dinheiro, e a 03 relê a conta pela mesma lista. O socket é o da #58, pelo `useBoardSocket()` e pelo contrato de consumidor da decisão 6 de lá: a inscrição é de lá e vale em toda rota.
- **A tentativa vive acima das rotas.** Os providers do pagamento ficam em `src/App.tsx`, com o da pessoa da #47. Navegar para o cardápio e voltar não perde a cobrança, e girar o tablet troca o lugar do fluxo sem trocar o estado.
- **`sessionStorage`, não `localStorage`.** O `cancel_token` é a prova de quem criou a cobrança (RN-15 da 1609). Ele vive o que a cobrança vive e o que a aba vive, e é o mesmo critério do `?session` na [#36](../20-indoor-v2-foundation/tasks/36-board-session-provider.md). A #1762 da api escreve `localStorage` ao descrever o app; o lugar é decisão daqui.
- **No tablet, o nome de quem paga é pedido a cada pagamento.** O nome salvo da #47 é de quem pediu por último naquele aparelho, e usá-lo poria o pagamento no nome de outra pessoa. No celular, o nome é o da sacola, como a RN-10 pede.
- **Pix e cartão primeiro, carteiras depois.** Ordem de task, não de escopo: Pix cobre a maioria dos casos no Brasil e é o único que funciona sem coletor de provedor.
- **Nada de pagamento é persistido no tablet.** Decisão de privacidade do aparelho compartilhado (RN-05): nem token, nem bandeira, nem últimos dígitos, nem CPF do titular, nem nome do pagador além da tentativa em curso.
- **Implementar contra o contrato, sem esperar a api.** O contrato das rotas de cobrança está escrito na spec e é idêntico ao da spec irmã. Divergência medida entre os dois lados é bloqueio legítimo; ausência de implementação do outro lado não é.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Tela de pagamento e opções da loja: canais, indisponíveis e loja sem canal | [#61](https://github.com/sgrande-delivery/delivery-indoor/issues/61) | [61-board-payment-options-screen.md](./tasks/61-board-payment-options-screen.md) | #23 (01, 06, 07 e 08), #21 (01) | pendente |
| 02 | Quanto pagar: tudo, divisão igualitária e outro valor, com as validações | [#62](https://github.com/sgrande-delivery/delivery-indoor/issues/62) | [62-board-payment-amount-choice.md](./tasks/62-board-payment-amount-choice.md) | 01 | pendente |
| 03 | Pix: cobrança, copia e cola no celular, QR no tablet, espera, troca de forma e confirmação | [#63](https://github.com/sgrande-delivery/delivery-indoor/issues/63) | [63-board-pix-charge-wait.md](./tasks/63-board-pix-charge-wait.md) | 01, 02, #22 (02), #23 (07) | pendente |
| 04 | Cartão de crédito com coletor tokenizado e copy de recusa | [#64](https://github.com/sgrande-delivery/delivery-indoor/issues/64) | [64-board-card-charge-collector.md](./tasks/64-board-card-charge-collector.md) | 03 | pendente |
| 05 | Carteiras (Google Pay e NuPay), com o caminho por QR no tablet | [#65](https://github.com/sgrande-delivery/delivery-indoor/issues/65) | [65-board-wallet-charges.md](./tasks/65-board-wallet-charges.md) | 03, 04 | pendente; **o Google Pay no tablet está parado por divergência** (decisão pendente 8 da spec) |
| 06 | Conclusão: cobrança pendente retomada, conta paga e erros da cobrança | [#66](https://github.com/sgrande-delivery/delivery-indoor/issues/66) | [66-board-charge-resume-errors.md](./tasks/66-board-charge-resume-errors.md) | 03, #23 (05 e 08) | pendente |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

Nesta feature todas as tasks são deste repo, então o arquivo leva o número da issue (`61-…` a `66-…`), e a coluna `#` guarda a ordem do plan. É a regra da #20, e não a da feature 1, que numera por ordem por ser cross-repo.

As tasks da #23 citadas acima, pela linha do plan de lá: 01 é a [#53](https://github.com/sgrande-delivery/delivery-indoor/issues/53) (leituras e a moldura de `/board`), 05 é a [#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57) (pagamentos lançados e conta paga), 06 é a [#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58) (tempo real do `/board`), 07 é a [#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59) (ações, inclusive "Pagar conta") e 08 é a [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60) (os dois formatos de tablet). A #21 (01) é a [#40](https://github.com/sgrande-delivery/delivery-indoor/issues/40) (`formatCents`), e a #22 (02) é a [#47](https://github.com/sgrande-delivery/delivery-indoor/issues/47) (nome de quem pede).

**O que mudou na quebra, na materialização de 2026-11-23:**

- **A 01 passou a ser a tela, não só a leitura.** Ela cria a rota, os três lugares do formulário e a lista de formas. Sem uma tela, a leitura dos canais só se validaria em sandbox.
- **A 02 passou a depender da 01** (antes, as duas corriam em paralelo). A escolha de valor entra no formulário que a 01 cria; correr em paralelo seria duas tasks no mesmo arquivo de composição.
- **A aprovação em tempo real e a confirmação foram para a 03.** O plan as punha na 06, mas o Pix sem a saída da espera não fecha o caminho que a ordem de execução pede da 03 ("se for preciso escolher uma só"). A 06 ficou com o que atravessa a vida da página (retomada depois do reload), com a passagem para a conta paga e com as recusas por status.
- **A recusa da cobrança (`refusal_reason`) é da 03, e a da tokenização é da 04.** O "copy de recusa" do plan apontava para o `card-failure.ts` do `delivery-client`, que é falha de tokenização, e não recusa de cobrança (medido pela #1763 da api). O estado `refused` nasce na máquina da 03 e vale para toda forma de pagamento.

## Ordem de execução

1. **`01`** primeiro, com a 01, a 06, a 07 e a 08 da #23 na base (a moldura de `/board`, o socket, a rota e as ações de garçom e de conta, e a coluna do tablet deitado; a 08 já traz a 07) e a #40 da #21 (`formatCents`).
2. **`02`** depois da 01.
3. **`03`** depois das duas, da #47 (nome de quem pede) e da #59 (chamar garçom, na confirmação): é o caminho completo de ponta a ponta e o que valida o contrato da cobrança. O gerador da `Idempotency-Key` é o da #46, extraído para `src/helpers/` (03, decisão 2).
4. **`04`** e **`06`** em paralelo depois da 03 (a 06 com a 05 e a 08 da #23 na base, para a conta paga nos dois lugares): uma é coletor e formulário, a outra é retomada e recusas. Os arquivos que as duas tocam na 03 são diferentes (o registro do passo de cartão, de um lado; o boot da tentativa e o mapa de erros, do outro).
5. **`05`** por último, depois da 04, porque o Google Pay cobra como cartão.

Se for preciso escolher uma só: a **`03`**. Pix é o caminho que fecha a feature sem depender de coletor de provedor.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | `GET /payment-options` em centavos ([#1635](https://github.com/sgrande-delivery/delivery-api/issues/1635)), criação e leitura da cobrança ([#1636](https://github.com/sgrande-delivery/delivery-api/issues/1636)), liquidação ([#1637](https://github.com/sgrande-delivery/delivery-api/issues/1637)), cartão e carteiras ([#1638](https://github.com/sgrande-delivery/delivery-api/issues/1638)), `amount_pending` real ([#1640](https://github.com/sgrande-delivery/delivery-api/issues/1640)), recusas nomeadas ([#1641](https://github.com/sgrande-delivery/delivery-api/issues/1641)), cancelamento ([#1762](https://github.com/sgrande-delivery/delivery-api/issues/1762)) e motivo da recusa ([#1763](https://github.com/sgrande-delivery/delivery-api/issues/1763)). Spec irmã: [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), `.claude/sdd/1609-client-board-payment-online/` | **Não existe.** Emendada em 2026-11-23, ainda não commitada lá (worktree `docs-1609-board-payment-amendments`). As tasks estão `pendente` |
| `delivery-api` | O emissor do `board.charge_updated` ([#1639](https://github.com/sgrande-delivery/delivery-api/issues/1639)), depois do commit de cada transição | **Não existe** |
| `delivery-api` | O payload restrito de `GET /boardMovements/{id}` ([#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753), task #1757) | Spec escrita; esta frente não lê nenhum campo que sai |
| `delivery-socket-api` | `board.charge_updated` na sala da movimentação, com `{ charge_id, status, amount, expires_at }`. Spec irmã: [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66), na versão revisada em 2026-11-23 que o dev escolheu (o rascunho do PR socket#67 não vale) | **Não existe.** Hoje só há `board_payment_added`, que é posterior à aprovação |
| `delivery-api` | Conta de provedor ativa e canal homologado na loja de teste (`uses_payment_connectors`) | Configuração por restaurante |
| Conectores (`sg-mercadopago-connector`, `sg-nupay-connector`, …) | Nada a entregar aqui: a `delivery-api` fala com eles. Importa para o app o `public_key` que vem no canal, e dois fatos medidos pela 1609: só o Mercado Pago cancela hoje (com os outros, a cobrança pedida para cancelar vence sozinha) e nenhum conector manda o motivo da recusa (toda recusa sai `unknown`) | — |

**Ordem de deploy, para o relatório de cada task:** nenhuma ordem derruba a tela. Sem o socket, a espera cai nas leituras de estado (foco, `connect`, contagem a zero) e na leitura com teto enquanto falta o código do Pix. O mesmo vale, para sempre, para o aparelho que entrou sem credencial de sessão de mesa depois que o socket a exigir (socket-api#78, RN-10 da feature [#2](https://github.com/sgrande-delivery/delivery-indoor/issues/2)): ele é derrubado com `io server disconnect` e não reconecta, então não há `connect` nem `board.charge_updated`, e a espera sai pelo foco e pela contagem. Se esse aparelho for o tablet da mesa, que não perde o foco enquanto o Pix é pago em outro celular, ele só sai na contagem; é o caso a levar ao portão da #78 (decisão pendente 7 da #2). Sem a #1640, o `amount_pending` sai `0`, e o aviso de pagamento em andamento não aparece. Sem a #1763, toda recusa mostra a frase de `unknown`.

## Aprendizados que valem para as próximas tasks
