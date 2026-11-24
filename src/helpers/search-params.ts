import { SEARCH_ROUTE } from '@/routes/app-routes';
import { ProductSort, productSorts } from '@/types/product-page';

/**
 * Os nomes dos parâmetros são os de `GET /products/v2`: o estado da busca vive no endereço, e o endereço fala o
 * vocabulário da api. Recarga, voltar e link compartilhado preservam o recorte sem uma segunda tradução.
 */
export const searchParamNames = {
  term: 'q',
  categoryId: 'category_id',
  sort: 'sort',
  onlyOffers: 'only_offers',
} as const;

// `q` é `max:120` no `SearchProductsRequest`; passar disso é 422.
export const SEARCH_TERM_MAX_LENGTH = 120;

/** `only_offers=true` é 422: o endereço e a api falam `1`, e só `1` liga na leitura. */
const ONLY_OFFERS_ON = '1';

export const DEFAULT_SEARCH_SORT: ProductSort = 'best_selling';

export interface SearchFilters {
  term: string | null;
  categoryId: number | null;
  sort: ProductSort | null;
  onlyOffers: boolean;
}

export const emptySearchFilters: SearchFilters = {
  term: null,
  categoryId: null,
  sort: null,
  onlyOffers: false,
};

export type SearchParamSource = Record<string, string | string[] | undefined>;

function readValue(source: SearchParamSource, name: string): string | null {
  const raw = source[name];
  const first = Array.isArray(raw) ? raw[0] : raw;

  return first ?? null;
}

/** A forma canônica do termo: sem borda e sem espaço repetido, para `parse(build(x)) === x`. */
export function normalizeSearchTerm(term: string): string {
  return term.trim().replace(/\s+/g, ' ');
}

// Termo acima do limite é cortado, não descartado: o campo já limita a digitação, então só endereço montado à mão chega aqui.
function parseTerm(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }

  // Corte por caractere, como o `max:120` da api: `slice` partiria um emoji e o `encodeURIComponent` lançaria.
  const term = normalizeSearchTerm(Array.from(raw).slice(0, SEARCH_TERM_MAX_LENGTH).join(''));

  return term === '' ? null : term;
}

function parseCategoryId(raw: string | null): number | null {
  if (raw === null || !/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const id = Number(raw);

  return Number.isSafeInteger(id) ? id : null;
}

function parseSort(raw: string | null): ProductSort | null {
  return productSorts.find(candidate => candidate === raw) ?? null;
}

/** O que a api recusaria não vira estado: sai como ausente, em vez de atravessar a tela e virar 422. */
export function parseSearchFilters(source: SearchParamSource): SearchFilters {
  return {
    term: parseTerm(readValue(source, searchParamNames.term)),
    categoryId: parseCategoryId(readValue(source, searchParamNames.categoryId)),
    sort: parseSort(readValue(source, searchParamNames.sort)),
    onlyOffers: readValue(source, searchParamNames.onlyOffers) === ONLY_OFFERS_ON,
  };
}

/** `sort` ausente é a ordenação padrão desta tela (RF-14). */
export function resolveSearchSort(sort: ProductSort | null): ProductSort {
  return sort ?? DEFAULT_SEARCH_SORT;
}

/** O padrão não vai para o endereço: `/search?q=x` e `/search?q=x&sort=best_selling` são a mesma busca. */
export function buildSearchHref(filters: SearchFilters): string {
  const params = new URLSearchParams();

  if (filters.term !== null) {
    params.set(searchParamNames.term, filters.term);
  }

  if (filters.categoryId !== null) {
    params.set(searchParamNames.categoryId, String(filters.categoryId));
  }

  if (filters.sort !== null && filters.sort !== DEFAULT_SEARCH_SORT) {
    params.set(searchParamNames.sort, filters.sort);
  }

  if (filters.onlyOffers) {
    params.set(searchParamNames.onlyOffers, ONLY_OFFERS_ON);
  }

  const query = params.toString();

  return query === '' ? SEARCH_ROUTE : `${SEARCH_ROUTE}?${query}`;
}

/** Uma rota, duas telas: com termo, categoria ou promoções é resultado; sem nenhum é a entrada. */
export function hasActiveSearch(filters: SearchFilters): boolean {
  return filters.term !== null || filters.categoryId !== null || filters.onlyOffers;
}
