# 06 — Conclusão: cobrança pendente retomada, conta paga e erros da cobrança

**Issue:** [#66](https://github.com/sgrande-delivery/delivery-indoor/issues/66)
**Feature:** [Pagamento da conta da mesa pelo app](../spec.md) — issue #24
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 03 ([#63](https://github.com/sgrande-delivery/delivery-indoor/issues/63)); #23 — linhas 05 ([#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57), estado de conta paga no celular e no tablet em pé) e 08 ([#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60), o bloco de encerramento do tablet deitado)
**Status:** pendente
**Alinhado a #23 (#57, #60) e à #61 (2026-11-23):** a rota é `/board/payment` (#59); o bloco de encerramento do tablet deitado é da #60 (RF-19), e não da #57, que é a conta paga do celular e do tablet em pé, e a #60 entra na dependência; e a regra "a coluna não desenha o estado `paid`" saiu daqui para a #61, que cria a coluna, pelo contrato do lugar `payment` da #60. Aqui fica a confirmação por cima do encerramento (decisão 7).

## Objetivo

O que acontece fora do caminho feliz e fora da vida da página.

- **A cobrança pendente sobrevive ao reload** e ao descarte da aba pelo navegador: o aparelho que a criou guarda o `charge_id` e o `cancel_token` em `sessionStorage` e, ao voltar, retoma a espera ou mostra o desfecho que aconteceu enquanto ele estava fora.
- **As recusas da criação e da leitura** passam a ser tratadas por caso, em vez do toast genérico da 03.
- **Quando o pagamento fecha a conta**, a tela entrega o lugar ao estado de conta paga: o da #57 no celular e no tablet em pé, e o bloco de encerramento da #60 no tablet deitado.

## Contexto

### Estado atual (depois da 03)

- A tentativa vive em memória no `BoardChargeProvider` (03, decisão 1), e nada é gravado em storage (03, decisão 13). Recarregar a página com um Pix pendente perde a espera e o `cancel_token`: a cobrança continua viva no servidor, e o aparelho não sabe dela.
- A criação que falha mostra o toast "Não foi possível gerar o Pix." com "Tentar de novo", seja qual for o status (03, Fora de escopo).
- O cancelamento já trata os sete casos do contrato (03, decisão 11).
- A confirmação já diz "conta quitada" só com o saldo zerado (03, decisão 10).
- O formulário da 01 mostra o estado "Conta paga" quando `payment-options` dá o saldo zerado (01, decisão 10).
- **O precedente de storage** é a sessão da mesa da #36: `sessionStorage`, chave constante de módulo, acesso em `try/catch`, e "a URL vence" (`src/providers/board-session/entry-session.ts`). O UUID da mesa é credencial de portador e não deve viver mais que a aba (#36, decisão 1).
- **O estado da mesa** vem de `useBoardSession()` (`src/providers/board-session/BoardSessionProvider.tsx`). Mesa liberada vira `no-table`/`closed` no próximo `GET` da movimentação, e o portão troca a rota pela tela "sem mesa".

### Contrato

Da [delivery-api#1609](https://github.com/sgrande-delivery/delivery-api/issues/1609), tasks [#1636](https://github.com/sgrande-delivery/delivery-api/issues/1636), [#1641](https://github.com/sgrande-delivery/delivery-api/issues/1641) e [#1762](https://github.com/sgrande-delivery/delivery-api/issues/1762). **Não existe ainda.**

```
POST /api/client/boardMovements/{id}/charges
  valor ≤ 0                                   → 422 de validação (internal_code unprocessable_entity)
  valor acima do saldo                        → 422, internal_code próprio
  loja sem canal online habilitado            → 422, internal_code próprio
  movimentação inexistente / de outra loja    → 404, internal_code próprio
  movimentação liberada ou já paga            → 409, internal_code próprio
  acima do throttle da movimentação           → 429
  mesma Idempotency-Key com outro corpo       → 422 idempotency_key_payload_mismatch
  mesma chave em voo                          → 409 idempotency_key_in_flight, Retry-After: 1
  depois de cobrança expirada ou recusada     → 201 (nova tentativa permitida)

GET /api/client/boardMovements/{id}/charges/{chargeId}
  cobrança de outra movimentação ou loja, ou inexistente → 404
```

- **Os `internal_code` da criação ainda não têm nome.** A #1636 e a #1641 os chamam de "próprio" e deixam o nome para a execução de lá. Só os da rota de cancelamento estão nomeados (`board_charge_not_found`, `board_charge_cancel_forbidden`, `board_charge_already_paid`).
- Esta task não depende dos nomes: ela decide pelo status e **relê o estado** que o código descreve (decisão 4). Quando a #1641 publicar os nomes, a copy por código é refinamento, e não falta de implementação.
- A resposta 4xx é registrada pela idempotência e repetida para a mesma chave (#48), então depois de qualquer 4xx a tentativa seguinte nasce com chave nova (03, decisão 2).

### Requisitos cobertos

- **RF-17:** se o pagamento fecha a conta, a conta passa ao estado de conta paga. O texto da confirmação é da 03; aqui fica a passagem de lugar no tablet deitado e a volta para a conta.
- **RF-18:** sair da tela com cobrança pendente não a perde. A 03 cobre a navegação dentro da página; aqui fica o reload e o descarte da aba.
- **RF-19**, a corrida: a conta paga ou liberada por outra pessoa no meio do fluxo mostra o estado.
- **RN-01:** o servidor recusa a cobrança acima do saldo, e a tela explica com o saldo relido.
- **RN-09:** sem replay, a leitura ao voltar não é redundância.
- **Critério da spec:** "Sair da tela e voltar com cobrança pendente mostra a cobrança em andamento, não um formulário vazio."
- **Decisão pendente 2 da spec:** manter pendente e guardar por movimentação.

### Decisões

1. **O registro da tentativa, em `sessionStorage`.** A chave é `indoor:board-charge:<movementId>`, e o valor é:

   ```ts
   interface ChargeRecord {
     v: 1;
     charge_id: string;
     cancel_token: string | null;
     channel: PaymentChannel;
     split_mode: 'full' | 'equal' | 'custom';
     created_at: number;   // relógio local, para "Cobrança gerada às"
   }
   ```

   **Nada além disso:** nem nome de quem paga, nem valor (vem do `GET`), nem código Pix, nem `redirect_url`, nem token de provedor, nem dado de cartão (RN-05).

   **`sessionStorage`, e não `localStorage`.**
   - O `cancel_token` é a prova de quem criou a cobrança (RN-15 da 1609), e ele não deve viver mais que a aba nem mais que a cobrança. É o critério do `?session` na #36.
   - No tablet compartilhado, ele some quando a aba fecha e quando a cobrança termina, o que vier primeiro.
   - **Divergência de texto, não de contrato:** a #1762 da api escreve que o app apaga "do `localStorage`" o `charge_id` e o `cancel_token`. O lugar é decisão do app, e o pedido de alinhar o texto lá vai no relatório.

   O acesso fica em `try/catch`, como no `entry-session.ts` da #36. Sem storage (navegação privada, quiosque), a tentativa vale só em memória, como na 03.
2. **Quando o registro entra e quando sai.**
   - **Entra** logo depois do 201, no `start` da 03, antes de qualquer outra coisa.
   - **Sai** quando:
     - o aparelho vê um estado terminal (`paid`, `refused`, `expired` ou `canceled`), pelo socket ou pelo `GET`;
     - o cancelamento responde 202, 200, 403, 404 ou 422 (03, decisão 11);
     - o `GET` da cobrança responde 404;
     - o `dismiss` encerra a tentativa;
     - a sessão da mesa deixa de estar `ready` com motivo `not-found` ou `closed`.
   - **No boot**, todo registro `indoor:board-charge:*` de outra movimentação é removido. A URL vence, como na #36: um QR novo é outra mesa.
3. **A retomada, no boot do provider.** Com a sessão `ready` e um registro da movimentação:
   1. o provider monta a tentativa com `status: 'pending'`, `person: null` e `observedPaidAt: null`, e lê o `GET` na hora;
   2. abre a espera se a rota atual é `/board/payment`. Senão, a tentativa fica fechada, e a coluna do tablet deitado mostra o aviso da 03 ("Seu Pix de {R$} está aguardando pagamento.").

   **O que o `GET` diz decide:**

   | `GET` | Tela |
   |---|---|
   | `pending` | a espera da forma (Pix, cartão, NuPay), com o código e o `expires_at` do `GET`. "Trocar forma" funciona, porque o `cancel_token` foi guardado |
   | `paid` | a confirmação, **sem** "No nome de" e **sem** "Confirmado às": o aparelho não viu o pagamento e não sabe a hora. O resto é igual (valor, forma, falta pagar relido) |
   | `refused` | a recusa da 03, com o motivo |
   | `expired` | "Este Pix expirou", com "Gerar outro". O nome é pedido de novo (no celular vem da sacola) |
   | `canceled` | o formulário, com o toast "A cobrança foi cancelada." |
   | 404 | o registro sai, sem toast: a cobrança não existe para esta mesa |
   | 5xx ou rede | a espera, com o `InlineError` da decisão 6, e o registro fica |

   Um terminal descoberto na volta aparece **uma vez**: o registro sai na leitura, e o `dismiss` encerra.
4. **As recusas da criação, por status.** O toast genérico da 03 fica só para rede e 5xx. Os outros:

   | Resposta de `POST /charges` | O que a tela faz |
   |---|---|
   | 422 `idempotency_key_payload_mismatch` | gera chave nova e repete **uma** vez, sozinha. Se falhar de novo, cai no toast genérico |
   | 422 `unprocessable_entity` (validação) | o toast genérico. A 02 já impede valor ≤ 0, e chegar aqui é bug, que vai para o log da #38 com o `detail` |
   | 422 com outro `internal_code` (saldo ou loja sem canal, nomes da #1641) | relê `payment-options`. Se o valor resolvido passou do que falta, mostra o aviso "A conta mudou: agora falta {R$}…" da 03 e o erro do campo. Se a releitura não tem forma pagável, a tela vira o estado da RF-07 sozinha (01). Senão, o toast genérico |
   | 404 | invalida a movimentação (`boardMovementQueryKey`). O portão da #36 decide "sem mesa"; se a mesa ainda existe, o toast genérico |
   | 409 com `internal_code` diferente de `idempotency_key_in_flight` (liberada ou paga) | invalida a movimentação e `payment-options`. Liberada, o portão mostra "sem mesa"; paga, a 01 mostra "Conta paga" |
   | 429 | o toast "Muitas tentativas seguidas. Aguarde um instante e tente de novo." (**derivada**), sem ação de repetir na hora |

   Depois de qualquer 4xx, a próxima tentativa tem chave nova (03, decisão 2).
5. **A leitura da cobrança que falha durante a espera.**
   - **404:** a tentativa e o registro saem, a tela volta ao formulário, e o toast diz "Não encontramos este pagamento. Confira a conta da mesa." (**derivada**).
   - **5xx ou rede, com o objeto já em cache:** a espera continua, porque a cobrança pode ser paga do mesmo jeito.
6. **A leitura que falhou com conteúdo na tela usa o `InlineError` da #38** (`screen.isRefreshFailed`), sob a linha de "Aguardando pagamento…": "Não conseguimos atualizar o pagamento." com "Tentar de novo" (**derivada**). Ele some na primeira leitura boa.
7. **A conta paga, no tablet deitado.** Quando a releitura depois do `paid` dá o saldo zerado, a coluna da direita passa a ser o bloco de encerramento da #60 (`BoardPaidClosing`, RF-19 da #23), e não o estado "Conta paga" da 01: em paisagem, o dono do lugar é a #60, pelo contrato do lugar `payment` (decisão 4 de lá).
   - O `BoardPaymentColumn` não renderiza com o estado `paid`. A regra é da 01, que cria a coluna (decisão 10 de lá); esta task conta com ela.
   - A confirmação continua no `Overlay` por cima até "Ver a conta da mesa", que fecha o painel e deixa o encerramento da #60 à vista.

   No celular e no tablet em pé, "Ver a conta da mesa" leva para `/board`, onde a #57 mostra a conta paga.
8. **A mesa que fecha no meio do fluxo.** O `board_session_completed` vai para a sala da loja, onde o anônimo não entra (#36, armadilhas), e a mesa liberada só aparece no próximo `GET` da movimentação. Com uma tentativa aberta e a sessão saindo de `ready` (`closed` ou `not-found`), o registro sai (decisão 2), e o portão mostra "sem mesa". O Pix, se for pago, vira pagamento da conta no servidor (RN-14 da 1609), e a conta dessa movimentação não é mais desta aba.

### Copy

Todas **derivadas**, para confirmação do dev no review:

| Onde | Texto |
|---|---|
| 429 na criação | "Muitas tentativas seguidas. Aguarde um instante e tente de novo." |
| Cobrança não encontrada | "Não encontramos este pagamento. Confira a conta da mesa." |
| Leitura que falhou | "Não conseguimos atualizar o pagamento." · "Tentar de novo" |
| Retomada, `canceled` | "A cobrança foi cancelada." (a mesma da 03) |

### Armadilhas

- **A primeira leitura é desconhecida.** No SSR e na hidratação não há `sessionStorage`. O provider só lê o registro no efeito, e com a sessão `ready`. Ler antes, ou ler sem mesa, monta tentativa para a movimentação errada. O precedente é a "primeira leitura" da #36 e o `undefined` inicial do `PersonProvider` da #47.
- **O registro não é a verdade.** Ele diz que este aparelho criou uma cobrança, e nada sobre o estado dela. Todo boot lê o `GET`. Mostrar a espera só pelo registro, sem o `GET`, mostraria Pix velho como aguardando.
- **`cancel_token` em storage é segredo em storage.** Ele não vai para log (`/api/log`, `console`), para o cache do React Query nem para URL. A leitura e a escrita ficam num módulo só (`charge-record.ts`), e é o único arquivo de `src/` fora de `services/board-charge.ts` e de `providers/board-charge/` que nomeia o campo.
- **4xx registrado se repete.** Repetir a mesma chave depois de um 422 de saldo devolve o mesmo 422 para sempre, mesmo com o saldo novo. Por isso, chave nova depois de 4xx.
- **O 409 tem dois sentidos.** `idempotency_key_in_flight` é da idempotência, e a 03 o repete. Os outros 409 são da mesa. Ler o `internal_code` antes de decidir.
- **Duas abas do mesmo celular** têm dois `sessionStorage`. Cada uma acompanha a cobrança que criou, e a outra vê o aviso de pagamento em andamento pelo `amount_pending`. É o comportamento esperado.

## Mudanças

### 1. O registro

`src/providers/board-charge/charge-record.ts` (novo, puro, com o acesso em `try/catch`):

```ts
export function readChargeRecord(movementId: string): ChargeRecord | null;   // descarta registro de versão ou formato desconhecido
export function rememberChargeRecord(movementId: string, record: ChargeRecord): void;
export function forgetChargeRecord(movementId: string, chargeId?: string): void; // com chargeId, só remove se for o mesmo
export function forgetOtherChargeRecords(movementId: string): void;           // decisão 2, no boot
```

### 2. A máquina

`src/providers/board-charge/BoardChargeProvider.tsx` (alterado, criado pela 03):

- grava o registro no sucesso do `start` e o remove nos pontos da decisão 2;
- a retomada da decisão 3, num efeito que depende de `useBoardSession().status` e do `movement.id`;
- observa a saída de `ready` (decisão 8).

`src/providers/board-charge/charge-attempt.ts` (alterado): `resumeAttempt(record, isOnPaymentRoute)`, com `person: null` e `observedPaidAt: null`.

### 3. Recusas da criação e da leitura

- `src/providers/board-charge/charge-failure.ts` (novo, puro): `classifyCreateFailure(error)` → `'network' | 'server' | 'payload_mismatch' | 'validation' | 'business' | 'not_found' | 'board_closed_or_paid' | 'throttled'`, pelo status e pelo `internal_code` lido com o `readErrorCode` de `src/services/api-error-interceptor.ts` (#33);
- `BoardChargeProvider.tsx` (alterado): as reações da decisão 4 e da decisão 5;
- `src/components/board-payment/steps/ChargeRefreshFailed.tsx` (novo): o `InlineError` da decisão 6, montado nas esperas da 03, da 04 e da 05.

### 4. A conta paga no tablet deitado e a confirmação descoberta na volta

- `src/components/board-payment/BoardPaymentColumn.tsx`: **sem mudança.** Ele já devolve `null` no estado `paid` (01, decisão 10); a decisão 7 só confere que a confirmação fecha por cima do encerramento da #60.
- `src/components/board-payment/outcome/PaymentConfirmed.tsx` (alterado, criado pela 03): sem `person`, sem "No nome de"; sem `observedPaidAt`, sem "Confirmado às" (decisão 3).

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen` e `npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui, sem erro de prerender por `sessionStorage`.
4. `grep -rn "localStorage" src/providers/board-charge src/components/board-payment` não encontra nada.
5. `grep -rln "cancel_token" src` lista só `src/types/board-payment.ts`, `src/services/board-charge.ts` e arquivos de `src/providers/board-charge/`.

**No navegador**, com a base da 03 (e da 04 e da 05, se já estiverem), as fixtures da 03 no "Override content" e o DevTools aberto em Application → Session Storage.

1. **Registro.** Gerar um Pix. **Observar:** `indoor:board-charge:<uuid>` com exatamente `v`, `charge_id`, `cancel_token`, `channel`, `split_mode` e `created_at`. Nada em Local Storage.
2. **Reload na espera.** Com o `GET` pendente com código, recarregar `/board/payment`. **Observar:** um `GET` da cobrança e a mesma espera, com o QR, sem formulário vazio e sem `POST`. "Trocar forma de pagamento" faz o `POST …/cancel` com o `cancel_token` do registro.
3. **Pago com a aba fora.** Gerar, trocar o override do `GET` para `paid` e recarregar. **Observar:** a confirmação sem "No nome de" e sem "Confirmado às", e o registro removido. Recarregar de novo: o formulário (ou "Conta paga", se zerou), e não a confirmação outra vez.
4. **Expirado na volta.** Override `expired` e recarregar. **Observar:** "Este Pix expirou", com "Gerar outro Pix". No tablet, o nome é pedido de novo.
5. **Cobrança sumida.** Override do `GET` com 404 e recarregar. **Observar:** o formulário, sem toast, e o registro removido.
6. **Outra mesa.** Com um registro da mesa A, abrir `?session=<B>`. **Observar:** o registro de A removido.
7. **422 de saldo.** Override do `POST` com 422 e um `internal_code` qualquer, e o de `payment-options` com `amount_due` maior. **Observar:** a releitura de `payment-options` e o aviso "A conta mudou…". Tocar de novo: um `POST` com chave **nova**.
8. **422 sem canal.** Override do `POST` com 422, e o de `payment-options` com `channels: []`. **Observar:** o estado da RF-07.
9. **409 de mesa.** Override do `POST` com 409 e `internal_code` qualquer, e o da movimentação com `is_open: false`. **Observar:** a tela "sem mesa".
10. **429.** **Observar:** o toast sem ação de repetir, e o próximo toque com chave nova.
11. **`payload_mismatch`.** Override com 422 `idempotency_key_payload_mismatch` na primeira e 201 na segunda. **Observar:** dois `POST` com chaves diferentes e a espera.
12. **Leitura que falha.** Na espera, bloquear o `GET` e voltar o foco. **Observar:** "Não conseguimos atualizar o pagamento." sob a espera, e a espera continua. Desbloquear e tocar "Tentar de novo": a linha some.
13. **Conta quitada no tablet deitado, 1180 × 820.** Pago com a releitura dando saldo zero. **Observar:** a confirmação no painel e, por baixo, a coluna da direita já com o bloco de encerramento da #60. "Ver a conta da mesa" fecha o painel.
14. **Mesa liberada no meio.** Na espera, liberar a mesa no PDV e voltar o foco. **Observar:** a tela "sem mesa" e o registro removido.
15. **Sem storage.** Numa janela anônima com o storage bloqueado (DevTools → Application → Storage → "Block"), gerar e navegar. **Observar:** a 03 funciona em memória, e nada quebra.

## Critérios de aceitação

- [ ] O registro em `sessionStorage` tem exatamente `{ v, charge_id, cancel_token, channel, split_mode, created_at }`, por movimentação, e nada vai para `localStorage`.
- [ ] O registro sai em todo ponto da decisão 2, inclusive na troca de mesa e na mesa que fecha.
- [ ] Recarregar com uma cobrança pendente mostra a mesma espera depois do `GET`, e "Trocar forma" ainda cancela.
- [ ] O desfecho descoberto na volta aparece uma vez, sem "No nome de" e sem "Confirmado às".
- [ ] As respostas de `POST /charges` seguem a tabela da decisão 4: o 422 de negócio relê o saldo, o 404 e o 409 de mesa invalidam a movimentação, e o 429 não repete na hora. A chave é nova depois de qualquer 4xx.
- [ ] O 404 do `GET` encerra a tentativa, e a falha de rede do `GET` mantém a espera com o `InlineError`.
- [ ] No tablet deitado, com a conta quitada, a coluna é o encerramento da #60, e a confirmação fecha por cima dele.
- [ ] O `cancel_token` só aparece em `src/types/board-payment.ts`, `src/services/board-charge.ts` e `src/providers/board-charge/`, e nunca em log, cache ou URL.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **A copy por `internal_code` da criação:** depende dos nomes que a #1641 vai publicar. A decisão 4 trata pelo status e pela releitura. Quando os nomes saírem, a frase específica de cada código entra como refinamento.
- **Guardar a tentativa além da aba** (`localStorage`, quiosque): decisão 1 e frente de PWA.
- **Listar as cobranças pendentes de outros aparelhos:** não há rota (RN-05 da delivery-socket-api#66). O aviso é o agregado `amount_pending` (01).
- **O estado de conta paga da conta** (#57, celular e tablet em pé) e o bloco de encerramento do tablet deitado (#60). Aqui só a passagem do lugar.
- **Detectar a mesa liberada em tempo real:** o anônimo não recebe o `board_session_completed` (#36).
- **Devolução, ou o aviso de cobrança confirmada que estourou o saldo** (`paid` sem `board_payment_added`, #1640): o app não tem como saber, e a superfície disso é do PDV.

## Branch

`task/66-board-charge-resume-errors`, base sugerida: `task/63-board-pix-charge-wait` (ou `feat/indoor-v2`, se a 03 já tiver mergeado), com a #57 e a #60 na base para o passo 13. Corre em paralelo com a 04.
