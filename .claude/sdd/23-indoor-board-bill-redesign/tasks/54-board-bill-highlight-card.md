# 02 — Card de destaque da conta com contador ao vivo

**Issue:** [#54](https://github.com/sgrande-delivery/delivery-indoor/issues/54)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 01 (#53)
**Status:** shipped

## Objetivo

O topo da conta passa a responder a única pergunta que o cliente tem ao abrir a tela: quanto falta pagar. O `BoardBillCard` mostra o valor que falta em destaque, o total, o já pago com percentual e barra, o estado da conta (aberta, conta pedida, paga) e o contador ao vivo de "mesa ocupada há", com a hora de abertura ao lado. Na variante paga, ele mostra o total quitado, o agradecimento e o tempo de mesa fechado ("1h 52min · 19:05 – 20:57"), e não oferece liberar a mesa.

## Contexto

### Estado atual

- A 01 entrega o `BoardScreen` com o `Body` vazio, e o mapa de encaixe dela reserva o **primeiro** filho do `Body` para este card, nos dois ramos (aberta e paga).
- O dinheiro já vem pronto: `total_due`, `total_paid` e `is_board_paid` de `GET /boardMovements/{id}` (contrato inline da 01), e o que falta e o percentual saem de `resolveAmountDue` e `resolvePaidPercent` (`src/components/board/bill-amounts.ts`, 01). **Este card não subtrai nem divide dinheiro.**
- As datas: `opened_at` (ISO, o `created_at` da movimentação), `bill_requested_at` e `paid_at` (ISO ou `null`), lidas pelos helpers de `src/components/board/board-time.ts` (01).
- Não há `use-now` no repo. O do `delivery-client` (`src/hooks/use-now.ts` @ `ceed49a9`) é um `setInterval` com `enabled` que relê o relógio ao ligar.
- Ícones: `schedule`, `check_circle` e `table_restaurant` já estão em `src/components/ui/icon-names.ts`. **Nenhum nome novo.**

### Requisitos cobertos

- **RF-01**: falta pagar como valor principal, total, já pago, percentual e estado da conta.
- **RF-02**: contador ao vivo calculado de `opened_at`, com a hora de abertura.
- **RF-08**, a parte do card: total pago e tempo de mesa fechado com o intervalo.
- **RN-01**: nenhuma aritmética de dinheiro aqui.
- **RN-11**: conta paga não libera a mesa, e o card não oferece.

### Fonte de design

Artboards `Conta · celular · em aberto` e `Conta · celular · paga`, e `design-system/components/BoardBillCard/README.md`. O protótipo é fonte de layout, hierarquia e copy. Token vem do tema em código, e na falta dele do `design-system/tokens.json`.

**Copy, literal do protótipo** (a caixa alta do rótulo é CSS, `textTransform: 'uppercase'`, e o texto-fonte fica em caixa de frase):

| Onde | Texto |
|---|---|
| Rótulo do estado, aberta | "Mesa {número} · conta aberta" |
| Rótulo do valor | "Falta pagar" |
| Total | "Total" e o valor |
| Pago | "{valor} pagos" e "{n}%" |
| Rodapé, aberta | "Mesa ocupada há", "{contador}", "desde {HH:mm}" |
| Rótulo do estado, paga | "Conta paga" |
| Linha, paga | "Tudo certo. Obrigado pela visita!" |
| Rodapé, paga | "Tempo de mesa", "{duração}", "{HH:mm abertura} – {HH:mm pagamento}" |
| Rótulo do estado, conta pedida | "Mesa {número} · conta pedida" — **derivada**, o protótipo não desenha o estado; confirmar com o dev |

### Decisões

1. **Três estados no rótulo, nesta ordem:** `is_board_paid` → paga; senão `bill_requested_at` preenchido → conta pedida; senão aberta. `bill_requested_at` já existe no contrato de hoje (o admin pede a conta pelo PDV), então o estado "conta pedida" aparece antes mesmo da ação da 07. A RN-04 da delivery-api#1610 diz que pedir a conta "não trava a conta": o card continua mostrando o que falta, e só o rótulo muda.
2. **A barra segue o DS, e não o protótipo, na cor e na altura.** O `BoardBillCard/README.md` diz "barra de progresso de 8px" e "a barra usa `primary`"; os artboards pintam 6px em `success`. Pela ordem de fontes da skill `modelo-de-design`, cor e medida vêm do DS. O texto "{valor} pagos" fica em `toneOnCard.success` (o verde afastado do cartão até 4,5:1), como no artboard. Com nada pago, a barra fica vazia e visível ("ela comunica que pagar é possível"). **Divergência com o canvas, registrada para o dev.**
3. **Contador com tique de 15 s e releitura ao voltar à aba.** O design mostra minutos, e o artboard re-renderiza a cada 30 s. O tique de 15 s atrasa no máximo um quarto de minuto. O `useNow` portado ganha a releitura no `visibilitychange` (com `removeEventListener` no cleanup), porque o navegador estrangula o `setInterval` da aba em segundo plano, e o tablet passa a maior parte do tempo com a tela apagada.
4. **Formato do contador, literal do protótipo:** abaixo de uma hora, "{m} min"; a partir dela, "{h}h {mm}min", com os minutos em dois dígitos ("1h 05min"). Valor negativo (relógio do aparelho atrás do servidor) vira "0 min".
5. **Paga sem `paid_at` não inventa o fim.** O `paid_at` é gravado na mesma regra estrita do `is_board_paid` desde `2aaf0d30d` (`BoardBillAmounts.php:46-56`), então os dois andam juntos. Se vier `null`, o rodapé do card pago não aparece.
6. **O card não conhece a ação.** Ele recebe um `action?: React.ReactNode` e o desenha entre a linha do pago e o rodapé. Quem o preenche com "Pedir a conta" é a 07. Na variante paga o espaço não existe.
7. **A forma de celular é a única desta task.** O card no tablet deitado (rótulo sem número, contador no topo à direita, sem rodapé) e no tablet em pé (duas colunas internas) é da 08, sobre este componente.

### Armadilhas

- **Hidratação.** No SSR a sessão está em `loading` e a tela é skeleton (01), então o contador nunca é renderizado no servidor. Não mover o card para fora do ramo `ready`, senão o texto do servidor e o do cliente divergem por segundos.
- **Timer eterno.** Na variante paga o contador está parado: `useNow(…, enabled: !isPaid)`, como o `enabled` do client existe para isso.
- **Percentual não é dinheiro, mas também não é soma.** É `resolvePaidPercent`, arredondado para inteiro, e nunca passa de 100 mesmo com `total_paid > total_due`.
- **Sem hex** e sem a laranja do tenant de referência: o ponto do rótulo é `primary` em runtime, pela cor do restaurante.

## Mudanças

### 1. Relógio da tela

`src/hooks/use-now.ts` (novo). Porta `src/hooks/use-now.ts` @ `ceed49a9` com o comentário de WHY que lá existe, mais o `visibilitychange` da decisão 3: ao voltar a `visible`, `setNow(new Date())`.

### 2. Duração e estado, puros

- `src/components/board/bill-card/format-duration.ts` (novo): `formatElapsed(fromMs: number, toMs: number): string`, pela decisão 4.
- `src/components/board/bill-card/bill-state.ts` (novo): `type BillState = 'open' | 'requested' | 'paid'`, `resolveBillState(movement)` pela decisão 1, e `describeBillState(state, boardNumber)` com a copy da tabela.

### 3. O card

`src/components/board/bill-card/BoardBillCard.tsx` (novo), `{ movement: OpenBoardMovement; action?: React.ReactNode }`. Escolhe a variante por `is_board_paid` e delega:

- **`BillCardOpen.tsx`** (novo), na ordem do artboard:
  - `BillStateLabel`: ponto de 8 em `primary` com halo e o rótulo em `label`/800 com `letterSpacing`, caixa alta por CSS;
  - linha de valores: "Falta pagar" (`caption`, `muted`) e o valor em display 34/800 (`typographyTokens.h1`), à esquerda; "Total" e o valor em 14/800, à direita;
  - `BillProgress`: trilho em `surface.field`, preenchimento `primary` na largura do percentual, `role="progressbar"` com `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax=100` e `aria-label` "Pago {n}% da conta";
  - linha do pago: "{valor} pagos" em `toneOnCard.success` e "{n}%" em `muted`;
  - o `action`, quando houver;
  - `BillTimeRow`, separado por `surface.line`: caixa de 34 (raio 11, `surface.field`) com `schedule`, "Mesa ocupada há" (10/800, caixa alta) sobre o contador (13,5/700), e "desde {HH:mm}" à direita. O contador usa `useNow(15000)` e `formatElapsed(opened_at, now)`.
- **`BillCardPaid.tsx`** (novo):
  - borda de 1,5 em `success` translúcido (pelo canal `success.mainChannel`, sem hex);
  - `check_circle` preenchido em `toneOnCard.success` e "Conta paga";
  - o valor em display 34/800: `total_paid`, o total quitado;
  - "Tudo certo. Obrigado pela visita!" em `body2`/`muted`;
  - a barra cheia em `success`;
  - `BillTimeRow` com "Tempo de mesa", `formatElapsed(opened_at, paid_at)` e "{abertura} – {pagamento}" (decisão 5).
- **`src/components/board/bill-card/bill-card-metrics.ts`** (novo): padding 18, raio 20, barra 8, caixa do ícone 34 e raio 11, gaps. Medida que existe no tema (raio `paper`, `controlSizes`) vem do tema.

Dinheiro por `moneyFormat` de `src/helpers/numberFormat.js`, sempre com o valor em real. Um componente por arquivo.

### 4. Encaixe na tela

`src/components/board/BoardScreen.tsx` (alterado, 01): `<BoardBillCard movement={movement} />` como primeiro filho do `Body`, no lugar do mapa de encaixe da 01. Nesta task o ramo pago ainda não existe (é da 05): o card escolhe a variante sozinho, então a variante paga já aparece na tela de hoje quando a conta quita.

## Testes

**Estáticos:** `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars de restaurante. `grep -rn "#[0-9a-fA-F]\{3,6\}\b\|toFixed\|total_due -\|- total_paid" src/components/board/bill-card src/hooks/use-now.ts` não encontra nada.

**Puros (jiti):** `formatElapsed(0, 52 * 60000)` → "52 min"; `(0, 84 * 60000)` → "1h 24min"; `(0, 65 * 60000)` → "1h 05min"; `(0, 112 * 60000)` → "1h 52min"; `(1000, 0)` → "0 min". `resolveBillState` com `is_board_paid: true` e `bill_requested_at` preenchido → `paid`.

**No navegador** (harness da 01, mesa aberta do restaurante 1), a 390 × 844:

1. Mesa sem pagamento. **Observar:** "Mesa {n} · conta aberta", "Falta pagar" igual ao `total_due`, a barra vazia e visível, "R$ 0,00 pagos" e "0%".
2. Lançar um pagamento parcial no PDV (ou `POST /api/admin/boardMovements/{id}/payments` com o token de admin) e recarregar. **Observar:** falta pagar = `total_due − total_paid` (conferir com o payload), percentual arredondado e a barra na largura dele.
3. **Contador:** anotar o `opened_at` do payload. O contador mostra o tempo desde ele, a hora "desde HH:mm" é a de abertura no fuso do aparelho, e o valor muda de minuto sem reload em até 15 s. Trocar de aba por dois minutos e voltar: o contador corrige ao voltar, sem esperar o tique.
4. Pedir a conta pelo PDV (`PATCH /api/admin/boardMovements/{id}/request-bill`) e recarregar. **Observar:** "Mesa {n} · conta pedida", e o resto do card igual.
5. Quitar a conta no PDV e recarregar. **Observar:** a variante paga, com `total_paid`, "Tudo certo. Obrigado pela visita!", a barra cheia e "Tempo de mesa {duração} · {abertura} – {pagamento}", com o fim batendo com `paid_at`. Nenhum botão de liberar a mesa.
6. Leitor de tela (VoiceOver ou NVDA): a barra é anunciada como progresso com o percentual.

## Critérios de aceitação

- [ ] O valor em destaque é `resolveAmountDue(movement)`, o total é `total_due`, e o pago é `total_paid` com `resolvePaidPercent`, sem nenhuma subtração no componente.
- [ ] O contador avança sem reload, confere com `opened_at` e corrige ao voltar à aba; com a conta paga o tique para.
- [ ] O rótulo mostra "conta aberta", "conta pedida" (com `bill_requested_at`) e "Conta paga" (com `is_board_paid`), nessa precedência.
- [ ] A variante paga mostra `total_paid`, o agradecimento e o intervalo `opened_at – paid_at`; sem `paid_at`, o rodapé não aparece.
- [ ] Com nada pago a barra fica vazia e visível; a barra tem `role="progressbar"` com o percentual.
- [ ] O card aceita `action` e o desenha só na variante aberta.
- [ ] Sem hex, sem ícone fora da união, nenhum arquivo de `src/theme/` ou `src/components/ui/` alterado.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- "Pedir a conta" e o que ela muda: 07 (o card só oferece o espaço).
- O card no tablet deitado e em pé, e o bloco de encerramento da coluna direita (RF-19): 08.
- A composição da tela paga (o que aparece abaixo do card): 05.
- Liberar a mesa, gorjeta escolhida pelo cliente ou qualquer edição de valor.

## Branch

`task/54-board-bill-highlight-card`, cortada de `origin/feat/indoor-v2` (`0aa1ac2`) em 2026-11-27, no checkout principal. É a primeira da pilha sequencial da #23, escolhida pelo dev: a #56 sai desta branch, e o PR mira a `feat/indoor-v2`.

## Implementação

**Concluída em:** 2026-11-27 (`tsc`, `eslint` e testes puros verdes; `next build` e navegador ficaram com o dev)

### Arquivos

Criados: `src/hooks/use-now.ts`; em `src/components/board/bill-card/`: `format-duration.ts`, `bill-state.ts`, `bill-card-metrics.ts`, `BoardBillCard.tsx`, `BillCardOpen.tsx`, `BillCardPaid.tsx`, `BillCardShell.tsx`, `BillStateLabel.tsx`, `BillProgress.tsx`, `BillTimeRow.tsx`.
Alterado: `src/components/board/ReadyBoardScreen.tsx` (card como primeiro filho do `Body`).

### Decisões que tomei por conta própria

- **Props `{ movement: BoardMovementDetail; boardNumber: string }` em vez de `OpenBoardMovement`.** O `ReadyBoardScreen` já lê a movimentação fresca por `useBoardMovement` (tipo `BoardMovementDetail`, `board` pode ser `null`), e o card deve mostrar o valor relido, não o congelado da sessão. O número da mesa vem do `boardNumber` que a tela já recebe. `OpenBoardMovement` continua atribuível.
- **Enquanto `movement.data` é `undefined` o card não aparece** (a tela já passou pelo skeleton de itens).
- **Componentes extras** para um por arquivo: `BillCardShell`, `BillStateLabel`, `BillProgress`, `BillTimeRow`, compartilhados pelas duas variantes. A barra recebe a largura por `style`, para não gerar uma classe por percentual.
- **Raio 20 e padding 18 em `bill-card-metrics.ts`**: o raio `paper` do tema é 18, e o DS/task pedem 20. A sombra é `elevations.sm`.
- **Borda da variante paga** como `inset box-shadow` de 1,5 em `success.mainChannel` a 0,35 (a opacidade é palpite do artboard, sem token), para não alterar o box model.
- **Halo do ponto** em `primary.mainChannel` a 0,2 com 3px, também sem token no DS.
- **Variante paga sem `opened_at` ou `paid_at` parseável** omite o rodapé inteiro; hora fora do dia corrente sai com a data (`formatBoardClock`), por consistência com o resto da conta.
- **O `Heading` "Conta paga"** usa `toneOnCard.success` para texto e ícone.
- `useNow` ganhou `refresh()` único para ligar, tique e `visibilitychange` (com `removeEventListener` no cleanup).

### Divergências

- A barra segue o DS (8px, `primary`) e não o artboard (6px, `success`), como a decisão 2; na variante paga a barra cheia é `success`, como a task pede.
- "Conta pedida" é derivada, sem desenho no protótipo: confirmar o texto com o dev.

### Verificação

- `npx next typegen && npx tsc --noEmit`: ok. `npx eslint src app scripts`: sem erros nem warnings novos.
- grep de hex, `toFixed` e subtração: nenhuma ocorrência.
- Puros via `npx jiti`: `formatElapsed` dá "52 min", "1h 24min", "1h 05min", "1h 52min" e "0 min" nos cinco casos; `resolveBillState` dá `paid`, `requested` e `open`.

### O que NÃO foi verificado

- `next build` e o roteiro de navegador (passos 1 a 6), incluindo o contador corrigindo ao voltar à aba, o leitor de tela e as medidas (espaçamento entre blocos) contra o artboard.
- A hidratação: o card só existe no ramo `ready`, mas não foi exercitado no navegador.

### Correções aplicadas em review

- `src/components/board/bill-card/BillCardPaid.tsx`: tirado o `fontSize: pxToRem(billCardMetrics.paidLineFontSize)` do `ThanksLine`, que repetia os 12px do `typographyTokens.body2` espalhado logo acima, e o `pxToRem` que ficou sem uso. Sem mudança visual.
- `src/components/board/bill-card/BoardBillCard.tsx`: o comentário dizia "Não renderiza no servidor", como se o card se protegesse sozinho. Agora diz que ele só pode ser montado no ramo `ready`, que é a restrição de verdade.

### Validação no navegador (2026-11-27, orquestrador)

Contra a delivery-api local (`master` @ `819683112`), mesa 003 do restaurante 1, a 390 × 844. A abertura foi posta 52 min atrás e os pagamentos inseridos no banco, restaurado no fim. `next build` com as vars de restaurante: exit 0.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Nada pago | "Mesa 003 · conta aberta", falta pagar R$ 96,00 = `total_due`, "R$ 0,00 pagos", "0%", barra vazia e visível com `aria-valuenow=0`, "52 min" e "desde HH:mm" |
| 2 | Contador (`page.clock`) | o tique de 15 s vira "53 min" depois de 65 s; com o relógio adiantado e um `visibilitychange`, corrige para "56 min" sem esperar o tique |
| 3 | R$ 30,00 pagos | falta pagar R$ 66,00, "R$ 30,00 pagos", "31%" e a barra em 31 |
| 4 | `bill_requested_at` | "Mesa 003 · conta pedida", e o resto igual |
| 5 | Quitada, com `paid_at` | "Conta paga", R$ 96,00, "Tudo certo. Obrigado pela visita!", barra cheia em 100 e "Tempo de mesa · 52 min · 10:52 – 11:44". Nenhum "liberar" |
| 6 | Medidas | os dois cards com raio 18 e padding 18, barra de 8, 14 acima da barra, 8 entre a barra e o pago, 14 até a régua do rodapé |
| 7 | R$ 12.345,67 a 360 px (resposta interceptada) | o total desce para a linha de baixo, alinhado à direita, e nada estoura (`scrollWidth = clientWidth`) |

18 de 18 conferências do roteiro. A mesa real, aberta em 13/10, mostra "1078h 26min · desde 13/10 13:26": a hora de outro dia sai com a data.

**Não verificado:** o leitor de tela (passo 6 da task), o tema escuro (o trilho `field` sobre o `card`) e um iPhone de verdade.

## Follow-ups identificados em review

- **Contrato do card diferente do que as próximas tasks escrevem.** A 05 (#57), a 07 (#59) e a 08 (#60) escrevem `<BoardBillCard movement={movement} />` com `OpenBoardMovement`. A 02 entregou `{ movement: BoardMovementDetail; boardNumber: string; action? }`, então todo ponto de montagem precisa passar o `boardNumber`. A #60, decisão 4, também precisa de `describeBillState` sem o número da mesa, e hoje a assinatura exige o número.
- **Skeleton do card de destaque com a barra de 6px** (`boardSkeletonMetrics.heroBar.height`, `src/components/board/board-metrics.ts:21`). A barra do card agora tem 8px (decisão 2), e o skeleton deve ter a forma do que substitui.
- **"100%" com saldo em aberto.** `resolvePaidPercent` (`src/components/board/bill-amounts.ts:24`) usa `Math.round`: numa conta de R$ 200,00 com R$ 199,00 pagos, o card mostra a barra cheia e "100%" ao lado de "Falta pagar R$ 1,00". O módulo é da 01. Limitar a 99 enquanto `resolveAmountDue > 0` resolve, se o dev concordar.
- **Rótulo do estado em `ink`, e não na cor da marca como no artboard.** O artboard pinta "Mesa 12 · conta aberta" em `--brand`. A primária do tenant como texto de 11px fica abaixo de 4,5:1 sobre o cartão, e o tema não tem tom de marca para texto. Pedir ao dev a decisão, e um token `toneOnCard` de marca para texto se ele quiser a cor.
- **Variante paga centralizada, e não alinhada à esquerda como no artboard.** O DS (`BoardBillCard/README.md`, "na conta paga o card centraliza") e o artboard `Conta · celular · paga` divergem. A implementação seguiu o DS sem registrar a divergência. Confirmar com o dev.

### Ajustes de review (2026-11-27)

- **A1:** o card usa `boardMetrics.cardRadius` (18, `componentRadii.paper`), `cardPadding` (18) e `cardShadow`; `padding` e `radius` saíram de `bill-card-metrics.ts`. Isto substitui a decisão anterior de raio 20.
- **A2:** o `gap` uniforme de 12 do `BillCardShell` saiu; os espaços são margens, do `bundle.css` (`.bpi-bill`): 14 acima da barra, 8 entre a barra e a linha do pago, 14 de margem mais 14 de padding no rodapé (acima e abaixo da régua). Rótulo para valores e valores para ação: 12 (`spacingScale.sm`); agradecimento da variante paga: 4 abaixo do valor (artboard, sem token).
- **A3:** ponto com halo de 4 a 0,15, gap 9 e `letter-spacing` 0,09em.
- **A5:** a linha de valores quebra (`flexWrap: wrap`, `minInlineSize: 0` nos dois lados, total com `marginInlineStart: auto`): num aparelho estreito com valor grande o total desce para a linha de baixo e o valor de 34px fica inteiro, sem encolher nem cortar. Medido depois no navegador (cenário 7 da validação).
- **Nit:** "Conta paga" vem só de `describeBillState('paid', '')`.
- `tsc` e `eslint` passam. Não rodei typegen, build nem dev.
