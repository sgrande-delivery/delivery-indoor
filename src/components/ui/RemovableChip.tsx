'use client';

import React from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { chipMetrics } from '@/theme';
import {
  chipBaseStyle,
  chipFocusStyle,
  ChipIconTone,
  ChipPadding,
  ChipTone,
  chipToneStyle,
  resolveChipTone,
} from './chip-skin';
import ChipContent from './ChipContent';
import Icon from './Icon';
import { IconName } from './icon-names';

const REMOVE_ICON: IconName = 'close';

export interface RemovableChipProps {
  label: string;
  onRemove: React.MouseEventHandler<HTMLButtonElement>;
  /** Ausente, o corpo não é alvo: a chip vira rótulo com uma ação, e não duas. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  removeLabel?: string;
  icon?: IconName;
  iconTone?: ChipIconTone;
  tone?: ChipTone;
  padding?: ChipPadding;
  count?: number;
  strikethrough?: boolean;
  className?: string;
}

interface RootProps {
  chipTone: ChipTone;
  chipPadding: ChipPadding;
}

const Root = styled('span', {
  shouldForwardProp: prop => prop !== 'chipTone' && prop !== 'chipPadding',
})<RootProps>(({ theme, chipTone, chipPadding }) => ({
  ...chipBaseStyle(theme, chipPadding),
  ...chipToneStyle(theme, chipTone),
  display: 'inline-flex',
  alignItems: 'center',
}));

const Body = styled(ButtonBase)(({ theme }) => ({
  gap: chipMetrics.iconGap,
  borderRadius: chipMetrics.radius,
  fontFamily: 'inherit',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  lineHeight: 'inherit',
  color: 'inherit',
  '&.Mui-focusVisible': chipFocusStyle(theme),
}));

const StaticBody = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: chipMetrics.iconGap,
});

const Remove = styled(ButtonBase)(({ theme }) => ({
  borderRadius: chipMetrics.radius,
  color: 'inherit',
  '&.Mui-focusVisible': chipFocusStyle(theme),
}));

/**
 * A chip removível da trilha de filtros ativos. Ela é **dois alvos de toque, não um** — o corpo
 * aplica ou reabre o filtro e o `close` o remove —, e por isso não pode ser o `Chip`: aninhar
 * `<button>` em `<button>` é HTML inválido. O contêiner aqui é um `span` que carrega a pele, e os
 * controles ficam dentro dele.
 *
 * A pele, o padding e os slots saem do mesmo lugar que o `Chip` usa, então isto **não é fork**: o
 * que difere é o molde, que é o de contêiner e não o de `ButtonBase`.
 *
 * Com os dois alvos, o contêiner é um `role="group"` nomeado pelo rótulo — sem isso o leitor de tela
 * anuncia dois controles sem relação, "Pizzas, botão" e "Remover Pizzas, botão", e nada diz que o
 * segundo age sobre o primeiro. O `role` **é gateado pelo corpo clicável**: sem ele há um controle
 * só, e um grupo de um elemento é ruído — anuncia entrada e saída de agrupamento para nada.
 */
const RemovableChip = React.forwardRef<HTMLSpanElement, RemovableChipProps>(function RemovableChip(props, ref) {
  const {
    label,
    onRemove,
    onClick,
    removeLabel,
    icon,
    iconTone,
    tone,
    padding = 'sm',
    count,
    strikethrough,
    className,
  } = props;

  const resolvedTone = resolveChipTone(tone, false);
  const hasBody = onClick !== undefined;

  const content = (
    <ChipContent
      label={label}
      icon={icon}
      iconTone={iconTone}
      count={count}
      strikethrough={strikethrough}
      isFilled={resolvedTone === 'solid' || resolvedTone === 'brand'}
    />
  );

  return (
    <Root
      ref={ref}
      className={className}
      chipTone={resolvedTone}
      chipPadding={padding}
      role={hasBody ? 'group' : undefined}
      aria-label={hasBody ? label : undefined}
    >
      {hasBody ? <Body onClick={onClick}>{content}</Body> : <StaticBody>{content}</StaticBody>}
      <Remove aria-label={removeLabel ?? `Remover ${label}`} onClick={onRemove}>
        <Icon name={REMOVE_ICON} size={chipMetrics.removeIconSize} />
      </Remove>
    </Root>
  );
});

export default RemovableChip;
