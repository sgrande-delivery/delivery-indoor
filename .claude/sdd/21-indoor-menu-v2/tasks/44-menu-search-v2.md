# 05 — Busca no cardápio pela rota v2

**Issue:** [#44](https://github.com/sgrande-delivery/delivery-indoor/issues/44)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 03 (#42)
**Status:** pendente
**Alinhado às emendas da delivery-api#1607 (2026-11-23):** a lista de categorias da faceta e o `label` do relaxamento de categoria passam a ser os da mesa (mudança 6 da #1626, que antes dizia "sem mudança"), e o `special_price` dos resultados passa a ser o da promoção de mesa (#1765). O filtro por ingrediente deixou de estar parado: a #1764 abriu `environment` em `GET /ingredients`, e ele é a linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), que depende desta. O escopo desta task não muda.

## Objetivo

`/search` passa a buscar no servidor: o termo vai em `GET /products/v2?q=`, com as seis ordenações (abrindo em "Mais vendidos"), o filtro "só promoções", as facetas de categoria com a contagem que o servidor manda e a faixa "tirando o filtro X aparecem mais N produtos" que ele propõe. Cada resultado destaca o trecho casado no nome e, quando casou por opção, mostra o `matched_option`. Termo que só existe na página 3 do cardápio aparece — é o defeito da v1 que esta tela fecha (RN-06).

**O filtro por ingrediente (RF-15) não está aqui.** Ele é a linha 07 do plan, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), que depende desta tela e acrescenta o seletor, as chips "com/sem" e os ramos de ingrediente do relaxamento. A divergência D1 que o parava (`GET /ingredients` sem ambiente) foi resolvida pela delivery-api#1764.

## Contexto

### Estado atual

- `src/routes/app-routes.ts:7`: `SEARCH_ROUTE = '/search'`. Não existe `app/(menu)/search/`.
- `src/components/shell/shell-tabs.ts:19`: a aba "Busca" do celular está com `isAvailable: false` (inerte, a 37 esperava esta frente). No tablet a busca não é aba (`TABLET_TAB_KEYS = ['menu', 'board']`, `:24`): a entrada é a chip de busca da trilha (06). `resolveActiveTab` já marca `search` no celular e `menu` no tablet para `/search` (`:39-41`).
- `src/providers/board-session/browsable-routes.ts`: depois da 03, `[/, /menu]`. `/search` em `browsing` cai na tela sem mesa.
- A 03 entrega `use-load-more.ts`, a `CategoryProductList` (com `renderItem`, sentinela incondicional e erro de página) e o padrão de leitura de `searchParams` no server component. A 01 entrega `boardCatalogParams`, `CATALOG_PAGE_LIMIT`, `productSorts` (seis valores, na ordem da RF-14), `ProductPageResponse` com `facets`, `resolveShowcasePrice` e `resolveRatingDisplay`.
- `src/helpers/highlight.ts:86` (`findHighlightRanges`) e `src/components/ui/HighlightedText.tsx` vieram com o DS: o `ProductListItem` já aceita `highlights.name` (o `<mark>` do termo) e `highlights.description` (o negrito `success`), `ProductListItem.tsx:33-45`.

### Requisitos cobertos

- **RF-07** e **RN-06** — busca no servidor, nunca filtro do que já foi carregado.
- **RF-14** — seis ordenações em português, `best_selling` por padrão.
- **RF-16** — `meta.facets.categories` desenha as chips de categoria com contagem; `meta.facets.relaxed` desenha a faixa com a ação de tirar o filtro.
- **RF-17** — `only_offers` combina com ordenação e categoria sem recarregar a tela.
- **RF-12**, **RF-13**, **RF-18** — mesma linha da 03.
- Critério de aceite da spec: "um termo que casa só com ingrediente ou opção devolve o produto, com o trecho casado destacado e `matched_option` na linha".

### Contrato consumido

`GET /products/v2?environment=board&q=<termo>&category_id=<int>&sort=<sort>&only_offers=1&page=<n>&limit=24`, só com as chaves presentes (lista fechada, `SearchProductsRequest.php:14-25`; `q` ≤ 120). Resposta:

```ts
{
  data: (ProductSummary & { matched_option?: { item_name: string; group_name: string } })[];
  meta: {
    total: number; per_page: number; current_page: number; last_page: number; has_more: boolean;
    facets: {
      categories: { id: number; name: string; count: number }[]; // o catálogo inteiro, com zeros
      relaxed: { filter: 'q' | 'category_id' | 'include_ingredients' | 'exclude_ingredients'; value: string; label: string; additional_count: number }[];
    };
  };
}
```

Regras do servidor que a tela só lê, medidas em `core/Product/Application/Services/ProductSearchFacetsService.php`:

- `relaxed` só vem com **menos de 5 resultados** (`RELAXED_TOTAL_THRESHOLD`), até 5 candidatos, com `label` já resolvido (`"smash"`, `"Burgers"`), `additional_count > 0`, ordenado por `additional_count` desc. Candidato sem `label` resolvível é descartado lá.
- A faceta de categoria conta com o critério da busca; o client mediu que ela **ignora o próprio filtro de categoria** (`use-search-results.ts` @ `ceed49a9`), então ela não se recalcula sobre a página.
- `matched_option` aparece no item que casou por opção/ingrediente (`SearchProductsPresenter.php:69`).

Antes da delivery-api#1626: 422 (`environment` desconhecido) — erro de rota com o código, sem contorno.

**Facetas e preço no ambiente mesa.** Com `environment=board`, `meta.facets.categories` lista as categorias **da mesa**, com a contagem da mesa, e o relaxamento de `category_id` de categoria só de mesa traz o `label` (mudança 6 da #1626, emenda de 2026-11-23; a lista vinha com `EnvironmentEnum::DELIVERY` cravado em `ProductSearchFacetsService.php:50`). `special_price` e `discount_percent` de cada resultado são os da promoção de mesa (#1765); antes dela, "Só promoções" já seleciona as ofertas da mesa (`announcedDiscounts`, pela #1626), mas o card de uma oferta só de mesa sai sem o preço promocional.

### O que vem do `delivery-client` (`origin/feat/app-v2` @ `ceed49a9`)

| Fonte | Decisão | Tradução |
|---|---|---|
| `src/helpers/search-params.ts` (262 linhas) | adapta | Fica: um nome por parâmetro (os da api: `q`, `category_id`, `sort`), parse que descarta o que a api recusaria, `buildSearchHref`/`searchTermHref`/`hasActiveSearch`. **Entra** `only_offers` (`'1'` liga). **Sai** `include_ingredients`/`exclude_ingredients` (voltam na linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67)) e tudo de `/categoria`. `sort` ausente = `best_selling` nesta tela, e `best_selling` não vai para o endereço (o par `resolveCategorySort`/`categorySortQueryValue` do client, `category-sort.ts:40-61`) |
| `src/services/search.ts` | adapta | `searchPageParams` passa por `boardCatalogParams`, manda `sort` sempre resolvido e `only_offers: 1` quando ligado. `selectSearchResultsPage` porta (guarda `relaxed`, `categoryLabel` e `categoryFacets`). Sai `fetchSearchPendingSummary` (contagem do sheet de filtros) |
| `src/types/search.ts` | adapta | `relaxableFilters` fica com os **quatro** valores da api — o tipo diz o que o servidor manda — e a frase só existe para `q` e `category_id` (ver decisões) |
| `src/components/search/use-search-results.ts` | adapta | Sai `initialData` e o `hidesStaleResults` (só faz sentido com exclusão de ingrediente; volta com a linha 07). Entra o dedupe por `public_id` da 03 |
| `SearchScreen.tsx`, `SearchSection.tsx`, `SearchCategories.tsx`, `use-search-categories.ts` | adaptam | A entrada sem termo: campo e atalho por categoria (via `useMenuCategories`, 01, para `categoryRouteHref`). **Sai** `RecentSearches` |
| `SearchResultsScreen.tsx` | adapta | Sai `ActiveFilterRail` + `SearchFiltersSheet` (o filtro é em trilha, ver decisões) e o `ingredientLabels`. Entram as duas trilhas da mudança 5 |
| `SearchHeader.tsx`, `SearchField.tsx`, `SearchTermField.tsx` | adaptam | Copy do artboard (tabela abaixo). O voltar é `Link` para `/` |
| `use-search-navigation.ts` | adapta | Sai `recent-searches` e `useBackNavigation`/`app-history` (o rastreio de profundidade de histórico exige instalar um patch do `history` na raiz) |
| `SearchProductItem.tsx` | adapta | + `matched_option` (decisão 5); formatador de nota via `resolveRatingDisplay` |
| `RelaxSuggestionCard.tsx`, `relax-suggestion.ts` | adaptam | Copy do artboard; os ramos de ingrediente ficam fora até a linha 07 |
| `SearchResultsCount.tsx`, `result-count.ts`, `SearchResultsEnd.tsx`, `SearchResultsStatus.tsx`, `SearchTextAction.tsx` | portam | `SearchResultsCount` com a frase do artboard |
| `filters/SortChips.tsx` + `src/components/category/category-sort.ts` | adaptam | Viram `search-sort.ts` (seis opções) e o `SearchSortOverlay` |
| `filters/CategoryFacetChips.tsx` | adapta | Sai do sheet e vira trilha; só chips com `count > 0`, mais a selecionada |
| `RecentSearches.tsx`, `recent-searches.ts` | **descarta** | Histórico no `localStorage` de um tablet compartilhado mostra a busca de quem sentou antes (RN-01 da #20) |
| `ActiveFilterChipItem.tsx`, `ActiveFilterRail.tsx`, `FiltersChip.tsx`, `active-filters.ts`, `filters/SearchFiltersSheet.tsx`, `SearchFiltersActions.tsx`, `use-pending-filters.ts`, `use-pending-count.ts`, `RevealMoreAction.tsx`, `filters-surface.ts` | **descarta** | O sheet de filtros com contagem pendente é o desenho do delivery; a mesa filtra em trilha, aplicando na hora |
| `filters/IngredientFilter.tsx`, `IngredientChip.tsx`, `IngredientAnnouncer.tsx`, `ingredient-catalog.ts`, `ingredient-tri-state.ts`, `use-ingredient-catalog.ts`, `ingredient-chip-skin.ts`, `src/services/ingredients.ts` | **fora** | Linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67) |

### Desenho

Fonte: `Busca · tablet deitado` (canvas Brasa Punch Indoor) para hierarquia e copy; no celular, `Brasa Punch - Busca` (canvas do cliente). A grade de cards do tablet é da 06; aqui a lista é a linha `ProductListItem lg` em todos os formatos.

1. Cabeçalho: voltar (44, "Voltar ao cardápio") + campo de 52 com lupa, `placeholder` e limpar.
2. Trilha de controles: chip de ordenação (`swap_vert` + rótulo da ordenação ativa), "Só promoções" (alternador).
3. Trilha de facetas: uma chip por categoria com a contagem ao lado do nome (o `count` do `Chip`, `Chip.tsx:28-29`), a selecionada em `solid`, com 44px (a `MenuCategoryChip` da 02) e não os 36 do artboard (RN-08 da #20).
4. Faixa de relaxamento, quando houver.
5. Linha de contagem "{N} resultados para “{termo}”" e, à direita, "página {atual} de {última}".
6. A lista.

| Onde | Copy | Fonte |
|---|---|---|
| Campo | rótulo oculto "Buscar no cardápio", `placeholder` "Buscar produto ou ingrediente", limpar "Limpar busca" | artboard |
| Voltar | `aria-label="Voltar ao cardápio"` | artboard |
| Ordenações | Mais vendidos · Melhor avaliados · Maior desconto · Menor preço · Maior preço · Novidades | RF-14 |
| Promoção | "Só promoções" | artboard |
| Contagem | "7 resultados para “smash”"; sem termo, "7 resultados" (`formatResultCount`) | artboard / client |
| Paginação | "página 1 de 2" | artboard |
| Relaxamento | "Tirando o filtro **{label}**, aparecem mais **{N} produtos**." + "tirar filtro"; para `q` o label vai entre aspas, para categoria vai cru; 1 → "mais **1 produto**" | artboard (o "Tire o termo…" do client sai) |
| `matched_option` | "{group_name} · **{item_name}**" | artboard (linha `.hit`) |
| Vazio | "Nada encontrado" · "Tente outro termo ou tire um dos filtros." | client (`SearchResultList.tsx:19-20`) |
| Erro | `RouteErrorState` "Não conseguimos fazer a busca" + a descrição **derivada** da 02 | derivada |

### Decisões

1. **Filtros em trilha, aplicados na hora, nos dois formatos.** O artboard da mesa põe ordenação, "só promoções" e facetas em trilhas acima da lista; não há sheet com "Ver N resultados" para estes três. Cada toque é `router.push` para o endereço novo (o estado da busca vive na URL, como no client: recarga, voltar e link preservam o recorte). É decisão desta task para o celular (o desenho do client lá é o sheet); confirmar com o dev.
2. **A ordenação abre num `Overlay`** (`aria-label="Ordenar por"`) com as seis opções em `Radio`, a ativa marcada. O artboard só desenha a chip fechada; a lista aberta é **derivada** da `SortChips` do client. A chip não tem o `expand_more` à direita do artboard: o `Chip` do DS não tem ícone final, e o primitivo não muda (RN-12 da #20).
3. **`best_selling` é o padrão e não vai para o endereço** (RF-14). `/search?q=x` pede `sort=best_selling`; `/search?q=x&sort=newest` pede `newest`.
4. **A faceta mostra só `count > 0`**, mais a categoria selecionada mesmo com zero (para o cliente poder desmarcar). O servidor manda o catálogo inteiro com zeros (medido pelo client: `?q=pastel` → 12 categorias, 11 zeradas). Tocar na selecionada tira o `category_id`.
5. **`matched_option` no celular entra no lugar da descrição.** O `ProductListItem` lg mostra **uma** linha de descrição e não tem slot para a linha extra do artboard; quando o item traz `matched_option`, a descrição passada é "{group_name} · {item_name}" com `highlights.description` no `item_name` (o negrito `success`). A linha extra com `tune` é do card de grade (06), que é da mesa. Não se altera o primitivo.
6. **A frase de relaxamento existe para `q` e `category_id`.** Até a linha 07 ([#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67)) entrar, a busca nunca manda ingrediente, e o servidor não propõe tirar o que não foi pedido. O `Record` de frases do client (`relax-suggestion.ts:64-67`) fica com as quatro chaves para o `tsc` cobrar a linha 07 quando ela entrar; as duas de ingrediente ficam com a copy do artboard ("com {x}", "sem {x}").
7. **Sem termo e sem filtro é a entrada:** campo com foco e "Categorias" com os atalhos para `/menu?category=<id>` — a listagem completa da categoria, não uma busca filtrada.

### Armadilhas

- **Busca local volta pela porta dos fundos** se alguém filtrar `products` no cliente "para destacar". Toda lista desta tela é a resposta do servidor; o destaque é só marcação sobre o que veio.
- **O campo não empurra URL a cada tecla.** O termo é estado local do campo e sobe no envio (o client explica: um `router.push` por caractere daria uma entrada de histórico por letra). O campo remonta por `key={filters.term ?? ''}` quando o termo do endereço muda.
- **Uma chave de query por endereço canônico** (`['search-results', buildSearchHref(filtrosResolvidos)]`): o mesmo recorte alcançado por caminhos diferentes reusa o cache, e trocar só o `sort` cria outra query — a lista nova nasce `pending` (skeleton).
- **Trocar o recorte volta a lista ao topo**, como a 03 faz com a categoria (o efeito por href canônico do client, `CategoryScreen.tsx:84-93` @ `ceed49a9`).
- **`only_offers=true` é 422.** A 01 já escreve `1`; o parser aceita só `'1'` na leitura.
- **`q` com mais de 120 caracteres é 422.** O campo limita (`maxLength`), e o parser corta o que vier pela URL.
- **A faceta de categoria não mostra categoria só de mesa** até a mudança 6 da delivery-api#1626 subir (ver Contrato). Não "complete" a faceta com `useMenuCategories`: a contagem seria inventada.

## Mudanças

### 1. Estado da busca no endereço

`src/helpers/search-params.ts` (novo; ver inventário):

```ts
export interface SearchFilters { term: string | null; categoryId: number | null; sort: ProductSort | null; onlyOffers: boolean }
export const emptySearchFilters: SearchFilters;
export function parseSearchFilters(source: Record<string, string | string[] | undefined>): SearchFilters;
export function resolveSearchSort(sort: ProductSort | null): ProductSort; // null → 'best_selling'
export function buildSearchHref(filters: SearchFilters): string;          // '/search?…', sem sort quando best_selling
export function hasActiveSearch(filters: SearchFilters): boolean;          // termo, categoria ou onlyOffers
export const SEARCH_TERM_MAX_LENGTH = 120;
```

### 2. Serviço e tipos

`src/types/search.ts` (novo) e `src/services/search.ts` (novo; ver inventário):

- `searchPageParams(filters, page)` → `boardCatalogParams({ page, limit: CATALOG_PAGE_LIMIT, sort: resolveSearchSort(filters.sort), ...(term && { q }), ...(categoryId && { category_id }), ...(onlyOffers && { only_offers: 1 }) })`.
- `fetchSearchResultsPage({ filters, page })` → `GET /products/v2` → `selectSearchResultsPage(response.data, filters.categoryId)`.
- `searchResultsQueryKey(filters)`.

### 3. Query

`src/components/search/use-search-results.ts` (novo): `useInfiniteQuery` com o mesmo `getNextPageParam` da 03, `staleTime` 5 min, e devolve `{ query, products (dedupe), total, relaxed, categoryLabel, categoryFacets, lastLoadedPage }` lidos da **primeira** página (contagem e facetas) e da última (paginação).

### 4. Ordenação

`src/components/search/search-sort.ts` (novo):

```ts
export const searchSortOptions: { sort: ProductSort; label: string; icon: IconName }[] = [
  { sort: 'best_selling', label: 'Mais vendidos', icon: 'local_fire_department' },
  { sort: 'rating', label: 'Melhor avaliados', icon: 'star' },
  { sort: 'discount_desc', label: 'Maior desconto', icon: 'sell' },
  { sort: 'price_asc', label: 'Menor preço', icon: 'arrow_downward' },
  { sort: 'price_desc', label: 'Maior preço', icon: 'arrow_upward' },
  { sort: 'newest', label: 'Novidades', icon: 'auto_awesome' },
];
```

Os seis ícones já estão em `src/components/ui/icon-names.ts` — **nenhum nome novo**, nenhum `yarn fonts:icons`.

`src/components/search/SearchSortChip.tsx` e `SearchSortOverlay.tsx` (novos): a chip (44px, `styled(Chip)` da 02, ícone `swap_vert`, rótulo da opção ativa) abre o `Overlay`; escolher fecha e navega; escolher a ativa só fecha (não empilha histórico igual, RN-105.7 do client).

### 5. Trilhas de filtro e faixa

- `src/components/search/SearchControlsRail.tsx` (novo): `SearchSortChip` + chip "Só promoções" com `selected={onlyOffers}` (alternador, `aria-pressed`), que navega com `onlyOffers` invertido.
- `src/components/search/CategoryFacetRail.tsx` (novo; adapta `filters/CategoryFacetChips.tsx`): chips com `count`, `selected` na de `categoryId`, decisão 4.
- `src/components/search/RelaxSuggestionCard.tsx`, `relax-suggestion.ts` (novos; adaptam): escolhe o candidato pelo desempate do client e monta o href sem aquele filtro.

### 6. Linha e lista

`src/components/search/SearchProductItem.tsx` (novo; adapta): `ProductListItem lg` sem `+`, `highlights.name = findHighlightRanges(name, [term])`, descrição conforme a decisão 5, preço/selo/nota como na 03. A lista é a `CategoryProductList` da 03 com `renderItem`.

### 7. Telas e rota

- `src/components/search/SearchScreen.tsx` (entrada) e `SearchResultsScreen.tsx` (resultados), com `SearchHeader`, `SearchField`/`SearchTermField`, `use-search-navigation.ts` (ver inventário).
- Resultados, pela `view` do `useQueryScreenState`: `skeleton` → `CategoryListSkeleton` (03); `error` → `RouteErrorState`; `content` vazio → `EmptyState` `icon="search_off"` com a copy da tabela e, havendo `relaxed`, a faixa logo abaixo; `content` → trilhas, faixa (se houver), contagem e lista. `query.isRefetchError` → `InlineError` no topo; erro de página → o da `CategoryProductList`.
- `app/(menu)/search/page.tsx` (novo, server component): `parseSearchFilters(await searchParams)`; `hasActiveSearch` → `<SearchResultsScreen filters={filters} />`, senão `<SearchScreen />`. Sem `useSearchParams`.

### 8. Navegação e sem mesa

- `src/components/shell/shell-tabs.ts:19` (alterado): `isAvailable: true` na aba `search`.
- `src/providers/board-session/browsable-routes.ts` (alterado): `+ SEARCH_ROUTE`.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars (`/search` dinâmica).
2. `grep -rn "localStorage\|recent" src/components/search` vazio; `grep -rn "include_ingredients\|exclude_ingredients\|/ingredients" src` só no tipo de `relaxableFilters`.
3. `grep -rn "\.filter(" src/components/search` não encontra filtro sobre a lista de produtos (só sobre facetas e candidatos).

**No navegador** (`next dev`; API local com a delivery-api#1626 — sem ela, a primeira busca mostra o erro de rota `erro 422` e o resto não roda). Network filtrado por `products/v2`.

4. Aba "Busca" do celular (390 × 844) leva a `/search`: campo com foco, "Categorias" com atalhos que abrem `/menu?category=<id>`.
5. Buscar o nome de um produto que, na ordem `newest` da categoria, está além da página 1: ele aparece; a requisição é `q=<termo>&sort=best_selling&page=1&limit=24&environment=board`.
6. Abrir a ordenação, escolher "Melhor avaliados": a URL ganha `sort=rating`, o request leva `sort=rating`, a ordem muda, a lista volta ao topo. Escolher "Mais vendidos" tira `sort` da URL.
7. "Só promoções": `only_offers=1` no request; com "Maior desconto" junto, os dois vão; desligar tira a chave.
8. Facetas: os números das chips são os de `meta.facets.categories` da resposta (conferir no Network); categorias com zero não aparecem; tocar filtra (`category_id`), tocar de novo tira.
9. Termo raro com menos de 5 resultados e uma categoria marcada: a faixa "Tirando o filtro **Burgers**, aparecem mais **N produtos**." com o `additional_count` do payload; "tirar filtro" navega sem o `category_id`.
10. Termo que só casa com opção (ex.: o nome de um adicional): o produto aparece com "{grupo} · **{item}**" no lugar da descrição e o termo marcado no nome, se casar.
11. Rolar resultados com mais de uma página: mesmo comportamento da 03, inclusive o erro de página (bloquear `*page=2*`).
12. `/search?q=` + 121 caracteres pela URL: o request sai com 120. `/search?only_offers=true`: o parser não liga o filtro (só `1`).
13. Sem mesa → "Ver o cardápio" → aba Busca: `/search` abre em `browsing`.

## Critérios de aceitação

- [ ] Toda busca é `GET /products/v2` com `environment=board`; nenhuma tela filtra no cliente o que já foi carregado.
- [ ] As seis ordenações aparecem com os rótulos da RF-14; o padrão enviado é `sort=best_selling`; trocar para "Melhor avaliados" envia `sort=rating`.
- [ ] "Só promoções" envia `only_offers=1` e combina com ordenação e categoria; desligado, a chave não vai.
- [ ] As chips de categoria mostram o `count` de `meta.facets.categories`, sem recontagem, e escondem as de zero (salvo a selecionada).
- [ ] A faixa de relaxamento usa `label` e `additional_count` do servidor e a ação tira exatamente o filtro nomeado.
- [ ] O termo aparece marcado no nome, e o item com `matched_option` mostra grupo e item na linha.
- [ ] O estado da busca vive na URL: recarregar, voltar e abrir o link reproduzem termo, ordenação, categoria e promoção.
- [ ] A aba Busca do celular está ativa e `/search` abre em `browsing`.
- [ ] Nenhum histórico de busca é gravado; nenhum ingrediente é enviado.
- [ ] Nenhum arquivo de `src/theme/` ou `src/components/ui/` muda, e nenhum ícone novo entra na união.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- **Filtro por ingrediente** (`include_ingredients`, `exclude_ingredients`, o seletor de `GET /ingredients`, as chips "com/sem", o destaque `success` do ingrediente incluído na descrição, os ramos de ingrediente do relaxamento e o `hidesStaleResults` do client): linha 07 do plan, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), que depende desta.
- Grade de cards e o `matched_option` como linha própria do card: 06.
- A chip de busca no fim da trilha de categorias do tablet: 06.
- Histórico de buscas e "Mais buscados".
- A faceta de categoria do ambiente mesa, do lado da api (`ProductSearchFacetsService.php:50`): mudança 6 da delivery-api#1626.

## Branch

`task/44-menu-search-v2`, base sugerida: `feat/indoor-v2` depois que a 03 (#42) entrar; antes disso, `task/42-category-listing-infinite-scroll`.
