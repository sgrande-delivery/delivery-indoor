# 02 — Home do cardápio: categorias, trilhas e ofertas do ambiente mesa

**Issue:** [#41](https://github.com/sgrande-delivery/delivery-indoor/issues/41)
**Feature:** [Cardápio nas rotas v2 do catálogo, no ambiente mesa](../spec.md) — issue #21
**Tipo:** feature
**Repo:** delivery-indoor
**Depende de:** 01 (#40)
**Status:** executada
**Reconciliado com a #22 (2026-11-23):** a coluna da sacola do tablet saiu do "Fora de escopo → 06": é da [#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md), no `AppShell`. Nada mais muda aqui.
**Alinhado às emendas da delivery-api#1607 (2026-11-23):** o `special_price` e o `discount_percent` dos cards passam a ser os da promoção de mesa (#1765), e o `products_count` das categorias, o da mesa (#1625). O contrato e o roteiro dizem o que o QA vê antes e depois; nenhuma mudança de código desta task muda.

## Objetivo

A rota `/` deixa de ser o placeholder e vira a home do cardápio da mesa: a trilha de categorias do ambiente mesa no topo, as trilhas "Ofertas" (`only_offers`) e "Mais pedidos" (`/most-ordered`) e, por categoria, uma trilha horizontal de produtos. Nenhum card tem o `+`: tocar no card abre o detalhe do produto (`?product=`). A trilha de categorias que nasce aqui é a mesma que a listagem da categoria (03) e a moldura do tablet (06) reutilizam.

## Contexto

### Estado atual

- `app/(menu)/page.tsx` é o placeholder movido pela 01 ("app de mesa em reconstrução", o antigo `app/page.tsx:4-10`).
- A 01 entrega `fetchMenuProducts`, `fetchOfferProducts`, `fetchMostOrderedProducts`, `useMenuCategories`/`selectVisibleCategories`, `resolveShowcasePrice`, `resolveRatingDisplay` e `pushProductSheet`. Esta task **não** chama `api` nem monta parâmetro de catálogo: tudo passa pelos serviços da 01, que já injetam `environment=board`.
- `src/providers/board-session/browsable-routes.ts:7` já libera `/` em `browsing` ("Ver o cardápio" da tela sem mesa). A home não precisa mudar isso.
- `src/components/shell/shell-tabs.ts:18` aponta a aba "Cardápio" para `HOME_ROUTE`; `resolveActiveTab` já marca `menu` em `/` e em `/menu` (`:47`).
- `src/routes/app-routes.ts:5` tem `MENU_ROUTE`, mas não há helper de href de categoria.
- O shell é a moldura (`src/components/shell/AppShell.tsx:21-25`): a região de conteúdo já é um `<main>` que rola e **não tem padding**. A tela não usa `<main>` nem `100dvh` (aprendizado da #20).

### Requisitos cobertos

- **RF-01** — categorias do ambiente mesa e, por categoria, trilha horizontal de produtos.
- **RF-19** — trilha "Mais pedidos" de `GET /products/v2/most-ordered`, com `window` e `limit` explícitos (a 01 os fixa).
- **Decisão pendente 4** — ofertas com `only_offers=1` na mesma rota, como trilha na home (default da spec, adotado).
- **RF-12** — preço promocional: vigente em `brand-text`, cheio riscado, selo `-{discount_percent}%` do servidor.
- **RF-13** — sem `+`; o card inteiro abre o detalhe.
- **RF-11** — skeleton com a forma da trilha, empty state do design, erro da fundação.
- **RN-09** — `activated: false` não entra.

### Contrato consumido (via serviços da 01)

- `GET /categories/v2?environment=board` → `{ data: MenuCategory[] }`. Visíveis: `activated && products_count > 0`, por `relevance` desc. **Nunca** filtrar por `is_available_on_delivery`: a categoria só de mesa vem com `false` (armadilha da 01).
- `GET /products/v2?environment=board&limit=200` → `{ data: ProductSummary[], meta }`. As trilhas por categoria agrupam `product.category.id`. Uma requisição só, como o `/cardapio` do client.
- `GET /products/v2?environment=board&only_offers=1&sort=discount_desc&limit=8` → ofertas, ordenadas pelo servidor.
- `GET /products/v2/most-ordered?environment=board&window=30&limit=10` → `{ data: ProductSummary[] }`.

Antes da delivery-api#1607: categorias e mais pedidos respondem **200 com o catálogo de entrega** (não há 422 para ver) e as duas listagens de `/products/v2` respondem **422**. A home mostra o erro de rota com o código `erro 422 · …` — é o comportamento esperado até a api subir (RN-04 da spec). Não esconder, não tirar o parâmetro.

Com `environment=board`, `products_count` conta os produtos da mesa (#1625), e o `special_price`/`discount_percent` de cada card é o da promoção de mesa (#1765), o mesmo que o `/price` e a sacola cobram. Com a #1626 no ar e a #1765 ainda não, a trilha "Ofertas" **seleciona** as ofertas da mesa (`only_offers` já usa o ambiente), mas o card de uma oferta só de mesa sai sem o preço promocional, e uma promoção só de entrega aparece riscada. É o payload, e a tela não o corrige.

### O que vem do `delivery-client` (`origin/feat/app-v2` @ `ceed49a9`)

| Fonte | Decisão | Tradução |
|---|---|---|
| `src/components/menu/menu-sections.ts` | adapta | **Sai** `category.is_available_on_delivery` do filtro (`:52`); fica `activated`. O resto (ordem por `relevance`, produtos de categoria desconhecida no fim e sem chip, `product.activated`) porta igual |
| `src/components/menu/MenuSection.tsx` | adapta | O `ProductCard` perde `onAdd`/`addLabel` (RF-13) e ganha preço, riscado e selo — passa a usar o `MenuProductCard` (mudança 3) |
| `src/components/menu/MenuSectionHeader.tsx`, `MenuSectionTitle.tsx`, `MenuRail.tsx`, `MenuSkeleton.tsx` | portam | — |
| `src/components/menu/MenuList.tsx` | adapta | Vira `MenuSectionList`, sem decidir erro sozinho: quem escolhe skeleton/erro/conteúdo é o `useQueryScreenState` da 38. A copy do vazio muda (mudança 6) |
| `src/components/menu/use-menu.ts` | adapta | Vira `use-menu-home.ts`, com as quatro queries da home. Sai `initialData` (não há SSR de catálogo aqui) |
| `src/components/home/HomeCategoryChips.tsx` + `src/components/menu/CategoryChips.tsx` | adapta e unifica | Vira `MenuCategoryRail`: chips **navegam** (`Link` para `/menu?category=<id>`), e a que é a categoria aberta leva `current` (a 03 passa o id; a home passa `null`). A âncora de seção com scroll-spy do `CategoryChips` não vem |
| `src/components/home/HomeProductRail.tsx`, `HomeSectionHeader.tsx`, `HomeRailSkeleton.tsx` | adaptam | Sai `showFavoriteMark` e o `HomeFavoriteMark` (RN-08) |
| `src/components/home/HomeProductCard.tsx` | adapta | Vira `MenuProductCard`, sem a marca de favorito |
| `src/components/home/HomeOfferRail.tsx`, `OfferCard.tsx`, `home-offers.ts` | adaptam | `selectHomeOffers` perde o `sort` e o `slice` (o servidor ordena por `discount_desc` e corta por `limit`); fica o `toOffer`, que descarta o que não tem promoção visível |
| `src/components/home/HomeScreen.tsx`, `use-home.ts` | **descarta** a composição | Pedido aberto, cupons, últimos comprados, favoritos e WhatsApp são do delivery ou exigem login (RN-08, RN-01 da #20). Só a ordem das trilhas inspira a mudança 5 |
| `src/components/home/HomeHeader.tsx`, `HomeHeaderSkeleton.tsx`, `src/components/menu/MenuHero.tsx`, `MenuHeroSkeleton.tsx`, `MenuFooter*.tsx`, `restaurant-info.ts`, `use-active-section.ts` | **descarta** | Cabeçalho com endereço, capa com tempo de entrega e frete grátis, rodapé com horário e WhatsApp: tudo do delivery. O canvas da mesa não desenha cabeçalho de loja no celular (ver decisões) |
| `src/components/home/HomeCouponRail.tsx`, `use-home-coupon-redeem.ts`, `home-coupons.ts`, `HomeOpenOrder*`, `use-open-order.ts`, `WhatsAppFab.tsx` | **descarta** | Cupom fora do escopo da spec; pedido aberto e WhatsApp não existem na mesa |

### Decisões

1. **Ordem da home:** trilha de categorias → "Ofertas" → "Mais pedidos" → uma trilha por categoria. As duas trilhas de destaque vêm antes porque são as que não dependem de o cliente saber o que quer. É decisão desta task (o canvas da mesa não desenha a home do celular); confirmar com o dev.
2. **As chips navegam, não rolam a página.** Na home elas levam a `/menu?category=<id>` (a listagem completa e paginada, 03), como o `HomeCategoryChips` do client. Rolar até a trilha da categoria (o scroll-spy do `/cardapio` do client) entregaria só os produtos que couberam nos 200 da requisição única.
3. **Chip sem ícone.** O protótipo do tablet desenha ícone por categoria (`lunch_dining`, `fastfood`, `cake`), mas `GET /categories/v2` não tem campo de ícone (presenter na 01) e **mapear nome para ícone no cliente seria inventar dado do tenant** — o mesmo motivo do `HomeCategoryChips.tsx` @ `ceed49a9`, que recusou o emoji. Os três nomes também estão fora de `icon-names.ts`. Fica registrado como pendência de produto, junto com a RF-08 (ver abaixo).
4. **Chip com 44px.** O `Chip` do DS tem 12px de fonte e padding de 9 (`chipPaddings`, `src/theme/component-tokens.ts:68-73`), abaixo do alvo de toque do tablet (RN-08 da #20; o protótipo desenha 44). A trilha usa `styled(Chip)` **fora** de `src/components/ui/` com `minBlockSize: controlSizes.md.height` (o `control-md` de 44 do `tokens.json`) e o padding `lg`. Não se altera o primitivo.
5. **RF-08 fica parcial nesta task.** O `ProductCard` do DS desenha o placeholder `shopping_bag` fixo (`src/components/ui/ProductCard.tsx:228-230`) e o contrato não tem ícone de categoria. Nas trilhas vale o placeholder do primitivo; o card de grade do tablet (06) é da mesa e trata o caso. Pendência para o dev: aceitar um ícone fixo da mesa, ou pedir `icon` na categoria à api (fora da #1607).
6. **Tamanhos de card:** `md` (180) nas trilhas por categoria, como o `MenuSection` do client; `sm` (158) em "Mais pedidos", como o `HomeProductRail`. "Ofertas" usa o `OfferCard` portado.
7. **Selo de desconto no card de trilha é o `Badge` `offer`**, no slot `badge` do `ProductCard` (a 8 do canto), que é a anatomia do primitivo (`design-system/components/ProductCard/README.md`, "Selo de oferta no canto da mídia"). O `Badge` `offer` é `secondary` sobre `secondary.contrastText` (`Badge.tsx:31-35`), o mesmo tom do `ThumbDiscountMark` que a RF-12 cita. O `ThumbDiscountMark` não entra no slot: ele se posiciona sozinho e somaria o recuo dos dois.
8. **Sem cabeçalho de loja no celular.** A barra superior do tablet (marca, mesa, abas) é do shell da 37. No celular o shell só tem a navegação inferior, e o canvas da mesa não desenha cabeçalho de home de celular. Não se porta o `HomeHeader`/`MenuHero` do delivery.

### Armadilhas

- **`is_available_on_delivery` no filtro** esconde a categoria só de mesa — o critério de aceite número 1 da spec. Ver a 01.
- **Duas fontes que divergem:** a listagem traz produto de categoria que `/categories/v2` não devolve (e o contrário). `createMenuSections` já resolve: ordem pela relevância das categorias e o resto no fim, sem chip, para nenhum produto ficar inalcançável (`menu-sections.ts:44-46` @ `ceed49a9`). Não "limpe" isso.
- **Os 200 da requisição única cortam o cardápio grande.** Loja com mais de 200 produtos de mesa tem trilhas incompletas na home; a listagem completa é a da 03, a um toque da chip. Fica registrado, não se pagina a home.
- **Erro nunca vira vazio.** Se a listagem principal falhar, a home é o erro de rota (`RouteErrorState`), não "nenhum produto". Se só ofertas ou mais pedidos falharem, a trilha vira `InlineError` no lugar dela e o resto da home fica. Trilha vazia com sucesso simplesmente não aparece (o `HomeProductRail` do client já faz isso).
- **Query de ofertas sem promoção ativa** devolve `data: []` — a trilha some, sem empty state.
- **Os primitivos quebram sem `ThemeProvider`** — a base desta branch já tem o tema da 34, então o roteiro em navegador roda aqui mesmo.

## Mudanças

### 1. Href da categoria

`src/routes/app-routes.ts` (alterado): `+ export function categoryRouteHref(categoryId: number): string` → `` `${MENU_ROUTE}?category=${categoryId}` ``. É o único lugar que monta essa URL; a 03 lê o mesmo nome de parâmetro (`CATEGORY_SEARCH_PARAM = 'category'`, exportado daqui).

### 2. Trilha de categorias

`src/components/menu/MenuCategoryRail.tsx` (novo) e `src/components/menu/MenuCategoryChip.tsx` (novo).

```ts
export interface MenuCategoryRailProps {
  categories: MenuCategory[];      // já visíveis (selectVisibleCategories)
  currentCategoryId: number | null;
  trailing?: React.ReactNode;      // a chip de busca do tablet entra aqui na 06
}
```

- `<nav aria-label="Categorias do cardápio">`, rolagem horizontal sem barra (`MenuRail`/`categoryRailMetrics`).
- Cada chip é `MenuCategoryChip` (`styled(Chip)` com 44px, decisão 4) renderizado como `Link` para `categoryRouteHref(id)`, com `current` quando `id === currentCategoryId` (emite `aria-current`, `Chip.tsx:37-50`). Nunca `selected`: a chip navega, não alterna.
- Sem categorias, não renderiza nada.

### 3. Card de trilha

`src/components/menu/MenuProductCard.tsx` (novo; adapta `src/components/home/HomeProductCard.tsx` @ `ceed49a9`): `ProductCard` com `size`, nome, `subtitle` = descrição, `imageUrl`, `price`/`originalPrice`/`priceTone` de `resolveShowcasePrice`, `badge={<Badge variant="offer">…}` quando há `discountLabel`, e `onOpen={() => pushProductSheet(product.public_id)}`. **Sem** `onAdd` e **sem** `addLabel` — o tipo do `ProductCard` (`:42`) já garante que um não vem sem o outro.

### 4. Seções por categoria

`src/components/menu/menu-sections.ts`, `MenuSection.tsx`, `MenuSectionHeader.tsx`, `MenuSectionTitle.tsx`, `MenuRail.tsx`, `MenuSkeleton.tsx`, `MenuSectionList.tsx` (novos; ver inventário). `MenuSectionList` recebe `sections` e só renderiza conteúdo; o vazio é a mudança 6.

### 5. Trilhas de destaque

- `src/components/menu/HomeProductRail.tsx`, `HomeSectionHeader.tsx`, `HomeRailSkeleton.tsx` (novos; ver inventário), com título "Mais pedidos".
- `src/components/menu/HomeOfferRail.tsx`, `OfferCard.tsx`, `home-offers.ts` (novos; ver inventário), título "Ofertas". `HOME_OFFERS_LIMIT = 8` vai para `fetchOfferProducts(HOME_OFFERS_LIMIT)`.
- Cada trilha recebe `{ items, isLoading, isError, onRetry }`: `isLoading` → skeleton da trilha; `isError` sem itens → `InlineError` com "Não foi possível carregar esta seção." e "Tentar de novo" (`src/components/error/InlineError.tsx:11-16`); vazio → nada.

A pasta é `src/components/menu/` para os dois grupos (não há "home" separada da mesa).

### 6. Tela e hook

`src/components/menu/use-menu-home.ts` (novo):

```ts
export const menuProductsQueryKey = ['menu', 'products'] as const;
export const menuOffersQueryKey = ['menu', 'offers'] as const;
export const menuMostOrderedQueryKey = ['menu', 'most-ordered'] as const;

export interface UseMenuHome {
  products: UseQueryResult<ProductSummary[]>;   // a que decide a tela
  categories: UseQueryResult<MenuCategory[]>;
  visibleCategories: MenuCategory[];
  sections: MenuSectionData[];
  offers: HomeRail<HomeOffer>;
  mostOrdered: HomeRail<ProductSummary>;
}
```

`staleTime` de 5 min em todas (o `MENU_STALE_TIME`/`HOME_STALE_TIME` do client).

`src/components/menu/MenuHomeScreen.tsx` (novo, `'use client'`):

- `screen = useQueryScreenState(products)` (`src/hooks/use-query-screen-state.ts:34`).
- `skeleton` → `MenuSkeleton` (trilha de chips em skeleton + duas trilhas), com `role="status"`, `aria-busy` e `aria-label="Carregando o cardápio"`.
- `error` → `RouteErrorState` com `title="Não conseguimos carregar o cardápio"` e `description="A mesa continua aberta e nada foi perdido. Verifique a conexão e tente de novo — ou chame o garçom."` (**derivada** do artboard `Estado · erro de rota`, como a copy genérica da 38; confirmar no review).
- `content`:
  - categorias com erro → `InlineError` "Não foi possível carregar as categorias." no lugar da trilha; com sucesso → `MenuCategoryRail` com `currentCategoryId={null}`;
  - `HomeOfferRail`, `HomeProductRail` ("Mais pedidos"), `MenuSectionList`;
  - `screen.isRefreshFailed` → `InlineError` no topo, conteúdo fica;
  - nenhuma seção → `EmptyState` com `icon="restaurant_menu"`, título "Nenhum produto para mostrar" (literal do artboard `Estado · vazio`) e descrição "O cardápio da mesa está sem itens no momento. Chame o garçom se quiser pedir algo." (**derivada**).
- Raiz é `div` com padding inferior para a navegação; sem `<main>`, sem `100dvh`.

`app/(menu)/page.tsx` (alterado): renderiza `<MenuHomeScreen />`. Server component sem `searchParams` (a home não tem filtro), para continuar prerenderizada.

## Testes

**Estáticos:**

1. `npx next typegen && npx tsc --noEmit`; `npx eslint src app scripts`; `yarn build` com as vars de restaurante, com `/` estática.
2. `grep -rn "onAdd\|addLabel" src/components/menu` não encontra nada.
3. `grep -rn "is_available_on_delivery\|api\.get\|api\.post" src/components/menu` não encontra nada.
4. `git diff --stat <base> -- src/theme src/components/ui` vazio.

**No navegador** (`next dev` com `.env.development` apontando para a API local; `rm -rf .next` se houve build antes — aprendizado da #20). Mesa aberta: `/?session=<uuid-aberto>` (`SELECT id FROM board_movements WHERE restaurant_id = 1 AND is_open = 1 …`, como na 36). Network filtrado por `products/v2|categories/v2`.

5. **Sem a #1607 no ar** (API master): `/categories/v2?environment=board` 200, `/products/v2?environment=board&limit=200` 422. A home mostra o erro de rota com `Código erro 422 · …`. Nenhuma requisição sai sem `environment=board`.
6. **Com a #1607** (API local na branch `feature/1607-client-catalog-board-environment` ou com o patch das tasks #1625/#1626 aplicado): a home renderiza chips, "Ofertas" (se houver promoção ativa de mesa; o preço promocional de cada card só é o da mesa com a #1765), "Mais pedidos" e as trilhas por categoria. Numa loja com categoria marcada só para mesa (`is_available_on_delivery = 0`, `is_available_on_board = 1`), a chip e a trilha dela **aparecem**.
7. Nenhum card tem `+`. Tocar num card empurra `?product=<public_id>` na URL sem request de navegação (o host que abre o detalhe é da 04; sem ela, a URL muda e nada abre).
8. Tocar numa chip navega para `/menu?category=<id>` (a tela é da 03; sem ela, 404 da 38).
9. Produto com `special_price`: vigente em `brand-text`, cheio riscado, selo `-N%` igual ao `discount_percent` do payload. Sem `special_price`: um preço só, em `ink`. Produto com `price: null`: card sem preço.
10. Bloquear `most-ordered` no DevTools (Request blocking): a trilha "Mais pedidos" vira `InlineError`; "Tentar de novo" refaz uma requisição; o resto da home fica.
11. "Ver o cardápio" da tela sem mesa (`/` sem session, sessionStorage limpo): a home abre em `browsing`.
12. 390 × 844 e 1180 × 820: chips com 44px de altura (DevTools, box model), trilhas rolam na horizontal sem barra, sem rolagem horizontal da página.

## Critérios de aceitação

- [ ] `/` mostra a trilha de categorias visíveis (`activated && products_count > 0`, por relevância), "Ofertas", "Mais pedidos" e uma trilha por categoria, nessa ordem.
- [ ] Nenhum filtro do código novo usa `is_available_on_delivery`; uma categoria só de mesa aparece quando a api serve o ambiente.
- [ ] As requisições da home são exatamente `GET /categories/v2?environment=board`, `GET /products/v2?environment=board&limit=200`, `GET /products/v2?environment=board&only_offers=1&sort=discount_desc&limit=8` e `GET /products/v2/most-ordered?environment=board&window=30&limit=10`.
- [ ] Nenhum card tem `+`; tocar no card empurra `?product=<public_id>`.
- [ ] Preço, riscado e selo seguem a RF-12, com o percentual igual ao do payload; `discount_percent: 0` não desenha selo.
- [ ] Chip de categoria tem 44px de altura, navega para `/menu?category=<id>` e emite `aria-current` só quando `currentCategoryId` casa.
- [ ] Falha da listagem principal mostra `RouteErrorState` com código; falha de ofertas, mais pedidos ou categorias mostra `InlineError` no lugar do bloco, com o resto da home de pé.
- [ ] Carregamento é skeleton com a forma das trilhas; vazio com sucesso é o `EmptyState` "Nenhum produto para mostrar".
- [ ] A tela não usa `<main>` nem `100dvh`, e nenhum arquivo de `src/theme/` ou `src/components/ui/` muda.
- [ ] `npx tsc --noEmit`, o lint e o `yarn build` passam, com `/` prerenderizada.

## Fora de escopo

- O detalhe do produto e o host de `?product=`: 04.
- `/menu?category=<id>`: 03. `/search`: 05.
- A moldura do tablet (trilha fixa, chip de busca no fim da trilha): 06. A coluna e a barra da sacola: [#49](../../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md), no `AppShell`.
- Ícone por categoria e o placeholder por categoria (RF-08): pendência de produto/contrato (decisões 3 e 5).
- Cabeçalho de loja no celular, capa, horário, WhatsApp, cupom, pedido aberto, favoritos e últimos comprados.
- Esconder o `+`/"adicionar" em `browsing`: não há `+` aqui; o rodapé do detalhe é da 04.

## Branch

`task/41-menu-home-rails`, cortada de `task/40-catalog-v2-services-types` (`792b461`) em 2026-11-24.

## Implementação

**Concluída em:** 2026-11-24

### Camadas tocadas

- Rotas: `src/routes/app-routes.ts` (`CATEGORY_SEARCH_PARAM`, `categoryRouteHref`); `app/(menu)/page.tsx` renderiza `<MenuHomeScreen />` (continua estática, `○ /`)
- Hook: `src/components/menu/use-menu-home.ts` (quatro queries, `HomeRail<T>`, chaves `menu/products|offers|most-ordered`)
- Tela: `MenuHomeScreen.tsx`, `MenuSkeleton.tsx`, `MenuSectionList.tsx`, `MenuSection.tsx`
- Trilha de categorias: `MenuCategoryRail.tsx`, `MenuCategoryChip.tsx`
- Cards e trilhas: `MenuProductCard.tsx`, `OfferCard.tsx`, `HomeOfferRail.tsx`, `HomeProductRail.tsx`, `HomeRailSkeleton.tsx`, `HomeRailError.tsx`
- Estrutura/puros: `MenuRail.tsx`, `MenuSectionHeader.tsx`, `MenuSectionTitle.tsx`, `HomeSectionHeader.tsx`, `menu-sections.ts`, `home-offers.ts`
- `src/theme/` e `src/components/ui/` sem alteração.

### Contratos consumidos

- As quatro rotas da task, via serviços da 01. URLs medidas no navegador: `/categories/v2?environment=board`, `/products/v2?limit=200&environment=board`, `/products/v2?only_offers=1&sort=discount_desc&limit=8&environment=board`, `/products/v2/most-ordered?window=30&limit=10&environment=board`. Respostas simuladas com `page.route` (a API local não tem rotas v2).

### Variáveis de ambiente novas

- Nenhuma.

### Decisões que tomei por conta própria

- `HomeRailError.tsx` (novo): o `InlineError` "Não foi possível carregar esta seção." compartilhado pelas duas trilhas, em vez de duplicar o slot com padding.
- `HomeSectionHeader` sem `actionLabel`/`actionHref`: nenhuma trilha tem destino de "ver todos".
- `OfferCard.tsx` portado sem alteração do `@ceed49a9`.
- `isLoading`/`isError` das trilhas consideram só a ausência de dado: durante o "Tentar de novo" a trilha volta ao skeleton, e com dado em cache uma falha de releitura não derruba a trilha.
- RN-09 (`activated`): filtrado em `createMenuSections`, `toOffer` e, via `select`, em "Mais pedidos". Sem helper comum (follow-up da 01 segue aberto para a #42/#44).
- Truncamento em 200 de `fetchMenuProducts` (follow-up da 01): **mantido, sem aviso na UI**, como a task manda ("não se pagina a home"); a listagem completa é a da #42 a uma chip de distância. Não alterei o serviço.
- `createMenuSections` ordena o resultado de `filter` (cópia), sem `.slice()`.
- Aviso de releitura falha (`isRefreshFailed`) e erro de categorias usam o mesmo `InlineError`, no topo/no lugar da trilha.
- Canvas do design (`/tmp/brasa-indoor-canvas.yzmPZk/`) não existia na máquina; layout veio do port, dos tokens e da task.

### Como testar

1. `yarn dev` com `.env.development`; abrir `/?session=<uuid>`.
2. Interceptar `/categories/v2` e `/products/v2*` (como em `/tmp/t41/run.js`) e conferir chips, "Ofertas", "Mais pedidos", trilhas por categoria, sem `+`.
3. Tocar num card: a URL ganha `&product=<public_id>`. Tocar numa chip: `/menu?category=<id>`.

### O que NÃO foi verificado

- Nenhuma resposta real das rotas v2 (a API local é a master antiga, tudo 404): só fixtures. Ordem de deploy: tudo depende da delivery-api#1607 (#1625/#1626/#1765); antes dela a home mostra o erro de rota (422) ou, em categorias/mais pedidos, o catálogo de entrega.
- Categoria só de mesa e preço promocional da mesa (dependem do payload real).
- Teste 11 (`/` sem session, sessionStorage limpo) e DevTools "Request blocking" reais (simulei com 500 por `page.route`).
- Medido: chips 44px em 390 e 820, sem `aria-current` na home, sem `+`, sem rolagem horizontal da página, console sem erro, skeleton, vazio ("Nenhum produto para mostrar"), erro 422 com código (`erro 422 · …`) e `InlineError` de "Mais pedidos" com retry refazendo 1 requisição. Viewport de 1180×820 não foi rodado (usei 820×1180).

## Follow-ups identificados em review

Corrigido no review (2026-11-24): categoria **desativada** não vira mais trilha órfã no fim da home (o grupo dela sai antes da ordenação — bug portado do client; conferido com teste da função pura); `HomeOfferItem` extraído para o `.map()` das ofertas não ter callback próprio; `MenuCategoryRail` não some quando há `trailing` (a chip de busca da #45 sobrevive a loja sem categoria visível); `InlineError` de releitura e de categorias com `isRetrying`.

- [ ] **Skeleton das chips enquanto `categories.isPending`:** se os produtos chegam antes, a home abre sem a trilha e reordena quando as categorias chegam.
- [ ] **#45:** `EmptyState` depende só de `sections`; com seções vazias e "Ofertas"/"Mais pedidos" com itens, a home mostra produtos e "Nenhum produto para mostrar" juntos.
- [ ] **#42:** a chave da listagem não pode começar com `['menu','products']`, senão invalidar a home invalida a paginação da categoria.
- [ ] **delivery-api#1607:** confirmar se `/products/v2` já exclui produto de categoria desativada (se sim, o filtro daqui é defesa).
- [ ] Linha de WHY no `as typeof Chip` de `MenuCategoryChip.tsx` (o `styled()` perde a tipagem polimórfica de `component={Link}`).
- [ ] Conferir o espaçamento das trilhas contra `Cardapio-Tablet-*` do canvas (não foi conferido na implementação).

