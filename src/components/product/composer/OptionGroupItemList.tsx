'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { OptionGroup } from '@/types/product-detail';
import { SizedIncrements } from './buildable';
import { isSingleChoice } from './option-groups';
import OptionGroupItem from './OptionGroupItem';

export interface OptionGroupItemListProps {
  group: OptionGroup;
  titleId: string;
  selectedItemIds: number[];
  selectedCount: number;
  optionQuantities: Record<number, number>;
  sizedIncrements: SizedIncrements;
  onToggle: (itemId: number, isSelected: boolean) => void;
  onQuantityChange: (itemId: number, quantity: number) => void;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

const OptionGroupItemList: React.FC<OptionGroupItemListProps> = ({
  group,
  titleId,
  selectedItemIds,
  selectedCount,
  optionQuantities,
  sizedIncrements,
  onToggle,
  onQuantityChange,
}) => {
  const isSingle = isSingleChoice(group);

  return (
    // `aria-required` só é suportado em `radiogroup`; em `role="group"` é ARIA inválida.
    <Root
      role={isSingle ? 'radiogroup' : 'group'}
      aria-labelledby={titleId}
      aria-required={isSingle ? group.is_required : undefined}
    >
      {group.items.map(item => (
        <OptionGroupItem
          key={item.id}
          group={group}
          item={item}
          isSelected={selectedItemIds.includes(item.id)}
          selectedCount={selectedCount}
          optionQuantities={optionQuantities}
          sizedIncrements={sizedIncrements}
          onToggle={onToggle}
          onQuantityChange={onQuantityChange}
        />
      ))}
    </Root>
  );
};

export default OptionGroupItemList;
