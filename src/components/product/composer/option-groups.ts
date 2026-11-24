import { OptionGroup, OptionGroupItem } from '@/types/product-detail';
import { SizedIncrements } from './buildable';

const QUANTITY_GROUP_KIND = 'extra';
const UNBOUNDED_LIMIT = 20;
const SINGLE_UNIT = 1;

export function optionGroupElementId(groupId: number): string {
  return `option-group-${groupId}`;
}

// layout e escolha saem de `min_quantity`, `max_quantity` e `is_required` — dado real do
// tenant traz "Borda" como `other`. O `kind` do grupo só é lido em `hasItemQuantity`.
export function isSingleChoice(group: OptionGroup): boolean {
  return group.max_quantity === 1;
}

export function hasItemQuantity(group: OptionGroup): boolean {
  return group.kind === QUANTITY_GROUP_KIND && !isSingleChoice(group);
}

export function hasVisibleLimit(group: OptionGroup): boolean {
  return group.max_quantity < UNBOUNDED_LIMIT;
}

export function resolveItemIncrement(sizedIncrements: SizedIncrements, item: OptionGroupItem): number | null {
  // `null` no mapa é decisão (borda por tamanho sem tamanho escolhido), não ausência: por isso `in`
  // e não `??`, que cairia no `price_override` antes da escolha do tamanho.
  return item.id in sizedIncrements ? sizedIncrements[item.id] : item.price_override;
}

export function resolveItemQuantity(quantities: Record<number, number>, itemId: number): number {
  return quantities[itemId] ?? SINGLE_UNIT;
}

export function countGroupSelections(
  group: OptionGroup,
  selectedItemIds: number[],
  quantities: Record<number, number>
): number {
  if (!hasItemQuantity(group)) {
    return selectedItemIds.length;
  }

  return selectedItemIds.reduce((total, itemId) => total + resolveItemQuantity(quantities, itemId), 0);
}

export function isGroupPending(group: OptionGroup, selectedCount: number): boolean {
  return group.is_required && selectedCount < group.min_quantity;
}

// Um grupo de escolha única só volta a "nenhum" quando zero seleções não o deixam pendente.
export function canClearSingleChoice(group: OptionGroup): boolean {
  return isSingleChoice(group) && !isGroupPending(group, 0);
}

// O selo do grupo, curto e no tom do artboard: "Escolha 1", "até 3", "Opcional".
export function describeOptionGroup(group: OptionGroup): string {
  if (!group.is_required) {
    return hasVisibleLimit(group) ? `até ${group.max_quantity}` : 'Opcional';
  }

  if (!hasVisibleLimit(group)) {
    return `Escolha ao menos ${group.min_quantity}`;
  }

  if (group.min_quantity === group.max_quantity) {
    return `Escolha ${group.min_quantity}`;
  }

  return `Escolha de ${group.min_quantity} a ${group.max_quantity}`;
}

export function describePendingGroup(group: OptionGroup): string {
  return `Escolha ${group.name.toLocaleLowerCase('pt-BR')}`;
}
