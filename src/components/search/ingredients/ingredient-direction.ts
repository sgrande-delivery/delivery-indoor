import { SEARCH_INGREDIENTS_MAX, SearchFilters } from '@/helpers/search-params';

export type IngredientDirection = 'include' | 'exclude';

const listFields = {
  include: 'includeIngredients',
  exclude: 'excludeIngredients',
} as const;

/**
 * O estado de uma linha é derivado das duas listas, nunca guardado ao lado delas: um mapa paralelo tornaria
 * expressável o par que a api recusa com 422 (o mesmo id nas duas). Lendo `include` primeiro, um endereço digitado à
 * mão com o id nos dois lados ainda tem estado definido.
 */
export function resolveIngredientDirection(filters: SearchFilters, id: string): IngredientDirection | null {
  if (filters.includeIngredients.includes(id)) {
    return 'include';
  }

  return filters.excludeIngredients.includes(id) ? 'exclude' : null;
}

export function withoutIngredient(filters: SearchFilters, id: string): SearchFilters {
  return {
    ...filters,
    includeIngredients: filters.includeIngredients.filter(candidate => candidate !== id),
    excludeIngredients: filters.excludeIngredients.filter(candidate => candidate !== id),
  };
}

/**
 * O teto é o da rota. Estourá-lo não daria erro visível: o parser corta o excedente na leitura do endereço e o
 * cliente veria sumir um filtro que escolheu. O lado em que o id já está nunca é bloqueado: tocá-lo só desliga.
 */
export function isIngredientDirectionBlocked(
  filters: SearchFilters,
  id: string,
  direction: IngredientDirection
): boolean {
  if (resolveIngredientDirection(filters, id) === direction) {
    return false;
  }

  return filters[listFields[direction]].length >= SEARCH_INGREDIENTS_MAX;
}

/** Tocar o lado aceso volta ao neutro. Tocar o outro tira o id das duas listas antes de gravar, para o par não existir. */
export function toggleIngredientDirection(
  filters: SearchFilters,
  id: string,
  direction: IngredientDirection
): SearchFilters {
  if (isIngredientDirectionBlocked(filters, id, direction)) {
    return filters;
  }

  const cleared = withoutIngredient(filters, id);

  if (resolveIngredientDirection(filters, id) === direction) {
    return cleared;
  }

  const field = listFields[direction];

  return { ...cleared, [field]: [...cleared[field], id] };
}
