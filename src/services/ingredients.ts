import { Ingredient } from '@/types/ingredient';
import { api } from './api';
import { boardCatalogParams } from './catalog-environment';

/** O teto da rota. Sem `limit` o controller usa 50 e o catálogo chega cortado por `product_count`. */
export const INGREDIENTS_LIMIT = 200;

interface IngredientListResponse {
  data: Ingredient[];
}

/** Uma chave por termo: o termo vazio é o catálogo que as chips da trilha usam para resolver nome. */
export function ingredientsQueryKey(term: string) {
  return ['ingredients', 'board', term] as const;
}

/** A ordem é a do servidor, `product_count` desc; o número fica porque a linha do seletor o desenha. */
export async function fetchIngredients(term: string): Promise<Ingredient[]> {
  const response = await api.get<IngredientListResponse>('/ingredients', {
    params: boardCatalogParams({ limit: INGREDIENTS_LIMIT, ...(term !== '' && { q: term }) }),
  });

  return response.data.data;
}
