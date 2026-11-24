import { OptionGroup, OptionGroupItem, ProductDetail } from '@/types/product-detail';
import { BuildableComposition, resolveFlavorLimit, resolveWidestFlavorLimit } from './buildable';

function pickDefaultItems(group: OptionGroup, limit: number): OptionGroupItem[] {
  return group.items
    .filter(item => item.is_default === true)
    .sort((first, second) => first.position - second.position)
    .slice(0, Math.max(limit, 0));
}

function resolveGroupDefaultLimit(
  group: OptionGroup,
  composition: BuildableComposition | null,
  defaultSizeItem: OptionGroupItem | null
): number {
  if (composition !== null && group.id === composition.flavorGroup.id) {
    return resolveFlavorLimit(composition.flavorGroup, defaultSizeItem) ?? resolveWidestFlavorLimit(composition);
  }

  return group.max_quantity;
}

/**
 * O padrão passa pelo mesmo limite que um clique: `max_quantity` no grupo comum e no `extra` com
 * stepper, onde cada padrão vale uma unidade, e o limite do tamanho padrão no sabor (o maior entre os tamanhos,
 * sem tamanho padrão). Grupo sem padrão fica sem chave.
 */
export function resolveDefaultSelections(
  detail: ProductDetail | undefined,
  composition: BuildableComposition | null
): Record<number, number[]> {
  if (!detail) {
    return {};
  }

  const defaultSizeItem = composition ? (pickDefaultItems(composition.sizeGroup, 1)[0] ?? null) : null;
  const selections: Record<number, number[]> = {};

  detail.option_groups.forEach(group => {
    const limit = resolveGroupDefaultLimit(group, composition, defaultSizeItem);
    const itemIds = pickDefaultItems(group, limit).map(item => item.id);

    if (itemIds.length > 0) {
      selections[group.id] = itemIds;
    }
  });

  return selections;
}
