# 03 — Pix: cobrança, copia e cola no celular, QR no tablet, espera, troca de forma e confirmação

**Issue:** [#63](https://github.com/sgrande-delivery/delivery-indoor/issues/63)
**Feature:** [Pagamento da conta da mesa pelo app](../spec.md) — issue #24
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 ([#61](https://github.com/sgrande-delivery/delivery-indoor/issues/61)), 02 ([#62](https://github.com/sgrande-delivery/delivery-indoor/issues/62)); #22 — linha 02 ([#47](https://github.com/sgrande-delivery/delivery-indoor/issues/47), nome de quem pede); #23 — linhas 01 ([#53](https://github.com/sgrande-delivery/delivery-indoor/issues/53)), 06 ([#58](https://github.com/sgrande-delivery/delivery-indoor/issues/58)) e 07 ([#59](https://github.com/sgrande-delivery/delivery-indoor/issues/59))
**Status:** pendente
**Alinhado a #23 (#58, #59, #60) (2026-11-23):** a rota é `/board/payment` (#59); o listener segue o contrato de consumidor do `useBoardSocket()` e relê a conta pela lista única da #58 (decisão 9); o "Chamar garçom" da confirmação é o `ConnectedWaiterCallButton` da #59 com `variant="ghost"`; e a premissa da decisão 10 ("e o garçom foi avisado") foi medida no `delivery-admin`, com o mesmo default do encerramento da #60.

## Objetivo

O caminho de ponta a ponta. O cliente gera o Pix, a tela espera o pagamento e sai da espera sozinha quando a cobrança é aprovada. No celular o copia e cola vem primeiro, e no tablet, o QR. A task cria a máquina da cobrança que o cartão (04) e as carteiras (05) reaproveitam:

- a criação idempotente;
- a tentativa guardada no aparelho, em memória;
- o `board.charge_updated` e o `GET` como rede de segurança.

Ela entrega também os desfechos: confirmação, expiração, recusa e "trocar forma de pagamento", que pede o cancelamento. O que atravessa o reload e as recusas da criação por status são da 06.

## Contexto

### Estado atual (depois da 01 e da 02)

- A tela de pagamento existe em `/board/payment`, com o formulário em três lugares (01, mudanças 6 e 7). O rodapé tem o lugar do CTA (01, mudança 6; 02, mudança 5).
- `useResolvedAmount(options)` entrega `{ amount, split_mode }` ou o erro (02, mudança 2). `resetAmount()` volta a escolha ao inicial.
- `BoardPaymentProvider` guarda a forma e o valor escolhidos (01 e 02). `boardPaymentOptionsQueryKey` e `remainingCents` vêm da 01.
- **O nome de quem pede** é da #47: `usePerson()` (`{ person, needsPerson, setPerson }`) e o `PersonNameDialog` com os modos `first-send` e `change` (#47, mudanças 2 e 3).
- **O socket do `/board`** é da #58. O `SocketStore` fica em module scope, o `BoardRealtime` (montado em `src/App.tsx`) mantém a sala da movimentação em toda rota enquanto a sessão está `ready` e reemite `subscribe_channel` no `connect`, e `useBoardSocket()` (`src/hooks/use-board-socket.ts`) expõe o snapshot `{ socket, isConnected }`. O contrato de consumidor está na decisão 6 da #58. Esta task **não** cria `SocketStore`, não emite `subscribe_channel` e não chama `connect`/`disconnect`.
- **As chaves da conta** são da #53 (`boardMovementQueryKey`, `boardProductsQueryKey`, `boardPaymentsQueryKey`), e a lista delas é a `BOARD_BILL_QUERY_KEYS` da #58 (`src/components/board/realtime/board-bill-keys.ts`), em que a 01 pôs `boardPaymentOptionsQueryKey` no grupo `movement`. `resolveBoardBillQueryKeys(id, ALL_BOARD_BILL_KEYS)` relê a conta inteira com `payment-options` junto.
- **"Chamar garçom"** é da #59: o `ConnectedWaiterCallButton`, pela tabela "Consumidores fora da conta" de lá. Ele não tem a variante `ghost` que a confirmação desenha, e esta task a acrescenta (mudança 7).
- **Primitivos:** `Overlay` (painel sem mídia de 540, `dialogMetrics.plainInlineSize`, `src/components/ui/Overlay.tsx:60`), `Button` com `loading` (`Button.tsx:192`), `Toast` (`show({ message, variant, action })`, `Toast.tsx:28-35`), `PanelTransition` e `SheetBackdrop`.
- **Já vendorado:** `pixPaymentMetrics` (`src/theme/component-tokens.ts:4364`), `staticSurfaces` e `formatClockTime` (`src/helpers/clock-time.ts`, da #38).
- **Ícones** já na união: `qr_code_2`, `content_copy`, `timer`, `progress_activity`, `check_circle`, `close`, `receipt_long`, `room_service`, `error` e `refresh`.

### Contrato da cobrança

Da [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), emendada em 2026-11-23 (tasks [#1636](https://github.com/sgrande-delivery/delivery-api/issues/1636), [#1762](https://github.com/sgrande-delivery/delivery-api/issues/1762) e [#1763](https://github.com/sgrande-delivery/delivery-api/issues/1763)). **Nada disso existe ainda**: a tela é construída contra o contrato.

```
POST /api/client/boardMovements/{id}/charges
  headers: x-restaurant-id, Idempotency-Key
  body: {
    amount: int,                                   // centavos, > 0 (02)
    split_mode: 'full' | 'equal' | 'custom',       // (02)
    person: string,                                // o nome de quem paga (decisão 4)
    instrument: { kind: 'pix', channel: 'pix' }    // a 04 e a 05 mandam os outros
  }
  → 201 { id, status, amount, expires_at, refusal_reason, amount_pending,
          pix?: { copy_paste, qr_code_base64 }, redirect_url?, cancel_token }
        cancel_token: 64 hex, SÓ nesta resposta
        pix e redirect_url podem não ter vindo: chegam com o payment.charge_created
  valor ≤ 0, acima do saldo, loja sem canal → 422 · inexistente/outra loja → 404
  liberada ou paga → 409 · acima do throttle → 429          (por status: 06)

GET /api/client/boardMovements/{id}/charges/{chargeId}
  → 200 { id, status, amount, expires_at, refusal_reason, pix?, redirect_url? }
  cobrança de outra movimentação ou loja → 404

POST /api/client/boardMovements/{id}/charges/{chargeId}/cancel
  body: { cancel_token }
  → 202 <objeto>, status "pending"           pedido aceito; o estado final vem do conector
  → 200 <objeto>, status refused|expired|canceled   já encerrada sem pagamento
  paga → 409 board_charge_already_paid · token que não confere → 403 board_charge_cancel_forbidden
  inexistente/alheia → 404 board_charge_not_found · token ausente → 422 · throttle → 429
```

- `status` ∈ `pending | paid | refused | expired | canceled`, a projeção do vocabulário do conector.
- `amount` é inteiro em centavos.
- `expires_at` é ISO 8601 com fuso, ou `null`.
- `refusal_reason` é `null` fora de `refused`. Em `refused`, é um de `declined | invalid_card_data | card_not_accepted | not_authorized | unavailable | temporarily_unavailable | unknown`. Hoje nenhum conector manda o motivo, e toda recusa sai `unknown`.
- **Idempotência** (`IdempotencyKeyMiddleware` da api, medido pela [#48](../../22-indoor-cart-order-v2/tasks/48-send-order-confirmation.md)):
  - a resposta 2xx ou 4xx fica registrada e é repetida para a mesma chave, e a 5xx não;
  - chave em voo responde 409 `idempotency_key_in_flight`, com `Retry-After: 1`;
  - a mesma chave com outro corpo responde 422 `idempotency_key_payload_mismatch`;
  - repetir a criação com a mesma chave devolve o mesmo `cancel_token` (#1762, mudança 3).

### Contrato do socket

Da [delivery-socket-api#66](https://github.com/sgrande-delivery/delivery-socket-api/issues/66), na versão revisada em 2026-11-23 que o dev escolheu. Namespace `/board`, sala `board_session:<movimentação>`, a mesma que a conta assina pela #58.

```ts
type BoardChargeUpdatedPayload = {
  charge_id: string;           // o id do POST /charges
  status: 'pending' | 'paid' | 'refused' | 'expired' | 'canceled'; // valor desconhecido passa intacto
  amount: number;              // centavos
  expires_at: string | null;
};
```

- **Sem replay.** O primeiro evento de uma cobrança é o `pending` que segue o `payment.charge_created`, e é a deixa para ler o `GET`, que então já traz o `pix`.
- **O mesmo estado pode chegar mais de uma vez, e fora de ordem.** Estado terminal é final para aquele `charge_id`.
- **O que cada aparelho faz** (tabela da #66, inline):

| Quem | `status` | Reação |
|---|---|---|
| quem criou a cobrança | `pending` | sem `pix` ainda, lê o `GET`; com `pix`, nada |
| | `paid` | sai da espera para a confirmação e invalida a conta; **não** promete conta fechada (RN-02) |
| | `refused` | lê o `GET` para o motivo e oferece outra forma |
| | `expired` | oferece gerar outro Pix |
| | `canceled` | volta à escolha da forma |
| | desconhecido | lê o `GET` |
| outro aparelho | `pending` | invalida `payment-options` (o aviso de andamento é a 01, pelo `amount_pending`) |
| | terminal | invalida `payment-options` e a conta |
| todos | `board_payment_added` | segue invalidando a conta pela #58. **Não tira ninguém da espera** (RN-08) |

### Requisitos cobertos

- **RF-08:** o Pix é criado, e a tela mostra o valor, a expiração em contagem e "aguardando pagamento", com a promessa de que a conta atualiza sozinha.
- **RF-09:** no celular o copia e cola vem primeiro.
- **RF-10:** no tablet o QR vem em destaque.
- **RF-10a:** a tela cheia do Pix e da confirmação no tablet em pé, e o painel no deitado.
- **RF-13:** "trocar forma" pede o cancelamento e volta à escolha sem perder o valor.
- **RF-14:** a confirmação, com a conta atualizada sem recarregar.
- **RF-15:** recusa com o motivo, e expiração com "gerar outro".
- **RF-16:** o tempo real, com a leitura de estado como rede.
- **RF-17**, o texto: "conta quitada" só com o saldo zerado.
- **RF-18**, dentro da vida da página: navegar e voltar retoma a cobrança. O reload é da 06.
- **RN-01:** o saldo é relido antes de criar.
- **RN-02:** a confirmação diz o que ainda falta.
- **RN-05:** nada persiste, e o nome no tablet é por pagamento.
- **RN-06:** a contagem é cosmética.
- **RN-07:** a chave é por tentativa.
- **RN-08:** só a própria cobrança tira da espera.
- **RN-09:** releitura no `connect` e ao voltar o foco.
- **RN-10:** o nome é o da sacola, no celular.
- **Decisão pendente 3 da spec.**

### Referência de design

Canvas Brasa Punch Indoor. Layout, hierarquia, copy e estados; token pelo tema.

- **Celular — `Conta · celular · Pix gerado`:**
  - cabeçalho com `close`, "Pagar com Pix" e "{loja} · Mesa {n}";
  - cartão com "Valor do Pix" (11 `muted`), o valor (display 34), a pílula "Expira em 09:42" (`timer`, tinta de `warn`), o QR de 150 e "Mostre o QR para pagar de outro celular";
  - cartão com `progress_activity` girando, "Aguardando pagamento…" e "A conta da mesa atualiza sozinha quando o Pix cair.";
  - os três passos: "Copie o código Pix abaixo", "No app do seu banco, escolha Pix › Copia e cola" e "Confira o valor e confirme";
  - rodapé fixo com o CTA "Copiar código Pix" (`content_copy`) e a ação de texto "Trocar forma de pagamento".
- **Tablet em pé — `Pagamento · tablet em pé · Pix gerado`** (tela cheia, sem a barra superior):
  - `close` de 44 ("Fechar e voltar para a conta"), "Mesa {n} · Pix", "Cobrança gerada às 20:32" e a pílula do `timer` com "09:42";
  - "Aponte a câmera do seu celular" (display 32) e o valor (40);
  - o QR de 420 num cartão de raio 26;
  - os três passos: "Abra o app do seu banco", "Escolha **Pix › Ler QR code**" e "Confira o valor e confirme";
  - a pílula "Aguardando pagamento…" e a nota "A conta da mesa atualiza sozinha quando o pagamento cair — ninguém precisa avisar o garçom.";
  - no pé, o `ghost` "Copiar código em vez do QR" e o texto "Trocar forma de pagamento".
- **Tablet deitado — `Conta · tablet deitado · Pix gerado`:** diálogo centrado sobre a conta, com o QR à esquerda e "Aponte a câmera do seu celular", "Abra o app do banco › Pix › Ler QR code. A conta da mesa atualiza sozinha quando o pagamento cair.", o valor (36) com a pílula, "Aguardando pagamento…" e as ações "Copiar código" e "Trocar forma".
- **Confirmação — `Pagamento · tablet em pé · confirmado`** (tela cheia):
  - `check_circle` de 62 num círculo de 120 em `success` tingido, "Pagamento confirmado" (display 34) e "Recebemos o seu Pix. A conta da mesa já foi atualizada e o garçom foi avisado.";
  - o cartão com "Valor pago", "Forma", "No nome de", "Confirmado às" e "Falta pagar na mesa", com "R$ 0,00 · conta quitada" em `success`;
  - o CTA "Ver a conta da mesa" (`receipt_long`) e o `ghost` "Chamar garçom";
  - a nota "Este tablet é da mesa: nada do seu pagamento fica salvo aqui. Precisa de nota fiscal? Peça no caixa."
- **Design system:** `design-system/components/PixPanel/README.md`: valor display 28/800, expiração com `timer` em `warn`, QR, "Aguardando pagamento…" com `progress_activity` em `info`, os passos, o CTA de copiar e "Trocar forma de pagamento"; copiar confirma com toast; expirado oferece gerar outro, e recusado, trocar de forma.

  **O README diverge da RN-08 corrigida:** diz que a tela espera "`status: paid` ou o evento de pagamento da conta". Vale a spec: só a própria cobrança. A correção do README fica fora desta pasta (follow-up).

**Onde o canvas e o primitivo divergem, vale o primitivo** (precedente da #38 e da #43). O diálogo do tablet deitado tem 720 em duas colunas no canvas, e aqui é o `Overlay` de 540 numa coluna, com o QR em cima. O Pix em pé tem 820 no canvas, e a tela cheia ocupa a viewport, que é o que a RF-10a pede.

### Inventário do `delivery-client` @ `ceed49a9` (`src/components/checkout/pix/`)

| Caminho | Decisão | Motivo |
|---|---|---|
| `use-countdown.ts` | porta | Tique de 1 s, `Math.max(0, …)` e `isExpired` em zero (`:19`, `:53-61`). Data passada ou ilegível dá `remainingMs: null` |
| `format-date-time.ts` | porta só `formatCountdown` | `mm:ss` ou `h:mm:ss`. A hora da cobrança usa o `formatClockTime` da #38 |
| `PixExpiryPill.tsx` | porta | `role="timer"`, some com `remainingMs` nulo. A copy de zero muda: aqui a contagem não declara expirado (RN-06) |
| `PixQrCard.tsx` | adapta | O `<img>` do `qr_code_base64`, com prefixo PNG para base64 nu (`:76-86`) e moldura branca fixa (`:33-47`). O rótulo "Valor do pedido" vira "Valor do Pix", e o tamanho passa a ser prop (150, 280 e 420) |
| `PixCopyCode.tsx`, `src/hooks/use-copy-to-clipboard.ts` | portam | `navigator.clipboard` com o `textarea` de reserva (`:8-41`), toast de sucesso e de erro. Copia `pix.copy_paste` |
| `PixHowToPay.tsx`, `PixHowToPayStep.tsx`, `PixSpinner.tsx`, `PixScreenBody.tsx` | portam | Os passos ganham as duas variantes de copy (copia e cola e QR) |
| `PixWaitingFooter.tsx`, `PixChargePendingScreen.tsx` | adaptam | Sai o link do pedido (`orderDetailAction`). O "Estamos gerando seu pagamento" vira o estado "sem código ainda" (decisão 7) |
| `PixPaidScreen.tsx`, `PixReceiptCard.tsx`, `PixReceiptRow.tsx` | adaptam | Ficam o selo, o título e as linhas. Sai o ETA e o `OrderSuccessActions`. O objeto da cobrança não tem `paid_at` nem nome da forma (decisão 10) |
| `use-pix-status.ts` | adapta a ideia | Lá: query do pedido, refetch em foco e reconexão, polling de 15 s só com socket caído, e `/client` + `user`. Aqui: query da cobrança, foco, `connect` do `/board` e o `board.charge_updated` (decisões 6 a 8) |
| `OrderPaymentScreen.tsx`, `OrderPaymentHeader.tsx` | adaptam a ideia | O roteamento por estado vira o `PaymentStepHost`. Sai o `useWhoami` (`:6`, `:74`) |
| `PixPaidArrivalCard.tsx`, `PixOffline*`, `PixKeyCard.tsx`, `offline-pix-status.ts`, `order-detail-action.ts`, `order-payment.ts` | descartam | Entrega, Pix offline da loja e o pedido |

### Decisões

1. **Uma máquina para toda cobrança.** `BoardChargeProvider` (`src/providers/board-charge/`) fica na raiz, dentro do `BoardPaymentProvider` da 01, e guarda **uma tentativa por vez**, em memória:

   ```ts
   interface ChargeAttempt {
     movementId: string;
     chargeId: string;
     channel: PaymentChannel;      // pix aqui; card e wallet_* na 04 e na 05
     cancelToken: string | null;   // do 201; só em memória nesta task (a 06 decide o storage)
     person: string;               // o nome mandado; só em memória
     createdAt: number;            // relógio local, para "Cobrança gerada às"
     status: BoardChargeStatus;    // o último visto; terminal é final
     observedPaidAt: number | null; // quando ESTE aparelho viu o `paid` enquanto esperava
     isViewOpen: boolean;          // a espera pode ser fechada sem perder a cobrança
   }
   ```

   O objeto da cobrança (valor, `pix`, `expires_at`, motivo) mora no React Query, em `['board-charge', movementId, chargeId]`, semeado com o 201. A transição de estado é pura (`charge-attempt.ts`): `applyChargeStatus(attempt, status, source)` aplica a regra de terminal final e de repetição.

   Navegar para o cardápio e voltar não perde a tentativa (RF-18 dentro da página), e girar o tablet troca o lugar da espera sem trocá-la.
2. **A chave de idempotência é por tentativa de conteúdo** (RN-07), no molde da decisão 1 da #48.
   - O conteúdo é `{ amount, split_mode, person, channel }`.
   - **A chave é reaproveitada** quando a tentativa anterior com o mesmo conteúdo terminou sem resposta, com 5xx ou com 409 `idempotency_key_in_flight`. É o caso em que a cobrança pode ter nascido, e a repetição devolve o mesmo 201, com o mesmo `cancel_token`.
   - **Uma chave nova** sai depois de qualquer 2xx ou 4xx, ou quando o conteúdo muda.
   - O 409 `idempotency_key_in_flight` repete sozinho **uma** vez, depois do `Retry-After`.
   - O gerador é o `createSessionToken` da #46 (`src/services/cart.ts`), com o v4 por `crypto.getRandomValues` fora de contexto seguro. `crypto.randomUUID` não existe em `http://` de rede local, que é onde o tablet de teste abre o dev server.
   - O pagamento não depende do carrinho: a 03 **importa** `randomUuid()` de `src/helpers/random-uuid.ts`, que a #46 cria (alinhado com a #22 em 2026-11-23). Não extrai nem recria o gerador.
3. **O toque em "Gerar Pix" faz, nesta ordem:**
   1. a validação do valor (02): `ok: false` marca o erro do campo, e para;
   2. o nome (decisão 4);
   3. a releitura do saldo, `queryClient.fetchQuery` de `payment-options` com `staleTime: 0` (RN-01). Se o valor resolvido mudou em relação ao que o CTA mostrava, a tela **não** cria a cobrança: atualiza o CTA e avisa "A conta mudou: agora falta {R$}. Confira o valor e toque de novo." (**derivada**). Com o valor livre acima do saldo novo, vale o erro do campo;
   4. o `POST`, com o CTA em `loading` do toque até a resposta. O segundo toque não faz nada (`disabled` enquanto a mutação está pendente), e a chave cobre o resto.

   Offline, o CTA nem habilita (01, decisão 12).
4. **O nome de quem paga.** A API pede `person`, e é ele que aparece em "Pix · Rafael" na conta (RN-10).
   - **No celular** (fora do `tabletShellMediaQuery`), vale o nome da sacola, de `usePerson()`. Sem nome salvo, abre o `PersonNameDialog` no modo novo `pay`, e confirmar grava pelo `setPerson` da #47, porque o aparelho é da pessoa.
   - **No tablet** o nome é pedido **a cada pagamento**, com o campo vazio, e não é gravado. O nome salvo da #47 é de quem pediu por último naquele aparelho, e usá-lo poria o pagamento no nome de outra pessoa (RN-05).
   - O nome passa pela normalização da #47 (`normalizePersonName`, 60 caracteres no máximo). A 1636 diz só "string curta" para o `person`; os 60 são o menor limite medido no caminho do nome.
5. **O lugar da espera** (`PaymentStepHost`), com a tentativa aberta:

   | Formato | Lugar |
   |---|---|
   | Celular | a página `/board/payment` troca o formulário pelo passo (cabeçalho com `close`) |
   | Tablet em pé | o `Sheet` da 01 fecha, e abre a `PaymentFullScreen` |
   | Tablet deitado | o `Overlay` sobre a conta |

   - A `PaymentFullScreen` é componente da mesa sobre o `Modal`, com `PanelTransition`, `role="dialog"`, `aria-modal` e `aria-labelledby`. É o molde do `PersonNamePanel` da #47.
   - **Fechar a espera não cancela** (decisão pendente 2 da spec): `isViewOpen` vira `false` e a tela volta para `/board`. A cobrança continua sendo acompanhada.
   - Abrir o pagamento de novo, com a tentativa pendente, mostra a espera, e não o formulário.
   - No tablet deitado, a coluna da 01 troca o formulário por um aviso "Seu Pix de {R$} está aguardando pagamento." com "Ver o Pix" (**derivada**), para não abrir uma segunda cobrança por baixo.
6. **Sair da espera: só a própria cobrança** (RN-08). Mudam o estado só:
   - um `board.charge_updated` com `charge_id === attempt.chargeId`;
   - ou o `GET` dessa cobrança.

   O `board_payment_added` não está em nenhum caminho desta task.
7. **Pix sem código ainda.** O 201 pode chegar sem `pix`, porque o código vem com o `payment.charge_created` (#1636).
   - A tela mostra "Gerando o seu Pix…" (**derivada** do `PixChargePendingScreen` do client) e lê o `GET` quando chega o `pending` da própria cobrança.
   - Como o `pending` pode ter chegado **antes** do 201 (e aí o aparelho ainda não sabia que a cobrança era sua), há também uma leitura com intervalo crescente, só enquanto falta o código: 2, 4, 8 e 16 s, e para.
   - Sem código depois disso, a tela diz "Não conseguimos gerar o código do Pix." com "Tentar de novo" (um `GET`) e "Trocar forma de pagamento".

   É espera por dado, e não polling de estado (decisão pendente 3 da spec).
8. **Rede de segurança do estado** (RN-09, decisão pendente 3):
   - a query da cobrança tem `refetchOnWindowFocus: true` e `staleTime: 0`. Voltar do app do banco relê;
   - no `connect` do socket (`socket.on('connect', handler)`, com o `off` pela referência), com a tentativa pendente, relê. A reinscrição na sala é da #58;
   - a contagem chegando a zero relê. Ainda pendente, relê de novo em 5, 15 e 30 s, e para. A tela **não** declara expirado (RN-06): mostra "00:00" e continua aguardando, com "Trocar forma de pagamento" como saída.
9. **O listener.** `useBoardChargeEvents` (`src/providers/board-charge/`) lê o `socket` de `useBoardSocket()` e registra `board.charge_updated` e `connect` nele, com um `off` pela referência para cada `on` (rule `socket-da-mesa`), pelo contrato de consumidor da #58 (decisão 6 de lá): retorna cedo com `socket` nulo, tem o `socket` nas dependências do efeito (a instância muda com a sessão), e o handler de `connect` só relê REST, sem contar com a sala já reinscrita. O handler do evento:
   - descarta payload que não é objeto com `charge_id` e `status` em texto;
   - **própria cobrança:** aplica `applyChargeStatus`. Releitura no `pending` sem código, no `refused` e no desconhecido. No `paid`, grava `observedPaidAt` (se a espera estava aberta), invalida `resolveBoardBillQueryKeys(id, ALL_BOARD_BILL_KEYS)` (a conta e `payment-options`), e chama `resetAmount()`;
   - **outra cobrança:** no `pending`, invalida só `boardPaymentOptionsQueryKey(id)`; no terminal, `resolveBoardBillQueryKeys(id, ALL_BOARD_BILL_KEYS)`. Nenhuma chave é montada à mão;
   - repetição `(charge_id, status)` não reage duas vezes, e `pending` depois de terminal é ignorado (RN-12 da #66).
10. **A confirmação** (`PaymentConfirmed`), com o `paid`. O objeto da cobrança **não traz** hora de confirmação, nome da forma nem pessoa:
    - **"Valor pago":** `charge.amount`;
    - **"Forma":** o canal da tentativa, com o nome e o ícone da 01;
    - **"No nome de":** `attempt.person`;
    - **"Confirmado às":** `observedPaidAt`, a hora em que **este aparelho** viu o `paid` enquanto esperava. Sem ela, a linha não aparece. Inventar a hora da leitura atrasada seria mentir;
    - **"Falta pagar na mesa":** `remainingCents` da releitura de `payment-options` depois do `paid`, com skeleton enquanto ela chega. A linha de pagamento é criada na mesma transação da confirmação (RN-09 da 1609), então a releitura já a enxerga. Com zero, "R$ 0,00 · conta quitada" com `check_circle` em `success`; senão, o valor, sem promessa de conta fechada (RN-02).

    A frase do canvas diz "e o garçom foi avisado". **O default aqui é tirar essa parte:** nenhum caminho da plataforma avisa o garçom de um pagamento pelo app. O `board_payment_added` vai para a sala da mesa, e o painel do PDV está nela, mas a tela de gestão de mesas não o escuta: ela ouve só `board_session_created`/`completed`, `board_bill_requested` e `board_totals_changed`, que não sai em pagamento (medido no `delivery-admin` `origin/master` em 2026-11-23, `src/pages/board-management/hooks/useBoardManagementSocketEvents.ts:47-63`). Só a tela de controle de uma mesa, se aberta, ouve o pagamento (`registration/board/hooks/useBoardControlSocketEvents.ts:121`). A chamada de garçom é outra frente (delivery-api#1610). É o mesmo default do bloco de encerramento da #60 (decisão 9 de lá), que tira "O garçom já foi avisado". Confirmar com o dev. "Ver a conta da mesa" encerra a tentativa e vai para `/board`. O "Chamar garçom" é o `ConnectedWaiterCallButton` da #59 com `variant="ghost"`.
11. **"Trocar forma de pagamento"** (RF-13), com spinner no próprio botão:

    | Resposta do cancelamento | O que a tela faz |
    |---|---|
    | 202 (`pending`) ou 200 (`refused`, `expired`, `canceled`) | encerra a tentativa e volta ao formulário, com o valor e a forma mantidos |
    | 409 `board_charge_already_paid` | a cobrança foi paga: aplica `paid` e mostra a confirmação |
    | 403, 422, ou tentativa sem `cancel_token` | encerra e volta, com o toast "Não conseguimos cancelar o Pix anterior. Ele vale até {HH:mm}; se for pago, a conta mostra." (**derivada**) |
    | 404 `board_charge_not_found` | encerra e volta |
    | 429, 5xx ou rede | fica na espera, com o toast de erro e "Tentar de novo" |

    Encerrada a tentativa, um `paid` que chegue depois para aquele `charge_id` é pagamento de verdade: cai no ramo "outra cobrança", e a conta mostra. Offline o botão fica desabilitado, porque a mutação nasceria pausada.
12. **Recusa e expiração.**
    - **Recusa:** `ChargeRefused` com a frase do `refusal_reason` (Copy), "Escolher outra forma" (volta ao formulário) e "Tentar de novo" (nova tentativa com a mesma escolha e chave nova). Motivo fora do conjunto, ou `null` em `refused`, usa a frase de `unknown`.
    - **Expirado:** o Pix mostra "Este Pix expirou", com "Gerar outro Pix · {R$}" e "Trocar forma de pagamento". Gerar outro refaz a decisão 3 com o nome da tentativa, sem perguntar de novo.
    - **`canceled` vindo do servidor** (estorno, ou cancelamento confirmado por outro caminho): volta ao formulário, com o toast "A cobrança foi cancelada." (**derivada**).
13. **Nada é persistido nesta task.** Tentativa, `cancel_token`, nome e código Pix ficam em memória. O registro em `sessionStorage` e a retomada depois do reload são da 06. No tablet, ao fim da tentativa, nada do pagamento sobra fora do cache da cobrança, que é removido (`removeQueries`) ao encerrar.
14. **O CTA por forma.** `paymentCtaFor(method, amountLabel)` (`src/components/board-payment/cta/`) devolve rótulo, ícone e ação. Esta task registra o Pix: "Gerar Pix · {R$}" com `qr_code_2`. A 04 e a 05 registram as outras. Até lá, com outra forma marcada, o rodapé não tem CTA.

### Copy

Literal do canvas, salvo as **derivadas**, que precisam de confirmação do dev no review.

| Onde | Texto | Fonte |
|---|---|---|
| CTA | "Gerar Pix · {R$}" | canvas |
| Celular, cabeçalho | "Pagar com Pix" · "{loja} · Mesa {n}" | canvas |
| Celular, cartão | "Valor do Pix" · "Expira em {mm:ss}" · "Mostre o QR para pagar de outro celular" | canvas |
| Espera | "Aguardando pagamento…" · "A conta da mesa atualiza sozinha quando o Pix cair." (celular) / "A conta da mesa atualiza sozinha quando o pagamento cair — ninguém precisa avisar o garçom." (tablet) | canvas |
| Passos, celular | "Copie o código Pix abaixo" · "No app do seu banco, escolha Pix › Copia e cola" · "Confira o valor e confirme" | canvas |
| Passos, tablet | "Abra o app do seu banco" · "Escolha Pix › Ler QR code" · "Confira o valor e confirme" | canvas |
| Tablet em pé | "Mesa {n} · Pix" · "Cobrança gerada às {HH:mm}" · "Aponte a câmera do seu celular" | canvas |
| Ações | "Copiar código Pix" (celular) · "Copiar código em vez do QR" (em pé) · "Copiar código" (deitado) · "Trocar forma de pagamento" / "Trocar forma" (deitado) | canvas |
| Toast de cópia | "Código Pix copiado." / "Não foi possível copiar. Selecione o texto e copie à mão." | client, `PixCopyCode.tsx:12`, `use-copy-to-clipboard.ts:6` |
| Sem código | "Gerando o seu Pix…" / "Não conseguimos gerar o código do Pix." · "Tentar de novo" | **derivada** |
| Expirado | "Este Pix expirou" · "Gerar outro Pix · {R$}" | **derivada** (o client diz "Código Pix expirado") |
| Contagem em zero | "Confirmando com o banco…" | **derivada** |
| Saldo mudou | "A conta mudou: agora falta {R$}. Confira o valor e toque de novo." | **derivada** |
| Confirmação | "Pagamento confirmado" · "Recebemos o seu Pix. A conta da mesa já foi atualizada." · "Valor pago" · "Forma" · "No nome de" · "Confirmado às" · "Falta pagar na mesa" · "{R$ 0,00} · conta quitada" · "Ver a conta da mesa" · "Chamar garçom" | canvas, **sem** "e o garçom foi avisado" (decisão 10) |
| Nota da confirmação | tablet: "Este tablet é da mesa: nada do seu pagamento fica salvo aqui. Precisa de nota fiscal? Peça no caixa." · celular: "Precisa de nota fiscal? Peça no caixa." | canvas; a do celular é **derivada** |
| Nome (modo `pay`) | título da #47; corpo "Seu nome aparece na conta da mesa, junto do pagamento." (no tablet, mais "Ele não fica salvo neste tablet."); CTA "{rótulo do CTA}"; erro "Informe seu nome para pagar." | **derivada** |
| Trocar sem cancelar | "Não conseguimos cancelar o Pix anterior. Ele vale até {HH:mm}; se for pago, a conta mostra." | **derivada** |
| Cancelada pelo servidor | "A cobrança foi cancelada." | **derivada** |
| Falha ao gerar | toast "Não foi possível gerar o Pix." · ação "Tentar de novo" | **derivada** |
| Pix pendente na coluna | "Seu Pix de {R$} está aguardando pagamento." · "Ver o Pix" | **derivada** |

Recusa, pelo `refusal_reason` (derivadas da coluna "o que significa para o cliente" da #1763; a copy é do indoor):

| `refusal_reason` | Título | Linha de apoio |
|---|---|---|
| `declined` | O banco recusou o pagamento | Tente outro cartão ou outra forma de pagamento — nada foi cobrado. |
| `invalid_card_data` | Confira os dados do cartão | Algum dado não confere. Revise e tente de novo. |
| `card_not_accepted` | Este cartão não é aceito aqui | Use outro cartão ou outra forma de pagamento. |
| `not_authorized` | O pagamento não foi autorizado | A autorização não foi concluída no app do banco. Tente de novo ou escolha outra forma. |
| `unavailable` | Esta forma está indisponível | Escolha outra forma de pagamento ou chame o garçom. |
| `temporarily_unavailable` | Falha passageira | Tente de novo em instantes. |
| `unknown` (e fora do conjunto) | Não deu para concluir o pagamento | Tente outra forma de pagamento — nada foi cobrado. |

### Armadilhas

- **`board_payment_added` não é sinal de espera.** Ele chega quando o garçom lança dinheiro no PDV, não diz qual cobrança, e não vem no estouro de saldo (#1640). Um `if` com ele no handler desta task é o erro que a RN-08 corrigida proíbe.
- **O `pending` pode chegar antes do 201.** Por isso a leitura com teto da decisão 7.
- **`cancel_token` é segredo de posse** (RN-15 da 1609). Não vai para log, para o `/api/log` da #38, para a URL nem para o cache do React Query: o 201 é semeado no cache **sem** `cancel_token` e sem `amount_pending`.
- **Um `on` sem `off` pela referência** duplica reação. E `off('connect')` cego derruba o listener interno do `SocketStore`.
- **Dinheiro em centavos.** `charge.amount` e o `amount` do evento vão para `formatCents`.
- **A mutação offline nasce pausada.** CTA e "Trocar forma" ficam desabilitados com `useIsOffline()`.
- **O `qr_code_base64` pode ser data URI completa ou base64 nu** (`PixQrCard.tsx:76-86` @ `ceed49a9`). A moldura é branca nos dois esquemas, senão o app do banco não lê o QR no escuro.
- **`useMediaQuery` começa falso.** O lugar da espera é portal, então monta depois da hidratação. Sem isso, o celular pisca no tablet.
- **Duas tentativas ao mesmo tempo não existem neste aparelho.** Com uma pendente, o CTA não aparece (a espera, ou o aviso da coluna, ocupa o lugar). Duas pessoas pagando ao mesmo tempo é caso normal **entre aparelhos** (RN-03), e não no mesmo.

## Mudanças

### 1. Tipos

`src/types/board-payment.ts` (alterado, criado pela 01):

```ts
export type BoardChargeStatus = 'pending' | 'paid' | 'refused' | 'expired' | 'canceled';
export type BoardChargeRefusalReason =
  | 'declined' | 'invalid_card_data' | 'card_not_accepted' | 'not_authorized'
  | 'unavailable' | 'temporarily_unavailable' | 'unknown';

export interface BoardChargePix { copy_paste: string; qr_code_base64: string | null }

/** `GET /boardMovements/{id}/charges/{chargeId}` — delivery-api#1636/#1763. Valores em centavos. */
export interface BoardCharge {
  id: string;
  status: BoardChargeStatus | string; // valor desconhecido passa intacto (RN-10 da #66) e é relido
  amount: Cents;
  expires_at: string | null;
  refusal_reason: BoardChargeRefusalReason | string | null;
  pix?: BoardChargePix;
  redirect_url?: string;
}

/** O 201 de `POST /charges`: o objeto, mais o que só sai na criação. */
export interface CreatedBoardCharge extends BoardCharge { amount_pending: Cents; cancel_token: string }

export type ChargeInstrument =
  | { kind: 'pix'; channel: 'pix' }
  | { kind: 'card'; channel: PaymentChannel; token: string; brand?: string }   // 04 e 05
  | { kind: 'wallet'; channel: PaymentChannel; token?: string };              // 05

export interface CreateBoardChargeBody {
  amount: Cents;
  split_mode: 'full' | 'equal' | 'custom';
  person: string;
  instrument: ChargeInstrument;
}

/** `board.charge_updated` — delivery-socket-api#66 revisada. */
export interface BoardChargeUpdatedPayload {
  charge_id: string;
  status: BoardChargeStatus | string;
  amount: Cents;
  expires_at: string | null;
}
```

### 2. Serviço

`src/services/board-charge.ts` (novo):

- `boardChargeQueryKey(movementId, chargeId)` → `['board-charge', movementId, chargeId]`;
- `createBoardCharge(movementId, body, idempotencyKey): Promise<CreatedBoardCharge>`, com o header `Idempotency-Key`;
- `fetchBoardCharge(movementId, chargeId): Promise<BoardCharge>`;
- `cancelBoardCharge(movementId, chargeId, cancelToken): Promise<{ status: 200 | 202; charge: BoardCharge }>`;
- `isTerminalChargeStatus(status)`, `isBoardChargeUpdatedPayload(value)` e a guarda de payload, que confere `amount` inteiro e `status` e `id` em texto, como a 01 faz;
- o `readErrorCode` vem de `src/services/api-error-interceptor.ts` (#33), e não é recriado.

### 3. A máquina

`src/providers/board-charge/` (novos):

- `charge-attempt.ts` (puro): `ChargeAttempt`, `startAttempt`, `applyChargeStatus` (terminal final, repetição, `observedPaidAt` só com `isViewOpen`), `closeView`, `openView`;
- `charge-idempotency.ts` (puro): `nextIdempotencyKey(previous, content, lastOutcome)`, com a decisão 2, gerando por `randomUuid()` de `src/helpers/random-uuid.ts` (criado pela #46, decisão 2);
- `BoardChargeProvider.tsx` (`'use client'`): o estado, as mutações de criação e de cancelamento e a limpeza de cache ao encerrar. Expõe `useBoardCharge()`, que lança fora do provider:

  ```ts
  interface BoardChargeValue {
    attempt: ChargeAttempt | null;
    charge: BoardCharge | undefined;      // da query
    isCreating: boolean;
    isCanceling: boolean;
    start: (input: { channel: PaymentChannel; instrument: ChargeInstrument }) => Promise<void>; // decisão 3
    cancel: () => Promise<void>;          // decisão 11
    retryCode: () => void;                // decisão 7
    openView: () => void;
    closeView: () => void;
    dismiss: () => void;                  // encerra a tentativa terminal e limpa o cache
  }
  ```

- `use-board-charge-events.ts`: o listener da decisão 9, chamado pelo provider;
- `use-board-charge-query.ts`: a query da cobrança (decisões 7 e 8), habilitada só com tentativa;
- `index.ts`: o barrel.

`src/App.tsx` (alterado): um aninhamento, `<BoardChargeProvider>` logo dentro do `BoardPaymentProvider` da 01.

### 4. Nome de quem paga

- `src/components/person/PersonNameDialog.tsx` e `PersonNameForm.tsx` (alterados, criados pela #47): o modo `'pay'`, com a prop `confirmLabel`, o corpo e o erro da Copy.
- `src/components/board-payment/use-payer-name.ts` (novo): `resolvePayerName()` com a decisão 4. O nome do tablet não passa pelo `setPerson`.

### 5. As peças do Pix

`src/components/board-payment/pix/` (novos; portam ou adaptam pelo inventário):

- `use-countdown.ts`, `format-countdown.ts`, `PixExpiryPill.tsx` (sem o "expirado" em zero);
- `PixQrCard.tsx` (com `size` 150, 280 ou 420), `PixCopyCode.tsx`, `PixHowToPay.tsx`, `PixHowToPayStep.tsx`, `PixSpinner.tsx`;
- `pix-copy.ts` e `pix-metrics.ts` (medidas do canvas sem token: QR de 150/280/420, círculo de 120, respiros). Sem hex.

`src/hooks/use-copy-to-clipboard.ts` (novo): porta.

### 6. As três esperas e os estados do Pix

`src/components/board-payment/pix/` (novos):

- `PixWaitingPhone.tsx`: o artboard do celular. O CTA fixo de copiar é o primário (RF-09), e o QR fica no cartão do valor, como no canvas;
- `PixWaitingFullScreen.tsx`: o artboard do tablet em pé;
- `PixWaitingPanel.tsx`: o tablet deitado, numa coluna de 540;
- `PixCodePending.tsx`: "Gerando o seu Pix…" e a falha da decisão 7;
- `PixExpired.tsx`: a decisão 12.

### 7. Lugar, aviso e desfechos

- `src/components/board-payment/steps/PaymentStepHost.tsx` e `PaymentFullScreen.tsx` (novos): a decisão 5.
- `src/components/board-payment/steps/PendingChargeNotice.tsx` (novo): o aviso da coluna.
- `src/components/board-payment/outcome/` (novos): `PaymentConfirmed.tsx`, `ChargeRefused.tsx`, `refusal-copy.ts` (a tabela de recusa), `outcome-copy.ts` e `outcome-metrics.ts`. O "Chamar garçom" da confirmação é `<ConnectedWaiterCallButton variant="ghost" />` (#59).
- `src/components/waiter/WaiterCallButton.tsx` e `ConnectedWaiterCallButton.tsx` (alterados, da #59 e da #60): `variant?: 'neutral' | 'ghost'`, `neutral` por default, repassado ao `Button`. Só a aparência: o estado continua o do `useWaiterCall()`.
- `BoardPaymentPage.tsx`, `BoardPaymentSheet.tsx` e `BoardPaymentColumn.tsx` (alterados, criados pela 01): com tentativa, cedem o lugar ao `PaymentStepHost`.

### 8. CTA

`src/components/board-payment/cta/payment-cta.ts` e `PaymentCta.tsx` (novos): a decisão 14, montados no lugar do CTA do `BoardPaymentFooter` (01 e 02).

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen` e `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui.
4. `grep -rn "board_payment_added" src/providers/board-charge src/components/board-payment` não encontra nada.
5. `grep -rn "localStorage\|sessionStorage" src/providers/board-charge src/components/board-payment` não encontra nada (o storage é da 06).
6. `grep -rn "\.on(" src/providers/board-charge` e `grep -rn "\.off(" src/providers/board-charge` dão o mesmo número de linhas, com os mesmos eventos.
7. `grep -rn "cancel_token" src | grep -v "types/board-payment.ts\|services/board-charge.ts\|providers/board-charge"` não encontra nada.

**No navegador.** A base tem a 01, a 02, a #47, a #53, a #58 e a #59, mais uma movimentação aberta. As rotas de cobrança ainda não existem, então as respostas vêm do "Override content" do DevTools, como na 01: o `payment-options` da fixture A da 01, um 201 de `POST /charges` e o `GET` da cobrança, trocado à mão entre os passos.

As fixtures:

- **201 sem código:** `{ "id": "7f3e2d1c-0b9a-4c8d-8e7f-6a5b4c3d2e1f", "status": "pending", "amount": 9543, "expires_at": null, "refusal_reason": null, "amount_pending": 9543, "cancel_token": "<64 hex>" }`;
- **GET com código:** o mesmo, sem `amount_pending` e `cancel_token`, com `expires_at` 10 minutos à frente e `pix: { copy_paste: "00020101…", qr_code_base64: "data:image/png;base64,…" }` (um PNG de QR qualquer);
- **GET pago:** `status: "paid"`;
- **GET recusado:** `status: "refused"`, `refusal_reason: "declined"`;
- **GET com motivo desconhecido:** `refusal_reason: "xyz"`.

1. **Dois toques, 390 × 844.** Marcar o Pix e tocar duas vezes em "Gerar Pix · R$ 95,43". **Observar:** **um** `POST`, com `Idempotency-Key` e o corpo `{ amount: 9543, split_mode: "full", person, instrument: { kind: "pix", channel: "pix" } }`. Sem nome salvo, o diálogo de nome abre antes, no modo `pay`.
2. **Retry de rede.** Bloquear `*/charges` (Request blocking), tocar, ver o toast e desbloquear. "Tentar de novo" sai com **a mesma** chave. Com um 422 no override e um novo toque, sai uma chave nova.
3. **Saldo mudou.** Com o override de `payment-options` trocado para `amount_due: 18543` entre a tela e o toque, tocar. **Observar:** nenhum `POST`, o aviso "A conta mudou: agora falta R$ 125,43…" e o CTA atualizado.
4. **Sem código.** Com o 201 sem código e o `GET` ainda sem `pix`, **observar** "Gerando o seu Pix…" e as leituras em 2, 4, 8 e 16 s. Trocar o `GET` para o com código: o QR e a contagem aparecem.
5. **Celular.** **Observar:** o artboard do celular, com "Copiar código Pix" fixo embaixo. Tocar: o toast "Código Pix copiado." e o código na área de transferência.
6. **Saída pelo GET, voltando do banco.** Trocar o override para o pago, ir para outra aba e voltar. **Observar:** a releitura no foco e a confirmação, com "Confirmado às" e o "Falta pagar na mesa" da releitura de `payment-options`. Com a releitura dando `amount_paid: 15543`: "R$ 0,00 · conta quitada".
7. **`board_payment_added` não tira da espera.** Com um Pix na espera (override com código), registrar um pagamento em dinheiro no PDV para a mesma mesa. **Observar:** a conta ao fundo atualiza (#58), e a espera continua.
8. **Tablet em pé, 820 × 1180.** Gerar. **Observar:** o `Sheet` fecha, e a tela cheia mostra o QR de 420, "Aponte a câmera do seu celular" e o "Copiar código em vez do QR". Com o nome pedido de novo e o campo vazio, mesmo com nome salvo na sacola. Fechar: volta para `/board` e nenhum cancelamento sai. "Pagar conta" de novo mostra a mesma espera.
9. **Tablet deitado, 1180 × 820.** Gerar pela coluna. **Observar:** o painel de 540 sobre a conta. Fechar: a coluna mostra "Seu Pix de R$ 95,43 está aguardando pagamento." com "Ver o Pix".
10. **Trocar forma.** Na espera, tocar "Trocar forma de pagamento". **Observar:** **um** `POST …/cancel` com `{ cancel_token }`. Com 202 no override, a volta ao formulário com o valor mantido. Com 409 `board_charge_already_paid`, a confirmação. Com 403, a volta e o toast.
11. **Contagem.** Com `expires_at` 20 s à frente, **observar** a pílula contando e, em zero, um `GET`, "Confirmando com o banco…" e as releituras em 5, 15 e 30 s. Com o `GET` dando `expired`: "Este Pix expirou" com "Gerar outro Pix · R$ 95,43", que faz um `POST` novo com chave nova, sem pedir o nome.
12. **Recusa.** Override recusado: "O banco recusou o pagamento". Override com motivo desconhecido: a frase de `unknown`.
13. **Offline.** Na espera, Network → Offline. **Observar:** "Trocar forma" desabilitado e nenhuma requisição presa. Voltando a rede, uma releitura.
14. **Navegar e voltar.** Com a espera aberta, ir para o cardápio e voltar a `/board/payment`. **Observar:** a mesma espera, sem `POST` novo.
15. **Socket** (quando a delivery-socket-api#66 e a #1639 estiverem no ambiente): pagar um Pix de sandbox e **observar** o `board.charge_updated` no frame do WebSocket e a saída da espera sem `GET` de foco. Num segundo aparelho na mesma mesa, o evento só relê `payment-options`.

## Critérios de aceitação

- [ ] O `POST /charges` sai com `{ amount, split_mode, person, instrument: { kind: "pix", channel: "pix" } }` e `Idempotency-Key`. Dois toques criam uma cobrança, e o retry de rede, de 5xx ou de `idempotency_key_in_flight` reusa a chave.
- [ ] O saldo é relido antes do `POST`, e um valor que mudou não é cobrado sem o cliente ver.
- [ ] No celular o nome é o da sacola (pedido e gravado se faltar); no tablet é pedido a cada pagamento, vazio, e não é gravado.
- [ ] O aparelho sai da espera só por `board.charge_updated` com o próprio `charge_id` ou pelo `GET` dele. Um `board_payment_added` não muda a espera.
- [ ] Evento repetido não reage duas vezes, e `pending` depois de terminal é ignorado.
- [ ] Sem `pix` no 201, a tela lê o `GET` no `pending` próprio e na leitura com teto de 2, 4, 8 e 16 s, e não faz polling além disso.
- [ ] A query da cobrança relê ao voltar o foco e no `connect`. Contagem em zero relê, e a tela nunca declara expirado por conta própria.
- [ ] Celular com o copia e cola como CTA fixo; tablet em pé com o QR de 420 em tela cheia; tablet deitado com o painel de 540. Fechar a espera não cancela, e abrir de novo a retoma.
- [ ] "Trocar forma" faz um `POST …/cancel` com `{ cancel_token }` e trata 202, 200, 409, 403, 404, 422 e 429 pela tabela da decisão 11.
- [ ] A confirmação mostra "Falta pagar na mesa" da releitura, com "conta quitada" só em zero. "Confirmado às" só aparece com a hora vista ao vivo, e "e o garçom foi avisado" não aparece.
- [ ] A recusa usa a frase do `refusal_reason`, com a de `unknown` para motivo fora do conjunto. Expirado oferece gerar outro.
- [ ] Um `on` e um `off` pela referência para `board.charge_updated` e para `connect`. Nenhum `SocketStore` novo e nenhum `subscribe_channel` nesta task.
- [ ] Nada desta task grava em `localStorage` ou em `sessionStorage`, e o `cancel_token` não aparece em cache, log ou URL.
- [ ] Sem hex, sem `moneyFormat` e sem arquivo alterado em `src/theme/`, `src/components/ui/` ou `src/fonts/`.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **O cartão:** 04, que registra o CTA e o passo dele na máquina daqui.
- **As carteiras:** 05.
- **Guardar a tentativa em `sessionStorage`** e retomá-la depois do reload ou do descarte da aba, e o desfecho descoberto na volta: 06.
- **As recusas da criação por status** (422 de saldo e de loja sem canal, 404, 409 e 429), com a copy própria de cada uma: 06. Aqui elas caem no toast genérico de falha ao gerar.
- **A passagem para o estado de conta paga** na conta (a coluna do tablet deitado virando o bloco de encerramento): 06, com a conta paga do celular da #57 e o encerramento do tablet deitado da #60.
- **Chamar o garçom:** #59. Aqui só se monta o `ConnectedWaiterCallButton` de lá, com a variante `ghost`.
- **O socket do `/board`**, a inscrição na sala e a invalidação pelos cinco eventos da conta: #58.
- **Corrigir o `PixPanel/README.md`** do design system (RN-08): follow-up, fora da pasta da #24.
- **Comprovante e nota fiscal:** fora do escopo da spec (a #1466 é do PDV).

## Branch

`task/63-board-pix-charge-wait`, base sugerida: `task/62-board-payment-amount-choice` (ou `feat/indoor-v2`, se a 02 já tiver mergeado), com a #47 na base.
