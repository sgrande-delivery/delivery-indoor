# Spec — Pagamento da conta da mesa pelo app

**Status:** rascunho
**Criada em:** 2026-11-16
**Escopo:** cross-repo
**Issue:** [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24)
**Emendada em:** 2026-11-23 — o dinheiro do pagamento passa a ser inteiro em centavos (RN-11), o contrato de socket passa a ser o da delivery-socket-api#66 revisada, a saída da espera deixa de aceitar `board_payment_added` (RN-08), e o cancelamento (RF-13) e o motivo da recusa (RF-15) passam a ter rota e campo na api. São decisões do dev; ver "Decisões tomadas".

## Contexto

Hoje o cliente sentado à mesa acompanha a conta pelo app e **paga fora dele**: chama o garçom, espera a maquininha, paga. A feature nova é fechar essa volta — o cliente paga pelo próprio celular, ou pelo tablet da mesa, e a conta se atualiza na hora.

O design (`Brasa Punch Indoor - Conta da Mesa`, blocos "pagar pelo app" e "Pix gerado") resolve o fluxo em duas perguntas:

1. **Quanto você vai pagar?** — tudo que falta (fecha a conta), dividir igualmente entre as pessoas da mesa, ou outro valor ("ex.: só o que você consumiu").
2. **Forma de pagamento** — entre as opções online **que a loja habilitou**: Pix, cartão de crédito, Google Pay, NuPay.

E trata os dois aparelhos de formas diferentes, porque são situações diferentes: no celular, que é da pessoa, o Pix prioriza o **copia e cola**; no tablet, que é da mesa e é compartilhado, prioriza o **QR code**, lido pelo celular de quem paga — e as carteiras digitais, que vivem no telefone de alguém, também abrem por QR. Enquanto a cobrança está aberta, a tela mostra valor, expiração e "aguardando pagamento", com a promessa escrita de que **a conta atualiza sozinha** quando o pagamento cair.

**Nada disso tem caminho de cliente na plataforma hoje.** Medido em 2026-11-16 na `origin/master` da `delivery-api`:

- `POST /boardMovements/{id}/payments` existe **só no admin**, atrás de `plan.resource:board` e `role:board-order`. No cliente há apenas o `GET`.
- `GET /payment-config`, que devolve o bloco `capabilities` com os canais habilitados, o provedor, o `public_key` e a configuração do Google Pay, exige `jwt.auth` + `client.session` — e este app não tem login.
- O conector já sabe cobrar: `ChargeInstrumentKindEnum` tem `card`, `pix`, `wallet` e `stored_card`, e `PaymentChannelEnum` tem `wallet_googlepay` e `wallet_nupay`. O que ele não sabe cobrar é **uma conta de mesa**, que não é um pedido: é um saldo, pago possivelmente em partes e por mais de uma pessoa.

As frentes irmãs abrem o caminho: [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), emendada em 2026-11-23 com o cancelamento ([#1762](https://github.com/sgrande-delivery/delivery-api/issues/1762)) e o motivo da recusa ([#1763](https://github.com/sgrande-delivery/delivery-api/issues/1763)), e [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66), na versão revisada em 2026-11-23. Esta spec carrega o contrato que ela assume, inline, e **não espera** a api subir.

## Objetivo

O cliente escolhe quanto pagar e como pagar, conclui o pagamento pelo app em celular ou tablet, e vê a conta da mesa refletir o pagamento sem recarregar — até o estado de conta paga.

## Contrato assumido

Rotas novas em `api/client`, com `x-restaurant-id` (UUID), **sem login**, escopadas pela movimentação **e** pela loja do header. O contrato é o da spec irmã [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), emendada em 2026-11-23 (tasks [#1635](https://github.com/sgrande-delivery/delivery-api/issues/1635), [#1636](https://github.com/sgrande-delivery/delivery-api/issues/1636), [#1762](https://github.com/sgrande-delivery/delivery-api/issues/1762) e [#1763](https://github.com/sgrande-delivery/delivery-api/issues/1763)); divergência entre os dois lados é motivo de parar e reportar.

**Unidade:** tudo o que sai destas rotas e do evento de socket é **inteiro em centavos** (RN-11). A conta da mesa (`GET /boardMovements/{id}`, `/products`, `/payments`) continua em real.

| Rota | Resposta |
|---|---|
| `GET /boardMovements/{id}/payment-options` | `{ amount_due, amount_paid, amount_pending, pax, channels: [{ channel, provider, environment, homologated, public_key, google_pay? }], unavailable_channels: [{ channel, provider, reason }] }`. `amount_due` e `amount_paid` são `round(× 100)` do `total_due` e do `total_paid` da conta; `amount_pending` é a soma das cobranças pendentes da mesa, e sai `0` até a [#1640](https://github.com/sgrande-delivery/delivery-api/issues/1640) |
| `POST /boardMovements/{id}/charges` | corpo `{ amount, split_mode: 'full'\|'equal'\|'custom', person, instrument: { kind: 'pix'\|'card'\|'wallet', channel, token?, brand? } }`, com `Idempotency-Key`. 201: `{ id, status, amount, expires_at, refusal_reason, amount_pending, pix?: { copy_paste, qr_code_base64 }, redirect_url?, cancel_token }`. O `cancel_token` (64 hex) sai **só** nesta resposta. O `pix` e o `redirect_url` podem ainda não ter vindo: chegam com o `payment.charge_created`, e o app os lê no `GET` |
| `GET /boardMovements/{id}/charges/{chargeId}` | o objeto da criação, sem `amount_pending` e sem `cancel_token`: `{ id, status, amount, expires_at, refusal_reason, pix?, redirect_url? }` |
| `POST /boardMovements/{id}/charges/{chargeId}/cancel` | corpo `{ cancel_token }`. 202 com o objeto ainda `pending`: o pedido foi aceito, e o estado final vem do conector. 200 com o objeto já encerrado sem pagamento (`refused`, `expired` ou `canceled`). 409 `board_charge_already_paid`, 403 `board_charge_cancel_forbidden`, 404 `board_charge_not_found`, 422 de validação, 429 |

Recusas da criação: 422 para valor ≤ 0, para valor acima do saldo e para loja sem canal online (os dois últimos com `internal_code` próprio, que a [#1641](https://github.com/sgrande-delivery/delivery-api/issues/1641) nomeia); 404 para movimentação inexistente ou de outra loja; 409 para movimentação liberada ou já paga; 429 acima do `throttle`.

Estados da cobrança: `pending`, `paid`, `refused`, `expired`, `canceled` — projeção do vocabulário do conector. `refusal_reason` é `null` fora de `refused`; em `refused`, é um de `declined`, `invalid_card_data`, `card_not_accepted`, `not_authorized`, `unavailable`, `temporarily_unavailable` ou `unknown`, num conjunto fechado (hoje nenhum conector manda o motivo, e toda recusa sai `unknown`). `expires_at` é ISO 8601 com fuso, ou `null`.

Socket, namespace `/board`, sala da movimentação, pelo contrato da [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66) revisada: `board.charge_updated` com exatamente `{ charge_id, status, amount, expires_at }`, `amount` em centavos, **sem** saldo da conta e **sem** nome de quem paga. O primeiro evento de uma cobrança é o `pending` que segue o `payment.charge_created`; o mesmo estado pode chegar mais de uma vez e fora de ordem; não há replay. O `board_payment_added`, que já existe, continua sendo emitido quando a cobrança aprovada vira pagamento da conta, e **não** diz qual cobrança foi paga.

A conta que esta frente lê é o `GET /boardMovements/{id}` com o payload restrito da [delivery-api#1753](https://github.com/sgrande-delivery/delivery-api/issues/1753) (task #1757): `is_open`, `is_board_paid`, `pax`, `paid_at`, `freed_at` e `board.number` continuam; `customer` passa a `{ id, name }`; `board.id`, `admin_user` e os ids internos saem. Esta frente não lê nenhum dos campos que saem, nem dinheiro da conta.

## Requisitos funcionais

- **RF-01** — A tela de pagamento abre a partir da conta, com o valor que falta pagar no cabeçalho.
- **RF-02** — "Quanto você vai pagar?" oferece três opções, cada uma com o valor que será cobrado: tudo que falta, dividir igualmente, e outro valor.
- **RF-03** — "Dividir igualmente" usa o número de pessoas da mesa e mostra a divisão em texto ("R$ 95,43 ÷ 2 pessoas"); sem esse número no servidor, o app pergunta quantas pessoas.
- **RF-04** — "Outro valor" aceita valor digitado, maior que zero e no máximo o que falta pagar, com o erro escrito quando sai da faixa.
- **RF-05** — A lista de formas de pagamento mostra **só** os canais que a loja habilitou, com a nota do design de que são as opções habilitadas pela loja.
- **RF-06** — Canal habilitado mas ainda não homologado não é oferecido como pagável; a tela diz que está indisponível em vez de falhar no provedor.
- **RF-07** — Sem nenhum canal online habilitado, a tela não oferece pagamento: explica que a loja não aceita pagamento pelo app e oferece chamar o garçom ou pedir a conta.
- **RF-08** — Pix: a cobrança é criada, a tela mostra o valor, a expiração em contagem e "aguardando pagamento", com a promessa de que a conta atualiza sozinha.
- **RF-09** — No celular, o Pix prioriza o copia e cola: botão de copiar o código e as três instruções do design; o QR aparece abaixo, para pagar de outro aparelho.
- **RF-10** — No tablet, o Pix prioriza o QR em destaque, com a instrução de apontar a câmera, e o copia e cola como ação secundária.
- **RF-10a** — O formato do tablet muda **onde** o fluxo mora, não o fluxo: em paisagem ele é a coluna da direita da conta (RF-17 da [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23)); em retrato, por estar abaixo do `overlayBreakpoint` de 1024, é **`Sheet` ancorado embaixo** com valor e forma na mesma folha, e o Pix gerado e a confirmação em tela cheia. As três telas de retrato estão no canvas.
- **RF-11** — Cartão de crédito: os dados do cartão são coletados pelo componente do provedor e **só o token** sai do aparelho.
- **RF-12** — Carteiras (Google Pay, NuPay): no celular abrem o fluxo da carteira; no tablet compartilhado, abrem por QR no celular de quem paga. O Google Pay no tablet não tem caminho no contrato (decisão pendente 8).
- **RF-13** — "Trocar forma de pagamento" volta à escolha sem perder o valor escolhido e pede o cancelamento da cobrança pendente, pela rota de cancelamento e com o `cancel_token` que só o aparelho que a criou tem. Cancelar é pedido, não decisão: o aparelho para de esperar aquela cobrança, e um `paid` que chegue depois para ela é pagamento de verdade, que a conta mostra.
- **RF-14** — Quando a cobrança é aprovada, a tela mostra a confirmação e a conta da mesa já reflete o pagamento, sem recarregar.
- **RF-15** — Cobrança recusada mostra o motivo em linguagem de cliente, a partir do `refusal_reason` (conjunto fechado; `unknown` quando o conector não diz), e oferece tentar outra forma; cobrança expirada oferece gerar outra.
- **RF-16** — Enquanto a cobrança está pendente, a tela acompanha o estado por tempo real, com leitura de estado como rede de segurança.
- **RF-17** — Se o pagamento fecha a conta, a conta da mesa passa ao estado de conta paga.
- **RF-18** — Sair da tela com cobrança pendente não a perde: ao voltar, o app mostra a cobrança em andamento.
- **RF-19** — A tela não pode ser usada quando a conta já está paga ou a movimentação foi liberada: mostra o estado em vez do formulário.

## Regras de negócio

- **RN-01 — O valor é o que falta pagar, lido no momento da cobrança.** A conta é concorrente: o garçom pode lançar item e outra pessoa pode pagar enquanto esta tela está aberta. O valor exibido é revalidado antes de criar a cobrança, e o servidor recusa cobrança acima do saldo.
- **RN-02 — Pagamento parcial é normal, não exceção.** Pagar parte da conta não a fecha, e a tela precisa dizer isso: depois de aprovar R$ 47,72 de R$ 95,43, a conta continua aberta com R$ 47,71. Nenhum texto pode prometer "conta fechada" antes de o saldo zerar.
- **RN-03 — Duas pessoas podem pagar ao mesmo tempo.** Isso é desenho, não erro: duas cobranças pendentes podem existir ao mesmo tempo. Quem decide o limite é o servidor — mas a tela não pode mostrar como "disponível para pagar" um valor que outra cobrança pendente já reservou sem dizer que há pagamento em andamento. Quem diz isso é o `amount_pending` de `payment-options`. Não há rota que liste as cobranças pendentes: o aparelho que não criou uma cobrança conhece só o agregado e os `board.charge_updated` que receber.
- **RN-04 — Dado de cartão não passa pela nossa API.** O número do cartão é coletado pelo componente do provedor, e o que sai do aparelho é token. A `delivery-api` **recusa** campo de cartão cru no payload (`RejectsRawCardFieldsTrait`), e isso é proteção, não obstáculo a contornar.
- **RN-05 — O tablet é compartilhado, e isso muda o que pode aparecer nele.** Carteira digital e cartão salvo são de uma pessoa; num aparelho da mesa, oferecer "Mastercard •••• 4821" seria oferecer o cartão de quem pagou antes. No tablet: Pix por QR, cartão digitado na hora, carteira por QR no celular de quem paga. **Nenhum dado de pagamento de cliente é persistido no tablet.**
- **RN-06 — Expiração é do servidor.** A contagem na tela é cosmética: quem decide que o Pix expirou é a cobrança. Chegando a zero, a tela lê o estado em vez de declarar expirado por conta própria.
- **RN-07 — Idempotência por cobrança.** Toque duplo, retry de rede ou volta pelo histórico não podem gerar duas cobranças. A chave é gerada por tentativa de pagamento, não por request.
- **RN-08 — O app não é a fonte da verdade do pagamento, e só a própria cobrança tira o aparelho da espera.** O que vira pagamento da conta é a conciliação no servidor. A tela nunca escreve "pago" por iniciativa própria: o aparelho sai da espera **só** pelo `board.charge_updated` com o `charge_id` que ele criou, ou pelo `GET` dessa cobrança. O `board_payment_added` não serve para isso — não diz qual cobrança foi paga, chega igual quando o garçom lança dinheiro no PDV, e não vem quando a confirmação estoura o saldo ([#1640](https://github.com/sgrande-delivery/delivery-api/issues/1640)) —, e só invalida a conta.
- **RN-09 — Não há replay no socket.** Se a aprovação acontece com o app fechado ou desconectado, nenhum evento chega depois. Por isso a leitura de estado ao voltar para a tela, e a releitura da conta no `connect`, não são redundância.
- **RN-10 — Sem login, o pagador é um nome, não uma conta.** O nome usado é o mesmo da sacola (frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22)), e é ele que aparece em "Pix · Rafael" na lista de pagamentos. Não há histórico de pagamento por pessoa, não há cartão salvo e não há recibo por e-mail.
- **RN-11 — Dinheiro do pagamento é inteiro em centavos; o da conta, float em real.** Tudo o que vem da 1609 — `payment-options`, o objeto da cobrança e o `board.charge_updated` — é centavos. A conta da mesa (`/boardMovements`, v1) continua em real. As telas desta frente leem dinheiro só do que é do pagamento, e a fronteira de conversão é uma só no app: o valor digitado em "outro valor" vira centavos num ponto, e a comparação com o saldo é em centavos dos dois lados.
- **RN-12 — A taxa de serviço faz parte do que falta pagar.** `total_due = subtotal + tip_amount`; o cliente que paga "tudo que falta" paga a taxa. Nenhuma tela desta frente oferece remover a taxa — isso é decisão de salão, feita no PDV.

## Referência de design

Canvas [Brasa Punch Indoor](https://claude.ai/artifact/E8mKAq2MKaCRXcRVLeDh1u): no celular, `Conta · celular · pagar pelo app` (interativo) e `Conta · celular · Pix gerado` (copia e cola primeiro); no tablet deitado, a coluna de pagamento de `Conta · tablet deitado` e `Conta · tablet deitado · Pix gerado` (QR em destaque); no tablet em pé, `Pagamento · tablet em pé · valor e forma`, `Pagamento · tablet em pé · Pix gerado` e `Pagamento · tablet em pé · confirmado`; o terminal em `Conta · tablet deitado · conta paga`.

O protótipo é fonte de **layout, hierarquia, copy e estados**. **Token — cor, fonte, raio, espaçamento e sombra — vem de `design-system/tokens.json`, e os três formatos de layout da tabela "Os três formatos" do `design-system/README.md`**, não do protótipo, e a cor da marca vem de `restaurant.primary_color` em runtime. Antes de implementar, carregar a skill `modelo-de-design`.

## Fora do escopo

- Pagar por item (escolher quais itens o pagamento cobre). O servidor já guarda `coverage` e `split_mode` para o PDV, e o design divide por **valor**.
- Dinheiro, maquininha e qualquer forma presencial: isso continua sendo do PDV.
- Cartão salvo, carteira do app e histórico de pagamento do cliente — dependem de login, que este app não tem.
- Gorjeta escolhida pelo cliente no app (aumentar ou tirar a taxa).
- Recibo impresso ou por e-mail: há frente própria na api ([#1466](https://github.com/sgrande-delivery/delivery-api/issues/1466)) para o comprovante do PDV.
- Nota fiscal.
- A implementação da cobrança na api e do evento no socket — são [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609) e [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66).

## Critérios de aceitação

- [ ] A tela abre da conta com o valor que falta pagar, e as três opções de quanto pagar mostram valores que fecham com o saldo.
- [ ] "Dividir igualmente" com 2 pessoas oferece metade do saldo; sem número de pessoas no servidor, o app pergunta.
- [ ] "Outro valor" recusa zero, negativo e valor acima do saldo, com erro escrito.
- [ ] A lista de formas mostra exatamente os canais habilitados da loja, e nada mais.
- [ ] Loja sem canal online não mostra pagamento, e oferece chamar o garçom.
- [ ] Pix no celular mostra o copia e cola primeiro; no tablet, o QR primeiro.
- [ ] Copiar o código Pix e pagar pelo banco faz a tela sair da espera sozinha, sem recarregar.
- [ ] Um pagamento lançado no PDV (`board_payment_added`) atualiza a conta e **não** tira da espera o aparelho que aguarda um Pix.
- [ ] "Trocar forma de pagamento" pede o cancelamento da cobrança pendente e volta à escolha com o valor mantido.
- [ ] Cobrança recusada mostra a frase do seu `refusal_reason`, e um motivo fora do conjunto cai na de `unknown`.
- [ ] Pagamento parcial aprovado deixa a conta aberta com o saldo correto, e aparece na lista de pagamentos com o nome de quem pagou.
- [ ] Pagamento que zera o saldo leva a conta ao estado de conta paga.
- [ ] Dois toques em "pagar" criam **uma** cobrança.
- [ ] Sair da tela e voltar com cobrança pendente mostra a cobrança em andamento, não um formulário vazio.
- [ ] Cartão: a aba de rede não mostra número de cartão saindo do aparelho para a nossa API.

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Número de pessoas para a divisão | Usar `pax` da movimentação quando existir; nulo, perguntar no app e **não** gravar na movimentação (gravar mudaria o dado que o PDV controla) |
| 2 | Cobrança pendente ao sair da tela | Manter pendente. O aparelho que a criou guarda o `charge_id` e o `cancel_token` em memória e em `sessionStorage`, por movimentação, e apaga os dois quando a cobrança termina ou é cancelada. Nada em `localStorage`: no tablet, a chave some com a aba e com a cobrança (RN-05). Cancelar ao sair faria o cliente perder um Pix já copiado. *Default assumido na materialização das tasks (2026-11-23), a confirmar com o dev; a #1762 da api fala em `localStorage`, e o lugar é decisão do app* |
| 3 | Rede de segurança do estado da cobrança | Leitura de estado ao abrir a tela, ao voltar o foco e no `connect` do socket, mais o evento de socket. Polling contínuo só se a execução mostrar que o evento não chega de forma confiável; a única exceção é a leitura com intervalo crescente e teto enquanto o Pix ainda não trouxe o código, que é espera por dado, não por estado |
| 4 | Coletor de cartão | Reaproveitar o do `delivery-client` (`src/components/checkout/payment/collectors/`), que já tem Mercado Pago e o registro por provedor, sem a parte de cartão salvo. Cartão só aparece quando o canal do provedor suportado estiver habilitado. O Mercado Pago exige nome e CPF do titular, digitados no aparelho e mandados só ao SDK do provedor |
| 5 | Carteiras no primeiro corte | Pix e cartão primeiro, carteiras depois, na ordem das tasks — mas **todas** especificadas aqui, porque o desenho e a lista de canais já as preveem. O `delivery-client` não tem código de Google Pay nem de NuPay, só o desenho (tasks 362 e 363 de lá) |
| 6 | Quem pode pagar quando a conta tem pedido de fechamento | Pagar continua permitido com `bill_requested_at` preenchido: pedir a conta não é travar a conta |
| 7 | Canais de carteira que o design não desenha (`wallet_picpay`, `wallet_mercadopago`) | Não listar: o app não tem fluxo nem copy para eles. Se a loja os habilitar, a lista mostra só os quatro do design |
| 8 | Google Pay no tablet compartilhado | **Sem default: divergência medida.** A RF-12 pede carteira "por QR no celular de quem paga", e a 1609 ([#1638](https://github.com/sgrande-delivery/delivery-api/issues/1638)) só devolve `redirect_url` para a carteira de redirecionamento (NuPay). O Google Pay tokeniza no navegador de quem paga e cobra como `card`: não há URL que o tablet possa mostrar em QR. Decidir entre tirar o Google Pay do tablet (o canvas o desenha) e especificar na api um caminho de passagem para o celular |
| 9 | Nome de quem pagou no tablet compartilhado | **Sem default: divergência entre fontes, registrada em 2026-11-23 e a decidir pelo dev.** O princípio 4 do `design-system/README.md` (e a skill `modelo-de-design`) diz que no tablet não aparece "o nome de quem pagou antes". A RN-10 desta spec põe o nome em "Pix · Rafael" na lista de pagamentos, a RF-07 e a RF-19 da [#23](https://github.com/sgrande-delivery/delivery-indoor/issues/23) e o artboard `Conta · tablet deitado · conta paga` o mostram no tablet, e a confirmação em pé desenha "No nome de". **O comportamento escrito não muda até a decisão:** o nome aparece (decisão 8 da [#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57)), e o que esta frente já protege continua (o nome no tablet é pedido a cada pagamento e não é gravado, 03). A mesma pendência está na spec da #23 (decisão pendente 6) |

## Decisões tomadas

- **2026-11-23 — dinheiro da cobrança em centavos inteiros** (decisão do dev). Tudo o que vem da 1609 — `payment-options`, o objeto da cobrança e o `board.charge_updated` — é inteiro em centavos; a conta da mesa (`/boardMovements`, v1) continua em real, com uma fronteira de conversão só no app. Corrige a RN-11, que dizia "float em real", e o "Contrato assumido". Do lado da api é a RN-13 da 1609 (#1635 emendada).
- **2026-11-23 — o contrato de socket é o da delivery-socket-api#66 revisada**, e não o do PR socket#67 (decisão do dev): `board.charge_updated` com `{ charge_id, status, amount, expires_at }`, **sem** `amount_due_after` e **sem** `person_label`, porque o tablet é compartilhado. Corrige o "Contrato assumido".
- **2026-11-23 — sair da espera por `board_payment_added` é errado** (decisão do dev): ele pode mostrar "pago" quando o garçom lançou dinheiro no PDV, e não diz qual cobrança foi paga. Só o `board.charge_updated` com o próprio `charge_id`, ou o `GET` da cobrança, tira o aparelho da espera. Corrige a RN-08.
- **2026-11-23 — cancelar a cobrança (RF-13) e o motivo da recusa (RF-15) entram na api** (decisão do dev): [delivery-api#1762](https://github.com/sgrande-delivery/delivery-api/issues/1762), `POST …/charges/{chargeId}/cancel` com `cancel_token`, e [#1763](https://github.com/sgrande-delivery/delivery-api/issues/1763), `refusal_reason` num conjunto fechado. Esta frente os consome, pelo "Contrato assumido".
