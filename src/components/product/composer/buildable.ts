import { OptionGroup, OptionGroupItem, ProductDetail } from '@/types/product-detail';

export type SizedIncrements = Record<number, number | null>;

export interface BuildableComposition {
  sizeGroup: OptionGroup;
  flavorGroup: OptionGroup;
  remainingGroups: OptionGroup[];
  borderPricesByPair: Map<string, number>;
  borderItemIds: Set<number>;
}

function sizePriceKey(modifierItemId: number, sizeItemId: number): string {
  return `${modifierItemId}:${sizeItemId}`;
}

function hasItemIn(group: OptionGroup, itemIds: Set<number>): boolean {
  return group.items.some(item => itemIds.has(item.id));
}

/**
 * Descobre a anatomia do buildável a partir da matriz `size_prices`, sem chavear por `kind`
 * (dado real do tenant traz "Borda" como `other` e com linhas na matriz `flavor`,
 * conferido: 39 linhas, 27 de sabor e 12 de borda).
 *
 * - **tamanho**: o grupo que aparece do lado `size_item_id` da matriz, e que aceita uma escolha só
 *   (o servidor lança `TooManySizeSelectionsException` para mais de uma).
 * - **sabor**: entre os grupos que aparecem do lado `modifier_item_id`, o obrigatório. O servidor
 *   exige pelo menos um sabor (`MissingFlavorSelectionException`), então um buildável cujo grupo de
 *   sabor fosse opcional seria impossível de pedir; a borda, ao contrário, é opcional no tenant.
 *
 * Sem os dois grupos, devolve `null` e a tela volta a renderizar os grupos genericamente.
 */
export function resolveBuildableComposition(detail: ProductDetail | undefined): BuildableComposition | null {
  if (!detail) {
    return null;
  }

  const rows = Object.values(detail.size_prices).flat();

  if (rows.length === 0) {
    return null;
  }

  const sizeItemIds = new Set(rows.map(row => row.size_item_id));
  const modifierItemIds = new Set(rows.map(row => row.modifier_item_id));

  const sizeGroup = detail.option_groups.find(group => group.max_quantity === 1 && hasItemIn(group, sizeItemIds));

  if (!sizeGroup) {
    return null;
  }

  const flavorGroup = detail.option_groups.find(
    group => group.id !== sizeGroup.id && group.is_required && hasItemIn(group, modifierItemIds)
  );

  if (!flavorGroup) {
    return null;
  }

  const borderRows = detail.size_prices.border ?? [];
  const borderPricesByPair = new Map<string, number>();

  borderRows.forEach(row => {
    borderPricesByPair.set(sizePriceKey(row.modifier_item_id, row.size_item_id), row.price);
  });

  return {
    sizeGroup,
    flavorGroup,
    remainingGroups: detail.option_groups.filter(group => group.id !== sizeGroup.id && group.id !== flavorGroup.id),
    borderPricesByPair,
    borderItemIds: new Set(borderRows.map(row => row.modifier_item_id)),
  };
}

function resolveGroupFlavorLimit(flavorGroup: OptionGroup): number {
  const hasCeiling = flavorGroup.max_quantity > 0;

  return hasCeiling ? flavorGroup.max_quantity : flavorGroup.items.length;
}

export function resolveFlavorLimit(flavorGroup: OptionGroup, sizeItem: OptionGroupItem | null): number | null {
  if (!sizeItem) {
    return null;
  }

  return sizeItem.flavor_slots ?? resolveGroupFlavorLimit(flavorGroup);
}

/**
 * O maior limite de sabores entre os tamanhos do produto: o teto da pré-seleção de sabor quando nenhum tamanho
 * está escolhido. Escolher o tamanho corta o excedente pelo `selectSize`.
 */
export function resolveWidestFlavorLimit(composition: BuildableComposition): number {
  return composition.sizeGroup.items.reduce(
    (widest, sizeItem) => Math.max(widest, resolveFlavorLimit(composition.flavorGroup, sizeItem) ?? 0),
    0
  );
}

// O preço da borda sai só do balde `size_prices.border` (o que a API cobra), pela escada
// linha do tamanho -> `price_override`; sem tamanho, nada. Item sem linha nesse balde fica fora do mapa.
export function resolveSizedIncrements(
  composition: BuildableComposition,
  sizeItem: OptionGroupItem | null
): SizedIncrements {
  const increments: SizedIncrements = {};

  composition.remainingGroups.forEach(group => {
    group.items.forEach(item => {
      if (!composition.borderItemIds.has(item.id)) {
        return;
      }

      if (!sizeItem) {
        increments[item.id] = null;
        return;
      }

      increments[item.id] =
        composition.borderPricesByPair.get(sizePriceKey(item.id, sizeItem.id)) ?? item.price_override;
    });
  });

  return increments;
}
