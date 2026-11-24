'use client';

import { useCallback, useMemo, useState } from 'react';
import { OptionGroup, ProductDetail } from '@/types/product-detail';
import { OptionSelection } from '@/types/product-selection';
import { resolveBuildableComposition, resolveFlavorLimit, resolveSizedIncrements, SizedIncrements } from './buildable';
import { resolveDefaultSelections } from './default-selections';
import {
  canClearSingleChoice,
  countGroupSelections,
  hasItemQuantity,
  isGroupPending,
  isSingleChoice,
  resolveItemQuantity,
} from './option-groups';

const INITIAL_QUANTITY = 1;

export interface ProductComposer {
  quantity: number;
  notes: string;
  groups: OptionGroup[];
  selectionsByGroup: Record<number, number[]>;
  optionQuantities: Record<number, number>;
  selectedItemIds: number[];
  optionSelections: OptionSelection[];
  sizedIncrements: SizedIncrements;
  removedIngredients: string[];
  pendingGroups: OptionGroup[];
  completeGroupIds: number[];
  announcement: string;
  setQuantity: (quantity: number) => void;
  setNotes: (notes: string) => void;
  toggleOption: (group: OptionGroup, itemId: number, isSelected: boolean) => void;
  setOptionQuantity: (group: OptionGroup, itemId: number, quantity: number) => void;
  toggleIngredient: (ingredientPublicId: string, isKept: boolean) => void;
}

function describeFlavorTrim(sizeName: string | null, limit: number, removedCount: number): string {
  const size = sizeName ?? '';
  const slots = limit === 1 ? '1 sabor' : `${limit} sabores`;
  const removed = removedCount === 1 ? '1 sabor foi desmarcado' : `${removedCount} sabores foram desmarcados`;

  return `${size} aceita ${slots}: ${removed}.`;
}

// Estado da montagem do item: seleção, quantidade, observação e ingredientes removidos. Nenhum
// estado de preço mora aqui — o total exibido é o `line_total` do `/price`; o `+ R$ X` da borda
// (`sizedIncrements`) é derivado da matriz do detalhe, sem conta. Todo id guardado veio do payload
// do detalhe.
//
// O padrão do detalhe é **derivado**, não copiado: o detalhe chega depois do mount, e copiar por
// efeito pintaria um frame vazio e entregaria ao preço uma seleção velha. Enquanto o cliente não
// tocou na seleção (`touchedSelections === null`), ela é o padrão do detalhe corrente; o primeiro
// toque grava a seleção inteira, e dali em diante o padrão não é mais lido.
//
// Produto montável (tamanho e sabor) abre com os grupos genéricos: a composição só alimenta o limite
// de sabores por tamanho, e o servidor valida a combinação no `/price`.
export function useProductComposer(detail: ProductDetail | undefined): ProductComposer {
  const [quantity, setQuantity] = useState(INITIAL_QUANTITY);
  const [notes, setNotes] = useState('');
  const [touchedSelections, setSelectionsByGroup] = useState<Record<number, number[]> | null>(null);
  const [optionQuantities, setOptionQuantities] = useState<Record<number, number>>({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const composition = useMemo(() => resolveBuildableComposition(detail), [detail]);
  const defaultSelections = useMemo(() => resolveDefaultSelections(detail, composition), [detail, composition]);
  const selectionsByGroup = touchedSelections ?? defaultSelections;

  const selectedSizeItem = useMemo(() => {
    if (!composition) {
      return null;
    }

    const selectedId = (selectionsByGroup[composition.sizeGroup.id] ?? [])[0];

    return composition.sizeGroup.items.find(item => item.id === selectedId) ?? null;
  }, [composition, selectionsByGroup]);

  const sizedIncrements = useMemo(
    () => (composition ? resolveSizedIncrements(composition, selectedSizeItem) : {}),
    [composition, selectedSizeItem]
  );

  const flavorLimit = useMemo(
    () => (composition ? resolveFlavorLimit(composition.flavorGroup, selectedSizeItem) : null),
    [composition, selectedSizeItem]
  );

  const resolveGroupLimit = useCallback(
    (group: OptionGroup): number => {
      if (composition !== null && group.id === composition.flavorGroup.id) {
        return flavorLimit ?? group.max_quantity;
      }

      return group.max_quantity;
    },
    [composition, flavorLimit]
  );

  const selectSize = useCallback(
    (group: OptionGroup, itemId: number) => {
      if (!composition) {
        return;
      }

      if ((selectionsByGroup[group.id] ?? [])[0] === itemId) {
        return;
      }

      const sizeItem = group.items.find(item => item.id === itemId) ?? null;
      const limit = resolveFlavorLimit(composition.flavorGroup, sizeItem);
      const flavors = selectionsByGroup[composition.flavorGroup.id] ?? [];
      const next = { ...selectionsByGroup, [group.id]: [itemId] };

      if (limit === null || flavors.length <= limit) {
        setSelectionsByGroup(next);
        return;
      }

      setAnnouncement(describeFlavorTrim(sizeItem?.name ?? null, limit, flavors.length - limit));
      setSelectionsByGroup({ ...next, [composition.flavorGroup.id]: flavors.slice(0, limit) });
    },
    [composition, selectionsByGroup]
  );

  const setOptionQuantity = useCallback(
    (group: OptionGroup, itemId: number, requested: number) => {
      if (!hasItemQuantity(group) || !group.items.some(item => item.id === itemId)) {
        return;
      }

      const selected = selectionsByGroup[group.id] ?? [];
      const current = selected.includes(itemId) ? resolveItemQuantity(optionQuantities, itemId) : 0;
      const room = group.max_quantity - (countGroupSelections(group, selected, optionQuantities) - current);
      const next = requested > current ? Math.max(current, Math.min(requested, room)) : requested;

      if (next === current) {
        return;
      }

      if (next <= 0) {
        const remaining = { ...optionQuantities };

        delete remaining[itemId];
        setOptionQuantities(remaining);
        setSelectionsByGroup({ ...selectionsByGroup, [group.id]: selected.filter(id => id !== itemId) });
        return;
      }

      setOptionQuantities({ ...optionQuantities, [itemId]: next });

      if (!selected.includes(itemId)) {
        setSelectionsByGroup({ ...selectionsByGroup, [group.id]: [...selected, itemId] });
        return;
      }

      if (touchedSelections === null) {
        setSelectionsByGroup(selectionsByGroup);
      }
    },
    [selectionsByGroup, optionQuantities, touchedSelections]
  );

  const toggleOption = useCallback(
    (group: OptionGroup, itemId: number, isSelected: boolean) => {
      if (composition && group.id === composition.sizeGroup.id) {
        selectSize(group, itemId);
        return;
      }

      const isFlavorGroup = composition !== null && group.id === composition.flavorGroup.id;

      if (!isFlavorGroup && hasItemQuantity(group)) {
        const isAlreadySelected = (selectionsByGroup[group.id] ?? []).includes(itemId);

        if (isSelected !== isAlreadySelected) {
          setOptionQuantity(group, itemId, isSelected ? 1 : 0);
        }

        return;
      }

      const limit = resolveGroupLimit(group);

      setSelectionsByGroup(touched => {
        const current = touched ?? defaultSelections;
        const selected = current[group.id] ?? [];

        // O atalho de escolha única vale só para o grupo que a tela desenha como `radiogroup`. Trocar chega
        // pelo `change` (`isSelected: true`); desmarcar chega da linha (clique ou `Espaço`) no radio já
        // marcado, e só esvazia o grupo que zero seleções não deixam pendente — no obrigatório,
        // devolve `touched`, porque um clique sem efeito não conta como toque. O grupo de sabor recebe o teto
        // efetivo do tamanho (`groups`): com limite 1 ele também é `radiogroup`, e trocar de sabor é trocar o radio.
        if (isSingleChoice(group)) {
          if (isSelected) {
            return { ...current, [group.id]: [itemId] };
          }

          return canClearSingleChoice(group)
            ? { ...current, [group.id]: selected.filter(selectedId => selectedId !== itemId) }
            : touched;
        }

        if (!isSelected) {
          return { ...current, [group.id]: selected.filter(selectedId => selectedId !== itemId) };
        }

        if (selected.includes(itemId) || selected.length >= limit) {
          return touched;
        }

        return { ...current, [group.id]: [...selected, itemId] };
      });
    },
    [composition, defaultSelections, resolveGroupLimit, selectSize, selectionsByGroup, setOptionQuantity]
  );

  const toggleIngredient = useCallback((ingredientPublicId: string, isKept: boolean) => {
    setRemovedIngredients(current => {
      if (isKept) {
        return current.filter(removedId => removedId !== ingredientPublicId);
      }

      return current.includes(ingredientPublicId) ? current : [...current, ingredientPublicId];
    });
  }, []);

  // O grupo de sabor aceita, por tamanho, menos do que o `max_quantity` do grupo: a tela recebe o
  // teto efetivo para o contador, o desabilitar e a escolha única falarem do mesmo limite que o clique.
  const groups = useMemo(() => {
    const flavorGroupId = composition?.flavorGroup.id;

    return (detail?.option_groups ?? []).map(group =>
      group.id === flavorGroupId && flavorLimit !== null ? { ...group, max_quantity: flavorLimit } : group
    );
  }, [detail, composition, flavorLimit]);

  const selectedItemIds = useMemo(
    () => groups.flatMap(group => selectionsByGroup[group.id] ?? []),
    [groups, selectionsByGroup]
  );

  const optionSelections = useMemo<OptionSelection[]>(
    () =>
      selectedItemIds.map(itemId => {
        const itemQuantity = optionQuantities[itemId] ?? INITIAL_QUANTITY;

        return itemQuantity > INITIAL_QUANTITY
          ? { option_group_item_id: itemId, quantity: itemQuantity }
          : { option_group_item_id: itemId };
      }),
    [selectedItemIds, optionQuantities]
  );

  const pendingGroups = useMemo(
    () =>
      groups.filter(group =>
        isGroupPending(group, countGroupSelections(group, selectionsByGroup[group.id] ?? [], optionQuantities))
      ),
    [groups, selectionsByGroup, optionQuantities]
  );

  const completeGroupIds = useMemo(
    () =>
      groups
        .filter(group => {
          return (
            countGroupSelections(group, selectionsByGroup[group.id] ?? [], optionQuantities) >= resolveGroupLimit(group)
          );
        })
        .map(group => group.id),
    [groups, resolveGroupLimit, selectionsByGroup, optionQuantities]
  );

  return {
    quantity,
    notes,
    groups,
    selectionsByGroup,
    optionQuantities,
    selectedItemIds,
    optionSelections,
    sizedIncrements,
    removedIngredients,
    pendingGroups,
    completeGroupIds,
    announcement,
    setQuantity,
    setNotes,
    toggleOption,
    setOptionQuantity,
    toggleIngredient,
  };
}
