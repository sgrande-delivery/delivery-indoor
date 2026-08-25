# 03 — Paginação e scroll infinito na listagem de produtos

**Issue:** [#4](https://github.com/sgrande-delivery/delivery-indoor/issues/4)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** delivery-indoor
**Depende de:** (nenhuma)
**Status:** pendente

## Objetivo

Devolver o cardápio ao cliente. Hoje `/menu/[url]` não abre — mostra *"aconteceu um erro ao carregar a página"* — porque a `delivery-api` passou a paginar os produtos da categoria, e `/offers` mostra silenciosamente só a primeira página. Esta é a task de maior impacto visível da feature: sem cardápio, o cliente não consegue pedir.

## Contexto

**O que a API devolve hoje** (verificado em produção, 2026-08-25):

```
GET /categories/{url}?environment=board&page=2&rows=5
→ { ..., "products": { "items": [...], "total": 11, "current_page": 2, "last_page": 3 } }

GET /products?environment=board&page=1&rows=5
→ { "items": [...], "total": 6, "current_page": 1, "last_page": 2 }
```

Repare: **`current_page`, não `per_page`** (**RN-06**). O tipo `Paginated` do `delivery-client` (`delivery-client/src/types/paginated.ts`) declara `per_page`, campo que a API não devolve — não copie o arquivo.

**Como isso quebra hoje:**

- `pages/menu/[url].tsx:83` faz `response.data.products.map(...)`. Com `products` sendo objeto, isso lança `TypeError: products.map is not a function`. O `catch` em `:99` trata o erro como `AxiosError`, não encontra `error.response`, e cai no retorno genérico de `:112` — daí a mensagem na tela.
- `src/types/category.ts:21` declara `products: Product[]`, o que faz o `tsc` aprovar o `.map()`. Tipo que mente (**RN-07**).
- `pages/offers.tsx:39` já lê `response.data.items` (corrigido no commit `8854f3d`), mas não passa `page`/`rows` nem lê `last_page` — sempre a primeira página, sem sinal de que há mais.
- `src/components/index/categories/Categories.tsx:69` chama `/categories`, que **continua devolvendo array simples** — verificado. Não mexer nele.

**Referência no `delivery-client`** (traduzir de MUI v6 + App Router para MUI v4 + Pages Router):

- `src/hooks/useInfiniteScroll.ts` — `IntersectionObserver` puro, sem dependência nova, `rootMargin: '0px 0px 300px 0px'`
- `src/hooks/useLoadMore.ts` — liga o observer ao `PaginationProvider`
- `src/providers/PaginationProvider.tsx` — `page`, `lastPage`, `loading`, `rows`
- `src/components/offers/hooks/use-fetch-offers.ts` — o padrão de acumular páginas (`setProducts(state => [...state, ..._products])`)

Cobre **RF-04** e **RF-05**.

## Mudanças

### 1. Tipo do envelope

`src/types/paginated.ts` (novo):

```ts
export interface Paginated<T> {
  items: T;
  total: number;
  current_page: number;
  last_page: number;
}
```

Escrito do zero, com os campos que a API realmente devolve.

### 2. Corrigir o tipo da categoria

`src/types/category.ts` (alterado):

`Category.products` passa a refletir o contrato. Como `/categories` (lista) e `/categories/{url}` (detalhe) têm shapes diferentes, separe em vez de fazer o campo virar união — união aqui empurraria `if` de narrowing para dentro de cada componente:

```ts
export interface Category { /* ...sem products... */ }

export interface CategoryWithPaginatedProducts extends Category {
  products: Paginated<Product[]>;
}
```

Conferir os consumidores de `Category` antes de mexer — `src/components/category/`, `src/components/index/categories/`, `pages/menu/index.tsx`.

### 3. Constante de tamanho de página

`src/constants/constants.ts` (alterado):

```ts
export const PER_PAGE_PAGINATION_VALUE = 20;
```

### 4. Hooks de paginação

`src/hooks/useInfiniteScroll.ts` (novo) e `src/hooks/useLoadMore.ts` (novo):

Portar do `delivery-client` — o código é agnóstico de UI, então a tradução é praticamente só de imports. Manter `IntersectionObserver`; não adicionar biblioteca.

`src/providers/PaginationProvider.tsx` (novo):

Portar, **removendo o `'use client'`** do topo (é diretiva de App Router e não existe aqui).

### 5. Página de categoria

`pages/menu/[url].tsx` (alterado):

- `getServerSideProps` lê `response.data.products.items` e devolve também `lastPage`
- Passa `rows: PER_PAGE_PAGINATION_VALUE` na query para a primeira página vir do mesmo tamanho das seguintes
- A página envolve o conteúdo em `PaginationProvider` e um componente cliente acumula as páginas seguintes com `api.get<CategoryWithPaginatedProducts>('/categories/{url}', { params: { environment: 'board', page, rows } })`

**Não** conserte o `catch` mascarando o erro: o bloco em `:99` assume `AxiosError` e engole qualquer outra exceção. Torne-o honesto — erro que não for de HTTP precisa aparecer, senão a próxima mudança de contrato volta a se disfarçar de "aconteceu um erro".

### 6. Página de ofertas

`pages/offers.tsx` (alterado):

- `getStaticProps` passa `page: 1` e `rows`, e devolve `lastPage` junto de `products`
- Componente cliente acumula as próximas páginas de `/products`, no padrão de `use-fetch-offers.ts` do `delivery-client`

### 7. Ponto de observação no fim da lista

`src/components/products/ProductList.tsx` (alterado):

Renderizar a `ref` do `useLoadMore()` como sentinela depois do último item. Prender o observer ao último card faria o alvo mudar a cada página carregada.

## Testes

Não há suíte automatizada neste repo. Verificação:

- `npx tsc --noEmit` sem erros
- `npx eslint src pages --ext .ts,.tsx` sem novos erros
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=<uuid> npx next build` concluindo as 6 rotas

**Roteiro no navegador:**

1. `yarn dev`; abrir `http://localhost:3000/menu`
2. Entrar numa categoria com mais produtos que `PER_PAGE_PAGINATION_VALUE` — **a página precisa abrir** (hoje mostra a mensagem de erro)
3. Rolar até o fim: a página seguinte carrega e os itens são **acrescentados**, não substituídos
4. Continuar rolando até `last_page`: para de buscar, sem loop de requisição. Conferir na aba Network
5. Entrar numa categoria com menos produtos que uma página: nenhuma requisição extra
6. Repetir 3–5 em `/offers`
7. Conferir que `/menu` (lista de categorias) continua funcionando — ela consome array simples e não deve ter sido afetada
8. Categoria inexistente (`/menu/nao-existe`) continua mostrando "404 - página não encontrada"

## Critérios de aceitação

- [ ] `/menu/<categoria>` abre — a mensagem "aconteceu um erro ao carregar a página" não aparece mais
- [ ] Rolar até o fim carrega a página seguinte e **acrescenta** os itens
- [ ] Ao atingir `last_page`, nenhuma requisição adicional é feita
- [ ] Categoria menor que uma página não dispara requisição extra
- [ ] `/offers` tem o mesmo comportamento
- [ ] `/menu` (lista de categorias) segue funcionando
- [ ] `src/types/` reflete o envelope real, com `current_page` — `grep -rn "per_page" src` não retorna nada
- [ ] O `catch` de `pages/menu/[url].tsx` não mascara mais exceção que não seja `AxiosError`
- [ ] `npx tsc --noEmit` sem erros e `npx next build` concluindo

## Fora de escopo

- Migrar para `/products/v2` — decisão registrada no plan
- Paginar `/categories` (lista) — continua array simples
- Paginar produtos da mesa (`/boardMovements/{id}/products`) — não paginou
- Busca de produtos (`/search`)
- Skeleton ou animação de carregamento além do indicador simples de `loading`

## Branch

`task/03-products-pagination-infinite-scroll`, base sugerida: `master`.
