import { ProductDetail } from '@/types/product-detail';
import { ProductSelection } from '@/types/product-selection';
import { ProductComposer } from './composer/use-product-composer';
import { selectRemovableLines } from './composer/recipe';

/**
 * A seleção no formato do carrinho v2 (`ProductSelection`), ou `null` com grupo pendente. Não calcula
 * nada: ids vêm do payload do detalhe, e o preço é resposta do `/price`.
 *
 * `removed_ingredients` leva só ids de linha removível da receita (opcional e com `ingredient_public_id`),
 * porque a API valida `uuid` e linha sem id não tem o que mandar.
 */
export function buildProductSelection(detail: ProductDetail, composer: ProductComposer): ProductSelection | null {
  if (composer.pendingGroups.length > 0) {
    return null;
  }

  const removableIds = new Set(selectRemovableLines(detail.recipe).map(line => line.ingredient_public_id));
  const notes = composer.notes.trim();

  return {
    product_id: detail.id,
    quantity: composer.quantity,
    option_selections: composer.optionSelections,
    removed_ingredients: composer.removedIngredients.filter(id => removableIds.has(id)),
    notes: notes === '' ? null : notes,
  };
}
