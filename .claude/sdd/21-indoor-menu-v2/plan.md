# Plan — Cardápio nas rotas v2 do catálogo, no ambiente mesa

**Spec:** [spec.md](./spec.md)
**Issue da feature:** [#21](https://github.com/sgrande-delivery/delivery-indoor/issues/21)
**Branch de trabalho:** uma por task (`task/<id>-<slug>`), cortadas de `feat/indoor-v2`

## Abordagem técnica

> **Fonte do design.** Token vem de `.claude/design-system/tokens.json` (versionado pelo [PR #26](https://github.com/sgrande-delivery/delivery-indoor/pull/26)); layout, copy e estado vêm do protótipo citado em "Referência de design" na spec. Carregar a skill `modelo-de-design` antes de implementar tela. Ver a RN-11 da [#20](https://github.com/sgrande-delivery/delivery-indoor/issues/20).

O cardápio é a área onde o `delivery-client` dá mais código pronto, porque lá ele já consome exatamente estas rotas. As fontes, todas em `feat/app-v2`: `src/services/menu.ts`, `src/services/product.ts`, `src/services/search.ts`, `src/services/ingredients.ts`, `src/components/menu/`, `src/components/category/`, `src/components/product/`, `src/components/search/`, `src/components/home/`, `src/hooks/use-load-more.ts` e os primitivos `ProductCard.tsx` / `ProductListItem.tsx` / `QuantityStepper.tsx` / `ThumbDiscountMark.tsx`. O que muda na tradução: cai tudo que depende de login (`is_favorite`, últimos comprados, avaliação) e entra o `environment=board` em toda chamada.

**Serviços e tipos.** Uma camada por recurso, em `src/services/`, com os tipos em `src/types/`. O tipo da v2 nasce novo, não é cópia do que existe — o repo tem hoje `src/types/category.ts` declarando um shape que a API não devolve mais, e foi isso que quebrou o cardápio em produção com o `tsc` limpo. Os helpers de dinheiro ficam num módulo só, que recebe centavos.

**Paginação.** `GET /products/v2` devolve `meta.has_more`, então o hook não precisa comparar `current_page < last_page` por conta própria. O scroll infinito reaproveita o `useInfiniteScroll` que a task 03 da feature 1 trouxe, com as duas armadilhas já pagas e registradas lá: a sentinela tem de ser renderizada **incondicionalmente**, e a página que falhou não pode ser dada como consumida. Na stack nova a alternativa é `useInfiniteQuery` do React Query, que já guarda páginas e erro por página — é o caminho recomendado, e a sentinela continua sendo responsabilidade da tela.

**Detalhe do produto.** `option_groups` é o coração: cada grupo tem `kind`, `min_quantity`, `max_quantity`, `is_required`, e os itens têm `price_override` (centavos), `taste_amount`, `flavor_slots` e `is_default`. A validação de seleção que o `delivery-client` já escreveu é o modelo; o preço vem de `POST /products/v2/{publicId}/price`, com debounce, e o estado de "calculando" é spinner no rodapé do detalhe, não skeleton na tela toda.

**Tablet.** O design do indoor mostra o cardápio do tablet com trilha de categorias fixa (`🍔 Burgers`, `🍟 Combos`, `🥤 Bebidas`, `🍰 Doces`), grade de 3 colunas em paisagem e 2 em retrato, e cada card com o preço — **sem** `+` de adicionar: o card inteiro abre o detalhe (RF-13). A sacola lateral que aparece ao lado é da frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22) e mora no `AppShell` ([#49](../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md)); o cardápio não reserva a coluna, preenche o `Scroller` que sobra ao lado dela.

## Decisões arquiteturais

- **Migrar o catálogo junto com o carrinho, não depois.** O carrinho v2 valida a seleção em `option_groups`; alimentá-lo com produto v1 exigiria um tradutor de complemento legado → opções, que é código que nasceria para morrer.
- **Tipo novo, não cópia.** Ver RN-07 da feature 1: tipo que mente passa no `tsc` e quebra em produção. Cada tipo da v2 é escrito contra o presenter real (`ShowProductPresenter`, `SearchProductsPresenter`, `CategorySummaryPresenter`), lido em `origin/master` da api.
- **`environment=board` na camada de serviço, não no call site.** Um parâmetro obrigatório que cada tela precisa lembrar de mandar é um bug esperando acontecer — e já aconteceu duas vezes neste repo. O serviço o injeta.
- **Busca no servidor.** Decisão derivada da RN-06: a busca local era um paliativo da paginação quebrada.
- **Implementar contra o contrato, sem esperar a api.** Enquanto a [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) não subir, `GET /products/v2` e `GET /ingredients` respondem 422 a `environment=board`, e `GET /categories/v2` e `/most-ordered` o ignoram e devolvem o catálogo de entrega (a tabela "Estado de cada rota" da [#40](./tasks/40-catalog-v2-services-types.md) tem o caso de cada rota). Não se tira o parâmetro, não se envolve em `try/catch` e não se faz mock: o relatório da task avisa que a tela fecha quando a api subir.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Serviços e tipos do catálogo v2, com centavos e envelope da v2 | [#40](https://github.com/sgrande-delivery/delivery-indoor/issues/40) | [40-catalog-v2-services-types.md](./tasks/40-catalog-v2-services-types.md) | #20 | executada |
| 02 | Home do cardápio: categorias, trilhas e ofertas do ambiente mesa | [#41](https://github.com/sgrande-delivery/delivery-indoor/issues/41) | [41-menu-home-rails.md](./tasks/41-menu-home-rails.md) | 01 | executada |
| 03 | Listagem da categoria com paginação e scroll infinito | [#42](https://github.com/sgrande-delivery/delivery-indoor/issues/42) | [42-category-listing-infinite-scroll.md](./tasks/42-category-listing-infinite-scroll.md) | 01, 02 | executada |
| 04 | Detalhe do produto: grupos de opção, receita e preço do servidor | [#43](https://github.com/sgrande-delivery/delivery-indoor/issues/43) | [43-product-detail-composer.md](./tasks/43-product-detail-composer.md) | 01 | executada |
| 05 | Busca no cardápio pela rota v2 | [#44](https://github.com/sgrande-delivery/delivery-indoor/issues/44) | [44-menu-search-v2.md](./tasks/44-menu-search-v2.md) | 03 | executada |
| 06 | Tablet: grade 3/2 colunas e trilha de categorias fixa | [#45](https://github.com/sgrande-delivery/delivery-indoor/issues/45) | [45-tablet-menu-grid.md](./tasks/45-tablet-menu-grid.md) | 02, 03, 04, 05 | pendente |
| 07 | Filtro por ingrediente na busca: seletor de `GET /ingredients`, "com" e "sem" (RF-15) | [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67) | [67-search-ingredient-filter.md](./tasks/67-search-ingredient-filter.md) | 05 | pendente |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

Nesta feature todas as tasks são deste repo, então o arquivo leva o número da issue (`40-…` a `45-…` e `67-…`), e a coluna `#` guarda a ordem do plan — a mesma regra da [#20](../20-indoor-v2-foundation/plan.md).

**Divergência D1 — `GET /ingredients` no ambiente mesa (medida em `delivery-api` `origin/master` @ `8db44045e`, 2026-11-23). Resolvida em 2026-11-23 pela [delivery-api#1764](https://github.com/sgrande-delivery/delivery-api/issues/1764)**, task nova da #1607 que fez exatamente a recomendação abaixo: `environment` na lista fechada, no escopo da contagem (produto **e** categoria pelo ambiente) e na chave de cache. A linha 07 deixou de estar parada e foi materializada como [#67](https://github.com/sgrande-delivery/delivery-indoor/issues/67), com o contrato da #1764 inline. O registro original fica para o histórico: A spec diz que todas as rotas do contrato levam `environment=board`, inclusive `GET /ingredients?q&limit`, e a RF-15 desenha o `product_count` por ingrediente. A api: `GetIngredientsRequest.php:11` tem lista fechada `['q', 'limit']` e responde 422 ao `environment`; `ProductEngineeringRepository.php:719,732` conta só produto e categoria com `is_available_on_delivery = true`; e a [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) põe a rota fora de escopo (task #1626, "Fora de escopo: Ingredientes"). Mandar o parâmetro é 422 para sempre; não mandar é o catálogo de entrega com a contagem de entrega. A linha 07 fica parada até o dev decidir — a recomendação é uma task nova na #1607 (`environment` na lista fechada, no escopo de host e na chave de cache de `GetIngredientsUseCase`). A 05 foi escrita sem nenhuma parte do filtro por ingrediente para não depender da decisão.

**Reconciliação com a #22 (2026-11-23).** As tasks das duas features foram escritas em paralelo e divergiam em quatro encaixes; ficou assim, e as tasks citadas carregam a linha "Reconciliado com a #22":

- **Adicionar à sacola.** Um encaixe só, o da 04: o detalhe chama `useProductAddAction().add(selection)` e não importa nada de `src/components/cart/`; a [#46](../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md) provê a ação (`CartAddActionProvider`) em `app/(menu)/layout.tsx` e manda a seleção como corpo. A `ProductSelection` (snake_case, o corpo de `POST /cart/{cartId}/items`) e o `OptionSelection` (o mesmo no `/price`) nascem na 01, em `src/types/product-selection.ts`. As mensagens de falha ao adicionar são da #46; a regra de quando o CTA aparece, desabilita ou vira a nota "só para olhar" é a tabela do rodapé da 04, com hooks da fundação — não há `useCanWriteCart()`.
- **Coluna da sacola no tablet.** Dono único: o `AppShell`, pela #49. A 06 perdeu o `MenuFrame` e o slot `aside` e não mexe no layout do grupo; a grade divide o `Scroller`, que com a coluna montada já é a área real.
- **Cortes de orientação.** `tabletLandscapeMediaQuery` e `tabletPortraitShellMediaQuery` nascem na 01, em `shell-metrics.ts`, e a 06 e a #49 os leem.
- **Stepper de 40.** Um follow-up só, na 04, apontando o `delivery-client`; a #46 e a #49 apontam para lá.

## Ordem de execução

1. **`01` primeiro**, porque todas as outras leem dela. Ela também move `app/page.tsx` para o grupo `app/(menu)/`, traz a rota `?product=` e o `scroll-behavior`, o tipo `ProductSelection` e os dois cortes de orientação do tablet, para que as tasks seguintes — e as da #22 que leem daqui — não criem o mesmo arquivo em paralelo.
2. **`02` e `04` em paralelo** depois da `01`: a home cria `app/(menu)/page.tsx`, o detalhe cria `app/(menu)/layout.tsx`.
3. **`03`** depois da `02`, porque usa a trilha de categorias (`MenuCategoryRail`) e o `categoryRouteHref` que a home cria. (Corrigido na materialização: o plan previa a `03` em paralelo com a `02`, e as duas criariam a mesma trilha.)
4. **`05`** depois da `03`, que é quem define a lista, o scroll infinito e o erro de página que a busca reaproveita.
5. **`06`** por último, porque mexe nas telas da `02`, da `03` e da `05`, e o card dela abre o detalhe da `04`. Ela não toca o layout do grupo nem o shell, e não depende da #49: com ou sem a coluna, a grade divide o `Scroller`.
6. **`07`** depois da `05`, em paralelo com a `06`. As duas tocam a tela de resultados da busca: a `07` põe as chips de ingrediente dentro da `SearchControlsRail` da `05`, que é a trilha que a `06` fixa no tablet, e por isso nenhuma das duas cria trilha nova. Quem entrar depois rebaseia. *(Acrescentado em 2026-11-23, quando a D1 foi resolvida.)*

**A #22 lê desta feature:** a [#46](../22-indoor-cart-order-v2/tasks/46-board-cart-v2.md) precisa da `01` e da `04` na base (tipo, `formatCents`, o detalhe e o layout do grupo); a [#49](../22-indoor-cart-order-v2/tasks/49-tablet-cart-panel.md) precisa da `01` (cortes de orientação) e, para o roteiro em navegador, da `03` e da `05` (as rotas `/menu` e `/search`). A `05` e a #46 ligam linhas vizinhas de `shell-tabs.ts` (`search` e `cart`); o conflito na junção é de linha vizinha.

Se for preciso escolher uma só: a **`04`**. Sem o detalhe com grupos de opção, não há item válido para o carrinho v2 receber.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | `environment=board` em `GET /categories/v2` (hoje fixo em `DELIVERY`, inclusive na chave de cache; o parâmetro é ignorado, com 200 de entrega) e em `GET /products/v2` (hoje 422 em parâmetro desconhecido) + `/most-ordered` (hoje ignorado, com 200 de entrega). Spec irmã: [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607), `.claude/sdd/1607-client-catalog-board-environment/`, tasks #1625 e #1626 | **Especificado, não implementado.** Medido em `origin/master` @ `8db44045e` em 2026-11-23 |
| `delivery-api` | `GET /products/v2/{publicId}` no ambiente pedido (404 para produto que a mesa não vende) e `POST /price` fixado em teste no ambiente mesa | #1627, reescrita em 2026-11-23: o detalhe **usa** o `environment` (antes "ignorado"). O `/price` já aceita hoje |
| `delivery-api` | Faceta de categoria da busca no ambiente do critério (`ProductSearchFacetsService.php:50`) | #1626, mudança 6 (emenda de 2026-11-23) |
| `delivery-api` | `special_price`, `discount_percent` e `size_prices[]` da promoção do ambiente (`ProductCardService.php:40-41`, `ShowProductUseCase.php:145`) | [#1765](https://github.com/sgrande-delivery/delivery-api/issues/1765), task nova de 2026-11-23 |
| `delivery-api` | `environment` em `GET /ingredients`, na contagem e na chave de cache (divergência D1) | [#1764](https://github.com/sgrande-delivery/delivery-api/issues/1764), task nova de 2026-11-23. Destravou a linha 07 |
| `delivery-api` | Nota de contrato: `only_offers` é `1`/`0`, e `true` é 422 | Registrada no contrato da #1626; nenhuma mudança lá. A decisão pendente 4 da spec foi corrigida |

## Aprendizados que valem para as próximas tasks

- **2026-11-23 — Divergência medida vira task no dono do contrato, e a linha parada destrava quando a task de lá existe, e não quando ela sobe.** A D1 parou a linha 07 até a #1607 ganhar a #1764. A partir daí a regra do `CLAUDE.md` vale de novo: a tela é construída contra o contrato escrito, e o aviso de ordem de deploy vai no relatório. Ao reler um contrato emendado, procurar nas tasks daqui as frases "parada", "lacuna" e "até a api corrigir": cada uma passa a apontar a task de lá que a resolve, ou sai.
