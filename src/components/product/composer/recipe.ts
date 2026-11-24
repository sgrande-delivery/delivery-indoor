import { RecipeLine } from '@/types/product-detail';

export interface RemovableRecipeLine extends RecipeLine {
  ingredient_public_id: string;
}

/**
 * O que a mesa deixa tirar: a linha opcional com id. A receita inteira não é listada, e a linha
 * obrigatória nem aparece — o cliente só tem controle sobre o que a cozinha retira.
 */
export function selectRemovableLines(recipe: RecipeLine[]): RemovableRecipeLine[] {
  return recipe.filter((line): line is RemovableRecipeLine => line.is_optional && line.ingredient_public_id !== null);
}
