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
  includeIngredients: 'include_ingredients',
  excludeIngredients: 'exclude_ingredients',
} as const;

// `max:10` por lista no `SearchProductsRequest`.
export const SEARCH_INGREDIENTS_MAX = 10;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  includeIngredients: string[];
  excludeIngredients: string[];
}

export const emptySearchFilters: SearchFilters = {
  term: null,
  categoryId: null,
  sort: null,
  onlyOffers: false,
  includeIngredients: [],
  excludeIngredients: [],
};

export type SearchParamSource = Record<string, string | string[] | undefined>;

function readValue(source: SearchParamSource, name: string): string | null {
  const raw = source[name];
  const first = Array.isArray(raw) ? raw[0] : raw;

  return first ?? null;
}

/** Lista no endereço é `nome[]=a&nome[]=b`; o nome sem colchete é aceito por tolerância, e o colchete vence. */
function readValues(source: SearchParamSource, name: string): string[] {
  const raw = source[`${name}[]`] ?? source[name];

  if (raw === undefined) {
    return [];
  }

  return Array.isArray(raw) ? raw : [raw];
}

/** Só uuid, sem repetição e até o teto da rota: o excedente é cortado aqui, e a edição o impede antes de chegar. */
function parseIngredientIds(raw: string[]): string[] {
  const ids = raw.map(id => id.toLowerCase()).filter(id => UUID_PATTERN.test(id));

  return Array.from(new Set(ids)).slice(0, SEARCH_INGREDIENTS_MAX);
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
  const includeIngredients = parseIngredientIds(readValues(source, searchParamNames.includeIngredients));
  // O mesmo id nas duas listas é 422 na api. O endereço vira request direto, então o conflito se resolve aqui, em favor de "com".
  const excludeIngredients = parseIngredientIds(readValues(source, searchParamNames.excludeIngredients)).filter(
    id => !includeIngredients.includes(id)
  );

  return {
    term: parseTerm(readValue(source, searchParamNames.term)),
    categoryId: parseCategoryId(readValue(source, searchParamNames.categoryId)),
    sort: parseSort(readValue(source, searchParamNames.sort)),
    onlyOffers: readValue(source, searchParamNames.onlyOffers) === ONLY_OFFERS_ON,
    includeIngredients,
    excludeIngredients,
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

  for (const id of filters.includeIngredients) {
    params.append(`${searchParamNames.includeIngredients}[]`, id);
  }

  for (const id of filters.excludeIngredients) {
    params.append(`${searchParamNames.excludeIngredients}[]`, id);
  }

  const query = params.toString();

  return query === '' ? SEARCH_ROUTE : `${SEARCH_ROUTE}?${query}`;
}

/** Uma rota, duas telas: com termo, categoria, promoções ou ingrediente é resultado; sem nenhum é a entrada. */
export function hasActiveSearch(filters: SearchFilters): boolean {
  return (
    filters.term !== null ||
    filters.categoryId !== null ||
    filters.onlyOffers ||
    filters.includeIngredients.length > 0 ||
    filters.excludeIngredients.length > 0
  );
}

/** O que `useSearchParams` devolve, na forma que `parseSearchFilters` lê: valor repetido vira lista. */
export function searchParamsToSource(params: Pick<URLSearchParams, 'forEach'>): SearchParamSource {
  const source: Record<string, string[]> = {};

  params.forEach((value, name) => {
    source[name] = [...(source[name] ?? []), value];
  });

  return source;
}

export function parseSearchHref(href: string): SearchFilters {
  const query = href.split('?')[1] ?? '';

  return parseSearchFilters(searchParamsToSource(new URLSearchParams(query)));
}

const recutParamNames = new Set<string>(Object.values(searchParamNames).flatMap(name => [name, `${name}[]`]));

/**
 * O endereço do recorte, com os parâmetros que **não** são dele (o `product` da folha) levados do endereço atual:
 * trocar o termo ou um filtro não pode fechar uma folha aberta.
 */
export function preserveSearchParams(currentSearch: string, href: string): string {
  const [pathname, query = ''] = href.split('?');
  const next = new URLSearchParams(query);

  new URLSearchParams(currentSearch).forEach((value, name) => {
    if (!recutParamNames.has(name)) {
      next.append(name, value);
    }
  });

  const merged = next.toString();

  return merged === '' ? pathname : `${pathname}?${merged}`;
}

export function withSearchHref(currentSearch: string, filters: SearchFilters): string {
  return preserveSearchParams(currentSearch, buildSearchHref(filters));
}

/** Os recortes iguais fora o termo: é quando a lista anterior ainda diz algo útil enquanto a nova chega. */
export function differsOnlyByTerm(a: SearchFilters, b: SearchFilters): boolean {
  return buildSearchHref({ ...a, term: null }) === buildSearchHref({ ...b, term: null });
}
