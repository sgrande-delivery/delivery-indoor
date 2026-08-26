# 03 — Paginação e scroll infinito na listagem de produtos

**Issue:** [#4](https://github.com/sgrande-delivery/delivery-indoor/issues/4)
**Feature:** [Recuperar o delivery-indoor](../spec.md) — issue [#1](https://github.com/sgrande-delivery/delivery-indoor/issues/1)
**Tipo:** bug
**Repo:** delivery-indoor
**Depende de:** (nenhuma)
**Status:** shipped

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

- [x] `/menu/<categoria>` abre — a mensagem "aconteceu um erro ao carregar a página" não aparece mais
- [ ] Rolar até o fim carrega a página seguinte e **acrescenta** os itens (não verificado em navegador real — ver "O que NÃO foi verificado" na Implementação)
- [ ] Ao atingir `last_page`, nenhuma requisição adicional é feita (garantido por construção no código; não observado via aba Network num navegador real)
- [x] Categoria menor que uma página não dispara requisição extra (verificado: toda categoria de produção hoje tem `last_page: 1`, e o `useLoadMore` fica `disabled` desde o início)
- [x] `/offers` tem o mesmo comportamento na carga da primeira página (o comportamento de rolagem tem a mesma ressalva acima)
- [x] `/menu` (lista de categorias) segue funcionando
- [x] `src/types/` reflete o envelope real, com `current_page` — `grep -rn "per_page" src` não retorna nada
- [x] O `catch` de `pages/menu/[url].tsx` não mascara mais exceção que não seja `AxiosError`
- [x] `npx tsc --noEmit` sem erros e `npx next build` concluindo

## Fora de escopo

- Migrar para `/products/v2` — decisão registrada no plan
- Paginar `/categories` (lista) — continua array simples
- Paginar produtos da mesa (`/boardMovements/{id}/products`) — não paginou
- Busca de produtos (`/search`)
- Skeleton ou animação de carregamento além do indicador simples de `loading`

## Branch

`task/03-products-pagination-infinite-scroll`, cortada de `feature/indoor-recovery-and-session-token` em 2026-08-25.

A branch de integração acumula as features `1` e `2`; o PR desta task abre contra ela, não contra `master`.

## Implementação

**Concluída em:** 2026-08-26

### Camadas tocadas

- **Tipos:** `src/types/paginated.ts` (novo, `Paginated<T>` com `current_page`/`last_page`); `src/types/category.ts` (`Category` perdeu `products`; nova `CategoryWithPaginatedProducts extends Category` com `products: Paginated<Product[]>`)
- **Constantes:** `src/constants/constants.ts` — `PER_PAGE_PAGINATION_VALUE = 20`
- **Hooks/providers agnósticos de UI:** `src/hooks/useInfiniteScroll.ts` (novo), `src/hooks/useLoadMore.ts` (novo), `src/providers/PaginationProvider.tsx` (novo, sem `'use client'`) — porte quase literal do `delivery-client`, sem tradução de MUI porque não têm JSX de UI própria
- **Hooks de fetch (client-side, despacham para estado local, não Redux):** `src/components/offers/hooks/use-fetch-offers.ts` (novo), `src/components/category/hooks/use-fetch-category-products.ts` (novo)
- **Componentes:** `src/components/category/CategoryProducts.tsx` (novo — wrapper cliente que chama o hook de fetch e passa para `Products`, análogo ao `Offers.tsx`); `src/components/offers/Offers.tsx` (alterado — passa a chamar `useFetchOffers`, recebe `lastPage`, propaga `retry`); `src/components/products/ProductList.tsx` (alterado — sentinela do `useLoadMore()` depois do `</List>`, indicador `CircularProgress` quando `loading`, mensagem + botão "tentar novamente" quando `error`); `src/components/products/Products.tsx` (alterado — sincroniza `filteredProducts`, e mantém `ProductList` montado enquanto houver página seguinte mesmo com busca sem resultado ainda — ver decisões)
- **Páginas:** `pages/menu/[url].tsx` (alterado — SSR lê `products.items`/`last_page`, passa `rows`, `catch` honesto, `PaginationProvider key={category.url}` + `CategoryProducts`, `GetServerSideProps<CategoryPageProps>`); `pages/offers.tsx` (alterado — mesmo tratamento para `/products`; header **continua** `RestaurantId` numérico — ver revisão)

### Contratos consumidos

- `GET /categories/{url}?environment=board&page&rows` → `{ ...category, products: { items: Product[], total, current_page, last_page } }` — confirmado via SSR real em `/menu/pasteis` (produção): `page=1&rows=20` devolveu 11 itens com `last_page: 1`; com `rows=5` (teste temporário, revertido) devolveu 5 itens com `last_page: 3`, batendo com o exemplo do contexto da spec
- `GET /products?environment=board&page&rows` → `{ items: Product[], total, current_page, last_page }` — confirmado via SSR real em `/offers`: 6 itens, `last_page: 1`
- `GET /categories?environment=board` — não tocado; confirmado que continua array simples (usado por `Categories.tsx`, que não foi alterado)

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

1. ~~`pages/offers.tsx` trocou o header `RestaurantId` (numérico) por `x-restaurant-id` (UUID).`~~ **Revertido no review.** Eu tinha feito essa troca por conta própria porque já estava mexendo na chamada; o review apontou invasão de escopo (task 04, issue #5, já lista `pages/offers.tsx` e tem como critério `grep -rn "RestaurantId" src pages` vazio) e uma inconsistência real que eu não tinha visto: o SSR mandaria `x-restaurant-id`, mas as páginas 2+ saem por `src/services/api.tsx` no cliente, que ainda manda `RestaurantId` numérico — a mesma rota falando dois dialetos com o restaurante. Voltei para `RestaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID` e mantive `params: { page, rows }`, que são código novo desta task.

2. **Criei um componente cliente por rota (`CategoryProducts.tsx` para categoria, `Offers.tsx` alterado para ofertas) em vez de embutir o fetch direto na página.** A task diz "um componente cliente acumula as páginas seguintes", mas só lista `pages/menu/[url].tsx`, `pages/offers.tsx` e `ProductList.tsx` como arquivos alterados. Segui o padrão do CLAUDE.md ("componente não chama `api` direto; fetch client-side vai num hook `useFetchX`") e o padrão explícito do `delivery-client` (`Offers.tsx` chamando `useFetchOffers`), criando um par hook+componente por rota. `CategoryProducts.tsx` e as duas pastas `hooks/` são novas e não estavam na lista de "Mudanças" da task.

3. **`PaginationProvider` envolve `CategoryProducts` com `key={category.url}`.** Sem isso, navegar entre duas categorias via `<Link>` (que existe em `CategoryItem.tsx`, cliente-side, sem reload) reaproveitaria a mesma instância de `PaginationProvider` — `page`/`lastPage` da categoria anterior vazariam para a nova. O `key` força o React a desmontar e remontar toda a subárvore de paginação a cada categoria nova, zerando `page`/`lastPage`/`loading` e o estado interno do `Products`/`ProductList`. Dentro da mesma categoria (páginas 2, 3...) a key não muda, então o scroll infinito não é afetado. Não apliquei `key` em `/offers` porque não é uma rota parametrizada — só remonta ao navegar para longe e voltar, que já desmonta a página inteira.

4. **Corrigi `src/components/products/Products.tsx` para sincronizar `filteredProducts` com o prop `products`.** Não estava na lista de arquivos da task, mas sem isso o scroll infinito não apareceria na tela: `filteredProducts` era inicializado uma vez via `useState(products)` e nunca mais era atualizado quando `products` crescia (só quando o usuário digitava na busca). Adicionei `useEffect(() => { handleSearch(search); }, [products])` — refiltra com o termo de busca atual toda vez que a lista de produtos muda, o que cobre tanto "sem busca ativa" (mostra tudo) quanto "com busca ativa" (não perde o filtro ao carregar mais página). Sem essa mudança, o critério "rolar até o fim... acrescenta os itens" seria estruturalmente impossível de cumprir.

5. **Loading indicator:** adicionei um `CircularProgress` pequeno em `ProductList.tsx`, condicionado a `loading` do `PaginationProvider`, junto da sentinela. A seção "Fora de escopo" da task exclui "skeleton ou animação além do indicador simples de loading", o que eu li como permissão implícita para um indicador simples — não como proibição de qualquer indicador.

6. **`getServerSideProps` de `pages/menu/[url].tsx`: erro não-Axios agora é relançado (`throw err`)**, em vez de virar a mensagem genérica. Isso deixa o Next.js renderizar a página de erro padrão (500) e logar no servidor, em vez de mascarar como "aconteceu um erro ao carregar a página". O caso 404 (categoria inexistente) continua tratado via `axios.isAxiosError(err)` e a mensagem de texto original, preservando o roteiro de teste #8.

7. **`Category` sem `products` foi conferida contra todos os consumidores antes da mudança** (`grep` por `from 'src/types/category'`): `src/components/menu/Menu.tsx`, `src/components/index/categories/*`, `src/components/category/*` e `pages/menu/index.tsx` — nenhum lê `.products`. Só `pages/menu/[url].tsx` lia, e foi migrado para o tipo novo.

## Revisão (rodada 2)

O review voltou bloqueado com 3 correções obrigatórias (B1, B2, B3) e 2 melhorias baratas (M2, M4). Nada do que o review confirmou como correto foi alterado.

### B3 — header de `pages/offers.tsx`

Revertido para `RestaurantId` numérico (ver decisão 1 revisada acima). `params: { page, rows }` mantidos.

### B1 — falha de rede não pode pular página em silêncio

Reescrevi `src/components/category/hooks/use-fetch-category-products.ts` e `src/components/offers/hooks/use-fetch-offers.ts`:

- Extraí a busca para uma função `fetchPage(pageToFetch)` (via `useCallback`), chamada tanto pelo `useEffect` que reage a `page` quanto por um `retry()` explícito.
- `page` só avança de verdade quando `loadMore()` chama `setPage`, e isso só acontece quando `canLoadMore` é `true`. Em caso de falha, eu **não** avanço nem recuo `page` manualmente — em vez disso, marco `error` no `PaginationContext` (novo campo `error`/`setError`) e faço `canLoadMore = page < lastPage && !error` em `useLoadMore`. Como `page` nunca chegou a avançar além da página que falhou, a página falha continua sendo "a próxima a buscar": não há como pular uma página, porque nada além do retry manual consegue mover `page` enquanto `error` for verdadeiro (o observer fica `disabled`).
- Cada hook devolve `{ products, error, retry }`. `retry` chama `fetchPage(page)` de novo — a mesma página, porque `page` não mudou.
- `ProductList.tsx` lê `error`/`loading` do `usePagination()` e renderiza, no lugar do spinner, uma `Typography` com a mensagem de erro (`"não foi possível carregar mais produtos"` / `"...mais ofertas"`) e um `Button` "tentar novamente" que chama `onRetry` (prop nova, propagada de `CategoryProducts`/`Offers` → `Products` → `ProductList`).
- Sem loop com o observer: assim que `fetchPage` começa (sucesso ou retry), `setError(null)` é chamado antes da request — mas como `setLoading(true)` também roda no mesmo lote de atualização, o `loadMore()` do observer não dispara `setPage` de novo enquanto a tentativa está em voo (guarda `if (!loading && canLoadMore)`).

### B2 — busca ativa quebra a paginação

`Products.tsx` agora lê `{ page, lastPage }` de `usePagination()` e calcula `hasMorePages = page < lastPage`. A condição que decide entre `ProductList` e `NoData` virou `filteredProducts.length > 0 || hasMorePages` — ou seja, a lista (e a sentinela dentro dela) continua montada enquanto ainda houver página por buscar, mesmo com o filtro atual vazio. `NoData` só aparece quando a busca realmente esgotou o catálogo (`!hasMorePages && filteredProducts.length === 0`). O `useEffect` que já existia (refiltra com o termo de busca atual a cada nova leva de produtos) cuida de fazer o item aparecer assim que a página onde ele está chega.

### M2 — contexto que mente

`PaginationProvider.tsx`: `createContext<PaginationContext>({} as PaginationContext)` virou `createContext<PaginationContext | null>(null)`, e `usePagination()` agora lança `Error('usePagination precisa estar dentro de PaginationProvider')` quando o contexto é `null`. Confirmei que os únicos consumidores de `Products`/`ProductList`/`useLoadMore` (`CategoryProducts.tsx` e `Offers.tsx`) estão sempre dentro de `PaginationProvider` nas duas páginas que os usam.

### M4 — `GetServerSideProps` sem genérico

`pages/menu/[url].tsx`: `GetServerSideProps` virou `GetServerSideProps<CategoryPageProps>`. `tsc` continuou limpo porque todos os campos de `CategoryPageProps` já eram opcionais e os dois `return` (sucesso e erro) já batiam com o shape.

### Verificação desta rodada

- `npx tsc --noEmit` — limpo
- `npx eslint src pages --ext .ts,.tsx` — limpo
- `NEXT_PUBLIC_RESTAURANT_ID=1 NEXT_PUBLIC_RESTAURANT_UUID=38691b7e-6dbe-46e6-97a0-971147ac02ad npx next build` — 6 rotas concluídas
- `grep -rn "RestaurantId" pages/offers.tsx` → volta a aparecer (linha do header), como o review pediu
- `grep -rn "per_page" src pages` → vazio

**Teste com `PER_PAGE_PAGINATION_VALUE` temporariamente em `3` contra a API real** (revertido para `20` depois, com os três comandos reconferidos):

- (a) e (b) confirmados **via SSR real** (`curl` + `__NEXT_DATA__`), não via interação de navegador (ver "O que NÃO foi verificado"): `page=1&rows=3` em `/categories/pasteis` devolve exatamente 3 itens (`pastel calabresa`, `Pastel Carne Com Queijo`, `Pastel Carreiro`) com `last_page: 4`; `page=2&rows=3` devolve os 3 seguintes, distintos dos da página 1 (`pastel de brigadeiro`, `Pastel de Carne`, `pastel de frango`); `page=4&rows=3` devolve os 2 últimos (`pastel romeu e julieta`, `pastelde frango c/ catupiry`), sem repetição com as páginas anteriores. Isso confirma que a acumulação (`[...state, ..._products]`) produziria os 11 itens distintos sem duplicar, e que `page(4) < lastPage(4)` é falso — o que desabilita o observer e para a cascata.
- (c) e (d) **não puderam ser observados ao vivo** — não há navegador/DOM neste ambiente para disparar o `IntersectionObserver` ou clicar no botão "tentar novamente". Validei por rastreamento manual do código, estado a estado (detalhado em "O que NÃO foi verificado"), e por uma checagem de rede real: `GET /categories/categoria-que-nao-existe?page=2` devolve `404`, confirmando que uma falha de página vira `AxiosError` de verdade e cairia no `.catch()` do `fetchPage`.

### Como testar

1. `yarn dev`
2. Abrir `http://localhost:3000/menu/pasteis` (ou qualquer categoria do cardápio) — a página deve abrir normalmente, sem a mensagem "aconteceu um erro ao carregar a página"
3. Abrir `http://localhost:3000/offers` — deve listar as ofertas atuais sem erro
4. Abrir `http://localhost:3000/menu` — lista de categorias deve continuar funcionando
5. Abrir `http://localhost:3000/menu/nao-existe` — deve mostrar "404 - página não encontrada"
6. Para exercitar o scroll infinito de verdade (produção não tem categoria/oferta com mais de 20 itens hoje): baixar temporariamente `PER_PAGE_PAGINATION_VALUE` em `src/constants/constants.ts` para `2` ou `3`, abrir uma categoria com mais itens que isso (ex.: `pasteis`, 11 produtos), rolar até o fim e conferir na aba Network que as páginas seguintes chegam e os produtos são **acrescentados** (não substituídos), parando ao atingir `last_page`. Reverter a constante depois.
7. Com `PER_PAGE_PAGINATION_VALUE` ainda baixo, digitar no campo de busca o nome de um produto que só existe numa página ainda não carregada (ex.: `pastel romeu e julieta`, que é o último de 4 páginas com `rows=3`) — a lista não deve mostrar "nenhum produto para exibir" enquanto ainda houver página por buscar; ela deve continuar rolando/carregando até o produto aparecer.
8. Para ver a UI de erro: em `src/components/category/hooks/use-fetch-category-products.ts`, trocar temporariamente a URL do `api.get` por um path inexistente (ex.: `` `/categories-x/${url}` ``), rolar até disparar a página 2 — deve aparecer a mensagem de erro e o botão "tentar novamente" no lugar do spinner; ao desfazer a alteração e clicar em "tentar novamente", a página 2 deve carregar normalmente. Reverter o arquivo depois.
9. Reverter `PER_PAGE_PAGINATION_VALUE` para `20` ao final e rodar `tsc`/`eslint`/`build` de novo.

### O que NÃO foi verificado

- **Interação real de scroll infinito, digitação de busca e clique em "tentar novamente" num navegador.** Este ambiente não tem ferramenta de navegador headless (sem Puppeteer/Playwright/Cypress/jsdom instalados, sem binário de Chrome/Chromium no sistema, e a task pede para não rodar `yarn install`). Verifiquei:
  - o contrato da API real com `curl` (`rows=3` em `/categories/pasteis`: página 1, 2 e 4 devolvem itens distintos, sem sobreposição, `last_page: 4` consistente; um path inexistente devolve `404` real, confirmando que o `.catch()` do `fetchPage` seria de fato exercitado por uma falha de rede real);
  - o SSR da primeira página via `curl` + `__NEXT_DATA__` (shape `{ category, products, lastPage }`, sem `products` embutido em `category`);
  - o código linha a linha, com um rastreamento manual do estado (`page`, `lastPage`, `error`, `loading`, `filteredProducts`, `hasMorePages`) para os quatro cenários pedidos pelo review — mas **não observei** o `IntersectionObserver` disparando de verdade, o DOM sendo atualizado, nem o clique no botão "tentar novamente", porque isso exige um navegador real.
- **Navegação cliente-side entre duas categorias diferentes** (`/menu/pasteis` → `/menu/lanches` via `<Link>`, sem reload). Não testei manualmente que o `key={category.url}` no `PaginationProvider` realmente remonta a subárvore como esperado.
- **Envio de pedido (`POST /boardMovements/{id}/orders`).** Fora do escopo desta task (não mexi em carrinho/checkout) e não havia mesa aberta disponível nesta sessão para testar.
