'use client';

import React from 'react';
import { ProductSectionSpacing } from '@/theme';
import { OptionGroup } from '@/types/product-detail';
import { SizedIncrements } from './buildable';
import OptionGroupSection from './OptionGroupSection';

export interface OptionGroupListProps {
  groups: OptionGroup[];
  selectionsByGroup: Record<number, number[]>;
  optionQuantities: Record<number, number>;
  sizedIncrements: SizedIncrements;
  pendingGroupIds: number[];
  firstSpacing: ProductSectionSpacing;
  onToggle: (group: OptionGroup, itemId: number, isSelected: boolean) => void;
  onQuantityChange: (group: OptionGroup, itemId: number, quantity: number) => void;
}

const OptionGroupList: React.FC<OptionGroupListProps> = ({
  groups,
  selectionsByGroup,
  optionQuantities,
  sizedIncrements,
  pendingGroupIds,
  firstSpacing,
  onToggle,
  onQuantityChange,
}) => {
  return (
    <>
      {groups.map((group, index) => (
        <OptionGroupSection
          key={group.id}
          group={group}
          selectedItemIds={selectionsByGroup[group.id] ?? []}
          optionQuantities={optionQuantities}
          sizedIncrements={sizedIncrements}
          spacing={index === 0 ? firstSpacing : 'following'}
          isPending={pendingGroupIds.includes(group.id)}
          onToggle={onToggle}
          onQuantityChange={onQuantityChange}
        />
      ))}
    </>
  );
};

export default OptionGroupList;
