'use client';

import React from 'react';
import { OptionGroup, OptionGroupItem as OptionGroupItemData } from '@/types/product-detail';
import { SizedIncrements } from './buildable';
import {
  hasItemQuantity,
  isSingleChoice,
  optionGroupElementId,
  resolveItemIncrement,
  resolveItemQuantity,
} from './option-groups';
import OptionGroupItemRow from './OptionGroupItemRow';
import OptionGroupQuantityRow from './OptionGroupQuantityRow';

export interface OptionGroupItemProps {
  group: OptionGroup;
  item: OptionGroupItemData;
  isSelected: boolean;
  /** Quantas seleções o grupo já tem, contando as unidades dos itens com quantidade. */
  selectedCount: number;
  optionQuantities: Record<number, number>;
  sizedIncrements: SizedIncrements;
  onToggle: (itemId: number, isSelected: boolean) => void;
  onQuantityChange: (itemId: number, quantity: number) => void;
}

/** Uma linha do grupo: com stepper nos grupos de quantidade, marcável (radio ou checkbox) nos demais. */
const OptionGroupItem: React.FC<OptionGroupItemProps> = ({
  group,
  item,
  isSelected,
  selectedCount,
  optionQuantities,
  sizedIncrements,
  onToggle,
  onQuantityChange,
}) => {
  const increment = resolveItemIncrement(sizedIncrements, item);

  if (hasItemQuantity(group)) {
    return (
      <OptionGroupQuantityRow
        item={item}
        increment={increment}
        quantity={isSelected ? resolveItemQuantity(optionQuantities, item.id) : 0}
        remainingQuantity={group.max_quantity - selectedCount}
        onQuantityChange={onQuantityChange}
      />
    );
  }

  const isSingle = isSingleChoice(group);

  return (
    <OptionGroupItemRow
      item={item}
      increment={increment}
      inputName={optionGroupElementId(group.id)}
      isSingleChoice={isSingle}
      isSelected={isSelected}
      isDisabled={!isSingle && !isSelected && selectedCount >= group.max_quantity}
      onToggle={onToggle}
    />
  );
};

export default OptionGroupItem;
