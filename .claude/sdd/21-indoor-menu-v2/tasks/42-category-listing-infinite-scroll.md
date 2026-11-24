# 03 — Listagem da categoria com paginação e scroll infinito

**Issue:** [#42](https://github.com/sgrande-delivery/delivery-indoor/issues/42)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 (#40), 02 (#41)
**Status:** pendente
**Alinhado às emendas da delivery-api#1607 (2026-11-23):** o filtro por ingrediente deixou de estar parado e é a linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), na busca, e não nesta tela. O `special_price` dos itens passa a ser o da promoção de mesa com a #1765. Nada mais muda aqui.

## Objetivo

`/menu?category=<id>` lista os produtos de uma categoria do ambiente mesa, página a página, por `useInfiniteQuery` e scroll infinito. Falha numa página seguinte não consome a página: a lista mantém o que já tem, mostra "tentar de novo" e o cursor fica onde estava. A lista que nasce aqui (linha de produto, carregando, fim, sentinela, erro de página) é a que a busca (05) reaproveita e que a 06 troca por grade no tablet.

## Contexto

### Estado atual

- `src/routes/app-routes.ts:5` declara `MENU_ROUTE = '/menu'` com o comentário `/menu?category=<id>`; a 02 acrescenta `categoryRouteHref` e `CATEGORY_SEARCH_PARAM`. Não existe `app/(menu)/menu/`.
- `src/components/shell/shell-tabs.ts:47` já marca a aba "Cardápio" em `/menu` (`isInTree`).
- `src/providers/board-session/browsable-routes.ts:7`: `BROWSABLE_WITHOUT_TABLE` é só `[MENU_HREF]` (`/`). Em `browsing`, `/menu` hoje cai na tela "sem mesa".
- `src/hooks/useInfiniteScroll.ts` (v1, **órfão**: nenhum import) usa `useRef` na sentinela e `root: null` por default (`:9-40`). São exatamente as duas armadilhas da rule `busca-de-dados`: sentinela que remonta não religa o observer, e `rootMargin` não atravessa o recorte do container que rola. Aqui quem rola é o `Scroller` do shell (`src/components/shell/AppShell.tsx:56-65`), exposto por `useAppScroller()` (`:83-91`).
- `src/hooks/use-query-screen-state.ts:52-53`: com dado na tela, `isRefreshFailed` é `isError && !isOffline`. **Numa infinite query, a falha da página seguinte também liga `isError`** — usar `isRefreshFailed` como erro de página acenderia o aviso de "releitura" no topo. A lista lê `isFetchNextPageError` para o rodapé e `isRefetchError` para o topo.
- `src/components/error/InlineError.tsx:11-16` (`message`, `onRetry`, `isRetrying`) e `RouteErrorState.tsx:16-24` são os formatos de erro da 38.

### Requisitos cobertos

- **RF-02** — paginação com scroll infinito, sentinela renderizada **incondicionalmente**.
- **RF-03** — falha na página seguinte mantém a lista, mostra "tentar de novo" e não avança o cursor.
- **RF-12**, **RF-13**, **RF-18** — linha com par de preços e selo, sem `+`, com a avaliação na linha do preço.
- **RF-11** — skeleton com a forma da linha, empty state do artboard `Estado · vazio`, erro de rota da fundação.
- **RN-03** — o próximo cursor sai de `meta.has_more` + `meta.current_page`, nunca de conta sobre `total`/`per_page`.
- **RN-07** — a categoria não é recurso próprio na v2: a tela é o filtro `category_id` da listagem.
- **Decisão pendente 1** da spec — `/menu?category=<id>` (já fixada pela 37 em `app-routes.ts`).
- **Decisão pendente 3** — sem `sort`: vale o `newest` da rota (a 01 não manda o parâmetro).

### Contrato consumido (via `fetchCategoryPage` da 01)

`GET /products/v2?environment=board&category_id=<int>&page=<n>&limit=24` → `{ data: ProductSummary[], meta: { total, per_page, current_page, last_page, has_more } }` (a 01 recorta `facets`). `category_id` é **inteiro** (`SearchProductsRequest.php`, `integer|min:1`); `category`, `category_ids[]` e `categories[]` respondem 422 (medido pelo client, `services/menu.ts` @ `ceed49a9`). Antes da delivery-api#1626 a chamada responde 422 por causa do `environment` — a tela mostra o erro de rota com o código; não há contorno.

O nome da categoria e a lista de chips vêm de `useMenuCategories()` (01), não da listagem: a v2 não tem `GET /categories/{url}` (RN-07).

### O que vem do `delivery-client` (`origin/feat/app-v2` @ `ceed49a9`)

| Fonte | Decisão | Tradução |
|---|---|---|
| `src/hooks/use-load-more.ts` | porta | `useAppScroller()` existe aqui com a mesma assinatura (`AppShell.tsx:83`). O `rootRef` opcional fica: é por ele que a 06 passa o container da coluna do tablet |
| `src/components/category/use-category-products.ts` | adapta | Sai `initialData`/`initialDataUpdatedAt` (não há SSR de catálogo), `SearchFilters`, `resolveCategorySort` e o `hidesStaleResults` (não há filtro de ingrediente nesta tela). O hook recebe `categoryId` e devolve a query inteira, para a tela ler `isFetchNextPageError` |
| `src/components/category/CategoryProductList.tsx` | adapta | Sentinela **incondicional** (lá ela só existe com `hasNextPage`, `:119`); erro da página seguinte vira `InlineError` (lá não há tratamento: o observer religa e repete o request sozinho); o erro da primeira página sai daqui e vai para o `useQueryScreenState`; sai o selo "Nº 1 MAIS VENDIDO" (depende de `sort=best_selling`); a copy do vazio é a do artboard da mesa |
| `src/components/category/CategoryProductItem.tsx` | adapta | Os formatadores locais de nota (`:11-12`) dão lugar a `resolveRatingDisplay` (01); sai `isBestSeller` |
| `src/components/category/CategorySkeletonItem.tsx`, `CategoryLoadingRow.tsx`, `CategoryListEnd.tsx` | portam | — |
| `src/components/category/CategoryScreen.tsx` | adapta | Fica a volta ao topo ao trocar de categoria (`:84-93`). Sai `CategoryHeader` com voltar (a trilha de chips e a navegação do shell fazem esse papel), `CategorySortRail`, `SearchFiltersSheet`, chips de filtro ativo e `useBackNavigation` — ordenação e filtro são da busca (05) |
| `src/components/category/CategoryHeader.tsx`, `CategorySortChip.tsx`, `CategorySortRail.tsx`, `category-sort.ts`, `category-filters-surface.ts` | **descarta** | Ordenação e filtros na categoria não estão no desenho da mesa (`Cardapio-Tablet-*.dc.html`: trilha de chips e grade, nada mais) |
| `app/categoria/[id]/page.tsx` | adapta | A rota vira `app/(menu)/menu/page.tsx` com `searchParams`; sai `generateMetadata` com `loadBoot` e o `loadCategory` de servidor |

### Desenho

`Cardápio · tablet deitado · 3 colunas` e `Cardápio · tablet em pé · 2 colunas` (canvas Brasa Punch Indoor) são a fonte de hierarquia e copy desta tela; a grade em si é da 06. No celular a tela é a mesma hierarquia com a linha `ProductListItem` `lg` do client (`Brasa Punch - Catalogo`):

1. a trilha de categorias (`MenuCategoryRail` da 02) com a categoria aberta como `current`;
2. o rótulo de seção `{NOME} · {N} ITENS` (`.sec` do canvas: 11/800, `0.08em`, maiúsculas, `muted` — os tokens `searchSectionMetrics.label*`, `src/theme/component-tokens.ts:1466-1471`);
3. a lista.

Vazio (artboard `Estado · vazio`): círculo com `restaurant_menu`, "Nenhum produto para mostrar", "{Categoria} está sem itens no momento. Escolha outra categoria aqui em cima — ou chame o garçom se quiser pedir algo que não está no cardápio." e o botão "Ver {outra categoria}". O título usa o `EmptyState` do DS (`typographyTokens.h3`, 19), não os 24 do artboard — vale o primitivo (decisão da 38).

### Decisões

1. **`/menu` sem `category` redireciona para `/`; `category` inválido é 404.** `redirect(HOME_ROUTE)` e `notFound()` no server component. Inválido = não é inteiro positivo; o 404 é o `app/not-found.tsx` da 38.
2. **Categoria válida mas fora das visíveis** (desativada, sem produto de mesa, ou id de outra loja) não é 404: a listagem responde vazia e a tela mostra o vazio do artboard. O rótulo usa "Esta categoria" no lugar do nome. Assim um link velho não leva a uma página de erro.
3. **Dedupe por `public_id` ao achatar as páginas.** A ordem é `newest`: um produto publicado entre a página 1 e a 2 empurra um item da 1 para a 2, e ele apareceria duas vezes. O achatamento mantém a primeira ocorrência. É o critério "sem duplicar item" da spec.
4. **O observer trava em três situações:** sem próxima página, buscando a próxima, ou com erro de página — e também **offline** (`useIsOffline()`, 38): uma busca de página pausada pelo `onlineManager` não conta como `isFetchingNextPage`, e o observer recriado dispararia de novo.
5. **Ícone do botão do vazio sai.** O artboard põe o ícone da categoria em "Ver Burgers"; não há ícone de categoria no contrato (decisão 3 da 02).

### Armadilhas

- **Sentinela condicional + `useRef`** é o modo de falha já pago (task 03 da feature 1). Aqui são as duas defesas juntas: o `use-load-more` usa *callback ref* (o observer segue o nó) **e** a sentinela é renderizada sempre, depois da lista, no mesmo lugar, com ou sem próxima página. O fim da lista é um elemento à parte.
- **`root: null` perde a antecipação.** O `rootMargin: '0px 0px 240px 0px'` do `use-load-more` só funciona com o container que rola como `root`. Não passe `root` nenhum na tela: o default do hook é o scroller do shell.
- **`refetch` de infinite query relê todas as páginas.** Quando a rede volta, o `ConnectivityProvider` (38) refaz as queries ativas: com três páginas carregadas, são três requests em sequência. É o comportamento certo (o cursor continua coerente); não troque por `resetQueries`.
- **`isRefreshFailed` acende com erro de página.** Ver Estado atual. O topo só mostra `InlineError` com `isRefetchError`.
- **Trocar de categoria não remonta a tela.** É `Link` para outra `?category=`: o server component re-renderiza, a prop muda, a query nova nasce `pending` (skeleton) e o scroller do shell continua onde estava — daí a volta ao topo explícita.

## Mudanças

### 1. Gatilho do scroll infinito

`src/hooks/use-load-more.ts` (novo): porta `src/hooks/use-load-more.ts` @ `ceed49a9`, sem mudança de assinatura: `useLoadMore(enabled, onLoadMore, rootRef?) → (node) => void`.

`src/hooks/useInfiniteScroll.ts` (removido): órfão, e com as duas armadilhas. Confirmar com `grep -rn useInfiniteScroll src app` vazio antes de apagar.

### 2. Query da categoria

`src/components/category/use-category-products.ts` (novo):

```ts
export function categoryProductsQueryKey(categoryId: number) {
  return ['menu', 'category-products', categoryId] as const;
}

export interface UseCategoryProducts {
  query: UseInfiniteQueryResult<InfiniteData<ProductPage, number>, unknown>;
  products: ProductSummary[]; // achatado e sem duplicata por public_id (decisão 3)
  total: number | null;       // meta.total da primeira página
}
```

`useInfiniteQuery({ queryKey, queryFn: ({ pageParam }) => fetchCategoryPage(categoryId, pageParam), initialPageParam: 1, getNextPageParam: last => (last.meta.has_more ? last.meta.current_page + 1 : undefined), staleTime: 5 * 60 * 1000 })`.

### 3. Linha e lista

`src/components/category/CategoryProductItem.tsx` (novo): `ProductListItem` `size="lg"` com nome, descrição, `imageUrl`, `price`/`originalPrice`/`discountLabel` de `resolveShowcasePrice`, `rating` de `resolveRatingDisplay` (`{ value, count: \`(${count})\` }`, a anatomia da RF-18 que o primitivo já desenha), `onOpen={() => pushProductSheet(product.public_id)}`. **Sem `onAdd`** — o próprio primitivo documenta que categoria e busca são os consumidores sem `+` (`src/components/ui/ProductListItem.tsx:73-79`).

`src/components/category/CategoryProductList.tsx` (novo):

```ts
export interface CategoryProductListProps {
  products: ProductSummary[];
  renderItem?: (product: ProductSummary) => React.ReactNode; // a busca (05) passa a linha com destaque
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  nextPageError: boolean;
  onRetryNextPage: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}
```

Ordem dos filhos: as linhas → `CategoryLoadingRow` se `isFetchingNextPage` → `InlineError` "Não foi possível carregar mais produtos." com `onRetry={onRetryNextPage}` e `isRetrying={isFetchingNextPage}` se `nextPageError` → `CategoryListEnd` se `!hasNextPage` → **`<Sentinel ref={sentinelRef} aria-hidden />` sempre**. A lista vazia não é decidida aqui (mudança 4).

`src/components/category/CategorySkeletonItem.tsx`, `CategoryLoadingRow.tsx`, `CategoryListEnd.tsx`, `CategoryListSkeleton.tsx` (novos; o último são quatro `CategorySkeletonItem` com `role="status"`, `aria-busy` e `aria-label="Carregando os produtos da categoria"`, como o `CategoryProductList.tsx:58-63` do client).

### 4. Tela

`src/components/category/MenuCategoryScreen.tsx` (novo, `'use client'`), recebe `categoryId: number`:

- `const { query, products, total } = useCategoryProducts(categoryId)`; `screen = useQueryScreenState(query)`.
- `categories = useMenuCategories()`; `visible = selectVisibleCategories(categories.data ?? [])`; `category = visible.find(c => c.id === categoryId)`.
- `sentinelRef = useLoadMore(query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError && !isOffline, loadMore)`, com `loadMore = useCallback(() => void query.fetchNextPage(), …)`.
- Efeito de volta ao topo quando `categoryId` muda: `useAppScroller().current?.scrollTo({ top: 0, behavior: resolveScrollBehavior() })` (01), comparando com o id anterior num `ref` para não rolar na montagem.
- Composição:
  - `MenuCategoryRail` com `visible` e `currentCategoryId={categoryId}`; categorias em erro → `InlineError` "Não foi possível carregar as categorias.";
  - `skeleton` → rótulo em `Skeleton` + `CategoryListSkeleton`;
  - `error` → `RouteErrorState` com `title="Não conseguimos carregar o cardápio"` e a mesma descrição **derivada** da 02;
  - `content` com `products.length === 0` → `EmptyState` do artboard (ver Desenho), ação `Button` `variant="primary"` com `component={Link}` para `categoryRouteHref(outra.id)` e texto `Ver {outra.name}`, onde `outra` é a primeira visível diferente desta; sem outra, sem ação;
  - `content` com produtos → rótulo `{category?.name ?? 'Esta categoria'} · {total} {total === 1 ? 'item' : 'itens'}`, `query.isRefetchError` → `InlineError` no topo, e `CategoryProductList`.
- Raiz `div`, sem `<main>` e sem `100dvh`.

### 5. Rota

`app/(menu)/menu/page.tsx` (novo, server component):

```tsx
interface MenuPageProps { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const raw = (await searchParams)[CATEGORY_SEARCH_PARAM];
  if (raw === undefined) redirect(HOME_ROUTE);
  const categoryId = parseCategoryId(raw); // inteiro positivo ou null; array → null
  if (categoryId === null) notFound();
  return <MenuCategoryScreen categoryId={categoryId} />;
}
```

`parseCategoryId` mora em `src/routes/app-routes.ts`, ao lado do `categoryRouteHref` (o par escrita/leitura num lugar só). Sem `useSearchParams` (decisão 2 da 36) e sem `generateMetadata`.

### 6. Rota aberta sem mesa

`src/providers/board-session/browsable-routes.ts` (alterado): `BROWSABLE_WITHOUT_TABLE = [MENU_HREF, MENU_ROUTE]`. A comparação é por `pathname` (`:9-11`), então `/menu?category=…` entra.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars, com `/menu` marcada como dinâmica (ƒ) e `/` ainda estática.
2. `grep -rn "useInfiniteScroll" src app` vazio; `grep -rn "IntersectionObserver" src` só em `src/hooks/use-load-more.ts`.
3. `grep -rn "onAdd\|addLabel\|sort" src/components/category` não encontra parâmetro de ordenação nem `+`.

**No navegador** (`next dev`, `.env.development` com a API local que tenha a delivery-api#1626 — sem ela, o passo 4 mostra o erro de rota com `erro 422` e o resto não roda). Mesa aberta `/?session=<uuid>`, depois navegar. Network filtrado por `products/v2`.

4. Sem a #1626: `/menu?category=<id>` mostra o `RouteErrorState` com `Código erro 422 · …`. "Tentar novamente" volta ao skeleton e repete.
5. Com a #1626, uma categoria com mais de 24 produtos de mesa (se não houver no tenant de dev, criar no admin ou baixar o limite **só localmente** para 4 e reverter): rolar até o fim dispara `page=2` antes de a sentinela entrar na tela (antecipação de 240px); nenhum `public_id` repetido na lista (`document.querySelectorAll('article')` vs. `meta.total`).
6. **RF-03:** com a página 1 na tela, DevTools → Network → bloquear o padrão `*page=2*` e rolar até o fim. Esperado: a página 1 fica; aparece "Não foi possível carregar mais produtos." com "Tentar de novo"; **nenhum** request novo sai sozinho enquanto o aviso está na tela (o observer travou). Desbloquear e tocar "Tentar de novo": sai **um** `page=2` (não `page=3`) e os itens entram uma vez.
7. Ficar sem rede (DevTools offline) com a sentinela visível: o banner da 38 aparece e nenhum request de página se repete; voltar a rede: as páginas carregadas são relidas uma vez.
8. `/menu` → redireciona para `/`. `/menu?category=abc` e `/menu?category=0` → 404 da 38. `/menu?category=999999` → vazio do artboard, com "Esta categoria".
9. Categoria visível sem produto de mesa (ou com todos desativados): vazio com "{Nome} está sem itens…" e "Ver {outra}", que navega.
10. Trocar de categoria pela trilha com a lista rolada: a lista volta ao topo e a chip nova fica `aria-current="true"`.
11. Em `browsing` (sem mesa → "Ver o cardápio" → chip): `/menu?category=…` abre, não cai na tela sem mesa.
12. 390 × 844: linhas `ProductListItem lg` sem `+`, nota na linha do preço; produto com `rating.average: null` sem estrela nem "0,0".

## Critérios de aceitação

- [ ] `/menu?category=<id>` pede `GET /products/v2?environment=board&category_id=<id>&page=<n>&limit=24`, sem `sort`.
- [ ] A próxima página sai de `meta.has_more`/`meta.current_page`; nenhuma conta sobre `total` ou `per_page`.
- [ ] A sentinela é renderizada em todos os estados da lista com conteúdo, e o fim da lista é um elemento separado.
- [ ] Falha na página seguinte mantém as páginas anteriores, mostra `InlineError` com "Tentar de novo", não dispara request sozinha enquanto o erro está na tela, e o retry pede a mesma `page`.
- [ ] Nenhum produto aparece duas vezes na lista achatada.
- [ ] Primeira página com erro mostra `RouteErrorState` com código; vazio com sucesso mostra o empty state do artboard, com a ação para outra categoria.
- [ ] A trilha de categorias marca a categoria aberta com `aria-current`, e trocar de categoria volta a lista ao topo.
- [ ] `/menu` sem `category` redireciona para `/`; `category` inválido dá 404; `/menu` abre em `browsing`.
- [ ] `useInfiniteScroll.ts` saiu, e o único `IntersectionObserver` do app é o do `use-load-more`.
- [ ] Nenhuma linha tem `+`, e nenhum arquivo de `src/theme/` ou `src/components/ui/` muda.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam.

## Fora de escopo

- Grade de 3/2 colunas, trilha fixa e rolagem dentro da coluna no tablet: 06 (o `rootRef` do `use-load-more` é o ponto de ligação).
- Ordenação, "só promoções", facetas e ingredientes na categoria: não estão no desenho; a busca (05) tem ordenação e facetas, e o filtro de ingrediente é da busca, na linha 07 ([#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67)).
- O detalhe do produto: 04.
- Metadata de página por categoria (`generateMetadata`): exigiria chamar a api no servidor, que o boot de cliente evita.

## Branch

`task/42-category-listing-infinite-scroll`, base sugerida: `feat/indoor-v2` depois que a 01 (#40) e a 02 (#41) entrarem; antes disso, `task/41-menu-home-rails`.
