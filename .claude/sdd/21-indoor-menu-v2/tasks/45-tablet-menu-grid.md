# 06 — Tablet: grade 3/2 colunas e trilha de categorias fixa

**Issue:** [#45](https://github.com/sgrande-delivery/delivery-indoor/issues/45)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 02 (#41), 03 (#42), 04 (#43), 05 (#44)
**Status:** shipped ([PR #78](https://github.com/sgrande-delivery/delivery-indoor/pull/78))
**Reconciliado com a #22 (2026-11-23):** a coluna e a barra da sacola do tablet têm um dono só, o `AppShell`, pela [#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md). Saíram daqui o `MenuFrame` e o slot `aside`, e esta task não altera mais `app/(menu)/layout.tsx`. A tela do cardápio é dona só do conteúdo do `Scroller`, que, com a coluna montada, já é a área real (`100% − 380`); a grade mede contra ele, nunca contra a viewport. Os cortes de orientação são as constantes que a 01 cria em `shell-metrics.ts`, as mesmas da #49.
**Alinhado às emendas da delivery-api#1607 (2026-11-23):** a linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), acrescenta o filtro por ingrediente à busca, e as chips dele ("com cheddar", "sem cebola", "+ ingrediente") moram na `SearchControlsRail` da 05, a "trilha de controles" que esta task fixa no tablet. Quem entrar depois rebaseia, e nenhuma das duas cria trilha nova para isso. Nada mais muda aqui.

## Objetivo

No shell de tablet, o cardápio deixa de ser o celular esticado: a listagem da categoria e os resultados da busca viram grade de cards de **3 colunas em paisagem e 2 em retrato**, e a trilha de categorias (e, na busca, as trilhas de filtro) fica fixa no topo enquanto só a coluna de conteúdo rola. A grade ocupa o `Scroller` que o shell entrega — com a sacola montada pela #49 ao lado (paisagem) ou abaixo (retrato) —, e não reserva lugar para ela. O card de grade é da mesa: mostra avaliação, selo e o `matched_option`, coisas que o `ProductCard` do DS não tem.

## Contexto

### Estado atual (depois da 02, 03, 04 e 05)

- O shell da 37 decide o formato por CSS: `tabletShellMediaQuery = '(min-width: 744px) and (min-height: 600px)'` e `tabletPortraitMediaQuery = '(orientation: portrait)'` (`src/components/shell/shell-metrics.ts:3-6`). O contrato com as telas (`src/components/shell/AppShell.tsx:21-25`): o documento nunca rola, o `Scroller` (`<main>`) tem altura definida, e **a tela que precisa de partes fixas preenche a região com `blockSize: 100%`, rola por dentro e passa o próprio container a quem observa rolagem**.
- Hoje as telas do cardápio rolam no `Scroller` inteiro: a trilha de categorias (02, 03) e as trilhas da busca (05) saem da tela ao rolar, e o `use-load-more` (03) usa o scroller do shell como `root`.
- A 03 e a 05 listam com a `CategoryProductList` (linha `ProductListItem lg`) em todos os formatos; a 05 põe o `matched_option` no lugar da descrição da linha (decisão 5 da 05).
- `MenuCategoryRail` (02) tem o slot `trailing`, reservado para a chip de busca do tablet.
- `app/(menu)/layout.tsx` (04) renderiza `{children}` e o host do detalhe, e a #46 envolve o host com o provedor de adicionar. Esta task não o altera.
- `src/components/shell/shell-metrics.ts` tem, desde a 01, `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery` (o shell do tablet partido pela orientação), as mesmas que a #49 lê para a coluna e a barra.
- **A sacola do tablet é do shell.** Com a #49 na base, o `AppShell` põe a coluna de 380 ao lado do `Scroller` em paisagem e a barra de 92 abaixo dele em retrato, nas rotas do grupo `(menu)` (`isCartDockRoute`). O `Scroller` fica com a área que sobra, e o contrato dele com as telas (`AppShell.tsx:21-26`) e o `useAppScroller()` não mudam. Sem a #49, o `Scroller` tem a largura toda, e a grade se comporta igual.
- `src/components/ui/ProductCard.tsx:62-70` crava `width: productCardSizes[size].width` (180 ou 158) e não tem avaliação nem linha extra; o design system diz que ele é o card **de trilha** (`design-system/components/ProductCard/README.md`). O placeholder dele é `shopping_bag` fixo (`:228-230`).
- `RouteErrorState.tsx:48` é o único lugar da fundação que escolhe forma por `useMediaQuery(tabletShellMediaQuery)` — o precedente para quando CSS não basta.

### Requisitos cobertos

- **RF-10** — tablet com grade de 3 colunas em paisagem e 2 em retrato, trilha de categorias fixa no topo, sacola visível conforme a #22 (a sacola é da #49, no `AppShell`; aqui a grade cabe na área que ela deixa).
- **RF-08** — produto sem imagem com placeholder no card de grade (ver decisão 4).
- **RF-12** e **RF-18** no card de grade — par de preços, selo `ThumbDiscountMark`, avaliação **dentro da linha do preço, a 9 do par**.
- **RF-11** — skeleton com a forma do card.
- **RN-08 da #20** — o tablet não rola a página inteira; nenhum alvo abaixo de 44px.
- Critério de aceite da spec: "em tablet paisagem a grade tem 3 colunas e em retrato 2, sem rolagem horizontal".

### Desenho

Fontes: `Cardápio · tablet deitado · 3 colunas`, `Cardápio · tablet em pé · 2 colunas`, `Busca · tablet deitado` e `Estado · vazio` (canvas Brasa Punch Indoor). Token vem de `design-system/tokens.json` e do tema; o canvas dá layout e medida de componente.

| Parte | Paisagem (1180 × 820) | Retrato (820 × 1180) |
|---|---|---|
| Moldura | a do artboard é `minmax(0,1fr) 380px`; ela é do `AppShell` (#49: `Scroller` + coluna de 380). Esta tela preenche só o `Scroller` | a barra de 92 embaixo é do `AppShell` (#49), fora do `Scroller` |
| Trilha de categorias | fixa, `padding: 16px 24px`, gap 10, chips de 44 + chip de busca quadrada de 44 no fim | fixa, `16px 22px` |
| Área que rola | `padding: 0 24px 24px`, rótulo `.sec` "{CATEGORIA} · {N} ITENS" e a grade | `0 22px 22px` |
| Grade | `repeat(3, minmax(0, 1fr))`, gap 16 | `repeat(2, minmax(0, 1fr))`, gap 16 |
| Card `.mc` | raio 18, sombra `elevation-sm`; mídia 128; corpo `12/14/14`, gap 4; nome 14,5/700; descrição 11,5/1,4 em 2 linhas (32); linha do preço a 6, preço 16/800 | mídia 150; corpo `13/15/15`; nome 15; descrição 12 (34); linha a 8; preço 17 |
| Avaliação no card | estrela `star` cheia de 13 em `secondary`, nota 700, contagem 500, 11/1,2 `muted`, a **9** do par de preços | igual |
| Sem foto | fundo `field`, ícone de 44 em `muted`, `role="img"` "Sem foto" | ícone de 48 |
| Busca | voltar 44 + campo 52, trilha de controles, trilha de facetas e faixa de relaxamento **fixas**; contagem e grade rolam; card com a linha `.hit` (`tune` 15 + "{grupo} · **{item}**" 11,5 `muted`, item em `success`) e o `<mark>` no nome | (não desenhado; mesma regra, 2 colunas) |

O raio 18 é `componentRadii.paper` e a sombra é `elevations.sm` (`src/theme/tokens.ts:35-46`); as demais medidas, que o tema não tem, vão para um arquivo de métricas da mesa (mudança 3). **Sem hex** (a laranja do canvas é a marca do tenant de referência; a cor vem de `theme.vars.palette`).

### Decisões

1. **A rolagem do tablet é da coluna, não do `Scroller`.** Uma moldura de tela (`MenuScreenLayout`) divide cabeçalho fixo e região que rola. No tablet ela preenche o `Scroller` (`blockSize: 100%`) e a região tem `overflowY: auto`; no celular as duas partes ficam no fluxo e quem rola continua sendo o `Scroller` — o celular não muda de comportamento.
2. **Quem é o scroller ativo é exposto por contexto.** `useMenuScroller()` devolve o `ref` da região no tablet e o do shell (`useAppScroller()`) no celular, escolhido por `useMediaQuery(tabletShellMediaQuery)` — o mesmo recurso do `RouteErrorState.tsx:48`. O `use-load-more` da 03 recebe esse `ref` como `rootRef`, e a volta ao topo da 03 e da 05 passa a usá-lo. No primeiro render o hook responde `false` (celular) e troca no cliente: o observer é recriado uma vez, sem efeito visível, porque a lista só chega depois da montagem.
3. **Linha no celular, card no tablet, escolhidos pelo mesmo hook.** O conteúdo da lista só existe depois da resposta (sem SSR de catálogo), quando o hook já resolveu — não há troca visível. O **skeleton**, que pinta no primeiro paint, é escolhido por CSS: os dois skeletons (linha e card) vão no HTML e um fica `display: none`, como o `AppShell` faz com os cromos.
4. **Placeholder do card de grade é um ícone fixo da mesa, `restaurant_menu`.** A RF-08 pede "o ícone da categoria (bebida com `local_drink`)", mas o contrato não tem ícone de categoria (01, decisão 3 da 02) e inferir "bebida" pelo nome é inventar dado do tenant. `restaurant_menu` já está na união. **Pendência para o dev:** aceitar o fixo, ou pedir `icon` em `GET /categories/v2` à api (fora da #1607) e mapear para a união com mapa explícito (RN-05 da #20).
5. **O card de grade nasce fora do DS.** `src/components/menu/ProductGridCard.tsx`: é componente da mesa (`modelo-de-design`: "componente que o app de mesa precisa e o client não tem nasce fora dessas duas pastas"). A avaliação no card em grade é decisão da mesa (RF-18), não correção do `ProductCard` compartilhado.
6. **A sacola não é desta tela, nem como slot** (reconciliação com a #22). A coluna de paisagem e a barra de retrato são do `AppShell` ([#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md), decisão 1 de lá): o shell da #20 é o dono do cromo do app e já troca cromo por formato com CSS, e a coluna tem largura fixa de 380 (`cart-dock-metrics.ts` da #49), sem que esta task precise saber o número. A tela preenche o `Scroller` e mais nada; com a coluna montada, o `Scroller` **é** a área do cardápio, e a grade de `minmax(0, 1fr)` divide essa área. Nenhuma medida da grade lê a viewport além das duas media queries de orientação.
7. **A home no tablet continua sendo trilhas.** O canvas desenha o tablet com uma categoria aberta (é o `/menu?category=…` da 03); a aba "Cardápio" leva a `/`, que mostra a trilha de categorias fixa e as trilhas de destaque e por categoria (02) na região que rola. Mostrar a grade da primeira categoria em `/` apagaria "Ofertas" e "Mais pedidos" (RF-19) no tablet. Confirmar com o dev.

### Armadilhas

- **`100dvh` e `<main>` dentro do shell** fazem a tela rolar os 72px da barra no tablet deitado e duplicam o `main` (aprendizado da #20). A moldura usa `blockSize: 100%` e `div`.
- **`minmax(0, 1fr)`, não `1fr`.** Com `1fr`, o nome longo sem quebra ou o par de preços empurra a coluna e aparece rolagem horizontal a 820.
- **Duas medias, uma regra, um lugar.** A grade de 3 é `@media ${tabletLandscapeMediaQuery}`; a de 2 é `@media ${tabletPortraitShellMediaQuery}` — as constantes da 01 em `shell-metrics.ts`, as mesmas com que a #49 troca a coluna pela barra. Compor a media à mão aqui faria a grade e a sacola virarem por regras diferentes. Não criar corte em 768 nem em 1180 (RF-09/RF-10 da #20).
- **A grade não mede a viewport.** Em paisagem, com a coluna da #49, a área é `Scroller − 380` (≈ 800 a 1180 de largura, menos o padding de 24 de cada lado). `vw`, `innerWidth` ou `useMediaQuery` de largura para decidir medida da grade quebram assim que a coluna entra.
- **`rootMargin` só antecipa com o `root` certo.** No tablet, com a região rolando por dentro, observar contra o `Scroller` faria a sentinela disparar só ao entrar na área visível (o comentário do `use-load-more.ts` do client explica). O `rootRef` tem de ser a região.
- **A trilha fixa não pode encolher a área que rola a zero.** A região é `flex: 1; minBlockSize: 0` dentro de uma coluna `flex`; sem o `minBlockSize: 0`, o item de flex nasce com `min-block-size: auto` e estoura.
- **O `ThumbDiscountMark` se posiciona sozinho** (`position: absolute`, inset 6): a caixa da mídia precisa de `position: relative`, e o selo não vai dentro de outro slot posicionado.
- **Alvos de 44:** as chips de faceta do canvas da busca têm 36 e o "tirar filtro" tem 36. Valem os 44 da RN-08 (a chip da 02 e `Button` `md`).

## Mudanças

### 1. Moldura do grupo: nenhuma

Não há `MenuFrame` nem slot `aside` (decisão 6), e `app/(menu)/layout.tsx` não muda. A moldura que divide cardápio e sacola é a do `AppShell` (#49); esta task começa no `Scroller`, com a `MenuScreenLayout` da mudança 2.

### 2. Cabeçalho fixo e região que rola

`src/components/menu/MenuScreenLayout.tsx` (novo) e `src/components/menu/menu-scroller.tsx` (novo):

```ts
export interface MenuScreenLayoutProps { header: React.ReactNode; children: React.ReactNode }
export function useMenuScroller(): React.RefObject<HTMLElement | null>; // decisão 2
export function useIsTabletShell(): boolean;                          // useMediaQuery(tabletShellMediaQuery)
```

Aplicar nas três telas:

- `MenuHomeScreen` (02): `header` = `MenuCategoryRail`; o resto na região.
- `MenuCategoryScreen` (03): `header` = `MenuCategoryRail`; rótulo e lista na região; `useLoadMore(…, useMenuScroller())` e a volta ao topo por `useMenuScroller()`.
- `SearchResultsScreen` (05): `header` = cabeçalho com campo, `SearchControlsRail`, `CategoryFacetRail` e a faixa de relaxamento; contagem e lista na região; o mesmo para `useLoadMore` e volta ao topo.

### 3. Card e grade

- `src/components/menu/product-grid-metrics.ts` (novo): as medidas da tabela de Desenho que o tema não tem, por orientação (`landscape`/`portrait`), com o raio e a sombra apontando para `componentRadii.paper` e `elevations.sm`.
- `src/components/menu/ProductGridCard.tsx` (novo): `article` com `ButtonBase` de conteúdo inteiro (`onOpen` → `pushProductSheet`, foco como o `ProductCard.tsx:72-82`); mídia com `next/image` `fill` ou o placeholder da decisão 4; `ThumbDiscountMark` com `formatDiscountLabel` quando `hasVisibleDiscount`; nome com `HighlightedText` (`mark`) quando há termo; descrição em 2 linhas; linha `.hit` com `matched_option` quando vier (busca); linha do preço com o par de `resolveShowcasePrice` (vigente em `brand.text` com promoção, `surface.ink` sem; cheio riscado 11,5/600 `muted`, `aria-hidden`) e a avaliação de `resolveRatingDisplay` a 9. **Sem `+`** e sem `IconButton` nenhum.
- `src/components/menu/ProductGrid.tsx` e `ProductGridSkeleton.tsx` (novos): a grade da tabela e um skeleton de 6 cards com a forma do card (mídia + três linhas).

### 4. Lista com duas formas

`src/components/category/CategoryProductList.tsx` (alterado; criado pela 03): `variant: 'list' | 'grid'` e `renderGridItem`. Em `grid`, os itens vão dentro de `ProductGrid`; a linha de carregando, o `InlineError` de página, o fim da lista e a **sentinela incondicional** continuam depois da grade, fora dela, ocupando a largura toda.

`MenuCategoryScreen` (03) e `SearchResultsScreen` (05) (alterados): `variant={useIsTabletShell() ? 'grid' : 'list'}`, com `ProductGridCard` como `renderGridItem` (a busca passa termo e `matched_option`). Skeleton: `CategoryListSkeleton` e `ProductGridSkeleton` juntos, cada um escondido por CSS no formato que não é o seu (decisão 3).

### 5. Chip de busca do tablet

`src/components/menu/MenuSearchChip.tsx` (novo): `Link` para `SEARCH_ROUTE`, quadrada de 44 com `Icon` `search` de 20, `aria-label="Buscar no cardápio"`, `display: none` fora do `tabletShellMediaQuery` (no celular a busca é aba). Entra no `trailing` da `MenuCategoryRail` na home e na categoria.

### 6. Vazio da categoria no tablet

O `EmptyState` da 03 fica centrado na região que rola (o artboard `Estado · vazio` o centra na coluna, com `padding: 0 90px 40px` e `max-width` 420 na descrição). Só layout; copy e ação são as da 03.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars.
2. `grep -rn "100dvh\|styled('main')" src/components/menu src/components/category src/components/search` vazio.
3. `grep -rn "min-width\|max-width\|orientation\|100vw\|innerWidth" src/components/menu src/components/category src/components/search` vazio: os cortes chegam só por `tabletShellMediaQuery`, `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery` importados de `shell-metrics.ts` (nenhum corte novo, nenhuma medida por viewport).
3a. `git diff --stat <base> -- 'app/(menu)/layout.tsx' src/components/shell` vazio.
4. `grep -rn "#[0-9A-Fa-f]\{6\}" src/components/menu src/components/category src/components/search` vazio.
5. `git diff --stat <base> -- src/theme src/components/ui` vazio.

**No navegador** (`next dev`, API com a delivery-api#1626, mesa aberta). DevTools em modo dispositivo, sem barra de navegador.

6. **1180 × 820**, `/menu?category=<id com mais de 24 produtos>`: barra superior da 37, trilha de categorias fixa com a chip de busca no fim, rótulo "{CATEGORIA} · N ITENS", **3 colunas**. Rolar: só a coluna rola; a trilha e a barra não saem; `document.scrollingElement.scrollTop` e o `scrollTop` do `<main>` continuam 0; a página 2 é pedida antes de a sentinela aparecer (antecipação de 240px contra a região).
7. **820 × 1180**: **2 colunas**, mesma trilha fixa.
8. As duas medidas: `document.documentElement.scrollWidth === innerWidth` (sem rolagem horizontal), inclusive com um produto de nome longo sem espaço.
9. Card com `special_price`: vigente em `brand-text` com o cheio riscado ao lado e o selo `-N%` igual ao payload; com `rating.average`, estrela + nota + "(N)" na mesma linha do preço; com `average: null`, nada; sem `image_url`, fundo `field` com `restaurant_menu` e "Sem foto" no leitor.
10. Tocar no card abre o detalhe (04) como painel em 1180 e folha em 820; nenhum card tem `+`.
11. `/search?q=<termo>` a 1180 × 820: campo, trilhas e faixa fixos; grade de 3 com `<mark>` no nome e a linha `tune` "{grupo} · **{item}**" no item com `matched_option`.
12. `/` a 1180 × 820: trilha fixa sem chip `current`, trilhas de destaque e por categoria rolando na região.
13. 390 × 844: nada muda em relação à 02, 03 e 05 (linhas, trilha rolando com a página, scroll infinito no `Scroller`, chip de busca escondida).
14. Girar o aparelho emulado no meio da lista (1180 × 820 ↔ 820 × 1180): a grade troca de 3 para 2 colunas sem recarregar e o scroll infinito continua disparando.
15. Alvos: chips, chip de busca, botões da faixa e do vazio com ≥ 44px.
16. **Com a #49 na base** (se ainda não estiver, este passo fica para a junção): a 1180 × 820, a coluna de 380 à direita e a grade de 3 colunas no que sobra, sem rolagem horizontal e sem card cortado; a 820 × 1180 com itens na sacola, a barra de 92 abaixo da região que rola, e a última linha da grade inteira acima dela.

## Critérios de aceitação

- [ ] No shell de tablet, a listagem da categoria e a busca são grade de 3 colunas em paisagem e 2 em retrato, sem rolagem horizontal; no celular continuam linhas.
- [ ] A trilha de categorias (e, na busca, campo, trilhas e faixa) fica fixa; só a região de conteúdo rola, e nem o documento nem o `<main>` do shell rolam no tablet.
- [ ] O scroll infinito no tablet observa contra a região que rola, e a sentinela continua incondicional.
- [ ] O card de grade mostra par de preços, selo `ThumbDiscountMark` com o percentual do payload, avaliação na linha do preço a 9 do par (nada com `average: null`), `matched_option` na busca, e não tem `+`.
- [ ] Produto sem imagem mostra o placeholder da decisão 4 com nome acessível "Sem foto".
- [ ] A tela não reserva lugar para a sacola e não altera `app/(menu)/layout.tsx` nem `src/components/shell/`; a grade divide o `Scroller` que o shell entrega, com ou sem a coluna da #49.
- [ ] A grade de 3 e a de 2 trocam por `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery` de `shell-metrics.ts`.
- [ ] A chip de busca aparece no fim da trilha só no tablet e leva a `/search`.
- [ ] Nenhum corte de media novo, nenhum hex, nenhum `<main>`/`100dvh` nas telas, e nenhum arquivo de `src/theme/` ou `src/components/ui/` muda.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- A coluna e a barra da sacola (moldura, conteúdo, vazio, "Enviar pedido"): [#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md), no `AppShell`.
- Ícone por categoria na trilha e no placeholder (pendência da decisão 4).
- Desktop 1440 do cardápio: o canvas não desenha; vale o que a paisagem do tablet entrega acima de 1024.
- O detalhe do produto em si: 04 (a forma é do `Overlay`).
- Corrigir no client o `ProductCard` de largura fixa ou a folha de 480: não é preciso — a grade usa card próprio.

## Branch

`task/45-tablet-menu-grid`, cortada em 2026-11-24 de `task/44-menu-search-v2` (`b91ccde`) com `task/43-product-detail-composer` (`f72d151`) mesclada por cima (`438478d`): nenhuma das quatro dependências entrou na `feat/indoor-v2` ainda, e a 04 corre noutra linha.

## Implementação

**Concluída em:** 2026-11-24

### Camadas tocadas

- Novos em `src/components/menu/`: `MenuScreenLayout` (cabeçalho fixo + região que rola), `menu-scroller.ts` (`useIsTabletShell`, `useMenuScreenScroller`), `ProductGridCard`, `ProductGrid`, `ProductGridSkeleton`, `PhoneOnly`, `MenuSearchChip`, `product-grid-metrics.ts`.
- Alterados: `MenuHomeScreen`, `MenuCategoryRail` (padding de tablet), `MenuCategoryScreen`, `CategoryProductList` (`variant`/`renderGridItem`; sentinela segue incondicional e fora da grade), `SearchResultsScreen`, `SearchResultsCount` (padding de tablet).
- Não tocados: `app/(menu)/layout.tsx`, `src/components/shell/`, `src/theme/`, `src/components/ui/`, `SearchControlsRail`, `SearchProductItem` (a linha `.hit` mora no `ProductGridCard`, o que deixa o rebase da #67 sem conflito).

### Contratos consumidos

- `GET /products/v2` e `GET /categories/v2`, nos shapes das tasks 01-05, via `page.route`. Nenhuma rota nova.

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- A task pedia `useMenuScroller()` por contexto. Como a tela chama o hook acima da moldura que provê o contexto, fiz `useMenuScreenScroller()` devolver `{ regionRef, scrollerRef }`; a tela passa `regionRef` ao `MenuScreenLayout` e `scrollerRef` ao `useLoadMore` e à volta ao topo. Sem contexto.
- `MenuHomeScreen` também usa a moldura (trilha fixa); o skeleton da home não tem trilha fixa.
- `MenuSearchChip` entra sempre no `trailing`; no celular fica `display: none`, então a `MenuCategoryRail` deixa de devolver `null` com zero categorias (sobra o padding da trilha vazia).
- Ícone do placeholder: dois glifos (44 e 48) alternados por media query, porque `Icon` tem tamanho fixo por prop.
- Margem lateral do tablet (24 deitado, 22 em pé) num só helper, `menu/tablet-gutter.ts`, usado pela grade, rodapé da grade, rótulo, avisos, skeleton, trilhas e cabeçalho da busca (`SearchHeader`, `SearchControlsRail`, `CategoryFacetRail`, `RelaxSuggestionBand`, `SearchResultsCount`). Na `SearchControlsRail` a mudança é só a linha da media no `Rail`.
- Rodapé da grade (carregando, erro, fim) num slot com a mesma margem; carregando na grade é só a linha de status com spinner (`CategoryLoadingRow withSkeleton={false}`). A sentinela segue fora e incondicional.
- Vazio da categoria centrado no tablet por `EmptySlot` (`minBlockSize: 100%`, `0 90px 40px`).
- `MenuCategoryRail` vazia fica `display: none` fora do tablet; `regionRef` opcional (a home não usa o scroller); região sem barra de rolagem; `useMenuScreenScroller` devolve `isTablet`; aviso de falha ao atualizar da home volta para cima da trilha; chip de busca no estilo `.chip` (card, borda 1,5 `line`, pill).
- A busca no tablet mostra o `matched_option` numa linha própria abaixo da descrição, não no lugar dela.

### Como testar

1. `yarn dev` com mesa aberta (ou mock de `/categories/v2`, `/products/v2` e `/boardMovements/*`).
2. 1180x820, `/menu?category=<id>&session=<uuid>`: 3 colunas, trilha com chip de busca fixa; rolar a região dispara a página 2; `document` e `<main>` ficam em `scrollTop` 0.
3. 820x1180: 2 colunas. 390x844: linhas, como antes.
4. `/search?q=<termo>`: campo e trilhas fixos, `<mark>` no nome e linha `tune` no item com `matched_option`.

### O que NÃO foi verificado

- Contra a api real (sem `/products/v2` local): tudo com `page.route`; a movimentação `c10e064f-...` não existe no restaurante 18 local, então `/boardMovements/*` também foi mockado.
- Medido no navegador (390/820/1180): colunas 1/2/3 na categoria e na busca, sem rolagem horizontal (`scrollWidth == innerWidth`, com nome longo sem espaço), trilha parada ao rolar a região, página 2 pedida, documento e `<main>` em 0. Screenshot só de 1180 na busca.
- Medido após a revisão (1180 e 820, mocks): com a página 2 pendente e com ela falhando, o rodapé e os cards começam em x=24/22; a busca (cabeçalho, trilhas, cards) alinha em 24/22; `region.scrollWidth === clientWidth`.
- Não verificado: girar o aparelho no meio da lista, home no tablet, alvos de 44px por medição, estado vazio/erro/skeleton do tablet, selo e riscado no retrato, passo 16 (#49 não está na base), `yarn build`, e todas as imagens reais (os fixtures não têm `image_url`, só o placeholder foi exercitado).

## Follow-ups identificados em review

Corrigido no review (2026-11-24):
- Rodapé da grade (carregando, erro e fim) na margem lateral dos cards, e carga em forma de linha de status em vez da linha-esqueleto do celular.
- Busca e categoria alinhadas em 24/22 no tablet, com `tablet-gutter.ts`, como no artboard `Busca-Tablet-Deitado`.
- Vazio da categoria centrado no tablet (mudança 6).
- Trilha de categorias vazia escondida no celular.
- `regionRef` opcional, e a home sem `useMenuScreenScroller`.
- Barra de rolagem da região escondida.
- Chip de busca no formato do `.chip` do canvas.
- Números soltos movidos para `product-grid-metrics.ts`, e skeleton do retrato com mídia de 150.
- Aviso de falha da home de volta acima da trilha no celular.

- [ ] Helper de apresentação compartilhado para a contagem da nota (`(N)`) e para o texto do `matched_option`: hoje em `ProductGridCard`, `CategoryProductItem` e `SearchProductItem`.
- [ ] Margens laterais da home no tablet (trilha a 24, destaques e seções a 16/18): a home não tem artboard de tablet; confirmar com o dev.
- [ ] Tablet pequeno deitado (1024×600): o cabeçalho fixo da busca ocupa cerca de 260px e sobra uma fileira de cards.
- [ ] Navegador, ainda não exercitado:
  - girar no meio da lista;
  - home no tablet;
  - alvos de 44 medidos;
  - imagem real, selo e riscado no retrato;
  - vazio centrado e erro de rota no tablet;
  - 390 depois das correções;
  - a coluna da sacola com a #49.
