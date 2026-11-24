import { Ingredient } from '@/types/ingredient';

/**
 * O escolhido que não volta para o termo atual sairia do alcance do cliente, que não conseguiria desmarcá-lo. As
 * linhas escolhidas vêm antes da resposta, sem repetir, e o nome vem do catálogo sem termo.
 */
export function pinChosenIngredients(response: Ingredient[], chosen: string[], catalog: Ingredient[]): Ingredient[] {
  const byId = new Map([...catalog, ...response].map(ingredient => [ingredient.id, ingredient]));
  const pinned = chosen.flatMap(id => byId.get(id) ?? []);
  const pinnedIds = new Set(pinned.map(ingredient => ingredient.id));

  return [...pinned, ...response.filter(ingredient => !pinnedIds.has(ingredient.id))];
}
