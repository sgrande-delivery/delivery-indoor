# 01 — Tela de pagamento e opções da loja: canais, indisponíveis e loja sem canal

**Issue:** [#61](https://github.com/sgrande-delivery/delivery-indoor/issues/61)
**Feature:** [Pagamento da conta da mesa pelo app](../spec.md) — issue #24
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** #23 — linhas 01 ([#53](https://github.com/sgrande-delivery/delivery-indoor/issues/53)), 06 ([#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58)), 07 ([#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59)) e 08 ([#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60)) do plan de lá; #21 — linha 01 ([#40](https://github.com/sgrande-delivery/delivery-indoor/issues/40), `formatCents`)
**Status:** pendente
**Alinhado a #23 (#53, #58, #59, #60) (2026-11-23):** a rota é `/board/payment`, a constante que a #59 declara; garçom e "pedir a conta" são as peças da #59 (`ConnectedWaiterCallButton`, `RequestBillAction`), e a #59 entra na dependência (já vinha pela #60); a chave de `payment-options` entra no grupo `movement` da lista da #58; a coluna do tablet deitado segue o contrato do lugar `payment` da #60 (decisão 4 de lá), e por isso não desenha "Conta paga" nem "Ver a conta da mesa" (decisão 10, antes na #66).

## Objetivo

A conta ganha a tela de pagamento. Ela abre de "Pagar conta", mostra no cabeçalho o que falta pagar e lista as formas de pagamento online que a loja habilitou, lidas de `GET /boardMovements/{id}/payment-options`, em centavos. Canal habilitado e ainda não pagável aparece desabilitado com o motivo, e loja sem canal online vê a explicação e as saídas de chamar o garçom e pedir a conta. A tela mora onde cada formato pede: página cheia no celular, `Sheet` sobre a conta no tablet em pé e coluna da direita da conta no tablet deitado. A escolha do valor entra na 02, e o CTA ganha ação na 03.

## Contexto

### Estado atual

- **Não há pagamento no app v2.** `src/routes/app-routes.ts:1-12` tem `HOME_ROUTE`, `MENU_ROUTE`, `SEARCH_ROUTE`, `CART_ROUTE` e `BOARD_ROUTE`, e nada em `src/` ou `app/` fala de pagamento.
- **A aba Conta está inerte** (`src/components/shell/shell-tabs.ts:21`, `isAvailable: false`) até a #53 entregar `/board`. `resolveActiveTab` já põe toda a árvore `/board/*` na aba Conta (`shell-tabs.ts:34-37`), então `/board/payment` acende a aba sem mudança.
- **A navegação do celular aparece em toda rota com mesa.** `AppShell.tsx:103` calcula `showChrome = session.hasTable || session.isLoading`, e `:162-164` monta o `ShellNav` com isso. Não há rota que esconda a navegação.
- **A árvore** (`src/App.tsx:24-38`): `QueryClientProvider` > `ThemeProvider` > `ToastProvider` > `ConnectivityProvider` > `BoardSessionProvider` > `AppShell` > `BoardSessionGate`. A #47 põe o `PersonProvider` entre o `BoardSessionProvider` e o `AppShell`.
- **Primitivos que servem**, todos em `src/components/ui/`:
  - `Sheet` (`Sheet.tsx:16-35`): cabeçalho com `title` e `subtitle` (`PanelHeader.tsx:13-17`), `footer` e alça. Para em 480 (`:70`, `appShellMetrics.maxInlineSize`);
  - `Skeleton`, `EmptyState`, `Radio`, `Icon`, `Button` (variantes `primary | secondary | neutral | ghost | destructive | inverse`, `Button.tsx:36`).
- **Estados da #38:** `useQueryScreenState` (`src/hooks/use-query-screen-state.ts:34`), `RouteErrorState`, `InlineError` e `useIsOffline` (`src/providers/connectivity/ConnectivityProvider.tsx:57`).
- **Garçom e conta pedida:** o `WaiterCallButton` (`src/components/waiter/WaiterCallButton.tsx:13-18`) fica desabilitado sem `onClick`. A #59 o liga no `ConnectedWaiterCallButton` e cria o `RequestBillAction`, e os dois estão na base (a #60, de que esta task depende, depende da #59). A tabela "Consumidores fora da conta" da #59 é o contrato: esta task monta as duas peças e não cria mutação nem estado.
- **Métricas já vendoradas:** `checkoutMetrics` (`src/theme/component-tokens.ts:3743`), que o cartão de opção do client lê.
- **Ícones:** `qr_code_2`, `credit_card`, `account_balance_wallet`, `account_balance`, `room_service`, `receipt_long`, `arrow_back`, `close`, `info` e `error` estão em `src/components/ui/icon-names.ts`. **Esta task não pede ícone novo**, e nenhuma task da #24 regera o woff2 (aprendizado da #35).

### Contrato de `GET /boardMovements/{id}/payment-options`

Da [delivery-api#1635](https://github.com/sgrande-delivery/delivery-api/issues/1635), emendada em 2026-11-23. A rota ainda **não existe**: a tela é construída contra este contrato, e o aviso de deploy vai no relatório.

```
GET /api/client/boardMovements/{id}/payment-options
  headers: x-restaurant-id (UUID)       sem login
  → 200 {
      amount_due: int,       // centavos: round(total_due × 100), o total da conta com a taxa
      amount_paid: int,      // centavos: round(total_paid × 100)
      amount_pending: int,   // centavos: soma das cobranças pendentes da mesa (0 até a #1640)
      pax: int | null,
      channels: [ { channel, provider, environment, homologated, public_key, google_pay? } ],
      unavailable_channels: [ { channel, provider, reason } ]
    }
  movimentação inexistente ou de outra loja → 404, internal_code próprio (sem nome no contrato)
  loja no caminho legado                    → 200 com channels: []
```

Exemplo, a conta do canvas (R$ 155,43, com R$ 60,00 pagos):

```json
{
  "amount_due": 15543, "amount_paid": 6000, "amount_pending": 0, "pax": 2,
  "channels": [
    { "channel": "pix", "provider": "mercadopago", "environment": "production", "homologated": true, "public_key": "APP_USR-…" },
    { "channel": "card", "provider": "mercadopago", "environment": "production", "homologated": true, "public_key": "APP_USR-…" },
    { "channel": "wallet_googlepay", "provider": "mercadopago", "environment": "production", "homologated": true, "public_key": "APP_USR-…",
      "google_pay": { "gateway": "mercadopago", "gateway_merchant_id": "…", "merchant_id": "…", "allowed_card_networks": ["VISA", "MASTERCARD"], "pending": [] } },
    { "channel": "wallet_nupay", "provider": "nupay", "environment": "sandbox", "homologated": false, "public_key": null }
  ],
  "unavailable_channels": []
}
```

O formato do canal é o do `PaymentCapabilitiesPresenter` (`core/PaymentConnector/Application/PaymentCapabilitiesPresenter.php`, `origin/master`), medido em 2026-11-23:

- `channel` ∈ `card | pix | wallet_mercadopago | wallet_picpay | wallet_nupay | wallet_googlepay` (`PaymentChannelEnum`);
- `environment` ∈ `sandbox | production`; `public_key` é `string | null`;
- `google_pay`, só no canal `wallet_googlepay`, é `{ gateway, gateway_merchant_id, merchant_id, allowed_card_networks: string[], pending: ('gateway_not_homologated' | 'checklist_not_approved')[] }`;
- `unavailable_channels[].reason` hoje é só `googlepay_gateway_not_configured` ou `googlepay_config_incomplete` (`ChannelUnavailableReasonEnum`). O app trata qualquer outro como desconhecido.

**`amount_due` é o total, não o que falta.** O que falta pagar é `max(0, amount_due − amount_paid)`. Com o exemplo: 15543 − 6000 = 9543, os R$ 95,43 do canvas.

### Requisitos cobertos

- **RF-01:** a tela abre da conta com o que falta pagar no cabeçalho.
- **RF-05:** só os canais que a loja habilitou, com a nota de que são opções da loja.
- **RF-06:** canal habilitado e não pagável aparece desabilitado com o motivo.
- **RF-07:** loja sem canal online explica e oferece garçom e pedir a conta.
- **RF-10a**, a parte da escolha: página no celular, `Sheet` no tablet em pé, coluna no tablet deitado.
- **RF-19:** conta paga, ou sem nada a pagar, mostra o estado em vez do formulário.
- **RN-03:** o aviso de pagamento em andamento, pelo `amount_pending`.
- **RN-05:** o apoio de cada canal no tablet diz onde a ação acontece, e não oferece meio de pagamento de ninguém.
- **RN-11:** o dinheiro desta tela é todo de `payment-options`, em centavos.
- **RF-10a da #20:** offline, pagar pelo app sai do ar, com a frase do artboard.

### Referência de design

Canvas Brasa Punch Indoor. Layout, hierarquia, copy e estados vêm daqui; token vem do tema (skill `modelo-de-design`).

- **Celular — `Conta · celular · pagar pelo app`** (interativo):
  - cabeçalho com `arrow_back`, "Pagar conta" (display 20/800) e "Mesa 12 · falta pagar R$ 95,43" (11 `muted`);
  - seção "Forma de pagamento", com a nota "Opções online habilitadas pela Topezeira" logo abaixo do rótulo;
  - linhas de opção com ícone, nome, apoio e rádio à direita;
  - rodapé fixo em `card` com borda `line`: "Você paga agora" e o CTA (02 e 03).
- **Tablet em pé — `Pagamento · tablet em pé · valor e forma`:**
  - a conta continua ao fundo ("Falta pagar R$ 95,43 · R$ 60,00 pagos de R$ 155,43"), sob o véu;
  - folha com alça, "Pagar conta" (22/800), "Mesa 12 · falta pagar R$ 95,43" e fechar;
  - formas em grade de duas colunas (tile de 72, caixa de ícone de 42 em `field`);
  - nota "Opções online habilitadas pela loja. Este tablet é da mesa: nada de cartão salvo aqui, e carteira digital abre por QR no celular de quem paga.";
  - resumo e CTA no pé (02 e 03).
- **Tablet deitado — `Conta · tablet deitado` (`Main`):** na coluna da direita, abaixo do card de destaque da [#54](https://github.com/sgrande-delivery/delivery-indoor/issues/54), um cartão com "Quanto você vai pagar?" (02), "Forma de pagamento" em grade de duas colunas (tile de 64), a nota "Opções online habilitadas pela loja. No tablet compartilhado, carteiras digitais abrem por QR no celular de quem paga." e o CTA no pé do cartão.
- **Design system:** `design-system/components/PaymentMethodOption/README.md`:
  - caixa de ícone de 38 (raio 12, `field`), nome 13.5/700, apoio 11 `muted`;
  - a mesma métrica do `AmountOption` (62 de altura mínima); selecionado com borda `primary` e `elevation-md`;
  - indisponível, desabilitado com o motivo; sem canal, a seção some e a tela explica.

Nome, ícone e apoio de cada canal, por formato (apoio literal do canvas):

| Canal | Ícone | Nome | Apoio no celular | Apoio no tablet em pé | Apoio no tablet deitado |
|---|---|---|---|---|---|
| `pix` | `qr_code_2` | Pix | Aprovação na hora | QR na tela da mesa | QR na tela |
| `card` | `credit_card` | Cartão de crédito (celular) · Crédito (tablet) | digitar cartão | digitar cartão | digitar cartão |
| `wallet_googlepay` | `account_balance_wallet` | Google Pay | Cartões salvos na sua conta Google | abre por QR no seu celular | no seu celular |
| `wallet_nupay` | `account_balance` | NuPay | Pague direto pelo app do Nubank | abre por QR no seu celular | no seu celular |

**O canvas do celular desenha cartão salvo** ("Mastercard •••• 4821 · trocar") no apoio do cartão. Cartão salvo depende de login e está fora do escopo (spec, "Fora do escopo"; RN-10). O apoio no celular é o do tablet, "digitar cartão".

### Inventário do `delivery-client` @ `ceed49a9`

Lido por `git -C ~/workspace/sgrande-delivery/delivery-client show origin/feat/app-v2:<caminho>`.

| Caminho | Decisão | Motivo |
|---|---|---|
| `src/types/payment-capabilities.ts` | adapta → `src/types/board-payment.ts` | Entram `google_pay?`, `unavailable_channels`, o saldo e o `pax`. Saem `uses_payment_connectors` e `card_wallet_enabled` |
| `src/services/payment-config.ts` | adapta → `src/services/board-payment-options.ts` | Outra rota. Fica a normalização fail-closed (`:22-35`), e entra a guarda de inteiro (decisão 6) |
| `src/components/checkout/payment/payment-capabilities-query.ts` | adapta → `src/hooks/use-board-payment-options.ts` | Chave por movimentação. Sai o `staleTime` de 5 min: aqui a resposta é saldo |
| `payment-channels.ts` | `capabilityForChannel` porta; `channelForMethod` descarta | A lista aqui é de canais, e não do catálogo `/order/paymentMethods` |
| `payment-offer.ts` | adapta → `payment-methods.ts` | O servidor manda `unavailable_channels`. Ficam as conferências locais: `homologated`, `public_key` e provedor com coletor (`:28-34`) |
| `payment-offer-copy.ts` | adapta → `payment-method-copy.ts` | Copy por motivo, do servidor e local, com "a loja" no lugar de "o restaurante" |
| `PaymentMethodsEmpty.tsx` | adapta → `NoOnlinePaymentState.tsx` | Vira o estado da RF-07, com garçom e pedir a conta no lugar de "Fale com a loja" |
| `CheckoutOptionCard.tsx` (418 linhas), `CheckoutRadioGroup.tsx` (116), `checkout-radio.ts` | portam, renomeados para `PaymentOptionCard`, `PaymentRadioGroup` e `payment-radio.ts` | Variantes `row` e `tile`, setas que selecionam e `tabIndex` itinerante do WAI-ARIA (`checkout-radio.ts:1-6`). Leem `checkoutMetrics`, já vendorado. São código de app do client, não DS: o nome muda porque aqui não há checkout |
| `PaymentKindTile.tsx`, `payment-kind-icon.ts` | adapta | Ícone por canal, e não por `method.kind` |
| `PaymentMethodList.tsx`, `PaymentMethodItem.tsx`, `PaymentMethodSection.tsx` | adapta | Lista de canais. Sai dinheiro, troco e modalidade de entrega |
| `payment-groups.ts`, `payment-methods-query.ts`, `Change*`, `change-*.ts`, `SavedCard*`, `AddCardAction.tsx`, `payment-offer-log.ts` | descarta | Catálogo do delivery, troco, cartão salvo e o beacon de canal bloqueado do checkout |

### Decisões

1. **Uma rota, `/board/payment`, para todos os formatos.** É o `BOARD_PAYMENT_ROUTE` que a #59 declara em `src/routes/app-routes.ts` (decisão 6 de lá); esta task o importa. O "Pagar conta" da #59 navega para ela, e fechar ou voltar leva para `/board`. Com a URL, o botão voltar do celular fecha a tela, e o reload mantém o fluxo aberto.
   - **Celular:** a página cheia, com a navegação inferior escondida nesta rota (mudança 8).
   - **Tablet em pé:** a conta da #53 ao fundo e o `Sheet` aberto por cima.
   - **Tablet deitado:** a conta, cuja coluna da direita já traz o formulário inline. `/board` e `/board/payment` mostram o mesmo.
2. **O que fica no fluxo é decidido por CSS; o que é portal, por hook.** A página do celular e a conta do tablet entram as duas no fluxo de `/board/payment`, escondidas por `tabletShellMediaQuery` (`src/components/shell/shell-metrics.ts:3`), como o `AppShell` faz. O `Sheet` é portal com foco preso e monta por `useMediaQuery`, como o `RouteErrorState` da #38. Assim o primeiro paint no tablet não pisca a página do celular.
3. **Um formulário, três lugares.** `BoardPaymentForm` é o corpo comum. A prop `placement: 'page' | 'sheet' | 'column'` escolhe a forma das opções (linhas no celular, grade de duas colunas no tablet) e o apoio do canal. Os três hospedeiros só põem moldura, cabeçalho e rodapé.
4. **O app conhece quatro canais, os do design.** `pix`, `card`, `wallet_googlepay` e `wallet_nupay`, nesta ordem. `wallet_picpay` e `wallet_mercadopago` não entram na lista: o app não tem fluxo nem copy para eles (decisão pendente 7 da spec). Um canal por entrada: com dois provedores para o mesmo canal, vale o primeiro pagável na ordem do servidor, e sem nenhum pagável, o primeiro indisponível.
5. **Quando uma forma é pagável.** `resolvePaymentMethods` (puro) marca cada canal como pagável ou indisponível, com o motivo, nesta ordem:
   1. está em `unavailable_channels` → o `reason` do servidor;
   2. `homologated: false` → `not_homologated` (RF-06);
   3. `card` sem `public_key` → `no_public_key`;
   4. `card` de provedor sem coletor no app → `no_collector`. Hoje só `mercadopago` tem coletor; a 04 troca a lista fixa pelo `resolveCollector`;
   5. `wallet_googlepay` sem `google_pay`, ou com `pending` não vazio → `googlepay_pending`.

   **Sem nenhuma forma pagável**, a tela é o estado da RF-07, e as indisponíveis aparecem abaixo dele, desabilitadas.
6. **Valor que não é inteiro é erro de contrato.** `fetchBoardPaymentOptions` confere `Number.isInteger` em `amount_due` e `amount_paid`, e lança `InvalidBoardPaymentOptionsError` se falhar. É o sinal de uma api ainda no formato antigo (a #1635 antes da emenda devolvia real), e multiplicar por 100 "por garantia" seria adivinhar unidade com dinheiro. `amount_pending` ausente vira `0`; não inteiro, erro. `channels` e `unavailable_channels` que não são lista viram `[]` (fail-closed, como o `payment-config.ts:22-35` do client), e entrada sem `channel` ou `provider` em texto sai. `pax` que não é inteiro ≥ 1 vira `null`.
7. **A query.** `boardPaymentOptionsQueryKey(id)` → `['board-payment-options', id]`, exportada.
   - `staleTime: 0` e `refetchOnWindowFocus: true`, que sobrescrevem o default da raiz (`src/App.tsx:15`). A conta é concorrente (RN-01), e o client faz a mesma sobrescrita no Pix (`use-pix-status.ts:59-60` @ `ceed49a9`).
   - `retry` não repete 404.
   - Um 404 com `internal_code` diferente de `route_not_found` invalida `boardMovementQueryKey(id)` (`src/services/board-movement.ts:8-10`): a movimentação pode ter sumido, e quem decide "sem mesa" é o portão da #36. Já o 404 `route_not_found` é a rota que ainda não subiu, e vira erro com código, como qualquer outro.
8. **A invalidação pelos eventos da conta é da #58.** O handler de lá traduz cada evento em grupos (`movement`, `products`, `payments`) e cada grupo em chaves pela lista única `BOARD_BILL_QUERY_KEYS` (`src/components/board/realtime/board-bill-keys.ts`, mudança 3 da #58). Esta task acrescenta `boardPaymentOptionsQueryKey` **ao grupo `movement`**, numa linha, e não registra listener próprio: um `on` por evento, com um handler só (RN-03 da #23). O grupo é o certo porque o `amount_due` e o `amount_paid` são o `total_due` e o `total_paid` da movimentação: mudam nos eventos que releem a movimentação (lançar e remover item, lançar e excluir pagamento, totais), e na reconexão, que relê os três grupos. O `board.charge_updated` é da 03.
9. **A seleção da forma vive acima das rotas.** `BoardPaymentProvider` (`src/providers/board-payment/`) guarda a forma escolhida, e a 02 acrescenta o valor. Ele fica em `src/App.tsx`, logo dentro do `PersonProvider` da #47. Girar o tablet troca o hospedeiro sem perder a escolha.
   - A forma inicial é a primeira pagável na ordem do design (o Pix, no canvas).
   - Se a escolhida deixar de ser pagável numa releitura, a seleção volta para a primeira pagável.
   - Trocar de movimentação zera tudo.
10. **O estado da tela, puro, nesta ordem** (`resolvePaymentScreenState`):
    1. o `view` do `useQueryScreenState` (`skeleton`, `error`);
    2. `amount_due === 0` → `nothing-due` (a mesa ainda não tem o que pagar);
    3. `amount_due − amount_paid ≤ 0` → `paid`;
    4. nenhuma forma pagável → `no-online-payment`;
    5. senão, `form`.

    Movimentação fechada não chega aqui: o portão da #36 troca a rota pela tela "sem mesa".

    **Na coluna do tablet deitado, dois estados mudam**, pelo contrato do lugar `payment` da #60 (decisão 4 de lá):
    - **`paid` não desenha nada.** Quem diz "conta paga" em paisagem é o bloco de encerramento da #60, que troca a coluna quando a movimentação relida traz `is_board_paid`. Se `payment-options` chegar antes, a coluna fica vazia até lá, e não mostra um segundo "Conta paga" que piscaria antes do encerramento;
    - **`nothing-due` sai sem "Ver a conta da mesa"**: a coluna já é a conta.

    No celular e no tablet em pé, os dois estados ficam como na tabela de Copy.
11. **O erro tem a forma do lugar.**
    - **Página do celular:** a rota inteira depende da leitura, então é o `RouteErrorState`.
    - **`Sheet` e coluna:** é bloco secundário, porque a conta continua de pé. Então é o `InlineError`, como a #38 prescreve ("Como as frentes #21–#24 consomem").
12. **Offline:** o formulário continua na tela, e o rodapé mostra a frase do artboard no lugar do CTA (`useIsOffline()`). A mutação que a 03 cria nunca nasce offline, porque nasceria pausada (armadilha da #38).

### Copy

A caixa segue o design. As frases **derivadas** não estão desenhadas e precisam de confirmação do dev no review.

| Onde | Texto | Fonte |
|---|---|---|
| Cabeçalho | "Pagar conta" · "Mesa {n} · falta pagar {R$}" | canvas, literal |
| Seção | "Forma de pagamento" | canvas, literal |
| Nota (celular) | "Opções online habilitadas pela {nome da loja}" | canvas, literal (o nome vem de `useRestaurant()`; sem nome, "pela loja") |
| Nota (tablet em pé) | "Opções online habilitadas pela loja. Este tablet é da mesa: nada de cartão salvo aqui, e carteira digital abre por QR no celular de quem paga." | canvas, literal |
| Nota (tablet deitado) | "Opções online habilitadas pela loja. No tablet compartilhado, carteiras digitais abrem por QR no celular de quem paga." | canvas, literal |
| Indisponível, `not_homologated` | apoio "Indisponível: a loja ainda não concluiu o cadastro" | **derivada** de `payment-offer-copy.ts:3-8` @ `ceed49a9` |
| Indisponível, outros motivos | apoio "Indisponível no momento" | **derivada** |
| Loja sem canal (RF-07) | "Pagamento pelo app indisponível" · "A loja não aceita pagamento pelo app. Chame o garçom ou peça a conta para pagar na mesa." · ações "Chamar garçom" e "Pedir a conta" | **derivada** do `PaymentMethodOption/README.md` e do `PaymentMethodsEmpty.tsx:8-27` @ `ceed49a9` |
| Conta paga (RF-19) | "Conta paga" · "Não há mais nada a pagar nesta mesa." · "Ver a conta da mesa" | título e ação dos artboards de conta paga e de confirmação; a linha de apoio é **derivada** |
| Nada a pagar | "Ainda não há nada para pagar" · "Quando o primeiro pedido for lançado, a conta aparece aqui." · "Ver a conta da mesa" | **derivada** |
| Pagamento em andamento (RN-03) | "Há {R$} em pagamento nesta mesa agora. Se for aprovado, o que falta pagar diminui." | **derivada** |
| Offline | "Pagamento pelo app indisponível sem conexão. O garçom fecha a conta no caixa." | artboard `Estado · offline`, literal (tabela de copy da #38) |
| Erro de rota (celular) | "Não conseguimos carregar o pagamento" · "A conta continua aberta e nada foi cobrado. Verifique a conexão e tente de novo — ou chame o garçom." · "Tentar novamente" | **derivada** do artboard `Estado · erro de rota` |
| Erro inline (tablet) | "Não conseguimos carregar as formas de pagamento." · "Tentar de novo" | **derivada** |

### Armadilhas

- **`amount_due` não é o que falta pagar.** Ele é o total (o `total_due` da conta). Mostrar `amount_due` no cabeçalho cobra de novo o que já foi pago.
- **Centavos nos dois lados.** `formatCents` (#40) recebe centavos, e `moneyFormat` (`src/helpers/numberFormat.js:23`) recebe reais. Nenhum valor desta tela passa pelo segundo.
- **Os primitivos precisam do tema.** Todo primitivo lê `theme.vars.palette.*`, e a validação no navegador exige a base com a #34 (já na `feat/indoor-v2`).
- **A conta ao fundo é da #53.** No tablet em pé, `/board/payment` monta o `BoardScreen` que a #53 cria para `/board`, e que não depende da rota (mudança 7 da #53, "Quem mais monta"). Esta task importa esse componente e não o reescreve.
- **A conta escondida continua montada.** No celular, `/board/payment` tem o `BoardScreen` no fluxo, escondido por CSS (decisão 2). Os hooks dele rodam, inclusive a linha do banner offline da #58 ("Esta é a conta de {HH:mm}…"), que aparece também nesta página quando a rede cai. É a mesma mesa e a mesma hora, e o rodapé desta página diz o resto. Aceito; não montar a conta por `useMediaQuery` para evitar isso, porque é o que faz o tablet piscar a forma do celular.
- **O canal de carteira é chave de ativação, não instrumento** (`CLAUDE.md` da api, "Pagamento por conectores"). Aqui ele só escolhe a linha da lista; o que vai na cobrança é da 03, da 04 e da 05.
- **O `Sheet` não tem modo "não fecha"**, e aqui não precisa: fechar volta para `/board`, sem perder nada, porque a seleção mora no provider.
- **Tela dentro do `AppShell` não usa `<main>` nem `100dvh`** (aprendizado da #37). A página do celular preenche com `blockSize: 100%`, e o rodapé fixo é da página, e não `position: fixed` na viewport.

## Mudanças

### 1. Tipos

`src/types/board-payment.ts` (novo). Só o que é desta task; a 03 acrescenta a cobrança.

```ts
/** Centavos inteiros (RN-11): `payment-options`, cobrança e `board.charge_updated`. */
export type Cents = number;

export type PaymentChannel = 'card' | 'pix' | 'wallet_mercadopago' | 'wallet_picpay' | 'wallet_nupay' | 'wallet_googlepay';
export type PaymentEnvironment = 'sandbox' | 'production';
export type GooglePayPendingReason = 'gateway_not_homologated' | 'checklist_not_approved';

export interface GooglePayTokenization {
  gateway: string;
  gateway_merchant_id: string;
  merchant_id: string;
  allowed_card_networks: string[];
  pending: GooglePayPendingReason[];
}

export interface PaymentChannelCapability {
  channel: PaymentChannel;
  provider: string;
  environment: PaymentEnvironment;
  homologated: boolean;
  public_key: string | null;
  google_pay?: GooglePayTokenization;
}

export interface UnavailablePaymentChannel {
  channel: PaymentChannel;
  provider: string;
  reason: string; // 'googlepay_gateway_not_configured' | 'googlepay_config_incomplete' hoje; outro valor é desconhecido
}

/** `GET /boardMovements/{id}/payment-options` — delivery-api#1635. */
export interface BoardPaymentOptions {
  amount_due: Cents;     // o total da conta, não o que falta
  amount_paid: Cents;
  amount_pending: Cents;
  pax: number | null;
  channels: PaymentChannelCapability[];
  unavailable_channels: UnavailablePaymentChannel[];
}
```

### 2. Serviço

`src/services/board-payment-options.ts` (novo). O molde é `src/services/board-movement.ts` (a guarda de payload e o erro nomeado).

- `boardPaymentOptionsQueryKey(id: string)` → `['board-payment-options', id]`;
- `fetchBoardPaymentOptions(id)` → `api.get<unknown>(`/boardMovements/${encodeURIComponent(id)}/payment-options`)` e a normalização da decisão 6;
- `InvalidBoardPaymentOptionsError`;
- `remainingCents(options: BoardPaymentOptions): Cents` → `Math.max(0, amount_due − amount_paid)`. É exportada daqui porque o cabeçalho, o estado da tela e a 02 leem o mesmo número.

### 3. Hook

`src/hooks/use-board-payment-options.ts` (novo): `useBoardPaymentOptions(movementId: string | null)`, com a query da decisão 7 e `skipToken` sem id, como `use-board-movement.ts`.

### 4. Formas de pagamento

`src/components/board-payment/options/` (novos):

- `payment-methods.ts` (puro): o mapa fechado dos quatro canais (nome por formato, ícone, apoio por `placement`, a tabela da Referência de design) e `resolvePaymentMethods(options): PaymentMethodOption[]`, com a decisão 5.

  ```ts
  export type PaymentMethodKey = 'pix' | 'card' | 'wallet_googlepay' | 'wallet_nupay';
  export type PaymentPlacement = 'page' | 'sheet' | 'column';
  export type PaymentMethodBlock = 'server' | 'not_homologated' | 'no_public_key' | 'no_collector' | 'googlepay_pending';

  export interface PaymentMethodOption {
    key: PaymentMethodKey;
    capability: PaymentChannelCapability | null; // null quando só existe em unavailable_channels
    block: PaymentMethodBlock | null;            // null = pagável
    serverReason: string | null;
  }
  ```

- `payment-method-copy.ts`: o nome, o apoio e o apoio de indisponível (tabela de Copy).
- `PaymentOptionCard.tsx`, `PaymentRadioGroup.tsx` e `payment-radio.ts`: portam do client (inventário). A variante `row` serve ao celular e a `tile` ao tablet. O 62 de altura mínima do `AmountOption`/`PaymentMethodOption` é o alvo de toque da linha inteira.
- `PaymentMethodList.tsx` e `PaymentMethodItem.tsx`: um `radiogroup` rotulado por "Forma de pagamento". A opção indisponível vai com `disabled` e o apoio de indisponível, e continua lida pelo leitor de tela.
- `PaymentMethodSection.tsx`: rótulo, lista e nota, com a nota no lugar de cada formato (abaixo do rótulo no celular, abaixo da lista no tablet).

### 5. Estados da tela

`src/components/board-payment/state/` (novos):

- `payment-screen-state.ts` (puro): `resolvePaymentScreenState` (decisão 10);
- `NoOnlinePaymentState.tsx`: o `EmptyState` com a copy da RF-07, o `ConnectedWaiterCallButton` e o `RequestBillAction` da #59 (este com o `movement` do `useBoardSession()`), sem mutação nem estado próprios ("Consumidores fora da conta" da #59). No tablet deitado o "Pedir a conta" aparece também no card de destaque, e os dois mostram o mesmo estado. Abaixo do estado, as formas indisponíveis, se houver;
- `BoardBillSettledState.tsx`: conta paga e nada a pagar, com `check_circle` em `success` no primeiro caso e o `Button` `neutral` "Ver a conta da mesa" para `BOARD_ROUTE`. Prop `showBillLink: boolean`, falsa na coluna (decisão 10);
- `PaymentInProgressNotice.tsx`: a linha da RN-03, com `info`, só com `amount_pending > 0`;
- `BoardPaymentSkeleton.tsx`: na forma do formulário, com o rótulo, três opções e a grade, e com o mesmo tamanho dele.

### 6. Formulário e hospedeiros

`src/components/board-payment/` (novos):

- `BoardPaymentForm.tsx`: o corpo comum (decisão 3), com o lugar da seção de valor (a 02 a monta), a seção de formas, o aviso de andamento e o lugar do resumo (02).
- `BoardPaymentFooter.tsx`: o rodapé comum. Nesta task, só a frase de offline. A 02 põe "Você paga agora" e o valor, e a 03 põe o CTA.
- `BoardPaymentPage.tsx` (celular): cabeçalho com `IconButton` `arrow_back` (rótulo "Voltar para a conta"), título e apoio do canvas, corpo que rola e rodapé fixo da página.
- `BoardPaymentSheet.tsx` (tablet em pé): o `Sheet` com `header={{ title: 'Pagar conta', subtitle }}`, o formulário e o rodapé no `footer`. Fechar faz `router.push(BOARD_ROUTE)`.
- `BoardPaymentColumn.tsx` (tablet deitado): o cartão da coluna, sem cabeçalho (o card de destaque da #54 já mostra o que falta pagar), com o formulário e o rodapé no pé do cartão. Ocupa o lugar `payment` do `BoardBillAside` pelo contrato da #60: traz a própria frase offline (no rodapé, decisão 12), devolve `null` no estado `paid` e monta o `BoardBillSettledState` sem o link no `nothing-due` (decisão 10).
- `board-payment-metrics.ts`: as medidas do canvas sem token próprio (respiro da página, tile 72/64, caixa de ícone 42/38). Sem hex.
- `use-payment-placement.ts`: `useMediaQuery(tabletShellMediaQuery)` e `useMediaQuery(overlayMediaQuery)`, só para quem monta portal (decisão 2).

### 7. Rota

- `src/routes/app-routes.ts`: **sem mudança.** O `BOARD_PAYMENT_ROUTE = '/board/payment'` é da #59, que está na base; esta task o importa.
- `app/board/payment/page.tsx` (novo): `BoardPaymentRoute`, com a página do celular no fluxo (escondida no shell de tablet), o `BoardScreen` da #53 no fluxo (escondido fora dele) e o `BoardPaymentSheet` montado por hook, só no tablet em pé. A mesa vem de `useBoardSession()`, e nada lê `?session`.
- **Tablet deitado:** `src/components/board/BoardScreen.tsx` (alterado), uma linha no ramo aberto do mapa da #60: `payment={<PayBillButton movement={movement} />}` vira `payment={<BoardPaymentColumn />}`. Daí em diante não há botão "Pagar conta" em paisagem: o formulário é a entrada (RF-10a). O `OrderMoreButton` abaixo do lugar e o ramo pago (o encerramento da #60) não mudam.

### 8. Navegação escondida no celular

- `src/components/shell/shell-tabs.ts` (alterado): `+ export function hidesPhoneNav(pathname: string): boolean`, verdadeiro só em `BOARD_PAYMENT_ROUTE`.
- `src/components/shell/AppShell.tsx` (alterado), uma condição:

```diff
-          <ChromeBlock ref={setChromeBlock} isHidden={!showChrome}>
-            {showChrome && <ShellNav activeTab={resolveActiveTab(pathname, 'phone')} />}
+          <ChromeBlock ref={setChromeBlock} isHidden={!showChrome || hidesPhoneNav(pathname)}>
+            {showChrome && !hidesPhoneNav(pathname) && <ShellNav activeTab={resolveActiveTab(pathname, 'phone')} />}
```

O `ChromeBlock` escondido mede 0, e o toast desce para a borda (`AppShell.tsx:122-145`), que é onde ele deve ficar com o rodapé da página.

### 9. Provider e árvore

- `src/providers/board-payment/BoardPaymentProvider.tsx` (novo, `'use client'`) e `src/providers/board-payment/index.ts` (barrel, como o de `board-session`): `{ method: PaymentMethodKey | null; selectMethod(key) }`, com as regras da decisão 9. `useBoardPayment()` lança fora do provider.
- `src/App.tsx` (alterado): um aninhamento, dentro do `PersonProvider` da #47.

```diff
               <PersonProvider>
-                <AppShell>
-                  <BoardSessionGate>{children}</BoardSessionGate>
-                </AppShell>
+                <BoardPaymentProvider>
+                  <AppShell>
+                    <BoardSessionGate>{children}</BoardSessionGate>
+                  </AppShell>
+                </BoardPaymentProvider>
               </PersonProvider>
```

Se a #47 ainda não estiver na base, o aninhamento fica logo dentro do `BoardSessionProvider`, e a 03 o reposiciona quando precisar do nome.

### 10. A chave na lista da #58

`src/components/board/realtime/board-bill-keys.ts` (alterado, criado pela #58), uma linha, sem `socket.on` novo (decisão 8):

```diff
 export const BOARD_BILL_QUERY_KEYS: Record<BoardBillKey, readonly BoardBillQueryKeyBuilder[]> = {
-  movement: [boardMovementQueryKey],
+  movement: [boardMovementQueryKey, boardPaymentOptionsQueryKey],
   products: [boardProductsQueryKey],
   payments: [boardPaymentsQueryKey],
 };
```

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen` e `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` conclui, com `/board/payment` na lista de rotas.
4. `grep -rn "moneyFormat\|numberFormat" src/components/board-payment src/services/board-payment-options.ts` não encontra nada.
5. `grep -rn "#[0-9A-Fa-f]\{6\}" src/components/board-payment` não encontra nada.
6. `git diff --stat` não mostra `src/theme/`, `src/components/ui/` nem `src/fonts/`.

**No navegador**, com a #53, a #58, a #60 e a #40 na base, `.env.development` com `NEXT_PUBLIC_API`, `NEXT_PUBLIC_SOCKET` e `NEXT_PUBLIC_RESTAURANT_UUID`, e uma movimentação aberta.

**A rota ainda não existe na api.** Enquanto a #1635 não sobe, a resposta vem do "Override content" do DevTools: Network, botão direito em `payment-options`, "Override content", e colar o JSON. É ferramenta de teste no navegador, e não mock no código.

As fixtures:

- **A:** o exemplo do Contrato;
- **B:** `channels: []`, `unavailable_channels: []`;
- **C:** `amount_paid` igual a `amount_due`;
- **D:** `amount_due: 0`;
- **E:** `amount_due: 155.43` (real, por engano);
- **F:** a A com `amount_pending: 4772`;
- **G:** a A com o Pix em `homologated: false`.

1. **Sem override**, em `http://localhost:3000/board/payment?session=<uuid>`, a 390 × 844. **Observar:** o erro de rota com "Código erro 404 · route_not_found". Nenhuma requisição repete além do default.
2. **Fixture A, 390 × 844.** **Observar:**
   - "Mesa {n} · falta pagar R$ 95,43";
   - as quatro formas, com o NuPay desabilitado ("Indisponível: a loja ainda não concluiu o cadastro");
   - o Pix marcado;
   - a nota com o nome da loja;
   - nenhuma navegação inferior;
   - o botão voltar do navegador volta para `/board`.
3. **Fixture A, 820 × 1180.** **Observar:** a conta ao fundo, o `Sheet` de 480 com "Pagar conta", a grade de duas colunas e a nota do tablet em pé. O apoio do Google Pay é "abre por QR no seu celular". Fechar leva para `/board`.
4. **Fixture A, 1180 × 820.** Em `/board`, **observar:** o formulário na coluna da direita, abaixo do card de destaque, com a nota do tablet deitado; nenhum botão "Pagar conta" na coluna, e o "Pedir mais" abaixo do formulário. Girar para 820 × 1180 com o Pix trocado para o Cartão: a escolha continua no `Sheet`.
5. **Fixtures B, C e D.** **Observar**, a 390 × 844 e a 820 × 1180: o estado da RF-07 com os dois botões; "Conta paga"; "Ainda não há nada para pagar". Nenhum formulário. A 1180 × 820: o estado da RF-07 na coluna (com "Pedir a conta" também no card, no mesmo estado); com a C, a coluna vazia, sem "Conta paga" (quem diz é o encerramento da #60, quando a movimentação trouxer `is_board_paid`); com a D, "Ainda não há nada para pagar" sem "Ver a conta da mesa".
6. **Fixture E.** **Observar:** o erro com código, e não "falta pagar R$ 0,95".
7. **Fixture F.** **Observar:** o aviso "Há R$ 47,72 em pagamento nesta mesa agora…".
8. **Fixture G.** **Observar:** o Pix desabilitado, e o Cartão como forma inicial.
9. **Offline** (Network → Offline) com a fixture A na tela. **Observar:** o formulário fica, e o rodapé mostra "Pagamento pelo app indisponível sem conexão…".
10. **Tempo real.** Com a fixture A na tela, lançar um item no PDV. **Observar:** uma nova requisição a `payment-options`, pela lista da #58.
11. **Teclado.** Na lista de formas, `Tab` entra uma vez no grupo e as setas trocam a seleção. A forma indisponível é pulada.
12. **Alvos de toque.** Toda opção e todo botão têm ≥ 44 px nos três formatos.

## Critérios de aceitação

- [ ] `BoardPaymentOptions` declara exatamente os campos do contrato, com `amount_due`, `amount_paid` e `amount_pending` como centavos, e `channels[].google_pay` com os cinco campos medidos.
- [ ] O que falta pagar é `amount_due − amount_paid`, e nenhum lugar mostra `amount_due` como "falta pagar".
- [ ] `amount_due` ou `amount_paid` não inteiros viram erro com código, e não valor formatado.
- [ ] A lista mostra só `pix`, `card`, `wallet_googlepay` e `wallet_nupay`, nesta ordem, e só os que a loja mandou; canal não homologado, cartão sem `public_key` ou sem coletor, Google Pay com `pending` e entrada de `unavailable_channels` aparecem desabilitados com o apoio de indisponível.
- [ ] Sem forma pagável, a tela é o estado da RF-07, com chamar garçom e pedir a conta.
- [ ] Conta paga e conta sem nada a pagar mostram o estado, e não o formulário. Na coluna do tablet deitado, o estado `paid` não desenha nada e o `nothing-due` sai sem "Ver a conta da mesa" (contrato do lugar `payment` da #60).
- [ ] O tablet deitado não tem botão "Pagar conta": o `BoardScreen` passa `payment={<BoardPaymentColumn />}`, e a frase offline aparece uma vez só, no rodapé da coluna.
- [ ] O estado da RF-07 monta o `ConnectedWaiterCallButton` e o `RequestBillAction` da #59, sem mutação própria.
- [ ] O aviso de pagamento em andamento aparece só com `amount_pending > 0`.
- [ ] `/board/payment` é página cheia sem navegação inferior no celular, `Sheet` sobre a conta no tablet em pé e a coluna da conta no tablet deitado. Girar o tablet não perde a forma escolhida.
- [ ] O apoio de cada canal é o do formato, pela tabela da Referência de design, e nenhum apoio fala de cartão salvo.
- [ ] Offline, o rodapé mostra a frase do artboard.
- [ ] `payment-options` é invalidada pelos eventos da conta pela lista da #58, sem `socket.on` novo nesta task.
- [ ] Sem hex, sem `moneyFormat` e sem arquivo alterado em `src/theme/`, `src/components/ui/` ou `src/fonts/`.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` com as vars de restaurante passam.

## Fora de escopo

- **Quanto pagar** (as três opções, a divisão, o valor livre, o "Você paga agora" e o resumo): 02.
- **O CTA e a cobrança** (criação, espera, `board.charge_updated`, nome de quem paga): 03.
- **O coletor de cartão** e a troca da lista fixa de provedores pelo `resolveCollector`: 04.
- **O fluxo das carteiras**, inclusive o que o Google Pay faz no tablet: 05.
- **A retomada depois do reload** e as recusas da criação: 06.
- **O botão "Pagar conta"** da conta, a chamada de garçom, o pedido de conta e a constante `BOARD_PAYMENT_ROUTE`: #59. Aqui as peças de garçom e de conta só são montadas no estado da RF-07, e o botão sai da coluna do tablet deitado (mudança 7).
- **A coluna da direita** e o card de destaque do tablet deitado: #60 e #54.
- **O handler dos eventos da conta:** #58. Aqui só entra a chave na lista de lá.
- **`wallet_picpay` e `wallet_mercadopago`:** decisão pendente 7 da spec.
- **Mudar `GET /payment-config`** ou qualquer rota da api.

## Branch

`task/61-board-payment-options-screen`, base sugerida: `feat/indoor-v2` depois do merge da #53, da #58, da #59, da #60 e da #40 (ou a ponta da fila da #23, se elas ainda não tiverem entrado).
