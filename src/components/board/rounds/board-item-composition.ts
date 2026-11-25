import type { BoardProductItem } from '@/types/board-bill';

export interface BoardItemOptionLine {
  /** O nome do grupo, ou `null` quando o pedido não o congelou: a linha sai sem rótulo. */
  label: string | null;
  /** As seleções daquele grupo, na ordem da resposta, já unidas por `, `. */
  value: string;
}

export interface BoardItemExtraLine {
  name: string;
  quantity: number;
}

export interface BoardItemCompositionLines {
  options: BoardItemOptionLine[];
  extras: BoardItemExtraLine[];
  removed: string[];
  observation: string | null;
}

const EXTRA_KIND = 'extra';
const VALUE_SEPARATOR = ', ';

interface OptionGroup {
  label: string | null;
  names: string[];
}

/**
 * Chave composta do grupo: o id quando existe, o nome quando não. Só o id jogaria todos os grupos apagados (`null`)
 * no mesmo balde; só o nome fundiria dois grupos homônimos. Sem nenhum dos dois a seleção é a sua própria linha.
 */
function groupKey(groupId: number | null | undefined, label: string | null): string | null {
  if (typeof groupId === 'number') {
    return `id:${groupId}`;
  }

  if (label) {
    return `name:${label}`;
  }

  return null;
}

/**
 * O que o item levou, a partir do que o pedido congelou. O adicional é reconhecido **só** por
 * `option_group_kind === 'extra'`: o servidor normaliza `quantity` para 1 no que não é `extra`, inclusive com `kind`
 * nulo, então `quantity > 1` não identifica adicional. Campo ausente e nulo valem o mesmo, e string vazia é
 * ausência (`observations: ''` não abre linha). O preço da opção não entra: vem em centavo e a conta não o mostra.
 */
export function buildBoardItemComposition(item: BoardProductItem): BoardItemCompositionLines {
  const extras: BoardItemExtraLine[] = [];
  const groups: OptionGroup[] = [];
  const groupsByKey = new Map<string, OptionGroup>();

  for (const selection of item.option_selections) {
    if (selection.option_group_kind === EXTRA_KIND) {
      extras.push({ name: selection.name, quantity: selection.quantity });
      continue;
    }

    const label = selection.option_group_name ? selection.option_group_name : null;
    const key = groupKey(selection.option_group_id, label);
    const existing = key === null ? undefined : groupsByKey.get(key);

    if (existing) {
      existing.names.push(selection.name);
      continue;
    }

    const group: OptionGroup = { label, names: [selection.name] };

    groups.push(group);

    if (key !== null) {
      groupsByKey.set(key, group);
    }
  }

  return {
    options: groups.map(group => ({ label: group.label, value: group.names.join(VALUE_SEPARATOR) })),
    extras,
    removed: item.removed_ingredients.map(ingredient => ingredient.name),
    observation: item.observations?.trim() ? item.observations.trim() : null,
  };
}

export function hasBoardItemComposition(composition: BoardItemCompositionLines): boolean {
  return (
    composition.options.length > 0 ||
    composition.extras.length > 0 ||
    composition.removed.length > 0 ||
    composition.observation !== null
  );
}
