import { buildSearchHref, parseSearchHref, resolveSearchSort, SearchFilters } from '@/helpers/search-params';
import { ProductPageResponse } from '@/types/product-page';
import { RelaxCandidate, relaxableFilters, SearchResultsPage } from '@/types/search';
import { api } from './api';
import { boardCatalogParams } from './catalog-environment';
import { CATALOG_PAGE_LIMIT } from './menu';

/** Só entra o que está presente: a rota recusa parâmetro desconhecido e valor fora da lista com 422. */
export function searchPageParams(filters: SearchFilters, page: number) {
  return boardCatalogParams({
    page,
    limit: CATALOG_PAGE_LIMIT,
    sort: resolveSearchSort(filters.sort),
    ...(filters.term !== null && { q: filters.term }),
    ...(filters.categoryId !== null && { category_id: filters.categoryId }),
    ...(filters.onlyOffers && { only_offers: 1 }),
    // Nome base, sem colchete: a axios o acrescenta, e um colchete aqui duplicaria o par e a api responderia 422.
    ...(filters.includeIngredients.length > 0 && { include_ingredients: filters.includeIngredients }),
    ...(filters.excludeIngredients.length > 0 && { exclude_ingredients: filters.excludeIngredients }),
  });
}

/** A contagem pendente só lê `meta.total`, então pede um produto: `min:1` é o piso do `limit`. */
const SEARCH_PENDING_LIMIT = 1;

/** Prefixo próprio: a contagem da seleção pendente nunca responde pelo cache da listagem, que tem outra forma. */
export function searchPendingQueryKey(filters: SearchFilters) {
  return ['search-pending', buildSearchHref(filters)] as const;
}

export async function fetchSearchPendingTotal(filters: SearchFilters): Promise<number> {
  const response = await api.get<ProductPageResponse>('/products/v2', {
    params: { ...searchPageParams(filters, 1), limit: SEARCH_PENDING_LIMIT },
  });

  return response.data.meta.total;
}

/** O endereço canônico do recorte: o mesmo filtro por caminhos diferentes reusa o cache, e `sort` novo é query nova. */
export function searchResultsQueryKey(filters: SearchFilters) {
  return ['search-results', buildSearchHref(filters)] as const;
}

/** O recorte de uma chave de `searchResultsQueryKey`; `null` para chave de outra forma. */
export function searchResultsKeyFilters(queryKey: readonly unknown[] | undefined): SearchFilters | null {
  const href = queryKey?.[1];

  return queryKey?.[0] === 'search-results' && typeof href === 'string' ? parseSearchHref(href) : null;
}

function isRelaxCandidate(
  candidate: ProductPageResponse['meta']['facets']['relaxed'][number]
): candidate is RelaxCandidate {
  return relaxableFilters.some(filter => filter === candidate.filter);
}

/**
 * O recorte que **mantém** as facetas (o `selectProductPage` da categoria as descarta). `relaxed` vazio é o caso
 * normal — o servidor só propõe relaxamento em resultado escasso —, e candidato de filtro desconhecido não tem frase.
 */
export function selectSearchResultsPage(payload: ProductPageResponse): SearchResultsPage {
  const { total, per_page, current_page, last_page, has_more, facets } = payload.meta;

  return {
    data: payload.data,
    meta: { total, per_page, current_page, last_page, has_more },
    relaxed: facets.relaxed.filter(isRelaxCandidate),
    categoryFacets: facets.categories.map(({ id, name, count }) => ({ id, name, count })),
  };
}

export async function fetchSearchResultsPage(filters: SearchFilters, page: number): Promise<SearchResultsPage> {
  const response = await api.get<ProductPageResponse>('/products/v2', { params: searchPageParams(filters, page) });

  return selectSearchResultsPage(response.data);
}
