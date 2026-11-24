import { Ingredient } from '@/types/ingredient';

/**
 * O escolhido que não volta para o termo atual sairia do alcance do cliente, que não conseguiria desmarcá-lo: só esse
 * vem antes da resposta, com o nome do catálogo sem termo. O que já está na resposta fica onde está — subir a linha
 * tocada mexeria a lista debaixo do dedo, e o toque seguinte cairia noutra linha.
 */
export function pinChosenIngredients(response: Ingredient[], chosen: string[], catalog: Ingredient[]): Ingredient[] {
  const responseIds = new Set(response.map(ingredient => ingredient.id));
  const catalogById = new Map(catalog.map(ingredient => [ingredient.id, ingredient]));
  const missing = chosen.filter(id => !responseIds.has(id)).flatMap(id => catalogById.get(id) ?? []);

  return [...missing, ...response];
}
