'use client';

import React from 'react';
import { ProductSectionSpacing } from '@/theme';
import { OptionGroup } from '@/types/product-detail';
import { SizedIncrements } from './buildable';
import {
  countGroupSelections,
  describeOptionGroup,
  hasVisibleLimit,
  isSingleChoice,
  optionGroupElementId,
} from './option-groups';
import OptionGroupBadge, { OptionGroupBadgeTone } from './OptionGroupBadge';
import OptionGroupItemList from './OptionGroupItemList';
import ProductSection from '../ProductSection';
import ProductSectionHeader from '../ProductSectionHeader';

export interface OptionGroupSectionProps {
  group: OptionGroup;
  selectedItemIds: number[];
  optionQuantities: Record<number, number>;
  sizedIncrements: SizedIncrements;
  spacing: ProductSectionSpacing;
  isPending: boolean;
  onToggle: (group: OptionGroup, itemId: number, isSelected: boolean) => void;
  onQuantityChange: (group: OptionGroup, itemId: number, quantity: number) => void;
}

function resolveBadgeTone(group: OptionGroup, isPending: boolean): OptionGroupBadgeTone {
  if (isPending) {
    return 'pending';
  }

  return group.is_required ? 'required' : 'counter';
}

const OptionGroupSection: React.FC<OptionGroupSectionProps> = ({
  group,
  selectedItemIds,
  optionQuantities,
  sizedIncrements,
  spacing,
  isPending,
  onToggle,
  onQuantityChange,
}) => {
  const titleId = `${optionGroupElementId(group.id)}-title`;
  const isSingle = isSingleChoice(group);
  const selectedCount = countGroupSelections(group, selectedItemIds, optionQuantities);
  const badgeTone = resolveBadgeTone(group, isPending);
  const counterLabel = `${selectedCount} de ${group.max_quantity} selecionados`;

  function handleToggle(itemId: number, isSelected: boolean) {
    onToggle(group, itemId, isSelected);
  }

  function handleQuantityChange(itemId: number, quantity: number) {
    onQuantityChange(group, itemId, quantity);
  }

  return (
    <ProductSection id={optionGroupElementId(group.id)} spacing={spacing} isPending={isPending}>
      <ProductSectionHeader
        titleId={titleId}
        title={group.name}
        action={
          <>
            <OptionGroupBadge tone={badgeTone}>{describeOptionGroup(group)}</OptionGroupBadge>
            {!isSingle && hasVisibleLimit(group) && (
              <OptionGroupBadge tone="counter" role="status" aria-label={counterLabel}>
                {`${selectedCount}/${group.max_quantity}`}
              </OptionGroupBadge>
            )}
          </>
        }
      />
      <OptionGroupItemList
        group={group}
        titleId={titleId}
        selectedItemIds={selectedItemIds}
        selectedCount={selectedCount}
        optionQuantities={optionQuantities}
        sizedIncrements={sizedIncrements}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
      />
    </ProductSection>
  );
};

export default OptionGroupSection;
