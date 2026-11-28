# 04 — Resumo de valores da conta

**Issue:** [#56](https://github.com/sgrande-delivery/delivery-indoor/issues/56)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 01 (#53)
**Status:** shipped
**Alinhado à spec da #23 e à skill `contratos-externos` (2026-11-23):** as duas passaram a dizer que o `discount` vem no `GET /boardMovements/{id}`; nada muda nesta task, que já lia `movement.discount`.

## Objetivo

A conta ganha o único lugar onde o cliente confere a aritmética: o `BoardTotals`, com subtotal, taxa de serviço com o percentual, desconto quando houver, total da conta, já pago e falta pagar, todos lidos prontos de `GET /boardMovements/{id}`. Na conta paga, o mesmo bloco mostra subtotal com a contagem de itens, a taxa e o total pago. O bloco aceita trocar a linha agregada "Já pago" por linhas de pagamento, que é o que o tablet desenha (08).

## Contexto

### Estado atual

- Os valores da movimentação já estão no contexto da sessão (`movement`, `OpenBoardMovement`), com o contrato inline da 01: `subtotal`, `tip_pct` (int), `tip_amount`, `discount`, `total_due`, `total_paid` e `is_board_paid`, em real. O que falta pagar é `resolveAmountDue` (`src/components/board/bill-amounts.ts`, 01).
- **A aritmética fecha no servidor.** `total_due = max(0, subtotal − discount) + tip_amount` (`BoardBillAmounts.php:28-36`, desde `2aaf0d30d`). A tela exibe as parcelas e o total como vieram, e quem confere a conta faz a soma de cabeça, que é o critério de aceite da spec.
- **O desconto vem no GET.** A RN-01 da spec e a skill `contratos-externos` diziam que ele só vem em `/products`, e foram corrigidas em 2026-11-23; o `design-system/components/BoardTotals/README.md` ainda diz (01, "Divergências"). Esta task lê `movement.discount`, e não o `discount` de `/products`, para o total e as parcelas saírem da mesma resposta.
- **O molde é o `OrderTotals` do `delivery-client`** (`src/components/order/detail/OrderTotals.tsx` @ `ceed49a9`): parcelas em `muted`/`ink`, desconto em verde com "− ", total em display, e "as condicionais são sobre o valor, não sobre `null`". Lá os valores são centavos e saem por `formatCents`; aqui são reais e saem por `moneyFormat` (`src/helpers/numberFormat.js:23-33`).
- O mapa de encaixe da 01 põe este bloco em dois lugares: como `footer` do `BoardItemsCard` (03) no ramo aberto, e como cartão próprio no ramo pago (posto pela 05).

### Requisitos cobertos

- **RF-06**: subtotal, taxa com o percentual, desconto quando houver, total da conta, já pago e falta pagar.
- **RF-08**, a parte do resumo pago.
- **RN-01** e **RN-08**: nenhum total calculado no componente; real formatado por um helper só.
- Decisão pendente 1 da spec (taxa zero), com o default.

### Fonte de design

Artboards `Conta · celular · em aberto` (rodapé do card de itens) e `Conta · celular · paga` (cartão "Subtotal · 7 itens"), e o `BoardTotals/README.md`.

| Linha | Texto | Valor |
|---|---|---|
| Subtotal | "Subtotal" | `subtotal` |
| Taxa | "Taxa de serviço ({tip_pct}%)" | `tip_amount` |
| Desconto | "Desconto" | "− " + `discount`, em `toneOnCard.success` |
| Total | "Total da conta" | `total_due`, display |
| Pago | "Já pago" | "− " + `total_paid`, em `toneOnCard.success` |
| Falta | "Falta pagar" | `resolveAmountDue(movement)`, display, em cor de marca |
| Subtotal, paga | "Subtotal · {n} itens" | `subtotal` |
| Total, paga | "Total pago" | `total_paid`, display, em `toneOnCard.success` |

"Desconto" não está nos artboards da conta. A palavra é a do `OrderTotals` do client, e o README do componente pede a linha.

### Decisões

1. **A taxa some quando não há taxa, e o critério é o valor.** A decisão pendente 1 da spec diz "esconder quando `tip_pct` é zero". Mas `tip_amount` é coluna própria da movimentação (`PUT /boardMovements/{id}` do admin muda os dois), e esconder uma taxa de valor positivo faria a soma da tela não fechar com o total. Então: `tip_amount > 0` mostra a linha; com `tip_pct > 0` o rótulo leva o percentual, e com `tip_pct` zero o rótulo é só "Taxa de serviço". `tip_amount` zero esconde a linha, com qualquer percentual.
2. **"Já pago" some quando nada foi pago.** "Já pago − R$ 0,00" é ruído, pela mesma regra do desconto. Sem pagamento, o "Falta pagar" é igual ao total, e as duas linhas continuam visíveis: o README pede "Falta pagar" repetindo o card "de propósito".
3. **O total pago é `total_paid`.** No estado pago o design mostra um número só, "Total pago". `total_paid ≥ total_due` é a definição de `is_board_paid`, e o que foi pago é o fato que a tela mostra. Não há "troco" nem "excedente" nesta tela.
4. **Duas aparências do mesmo bloco.** `appearance: 'footer'` é o rodapé do card de itens (borda superior `surface.line`, sem cartão próprio, padding 15/17); `appearance: 'card'` é o cartão branco próprio do estado pago. As linhas são as mesmas.
5. **As linhas de pagamento entram por prop.** `paidRows?: React.ReactNode` substitui a linha "Já pago" quando vem. É o que o tablet (artboards `Conta · tablet em pé` e `Conta · tablet deitado`) desenha: uma linha por pagamento ("Pix · Rafael · 20:05  − R$ 60,00"). Quem monta as linhas é a 08, com o formatador da 05. Assim esta task não depende da 05.
6. **"Falta pagar" na cor de marca de texto** (`theme.vars.palette.brand.text`, a mesma do `InlineError`), e não `primary.main`: o artboard pinta `--brand`, e o token de texto da marca é o que passa contraste sobre o cartão em qualquer tenant.

### Armadilhas

- **Condição sobre o valor, não sobre `null`** (aprendizado do `price: 0` do client). Os campos da movimentação nunca vêm nulos; `discount > 0`, `tip_amount > 0` e `total_paid > 0` são os testes.
- **`moneyFormat` recebe real.** Não passar valor de `/products` em centavo (`unit_price`) nem chamar `formatCents` (o de centavos da #40) aqui.
- **O sinal de menos é "− " (U+2212 e espaço)**, como no `OrderTotals`, e não hífen.
- **Semântica:** a lista de parcelas é um `dl` (`dt` rótulo, `dd` valor), para o leitor de tela ler "Subtotal, R$ 141,30".

## Mudanças

### 1. Copy e métricas

- `src/components/board/totals/totals-copy.ts` (novo): os rótulos da tabela e `formatTipLabel(tipPct: number): string`.
- `src/components/board/totals/totals-metrics.ts` (novo): fontes (13 nas parcelas, 13,5/700 no rótulo do total, display 22/800 no total e 24/800 no falta pagar), gaps (9), paddings das duas aparências. Medida que existe no tema vem do tema.

### 2. Componentes

`src/components/board/totals/` (novos):

- **`BoardTotals.tsx`**:

  ```ts
  export interface BoardTotalsProps {
    movement: OpenBoardMovement;
    variant?: 'open' | 'paid';
    appearance: 'footer' | 'card';
    /** Só no pago: "Subtotal · {n} itens". */
    itemCount?: number;
    /** Substitui a linha agregada "Já pago" (tablet, 08). */
    paidRows?: React.ReactNode;
  }
  ```

  - **`open`**: Subtotal; Taxa (decisão 1); Desconto (`discount > 0`); a linha de total "Total da conta", com borda superior; `paidRows`, ou "Já pago" (decisão 2); a linha final "Falta pagar", com borda superior.
  - **`paid`**: "Subtotal · {describeItemCount(itemCount)}" (`src/components/board/board-summary.ts`, 01), ou "Subtotal" sem `itemCount`; Taxa; Desconto; "Total pago".
- **`BoardTotalsRow.tsx`**: uma parcela (`dt`/`dd`), com tom `default` ou `positive`.
- **`BoardTotalsEmphasis.tsx`**: a linha de destaque (total, falta pagar, total pago), com borda superior e valor em display.

### 3. Encaixe na tela

`src/components/board/BoardScreen.tsx` (alterado): `footer={<BoardTotals movement={movement} appearance="footer" />}` no `BoardItemsCard` do ramo aberto, pelo mapa de encaixe da 01. Se a 03 ainda não estiver na base, o bloco entra como filho do `Body` logo depois do card de destaque, e a junção o move para o `footer` (conflito de linha vizinha, resolvido pelo mapa). O ramo pago é da 05, que usa `variant="paid" appearance="card"`.

## Testes

**Estáticos:** `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars. `grep -rn "subtotal +\|+ tip_amount\|- discount\|total_due -\|formatCents\|#[0-9a-fA-F]\{3,6\}\b" src/components/board/totals` não encontra nada.

**No navegador** (harness da 01). Em cada passo, abrir a resposta de `GET /boardMovements/{id}` no Network e conferir os números contra ela.

1. Mesa com itens, taxa de 10% e sem pagamento, a 390 × 844. **Observar:** "Subtotal" = `subtotal`; "Taxa de serviço (10%)" = `tip_amount`; nenhuma linha de desconto; "Total da conta" = `total_due`; nenhuma linha "Já pago"; "Falta pagar" = `total_due`. Conferir de cabeça: subtotal + taxa = total.
2. Lançar um pagamento parcial e recarregar. **Observar:** "Já pago − {total_paid}" e "Falta pagar" = total − pago, igual ao valor do card de destaque (02).
3. Pedido com desconto (o desconto de pedido do PDV, ou um pedido v1 com `discount`). **Observar:** "Desconto − {discount}", e subtotal + taxa − desconto = total.
4. Loja sem taxa (`tip_pct` 0 e `tip_amount` 0, pelo `PUT /api/admin/boardMovements/{id}`). **Observar:** a linha da taxa não aparece. Com `tip_amount` positivo e `tip_pct` 0, a linha aparece como "Taxa de serviço", sem percentual.
5. Quitar no PDV e recarregar (com a 05 na base, ou pela variante montada à mão no sandbox de dev). **Observar:** "Subtotal · {n} itens", a taxa, e "Total pago" = `total_paid`, em verde.
6. Leitor de tela: cada parcela é lida como rótulo e valor.

## Critérios de aceitação

- [ ] Subtotal + taxa − desconto = total da conta, e total − pago = falta pagar, conferidos contra o payload, com todos os números lidos da movimentação e o falta pagar por `resolveAmountDue`.
- [ ] A taxa aparece com `tip_amount > 0`, com o percentual quando `tip_pct > 0`, e some com `tip_amount` zero.
- [ ] O desconto aparece só com `discount > 0`, lido de `GET /boardMovements/{id}`; "Já pago" aparece só com `total_paid > 0`.
- [ ] A variante paga mostra "Subtotal · {n} itens", a taxa e "Total pago" = `total_paid`.
- [ ] `paidRows` substitui a linha "Já pago", e as duas aparências (`footer` e `card`) têm as mesmas linhas.
- [ ] Dinheiro só por `moneyFormat`; sem hex; nenhum arquivo de `src/theme/` ou `src/components/ui/` alterado.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- As linhas de pagamento do tablet (`paidRows`) e a posição do bloco no tablet deitado: 08.
- A lista "Pagamentos" do celular e a composição da tela paga: 05.
- Remover a taxa, escolher gorjeta ou dividir a conta: decisão de salão, feita no PDV (RN-12 da #24).
- Corrigir o `BoardTotals/README.md` e a skill `contratos-externos` quanto ao desconto: follow-up de doc.

## Branch

`task/56-board-bill-totals`, cortada de `task/54-board-bill-highlight-card` (`c16078d`) em 2026-11-27, no checkout principal. É a segunda da pilha sequencial da #23: o PR mira a branch da #54 até o #94 mergear, e a #58 sai desta branch.

## Implementação

**Concluída em:** 2026-11-27

### Camadas tocadas

- `src/components/board/totals/` (novos): `BoardTotals.tsx`, `BoardTotalsRow.tsx`, `BoardTotalsEmphasis.tsx`, `totals-copy.ts`, `totals-metrics.ts`
- `src/components/board/ReadyBoardScreen.tsx`: `footer` do `BoardItemsCard` (a 03/#55 já está na base)

### Contratos consumidos

- `GET /boardMovements/{id}` (`BoardMovementDetail`): `subtotal`, `tip_pct`, `tip_amount`, `discount`, `total_due`, `total_paid`. O "falta pagar" sai de `resolveAmountDue`. Nenhuma soma no componente.

### Variáveis de ambiente novas

- nenhuma

### Decisões que tomei por conta própria

- `movement` do bloco é `BoardMovementDetail` (não `OpenBoardMovement`, como a task escrevia), e a fonte é `useBoardMovement`, a mesma do card de destaque da #54: os dois mostram o mesmo número. O bloco só aparece quando `movement.data` existe.
- Medidas: o respiro vem do `bundle.css` (`.bpi-totals__row` padding-block 5, que dá 10 entre linhas; `--strong` margin-top 8 / padding-top 12; card padding 16). Padding do footer 15/17 e fontes do total (22) e do falta pagar (24) vêm da task/artboard; o bundle diz 19 para o total, e segui a task. Rótulo do destaque 13,5/700 da task. Raio e sombra do `appearance="card"` vêm de `boardMetrics`. Não achei o canvas no repo, então não medi o artboard.
- Estrutura: o `dl` é a raiz, e cada linha é um `div` com `dt`/`dd` (HTML válido). `BoardTotalsEmphasis` ganhou `tone` (`ink`/`brand`/`success`) e `valueFontSize`.
- No footer, a borda superior é da raiz do bloco; nos destaques, a borda é a de cada linha.

### Como testar

1. `yarn dev`, `/?session=<uuid>` a 390 × 844, e conferir contra o Network os passos 1 a 4 da seção Testes.

### O que NÃO verificado

- Nada no navegador (`next dev` é do dev). Variante `paid`/`card` e `paidRows` sem consumidor ainda (05 e 08). Espaçamento não medido. `next build` não rodado, por pedido.
- Passou: `npx tsc --noEmit`, `npx eslint src app scripts` (só o aviso de versão do React) e o grep da seção Testes, sem ocorrências.

### Correções aplicadas em review

- `src/components/board/totals/totals-metrics.ts:1`: o comentário citava "a task #56"; passa a citar a fonte da medida (o `.bpi-totals` do `bundle.css` e o artboard `Conta · celular · em aberto`). Comentário não referencia task.
- `src/components/board/totals/BoardTotals.tsx:21`: o JSDoc do `paidRows` dizia "(tablet, 08)"; passa a "pelas linhas de pagamento do tablet", sem o número da task.

## Follow-ups identificados em review

- **O `BoardTotals/README.md` do DS ainda diz que o `discount` não vem no `GET /boardMovements/{id}` e que `total_due = subtotal + tip_amount`.** O contrato de hoje é `max(0, subtotal − discount) + tip_amount`, com `discount` no GET (spec, RN-01, corrigida em 2026-11-23). Vale também para a skill `contratos-externos`, se ela ainda disser o mesmo. A task já punha isso em "Fora de escopo" como follow-up de doc, mas não o registrava aqui.
- **O DS não descreve o que a tela usa:** a aparência `footer` (o resumo como rodapé do card de itens, sem cartão próprio), o "Falta pagar" em `brand.text` (o preview do `bundle.css` pinta as duas linhas `--strong` em `ink`) e o desconto em `toneOnCard.success` (o preview o pinta em `ink`). Levar as três ao `README.md` e ao `bundle.css` do `BoardTotals`, para o DS deixar de divergir da implementação. Se o dev quiser o "Falta pagar" maior que o total, como em todos os artboards, a mudança também entra primeiro no DS, com `typographyTokens.h2`.
- **Skeleton do card de itens sem a forma do resumo** (`src/components/board/BoardScreenSkeleton.tsx:72-85`). O card real agora termina com cinco a seis linhas de valores, e o skeleton termina na terceira linha de item. RF-18 pede skeleton na forma dos blocos.
- **Para a 08 (#60): o que entra em `paidRows` precisa ser filho válido de `dl`.** O `BoardTotals` é um `dl`, e cada linha é `div` com `dt`/`dd`. O `BoardTotalsPaymentLines` não pode ser `ul`/`li`: tem de renderizar grupos `div > dt + dd`, de preferência reusando o `BoardTotalsRow` (tom `positive`). Atenção também ao `paidRows ?? …`: um elemento JSX nunca é nulo, então, se o `BoardTotalsPaymentLines` devolver `null` (sem dado ou com falha), a linha agregada "Já pago" não volta, e "Total − pago = Falta pagar" deixa de fechar na tela. A decisão 2 da 08 já muda a regra (`TabletOnly`/`PhoneOnly`). Ela precisa cobrir esse caso.

### Ajustes de review

Isto substitui o que "Decisões que tomei por conta própria" diz sobre fonte (22 e 24, rótulo 13,5, `valueFontSize`) e sobre o padding do rodapé (15/17), e o "O que NÃO verificado": a validação no navegador está logo abaixo.

- **Fonte do destaque:** valor com `...typographyTokens.h3` (DS: `.bpi-totals__row--strong > b` display 19/800, lineHeight 1,2, letterSpacing -0,01em), nos três destaques; saíram o 22 e o 24. Rótulo do destaque 13 (`.bpi-totals__row--strong` herda 13 da `__row`).
- **Padding de baixo da linha forte:** `paddingBlockEnd` 5 (`.bpi-totals__row` mantém o `padding-bottom`), o que dá 10 até "Já pago".
- **Padding de bloco do rodapé:** alvo de 15 de respiro visual. Em cima 15 − 5 (padding da primeira linha) = 10; embaixo 15 − 5 (última linha) − 2 (`roundsMetrics.cardPaddingBlockEnd` do `BoardItemsCard`) = 8.
- **Padding inline do rodapé:** `roundsMetrics.cardPaddingInline` (17), que alinha com as linhas de item.
- **Valor não quebra:** `whiteSpace: nowrap` e `flexShrink: 0` nos `dd` das duas linhas; sai da lista de follow-ups.
- **Gap horizontal:** `totalsMetrics.labelValueGap` (10), usado nas duas linhas (era `rowPaddingBlock * 2`). O nome evita a leitura de `row-gap` do CSS, que é o espaço vertical (nit do re-review).
- **O 10 e o 8 do rodapé são a conta escrita com as constantes** (`FOOTER_BREATH − ROW_PADDING_BLOCK` e `− roundsMetrics.cardPaddingBlockEnd`), para o respiro não mudar em silêncio se uma delas mudar (nit do re-review).
- Verificação: `tsc` e `eslint` rodados de novo. Re-review: aprovado.

### Validação no navegador (2026-11-27, orquestrador)

Contra a delivery-api local (`master` @ `819683112`), mesa 003 do restaurante 1, a 390 × 844. Taxa, desconto e pagamento foram gravados no banco, que foi restaurado no fim. Cada linha do `dl` foi conferida contra o `GET /boardMovements/{id}` da mesma hora. Resultado: 15 de 15.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Taxa de 10% (`tip_amount` 9,60), sem pagamento | Subtotal R$ 96,00, "Taxa de serviço (10%)" R$ 9,60, sem desconto, "Total da conta" R$ 105,60 = `total_due`, sem "Já pago", "Falta pagar" R$ 105,60 |
| 2 | R$ 30,00 pagos | "Já pago − R$ 30,00" e "Falta pagar" R$ 75,60, o mesmo do card de destaque |
| 3 | `discount` 5 num pedido da mesa | "Desconto − R$ 5,00", e subtotal + taxa − desconto = total (R$ 100,60) |
| 4 | `tip_amount` 0 / `tip_pct` 0 com `tip_amount` 4 | a linha some / "Taxa de serviço" R$ 4,00, sem percentual |
| 5 | Medidas | padding do `dl` 10/17/8; `dd` em 13/700 nas parcelas e 19/800 nos destaques; `nowrap` em todos; o texto fica a 12-13 entre linhas e a 27 através das réguas (os dois incluem o meio-entrelinha); a 17 da régua de cima e a 16 da borda de baixo |
| 6 | Semântica | todas as linhas são `dt` + `dd` |

`next build` com as vars de restaurante: ver o relatório do ship. **Não verificado:** a variante paga (sem consumidor até a 05), o tema escuro e o leitor de tela.
