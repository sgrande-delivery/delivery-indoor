# 04 — Cartão de crédito com coletor tokenizado e copy de recusa

**Issue:** [#64](https://github.com/sgrande-delivery/delivery-indoor/issues/64)
**Feature:** [Pagamento da conta da mesa pelo app](../spec.md) — issue #24
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 03 ([#63](https://github.com/sgrande-delivery/delivery-indoor/issues/63))
**Status:** pendente

## Objetivo

Cartão de crédito digitado na hora, pelos campos seguros do provedor: o número, a validade e o CVV não passam pela nossa API, e o que sai do aparelho para a `delivery-api` é o token. O coletor do Mercado Pago vem do `delivery-client` sem a parte de cartão salvo, e a cobrança usa a máquina da 03 — a mesma criação idempotente, a mesma espera e os mesmos desfechos. A falha de tokenização ganha copy própria; a recusa da cobrança já tem a do `refusal_reason` (03).

## Contexto

### Estado atual (depois da 03)

- A máquina da cobrança está em `src/providers/board-charge/`. `start({ channel, instrument })` faz o nome, a releitura do saldo e o `POST`; os desfechos (`PaymentConfirmed`, `ChargeRefused`) e o cancelamento já existem (03, decisões 3, 10, 11 e 12).
- O CTA é registrado por forma em `src/components/board-payment/cta/payment-cta.ts` (03, decisão 14). Só o Pix está lá.
- O `PaymentStepHost` decide o lugar do passo por formato (03, decisão 5): página no celular, `PaymentFullScreen` no tablet em pé, `Overlay` de 540 no deitado.
- A lista de formas marca o cartão de provedor sem coletor como `no_collector` por uma lista fixa (`mercadopago`), à espera do `resolveCollector` desta task (01, decisão 5).
- A rota `app/api/log/route.ts` (#38) aceita uma lista fechada de campos, e o `use-error-report` da #38 é o caminho do log de erro.

### Contrato

Da [delivery-api#1638](https://github.com/sgrande-delivery/delivery-api/issues/1638) (cartão e carteiras), sobre a criação da [#1636](https://github.com/sgrande-delivery/delivery-api/issues/1636). **Não existe ainda.**

```
POST /api/client/boardMovements/{id}/charges
  headers: x-restaurant-id, Idempotency-Key
  body: { amount, split_mode, person,
          instrument: { kind: "card", channel: "card", token: "<token do provedor>", brand?: "visa" } }
  → 201 { id, status, amount, expires_at, refusal_reason, amount_pending, cancel_token }   (o objeto da 03)
  qualquer campo de cartão cru no corpo (número, cvv, validade) → 4xx do RejectsRawCardFieldsTrait
  canal não habilitado na loja                                  → 422, internal_code próprio
```

O canal vem de `payment-options`: `{ channel: "card", provider: "mercadopago", environment, homologated, public_key }` (01). O `public_key` é público por natureza: é a chave com que o SDK do provedor tokeniza no navegador.

**O coletor do Mercado Pago**, medido no `delivery-client` @ `ceed49a9`:

- o SDK é carregado sob demanda de `https://sdk.mercadopago.com/js/v2` e instanciado como `new MercadoPago(publicKey, { locale: 'pt-BR' })` (`collectors/mercadopago/use-mercadopago-sdk.ts:7`, `:13-61`);
- os três campos seguros são iframes do provedor: `cardNumber`, `expirationDate` e `securityCode` (`MercadoPagoCardCollector.tsx:20-33`, `:70-89`). O BIN chega pelo evento `binChange`;
- tokenizar é `fields.createCardToken({ cardholderName, identificationType: 'CPF', identificationNumber })` (`mercadopago-card-collector.ts:42-46`), e **exige nome e CPF do titular**. Não pede valor, parcelas, emissor nem e-mail;
- o resultado é `{ kind: 'token', token, brand?, lastDigits? }`, com a bandeira por `getPaymentMethods({ bin })` (`:21-33`);
- o token é de uso único: cada tentativa de cobrança pede um token novo.

### Requisitos cobertos

- **RF-11:** os dados do cartão são coletados pelo componente do provedor, e só o token sai do aparelho.
- **RF-15**, parte de cartão: a recusa mostra o motivo (pela 03) e oferece outro cartão ou outra forma.
- **RN-04:** dado de cartão não passa pela nossa API; o `RejectsRawCardFieldsTrait` é proteção.
- **RN-05:** no tablet, cartão digitado na hora, e nada dele persiste.
- **Decisão pendente 4 da spec:** o coletor é o do `delivery-client`, e o cartão só aparece com o canal do provedor suportado habilitado.

### Referência de design

- **A lista e o CTA**, pelo canvas: "Cartão de crédito" (celular) ou "Crédito" (tablet), com `credit_card` e o apoio "digitar cartão" (01). Com o cartão marcado, o CTA é "Pagar {R$}" com `lock` (o `ctaFor` do protótipo interativo `Conta · celular · pagar pelo app`).
- **O formulário do cartão não está desenhado** no canvas da mesa. A fonte é o `AddCardForm.tsx` do client:
  - os campos seguros "Número do cartão" (`•••• •••• •••• ••••`), "Validade" (`MM/AA`) e "CVV" (`123`);
  - "Nome impresso no cartão" e "CPF do titular";
  - a nota com `lock`, "Os dados vão direto para o processador de pagamento. O restaurante não vê o número do seu cartão." (`AddCardForm.tsx:9-12` @ `ceed49a9`).

  Sai a caixa "Guardar este cartão…" (`:14`), que é cartão salvo.
- **A espera do cartão não está desenhada.** É um estado curto: o cartão costuma voltar em segundos, sem contagem e sem QR.

### Inventário do `delivery-client` @ `ceed49a9` (`src/components/checkout/payment/`)

| Caminho | Decisão | Motivo |
|---|---|---|
| `collectors/collector-types.ts` | adapta | Saem `CvvField`, `tokenizeStoredCardCvv` e os tipos `StoredCardCvv*` (`:47-67`, `:90-91`): sem isso, todo coletor teria de implementar cartão salvo |
| `collectors/collector-map.ts` | porta | Busca por `${channel}:${provider}`, e só `card:mercadopago` existe (`:5-15`) |
| `collectors/SecureField.tsx` | porta | O hospedeiro do iframe, com altura fixa em px (`:49-70`) e `inert` desabilitado (`:76-78`). Usa `FieldShell`, `ERROR_ICON` e `FieldIcon` de `src/components/ui/Field.tsx` e o `inputMetrics`, já vendorados |
| `collectors/mercadopago/mercadopago-card-collector.ts` | adapta | Sai `tokenizeStoredCardCvv` (`:73-89`) e a entrada `CvvField` |
| `collectors/mercadopago/MercadoPagoCardCollector.tsx`, `use-mercadopago-sdk.ts`, `field-container-id.ts`, `read-field-style.ts`, `mercadopago-errors.ts` | portam | O reporte de rejeição do `mercadopago-errors.ts:77-90` passa pelo `/api/log` da #38, com os campos que a rota aceita, e sem dado do cartão |
| `collectors/mercadopago/MercadoPagoStoredCardCvvField.tsx` | descarta | CVV de cartão salvo |
| `src/types/mercadopago.ts` | porta | Sai `MercadoPagoStoredCardTokenInput` (`:52-56`) |
| `AddCardForm.tsx`, `use-add-card-form.ts`, `CardFieldPair.tsx`, `CardFailureAlert.tsx` | adaptam / portam | Sai o `saveChoice`. O `CardFieldName` vem de `services/cards.ts` e passa a morar ao lado do formulário |
| `card-failure.ts` | adapta | Ficam `denied`, `load_failed`, `offline` e `generic`. Saem os `wallet_*` e o `not_supported`. **É falha de tokenização, e não recusa de cobrança** (medido pela #1763) |
| `src/helpers/cpf.ts`, `src/helpers/cpfValidation.ts`, `src/helpers/masked-input.ts` | portam | `CPF_MASK` e `isCpfValid`, que o formulário usa |
| `account/cards/AddCardFlow.tsx` | adapta a ideia | Fica a sequência capacidade → coletor (`:81-88`), a mutação de `collect` (`:116-136`), o remonte dos campos no `denied` por `fieldsKey` (`:185-188`) e o retry de carga (`:198-207`). Saem o `useWhoami` (`:72`, `:212`, `:270`), o `storeCardInWallet` e a carteira |
| `AddCardScreen.tsx`, `app/checkout/cartao/page.tsx`, `services/cards.ts`, `types/card.ts`, `SavedCard*`, `StoredCard*`, `stored-card-*`, `use-stored-card-cvv.ts`, `CardWalletPendingNote.tsx` | descartam | Rota de checkout, cartão salvo e carteira do cliente. Do `AddCardScreen.tsx:16-32` fica a lição das armadilhas |

### Decisões

1. **O passo do cartão é um passo antes da cobrança.**
   - Com o cartão marcado, o CTA do formulário é "Pagar {R$}" (`lock`). Tocar abre o passo do cartão no `PaymentStepHost`: página no celular, tela cheia no tablet em pé, painel no deitado.
   - O passo tem os campos e o próprio CTA "Pagar {R$}".
   - O estado do passo (`step: 'form' | 'card'`) vai para o `BoardPaymentProvider` da 01, ao lado da forma e do valor. Ele não é tentativa: ainda não há cobrança.
2. **A ordem do toque no passo:**
   1. valida os campos (`useAddCardForm`);
   2. tokeniza (`collect`), com o botão em `loading`;
   3. chama `start({ channel: 'card', instrument: { kind: 'card', channel: 'card', token, brand } })` da 03, que faz o nome, a releitura do saldo e o `POST`.

   Se o `start` parar porque o saldo mudou (03, decisão 3), o token é descartado, e o próximo toque tokeniza de novo. **Token é de uso único**, e nenhuma tentativa reaproveita token de outra.
3. **A chave de idempotência inclui o token.** O conteúdo da tentativa (03, decisão 2) ganha o token. Um retry de rede da mesma tentativa reusa chave **e** token, e é o caso em que a cobrança pode ter nascido. Uma tentativa nova tem token novo e chave nova.
4. **`resolveCollector` decide se o cartão é pagável.** `payment-methods.ts` (01) troca a lista fixa de provedores pelo `resolveCollector('card', provider) !== null`. Cartão de provedor sem coletor continua desabilitado (`no_collector`).
5. **A espera do cartão.** Depois do 201, o passo vira "Processando o pagamento…", com o `PixSpinner` da 03, sem contagem, e com "Trocar forma de pagamento" (o cancelamento da 03). Os desfechos são os da 03:
   - `paid` dá a confirmação, com "Recebemos o seu pagamento." no lugar de "Recebemos o seu Pix.", e "Forma: Crédito";
   - `refused` dá o `ChargeRefused`, com a frase do `refusal_reason` e as ações "Tentar outro cartão" (volta ao passo do cartão, limpo) e "Escolher outra forma".
6. **Bandeira e últimos dígitos não aparecem**, nem no celular. A confirmação diz "Crédito", e a bandeira só vai no corpo da cobrança. No tablet, mostrar "Visa •••• 4821" é dado da pessoa que acabou de pagar na tela da mesa (RN-05), e a regra fica uma só para os dois formatos.
7. **Nada do cartão sobra.** Ao fechar o passo, ao encerrar a tentativa ou ao trocar de forma, os iframes desmontam e o nome e o CPF saem do estado. O token só vive na tentativa, em memória, e nunca vai para o cache do React Query, para storage ou para log. A instância do SDK fica no `Map` de módulo e na query `['mercadopago-sdk', env, key]` do client, e nenhuma das duas guarda dado de cartão.
8. **A falha de tokenização tem copy própria**, pelo `card-failure.ts` adaptado. Ela aparece no `CardFailureAlert`, acima do CTA do passo, e não é recusa de cobrança: nenhuma cobrança nasceu.
   - **`denied`:** remonta os campos (`fieldsKey`), e o erro "Não foi possível validar este cartão" fica no campo do número.
   - **`load_failed`** (o SDK não carregou): "Tentar de novo" recarrega o script.
9. **O SDK do provedor no tablet compartilhado.** O SDK do Mercado Pago pode guardar a impressão digital do aparelho para antifraude. Isso é do provedor, e não do app, e fica registrado aqui. O app não guarda nada.

### Copy

| Onde | Texto | Fonte |
|---|---|---|
| CTA | "Pagar {R$}" com `lock` | protótipo interativo do celular |
| Título do passo | "Cartão de crédito" | **derivada** |
| Campos | "Número do cartão" (`•••• •••• •••• ••••`) · "Validade" (`MM/AA`) · "CVV" (`123`) · "Nome impresso no cartão" · "CPF do titular" | `MercadoPagoCardCollector.tsx:23-32` e `AddCardForm.tsx:9-10` @ `ceed49a9` |
| Nota | "Os dados vão direto para o processador de pagamento. A loja não vê o número do seu cartão." | `AddCardForm.tsx:12` @ `ceed49a9`, com "a loja" no lugar de "o restaurante" |
| Nota no tablet | a de cima, mais "Nada do cartão fica salvo neste tablet." | **derivada** |
| Espera | "Processando o pagamento…" | **derivada** |
| Falha de tokenização | `denied`: "Não conseguimos validar o cartão" · "Confira os dados ou use outra forma de pagamento — nada foi cobrado." · `load_failed`: "Não foi possível carregar o formulário do cartão" · "Confira a internet e tente de novo." · `offline` e `generic`: as do client | `card-failure.ts:8-31` e `services/cards.ts:195-242` @ `ceed49a9` |
| Confirmação | "Recebemos o seu pagamento." · "Forma: Crédito" | **derivada** da confirmação do Pix |
| Recusa | as frases do `refusal_reason` (03); ações "Tentar outro cartão" e "Escolher outra forma" | ações **derivadas** |

### Armadilhas

- **Os iframes do Mercado Pago entram no histórico do navegador.** Fechar o passo com `history.back()` volta para dentro do iframe. Navegar sempre por rota declarada com `router.replace`/`router.push` (`AddCardScreen.tsx:16-32` @ `ceed49a9`).
- **Token de uso único.** Repetir a cobrança com o token de uma recusa é recusa garantida, e misturar token novo com a chave antiga dá 422 `idempotency_key_payload_mismatch`.
- **`SecureField` tem altura fixa em px**, porque o iframe não mede o conteúdo. Cada tamanho do formulário precisa caber nos três lugares, inclusive o `Overlay` de 540.
- **CPF é dado pessoal, digitado no tablet.** Ele vai só ao SDK do provedor, e sai do estado ao fechar (decisão 7). Não vai para o `/api/log` nem para a `delivery-api`.
- **A aba de rede é a prova da RN-04.** O critério de aceite da spec é observável: o corpo de `POST /charges` não tem número, validade nem CVV, e as chamadas com esses dados vão para domínio do provedor.
- **O script de terceiro não carrega offline**, e um `load_failed` com a rede caída é offline, não erro do provedor. O `offline` do `classifyCardTokenRejection` já separa os dois (`mercadopago-errors.ts:61-75`).

## Mudanças

### 1. O coletor

`src/components/board-payment/card/collectors/` (novos): `collector-types.ts` (adaptado), `collector-map.ts`, `SecureField.tsx` e `mercadopago/` (`MercadoPagoCardCollector.tsx`, `mercadopago-card-collector.ts`, `use-mercadopago-sdk.ts`, `field-container-id.ts`, `read-field-style.ts`, `mercadopago-errors.ts`), pelo inventário. Mais `src/types/mercadopago.ts` (novo).

### 2. O formulário

`src/components/board-payment/card/` (novos):

- `CardPaymentForm.tsx`: os campos seguros, o nome e o CPF, sem `saveChoice`;
- `use-card-payment-form.ts`: o `use-add-card-form.ts` portado;
- `CardFieldPair.tsx` e `CardFailureAlert.tsx`;
- `card-failure.ts`: a decisão 8;
- `CardPaymentStep.tsx`: o passo inteiro (título, formulário, nota, alerta e CTA), com a sequência da decisão 2;
- `CardProcessing.tsx`: a espera da decisão 5.

`src/helpers/cpf.ts`, `src/helpers/cpfValidation.ts` e `src/helpers/masked-input.ts` (novos): portam.

### 3. Ligação à máquina da 03

- `src/components/board-payment/cta/payment-cta.ts` (alterado): `+ card` → "Pagar {R$}", `lock`, abre o passo.
- `src/providers/board-payment/BoardPaymentProvider.tsx` (alterado): `+ step` e `openCardStep()`/`closeCardStep()`.
- `src/components/board-payment/steps/PaymentStepHost.tsx` (alterado): sem tentativa e com `step === 'card'`, monta o `CardPaymentStep`. Com tentativa de cartão pendente, o `CardProcessing`.
- `src/providers/board-charge/charge-idempotency.ts` (alterado): o token no conteúdo da tentativa (decisão 3).
- `src/components/board-payment/outcome/outcome-copy.ts` (alterado): a frase da confirmação por canal, e as ações da recusa do cartão.
- `src/components/board-payment/options/payment-methods.ts` (alterado): `resolveCollector` no lugar da lista fixa (decisão 4).

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen` e `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui.
4. `grep -rn "localStorage\|sessionStorage" src/components/board-payment/card` não encontra nada.
5. `grep -rn "StoredCard\|saveChoice\|storeCardInWallet\|useWhoami" src` não encontra nada.

**No navegador.** A base tem a 03, uma movimentação aberta e uma conta de teste do Mercado Pago em sandbox, com o `public_key` de teste no `payment-options`. Enquanto a #1635 não sobe, o `payment-options` vem pelo "Override content", com `{ channel: "card", provider: "mercadopago", environment: "sandbox", homologated: true, public_key: "TEST-…" }`. A tokenização é de verdade: o SDK fala com o Mercado Pago, e não com a `delivery-api`.

1. **390 × 844.** Marcar "Cartão de crédito" e tocar "Pagar R$ 95,43". **Observar:** o passo com os três campos seguros, o nome, o CPF e a nota com `lock`.
2. **Cartão de teste aprovado** do Mercado Pago (o da documentação de sandbox), nome e CPF válidos. Tocar "Pagar". **Observar**, na aba de rede:
   - uma chamada ao domínio do Mercado Pago (tokenização);
   - **um** `POST /charges` com `instrument: { kind: "card", channel: "card", token, brand }`;
   - nenhum campo com número, validade ou CVV no corpo.
3. **O 201** vem pelo override, e o `GET`, trocado para `paid`. **Observar:** "Processando o pagamento…" e depois a confirmação com "Forma: Crédito", sem bandeira.
4. **Recusa.** `GET` com `refused` e `declined`. **Observar:** "O banco recusou o pagamento", "Tentar outro cartão" e "Escolher outra forma". "Tentar outro cartão" reabre o passo com os campos vazios. Pagar de novo faz uma tokenização **nova** e um `POST` com chave nova.
5. **CPF inválido.** **Observar:** o erro no campo, e nenhuma chamada ao Mercado Pago.
6. **Falha de carga.** Bloquear `sdk.mercadopago.com`. **Observar:** "Não foi possível carregar o formulário do cartão" com "Tentar de novo". Desbloquear e tentar: os campos aparecem.
7. **Tablet em pé, 820 × 1180, e deitado, 1180 × 820.** **Observar:** o passo em tela cheia e no painel de 540, com os campos inteiros, sem corte. O nome de quem paga é pedido antes do `POST` (03).
8. **Nada sobra.** Fechar o passo no meio do preenchimento e abrir de novo. **Observar:** os campos e o CPF vazios. Em Application, nada em Local Storage nem em Session Storage, e o cache do React Query (DevTools) sem token.
9. **Provedor sem coletor.** Override com `provider: "pagseguro"` no canal `card`. **Observar:** "Crédito" desabilitado com "Indisponível no momento".
10. **Voltar do navegador** no passo do cartão volta para a conta, e não para dentro do iframe.

## Critérios de aceitação

- [ ] O corpo de `POST /charges` do cartão é `{ amount, split_mode, person, instrument: { kind: "card", channel: "card", token, brand? } }`, e nenhum número, validade ou CVV sai para a `delivery-api` (aba de rede).
- [ ] O token é tokenizado pelo SDK do provedor com o `public_key` do canal, e cada tentativa de cobrança tem token novo e chave nova. O retry de rede da mesma tentativa reusa os dois.
- [ ] O coletor portado não tem `CvvField`, `tokenizeStoredCardCvv`, `saveChoice` nem nada de cartão salvo.
- [ ] O cartão de provedor sem coletor aparece desabilitado na lista, pelo `resolveCollector`.
- [ ] A falha de tokenização mostra a copy do `card-failure.ts`, e a recusa da cobrança, a do `refusal_reason`, com "Tentar outro cartão" e "Escolher outra forma".
- [ ] A confirmação diz "Crédito" sem bandeira nem últimos dígitos.
- [ ] Fechar o passo ou encerrar a tentativa limpa os campos, o nome e o CPF, e nada do cartão fica em storage, cache ou log.
- [ ] Sem hex e sem arquivo alterado em `src/theme/`, `src/components/ui/` ou `src/fonts/`.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **Cartão salvo**, CVV de cartão salvo e carteira do cliente: dependem de login (spec, "Fora do escopo").
- **Outros provedores de cartão** (PagSeguro, InfinitePay, Pagar.me, Stone): o client só tem o coletor do Mercado Pago. Coletor novo é frente própria, no client primeiro.
- **Parcelamento:** nem o contrato nem o coletor têm parcelas.
- **3DS ou desafio do emissor:** o contrato não prevê. Se o conector devolver `redirect_url` para cartão, é achado para a 05 e para a api.
- **Google Pay**, que cobra como cartão: 05.
- **A retomada depois do reload:** 06. Um cartão em "processando" depois do reload segue o caminho da 06, sem o token, que não é guardado.

## Branch

`task/64-board-card-charge-collector`, base sugerida: `task/63-board-pix-charge-wait` (ou `feat/indoor-v2`, se a 03 já tiver mergeado). Corre em paralelo com a 06.
