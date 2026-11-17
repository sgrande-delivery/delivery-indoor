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

**Tablet.** O design do indoor mostra o cardápio do tablet com trilha de categorias fixa (`🍔 Burgers`, `🍟 Combos`, `🥤 Bebidas`, `🍰 Doces`), grade de 3 colunas em paisagem e 2 em retrato, e cada card com o preço e um `add` de 44px no canto. A sacola lateral que aparece ao lado é da frente [#22](https://github.com/sgrande-delivery/delivery-indoor/issues/22); aqui o layout só reserva a coluna.

## Decisões arquiteturais

- **Migrar o catálogo junto com o carrinho, não depois.** O carrinho v2 valida a seleção em `option_groups`; alimentá-lo com produto v1 exigiria um tradutor de complemento legado → opções, que é código que nasceria para morrer.
- **Tipo novo, não cópia.** Ver RN-07 da feature 1: tipo que mente passa no `tsc` e quebra em produção. Cada tipo da v2 é escrito contra o presenter real (`ShowProductPresenter`, `SearchProductsPresenter`, `CategorySummaryPresenter`), lido em `origin/master` da api.
- **`environment=board` na camada de serviço, não no call site.** Um parâmetro obrigatório que cada tela precisa lembrar de mandar é um bug esperando acontecer — e já aconteceu duas vezes neste repo. O serviço o injeta.
- **Busca no servidor.** Decisão derivada da RN-06: a busca local era um paliativo da paginação quebrada.
- **Implementar contra o contrato, sem esperar a api.** Enquanto a [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607) não subir, `environment=board` responde 422. Não se tira o parâmetro, não se envolve em `try/catch` e não se faz mock: o relatório da task avisa que a tela fecha quando a api subir.

## Tasks

| # | Task | Issue | Arquivo | Depende de | Status |
|---|------|-------|---------|------------|--------|
| 01 | Serviços e tipos do catálogo v2, com centavos e envelope da v2 | — | — | #20 | a especificar |
| 02 | Home do cardápio: categorias, trilhas e ofertas do ambiente mesa | — | — | 01 | a especificar |
| 03 | Listagem da categoria com paginação e scroll infinito | — | — | 01 | a especificar |
| 04 | Detalhe do produto: grupos de opção, receita e preço do servidor | — | — | 01 | a especificar |
| 05 | Busca no cardápio pela rota v2 | — | — | 01 | a especificar |
| 06 | Tablet: grade 3/2 colunas e trilha de categorias fixa | — | — | 02, 03 | a especificar |

Status: `a especificar` → `pendente` → `executada` → `shipped`.

## Ordem de execução

1. **`01` primeiro**, porque todas as outras leem dela.
2. **`02`, `03` e `04` em paralelo** depois da `01` — telas diferentes, arquivos diferentes.
3. **`05`** depois da `03`, que é quem define o componente de lista que a busca reaproveita.
4. **`06`** por último, porque mexe no layout de `02` e `03`.

Se for preciso escolher uma só: a **`04`**. Sem o detalhe com grupos de opção, não há item válido para o carrinho v2 receber.

## Dependências de outros repos

| Repo | O que precisa | Estado |
|---|---|---|
| `delivery-api` | `environment=board` em `GET /categories/v2` (hoje fixo em `DELIVERY`, inclusive na chave de cache) e em `GET /products/v2` + `/most-ordered` (hoje 422 em parâmetro desconhecido). Spec irmã: [delivery-api#1607](https://github.com/sgrande-delivery/delivery-api/issues/1607), `.claude/sdd/1607-client-catalog-board-environment/` | **Não existe.** Medido em `origin/master` em 2026-11-16. Até subir, a chamada com o parâmetro responde 422 |
| `delivery-api` | `GET /products/v2/{publicId}` e `POST /products/v2/{publicId}/price` coerentes com o ambiente | Parte da mesma spec irmã |

## Aprendizados que valem para as próximas tasks
