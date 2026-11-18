# Spec — Pagamento da conta da mesa pelo app

**Status:** rascunho
**Criada em:** 2026-11-16
**Escopo:** cross-repo
**Issue:** [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24)

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

As frentes irmãs abrem o caminho: [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609) e [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66). Esta spec carrega o contrato que ela assume, inline, e **não espera** a api subir.

## Objetivo

O cliente escolhe quanto pagar e como pagar, conclui o pagamento pelo app em celular ou tablet, e vê a conta da mesa refletir o pagamento sem recarregar — até o estado de conta paga.

## Contrato assumido

Rotas novas em `api/client`, com `x-restaurant-id` (UUID), **sem login**, escopadas pela movimentação. O contrato é o mesmo da spec irmã [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609); divergência entre os dois lados é motivo de parar e reportar.

| Rota | Resposta |
|---|---|
| `GET /boardMovements/{id}/payment-options` | `{ amount_due, amount_paid, pax, channels: [{ channel, provider, environment, homologated, public_key, google_pay? }], unavailable_channels: [{ channel, provider, reason }] }` |
| `POST /boardMovements/{id}/charges` | corpo: `{ amount, split_mode: 'full'\|'equal'\|'custom', person, instrument: { kind: 'pix'\|'card'\|'wallet', channel, token?, brand? } }`, com `Idempotency-Key`. Resposta: `{ id, status, amount, expires_at, pix?: { copy_paste, qr_code_base64 }, redirect_url? }` |
| `GET /boardMovements/{id}/charges/{chargeId}` | o mesmo objeto da criação — leitura de estado |

Estados da cobrança: `pending`, `paid`, `refused`, `expired`, `canceled`.

Socket, namespace `/board`, sala da movimentação: `board.charge_updated` com `{ charge_id, status, amount, amount_due_after }`, e o `board_payment_added` que já existe, emitido quando a cobrança aprovada vira pagamento da conta.

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
- **RF-12** — Carteiras (Google Pay, NuPay): no celular abrem o fluxo da carteira; no tablet compartilhado, abrem por QR no celular de quem paga.
- **RF-13** — "Trocar forma de pagamento" volta à escolha sem perder o valor escolhido, e cancela a cobrança pendente quando houver.
- **RF-14** — Quando a cobrança é aprovada, a tela mostra a confirmação e a conta da mesa já reflete o pagamento, sem recarregar.
- **RF-15** — Cobrança recusada mostra o motivo em linguagem de cliente e oferece tentar outra forma; cobrança expirada oferece gerar outra.
- **RF-16** — Enquanto a cobrança está pendente, a tela acompanha o estado por tempo real, com leitura de estado como rede de segurança.
- **RF-17** — Se o pagamento fecha a conta, a conta da mesa passa ao estado de conta paga.
- **RF-18** — Sair da tela com cobrança pendente não a perde: ao voltar, o app mostra a cobrança em andamento.
- **RF-19** — A tela não pode ser usada quando a conta já está paga ou a movimentação foi liberada: mostra o estado em vez do formulário.

## Regras de negócio

- **RN-01 — O valor é o que falta pagar, lido no momento da cobrança.** A conta é concorrente: o garçom pode lançar item e outra pessoa pode pagar enquanto esta tela está aberta. O valor exibido é revalidado antes de criar a cobrança, e o servidor recusa cobrança acima do saldo.
- **RN-02 — Pagamento parcial é normal, não exceção.** Pagar parte da conta não a fecha, e a tela precisa dizer isso: depois de aprovar R$ 47,72 de R$ 95,43, a conta continua aberta com R$ 47,71. Nenhum texto pode prometer "conta fechada" antes de o saldo zerar.
- **RN-03 — Duas pessoas podem pagar ao mesmo tempo.** Isso é desenho, não erro: duas cobranças pendentes podem existir ao mesmo tempo. Quem decide o limite é o servidor — mas a tela não pode mostrar como "disponível para pagar" um valor que outra cobrança pendente já reservou sem dizer que há pagamento em andamento.
- **RN-04 — Dado de cartão não passa pela nossa API.** O número do cartão é coletado pelo componente do provedor, e o que sai do aparelho é token. A `delivery-api` **recusa** campo de cartão cru no payload (`RejectsRawCardFieldsTrait`), e isso é proteção, não obstáculo a contornar.
- **RN-05 — O tablet é compartilhado, e isso muda o que pode aparecer nele.** Carteira digital e cartão salvo são de uma pessoa; num aparelho da mesa, oferecer "Mastercard •••• 4821" seria oferecer o cartão de quem pagou antes. No tablet: Pix por QR, cartão digitado na hora, carteira por QR no celular de quem paga. **Nenhum dado de pagamento de cliente é persistido no tablet.**
- **RN-06 — Expiração é do servidor.** A contagem na tela é cosmética: quem decide que o Pix expirou é a cobrança. Chegando a zero, a tela lê o estado em vez de declarar expirado por conta própria.
- **RN-07 — Idempotência por cobrança.** Toque duplo, retry de rede ou volta pelo histórico não podem gerar duas cobranças. A chave é gerada por tentativa de pagamento, não por request.
- **RN-08 — O app não é a fonte da verdade do pagamento.** O que vira pagamento da conta é a conciliação no servidor. A tela nunca escreve "pago" por iniciativa própria — ela espera o estado `paid` ou o `board_payment_added`.
- **RN-09 — Não há replay no socket.** Se a aprovação acontece com o app fechado ou desconectado, nenhum evento chega depois. Por isso a leitura de estado ao voltar para a tela, e a releitura da conta no `connect`, não são redundância.
- **RN-10 — Sem login, o pagador é um nome, não uma conta.** O nome usado é o mesmo da sacola (frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22)), e é ele que aparece em "Pix · Rafael" na lista de pagamentos. Não há histórico de pagamento por pessoa, não há cartão salvo e não há recibo por e-mail.
- **RN-11 — Dinheiro da mesa é float em real.** O contrato da mesa é v1; o valor digitado em "outro valor" é convertido numa fronteira só, e a comparação com o saldo usa a mesma unidade.
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
- [ ] Pagamento parcial aprovado deixa a conta aberta com o saldo correto, e aparece na lista de pagamentos com o nome de quem pagou.
- [ ] Pagamento que zera o saldo leva a conta ao estado de conta paga.
- [ ] Dois toques em "pagar" criam **uma** cobrança.
- [ ] Sair da tela e voltar com cobrança pendente mostra a cobrança em andamento, não um formulário vazio.
- [ ] Cartão: a aba de rede não mostra número de cartão saindo do aparelho para a nossa API.

## Decisões pendentes

| # | Tema | Recomendação default |
|---|------|----------------------|
| 1 | Número de pessoas para a divisão | Usar `pax` da movimentação quando existir; nulo, perguntar no app e **não** gravar na movimentação (gravar mudaria o dado que o PDV controla) |
| 2 | Cobrança pendente ao sair da tela | Manter pendente e guardar o `charge_id` localmente, por movimentação. Cancelar ao sair faria o cliente perder um Pix já copiado |
| 3 | Rede de segurança do estado da cobrança | Leitura de estado ao abrir a tela e ao voltar o foco, mais o evento de socket. Polling contínuo só se a execução mostrar que o evento não chega de forma confiável |
| 4 | Coletor de cartão | Reaproveitar o do `delivery-client` (`src/components/checkout/payment/collectors/`), que já tem Mercado Pago e o registro por provedor. Cartão só aparece quando o canal do provedor suportado estiver habilitado |
| 5 | Carteiras no primeiro corte | Pix e cartão primeiro, carteiras depois, na ordem das tasks — mas **todas** especificadas aqui, porque o desenho e a lista de canais já as preveem |
| 6 | Quem pode pagar quando a conta tem pedido de fechamento | Pagar continua permitido com `bill_requested_at` preenchido: pedir a conta não é travar a conta |
