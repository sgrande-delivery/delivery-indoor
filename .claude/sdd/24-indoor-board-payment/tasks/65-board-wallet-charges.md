# 05 — Carteiras (Google Pay e NuPay), com o caminho por QR no tablet

**Issue:** [#65](https://github.com/sgrande-delivery/delivery-indoor/issues/65)
**Feature:** [Pagamento da conta da mesa pelo app](../spec.md) — issue #24
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 03 ([#63](https://github.com/sgrande-delivery/delivery-indoor/issues/63)), 04 ([#64](https://github.com/sgrande-delivery/delivery-indoor/issues/64))
**Status:** pendente — **com uma parte parada por divergência**: o Google Pay no tablet (decisão pendente 8 da spec). O `/execute` para nesse ponto e pergunta ao dev.

## Objetivo

Google Pay e NuPay como formas de pagamento, pela máquina da 03.

- **NuPay:** cria a cobrança e segue pelo `redirect_url`. No celular o botão abre o NuPay, que leva ao app do Nubank. No tablet compartilhado o `redirect_url` vira um QR, que a pessoa lê com o próprio celular.
- **Google Pay:** no celular, usa a folha de pagamento do Google com o botão oficial, e o token vai na cobrança, que a api cobra como cartão.

A saída da espera, a confirmação, a recusa e o cancelamento são os da 03. O Google Pay no tablet não tem caminho no contrato: essa parte fica registrada e parada.

## Contexto

### Estado atual (depois da 03 e da 04)

- A máquina da cobrança (`src/providers/board-charge/`), o `PaymentStepHost`, os desfechos e o registro de CTA por forma vêm da 03. O passo antes da cobrança (`step` no `BoardPaymentProvider`) vem da 04.
- A 03 mostra "Gerando o seu Pix…" enquanto o 201 não trouxe o `pix`, com a leitura de teto em 2, 4, 8 e 16 s (03, decisão 7). Esta task generaliza esse "falta o dado" para o `redirect_url`.
- A lista da 01 já desabilita o Google Pay sem `google_pay` ou com `pending` não vazio (`googlepay_pending`), e mostra o NuPay com os apoios do canvas.
- **O `delivery-client` não tem código de nenhuma das duas carteiras.** Há só o desenho, nas tasks pendentes de lá: `.claude/sdd/325-checkout-online-payment/tasks/363-google-pay-button.md` e `362-nupay-collector.md` @ `ceed49a9`. As regras de lá que valem aqui estão nas decisões.
- **O QR do NuPay não vem pronto.** O Pix chega com `qr_code_base64` montado pela api; o `redirect_url` é uma URL, e o QR dela é desenhado no navegador. Não há gerador de QR no repo.

### Contrato

Da [delivery-api#1638](https://github.com/sgrande-delivery/delivery-api/issues/1638), sobre a criação da [#1636](https://github.com/sgrande-delivery/delivery-api/issues/1636). **Não existe ainda.**

```
POST /api/client/boardMovements/{id}/charges
  body (carteira): { amount, split_mode, person,
                     instrument: { kind: "wallet", channel: "wallet_nupay" | "wallet_googlepay", token? } }
  → 201 { id, status, amount, expires_at, refusal_reason, amount_pending, redirect_url?, cancel_token }
        redirect_url: o que a carteira precisa para concluir no aparelho de quem paga;
        pode chegar só com o payment.charge_created, e aí o app o lê no GET
  instrument.kind = "wallet_googlepay"  → 422 (é canal, não instrumento)
  canal não habilitado                  → 422, internal_code próprio
```

O canal do Google Pay em `payment-options` (01), medido no `PaymentCapabilitiesPresenter` e no `GooglePayChannelResolver` de `origin/master`:

```
{ channel: "wallet_googlepay", provider: "mercadopago", environment: "sandbox" | "production",
  homologated, public_key,
  google_pay: { gateway, gateway_merchant_id, merchant_id, allowed_card_networks: string[],
                pending: ("gateway_not_homologated" | "checklist_not_approved")[] } }
```

A recusa `not_authorized` (#1763) é a do pagador que recusou, ou não concluiu, a autorização na carteira. A frase já está na 03.

### Divergências medidas

**1. Google Pay no tablet — parado** (decisão pendente 8 da spec).

- A RF-12 pede que, no tablet compartilhado, as carteiras abram "por QR no celular de quem paga", e o canvas desenha o Google Pay com "abre por QR no seu celular".
- A #1638 devolve `redirect_url` só para a carteira de redirecionamento (NuPay, PicPay).
- O Google Pay tokeniza no navegador de quem paga (`loadPaymentData`) e cobra como `card` pela conta do gateway (`PaymentChannelEnum::instrument()`: `WALLET_GOOGLEPAY => CARD`).

Não existe URL que o tablet possa mostrar em QR para o celular concluir o Google Pay. As saídas são decisão do dev, e esta task não escolhe nenhuma:

- tirar o Google Pay do tablet (o canvas o desenha);
- ou especificar na api um caminho de passagem da cobrança para o celular. Esse caminho esbarra na RN-02 da delivery-api#1753, porque a credencial da mesa não pode sair só do UUID.

**2. O `instrument.kind` do Google Pay.** O corpo de carteira da #1638 escreve `kind: "wallet"`. O enum de `origin/master` resolve `wallet_googlepay` para o instrumento `card`, e o teste da #1638 diz que "`wallet_googlepay` como canal cobra como `card`".

- **Contrato escrito é contrato para implementar:** esta task manda `{ kind: "wallet", channel: "wallet_googlepay", token }`, como a #1638 escreve.
- A confirmação vai no relatório, para a execução da #1638. Se lá a api fixar `card`, a troca é uma linha, em `googlePayInstrument()` (mudança 3).

### Requisitos cobertos

- **RF-12:** carteiras no celular abrem o fluxo da carteira, e no tablet abrem por QR no celular de quem paga. Vale para o NuPay; o Google Pay no tablet está parado.
- **RN-05:** o tablet não tem a carteira de ninguém. O QR leva o pagamento para o celular da pessoa, e nada da carteira passa pelo tablet.
- **RN-08:** o retorno do NuPay não decide nada; só o estado da cobrança.

### Referência de design

- **Lista** (01): Google Pay com `account_balance_wallet`, e apoio "Cartões salvos na sua conta Google" no celular. NuPay com `account_balance`, e "Pague direto pelo app do Nubank" no celular e "abre por QR no seu celular" no tablet.
- **CTA** (protótipo interativo do celular): Google Pay é "Pagar com Google Pay" sobre `ink`, e NuPay é "Pagar com NuPay" sobre `#820AD1`.
  - **O Google Pay usa o botão oficial** (`createButton` da PayButton API). O botão desenhado não serve: botão fora do padrão reprova o checklist de integração do Google, sem o qual não sai o acesso de produção (`363-google-pay-button.md:11` @ `ceed49a9`).
  - **O roxo do NuPay é hex de marca de terceiro**, sem token no design system. O CTA do NuPay é o primário da loja, com `account_balance`.
- **A espera do NuPay não está desenhada.**
  - No celular, ela segue o cartão de espera do Pix (`Conta · celular · Pix gerado`), sem QR e sem passos de copia e cola.
  - No tablet, ela segue o Pix do tablet (`Pagamento · tablet em pé · Pix gerado` e o painel do deitado), com o QR do `redirect_url` no lugar do QR do Pix.

### Decisões

1. **NuPay: criação e espera.**
   - O CTA "Pagar com NuPay" chama `start({ channel: 'wallet_nupay', instrument: { kind: 'wallet', channel: 'wallet_nupay' } })` da 03, sem passo antes.
   - Depois do 201, o dado que falta é o `redirect_url`. O "falta o dado" da 03 passa a ser por canal: `pix` precisa de `pix.copy_paste`, e `wallet_nupay`, de `redirect_url`. A leitura com teto e o "Tentar de novo" são os mesmos.
2. **NuPay no celular: o botão abre o NuPay numa aba nova.** Com o `redirect_url`, a espera mostra "Continuar no NuPay", um `Button` `component="a"` com `href={redirect_url}`, `target="_blank"` e `rel="noopener noreferrer"`.
   - É um toque da pessoa, então nenhum bloqueador de popup barra.
   - A aba do app continua aberta, e ao voltar o foco a query da cobrança relê (03, decisão 8).
   - **Não usar `window.location.assign`**: sair da página perderia a tentativa em memória, e a retomada depois do reload é da 06.
   - O `redirect_url` é aberto como veio, sem ler nem acrescentar parâmetro.
3. **NuPay no tablet: o QR do `redirect_url`.** A espera do tablet mostra o QR gerado no navegador, com "Aponte a câmera do seu celular" e "O NuPay abre no seu celular para você autorizar o pagamento." (**derivada**).
   - Não há botão de abrir: o tablet não é de ninguém.
   - O gerador é a dependência nova `qrcode` (MIT, sem dependência nativa), com `@types/qrcode` em dev, e a saída é SVG em string (`QRCode.toString(url, { type: 'svg', margin: 1 })`), na moldura branca do `PixQrCard` (03).
   - Não se usa `<canvas>`, para o QR escalar sem borrão no QR de 420.
4. **O retorno do NuPay não decide nada.** O NuPay pode devolver um `approvalCode` na URL de retorno (`362-nupay-collector.md:15-19` @ `ceed49a9`). Se a pessoa voltar ao app por uma URL com parâmetro, o app não o lê nem o envia: quem decide é o estado da cobrança (RN-08).
5. **Google Pay no celular: o botão oficial, depois do `isReadyToPay`.** No molde do desenho 363 do client:
   - `use-google-pay.ts` carrega `https://pay.google.com/gp/p/js/pay.js` sob demanda e monta o `PaymentsClient`, com `environment` `TEST` para `sandbox` e `PRODUCTION` para `production`;
   - a opção **só aparece** depois de o `isReadyToPay()` responder `true`. Aparelho sem Google Pay não vê a linha, sem placeholder e sem pisca-pisca. É a regra do checklist do Google, e ela vence a "lista exata" da spec, que fica registrada para o dev;
   - com o Google Pay marcado, o CTA do rodapé é o `createButton` do Google (`buttonType: 'pay'`, `buttonSizeMode: 'fill'`, `buttonLocale: 'pt'`, a cor pelo esquema de cor), sem `styled()` por cima.
6. **A ordem do toque no Google Pay**, porque a folha do Google precisa abrir dentro do gesto:
   1. a validação do valor (02). `ok: false` marca o erro e não abre a folha;
   2. o nome: sem nome de quem paga no celular, o rodapé mostra antes o "Continuar" da 03, que abre o diálogo do nome. Só com o nome resolvido o botão do Google aparece, e o toque nele abre a folha **na hora**, sem `await` antes;
   3. o `loadPaymentData`, com o `PaymentDataRequest` da mudança 3;
   4. com o token, `start({ channel: 'wallet_googlepay', instrument: googlePayInstrument(token) })`. Ele relê o saldo; se o valor mudou, o token é descartado e a tela avisa, como na 03. O token do Google é de uso único.

   O cancelamento da folha pela pessoa (`statusCode: 'CANCELED'`) volta ao formulário sem erro. As outras falhas da folha mostram o toast "Não foi possível abrir o Google Pay. Tente de novo ou escolha outra forma." (**derivada**).
7. **O valor para o Google é texto decimal, montado com inteiros.** O `transactionInfo.totalPrice` do Google é "95.43". `googlePayPrice(cents)` monta com `Math.floor(cents / 100)` e `cents % 100`, sem `float`. É formatação para um terceiro, ao lado do `formatCents`, e não uma segunda unidade no app.
8. **A espera do Google Pay é a do cartão** (04, "Processando o pagamento…"). A confirmação diz "Forma: Google Pay". A recusa usa as frases da 03, com "Escolher outra forma".
9. **Google Pay no tablet: parado** (Divergência 1). Esta task não implementa nenhum caminho para o Google Pay no shell de tablet. Até a decisão do dev, a execução para aqui e pergunta. O que já está no repo continua igual: a lista da 01 mostra a opção pelo que o servidor manda, e a 03 não registra CTA para ela.
10. **Nada da carteira persiste.** O token do Google, o `redirect_url` e o QR ficam só na tentativa e no cache da cobrança, que a 03 remove ao encerrar. O SDK do Google é do Google.

### Copy

| Onde | Texto | Fonte |
|---|---|---|
| CTA NuPay | "Pagar com NuPay" (`account_balance`) | protótipo interativo; a cor é a primária (Referência de design) |
| CTA Google Pay | o botão oficial do Google, em português | regra do checklist do Google |
| Espera NuPay, celular | "Pagar com NuPay" · "{loja} · Mesa {n}" · "Valor" · "Aguardando autorização no app do Nubank…" · "A conta da mesa atualiza sozinha quando o pagamento cair." · "Continuar no NuPay" · "Trocar forma de pagamento" | **derivada** da espera do Pix |
| Espera NuPay, tablet | "Mesa {n} · NuPay" · "Aponte a câmera do seu celular" · "O NuPay abre no seu celular para você autorizar o pagamento." · "Aguardando autorização…" · "Trocar forma de pagamento" | **derivada** |
| Sem `redirect_url` ainda | "Preparando o NuPay…" / "Não conseguimos abrir o NuPay." · "Tentar de novo" | **derivada** |
| Falha da folha do Google | toast "Não foi possível abrir o Google Pay. Tente de novo ou escolha outra forma." | **derivada** |
| Confirmação | "Recebemos o seu pagamento." · "Forma: NuPay" / "Forma: Google Pay" | **derivada** |

### Armadilhas

- **Google Pay exige contexto seguro.** O `pay.js` não funciona em `http://` de rede local. Testar em `localhost` ou em HTTPS, e não pelo IP do dev server no tablet.
- **`await` antes do `loadPaymentData` quebra o gesto**, e a folha do Google não abre (ou abre como popup bloqueado). Tudo o que é assíncrono vem antes do toque, ou depois do token.
- **Canal não é instrumento** (`CLAUDE.md` da api, "Pagamento por conectores"): `wallet_googlepay` vai em `channel`, e nunca em `kind` (a api responde 422).
- **O `redirect_url` é URL de pagamento de terceiro.** Ele vai para o `href` e para o QR, e nada mais: nem log, nem `/api/log`, nem storage.
- **Duas dependências de terceiro no bundle** (`pay.js` sob demanda e o `qrcode`). O `qrcode` entra só no componente do QR do NuPay, por `import()` dinâmico, para não pesar no cardápio.
- **O `isReadyToPay` é assíncrono**, e a lista da 01 não pode piscar a linha. A linha do Google Pay entra quando a resposta chega, e a seleção inicial (01, decisão 9) não pode ter sido o Google Pay antes disso.

## Mudanças

### 1. Dependência

`package.json` (alterado): `+ qrcode`, `+ @types/qrcode` (dev). É a única dependência nova da frente.

### 2. NuPay

`src/components/board-payment/wallet/nupay/` (novos):

- `NuPayWaitingPhone.tsx`: a decisão 2;
- `NuPayWaitingTablet.tsx`: as duas variantes do tablet (tela cheia em pé, painel deitado), com a decisão 3;
- `RedirectQrCode.tsx`: o QR em SVG do `redirect_url`, na moldura do `PixQrCard`, por `import('qrcode')`.

Ligações:

- `src/components/board-payment/cta/payment-cta.ts` (alterado): `+ wallet_nupay` → "Pagar com NuPay", `account_balance`, `start` direto;
- `src/providers/board-charge/charge-attempt.ts` (alterado): o "falta o dado" por canal (decisão 1);
- `src/components/board-payment/steps/PaymentStepHost.tsx` (alterado): a espera do NuPay por formato.

### 3. Google Pay

`src/components/board-payment/wallet/googlepay/` (novos):

- `use-google-pay.ts`: o loader do `pay.js`, o `PaymentsClient` por ambiente e o `isReadyToPay` (decisão 5);
- `google-pay-request.ts` (puro): o `PaymentDataRequest`, `googlePayPrice(cents)` (decisão 7) e `googlePayInstrument(token)`:

  ```ts
  // apiVersion 2 / minor 0; um método CARD:
  //   parameters: { allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'], allowedCardNetworks: google_pay.allowed_card_networks }
  //   tokenizationSpecification: { type: 'PAYMENT_GATEWAY',
  //     parameters: { gateway: google_pay.gateway, gatewayMerchantId: google_pay.gateway_merchant_id } }
  // merchantInfo: { merchantId: google_pay.merchant_id, merchantName: <nome da loja de useRestaurant()> }
  // transactionInfo: { totalPriceStatus: 'FINAL', totalPrice: googlePayPrice(amount), currencyCode: 'BRL', countryCode: 'BR' }
  export function googlePayInstrument(token: string): ChargeInstrument; // { kind: 'wallet', channel: 'wallet_googlepay', token } — Divergência 2
  ```

  O `token` é `paymentData.paymentMethodData.tokenizationData.token`, passado como veio.
- `GooglePayButton.tsx`: o `createButton` montado num contêiner, sem `styled()` sobre o botão;
- `src/types/google-pay.ts` (novo): os tipos mínimos do `google.payments.api` que o app usa.

Ligações:

- `src/components/board-payment/cta/payment-cta.ts` (alterado): `+ wallet_googlepay` → o `GooglePayButton` no lugar do CTA, só fora do shell de tablet;
- `src/components/board-payment/options/payment-methods.ts` (alterado): a linha do Google Pay só com `isReadyToPay` verdadeiro;
- `src/components/board-payment/outcome/outcome-copy.ts` (alterado): a forma por canal.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen` e `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui, e o `qrcode` não entra no chunk da home (`.next/static/chunks`: o pacote aparece só no chunk dinâmico).
4. `grep -rn "approvalCode\|window.location.assign" src/components/board-payment` não encontra nada.
5. `grep -rn "kind: 'wallet_" src` não encontra nada.

**No navegador**, com a base da 04 e as fixtures pelo "Override content" (a api ainda não tem as rotas). A fixture de `payment-options` é a A da 01, com o NuPay em `homologated: true` e o Google Pay com `google_pay` de sandbox e `pending: []`.

1. **NuPay, 390 × 844.** Marcar NuPay e tocar "Pagar com NuPay". **Observar:** um `POST` com `instrument: { kind: "wallet", channel: "wallet_nupay" }`. Com o 201 sem `redirect_url`: "Preparando o NuPay…" e as leituras de teto. Com o `GET` trazendo `redirect_url: "https://example.org/nupay/checkout?x=1"`: "Continuar no NuPay" abre a URL numa aba nova, e a aba do app fica.
2. **Volta do NuPay.** Trocar o `GET` para `paid` e voltar o foco à aba do app. **Observar:** a releitura e a confirmação com "Forma: NuPay". Com `refused`/`not_authorized`: "O pagamento não foi autorizado".
3. **NuPay no tablet, 820 × 1180 e 1180 × 820.** **Observar:** o QR do `redirect_url` (ler com um celular de verdade: a URL abre), sem botão de abrir, e "Trocar forma de pagamento" cancela pela 03.
4. **Google Pay, `localhost`, Chrome com Google Pay de teste**, 390 × 844. **Observar:**
   - a linha do Google Pay aparece só depois do `isReadyToPay`;
   - marcada, o botão oficial no rodapé;
   - tocar abre a folha do Google na hora;
   - com o cartão de teste, um `POST` com `instrument: { kind: "wallet", channel: "wallet_googlepay", token }` e `amount` igual ao da folha (R$ 95,43 na folha e `9543` no corpo).
5. **Folha cancelada.** Fechar a folha. **Observar:** a volta ao formulário, sem toast e sem `POST`.
6. **Sem suporte.** Num navegador sem Google Pay (Firefox, ou Safari no iOS). **Observar:** a linha não aparece, sem pisca.
7. **Google Pay `pending`.** Override com `pending: ["checklist_not_approved"]`. **Observar:** a linha desabilitada, pela 01.
8. **Nada sobra.** Depois de qualquer desfecho, Application sem o `redirect_url` nem o token em storage, e o cache sem a cobrança encerrada.

## Critérios de aceitação

- [ ] NuPay cria a cobrança com `{ kind: "wallet", channel: "wallet_nupay" }` e espera o `redirect_url` com a leitura de teto da 03 quando ele não vem no 201.
- [ ] No celular, "Continuar no NuPay" abre o `redirect_url` numa aba nova, por toque da pessoa, e a tela sai da espera só pelo estado da cobrança.
- [ ] No tablet, o `redirect_url` vira um QR em SVG, sem botão de abrir.
- [ ] O app não lê nem envia parâmetro de retorno do NuPay.
- [ ] O Google Pay aparece só depois do `isReadyToPay`, usa o botão oficial sem restilo, monta o `PaymentDataRequest` com o `google_pay` do canal e o ambiente pelo `environment`, e manda o token com `channel: "wallet_googlepay"`.
- [ ] O `totalPrice` do Google sai de `googlePayPrice`, sem `float`, e bate com o `amount` do corpo.
- [ ] O toque no botão do Google abre a folha sem `await` antes. Folha cancelada volta sem erro.
- [ ] O Google Pay no tablet não tem implementação nesta task, e a decisão do dev está registrada (ou a task parou para pedi-la).
- [ ] A única dependência nova é o `qrcode` (com `@types/qrcode`), carregado por `import()` dinâmico.
- [ ] Sem hex (inclusive o roxo do NuPay) e sem arquivo alterado em `src/theme/`, `src/components/ui/` ou `src/fonts/`.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **Google Pay no tablet:** parado (Divergência 1), à espera do dev.
- **`wallet_picpay` e `wallet_mercadopago`:** decisão pendente 7 da spec. A espera de redirecionamento desta task serviria a eles, mas a lista não os mostra.
- **O `sg-googlepay-connector`:** obsoleto do lado da api (#1638, "Fora de escopo"). O Google Pay liquida pelo gateway.
- **Fixar o `instrument.kind` do Google Pay na api:** é da execução da #1638 (Divergência 2).
- **A retomada depois do reload:** 06. Uma carteira pendente retomada não tem o token do Google, que não é guardado, e não precisa: a cobrança já existe.

## Branch

`task/65-board-wallet-charges`, base sugerida: `task/64-board-card-charge-collector` (ou `feat/indoor-v2`, se a 04 já tiver mergeado).
