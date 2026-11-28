# 05 — Pagamentos lançados e estado de conta paga

**Issue:** [#57](https://github.com/sgrande-delivery/delivery-indoor/issues/57)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 01 (#53), 02 (#54) e 04 (#56)
**Status:** shipped

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

`task/57-board-payments-and-paid-state`, cortada de `task/58-board-realtime-socket` (`69ccdff`) em 2026-11-27, no checkout principal. É a quarta da pilha sequencial da #23 e já tem na base a 02 (#54), a 04 (#56) e a 06 (#58). O PR mira a branch da #58 até o #96 mergear, e a #59 sai desta branch.

## Implementação

**Concluída em:** 2026-11-27

### Camadas tocadas

- Novos, em `src/components/board/payments/`: `payment-method-icon.ts` (`isPixMethod`, `resolvePaymentMethodIcon`, módulo compartilhado com a #24), `describe-payment.ts` (`describePaymentTitle`, `sortPaymentsByTime`), `payments-metrics.ts`, `payments-copy.ts`, `BoardPaymentsCard.tsx`, `BoardPaymentList.tsx`, `BoardPaymentRow.tsx`.
- Alterado: `src/components/board/ReadyBoardScreen.tsx`. O encaixe é nele, e não no `BoardScreen` que a task cita: o `BoardScreen` só resolve a sessão e delega, e os blocos da #54, #56 e #58 já moram no `ReadyBoardScreen`.
- Nenhum arquivo de `src/theme/` nem de `src/components/ui/` tocado; nenhum ícone novo.

### Contratos consumidos

- `GET /boardMovements/{id}/payments` via `useBoardPayments` (já existia): `BoardPayment { id, value, person, created_at, payment_method: { id, method, kind, mode } | null }`, como tipado em `src/types/board-bill.ts`. Não reconferido na API nesta task.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- **Medidas do DS vencem a task onde divergem.** `bundle.css` (`.bpi-pay-row`) e README: caixa de ícone 38 (a task diz 40), raio 12 (task: 13), glifo 20, gap 12, padding de linha 10, forma 13/700 (task: 13/600), quando 11 `muted` com margem de 1, valor 13,5/800 (task: 14/800). Só o título do cartão (13,5/800) e o padding de 18 vêm de fora do DS: o título reaproveita `roundsMetrics` ("Itens da mesa"), e o padding é `boardMetrics.cardPadding`. O README do DS pinta o valor em `ink`; o tom `success` da conta aberta vem da task (artboard aberto), por isso a prop `tone`.
- Tipografia: `...typographyTokens.subtitle2` (forma), `.caption` (quando) e `.subtitle1` (valor), com `fontSize`/`fontWeight` sobrescritos pelas medidas do DS, para vir `lineHeight` junto. Não há token de 13/700 nem de 13,5/800.
- Raio, sombra e padding do cartão: `boardMetrics`. Valor com `whiteSpace: 'nowrap'` e `flexShrink: 0`. Sem hex.
- **Separador entre linhas (`surface.line`) em ambos os estados**, e não só no pago: o DS não define divisor, a task o põe na paga "como no artboard", e não li o artboard aberto para distinguir. Simples de restringir à paga se o dev preferir.
- **Aberta e paga com a mesma árvore `OfflineDimmed`** (follow-up da #58): na aberta, itens + pagamentos num só `OfflineDimmed` e numa só `Stack`, para o cartão ausente não deixar um vão de `gap` (um wrapper vazio ainda é item flex). Na paga, pagamentos + resumo.
- `BoardBillCard` com `{ movement, boardNumber }` (follow-up da #54). O resumo pago é `variant="paid" appearance="card" itemCount` de `summarizeBoardProducts` (follow-up da #56).
- Estado paga exige `movement.data`: sem a movimentação lida (primeiro render) a tela mostra a aberta, que é o que o servidor ainda não negou. Não há cache de `is_board_paid` por conta própria.
- Erro só dos pagamentos com dado e releitura falha: o `InlineError` some enquanto offline (`useIsOffline`), como o `refreshFailed` do `ReadyBoardScreen`; a linha de offline já cobre.
- Query ociosa (`skipToken`, sem sessão) e sem dado: o cartão não renderiza.
- Pix pelo nome também (`\bpix\b/i`), com os comentários de WHY dos dois arquivos do client, incluindo a medição dos 130 Pix `other` (2026-09-12, banco de dev do `delivery-client`). `picpay` entrou no mapa com `account_balance_wallet`, como a decisão 1.
- Nenhuma soma de dinheiro: o `Já pago` e o `Total pago` vêm de `total_paid` do servidor.

### Divergências

- A task manda o encaixe no `BoardScreen` e passa `<BoardBillCard movement={movement} />` e `summary`; o código real é o `ReadyBoardScreen`, com `boardNumber`.
- Medidas 38/12/13-700/13,5 do DS no lugar de 40/13/13-600/14 da task (acima).
- Contradição da decisão 8 (nome de quem pagou no tablet: README do DS × RF-19): o nome aparece também no tablet porque a linha é a mesma. Fica para o dev e para a #24.
- Copy "Não foi possível carregar os pagamentos." é derivada e precisa de confirmação.

### Como testar

1. Já há `next dev` do dev na porta 3468. Abrir `/board?session=<uuid>` a 390 × 844 e seguir os passos 1 a 6 da seção Testes (pagamentos lançados pelo admin, sem pagamento, bloqueio de `*/payments*`, conta quitada, exclusão de pagamento, mesa liberada).

### O que NÃO foi verificado

- Nada no navegador: nenhum passo do roteiro foi executado, nem a conferência visual contra os artboards. Sem mesa aberta exercitada aqui.
- `next typegen` e `next build` não foram rodados (pedido do dev, há `next dev` na 3468).
- Medidas do artboard `Conta · celular · paga` (separador, respiros entre os três cartões) não conferidas; os respiros usam `boardMetrics.gap`.
- Saída do `npx jiti` com alias manual (`JITI_ALIAS`), pois o jiti puro não resolve `@/`.

### Correções aplicadas em review

- `src/components/board/payments/payment-method-icon.ts`: o `ICONS_BY_KIND[method.kind] ?? DEFAULT_ICON` virou `Object.prototype.hasOwnProperty.call(ICONS_BY_KIND, method.kind)`, como o `resolveCategoryKindIcon` da #55. O `Record<string, IconName>` deixa o índice herdar do protótipo: medido no jiti, `kind: 'constructor'` devolvia uma função e `kind: 'toString'` também, e o `??` não pega nenhum dos dois. O `kind` vem de enum fechado na API, então não quebrava tela hoje, mas o módulo é compartilhado com a #24 e a assinatura promete `IconName`.
- `src/components/board/payments/BoardPaymentsCard.tsx`: `useNow(NOW_INTERVAL_MS)` virou `useNow(NOW_INTERVAL_MS, payments !== undefined && payments.length > 0)`. Sem isso o tique de 60 s rodava também com o cartão em `null` (mesa sem pagamento, query ociosa), e é para isso que o hook tem o `enabled`.
- `src/components/board/ReadyBoardScreen.tsx`: o import de `./board-summary` foi para junto dos outros `./board-*`.

### Ajustes depois do review (2026-11-27, orquestrador)

- **Respiro de baixo do cartão (achado 1).** Na última linha, `paddingBlockEnd: 0` (`BoardPaymentRow.tsx`): o padding de 18 do cartão já dá o respiro, e somado aos 10 da linha ficava 28 embaixo contra 18 em cima. Medido no navegador: 19 do topo do cartão ao texto do título (18 mais o entrelinha), e 18 da caixa do último ícone à base. As linhas medem 58 e 49 (a última sem o padding de baixo).
- **Skeleton com a forma da lista.** São caixas de 38 (a do ícone) com 20 entre elas (o padding das duas linhas vizinhas) e 14 abaixo do título. Somam os mesmos 110 da lista de duas linhas, então a troca não empurra o resumo. Isso tira o `boardSkeletonMetrics.paymentRowHeight` (40) do cartão. O skeleton da tela inteira (`BoardScreenSkeleton`, da #53) continua com o dele.

### Validação no navegador (2026-11-27, orquestrador)

Contra a delivery-api local (`master` @ `819683112`), mesa 003, a 390 × 844. Os pagamentos foram inseridos no banco com formas reais do restaurante 1 (PIX off `kind: 'pix'`, Cartão de crédito, Dinheiro), e o banco foi restaurado no fim. Resultado: 19 de 19, três rodadas seguidas.

| # | Passo da task | Resultado |
|---|---|---|
| 2 | Sem pagamento | nenhum cartão "Pagamentos" |
| 1 | Pix com pessoa (12 min atrás) e cartão sem pessoa (5 min atrás), gravados fora de ordem | Pix primeiro, `qr_code_2`, "PIX off · Rafael"; cartão com `credit_card` e sem pessoa; "hoje às HH:mm"; R$ 20,00 e R$ 15,50 em verde (`rgb(25, 131, 79)`). A soma é o `total_paid` (35,50) do GET e o "Já pago" do resumo |
| — | Offline | o cartão de pagamentos esmaece a 0,72, como o de itens |
| 3 | `*/payments*` bloqueado | "Não foi possível carregar os pagamentos." no bloco, e o card de destaque e os itens seguem. "Tentar de novo", depois de desbloquear, traz as linhas |
| 4 | Quitada (`is_board_paid`, R$ 103,99) | "Conta paga", os três pagamentos em tinta (`rgb(43, 15, 7)`), "Subtotal · 6 itens" e "Total pago"; sem itens, sem ações, nada de liberar |
| 5 | Um pagamento excluído | volta ao estado aberto, com "Falta pagar" |
| 6 | Mesa liberada | a tela "sem mesa" ("Leia o QR code da mesa"), e não a conta paga |

O Pix com `kind: 'other'` não existe no restaurante 1. O predicado pelo nome ficou coberto pelos testes puros (e pelos do review, com "Pix na entrega", "Pagamento via pix", "Pixel Pay" e "Pixpay"). **Não verificado:** o tema escuro e o leitor de tela.

## Follow-ups identificados em review

- **(média) Respiro de baixo do cartão "Pagamentos" é 28, e o de cima é 18.** O `padding` 18 do cartão soma com o `paddingBlockEnd` 10 da última linha (`.bpi-pay-row`). Nos dois artboards o cartão tem 17 nas duas bordas. O card de itens da #55 compensa a mesma soma com `cardPaddingBlockEnd: 2`. Corrigir com `'&:last-child': { paddingBlockEnd: 0 }` na linha, ou com um `paddingBlockEnd` do cartão de 18 − 10, e medir no navegador.
- **(baixa) DS e artboard divergem na linha de pagamento**, e a tela tem as duas fontes lado a lado. O `BoardPaymentRow` segue o DS (38/12, 13/700, valor 13,5/800). O `BoardItemRow` da #55 segue o artboard no preço (14/800, contra 13,5 do `.bpi-item__price`). Na conta aberta, o valor do pagamento (13,5) fica logo abaixo do preço dos itens (14). O dev precisa escolher uma fonte para a tela e levar a escolha ao `bundle.css`/README. O tom do valor por estado (`success` na aberta, `ink` na paga) também não está no DS.
- **(baixa) O skeleton da linha tem 40 e a linha real tem 58** (caixa de 38 mais 10 + 10). A troca do skeleton pelo conteúdo empurra o resumo. `boardSkeletonMetrics.paymentRowHeight` pode ir para 38 + 2 × 10, ou o skeleton pode ganhar o mesmo `paddingBlock`.
- **(baixa) A tipografia espalha um token e sobrescreve quase tudo.** `...typographyTokens.subtitle2` (12/600) com 13/700 por cima, e `...caption` com um `fontSize` 11 que já é o do token. Na prática só `fontFamily` e `lineHeight: 1.4` sobrevivem. Os cards vizinhos (`BoardItemsCard`, rounds) escrevem `fontFamily: fontFamilies.text` e o `lineHeight` da métrica. Seguir esse padrão, com `lineHeight` em `payments-metrics.ts`.
- **(observação) O artboard `Conta · celular · paga` não tem o botão de atualizar no cabeçalho**, e a implementação o mantém. Vale manter (RF-11, e RN-06: é por ele que a tela volta a aberta se o socket estiver caído e o PDV excluir um pagamento). Confirmar com o dev.
- **(observação) A decisão que a #58 deixou para "a #57 ou a #60" segue aberta:** no celular, o `OfflineDimmed` esmaece também o resumo de valores, e na conta paga também o cartão do resumo. Fica para a #60, que reescreve o mapa.
- **(nit) `resolvePaymentMethodIcon(method: BoardPaymentMethod | null)` usa só `kind` e `method`.** `Pick<BoardPaymentMethod, 'kind' | 'method'> | null`, como o `isPixMethod`, deixa a #24 chamar com outro shape de forma de pagamento sem montar `id` e `mode` falsos. Alargar o parâmetro não quebra chamador.
- **(nit) `PIX_QR` (sublinhado) não casa com `\bpix\b`**, porque `_` é caractere de palavra. É o mesmo predicado do client, então mudar aqui criaria fork. Registrar lá, se alguma forma real tiver esse nome.
