# 08 — Conta no tablet: duas colunas deitado e barra fixa em pé

**Issue:** [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 02 (#54), 03 (#55), 04 (#56), 05 (#57) e 07 (#59); e a task 01 da #21 ([#40](https://github.com/sgrande-delivery/delivery-indoor/issues/40)), pelos cortes de orientação
**Status:** shipped
**Alinhado a #24 (#61, #63, #66) (2026-11-23):** o lugar `payment` da coluna direita tem um contrato só, escrito aqui e seguido pela #61 e pela #66 (decisão 4); a frase offline passa a ser de quem ocupa o lugar, e não do `BoardBillAside`; e a frase "O garçom já foi avisado" do encerramento sai por default, como a da confirmação da #63, porque a premissa medida não se sustenta (decisão 9).

## Objetivo

A conta assume os dois formatos de tablet sem virar "o celular grande". **Deitado**, os itens ficam à esquerda e o bloco de conta e pagamento à direita, cada coluna com rolagem própria e a página parada. **Em pé**, é uma coluna só, com a barra de ações fixa embaixo. Com a conta quitada no tablet deitado, a coluna da direita vira o bloco de encerramento: "Conta paga", o total quitado, os pagamentos com forma, nome e hora, e "Chamar garçom". O chip da mesa na barra superior passa a "Mesa N · paga". O lugar do painel de pagamento da #24 fica pronto na coluna da direita.

## Contexto

### Estado atual

- **O shell já é de tablet.** O `AppShell` troca o cromo por CSS em `tabletShellMediaQuery` (`src/components/shell/shell-metrics.ts:3`, `(min-width: 744px) and (min-height: 600px)`). No tablet, a `TableTopBar` de 72px fica fixa, a navegação inferior some, e o `Scroller` tem altura definida e não tem padding (`src/components/shell/AppShell.tsx:16-26,56-65`). A conta preenche o `Scroller` com `blockSize: 100%` (01), então duas colunas com rolagem própria não rolam a página.
- **Os cortes de orientação chegam pela #40** (task 01 da #21): `tabletLandscapeMediaQuery = `${tabletShellMediaQuery} and (orientation: landscape)`` e `tabletPortraitShellMediaQuery = `${tabletShellMediaQuery} and (orientation: portrait)``, no mesmo `shell-metrics.ts`. **Esta task os importa e não declara corte nenhum.** Se a #40 não estiver na base, a base desta task é a branch dela, como na #49. Desktop (≥ 1024 e deitado) recebe a composição do tablet deitado: "em estado nenhum o tablet deitado se distingue do desktop" (#38).
- O que as outras tasks entregaram e esta recompõe:
  - o `BoardScreen` com o mapa de encaixe da 01;
  - o `BoardBillCard` da 02, na forma de celular;
  - o `BoardItemsCard` da 03;
  - o `BoardTotals` da 04, com `paidRows`;
  - o `BoardPaymentsCard`, o `BoardPaymentRow` e a composição paga da 05;
  - o `BoardActionBar`, o `PayBillButton`, o `OrderMoreButton` e o `ConnectedWaiterCallButton` da 07;
  - o `BoardScreenSkeleton` de celular da 01.
- **O chip da mesa** é `{ kind: 'ready'; label }` (`src/components/shell/TableTopBar.tsx:22-26,148-153`), montado em `AppShell.tsx:107-108` como `Mesa ${board.number}`.
- **A sacola do tablet não acopla na conta** (#49: "`/board` não entra: a conta tem as duas colunas dela").
- **A #24 mora na coluna da direita no tablet deitado** (RF-10a de lá: "em paisagem ele é a coluna da direita da conta"), e num `Sheet` no tablet em pé.

### Requisitos cobertos

- **RF-17**: deitado, duas colunas com rolagem própria; em pé, coluna única com a barra de ações fixa embaixo.
- **RF-19**: conta quitada no tablet deitado, com o bloco de encerramento à direita, os itens legíveis à esquerda e o chip "Mesa N · paga". Nada de pagar.
- **RF-11** e **RF-18**, na forma de tablet: o "atualizar" no cabeçalho da coluna de itens, e o skeleton das duas colunas do artboard `Estado · carregando`.
- Decisão pendente 2 da spec (pagar no tablet deitado fica na coluna direita, abaixo do card), com o default.

### Fonte de design

Artboards `Conta · tablet deitado` (`Main.dc.html`), `Conta · tablet em pé`, `Conta · tablet deitado · conta paga`, `Estado · carregando (skeleton)` e `Estado · offline`, e o `design-system/README.md`, "Os três formatos". O desktop (`Conta · desktop 1440`) é referência da coluna direita (pagar e "Pedir mais" abaixo do card), e não um terceiro layout.

| Onde | Texto |
|---|---|
| Rótulo do card, deitado | "Conta aberta" (sem número: a barra mostra a mesa) |
| Pago, deitado e em pé | "{valor} pagos" e "de {total}" |
| Contador, em pé | "Mesa ocupada há **{contador}** · desde {HH:mm}" |
| Linha de pagamento no resumo | "{forma} · {pessoa} · {HH:mm}" e "− {valor}" |
| Botão de garçom da barra em pé | "Garçom" |
| Encerramento | "Conta paga"; "{valor} quitados. A mesa pode ser liberada." (o artboard diz "{valor} quitados. O garçom já foi avisado e a mesa pode ser liberada."; o trecho do garçom sai por default, decisão 9); "Pagamentos"; "{HH:mm} · confirmado"; "Chamar garçom"; "Precisa de nota fiscal? Peça no caixa." |
| Cabeçalho dos itens, paga | "{n} pedidos · {m} itens · encerrada às {HH:mm}" |
| Chip da barra, paga | "Mesa {n} · paga" |

### Decisões

1. **Um DOM só, e o formato por CSS.** O `BoardScreen` passa a ter, dentro do `Body`, duas regiões: `BoardBillAside` (o card e o bloco de pagar) e `BoardBillMain` (o card de itens com o resumo, e o de pagamentos). No celular e em pé, o `Body` é uma coluna que rola, com o aside primeiro (o card fica no topo, como no artboard). Deitado, o `Body` vira grade `minmax(0, 1fr) 440px`, com gap 22 e padding 22/28, sem rolagem; o main vai para a primeira coluna e o aside para a segunda, cada um com `overflowY: auto`. Sem `useMediaQuery` para layout, como o `AppShell` faz: o primeiro paint no tablet não pisca a forma do celular. O que só existe num formato vai em `PhoneOnly`, `TabletOnly`, `LandscapeOnly` e `NotLandscape` (`display: none` fora do formato), e o leitor de tela não lê o que está escondido.
2. **Os pagamentos, no tablet, ficam dentro do resumo.** Os dois artboards de tablet não têm cartão "Pagamentos": cada pagamento é uma linha do resumo ("Pix · Rafael · 20:05  − R$ 60,00"). No tablet, o `BoardPaymentsCard` sai (`PhoneOnly`), e o `paidRows` da 04 recebe `BoardTotalsPaymentLines`. A regra do `paidRows` muda: em vez de substituir a linha "Já pago" em todo formato, ele vale no tablet, e a linha agregada no celular (`TabletOnly`/`PhoneOnly` dentro do `BoardTotals`).
3. **A ordem do resumo é a do tablet em pé e a do desktop**: Subtotal, Taxa, Desconto, Total da conta, os pagamentos, Falta pagar. O artboard deitado põe a linha do Pix antes do total e omite o "Falta pagar", e o README do `BoardTotals` pede o "Falta pagar" repetido "de propósito". **Divergência com o canvas deitado, registrada.**
4. **A coluna direita deitada:** o card na forma deitada (rótulo "Conta aberta", contador no alto à direita, "pagos / de" à direita do valor, a barra, sem o rodapé de "mesa ocupada"), e abaixo dele o lugar do pagamento e o `OrderMoreButton` (como no desktop). O "Pedir a conta" da 07 continua no card. **O lugar do pagamento é da #24, e o contrato dele é este** (a #61 e a #66 o seguem):
   - **A forma:** `BoardBillAside` recebe `payment?: React.ReactNode`, renderizado só deitado, entre o card e o `OrderMoreButton`, que é desta task e fica embaixo do lugar com ou sem a #24.
   - **Quem ocupa:** até a #61, o `BoardScreen` passa `payment={<PayBillButton movement={movement} />}` (07). A #61 troca essa linha por `payment={<BoardPaymentColumn />}`, e daí em diante o tablet deitado não tem botão "Pagar conta": o formulário é a entrada (RF-10a da #24). O `PayBillButton` continua na `BoardActionBar`, que some deitado.
   - **O estado offline é de quem ocupa.** O `PayBillButton` já traz a frase do artboard (07), e o `BoardPaymentColumn` a põe no rodapé dele (decisão 12 da #61). O `BoardBillAside` não desenha frase nenhuma, para ela não sair duas vezes.
   - **Conta paga não tem lugar de pagamento.** Com `movement.is_board_paid`, a coluna é o `BoardPaidClosing` desta task (decisão 7), e o `BoardScreen` não passa `payment`. Quem ocupa o lugar nunca desenha "conta paga" por conta própria: o `BoardPaymentColumn` fica vazio no estado `paid` de `payment-options` até a movimentação relida trocar a coluna (#61, decisão 10). A confirmação de um pagamento que zerou a conta fica no `Overlay` por cima, e fechá-lo deixa o encerramento à vista (#66, decisão 7).
   - **Dentro da conta, sem saída para a conta.** O que ocupa o lugar já está na tela da conta, então não oferece "Ver a conta da mesa" nem "voltar para a conta" (#61).
5. **A coluna em pé:** o card na forma de duas colunas internas do artboard (rótulo e falta pagar à esquerda; pago, barra e contador à direita), o card de itens com o resumo, e a barra fixa embaixo. A barra é o `BoardActionBar` da 07 em outro arranjo: uma linha com o garçom (rótulo curto "Garçom"), "Pedir mais" e "Pagar conta" com `flex: 1`. Padding 16/24/22. Os botões ficam em `md`/`lg` do tema (44/52), e não nos 56 do artboard.
6. **Dois botões de garçom no tablet em pé, por enquanto.** O artboard da conta em pé não tem o garçom na barra superior, e o do cardápio em pé tem (o ícone recolhido da #37). A barra superior é do shell e vale em toda rota. A barra de baixo é da conta e segue o artboard dela. Os dois usam o mesmo `useWaiterCall()` e mostram o mesmo estado. **Pendente para o dev:** tirar um dos dois na conta em pé.
7. **O encerramento (RF-19)** é o `BoardPaidClosing`, no aside, só deitado (`LandscapeOnly`):
   - o círculo de 84 no `toneOnCard.paidTile`, com `check_circle` preenchido;
   - "Conta paga" em `typographyTokens.h2`;
   - a frase do artboard com o `total_paid`, sem o trecho do garçom (decisão 9);
   - o rótulo "Pagamentos" e as linhas do `BoardPaymentRow` da 05, com o "quando" no formato "{HH:mm} · confirmado" (uma variante de meta da linha);
   - o `ConnectedWaiterCallButton` com a largura toda, no pé da coluna;
   - "Precisa de nota fiscal? Peça no caixa." em `caption`.

   Os itens continuam à esquerda (`LandscapeOnly` no ramo pago), com "encerrada às {HH:mm de `paid_at`}" no cabeçalho e o resumo pago no rodapé. Em pé, o ramo pago é o do celular (05), em coluna, sem barra de ações: o artboard não desenha a conta paga em pé.
8. **Os itens agrupados também na conta paga.** O artboard pago deitado lista os itens sem cabeçalho de rodada. O mesmo `BoardItemsCard` com grupos mantém um componente só, e o estado "entregue" das rodadas é informação verdadeira. **Divergência com o canvas, registrada.**
9. **"O garçom já foi avisado" sai por default; confirmar com o dev.** É literal do artboard, e a versão anterior desta task a mantinha pela premissa de que o painel do PDV recebe o `board_payment_added` (contexto da socket-api#65). A premissa foi medida em 2026-11-23 no `delivery-admin` `origin/master` e não se sustenta: a tela de gestão de mesas assina a sala de cada movimentação aberta, mas escuta só `board_session_created`/`completed`, `board_bill_requested` e `board_totals_changed` (`src/pages/board-management/hooks/useBoardManagementSocketEvents.ts:47-63`), e o `board_totals_changed` não sai em pagamento (RN-02 da spec). Só a tela de controle de **uma** mesa escuta o `board_payment_added` (`registration/board/hooks/useBoardControlSocketEvents.ts:121`), e só se estiver aberta. Nenhum caminho avisa o garçom. Pela RN-10 (a tela não promete atendimento), a frase fica "{valor} quitados. A mesa pode ser liberada.", que é o mesmo default da confirmação da #63 (decisão 10 de lá, que tira "e o garçom foi avisado"). A mesa ser liberada é fato do PDV, e a frase não oferece liberá-la (RN-11).
10. **O chip "Mesa N · paga"** é uma variante do chip, e não um rótulo novo: `TableTopBarTable` ganha `{ kind: 'ready'; label: string; isPaid: boolean }`. Com `isPaid`, o chip leva `check_circle` preenchido em vez de `table_restaurant` e a pele `toneOnCard.paidTile`, e o `AppShell` monta o rótulo `Mesa ${number} · paga` a partir de `movement.is_board_paid`. O botão de garçom da barra continua na conta paga: o artboard pago não o desenha, e a coluna direita já tem o seu. É o mesmo caso da decisão 6, pendente para o dev.
11. **Medidas de tablet nos itens:** miniatura de 52 (raio 14), nome 15/700, meta 12 e valor 15/800 sob `tabletShellMediaQuery`, nos componentes da 03. O "Atualizar" do tablet (RF-11) é um `IconButton` `md` no cabeçalho do card de itens, por uma prop `headerAction` do `BoardItemsCard`, em `TabletOnly`.
12. **O skeleton do tablet é o de `Estado · carregando`**, nas duas colunas, com a forma do conteúdo do `Main` (cards sobre a página). Os artboards de estado desenham a coluna direita chapada, com borda à esquerda. O conteúdo segue o artboard principal, e o skeleton tem a forma do conteúdo, para nada pular quando o dado chega.

### Armadilhas

- **Sem `100dvh` e sem `<main>`** (Aprendizados da #20). A altura das colunas vem do `Scroller`, que já desconta a barra de 72. Com `100dvh` a página rola 72px no tablet deitado.
- **`minmax(0, 1fr)`, e não `1fr`**, na coluna dos itens. Com `1fr`, um nome longo sem quebra alarga a coluna e empurra a direita para fora.
- **Rolagem própria quer `minBlockSize: 0`** nos filhos da grade, senão o `overflow` não corta e a página rola.
- **Celular deitado (844 × 390) não é tablet**: a altura mínima do corte o deixa no layout de celular, e ele tem de funcionar assim.
- **O erro de rota e o offline já têm forma de tablet**: `Sheet` em 820, painel em 1180 (`RouteErrorState`, #38), e banner sob a barra (`AppShell`). Não refazer.
- **Nenhum corte novo:** `grep "min-width\|orientation"` nos arquivos desta task só encontra os cortes importados de `shell-metrics.ts`.

## Mudanças

### 1. Visibilidade por formato

`src/components/board/layout/format-visibility.tsx` (novo): `PhoneOnly`, `TabletOnly`, `LandscapeOnly` e `NotLandscape`, quatro `styled('div')` com `display: none`/`contents` pelos cortes de `shell-metrics.ts`. Um arquivo, porque são quatro linhas de um padrão só e não têm render.

### 2. As regiões e a grade

- `src/components/board/layout/BoardBillAside.tsx` (novo): `{ card: React.ReactNode; payment?: React.ReactNode }`. No celular e em pé, só o card. Deitado, o card, o `payment` e o `OrderMoreButton`, com `overflowY: auto`, pelo contrato da decisão 4. Sem frase offline própria: ela é de quem ocupa o `payment`.
- `src/components/board/layout/BoardBillMain.tsx` (novo): o card de itens e o de pagamentos, com `overflowY: auto` deitado. O card de itens preenche a altura da coluna, com o resumo no pé (`marginBlockStart: auto`), como no artboard.
- `src/components/board/BoardScreen.tsx` (alterado): o `Body` ganha a grade da decisão 1, e o mapa de encaixe da 01 passa a ser:

  ```tsx
  <Body>
    {refreshFailed && <InlineError … />}
    {movement.is_board_paid ? (
      <>
        <BoardBillAside card={<><NotLandscape><BoardBillCard movement={movement} /></NotLandscape><LandscapeOnly><BoardPaidClosing … /></LandscapeOnly></>} />
        <BoardBillMain>
          <LandscapeOnly><BoardItemsCard … footer={<BoardTotals variant="paid" appearance="footer" … />} /></LandscapeOnly>
          <NotLandscape><BoardPaymentsCard query={payments} tone="ink" /><BoardTotals variant="paid" appearance="card" … /></NotLandscape>
        </BoardBillMain>
      </>
    ) : (
      <>
        <BoardBillAside card={<BoardBillCard movement={movement} action={<RequestBillAction … />} />} payment={<PayBillButton movement={movement} />} />
        <BoardBillMain>
          <OfflineDimmed>
            <BoardItemsCard … headerAction={<TabletOnly><RefreshBillButton … /></TabletOnly>} footer={<BoardTotals … paidRows={<BoardTotalsPaymentLines query={payments} />} />} />
            <PhoneOnly><BoardPaymentsCard query={payments} /></PhoneOnly>
          </OfflineDimmed>
        </BoardBillMain>
      </>
    )}
  </Body>
  {!movement.is_board_paid && <BoardActionBar movement={movement} />}
  ```

  O `BoardActionBar` some deitado (`display: none` sob `tabletLandscapeMediaQuery`) e muda de arranjo em pé (decisão 5).

### 3. O card nos dois formatos

`src/components/board/bill-card/BillCardOpen.tsx` (alterado, 02): a forma deitada (decisão 4) e a de duas colunas em pé (decisão 5), por grid areas sob os dois cortes, sem duplicar o valor nem o contador no DOM. O rótulo deitado é `describeBillState` sem o número da mesa.

### 4. Resumo e pagamentos no tablet

- `src/components/board/totals/BoardTotals.tsx` (alterado, 04): o `paidRows` passa a valer só no tablet, e a linha "Já pago" só no celular (decisão 2).
- `src/components/board/payments/BoardTotalsPaymentLines.tsx` (novo): uma linha do resumo por pagamento, em ordem de hora (`sortPaymentsByTime`, 05), com "{describePaymentTitle} · {HH:mm}" e "− {valor}" em `toneOnCard.success`. Sem dado, ou com falha, não renderiza linha nenhuma (a falha aparece no bloco do celular).
- `src/components/board/payments/BoardPaymentRow.tsx` (alterado, 05): a variante de meta "{HH:mm} · confirmado" para o encerramento.

### 5. Itens no tablet

`src/components/board/rounds/` (alterados, 03): as medidas da decisão 11 sob `tabletShellMediaQuery`, o `headerAction` do `BoardItemsCard`, e no ramo pago o "· encerrada às {HH:mm}" no contador do cabeçalho (prop `closedAt`). `src/components/board/RefreshBillButton.tsx` (novo): o `IconButton` "Atualizar a conta" com o `useRefreshBoardBill` da 01, que o `BoardHeader` do celular também passa a usar (sai a cópia de lá).

### 6. Barra de ações em pé

`src/components/board/actions/BoardActionBar.tsx` (alterado, 07): o arranjo da decisão 5 sob `tabletPortraitShellMediaQuery`, e `display: none` sob `tabletLandscapeMediaQuery`. `src/components/waiter/WaiterCallButton.tsx` (alterado, 07): prop `label?: string` para o rótulo curto "Garçom"; o rótulo de chamado não muda.

### 7. Encerramento

`src/components/board/layout/BoardPaidClosing.tsx` (novo), pela decisão 7, com as medidas próprias em `src/components/board/layout/layout-metrics.ts` (grade, gaps, círculo de 84). Sem hex.

### 8. Chip pago

- `src/components/shell/TableTopBar.tsx:22-26,148-153` (alterado): o `isPaid` da decisão 10.
- `src/components/shell/AppShell.tsx:107-108` (alterado): `table = { kind: 'ready', label, isPaid: session.movement.is_board_paid }`, com o rótulo pago.

### 9. Skeleton de tablet

`src/components/board/BoardScreenSkeleton.tsx` (alterado, 01): as duas colunas deitado (decisão 12) e a coluna em pé, pelos mesmos cortes e pelo mesmo princípio de um DOM só.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars.
2. `grep -rn "min-width\|orientation\|100dvh\|useMediaQuery" src/components/board`: só os cortes importados de `shell-metrics.ts` e nenhum `100dvh` nem `useMediaQuery` de layout.
3. `git diff --stat` contra a base: nenhum arquivo de `src/theme/` ou `src/components/ui/`.

**No navegador** (harness da 01; com a 06 de pé para os passos de tempo real). Larguras: 1180 × 820, 820 × 1180, 1440 × 900, 390 × 844 e 844 × 390. Mesa com dois pedidos, oito ou mais itens (para a coluna de itens rolar) e um pagamento parcial.

1. **1180 × 820.** **Observar:**
   - à esquerda, o card de itens com os grupos e, no pé, o resumo com a linha do pagamento e o "Falta pagar";
   - à direita, o card ("Conta aberta", contador, "pagos / de") e "Pagar conta R$ X" e "Pedir mais";
   - rolar a coluna de itens não move a direita, e a página não rola: o `document.scrollingElement.scrollTop` fica 0;
   - o "Atualizar" no cabeçalho dos itens relê as três chaves;
   - nenhum cabeçalho de celular, nenhuma barra de ações embaixo, nenhuma coluna de sacola.
2. **820 × 1180.** **Observar:** uma coluna (o card em duas colunas internas, depois os itens com o resumo), e a barra fixa embaixo com "Garçom", "Pedir mais" e "Pagar conta R$ X". Rolar a lista não move a barra. O garçom do topo (ícone) e o de baixo mostram o mesmo estado ao chamar.
3. **1440 × 900:** a composição do passo 1.
4. **390 × 844 e 844 × 390:** a conta do celular (01 a 07), inalterada: cartão "Pagamentos" à parte, "Já pago" agregado no resumo.
5. **Conta quitada a 1180 × 820** (quitar no PDV). **Observar:**
   - à direita, o círculo com `check_circle`, "Conta paga", "{valor} quitados. …", "Pagamentos" com forma, nome e "{HH:mm} · confirmado", "Chamar garçom" e a nota fiscal, e nenhuma ação de pagar;
   - à esquerda, os itens com "encerrada às {HH:mm}";
   - o chip da barra em "Mesa {n} · paga", com `check_circle`.

   Com a 06, quitar com a tela aberta troca sem reload.
6. **Conta quitada a 820 × 1180:** a composição paga do celular, em coluna, sem barra de ações.
7. **Carregando** (Network em "Slow 3G", recarregar): a 1180 × 820, o skeleton nas duas colunas; nada pula quando o dado chega. A 820 × 1180, o skeleton em coluna.
8. **Offline** a 1180 × 820: o banner sob a barra, a coluna de itens esmaecida, e "Pagar conta" desabilitado com a frase (artboard `Estado · offline`).
9. **Alvos:** nenhum alvo abaixo de 44px nas quatro larguras (DevTools, medindo os botões das duas barras, o "Atualizar" e as abas).

## Critérios de aceitação

- [ ] A 1180 × 820 e a 1440 × 900, itens à esquerda e conta e pagamento à direita, cada coluna com rolagem própria e a página sem rolar.
- [ ] A 820 × 1180, coluna única com a barra de ações fixa embaixo ("Garçom", "Pedir mais", "Pagar conta" com o valor).
- [ ] No tablet, os pagamentos aparecem como linhas do resumo ("{forma} · {pessoa} · {HH:mm}"), e no celular continua o cartão à parte com o "Já pago" agregado.
- [ ] A coluna direita deitada tem o lugar do pagamento (`payment`), ocupado pelo `PayBillButton` até a #24.
- [ ] Com a conta quitada no tablet deitado, a coluna direita mostra "Conta paga", os pagamentos com forma, nome e hora e "Chamar garçom", sem ação de pagar; os itens ficam à esquerda; o chip da barra diz "Mesa {n} · paga".
- [ ] O skeleton do tablet tem a forma das duas colunas.
- [ ] O layout de celular (390 × 844 e 844 × 390) não muda.
- [ ] Nenhum corte novo, nenhum `100dvh`, nenhum `useMediaQuery` de layout; nenhum alvo abaixo de 44px.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- O painel de pagamento da coluna direita, o `Sheet` de pagamento em pé e as telas de Pix: #24 (RF-10a de lá), que troca a linha `payment` do `BoardBillAside`.
- O cabeçalho de desktop de 76 com links de texto e o "Atualizar"/"Chamar garçom" no título (artboard `Conta · desktop 1440`): o shell da #37 já o deixou de fora.
- Tirar o garçom duplicado do tablet em pé ou da barra na conta paga: pendente para o dev (decisões 6 e 10).
- A sacola no tablet: #49.

## Branch

`task/60-tablet-board-bill-layouts`, cortada de `task/59-board-attendance-actions` (`2a3e261`) em 2026-11-27, no checkout principal. É a última da pilha sequencial da #23 e tem na base a 02 (#54), a 04 (#56), a 06 (#58), a 05 (#57) e a 07 (#59), mais a 01, a 03 e a #40 da `feat/indoor-v2`. O PR mira a branch da #59 até o #98 mergear.

## Implementação

**Concluída em:** 2026-11-27 (`tsc` e `eslint` limpos; os dois greps estáticos limpos; **nada rodado no navegador**: `next typegen`, `next build` e `next dev` ficaram com o dev)

### Arquivos

Novos: `src/components/board/layout/` (`format-visibility.tsx`, `layout-metrics.ts`, `BoardBody.tsx`, `BoardBillAside.tsx`, `BoardBillMain.tsx`, `BoardPaidClosing.tsx`, `closing-copy.ts`), `src/components/board/RefreshBillButton.tsx`, `src/components/board/payments/BoardTotalsPaymentLines.tsx`.

Alterados: `ReadyBoardScreen.tsx` (o mapa de encaixe), `BoardHeader.tsx`, `BoardScreenSkeleton.tsx`, `bill-card/` (`BillCardOpen`, `BillTimeRow`, `BillProgress`, `BillStateLabel`, `bill-state`, `bill-card-metrics`), `totals/` (`BoardTotals`, `BoardTotalsRow`), `payments/` (`BoardPaymentRow`, `BoardPaymentList`, `payments-copy`), `rounds/` (`BoardItemsCard`, `BoardItemRow`, `BoardItemThumb`, `BoardItemMeta`, `BoardItemComposition`, `rounds-metrics`), `realtime/OfflineDimmed.tsx`, `actions/` (`BoardActionBar`, `actions-metrics`, `attendance-copy`), `waiter/WaiterCallButton.tsx` e `ConnectedWaiterCallButton.tsx`, `shell/TableTopBar.tsx`, `shell/AppShell.tsx`, `hooks/use-refresh-board-bill.ts`.

Nenhum arquivo de `src/theme/` nem de `src/components/ui/`.

### Divergências da task (o código real já era outro)

- **O mapa de encaixe está no `ReadyBoardScreen`**, e não no `BoardScreen` (que só faz o portão): reescrito lá. O `Body` e a `Stack` saíram dele (viraram `BoardBody` e o próprio `OfflineDimmed`).
- **`BoardBillCard` com `{ movement, boardNumber, action? }`.** O rótulo deitado sai por CSS: `describeBillState(state)` não leva o número, e o rótulo renderiza `describeBoardPrefix(n)` ("Mesa N · ") num `span` escondido deitado, mais o texto do estado. Um DOM só.
- **`BoardTotalsPaymentLines` recebe `payments: readonly BoardPayment[]`, e não a query.** Quem decide se há linhas é o `ReadyBoardScreen`: sem dado ou com lista vazia ele não passa `paidRows`, e a linha agregada "Já pago" vale nos dois formatos. Com `paidRows`, a agregada é `phone`, e as linhas de pagamento, `tablet`. Não há `??` sobre JSX.
- **`format-visibility.tsx` exporta também estilos** (`phoneOnlyStyle`, `tabletOnlyStyle(display)`, `landscapeOnlyStyle`, `notLandscapeStyle`), além dos quatro componentes. O `BoardTotals` é um `dl`, e um `div` de recorte em volta do grupo `dt`/`dd` não é filho válido: o `BoardTotalsRow` ganhou `visibleOn` e esconde o próprio grupo.
- **`WaiterCallButton`: a prop se chama `compactLabel`, e não `label`.** O rótulo curto "Garçom" só vale no tablet em pé e a mesma instância serve ao celular, então os dois rótulos entram no DOM e o corte esconde um. O `aria-label` segue o rótulo completo. O estado chamado não muda.
- **`OfflineDimmed` virou a pilha** (flex em coluna, `gap`): fez o papel da `Stack`, para o cartão ausente não deixar vão e para o cartão de itens crescer deitado. No celular o resultado é o mesmo. Consequência: deitado, o resumo (rodapé do cartão de itens) também esmaece offline. O artboard `Estado · offline` não esmaece o resumo; deixei assim para não partir o cartão.
- **O "Atualizar"** é o `RefreshBillButton` (`movementId`), usado pelo `BoardHeader` do celular e pelo `headerAction` do cartão de itens (em `TabletOnly`). O `use-refresh-board-bill.ts` passou a usar `resolveBoardBillQueryKeys(movementId, ALL_BOARD_BILL_KEYS)`: as mesmas três chaves.

### Decisões que tomei por conta própria

- **O aviso de releitura deitado** ocupa a linha `notice` da grade (`auto`, sem altura quando vazia); a grade é `"notice notice" "main aside"`.
- **Respiro da sombra nas regiões que rolam:** `margin` negativo e `padding` igual (11 nas laterais, 10 em cima, 22 embaixo), porque o `overflow` corta a sombra de `elevations.sm`. Valores em `layout-metrics.ts`, derivados do blur e do offset da sombra.
- **O card em pé** usa 4 colunas internas (rótulo e valor à esquerda; "pagos" e "de" lado a lado, barra e contador à direita, encostados embaixo). Deitado, rótulo e contador na primeira linha, valor à esquerda, "pagos"/"de" empilhados à direita. O percentual some no tablet (o artboard não o desenha). A fonte do valor segue `typographyTokens.h1` (34); o artboard em pé usa 38, e o token vence.
- **`BillTimeRow` ganhou `compactOnTablet`**, só passada pelo card em aberto: o card pago em pé (ramo do celular) mantém o rodapé com ladrilho. O "· desde HH:mm" vem de `::before`.
- **Barra em pé:** botões do garçom e "Pedir mais" sobem de `md` para a altura `lg` (52) por CSS, todos alinhados no topo (`flex-start`), para a frase offline do "Pagar conta" não esticar os vizinhos. Os 56 do artboard ficaram em 52 (decisão 5 da task). O DOM segue a ordem do celular e a ordem visual vem de `order`; no tablet em pé o foco por teclado passa por "Pagar conta" primeiro. O estado chamado do garçom vira uma linha ("Garçom chamado às HH:mm") em vez de duas: a célula do garçom é do tamanho do conteúdo em pé. **Não medi** se cabe.
- **Itens no tablet (decisão 11):** a composição (`S/ cebola`, adicionais) também vai a 12, porque no artboard é a mesma linha `.it-s`. O padding lateral do cartão de itens continua 17 (o artboard usa 22): não estava na decisão e a mudança atravessa rodadas, linhas e rodapé.
- **O encerramento** é um cartão (raio, sombra e padding de `boardMetrics`), e não a coluna chapada com borda à esquerda do artboard (decisão 12 da task). As linhas de pagamento são as do `BoardPaymentRow` (com régua entre elas), sem o fundo verde translúcido do `.pay` do artboard. O título usa `typographyTokens.h2` (24; o artboard, 28). A falha só da lista de pagamentos mostra o `InlineError` com retry dentro do encerramento.
- **A falha dos pagamentos no tablet:** o cartão "Pagamentos" é só do celular. Com a releitura falha e sem dado, o tablet mostra a linha agregada "Já pago" e nenhum aviso (o do celular fica escondido). Aceitei por ser raro; diga se quer o `InlineError` no tablet também.
- **O skeleton** tem a mesma estrutura da conta (regiões, `BoardBody`): hero e, deitado, placeholders de pagar e "Pedir mais" na direita; cartão de itens na esquerda; cartão de pagamentos só no celular; barra de três botões em pé. As linhas de item do skeleton seguem com 44 (a real tem 52 no tablet): a altura de cada linha difere até a troca.
- **Chip pago:** `{ kind: 'ready'; label; isPaid }`. A pele é `toneOnCard.paidTile` (fundo e cor) e o ícone `check_circle` preenchido.

### Origem das medidas

- **Tema/DS:** raio, sombra e padding de cartão (`boardMetrics`), tipografia por spread dos tokens (`h1`, `h2`, `label`, `caption`, `body1`), alturas de botão (`controlSizes`), `paidTile`, cortes (`shell-metrics.ts`).
- **Artboards, sem token:** grade 440/22/22×28, gap 14 da coluna direita, corpo em pé 22×24 com gap 16, barra em pé 16/24/22 com gap 12, círculo de 84, miniatura 52/14, margens do card (10/12 acima do valor, 12 e 8 acima da barra). Todas em `layout-metrics.ts`, `bill-card-metrics.ts`, `rounds-metrics.ts` e `actions-metrics.ts`.
- O artboard `Conta · tablet deitado` é o `Main.dc.html` do zip (`canvas.json`). A coluna da direita dele já mostra o painel de pagamento da #24, que é o lugar `payment` da decisão 4, e a grade 440/22/22×28 e as medidas do card deitado vêm dele. *Corrigido em review: a versão anterior dizia que o artboard não estava no pacote.*

### Verificação

- `npx tsc --noEmit`: sem erros.
- `npx eslint src app scripts`: sem erros nem warnings novos (só o aviso de versão do React do plugin).
- `grep -rn "min-width\|orientation\|100dvh\|useMediaQuery" src/components/board`: nenhuma ocorrência.
- `git diff --stat`: nenhum arquivo de `src/theme/` nem de `src/components/ui/`. Sem hex nos arquivos novos.

### O que NÃO foi verificado

- **Tudo no navegador**, nas cinco larguras. As áreas de grade do card (deitado e em pé), o `1fr` da linha do "pagos", o preenchimento de altura do cartão de itens, o corte das sombras, a rolagem independente e a página parada, o skeleton sem salto, o offline, e o celular a 390 × 844 e 844 × 390 (nenhuma regra de celular foi alterada, mas o `OfflineDimmed` e o `BoardItemsCard` agora são `flex` em coluna).
- Se "Garçom chamado às HH:mm" cabe na célula da barra em pé, e os alvos de 44 nas quatro larguras.
- `next build`, `typegen` e o fluxo em tempo real (a conta quitada com a tela aberta).

### Correções aplicadas em review

- `src/components/board/BoardScreenSkeleton.tsx`: saiu o JSDoc antigo ("O celular do artboard…"), que ficou empilhado em cima do novo.
- `src/components/board/bill-card/BillTimeRow.tsx`: `fontWeight: 400` virou `fontWeights.regular`.
- `tsc` e `eslint` rodados de novo, os dois limpos.

### Devolvido ao implementador (bloqueante)

- **`src/components/board/payments/BoardTotalsPaymentLines.tsx:25-37`: `.map()` com corpo próprio e JSX de várias linhas** (regra "pai, `<XxxList>` e `<XxxItem>`"). Extrair `BoardTotalsPaymentLine` (`{ payment, now }`), que monta o rótulo "{forma} · {pessoa} · {HH:mm}" e o `BoardTotalsRow`, como o `BoardPaymentList` faz com o `BoardPaymentRow`. Na mesma passada, trocar o `new Date()` do render pelo `useNow` que os outros dois blocos de pagamento usam.

### Validação no navegador (2026-11-27, orquestrador)

Contra a delivery-api local (`master` @ `819683112`), na mesa 004 (41 itens em 35 rodadas, para a coluna rolar), com um pagamento parcial e depois quitada pelo banco, que foi restaurado. O roteiro `qa60.mjs` deu **47 de 47**:

| Largura | Resultado |
|---|---|
| 1180 × 820 e 1440 × 900 | itens à esquerda e o card à direita (440 de largura). A coluna de itens rola sozinha: com ela a 900px, a direita não se move e o `document.scrollingElement.scrollTop` fica em 0. O card mostra "Conta aberta" sem número, e o resumo traz a linha do pagamento com a hora e o "Falta pagar". Sem cartão "Pagamentos" à parte e sem barra embaixo. "Pagar conta" e "Pedir mais" ficam na direita. O "Atualizar" do cabeçalho dos itens relê as três chaves |
| 820 × 1180 | uma coluna. A barra fixa tem "Garçom", "Pedir mais" e "Pagar conta R$ 677,35", e não se move quando a lista rola |
| 390 × 844 e 844 × 390 | o celular: cartão "Pagamentos" à parte, "Já pago" agregado e nenhuma linha de pagamento no resumo |
| Conta paga, 1180 | o encerramento com "Conta paga", "R$ 737,35 quitados. A mesa pode ser liberada.", os pagamentos com "HH:mm · confirmado", "Chamar garçom" e a nota fiscal, sem ação de pagar. Os itens à esquerda trazem "encerrada às HH:mm", o chip vira "Mesa 004 · paga" e o "Atualizar" continua lá |
| Conta paga, 820 | a composição paga do celular em coluna, sem barra de ações, com o "Atualizar" numa linha acima de "Pagamentos" |
| Skeleton (respostas atrasadas 4 s) | duas colunas a 1180, coluna com a barra a 820, e nada passando da borda dos cartões a 1180, a 820 e a 390 |
| Offline, 1180 | itens a 0,72 e o pagar desabilitado com a frase |
| Alvos | nenhum abaixo de 44 a 1180, a 1440 e a 820 |

Também conferido:
- **Peso do "de {total}":** 500 deitado e 600 em pé, como nos dois artboards (nit do re-review, corrigido pelo orquestrador em `bill-card-metrics.ts` e `BillCardOpen.tsx`).
- **Regressão do celular nesta branch:** os roteiros da #54 (18/18), #56 (15/15), #57 (19/19) e #59 (26/26) passam. O respiro do cartão de pagamentos continua 18/18.
- **Defeito que vinha da #53 e o navegador pegou:** a barra da linha de item do skeleton passava 38px da borda do cartão em todos os formatos. Foi corrigido aqui, com `flex: 1` e `minInlineSize: 0`.

**Não verificado:**
- a troca para a conta paga com a tela aberta (pelo socket da #58);
- o leitor de tela;
- um tablet de verdade.

## Follow-ups identificados em review

- **(média) O tablet não tem "Atualizar" na conta paga.** Em pé, o ramo pago não tem o cartão de itens, e o `BoardHeader` some no tablet. Deitado, o `BoardItemsCard` pago não recebe `headerAction`. A review da #57 manteve o botão na conta paga do celular por causa da RN-06: é por ele que a tela volta a aberta se o socket estiver caído e o PDV excluir um pagamento. O tablet está em tela cheia e não tem como recarregar. Deitado, a correção é passar o mesmo `headerAction` ao cartão pago. Em pé, falta decidir o lugar.
- **(média) RF-01 contra o artboard: o percentual some no tablet** (`BillCardOpen.tsx:182-189`). A RF-01 e o critério 1 da spec pedem "o percentual pago" no card, e os dois artboards de tablet não o desenham. A barra o comunica visualmente, e o `aria-valuenow` para o leitor de tela, mas o número não aparece. Confirmar com o dev e registrar a divergência na spec. Para voltar com o número, basta tirar o `phoneOnlyStyle` e dar uma área da grade ao `PaidPercent`.
- **(média) A falha dos pagamentos não aparece no tablet.** Sem dado e com erro, o tablet mostra só o "Já pago" agregado, sem aviso e sem "Tentar de novo". O `InlineError` fica no cartão `PhoneOnly`. O total fecha, mas a lista de quem pagou some sem aviso. A regra pede inline para bloco secundário que falhou. O mesmo vale para a falha de releitura com dado velho (`isRefetchError`): o celular avisa e o tablet não.
- **(média, para a #61) O lugar `payment` fica montado em todo formato**, e só aparece deitado (`LandscapeOnly`, `display: none`). O contrato da decisão 4 diz "renderizado só deitado". Quando o `BoardPaymentColumn` ocupar o lugar, os hooks dele (a leitura de `payment-options` e o que mais ele escutar) vão rodar também no celular e no tablet em pé, em `/board`. A #61 já aceita que a conta escondida fique montada (armadilha "A conta escondida continua montada"), mas não diz nada sobre a coluna. Escrever isso no contrato da decisão 4, ou fazer a #61 desligar as leituras fora de paisagem.
- **(baixa) `BoardBillAside` ganhou uma prop `secondary`** (o "Pedir mais") que não está no contrato da decisão 4, onde o `OrderMoreButton` é da própria região. O comportamento do contrato continua (ele fica embaixo do lugar, com ou sem a #24), e a prop deixa o skeleton reusar a região. Registrar a mudança na decisão 4.
- **(baixa) O `describeBillState` ficou com um ramo morto.** Nenhum chamador passa mais o número (o `BillCardPaid` passa `''` para `paid`). A copy "Mesa N · " está duplicada: no ramo morto e no JSX do `BillCardOpen.tsx:208`. No DOM o rótulo virou "Mesa 12 · Conta aberta", com maiúscula no meio. Não aparece, por causa do `uppercase`, mas o leitor de tela lê assim. Tirar o parâmetro e pôr o prefixo da mesa numa função de copy em `bill-state.ts`.
- **(baixa) O contador deitado perde o rótulo para o leitor de tela.** "Mesa ocupada há" e "desde HH:mm" saem com `display: none`, e o leitor de tela ouve só "1h 24min". Usar `VisuallyHidden` em vez de `display: none` mantém o desenho do artboard e o sentido.
- **(baixa) Na barra em pé, o garçom e "Pedir mais" sobem para 52 só na altura.** O raio (`controlRadii.md` 14) e o ícone (20) continuam os do `md`, ao lado do "Pagar conta" em `lg` (16 e 22). Conferir no navegador e, se destoar, levar também o raio e o ícone.
- **(baixa) O skeleton não tem a forma do tablet.** O card de destaque do skeleton é o do celular (chip, valor, barra e rodapé), sem a forma em grade nem o espaço do "Pedir a conta". Deitado, os placeholders de pagar e de "Pedir mais" descem quando o dado chega. Em pé, desce o cartão de itens. As linhas de item têm 44, contra 52 no tablet, e o cartão de itens não tem a forma do resumo (follow-up da #56, ainda aberto). Medir no navegador o salto da decisão 12.
- **(baixa) As medidas de tablet do cabeçalho e do resumo do cartão de itens ficaram com as do celular.** O artboard usa título 15/800, contador 12, padding 20/22 e resumo com padding 16/22 e gap 9. A decisão 11 cobre só a linha do item. O implementador registrou só o padding.
- **(baixa) O DS não descreve as variantes novas.** Faltam o chip pago no `design-system/components/TableTopBar/README.md` (a anatomia ainda diz só `table_restaurant`) e, no `BoardTotals/README.md`, as linhas de pagamento no lugar do "Já pago" no tablet.
- **(baixa) Os números de respiro da sombra estão escritos à mão** (`layout-metrics.ts:19-21`: 10, 22, 11). Eles dependem do `elevations.sm` (0 6px 16px) e do `landscapeGap` (11 = 22 / 2). Se um dos dois mudar, a sombra volta a ser cortada sem aviso. Escrever a conta com constantes, como a #56 fez no rodapé do resumo.
- **(baixa) Anúncio duplicado do garçom** (follow-up da #59), resolvido só em parte. Deitado e com a conta aberta, a `BoardActionBar` escondida sai da árvore de acessibilidade. Em pé (decisão 6) e deitado com a conta paga (decisão 10), continuam dois `role="status"` visíveis, e "Garçom chamado às HH:mm" é anunciado duas vezes. Junta com a pendência das decisões 6 e 10.
- **(observação) O artboard `Conta · tablet deitado` está no zip.** O `canvas.json` liga esse artboard ao `Main.dc.html`. Ele parece "a tela de pagamento" porque a coluna da direita já mostra o painel da #24 ("Quanto você vai pagar?", "Forma de pagamento", "Gerar Pix"), que é o lugar `payment` da decisão 4. A grade 440/22/22×28 vem dele, e as medidas do card deitado conferem: valor 34, 10 acima dos valores, 12 acima da barra, contador 12 com ícone 16 e gap 5. O que diverge: o "de R$ X" é 500 no artboard (a implementação usa 600) e o padding do card é 18/20 (a implementação usa 18). Corrigir a frase em "Origem das medidas".
- **(observação) No tablet em pé, a ordem de foco não segue a ordem visual** ("Pagar conta" vem primeiro, e está à direita). Aceito. Com um DOM só, um dos dois formatos tem de divergir, e manter o celular certo é a escolha melhor: é o aparelho pessoal, onde o leitor de tela é mais provável. Os três botões são independentes, então a ordem não muda o sentido (WCAG 2.4.3). Confirmar com o dev.

### Correções depois do review e da medição no navegador (2026-11-27)

- **`BoardTotalsPaymentLine`** extraído (`{ payment, now }`), e o `BoardTotalsPaymentLines` usa `useNow` (60 s) no lugar do `new Date()` do render.
- **Skeleton estourando o cartão:** a barra do `BoardSkeletonItemRow` está num `div` com `flex: 1` e `minInlineSize: 0`; o `Skeleton` do DS não foi tocado.
- **"Atualizar" na conta paga:** deitado, o `headerAction` vai ao cartão de itens pago. **Em pé, o botão fica numa linha à direita, acima do cartão "Pagamentos"** (`PaidRefresh`, em `TabletOnly` dentro de `NotLandscape`). Escolhi essa linha, e não o cabeçalho do cartão "Pagamentos", porque esse cartão não existe quando a lista de pagamentos está vazia, e é justamente o caso da RN-06 (pagamento excluído no PDV com o socket caído).
- **Medidas do artboard deitado:** padding lateral do card deitado 20 (18 em cima e embaixo); "de {total}" com peso 500; rótulo do contador em pé com `fontWeights.regular`.
- **Nits:** `boardCopy.closedAt`; `itemCount` calculado uma vez no `ReadyBoardScreen`; imports em ordem; `describeBillState(state)` sem número e `describeBoardPrefix(n)` ("Mesa N · ") como única fonte do prefixo; `waiterCallMetrics.stackedRowGap` no lugar do `gap: 4`.
- Mantidos, como pedido: percentual escondido no tablet (para o dev decidir, contra a RF-01), ordem de foco da barra em pé, tablet sem `InlineError` de pagamentos.
- `tsc` e `eslint` limpos; sem `dev` nem `build`.

### Re-review (2026-11-27)

Aprovado. O bloqueio está resolvido: o `BoardTotalsPaymentLine` é o item, o `.map()` cabe numa linha e o `now` vem do `useNow`.

Follow-ups acima que esta rodada fechou:
- o "Atualizar" na conta paga do tablet;
- o ramo morto do `describeBillState`, que agora tem o `describeBoardPrefix` como única fonte do prefixo;
- o padding 18/20 e o "de" em 500 do card deitado, da observação sobre o artboard.

Nesta rodada, corrigi também duas frases que a mudança deixou velhas no relato da implementação, a de "Divergências" sobre o `describeBillState` e a de "Origem das medidas" sobre o artboard no zip.

Achados novos, nenhum bloqueante:
- **(nit)** O `tabletTotalWeight: 500` vale nos dois formatos de tablet (`BillCardOpen.tsx`, `TotalValue`, sob `tabletShellMediaQuery`). O artboard em pé desenha o "de {total}" em 600, herdado da linha. Só o deitado usa 500.
- **(observação)** O `PaidRefresh` em pé fica dentro do `OfflineDimmed` e esmaece com a rede caída, como as listas. Ele continua tocável, e o toque falha com o aviso de releitura de sempre. Aceito.
- **(observação)** A correção do `BoardSkeletonItemRow` muda o skeleton do celular: a barra deixa de passar 38px da borda do cartão, defeito que vinha da #53. É conserto, e não regressão do "celular não muda".
