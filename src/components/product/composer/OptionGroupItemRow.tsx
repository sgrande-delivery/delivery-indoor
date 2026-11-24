'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { Checkbox, Radio } from '@/components/ui';
import { optionGroupMetrics } from '@/theme';
import { OptionGroupItem } from '@/types/product-detail';
import OptionGroupItemText from './OptionGroupItemText';
import OptionGroupRowFrame from './OptionGroupRowFrame';

export interface OptionGroupItemRowProps {
  item: OptionGroupItem;
  increment: number | null;
  inputName: string;
  isSingleChoice: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (itemId: number, isSelected: boolean) => void;
}

interface LabelProps {
  isDisabled: boolean;
}

const Label = styled('label', {
  shouldForwardProp: prop => prop !== 'isDisabled',
})<LabelProps>(({ isDisabled }) => ({
  flex: 1,
  minWidth: 0,
  cursor: isDisabled ? 'default' : 'pointer',
}));

const OptionGroupItemRow: React.FC<OptionGroupItemRowProps> = ({
  item,
  increment,
  inputName,
  isSingleChoice,
  isSelected,
  isDisabled,
  onToggle,
}) => {
  const inputId = `option-item-${item.id}`;
  const Control = isSingleChoice ? Radio : Checkbox;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onToggle(item.id, event.target.checked);
  }

  // Radio marcado não emite `change` ao reclicar. O `click` chega pelo mouse no controle e pelo `<label>`.
  // O `Espaço` vem pelo `keydown`, porque o Chromium não gera `click` em radio já marcado. Se o grupo pode
  // esvaziar, quem decide é o composer.
  function handleClick() {
    if (isSingleChoice && isSelected) {
      onToggle(item.id, false);
    }
  }

  // `preventDefault` no `keydown` impede o radio de ficar "ativo", senão o `keyup` simularia um clique que
  // remarca o item. A repetição chega com `isSelected` já falso (o primeiro `keydown` desmarcou e o React
  // redesenhou), então o guarda de `repeat` precisa vir antes do de `isSelected`.
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isSingleChoice || event.key !== ' ') {
      return;
    }

    if (event.repeat) {
      event.preventDefault();
      return;
    }

    if (!isSelected) {
      return;
    }

    event.preventDefault();
    onToggle(item.id, false);
  }

  return (
    <OptionGroupRowFrame isSingleChoice={isSingleChoice}>
      <Label htmlFor={inputId} isDisabled={isDisabled}>
        <OptionGroupItemText item={item} increment={increment} isSelected={isSelected} isDisabled={isDisabled} />
      </Label>
      <Control
        id={inputId}
        name={inputName}
        size={optionGroupMetrics.controlSize}
        checked={isSelected}
        disabled={isDisabled}
        onChange={handleChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
    </OptionGroupRowFrame>
  );
};

export default OptionGroupItemRow;
