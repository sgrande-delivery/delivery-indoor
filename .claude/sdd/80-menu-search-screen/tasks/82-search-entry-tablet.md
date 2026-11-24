# 02 — Entrada da busca no tablet: grade de categorias e margens do tablet

**Issue:** [#82](https://github.com/sgrande-delivery/delivery-indoor/issues/82)
**Feature:** [Busca do cardápio: tela própria com resultado ao digitar](../spec.md) — issue #80
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 ([#81](https://github.com/sgrande-delivery/delivery-indoor/issues/81))
**Status:** pendente

## Objetivo

No tablet, a entrada da busca (sem termo e sem filtro) mostra as categorias numa grade de tablet, alinhada às margens da tela. Hoje a grade de duas colunas se estica na largura toda e fica longe do campo. No celular, a entrada continua igual.

## Contexto

**Estado atual:**
- `src/components/search/SearchCategoryGrid.tsx:13-15` monta a grade com `gridTemplateColumns: repeat(${searchCategoryGridMetrics.columns}, minmax(0, 1fr))`, e o token é `columns: 2` (`src/theme/component-tokens.ts:1491-1492`, DS, não muda).
- `SearchScreen.tsx` tem um `Body` com `paddingInline: searchSectionMetrics.bodyPaddingInline` (18), sem regra de tablet. Medido na #21 a 1180, o rótulo "Categorias" e a grade ficam fora das margens de 24 que o cabeçalho e os resultados usam.
- Depois da task 01, o corpo da entrada vive dentro da `MenuScreenLayout` da tela única. No tablet, ele está na região que rola.
- `src/components/menu/tablet-gutter.ts` tem `tabletGutter(property)` (24 deitado, 22 em pé) e `phoneGutter` (18).
- `src/components/shell/shell-metrics.ts` tem `tabletShellMediaQuery` e `tabletPortraitShellMediaQuery`.

**Cobre** RF-08 e a decisão pendente 5 da [spec](../spec.md): **4 colunas deitado, 3 em pé**. É derivada, porque o canvas não desenha a entrada no tablet. Os cards seguem os tokens da `SearchCategoryCard`, com `minBlockSize` de 44 desde a #44.

**Armadilha (aprendizado da #45):** o `tabletGutter()` devolve chaves `@media` iguais às do bloco de tablet do próprio estilo. Espalhado no objeto, ele apaga o bloco que veio antes, sem erro. Passe-o como **argumento à parte** do `styled`, como na `MenuCategoryRail`.

## Mudanças

### 1. Grade com colunas de tablet

`src/components/search/SearchCategoryGrid.tsx` (alterado): `gridTemplateColumns` com 2 colunas no celular (o token), 4 em `tabletShellMediaQuery` e 3 em `tabletPortraitShellMediaQuery`. As constantes de colunas do tablet ficam numa métrica local (`search-metrics.ts`), não no tema.

### 2. Margens e ritmo da entrada no tablet

`src/components/search/SearchScreen.tsx` (ou o corpo da entrada que a task 01 extraiu) (alterado): `Body` com `tabletGutter('paddingInline')` como argumento à parte. Confira que, a 1180 e a 820:
- o rótulo "Categorias" e a primeira coluna alinham com o botão de voltar do cabeçalho;
- o espaço entre o cabeçalho e o rótulo segue o ritmo dos resultados (o cabeçalho do artboard `Busca · tablet deitado`: `padding: 14px 24px 10px`).

Meça com `getBoundingClientRect` e registre os números na seção "Implementação".

## Testes

- `npx next typegen && npx tsc --noEmit` e `npx eslint src app scripts` sem erros.
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` concluindo.
- No navegador (Playwright, com mock das rotas v2), `/?session=<uuid>` e depois `/search`:
  - **1180×820:** 4 colunas, com a borda esquerda do rótulo, da primeira coluna e do voltar em 24, e a borda direita da última coluna a 24 da tela;
  - **820×1180:** 3 colunas e margens de 22;
  - **390×844:** 2 colunas e margens de 18, igual a antes;
  - nas três larguras, `region.scrollWidth === region.clientWidth` e `document.scrollingElement.scrollWidth === innerWidth`.

## Critérios de aceitação

- [ ] Tablet deitado: 4 colunas, margens de 24, alinhadas ao cabeçalho.
- [ ] Tablet em pé: 3 colunas, margens de 22.
- [ ] Celular: entrada igual a antes (2 colunas, 18).
- [ ] Sem rolagem horizontal nas três larguras.
- [ ] Nenhuma chave `@media` apagada por `tabletGutter` espalhado.
- [ ] `tsc`, lint e build limpos. `src/theme/` e `src/components/ui/` intocados.

## Fora de escopo

- Busca ao digitar, campo e navegação, que são da task 01.
- Buscas recentes.
- Mudar o token `searchCategoryGridMetrics` do DS.

## Branch

`task/82-search-entry-tablet`, base: `task/81-search-type-ahead`, porque a task 01 move o corpo da entrada.
