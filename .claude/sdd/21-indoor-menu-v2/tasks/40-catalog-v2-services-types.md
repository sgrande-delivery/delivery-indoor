# 01 — Serviços e tipos do catálogo v2, com centavos e envelope da v2

**Issue:** [#40](https://github.com/sgrande-delivery/delivery-indoor/issues/40)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** #20 (fundação v2 inteira, tasks 33 a 39)
**Status:** executada
**Reconciliado com a #22 (2026-11-23):** esta task passa a criar `src/types/product-selection.ts` (`OptionSelection` e `ProductSelection`, o corpo de `POST /cart/{cartId}/items`), que o detalhe (04) monta e a [#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md) manda sem tradução, e os dois cortes de orientação do tablet em `shell-metrics.ts`, que a grade (06) e a sacola do tablet ([#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md)) leem. O `app/(menu)/layout.tsx` não recebe moldura de tablet: a coluna da sacola é do `AppShell` (#49). Ver mudanças 1, 7 e 8.
**Alinhado às emendas da delivery-api#1607 (2026-11-23):** o detalhe passa a **usar** o `?environment=board` (#1627: 404 para produto que a mesa não vende), `special_price`, `discount_percent` e `size_prices[]` passam a ser os do ambiente pedido (#1765), a faceta de categoria da busca passa a ser a da mesa (#1626, mudança 6), e `GET /ingredients` passa a aceitar `environment` (#1764), o que destrava a linha 07 ([#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67)). A tabela "Estado de cada rota", a decisão 1 e as armadilhas foram atualizadas; nenhuma mudança de código desta task muda.

## Objetivo

Criar a camada de dados que as telas do cardápio (02 a 06) consomem: tipos escritos contra os presenters da `delivery-api`, serviços que injetam `environment=board` em **toda** chamada de catálogo, o helper único de dinheiro em centavos, o hook de categorias visíveis, a rota de sobreposição do produto (`?product=`), o tipo da seleção que sai do detalhe para a sacola e os cortes de orientação do tablet. Nenhuma tela de domínio muda aqui. O que esta task deixa pronto é o que impede as cinco seguintes, e as tasks da #22 que leem daqui, de errarem a unidade, o envelope, o ambiente ou o formato do item.

## Contexto

### Estado atual (worktree, ponta da fila da #20 @ `39366b5`)

- **Não há catálogo nenhum.** `app/page.tsx:4-10` é o placeholder "app de mesa em reconstrução"; `src/services/` tem só `api.ts`, `restaurant.ts`, `board-movement.ts`, `connection-probe.ts`, `http-error-code.ts` e os dois módulos de cabeçalho/erro. `src/types/` tem `board-movement.ts`, `restaurant.ts` e `image.ts`.
- `src/services/api.ts:5-13`: a instância única, com `x-restaurant-id` (`src/services/restaurant-header.ts`) e o interceptor de erro. **É a instância em que o `ConnectivityProvider` da 38 registra os interceptores de `lastSyncedAt` e de probe** — serviço de catálogo que criar outra instância perde o banner de offline. Use `api`.
- `src/hooks/use-restaurant.ts:7-11` é o padrão de hook de query da fundação (chave exportada + `useQuery`).
- `src/helpers/numberFormat.js:23` (`moneyFormat`) recebe **reais**. É o que a conta da mesa (float em real) vai usar na #23. O catálogo v2 é **centavos**, e os dois convivem (RN-02).
- `src/routes/app-routes.ts:5` já fixa `MENU_ROUTE = '/menu'` com o comentário `/menu?category=<id>` (decisão pendente 1 da spec, tomada pela 37).
- `src/hooks/useInfiniteScroll.ts` está **órfão** (nenhum import em `src/` nem `app/`) e tem `root: null` como default (`:30`) — a armadilha "rootMargin não atravessa o clip rect" da rule `busca-de-dados`. Quem o substitui é a 03; esta task não o toca.

### Requisitos cobertos

- **RN-01** — `environment=board` em toda chamada de catálogo, injetado pelo serviço (decisão arquitetural do plan: "na camada de serviço, não no call site").
- **RN-02** e **RF-09** — dinheiro da v2 é centavos, formatado por um helper só.
- **RN-03** — o envelope da v2 é `{ data, meta }` e a paginação lê `meta.has_more`.
- **RN-04** — `/products/v2` recusa parâmetro desconhecido com 422: manda-se só o que a lista aceita, e o `environment` **não** sai nem vira `try/catch`.
- **RN-08** — `is_favorite` vem no payload e é ignorado; nada de `/wishlist/v2` nem `/last-brought-products/v2`.
- **RN-09** — `activated: false` não entra em lista.

### Contrato (inline, medido na `delivery-api` `origin/master` @ `8db44045e`, 2026-11-23)

Base `${NEXT_PUBLIC_API}` = `…/api/client/`, header `x-restaurant-id` com o UUID. Rotas em `app/Modules/Category/routes/client-routes.php:12` e `app/Modules/Product/routes/client-routes.php:17-20`.

| Rota | Parâmetros que a mesa manda | Resposta |
|---|---|---|
| `GET /categories/v2` | `environment=board` | `{ data: MenuCategory[] }`, lista simples, **sem** paginação |
| `GET /products/v2` | `environment=board`, `category_id` (int ≥ 1), `q` (≤ 120), `page` (≥ 1), `limit` (1–200, default 50), `sort`, `only_offers` (`1`/`0`; `true` é 422) | `{ data: ProductSummary[], meta: { total, per_page, current_page, last_page, has_more, facets } }`, com `meta.facets.categories` do ambiente pedido (delivery-api#1626, mudança 6) |
| `GET /products/v2/most-ordered` | `environment=board`, `window` (1–180 dias, default 30), `limit` (1–50, default 10) | `{ data: ProductSummary[] }`, **sem** `meta` e **sem** `is_favorite` |
| `GET /products/v2/{publicId}` | `environment=board`, **usado** pela rota (delivery-api#1627): 200 para produto que a mesa vende, inclusive o só de mesa; **404** `Product with public id … not found.` para o que ela não vende (só de entrega, pausado, categoria fora da mesa). Sem lista fechada: outro parâmetro é ignorado, e `environment` fora de `delivery,board` é 422 | `ProductDetail` |
| `POST /products/v2/{publicId}/price` | corpo `{ quantity, environment: "board", option_selections: [{ option_group_item_id, quantity? }] }` | `ProductPrice` |

Shapes, transcritos dos presenters:

```ts
// CategorySummaryPresenter — core/Category/Application/Client/V2/CategorySummaryPresenter.php
interface MenuCategory {
  id: number; name: string; relevance: number; activated: boolean;
  is_available_on_delivery: boolean; // coluna do registro, continua vindo em environment=board (delivery-api#1625)
  products_count: number;            // do ambiente pedido depois da #1625; hoje, do delivery
}

// ProductSummaryPresenter — core/Product/Application/Client/V2/ProductSummaryPresenter.php
interface ProductSummary {
  id: number; public_id: string; name: string; description: string | null;
  kind: 'standard' | 'buildable'; activated: boolean;
  category: { id: number; name: string } | null;
  image_url: string | null;
  price: number | null;            // centavos
  special_price: number | null;    // centavos; da promoção do ambiente pedido (delivery-api#1765)
  discount_percent: number | null; // inteiro, calculado no servidor (ClientProductDiscountCalculator, D6)
  rating: { average: number | null; total: number };
  is_favorite?: boolean;           // a busca manda `false` para anônimo; o most-ordered omite
  matched_option?: { item_name: string; group_name: string }; // só na busca (SearchProductsPresenter.php:69)
}

// SearchProductsPresenter::buildMeta (:80-91)
interface ProductPageMeta {
  total: number; per_page: number; current_page: number; last_page: number;
  has_more: boolean; // current_page < last_page, calculado no servidor
  facets: {
    categories: { id: number; name: string; count: number }[];
    relaxed: { filter: string; value: string; label: string; additional_count: number }[];
  };
}

// ShowProductPresenter — core/Product/Application/Client/V2/ShowProductPresenter.php:40-70
interface ProductDetail {
  id: number; public_id: string; name: string; description: string | null;
  calories: number | null; serves: number | null;
  kind: 'standard' | 'buildable'; activated: boolean; category_id: number | null;
  image: { id: number; image_url: string; image_thumb_url: string | null } | null; // ProductEntity.php:94
  price: number | null; special_price: number | null; discount_percent: number | null;
  rating: { average: number | null; total: number };
  is_favorite: boolean;
  option_groups: OptionGroup[];
  size_prices: Record<string, SizePrice[]>; // chaves 'flavor' e 'border' sempre presentes
  recipe: RecipeLine[];
  promotion?: { applies: boolean; target: 'cells' | 'line' | null }; // só quando há preço por célula
}
interface OptionGroup {
  id: number; public_id: string; name: string;
  kind: string; // dica do admin, NÃO decide layout (ver armadilhas)
  min_quantity: number; max_quantity: number; is_required: boolean;
  items: OptionGroupItem[];
}
interface OptionGroupItem {
  id: number; product_public_id: string | null; name: string | null; description: string | null;
  price_override: number | null; // centavos
  taste_amount: number | null; flavor_slots: number | null; position: number;
  is_default: boolean;
}
interface SizePrice {
  modifier_item_id: number; size_item_id: number;
  modifier_public_id: string | null; size_public_id: string | null;
  price: number; special_price: number | null; discount_percent: number | null;
}
interface RecipeLine { ingredient_public_id: string | null; ingredient_name: string | null; quantity: number; is_optional: boolean }

// ProductItemPricePresenter — core/Cart/Application/Presenters/ProductItemPricePresenter.php (tudo em centavos)
interface ProductPrice {
  product_id: number; public_id: string; quantity: number;
  base_price: number; unit_price: number; line_total: number;
  original_unit_price: number | null; original_line_total: number | null;
  applied_promotion: { id: number; name: string } | null;
  promotion_nullified_by_combination: boolean;
  option_breakdowns: { option_group_item_id: number; option_group_id: number; name: string; price_delta: number }[];
  flavor_breakdowns: { flavor_item_id: number; flavor_product_id: number; price: number; taste_amount: number }[];
}
```

**Preço anunciado é o do ambiente** (delivery-api#1765, RN-07 da #1607): com `environment=board`, o `special_price` e o `discount_percent` da busca, do mais pedidos e do detalhe, e os `size_prices[]` do detalhe, saem das promoções de mesa, as mesmas que o `/price` e o carrinho cobram. A api fixa por teste que, para produto `standard` sem opção, o `special_price` do card é igual ao `unit_price` do `/price` no mesmo ambiente.

`sort` ∈ `newest` · `price_asc` · `price_desc` · `rating` · `best_selling` · `discount_desc` (`core/Product/Domain/Enums/ProductSortEnum.php`). O default da rota é `newest` (`SearchProductsController.php:37`) e `kinds` default é `[standard, buildable]` (`:16`) — a mesa **não** manda `kinds` (decisão pendente 2 da spec).

**Estado de cada rota antes da delivery-api#1607 subir** (é o que o QA vai ver, e nenhum caso se contorna):

| Rota com `environment=board` | Hoje | Depois da #1607 |
|---|---|---|
| `GET /categories/v2` | **200 com o catálogo de entrega**: o controller não tem `FormRequest` (`GetCategoriesController.php:14`) e o use case crava `DELIVERY` (`GetCategoriesUseCase.php:37`). Não há 422 para ver | categorias da mesa, com `products_count` da mesa (#1625) |
| `GET /products/v2` | **422** `"O parâmetro environment não é reconhecido."` (`SearchProductsRequest.php:57-64`) | produtos da mesa, com a faceta de categoria da mesa (#1626) |
| `GET /products/v2/most-ordered` | **200 com o ranking de entrega**: `GetMostOrderedProductsRequest` não tem lista fechada, só ignora o parâmetro. O plan da #21 diz "422" aqui — não é | ranking da mesa (#1626) |
| `GET /products/v2/{publicId}` | ignora o parâmetro e filtra pela entrega: 200 para produto disponível na entrega, **404 para produto só de mesa** (ver armadilhas) | 200 para produto da mesa, 404 para o que a mesa não vende (#1627) |
| `POST /products/v2/{publicId}/price` com `environment: "board"` no corpo | **200 já hoje**: `PriceProductItemRequest.php:22` valida `environment` e o controller o repassa (`PriceProductItemController.php:37`) | igual (a #1627 só o fixa em teste) |
| `special_price`, `discount_percent` e `size_prices[]` (busca, mais pedidos, detalhe) | da promoção **de entrega** (`ProductCardService.php:40-41`, `ShowProductUseCase.php:145`) | da promoção de mesa (#1765) |
| `GET /ingredients?environment=board` (linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67)) | **422**: lista fechada `['q', 'limit']` (`GetIngredientsRequest.php:11`), e a contagem é só de entrega | ingredientes e `product_count` da mesa (#1764) |

### O que vem do `delivery-client` (`origin/feat/app-v2` @ `ceed49a9`, só leitura)

| Fonte | Decisão | Tradução |
|---|---|---|
| `src/types/menu-category.ts` | porta | — |
| `src/types/product.ts` | porta | + `matched_option?` (o client só o lê na busca, aqui ele entra no tipo) |
| `src/types/product-page.ts` | adapta | `productSorts` passa a ter os **seis** valores (RF-14); o client tem quatro. `ProductPageMeta` ganha `facets` como tipo de **resposta** (`ProductPageResponse`), separado do recorte (ver mudança 2) |
| `src/types/product-detail.ts` | adapta contra o presenter | `is_default` deixa de ser opcional (a delivery-api#1483 publicou, `ShowProductPresenter.php:144`); `image_url` da imagem é `string` (não `string | null`, `ProductEntity.php:94`); `SizePrice` ganha `special_price` e `discount_percent`; `promotion?` entra; `PricePreview` vira `ProductPrice` com os quatro campos que faltam (`original_unit_price`, `original_line_total`, `applied_promotion`, `promotion_nullified_by_combination`) |
| `src/services/menu.ts` | adapta | `fetchCategories`, `fetchProducts` (trilhas, `limit` 200), `fetchProductPage` e `selectProductPage`. Sai o `skipGlobalErrorHandler` (não existe aqui: o `ErrorHandlerProvider` não veio, 38) e entra o ambiente |
| `src/services/product.ts` | adapta | `fetchProductDetail` e `fetchPricePreview` → `fetchProductPrice`. Saem `fetchProductReviewSummary` e `fetchProductReviews` (fora do escopo da spec). O corpo troca `option_group_item_ids` por `option_selections`, que é a forma do carrinho v2 (#22) e a que leva quantidade por opção |
| `src/services/home.ts` | adapta | só `fetchMostOrderedProducts`, com `window` e `limit` **explícitos** (RF-19). Saem `fetchPromotions` (cupom, fora do escopo), `fetchLastBroughtProducts` e `fetchFavoriteProducts` (exigem JWT, RN-08) |
| `src/helpers/money.ts` | porta | `formatCents`, `formatCentsPlain`, `formatDiscountLabel`, `hasVisibleDiscount`, `resolveShowcasePrice`. Sai `toCents` (nenhuma tela da mesa converte real em centavo) |
| `src/helpers/home-categories.ts` | adapta | vira a seleção de categorias visíveis do hook (mudança 5), **sem** `is_available_on_delivery` |
| `src/helpers/sheet-route.ts` e `src/components/product/product-route.ts` | portam | o `?product=` que os cards da 02, da 03 e da 05 empurram e o host da 04 lê. Ficam aqui para as três telas e o detalhe rodarem em paralelo |
| `src/helpers/scroll-behavior.ts` | porta | usado pela 03 e pela 04, que rodam em paralelo |
| `src/services/server/*` (`menu.ts`, `category.ts`, `home.ts`, `tolerant.ts`, `api.ts`) | **descarta** | SSR de catálogo com `loadBoot()` e instância axios de servidor. Aqui o boot é de cliente (plan da #20, "Sem `loadBoot`") e as telas buscam por React Query no cliente |

### Decisões

1. **O ambiente é uma constante de um módulo só, aplicada por dois helpers.** `CATALOG_ENVIRONMENT = 'board'` em `src/services/catalog-environment.ts`, com `boardCatalogParams(params)` para as rotas `GET` e `boardCatalogBody(body)` para o `/price`. Não é interceptor nem instância axios própria:
   - uma instância nova perderia os interceptores de conectividade que a 38 registra em `api` (ver Estado atual);
   - interceptor por prefixo de URL precisaria da mesma lista de rotas que os serviços já declaram, e esconderia de quem lê o serviço que o parâmetro existe. *(Alinhado em 2026-11-23: o texto dizia que o interceptor mandaria o parâmetro ao `GET /ingredients`, que o recusava. A delivery-api#1764 o abriu, e o serviço de ingredientes da linha 07, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), usa o mesmo `boardCatalogParams`.)*
   O que garante "não esquecer" é o critério de `grep` (mudança 3) e o fato de nenhuma função de serviço aceitar `environment` do chamador.
2. **`only_offers` vai como `1`, nunca como `true`.** A regra `boolean` do Laravel aceita `true`, `false`, `0`, `1`, `'0'` e `'1'`; em query string tudo é string, e `'true'` reprova com 422. O helper de parâmetros escreve `only_offers: 1` quando o filtro está ligado e **omite** a chave quando desligado.
3. **Recorte na fronteira, não no tipo.** Como no client (`selectProductPage`, `services/menu.ts:65-69` @ `ceed49a9`): a resposta crua tem `meta.facets`, e a listagem por categoria o descarta em código antes de entrar no cache. A busca (05) tem o seu recorte, que **mantém** as facetas.
4. **Tamanhos de página.** `MENU_PRODUCTS_LIMIT = 200` (trilhas da home, uma requisição, o teto da rota) e `CATALOG_PAGE_LIMIT = 24` para a categoria e a busca. O client usa 8, desenhado para a primeira dobra do celular; 24 é múltiplo de 2 e de 3 e enche a grade do tablet (06) sem linha manca. É decisão desta task, confirmar com o dev.
5. **`kinds` não é enviado.** Vale o default da rota (`standard` + `buildable`), como a decisão pendente 2 recomenda.
6. **Os tipos do contrato moram em `src/types/`, um arquivo por recurso, com o nome do client** (`menu-category.ts`, `product.ts`, `product-page.ts`, `product-detail.ts`). Mesmo nome facilita o próximo sync com o client; o conteúdo é o do presenter (decisão do plan "Tipo novo, não cópia"), e cada arquivo diz de qual rota fala.
7. **A seleção do produto é tipo de contrato, e nasce aqui** (reconciliação com a #22). `ProductSelection` é o corpo de `POST /cart/{cartId}/items` em snake_case, sem `person`; `OptionSelection` é o elemento de `option_selections`, o mesmo no `/price` e no item da sacola. Um tipo só para o corpo, e nenhuma tradução camelCase no caminho: o detalhe (04) monta, a #46 manda. Nasce nesta task porque ela é a primeira que as duas features têm em comum, e o `fetchProductPrice` daqui já precisa do `OptionSelection`.
8. **Os cortes de orientação do tablet nascem aqui, ao lado dos do shell** (reconciliação com a #22). A grade 3/2 da 06 e a coluna/barra da sacola da #49 viram juntas, e por isso leem as mesmas duas constantes. Uma task anterior às duas as escreve, para nenhuma delas criar a mesma linha em paralelo. Não são corte de largura novo (RF-09 e RF-10 da #20): são o shell do tablet partido pela orientação.

### Armadilhas

- **O filtro de entrega do client esconderia a feature inteira.** `createHomeCategoryChips` e `createMenuSections` filtram `category.is_available_on_delivery` (`src/helpers/home-categories.ts:20` e `src/components/menu/menu-sections.ts:50` @ `ceed49a9`). Uma categoria só de mesa tem `is_available_on_delivery: false` e **continua vindo** com o campo depois da #1625. Copiar esse filtro é esconder exatamente "Doces de balcão", o caso da spec. A disponibilidade por ambiente é do servidor; aqui o filtro é só `activated && products_count > 0`.
- **Preço nulo e preço zero não são "de graça".** `price` é `?int` na projeção (`ProductSummaryPresenter.php`); `0` e `null` significam "o servidor não resolveu" (montável, sem preço cadastrado). `resolveShowcasePrice` já devolve `null` nos dois — não "simplifique".
- **`discount_percent` chega arredondado.** R$ 16,00 → R$ 15,99 vira `0`, e um selo `-0%` é oferta mentirosa. É o `hasVisibleDiscount` que barra; o selo nunca é calculado na tela (RF-12, D6).
- **`rating.average` é `float` cru** (`4.8`), não string formatada. A tela formata com `Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })`; `average: null` (ou `total: 0`) não desenha nada (RF-18). O helper fica aqui para as quatro telas não repetirem a regra.
- **A axios serializa array com colchetes** (`a[]=1&a[]=2`). Hoje nenhum parâmetro de lista é mandado; quando a linha 07 entrar, o nome vai **sem** colchete no objeto de params (o client documenta em `services/search.ts:26-36` @ `ceed49a9`).
- **O que o QA vê antes das tasks da api subirem** (cada caso tem dono na delivery-api#1607, e nenhum se contorna aqui): (1) `ShowProductUseCase.php:86-90` busca com `requireAvailable: true` e o ambiente default `'delivery'` do repositório (`ProductEngineeringRepository.php:80-96`), então o detalhe de produto **só de mesa** responde 404; a #1627 passa o `environment` da query a esse filtro, e o produto que a mesa não vende passa a ser o 404. (2) `ProductCardService.php:40-41` resolve o `special_price` da vitrine com as promoções de **entrega**, enquanto o `/price` (com `environment: board`) resolve as de mesa; o card pode anunciar um preço e o CTA cobrar outro até a #1765.

## Mudanças

### 1. Tipos do contrato

`src/types/menu-category.ts`, `src/types/product.ts`, `src/types/product-page.ts`, `src/types/product-detail.ts` (novos), com os shapes da seção Contrato. Em `product-page.ts`:

```ts
export const productSorts = ['best_selling', 'rating', 'discount_desc', 'price_asc', 'price_desc', 'newest'] as const;
export type ProductSort = (typeof productSorts)[number];

/** Resposta crua de `GET /products/v2` — entrada dos recortes, nunca prop de componente. */
export interface ProductPageResponse { data: ProductSummary[]; meta: ProductPageMeta & { facets: SearchFacets } }

/** O recorte da listagem por categoria: sem facetas. */
export interface ProductPage { data: ProductSummary[]; meta: ProductPageMeta }
```

A ordem de `productSorts` é a da RF-14, e é a que a 05 desenha.

`src/types/product-selection.ts` (novo; decisão 7):

```ts
/** Elemento de `option_selections`: o mesmo no corpo do `/price` e no de `POST /cart/{cartId}/items`. */
export interface OptionSelection {
  option_group_item_id: number; // OptionGroupItem.id — numérico (RN-05 da #22)
  quantity?: number;            // só quando > 1
}

/** O corpo de `POST /cart/{cartId}/items` (`AddCartItemRequest`), sem `person`: o detalhe monta, a sacola manda como está. */
export interface ProductSelection {
  product_id: number;            // ProductDetail.id — numérico
  quantity: number;
  option_selections: OptionSelection[];
  removed_ingredients: string[]; // RecipeLine.ingredient_public_id (uuid)
  notes: string | null;          // trim; vazio vira null
}
```

A forma confere com `AddCartItemRequest.php` da `delivery-api` (`origin/master` @ `8db44045e`): `option_selections` e `removed_ingredients` são `sometimes|array` e `notes` é `sometimes|nullable|string`, então `[]` e `null` passam e o objeto vai ao servidor sem omitir chave.

### 2. Ambiente do catálogo

`src/services/catalog-environment.ts` (novo):

```ts
export const CATALOG_ENVIRONMENT = 'board';

export function boardCatalogParams<T extends Record<string, unknown>>(params: T): T & { environment: typeof CATALOG_ENVIRONMENT } {
  return { ...params, environment: CATALOG_ENVIRONMENT };
}

export function boardCatalogBody<T extends Record<string, unknown>>(body: T): T & { environment: typeof CATALOG_ENVIRONMENT } {
  return { ...body, environment: CATALOG_ENVIRONMENT };
}
```

Comentário de uma linha no módulo, com o porquê (a api assume `delivery` quando falta, e isso dá cardápio errado sem erro). Nada além disso.

### 3. Serviços

`src/services/menu.ts` (novo; adapta `src/services/menu.ts` @ `ceed49a9`):

- `MENU_PRODUCTS_LIMIT = 200`, `CATALOG_PAGE_LIMIT = 24`.
- `fetchCategories(): Promise<MenuCategory[]>` → `api.get('/categories/v2', { params: boardCatalogParams({}) })`, devolve `response.data.data`.
- `fetchMenuProducts(): Promise<ProductSummary[]>` → `GET /products/v2` com `boardCatalogParams({ limit: MENU_PRODUCTS_LIMIT })`, devolve `data`.
- `fetchOfferProducts(limit: number): Promise<ProductSummary[]>` → `GET /products/v2` com `boardCatalogParams({ only_offers: 1, sort: 'discount_desc', limit })`. A ordenação por desconto é do servidor — o client ordenava no cliente (`home-offers.ts:57-58` @ `ceed49a9`), aqui não.
- `fetchCategoryPage(categoryId: number, page: number): Promise<ProductPage>` → `GET /products/v2` com `boardCatalogParams({ category_id: categoryId, page, limit: CATALOG_PAGE_LIMIT })`, passando por `selectProductPage`. **Sem `sort`**: vale o `newest` da rota (decisão pendente 3 da spec).
- `selectProductPage(payload: ProductPageResponse): ProductPage`, porta de `services/menu.ts:65-69` @ `ceed49a9`.

`src/services/product.ts` (novo; adapta `src/services/product.ts` @ `ceed49a9`):

- `fetchProductDetail(publicId)` → `api.get(\`/products/v2/${encodeURIComponent(publicId)}\`, { params: boardCatalogParams({}) })`. `encodeURIComponent` porque o id vem da URL (`?product=`), pelo mesmo motivo do `fetchBoardMovement` da 36.
- `fetchProductPrice(publicId, { quantity, optionSelections }: { quantity: number; optionSelections: OptionSelection[] })` → `api.post(\`/products/v2/${…}/price\`, boardCatalogBody({ quantity, option_selections: optionSelections }))` — `quantity` da opção só quando > 1, como o `buildOptionSelections` do client (`src/components/cart/cart-item-option-quantities.ts` @ `ceed49a9`). O elemento é o `OptionSelection` da mudança 1, o mesmo que vai para a sacola. O corpo não leva preço: preço é resposta (RN-05).

`src/services/home.ts` (novo; adapta `src/services/home.ts` @ `ceed49a9`):

- `MOST_ORDERED_WINDOW_DAYS = 30`, `MOST_ORDERED_LIMIT = 10` (os defaults medidos da rota, escritos à mão porque a RF-19 pede os dois explícitos).
- `fetchMostOrderedProducts()` → `GET /products/v2/most-ordered` com `boardCatalogParams({ window: MOST_ORDERED_WINDOW_DAYS, limit: MOST_ORDERED_LIMIT })`.

Nenhum serviço chama `console.error` nem engole erro: a falha sobe para o React Query e a tela escolhe o formato (rule `busca-de-dados`, 38).

### 4. Dinheiro e avaliação

`src/helpers/money.ts` (novo): porta `src/helpers/money.ts` @ `ceed49a9` (ver inventário), com os comentários de WHY que lá existem (`price: 0`, o portão do selo, o arredondamento). `formatCents(2690)` → `R$ 26,90`.

`src/helpers/rating.ts` (novo):

```ts
export interface RatingDisplay { value: string; count: string; total: number; average: number }

/** `null` quando não há o que mostrar: sem média ou sem avaliações (RF-18). */
export function resolveRatingDisplay(rating: ProductSummary['rating']): RatingDisplay | null;
```

`value` em pt-BR com uma casa (`4,8`), `count` com separador de milhar (`1.234`). Os formatadores locais de `CategoryProductItem.tsx:11-12` e `SearchProductItem.tsx:10` @ `ceed49a9` passam a ler daqui nas telas.

### 5. Categorias visíveis

`src/hooks/use-menu-categories.ts` (novo). Modelo: `src/hooks/use-restaurant.ts` daqui e `src/components/search/use-search-categories.ts` @ `ceed49a9`.

- `menuCategoriesQueryKey = ['menu', 'categories'] as const`.
- `useMenuCategories(): UseQueryResult<MenuCategory[]>` com `staleTime` de 5 min (o do client, `use-menu.ts:12` @ `ceed49a9`).
- `selectVisibleCategories(categories): MenuCategory[]` (exportada, pura): `activated && products_count > 0`, ordenada por `relevance` desc. **Sem** `is_available_on_delivery` (ver armadilhas). É a lista que a trilha de chips da 02, o rótulo da 03 e o atalho da busca (05) usam.

### 6. Rota de sobreposição do produto

- `src/helpers/sheet-route.ts` (novo): porta `src/helpers/sheet-route.ts` @ `ceed49a9`, sem mudança.
- `src/components/product/product-route.ts` (novo): porta `src/components/product/product-route.ts` @ `ceed49a9` (`PRODUCT_SEARCH_PARAM = 'product'`, `pushProductSheet`, `dismissProductSheet`, `productSheetHref`).

O valor é o `public_id` (string UUID v7 no tenant de dev). O host que lê o parâmetro é da 04.

- `src/helpers/scroll-behavior.ts` (novo): porta `src/helpers/scroll-behavior.ts` @ `ceed49a9` (`resolveScrollBehavior()`, que lê o `REDUCED_MOTION_QUERY` de `src/helpers/reduced-motion.ts:1`, já no repo). A 03 (volta ao topo ao trocar de categoria) e a 04 (rolar até o grupo pendente) usam, e podem rodar em paralelo — por isso ele nasce aqui.

### 7. Grupo de rotas do cardápio

`app/page.tsx` → `app/(menu)/page.tsx` (movido, **conteúdo idêntico**). O grupo `(menu)` não muda URL nenhuma; ele existe para que a 04 ponha o host do detalhe em `app/(menu)/layout.tsx` e a 03 e a 05 criem `app/(menu)/menu/` e `app/(menu)/search/`, sem que duas tasks paralelas mexam no mesmo arquivo. Depois da 04, o único outro escritor do layout é a [#46](../../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md), que envolve o host com o provedor de adicionar à sacola. A coluna da sacola do tablet **não** mora neste layout: é do `AppShell` ([#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md)). Esta task **não** cria o `layout.tsx` (é da 04).

O grupo e o `isCartDockRoute` da #49 falam das mesmas rotas (`/`, `/menu`, `/search`): rota nova dentro de `app/(menu)/` entra no predicado no mesmo commit.

### 8. Cortes de orientação do tablet

`src/components/shell/shell-metrics.ts` (alterado; decisão 8), ao lado dos dois que existem:

```ts
export const tabletLandscapeMediaQuery = `${tabletShellMediaQuery} and (orientation: landscape)`;
export const tabletPortraitShellMediaQuery = `${tabletShellMediaQuery} and (orientation: portrait)`;
```

`tabletPortraitMediaQuery` continua como está, com o uso da 37. Ninguém consome as duas nesta task: a 06 e a #49 as leem.

## Testes

Não há suíte automatizada.

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit` sem erros.
2. `npx eslint src app scripts` sem erros novos.
3. `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad yarn build` conclui; `/` continua prerenderizada.
4. `grep -rn "environment" src/services src/hooks src/components | grep -v catalog-environment.ts` não encontra nenhuma atribuição de valor (só usos de `boardCatalogParams`/`boardCatalogBody`).
5. `grep -rn "is_available_on_delivery" src --include='*.ts' --include='*.tsx'` só encontra a declaração do tipo.
6. `grep -rn "skipGlobalErrorHandler\|console.error\|toCents" src/services src/helpers/money.ts` não encontra nada.

**Contra a API local** (harness `.indoor-qa` da memória do projeto, ou a `delivery-api` em `:8093`), com um script `jiti`/`tsx` fora do repo importando os serviços (como a 36 fez):

7. `fetchCategories()` devolve o array; inspecionar a requisição (log do axios ou `ss`/proxy): `GET /categories/v2?environment=board`.
8. `fetchCategoryPage(<id>, 1)` **sem** a #1626 no ar: rejeita com 422 e `detail.environment` = "O parâmetro environment não é reconhecido." — é o esperado (RN-04). Com a API local num checkout da branch `feature/1607-client-catalog-board-environment` (se existir): 200, `meta.has_more` presente e `meta.facets` **ausente** no objeto devolvido.
9. `fetchOfferProducts(8)`: a URL tem `only_offers=1&sort=discount_desc&limit=8&environment=board`. Trocar à mão para `only_offers=true` com `curl` responde 422 — confirma a decisão 2.
10. `fetchProductPrice(<publicId>, { quantity: 2, optionSelections: [] })` responde 200 com `line_total` inteiro; o corpo enviado tem `environment: "board"`.
11. `formatCents(2690)`, `resolveShowcasePrice({ price: 3390, special_price: 2690, discount_percent: 21 })` → `{ current: 'R$ 26,90', original: 'R$ 33,90', discountLabel: '-21%' }`; com `special_price: 1599, price: 1600, discount_percent: 0` → riscado sem selo; com `price: 0` → `null`.
12. `resolveRatingDisplay({ average: null, total: 0 })` → `null`; `{ average: 4.75, total: 1234 }` → `{ value: '4,8', count: '1.234', … }`.

## Critérios de aceitação

- [x] Os quatro arquivos de tipo declaram exatamente os campos do presenter da seção Contrato, com `price`, `special_price` e `price_override` como centavos, e `ProductPrice` com os 12 campos do `ProductItemPricePresenter`.
- [x] `productSorts` tem os seis valores da RF-14.
- [x] Toda chamada a `/categories/v2` e `/products/v2*` passa por `boardCatalogParams` ou `boardCatalogBody`, e nenhuma função de serviço recebe `environment` do chamador.
- [x] `only_offers` sai como `1` e some quando desligado; nenhum parâmetro fora da lista fechada do `SearchProductsRequest` é enviado.
- [x] `selectProductPage` descarta `meta.facets` em código.
- [x] `selectVisibleCategories` não filtra por `is_available_on_delivery`.
- [x] `formatCents` é o único formatador de centavos do código novo; `moneyFormat` (reais) não é chamado com valor da v2.
- [x] `app/(menu)/page.tsx` existe com o conteúdo do antigo `app/page.tsx`, e `/` continua respondendo.
- [x] `src/types/product-selection.ts` declara `OptionSelection` e `ProductSelection` em snake_case, com ids numéricos, e o `fetchProductPrice` usa o mesmo `OptionSelection`.
- [x] `shell-metrics.ts` ganha `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery`, derivadas de `tabletShellMediaQuery`, sem corte de largura novo.
- [x] Nenhum arquivo de `src/theme/` ou `src/components/ui/` é alterado.
- [x] `npx tsc --noEmit`, o lint e o `yarn build` com as vars de restaurante passam.

## Fora de escopo

- Qualquer tela (02 a 06) e o host do detalhe (`app/(menu)/layout.tsx`, 04).
- `src/services/search.ts` e o recorte da busca com facetas: 05.
- `GET /ingredients` e o serviço de ingredientes: linha 07 do plan, [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), destravada pela delivery-api#1764.
- `use-load-more.ts` e a remoção do `useInfiniteScroll.ts` órfão: 03.
- Promoção como vitrine (`GET /promotions/v2`), cupom, avaliações (`/reviews/summary`), favoritos e últimos comprados.
- Corrigir a skill `contratos-externos` (a linha do `most-ordered`, o `environment` já aceito pelo `/price`) e a rule `componentes-e-estilos`, que ainda diz "formatação sempre por `src/helpers/numberFormat`": follow-up de doc.
- O que a api ainda não entrega e as armadilhas listam (detalhe 404 de produto só de mesa, `special_price` de entrega na vitrine): delivery-api#1627 e #1765.

## Branch

`task/40-catalog-v2-services-types`, cortada de `feat/indoor-v2` (`28d2b0f`, com a fundação #20) em 2026-11-24.

## Implementação

**Concluída em:** 2026-11-24

### Camadas tocadas

- Tipos: `src/types/{menu-category,product,product-page,product-detail,product-selection}.ts`
- Serviços: `src/services/{catalog-environment,menu,product,home}.ts`
- Helpers: `src/helpers/{money,rating,sheet-route,scroll-behavior}.ts`; `src/components/product/product-route.ts`
- Hook: `src/hooks/use-menu-categories.ts` (`useMenuCategories`, `selectVisibleCategories`, `menuCategoriesQueryKey`)
- Shell: `src/components/shell/shell-metrics.ts` ganha `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery`
- Rotas: `app/page.tsx` movido (`git mv`) para `app/(menu)/page.tsx`, conteúdo idêntico

### Contratos consumidos

- `GET /categories/v2`, `GET /products/v2`, `GET /products/v2/most-ordered`, `GET /products/v2/{publicId}`, `POST /products/v2/{publicId}/price`, com os shapes inline da task. Não reconferi na `delivery-api` (a task os transcreve de `8db44045e`).

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- `SearchFacets` (e `SearchFacetCategory`/`SearchFacetRelaxed`) declarados em `product-page.ts`, porque a task os cita sem definir; a 05 os reutiliza.
- `CATALOG_PAGE_LIMIT = 24` conforme a decisão 4 da task (ainda a confirmar com o dev).
- `fetchProductPrice` aplica `encodeURIComponent` também no `/price`, além do detalhe.
- Hook em `use-menu-categories.ts` usa o alias `@/` (como `board-movement.ts`), e `selectVisibleCategories` ordena uma cópia filtrada (o `filter` já cria o array novo, sem mutar a entrada).
- `money.ts` e `sheet-route.ts`/`product-route.ts`/`scroll-behavior.ts` portados sem mudança de lógica; só saiu `toCents`.
- `menu-category.ts`: comentário do tipo reescrito (o do client falava de "app-v2 client").

### Como testar

1. `npx next typegen && npx tsc --noEmit`, `npx eslint src app scripts`, `yarn build` com as vars (ver abaixo).
2. Script jiti fora do repo (`/tmp/t40/run.ts`; copiado para a raiz só para rodar, `JITI_ALIAS` para o `@/`) chamando os serviços contra `http://localhost:8093/api/client/`.

### O que NÃO foi verificado

- **A API local (master antiga `501414ea4`) não tem nenhuma rota v2 de catálogo**: `/categories/v2` cai em `categories/{uri}` (404 "Category with uri v2 was not found"), `/products/v2` em `products/{id}` (404 "Product não encontrado"), e `most-ordered`, detalhe e `/price` dão `route_not_found`. Os testes 8 a 10 da task, portanto, só provam a **URL e o corpo enviados**, não o 200/422: `GET /categories/v2?environment=board`, `GET /products/v2?category_id=1&page=1&limit=24&environment=board`, `GET /products/v2?only_offers=1&sort=discount_desc&limit=8&environment=board`, `GET /products/v2/most-ordered?window=30&limit=10&environment=board`, `POST …/price` com corpo `{ quantity: 2, option_selections: [], environment: 'board' }`. O `only_offers=true` via curl também deu 404 (rota inexistente), então a decisão 2 não foi confirmada por 422 aqui.
- Testes 11 e 12 (helpers puros) passaram: `formatCents(2690)` = `R$ 26,90`; `resolveShowcasePrice` devolveu `{R$ 26,90, R$ 33,90, -21%}`, riscado sem selo para 1600/1599/0, e `null` para `price: 0`; `resolveRatingDisplay` devolveu `null` para `{null,0}` e `{4,8; 1.234}` para `{4.75,1234}`.
- `/` continua prerenderizada (`○ /` no build). Nenhum teste em navegador (a task não os pede).
- Grep 6: `console.error` aparece em `src/services/api-error-interceptor.ts:37` (fundação da 38, não é código desta task); `src/services/{menu,product,home}.ts` e `money.ts` estão limpos. Grep 5: `is_available_on_delivery` aparece na declaração do tipo e em dois comentários explicando por que não se filtra.
- Ordem de deploy: tudo aqui exige delivery-api#1607 (e #1625/#1626/#1627/#1765) publicadas; antes disso o cardápio da mesa falha em 404/422.

## Follow-ups identificados em review

- [ ] **`fetchMenuProducts` trunca em 200 sem avisar** (`limit=200`, o `meta.has_more` se perde): loja com mais de 200 produtos de mesa fica com as trilhas da home incompletas. Decidir na #41.
- [ ] **RN-09 de produto (`activated`) sem helper comum:** filtrar nas telas #41, #42 e #44, ou criar um helper.
- [ ] **#43:** descartar `ingredient_public_id` nulo antes de montar `removed_ingredients` — a API valida `uuid`.
- [ ] **Confirmar `CATALOG_PAGE_LIMIT = 24` com o dev** (decisão 4).
- [ ] (opcional) `boardCatalogParams`/`boardCatalogBody` com `T extends object`, para aceitar `interface` sem index signature.

Corrigido no review (2026-11-24): comentários de `money.ts` e `sheet-route.ts` portados com referências do client que não valem aqui (RN e issues de lá, CEP, favoritos, `loadBoot`), e o comparador de `use-menu-categories.ts` sem abreviação.

