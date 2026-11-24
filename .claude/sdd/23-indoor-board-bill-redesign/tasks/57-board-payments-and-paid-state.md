# 05 — Pagamentos lançados e estado de conta paga

**Issue:** [#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 01 (#53), 02 (#54) e 04 (#56)
**Status:** pendente

## Objetivo

A conta lista os pagamentos já lançados, pelo PDV ou pelo app: forma com o ícone dela, quem pagou quando houver, quando e o valor. E, quando `is_board_paid`, a tela do celular passa ao estado de conta paga: o card quitado (02), os pagamentos que fecharam a conta e o resumo pago (04), sem nenhuma ação de pagar e sem oferecer liberar a mesa. Esta task também é a dona do mapa de glifo por forma de pagamento, que a [#24](https://github.com/sgrande-delivery/delivery-indoor/issues/24) reutiliza.

## Contexto

### Estado atual

- A 01 entrega `useBoardPayments` (`BoardPayment[]`, contrato inline lá: `value`, `person`, `created_at`, `payment_method { method, kind, mode }`), `formatBoardMoment` (`src/components/board/board-time.ts`) e o mapa de encaixe com o terceiro filho do `Body` reservado para `BoardPaymentsCard` e o ramo pago para esta task.
- **`total_paid` é Σ `value`** (`BoardMovementRepository::sumPayments`, `:203-210`), então a soma das linhas desta lista é o "Já pago" da 04, sem nenhuma conta na tela. O `tip_amount` de cada pagamento é parcela do próprio `value` e não é somado de novo.
- **A rota não ordena** (`BoardMovementPaymentRepository.php:63-68`): a lista é ordenada aqui.
- **No `delivery-client` (`feat/app-v2@ceed49a9`) está o mapa de glifo:** `src/components/checkout/payment/payment-kind-icon.ts` (`Record` explícito por `kind`, padrão `payments`, "mapa explícito, nunca cast") e `src/components/order/order-payment.ts` (`isPixMethod`: `kind === 'pix'` **ou** o nome casa `/\bpix\b/i`). O comentário de lá traz a medição que decide o desenho: no banco de dev, **130 das 133** formas de Pix offline têm `kind: 'other'`. Por `kind` sozinho, quase todo Pix sairia com o glifo de dinheiro.
- Ícones: `qr_code_2`, `credit_card`, `account_balance_wallet` e `payments` já estão na união. **Nenhum nome novo.**

### Requisitos cobertos

- **RF-07**: forma, quem pagou, quando e o valor, com o ícone da forma.
- **RF-08**: com a conta paga, a tela troca para o estado pago, com o tempo de mesa fechado (card da 02) e os pagamentos.
- **RN-11**: conta paga não libera a mesa.
- **RN-06**: a tela não presume. O estado pago sai de `is_board_paid` do servidor, e volta a aberto sozinho se o PDV excluir um pagamento (pela releitura da 06).

### Fonte de design

Artboards `Conta · celular · em aberto` (cartão "Pagamentos") e `Conta · celular · paga`, e o `design-system/components/BoardPaymentRow/README.md`.

| Onde | Texto |
|---|---|
| Título | "Pagamentos" |
| Linha | "{forma} · {pessoa}", ou só "{forma}" sem pessoa |
| Quando | "hoje às {HH:mm}", ou "{dd/MM} às {HH:mm}" em outro dia |
| Valor | `moneyFormat(value)` |

### Decisões

1. **Glifo por mapa explícito, com o Pix pelo nome.** `isPixMethod(method)` (porta) vem antes do mapa por `kind`:

   | Forma | Glifo |
   |---|---|
   | `isPixMethod` (`kind: 'pix'` ou nome com "pix") | `qr_code_2` |
   | `credit_card`, `debit_card`, `card` | `credit_card` |
   | `picpay` | `account_balance_wallet` |
   | `money`, `other`, `on_account`, `null` e qualquer `kind` novo | `payments` |

   O README cita `account_balance` para "NuPay e afins". Não há `kind` de NuPay no `PaymentMethodOptionsEnum` da v1, e mapear pelo nome seria adivinhar forma que o cadastro não diz. Fica no padrão até a #24 trazer o canal.
2. **Ordem cronológica crescente**, pela hora do pagamento: o artboard pago lista o Pix das 20:05 antes do Google Pay das 20:56. Empate fica na ordem da resposta.
3. **O valor da linha muda de tom com o estado.** Aberta: `toneOnCard.success` (o verde afastado do cartão, como no artboard aberto). Paga: `surface.ink` (o artboard pago). Uma prop `tone: 'success' | 'ink'`, que o `BoardScreen` passa.
4. **Sem pagamento, o cartão não aparece.** Na conta aberta sem pagamento, um cartão "Pagamentos" vazio é ruído, e o card de destaque já diz "R$ 0,00 pagos". Na conta paga sem pagamento (um desconto que zera o `total_due`), o cartão também não aparece.
5. **Falha só dos pagamentos fica no bloco.** Sem dado: o cartão com o título e o `InlineError` "Não foi possível carregar os pagamentos.", com retry em `refetch`. Com dado e releitura que falhou: a lista fica, e o `InlineError` vai abaixo dela. Carregando sem dado: duas linhas de skeleton de 40. A copy é **derivada**; confirmar com o dev.
6. **A tela paga do celular é o artboard `Conta · celular · paga`, nesta ordem:** o card quitado (02, a variante sai sozinha de `is_board_paid`), o cartão "Pagamentos" com valor em `ink`, e o resumo pago da 04 como cartão próprio (`variant="paid" appearance="card"`, com `itemCount` de `summarizeBoardProducts`). **Os itens não aparecem** e **não há barra de ações**: o artboard não tem nenhum dos dois. "Chamar garçom" na conta paga só existe na coluna da direita do tablet deitado (RF-19, 08).
7. **O "pelo app" do artboard não entra.** "Google Pay pelo app · Marina" supõe saber que o pagamento nasceu no app, e o contrato v1 do pagamento não tem campo que diga isso (`BoardMovementPayment.php`). Quando a #24 trouxer o canal, a linha ganha o sufixo por dado, não por suposição.
8. **O nome de quem pagou aparece também no tablet.** O `design-system/README.md` (princípio 4) diz "nem o nome de quem pagou antes" no tablet compartilhado, e a RF-19 da spec e o artboard `Conta · tablet deitado · conta paga` mostram "Pix · Rafael". Vale a spec, que é a mais nova e explícita; **a contradição fica registrada para o dev** (e para a #24, que desenha o tablet de pagamento).

### Armadilhas

- **`kind` não descreve o cadastro** (a medição dos 130 Pix como `other`). O predicado do Pix olha o nome também, e o `\b` dos dois lados evita casar "pix" dentro de outra palavra.
- **Nunca cast de dado para `IconName`:** nome fora do subset renderiza texto embaralhado, não vazio (skill `modelo-de-design`).
- **`payment_method` pode faltar** (forma apagada): a linha sai como "Pagamento", com o glifo padrão. **Derivado.**
- **A linha não oferece estornar nem editar** (README): pagamento lançado é fato, corrigir é do PDV.
- **Conta paga não é mesa liberada.** Liberada responde `is_open: false`, e o portão da #36 troca a tela por "sem mesa". O estado pago só existe com a mesa aberta.

## Mudanças

### 1. Glifo e descrição, puros

- `src/components/board/payments/payment-method-icon.ts` (novo): `isPixMethod(method: Pick<BoardPaymentMethod, 'kind' | 'method'>): boolean` e `resolvePaymentMethodIcon(method: BoardPaymentMethod | null): IconName`, pela decisão 1, com os comentários de WHY dos dois arquivos do client (a medição dos 130).
- `src/components/board/payments/describe-payment.ts` (novo): `describePaymentTitle(payment): string` ("Pix · Rafael", "Pix", "Pagamento") e `sortPaymentsByTime(payments): BoardPayment[]` (decisão 2; não muta a entrada).

### 2. Componentes

`src/components/board/payments/` (novos), um por arquivo:

- **`BoardPaymentsCard.tsx`**: `{ query: UseQueryResult<BoardPayment[]>; tone?: 'success' | 'ink' }`. Cartão com "Pagamentos" (13,5/800), e os estados da decisão 5. Lista vazia → `null` (decisão 4). O "agora" de "hoje às" sai de `useNow(60000)` (02).
- **`BoardPaymentList.tsx`** (`ul`) → **`BoardPaymentRow.tsx`** (`li`): caixa de 40 (raio 13, `surface.field`) com o glifo; título (13/600) sobre "quando" (11, `muted`, `formatBoardMoment`); valor (14/800) no tom. As linhas da paga são separadas por `surface.line`, como no artboard.
- **`payments-metrics.ts`**: as medidas acima.

### 3. A tela paga

`src/components/board/BoardScreen.tsx` (alterado), o ramo `movement.is_board_paid` do mapa de encaixe da 01:

```tsx
{movement.is_board_paid ? (
  <>
    <BoardBillCard movement={movement} />
    <BoardPaymentsCard query={payments} tone="ink" />
    <BoardTotals movement={movement} variant="paid" appearance="card" itemCount={summary.itemCount} />
  </>
) : (
  /* ramo aberto: 02, 03, 04, 06, e o BoardPaymentsCard abaixo */
)}
```

com `const summary = summarizeBoardProducts(products.data.products)`. No ramo aberto, `<BoardPaymentsCard query={payments} />` é o terceiro filho, depois do card de itens. A barra de ações (07) fica condicionada a `!movement.is_board_paid`, pelo mapa.

## Testes

**Estáticos:** `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars. `grep -rn "as IconName\|reduce(\|+ payment\|#[0-9a-fA-F]\{3,6\}\b" src/components/board/payments` não encontra nada.

**Puros (jiti):**

- `isPixMethod({ kind: 'other', method: 'PIX' })` → `true`; `({ kind: 'other', method: 'PIX - CNPJ' })` → `true`; `({ kind: 'other', method: 'Pixel Pay' })` → `false`;
- `resolvePaymentMethodIcon` → `qr_code_2` para os dois primeiros, `credit_card` para `debit_card`, `payments` para `money`, para `null` e para `kind: 'novo'`;
- `sortPaymentsByTime` com `created_at` 20:56 e 20:05 → 20:05 primeiro.

**No navegador** (harness da 01). Lançar pagamentos pelo admin (`POST /api/admin/boardMovements/{id}/payments`, com o token de admin), um com pessoa e um sem, em formas diferentes (inclusive o Pix do restaurante 1, que é `kind: 'other'`).

1. `/board?session=<aberta>` a 390 × 844. **Observar:** o cartão "Pagamentos" com uma linha por pagamento, em ordem de hora; o Pix com `qr_code_2`; "{forma} · {pessoa}" e só "{forma}" no sem pessoa; "hoje às HH:mm"; o valor em verde. A soma das linhas é o `total_paid` do GET, e é o "Já pago" do resumo.
2. Mesa aberta sem pagamento. **Observar:** nenhum cartão "Pagamentos".
3. Request blocking em `*/payments*` e recarregar. **Observar:** o cartão com "Não foi possível carregar os pagamentos." e "Tentar de novo"; o card de destaque, os itens e o resumo continuam. Tirar o bloqueio e tentar: as linhas aparecem.
4. Quitar a conta pelo admin e recarregar. **Observar:** o card "Conta paga" (02), o cartão "Pagamentos" com valores em tinta, e o resumo "Subtotal · {n} itens" / "Total pago"; sem itens e sem barra de ações; nada de liberar a mesa.
5. Excluir um pagamento pelo admin (`DELETE /api/admin/boardMovements/{id}/payments/{paymentId}`) e recarregar. **Observar:** a tela volta ao estado aberto, com "Falta pagar" de novo.
6. Liberar a mesa no PDV e recarregar. **Observar:** a tela "sem mesa" da #36, não o estado pago.

## Critérios de aceitação

- [ ] Cada pagamento mostra o glifo da forma pelo mapa explícito (Pix também pelo nome), "{forma} · {pessoa}" ou só a forma, "hoje às HH:mm" (ou a data em outro dia) e `value` em real; a lista está em ordem de hora.
- [ ] A soma das linhas confere com `total_paid`, e nenhum valor é somado no componente.
- [ ] Sem pagamento, o cartão não aparece; falha só dos pagamentos fica no bloco, com retry, e o resto da conta continua.
- [ ] Com `is_board_paid`, o celular mostra o card pago, os pagamentos e o resumo pago, sem itens e sem barra de ações, e sem oferta de liberar a mesa.
- [ ] `src/components/board/payments/payment-method-icon.ts` exporta `isPixMethod` e `resolvePaymentMethodIcon` para a #24 importar.
- [ ] Sem hex, sem ícone fora da união, nenhum arquivo de `src/theme/` ou `src/components/ui/` alterado.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- Pagar pelo app, cobrança, Pix gerado, confirmação de pagamento: #24.
- O bloco de encerramento da coluna direita do tablet deitado (RF-19), as linhas de pagamento dentro do resumo no tablet e o chip "Mesa N · paga": 08.
- O sufixo "pelo app" e o glifo de NuPay: quando a #24 trouxer o canal do pagamento.
- Estornar, editar ou excluir pagamento.

## Branch

`task/57-board-payments-and-paid-state`, base sugerida: a junção da 02 e da 04 sobre a 01 (ou `feat/indoor-v2`, se as três já tiverem mergeado). O cartão de pagamentos não depende delas e pode ser escrito antes; a composição paga precisa das duas na base.
