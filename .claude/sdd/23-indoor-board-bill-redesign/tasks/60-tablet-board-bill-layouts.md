# 08 — Conta no tablet: duas colunas deitado e barra fixa em pé

**Issue:** [#60](https://github.com/sgrande-delivery/delivery-indoor/issues/60)
**Feature:** [Conta da mesa redesenhada](../spec.md) — issue #23
**Tipo:** feature
**Repo:** delivery-indoor (branch `feat/indoor-v2`)
**Depende de:** 02 (#54), 03 (#55), 04 (#56), 05 (#57) e 07 (#59); e a task 01 da #21 ([#40](https://github.com/sgrande-delivery/delivery-indoor/issues/40)), pelos cortes de orientação
**Status:** pendente
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

`task/60-tablet-board-bill-layouts`, base sugerida: a junção da 02 à 07 sobre a 01, com a #40 na base (ou `feat/indoor-v2`, se tudo já tiver mergeado). Conflitos esperados: `BoardScreen.tsx` (reescreve o mapa de encaixe acima), `AppShell.tsx` (com a #49 e a 07) e `TableTopBar.tsx`.
