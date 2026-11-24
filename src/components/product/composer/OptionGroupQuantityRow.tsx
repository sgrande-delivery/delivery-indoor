'use client';

import React, { useEffect, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { QuantityStepper } from '@/components/ui';
import { OptionGroupItem } from '@/types/product-detail';
import OptionGroupAddButton from './OptionGroupAddButton';
import OptionGroupItemText from './OptionGroupItemText';
import OptionGroupRowFrame from './OptionGroupRowFrame';

const UNNAMED_ITEM = 'adicional';
const EMPTY_QUANTITY = 0;
const FIRST_UNIT = 1;

export interface OptionGroupQuantityRowProps {
  item: OptionGroupItem;
  increment: number | null;
  quantity: number;
  remainingQuantity: number;
  onQuantityChange: (itemId: number, quantity: number) => void;
}

const Text = styled('div')({
  flex: 1,
  minWidth: 0,
});

const Stepper = styled(QuantityStepper)({
  flexShrink: 0,
});

const OptionGroupQuantityRow: React.FC<OptionGroupQuantityRowProps> = ({
  item,
  increment,
  quantity,
  remainingQuantity,
  onQuantityChange,
}) => {
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const focusedChangeFromRef = useRef<number | null>(null);

  const name = item.name ?? UNNAMED_ITEM;
  const hasQuantity = quantity > EMPTY_QUANTITY;
  const hasReachedLimit = remainingQuantity <= EMPTY_QUANTITY;
  const maxQuantity = quantity + Math.max(remainingQuantity, EMPTY_QUANTITY);

  useEffect(() => {
    const changedFrom = focusedChangeFromRef.current;

    focusedChangeFromRef.current = null;

    if (changedFrom === null || changedFrom === quantity) {
      return;
    }

    if (!hasQuantity) {
      addButtonRef.current?.focus();
      return;
    }

    const enabledButtons = stepperRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');

    enabledButtons?.[enabledButtons.length - 1]?.focus();
  });

  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    if (document.activeElement === event.currentTarget) {
      focusedChangeFromRef.current = quantity;
    }

    onQuantityChange(item.id, FIRST_UNIT);
  }

  function handleStepperChange(nextQuantity: number) {
    const hasFocusInside = stepperRef.current?.contains(document.activeElement) ?? false;
    const losesControl = nextQuantity <= EMPTY_QUANTITY || nextQuantity >= maxQuantity;

    if (hasFocusInside && losesControl) {
      focusedChangeFromRef.current = quantity;
    }

    onQuantityChange(item.id, nextQuantity);
  }

  return (
    <OptionGroupRowFrame isSingleChoice={false}>
      <Text>
        <OptionGroupItemText
          item={item}
          increment={increment}
          isSelected={hasQuantity}
          isDisabled={!hasQuantity && hasReachedLimit}
        />
      </Text>
      {hasQuantity ? (
        <Stepper
          ref={stepperRef}
          size="md"
          min={EMPTY_QUANTITY}
          max={maxQuantity}
          value={quantity}
          aria-label={name}
          decreaseLabel={`Remover um ${name}`}
          increaseLabel={`Adicionar mais um ${name}`}
          onChange={handleStepperChange}
        />
      ) : (
        <OptionGroupAddButton
          ref={addButtonRef}
          label={`Adicionar ${name}`}
          isDisabled={hasReachedLimit}
          onClick={handleAdd}
        />
      )}
    </OptionGroupRowFrame>
  );
};

export default OptionGroupQuantityRow;
