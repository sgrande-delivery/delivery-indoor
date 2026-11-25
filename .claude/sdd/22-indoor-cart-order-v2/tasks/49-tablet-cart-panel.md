# 04 — Sacola no tablet: coluna fixa em paisagem e painel inferior em retrato

**Issue:** [#49](https://github.com/sgrande-delivery/delivery-indoor/issues/49)
**Feature:** [Carrinho e envio do pedido pelo carrinho v2](../spec.md) — issue #22
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 (#46). Para o passo 2 do roteiro em navegador, também a 03 e a 05 da #21 ([#42](../../21-indoor-menu-v2/tasks/42-category-listing-infinite-scroll.md), [#44](../../21-indoor-menu-v2/tasks/44-menu-search-v2.md)), que criam `/menu` e `/search`
**Status:** pendente
**Reconciliado com a #21 (2026-11-23):** esta task é a **única** dona da coluna e da barra da sacola do tablet, no `AppShell`. A [#45](../../21-indoor-menu-v2/tasks/45-tablet-menu-grid.md) perdeu o `MenuFrame` e o slot `aside` e não mexe em `app/(menu)/layout.tsx`; a grade dela preenche o `Scroller` que sobra ao lado da coluna. Os dois cortes de orientação nascem na [#40](../../21-indoor-menu-v2/tasks/40-catalog-v2-services-types.md), e esta task só os lê (mudança 1). `isCartDockRoute` e o grupo `app/(menu)/` falam das mesmas rotas. O stepper de 40 aponta para o follow-up único da #43.

## Objetivo

No tablet a sacola deixa de ser rota e passa a fazer parte do cardápio. Em paisagem ela é uma coluna fixa de 380 à direita, sempre visível e com rolagem própria, que não some quando está vazia. Em retrato ela é uma barra inferior ("Sua sacola · 2 itens", total e "Ver sacola"), que abre o painel por cima do cardápio. O conteúdo das duas é o mesmo `CartPanel` da 01. O que muda é a moldura e o lugar.

## Contexto

### Estado atual

- **O cromo do shell troca por CSS.** O `AppShell` (`src/components/shell/AppShell.tsx:95-169`) monta a `TableTopBar` e o `ChromeBlock` do celular e esconde o inativo por media query, sem hook, para não remontar na hidratação (`:16-26`).
  - A região de conteúdo é o `Scroller`, um `<main>` sem padding (`:56-65`), dentro do `Frame` (`:43-54`), que é coluna.
  - O `OfflineBanner` fica entre a barra e o `Frame` (`:159`).
- **Cortes:**
  - `tabletShellMediaQuery`: `(min-width: 744px) and (min-height: 600px)` (`src/components/shell/shell-metrics.ts:3`);
  - `tabletPortraitMediaQuery`: `(orientation: portrait)` (`:6`), que a 37 usa para colapsar o garçom;
  - `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery`, que a #40 (task 01 da #21) acrescenta no mesmo arquivo e que a grade da #45 também lê.
- **O grupo `app/(menu)/`** (#40) tem `/`, `/menu` e `/search`, e o `app/(menu)/layout.tsx` da #43 só tem o host do detalhe e, pela 01, o provedor de adicionar. A coluna **não** passa por ele.
- **Aba ativa no tablet.** `resolveActiveTab(pathname, 'tablet')` acende **Cardápio** em `/`, `/menu…`, `/search` e `/cart` (`src/components/shell/shell-tabs.ts:34-52`). A 37 registra: "a sacola é coluna do cardápio".
- **A 01 entrega o conteúdo:**
  - `CartPanel` (linha da mesa opcional, lista, totais, estados);
  - `CartTotals`, `CartEmpty` e `CartScreenSkeleton`;
  - `useCart`, `useCartItemCount` e `useCartActions`.

  A tela `/cart` do celular é dela.
- **Primitivos:**
  - `Sheet` com `header` (`{ title, subtitle?, action? }`, `src/components/ui/PanelHeader.tsx:13-17`), `footer` e o fechar próprio;
  - `EmptyState` (círculo de `emptyStateMetrics.circleSize` = 72);
  - `Badge variant="count"`, `Button`, `Icon` e `VisuallyHidden`.
- **`arrow_forward`, `shopping_bag` e `close` já estão na união** (`src/components/ui/icon-names.ts`).

### Requisitos cobertos

- **RF-12 no tablet.** Em paisagem, a coluna mostra o empty state vazio, em vez de sumir. O botão de enviar desabilitado dessa RF entra com o botão de envio, na 03.
- **RF-13.** A coluna fixa ao lado do cardápio em paisagem; o painel inferior sobre o cardápio em retrato; alvos de 44px ou mais.
- **Decisão do plan.** "O que sobra de estado local é a visibilidade do painel no tablet, que é UI."

### Referência de design

Canvas Brasa Punch Indoor (cópia extraída em `/tmp/brasa-indoor-canvas.yzmPZk/`). O protótipo manda em layout, hierarquia, copy e estados. Token vem do tema.

- **`Carrinho · tablet deitado`:** a grade `minmax(0,1fr) 380px` sob a barra.
  - A coluna é `card`, com borda esquerda `line`.
  - Cabeçalho: `shopping_bag` 22, "Sua sacola" em display 19/800, a contagem em pílula da marca e o "Limpar" (05).
  - Corpo com rolagem própria, linhas com miniatura de 64 e o stepper.
  - Rodapé com borda superior: "Total do pedido", nota da taxa, "Pedindo como" e o CTA (03).
- **`Cardápio · tablet deitado · 3 colunas`:** a coluna **vazia**, com o círculo de `shopping_bag`, "Nenhum item ainda", a frase de que o pedido só vai quando enviar, "Pedindo como Marina · trocar" e o "Enviar pedido" desabilitado.
- **`Cardápio · tablet em pé · 2 colunas`:** a barra inferior de 92.
  - Quadrado de 48 em `field` com `shopping_bag` e a contagem sobreposta.
  - "Sua sacola · 2 itens" em 11/800 caixa alta `muted` e o total em 17/800.
  - "Ver sacola" com `arrow_forward`, no botão primário de 52.
  - A barra inteira é o link.
- **`Carrinho · tablet em pé`:** o painel de 640 sobre o cardápio, com o fundo escurecido e o puxador.
  - Cabeçalho: "Sua sacola" 22/800, "· 2 itens" 13 `muted`, "Limpar" (05) e o fechar de 44.
  - A linha da mesa compacta ("Mesa 12 · vai direto para a cozinha", sobre `field`).
  - Linhas com miniatura de 72, nome 15/700 e preço 16/800.
  - Rodapé com o total em 26/800, e "Pedindo como" e o CTA lado a lado (03).
- **`Carrinho · desktop 1440`:** a mesma coluna, com 366. O desktop passa pelo corte do tablet (#37), e a coluna fica com os 380 do tablet.

### Decisões

1. **A coluna e a barra moram no `AppShell`, e não na tela do cardápio.**
   - Elas precisam ficar montadas ao navegar entre `/`, `/menu` e `/search`: a coluna que remonta a cada categoria pisca, e é o que a RF-12 quer evitar.
   - O shell já é quem troca cromo por formato com CSS, sem remontar.
   - As telas da #21 continuam donas só do conteúdo do `Scroller`.
   - O contrato do `AppShell` com as telas (`:21-26`) não muda: o `Scroller` segue sendo a região que rola, e `useAppScroller()` também não muda.
   - **É o único dono** (reconciliação com a #21). A #45 tinha um `MenuFrame` com slot `aside` em `app/(menu)/layout.tsx`, e saiu: com duas molduras, a coluna teria dois lugares possíveis. Os critérios que decidiram: o shell da #20 é o dono do cromo; com a coluna ao lado do `Scroller`, o `Scroller` passa a ser a área real do cardápio, e a grade mede contra ele sem conhecer os 380; e a largura fixa fica num lugar só (`cart-dock-metrics.ts`, decisão 5).
2. **Rotas com a sacola acoplada:** `/`, a árvore `/menu` e `/search`, num predicado só, `isCartDockRoute(pathname)`.
   - São as rotas do grupo `app/(menu)/` (#40), que é o critério "a coluna só existe nas rotas do cardápio". O grupo é do sistema de arquivos e o predicado é do shell; por isso a invariante fica escrita nos dois lados: rota nova em `app/(menu)/` entra no `isCartDockRoute` no mesmo commit.
   - O predicado é por `pathname`. O 404 de `/menu?category=abc` (decisão 1 da #42) aparece com a coluna ao lado, porque o `pathname` é `/menu`. É aceito: a sacola continua válida, e o cliente volta pela trilha.
   - `/cart` **não** entra. A tela do celular continua abrindo ali, em qualquer formato, para quem chegar pela URL.
   - No tablet nada leva a `/cart`: não há aba (`TABLET_TAB_KEYS`, `shell-tabs.ts:24`), e "Ver sacola" abre o painel.
   - `/board` não entra: a conta tem as duas colunas dela (#23).
3. **Quando aparece:** com a mesa `ready`, ou enquanto a sessão carrega (`showChrome`, `AppShell.tsx:103`), e só numa rota do item 2.
   - Carregando, a coluna mostra o skeleton.
   - Em `browsing` (cardápio sem mesa, #36), nada aparece: não há onde montar pedido.
4. **Dois cortes de orientação, derivados dos que existem:**
   - `tabletLandscapeMediaQuery = `${tabletShellMediaQuery} and (orientation: landscape)``;
   - `tabletPortraitShellMediaQuery = `${tabletShellMediaQuery} and (orientation: portrait)``.

   Os dois ficam em `src/components/shell/shell-metrics.ts`, ao lado dos atuais, e **quem os escreve é a #40** (mudança 8 de lá), a primeira task comum às duas features. Esta task só os importa.
   - Não é corte de largura novo (RF-09 e RF-10 da #20): é o shell do tablet partido pela orientação, como a 37 já faz com o garçom.
   - **A grade 3/2 da #21 (#45) lê as mesmas constantes**, para a grade e a coluna virarem juntas.
5. **Uma largura de coluna:** 380, em `cart-dock-metrics.ts`. A coluna do artboard `Pedido enviado · tablet deitado` tem 420; trocar a largura ao enviar faria a grade de 3 colunas refluir, que é o salto que a RF-12 evita. Fica 380 em todos os estados. **Divergência com o canvas, registrada para o dev.**
6. **Retrato: a barra só com itens.**
   - Sacola vazia ou ainda não lida esconde a barra, pela regra "sem resposta, sem afirmação" de `use-cart-bar.ts` @ `ceed49a9`. Não há o que abrir.
   - O painel é estado da `TabletCartDock`, e não da barra: ele continua aberto quando a sacola esvazia lá dentro. É o que deixa a 03 mostrar o "pedido enviado" no painel.
   - O painel fecha se a orientação deixar de ser retrato, com `useMediaQuery(tabletPortraitShellMediaQuery)` só para isso.
7. **O que a barra diz sai de uma função pura.** `describeCartBar` é porta de `src/components/cart/cart-bar.ts` @ `ceed49a9`, **sem** o pedido mínimo: o `RestaurantOrderRulesValidator` não aplica regra de loja a pedido de mesa (`:83`). Ela devolve:
   - `itemsLabel` ("1 item" ou "2 itens", pela soma das quantidades);
   - `totalLabel` (`formatCents(cart.total)`);
   - `accessibleLabel` ("Ver sacola, 2 itens, total R$ 53,80").

   A região `aria-live` fica montada o tempo todo, fora do condicional, como no `ShellCartBar` @ `ceed49a9` (`:41-52`). Região que nasce junto com o texto fica muda.
8. **A linha da mesa por formato:**
   - paisagem: sem linha, porque o chip "Mesa 12" está na `TableTopBar`, como no artboard;
   - retrato: a variante `compact` do `CartTableRow` (01);
   - celular: a completa (01).

   A RF-04 diz que a sacola mostra a linha da mesa. Em paisagem a linha é o chip da barra superior, e fica registrado.
9. **Vazio na coluna.**
   - `CartEmpty` **sem** a ação "Ver o cardápio": o cardápio está do lado.
   - A copy é a da decisão 11 da 01: "Nenhum item ainda" e "Toque num produto para montar o pedido da mesa. Ele só vai para a cozinha quando você enviar."
   - O rodapé da coluna continua montado com o vazio. O `OrderingAsRow` e o CTA desabilitado entram nele pela 03.
10. **Erro de leitura na coluna:** `InlineError` no lugar da lista ("Não conseguimos carregar a sacola." e "Tentar de novo"). A falha é de um bloco, e o cardápio ao lado segue valendo (matriz da 07 da #20). No painel de retrato, o mesmo.

### Armadilhas

- **Duas instâncias de `CartPanel`.** A coluna fica no DOM, escondida por CSS, também no celular e no retrato. Isso é intencional, pelo mesmo motivo do cromo do shell, e as duas leem a mesma query. Elementos com portal (diálogo de nome, confirmação de limpar) só montam quando abertos, a partir do controle visível.
- **Teclado em paisagem.** A coluna tem rolagem própria e altura definida pelo `Frame`. **Sem `100dvh`** nela (aprendizado da 06 da #20): a altura vem do `Frame`, que já desconta a barra de 72.
- **A grade da #21 não pode medir a viewport.** Com a coluna no shell, a área do cardápio é `100% − 380`. A grade de 3 colunas precisa ser relativa ao `Scroller`. Está escrito na #45 (decisão 6 e armadilhas de lá), que não reserva lugar para a coluna.
- **Alvos.**
  - O stepper é o `xs` da linha da sacola. *(Revisto em 2026-11-25 pelo dev:* o controle de quantidade segue o tamanho do app do cliente (`xs` nos adicionais e na linha da sacola, `sm` no rodapé do detalhe), e o alvo de 44 vem de uma área de toque invisível em volta de cada botão (`touchTargetArea`, `src/helpers/touch-target.ts`). *O `md` de 52 que estava aqui saiu.)*
  - "Ver sacola" e o fechar do `Sheet` têm 44 ou mais.
  - A barra inteira é alvo de 92.

## Mudanças

### 1. Cortes de orientação

Nenhuma mudança em `src/components/shell/shell-metrics.ts`: `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery` chegam pela #40 (decisão 4). Esta task os importa nos slots da mudança 5 e no `TabletCartDock`.

### 2. Rotas acopladas

`src/components/cart/dock/cart-dock-routes.ts` (novo): `isCartDockRoute(pathname)`, a partir de `HOME_ROUTE`, `MENU_ROUTE` e `SEARCH_ROUTE` de `src/routes/app-routes.ts`. A regra da árvore `/menu` é a de `isInTree` em `shell-tabs.ts:30-32`. É o **único** lugar que diz onde a sacola acopla, e lista as rotas do grupo `app/(menu)/` (decisão 2). Comentário de uma linha no módulo com essa invariante: é o WHY que um leitor futuro não acha sozinho.

### 3. Coluna de paisagem

`src/components/cart/dock/CartColumn.tsx`, `CartColumnHeader.tsx` e `cart-dock-metrics.ts` (novos).

- **Raiz:** `styled('aside')` com `aria-label="Sua sacola"`, em coluna e `blockSize: '100%'`.
  - Fundo `surface.card` e `borderInlineStart` de 1 em `surface.line`.
  - Largura fixa de 380.
- **`CartColumnHeader`:**
  - `shopping_bag` e "Sua sacola" na tipografia de display do tema (o `h3` do tema, o token mais próximo de 19/800);
  - o `Badge variant="count"` com `useCartItemCount()` quando maior que zero;
  - um slot de ação à direita, que a 05 ocupa com o "Limpar".
- **Corpo:** `CartPanel` (01) com `tableRow="none"`, `errorForm="inline"`, a lista e o vazio da decisão 9. Com `overflowY: 'auto'` e `minBlockSize: 0`.
- **Rodapé:** `CartTotals` (01) com a sacola lida. Na 03 ele vira o `CartFooter` (totais, "Pedindo como" e CTA).
- **Âncora do toast:** a mesma regra da 01, no limite inferior do corpo da coluna.

### 4. Barra e painel de retrato

`src/components/cart/dock/TabletCartDock.tsx`, `TabletCartBar.tsx`, `CartSheet.tsx` e `describe-cart-bar.ts` (novos).

- **`describe-cart-bar.ts`:** a função pura da decisão 7. Ela **não** importa componente nem tema.
- **`TabletCartBar`:** `ButtonBase` de largura cheia e 92 de altura, fundo `surface.card`, borda superior `line` e a sombra do artboard via `elevations` do tema.
  - À esquerda, o quadrado de 48 em `surface.field` com `shopping_bag` e o `Badge count` sobreposto.
  - No meio, o rótulo "Sua sacola · {itemsLabel}" em caixa alta por `textTransform` e o total.
  - À direita, o "Ver sacola" com `arrow_forward`, que é pele (`Button` primário `lg` como `span`, sem segundo alvo dentro do alvo).
  - `aria-label` = `accessibleLabel`.
- **`CartSheet`:** o `Sheet` primitivo.
  - `header`: `{ title: 'Sua sacola', subtitle: '· 2 itens', action }`. A `action` é o slot do "Limpar" da 05.
  - Corpo: `CartPanel` com `tableRow="compact"` e `errorForm="inline"`.
  - `footer`: `CartTotals`, que vira `CartFooter` na 03.
  - `onClose` fecha.
- **`TabletCartDock`:** guarda `isOpen` (decisão 6), mostra a barra com itens, e monta o `CartSheet` quando aberto.

### 5. Ligação no `AppShell`

`src/components/shell/AppShell.tsx` (alterado). O `Frame` passa a ter, nesta ordem:

1. um `Workspace` em linha (`display: flex`, `flex: 1`, `minBlockSize: 0`) com o `Scroller` e o `CartColumnSlot`;
2. o `TabletCartBarSlot`;
3. o `ChromeBlock` do celular, que não muda.

Os dois slots seguem o padrão do `TopBarSlot` (`:35-41`): `display: 'none'` por padrão, e `block`/`flex` sob `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery`, respectivamente.

Os dois só renderizam filho com `showChrome && isCartDockRoute(pathname)` (decisão 3).

```diff
         <Frame>
-          <Scroller ref={scrollerRef}>{children}</Scroller>
+          <Workspace>
+            <Scroller ref={scrollerRef}>{children}</Scroller>
+            {showsCartDock && <CartColumnSlot><CartColumn /></CartColumnSlot>}
+          </Workspace>
+          {showsCartDock && <TabletCartBarSlot><TabletCartDock /></TabletCartBarSlot>}
           <ChromeBlock ref={setChromeBlock} isHidden={!showChrome}>
```

Nenhuma outra parte do shell muda: a `TableTopBar`, o `OfflineBanner`, a publicação do `CHROME_BOTTOM_INSET_VAR` e o `ScrollerContext` ficam como estão.

### 6. `CartPanel` por formato

`src/components/cart/CartPanel.tsx` (alterado, criado pela 01): aceita `tableRow: 'full' | 'compact' | 'none'` e `errorForm: 'route' | 'inline'`, se a 01 não os tiver deixado assim.

A miniatura de 72 do retrato e a de 64 da paisagem vão em `cart-metrics.ts` (01), por variante.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `yarn build` com as vars de restaurante conclui.
4. `grep -rn "100dvh\|useMediaQuery" src/components/cart/dock`: só o `useMediaQuery` da decisão 6, no `TabletCartDock`.

**No navegador**, com `yarn dev`, `?session=<uuid-aberto>` e a sacola da 01 com dois itens. O DevTools fica em modo dispositivo, e o teste de orientação é com a rotação do próprio DevTools.

1. **1180 × 820, em `/`.** Esperado:
   - a coluna de 380 à direita, sob a barra superior e o banner de offline, quando houver;
   - cabeçalho com "Sua sacola" e a pílula "2";
   - itens sem a linha da mesa e o total no rodapé.
   - Rolar a coluna não rola o cardápio, e o inverso também vale.
2. **Navegar para `/menu?category=<id>` e `/search`** (precisa da #42 e da #44 na base; sem elas, as duas rotas são o 404 da #38 e o passo confere só que a coluna não remonta). Esperado: a coluna não remonta. A rolagem dela fica onde estava, e o React DevTools não mostra montagem nova de `CartColumn`. Com a #45 na base, a grade de 3 colunas cabe no `Scroller` ao lado da coluna, sem rolagem horizontal.
3. **Remover os dois itens pela lixeira.** Esperado: a coluna continua, com o círculo de 72, "Nenhum item ainda" e a frase, sem "Ver o cardápio". O rodapé fica montado.
4. **Abrir `/board`.** Esperado: sem coluna. **Abrir `/cart`.** Esperado: a tela do celular (01) na largura toda, sem coluna.
5. **Rotacionar para 820 × 1180 com dois itens.** Esperado:
   - sem coluna;
   - a barra de 92 no pé, com o quadrado e a contagem, "SUA SACOLA · 2 ITENS", o total e "Ver sacola".
   - O leitor de tela lê "Ver sacola, 2 itens, total R$ …".
6. **Tocar a barra.** Esperado: o painel sobe sobre o cardápio escurecido, com "Sua sacola · 2 itens", a linha "Mesa <n> · vai direto para a cozinha", os itens e o total. O fechar fecha.
7. **Com o painel aberto, tocar `+`.** Esperado: o total do painel **e** o da barra mudam juntos, depois da releitura.
8. **Com o painel aberto, rotacionar para paisagem.** Esperado: o painel fecha e a coluna aparece.
9. **Sacola vazia em retrato.** Esperado: sem barra.
10. **390 × 844 e 1440 × 900.** Esperado:
    - no celular, nem coluna nem barra: a navegação inferior com a aba Sacola, da 01;
    - no desktop, a coluna de paisagem.
11. **Sem mesa** ("Ver o cardápio" da tela "sem mesa", estado `browsing`). Esperado: sem coluna e sem barra.
12. **Em todos os formatos:** nenhum alvo de toque abaixo de 44. No stepper, o alvo é a área invisível de 44 em volta de cada botão.

## Critérios de aceitação

- [ ] Em paisagem do tablet (e no desktop), `/`, `/menu…` e `/search` mostram a coluna de 380 com rolagem própria, que não remonta ao navegar entre essas rotas.
- [ ] A coluna vazia mostra o empty state da decisão 9 e não some.
- [ ] Em retrato, a barra aparece só com itens, com contagem, total e "Ver sacola", e abre o painel inferior sobre o cardápio. O painel fecha ao sair do retrato.
- [ ] Nada disso aparece no celular, em `/cart`, em `/board` nem sem mesa.
- [ ] A coluna e o painel usam o `CartPanel` da 01. Não há segunda lista, segundo total nem conta no cliente.
- [ ] O diff do `AppShell` é só o `Workspace`, os dois slots e a condição. O contrato do `Scroller` e o `useAppScroller()` não mudam.
- [ ] As constantes de orientação são as de `shell-metrics.ts` que a #40 criou, importadas; esta task não altera `shell-metrics.ts` e não cria corte de largura novo.
- [ ] `app/(menu)/layout.tsx` não é alterado por esta task: a coluna e a barra só existem no `AppShell`.
- [ ] Nenhum hex, nenhum `100dvh` e nada alterado em `src/components/ui/` ou `src/theme/`.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **O CTA de enviar** (inclusive o desabilitado da RF-12), "Pedindo como" e o estado de pedido enviado na coluna e no painel (RF-09a): task 03.
- **"Limpar"** nos cabeçalhos: task 05. Esta task deixa o slot.
- **A grade de 3 colunas em paisagem e 2 em retrato, e a trilha de categorias fixa:** [#45](../../21-indoor-menu-v2/tasks/45-tablet-menu-grid.md) (task 06 da #21). Ela lê as mesmas constantes da #40 e preenche só o `Scroller`.
- **As duas colunas da conta** em paisagem: task 08 da #23.
- **Cabeçalho de desktop de 76** com links de texto (artboard `Conta · desktop 1440`): já estava fora na 37.

## Branch

`task/49-tablet-cart-panel`, base sugerida: a branch da 01 (`task/46-board-cart-v2`), ou `feat/indoor-v2` se a 01 já tiver mergeado. Corre em paralelo com a 02 (#47).
