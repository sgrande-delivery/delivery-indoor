'use client';

import React from 'react';
import ButtonBase, { ExtendButtonBase, ExtendButtonBaseTypeMap } from '@mui/material/ButtonBase';
import { OverrideProps } from '@mui/material/OverridableComponent';
import { styled } from '@mui/material/styles';
import {
  chipBaseStyle,
  chipDisabledStyle,
  chipFocusStyle,
  ChipIconTone,
  ChipPadding,
  ChipTone,
  chipToneStyle,
  resolveChipTone,
} from './chip-skin';
import ChipContent from './ChipContent';
import { IconName } from './icon-names';

interface ChipBaseProps {
  label: string;
  icon?: IconName;
  /** Cor do glifo, independente da cor do rótulo. `inherit` por padrão. */
  iconTone?: ChipIconTone;
  /** A pele. Ausente, quem escolhe é o estado: `solid` quando selecionada, `neutral` quando não. */
  tone?: ChipTone;
  padding?: ChipPadding;
  /** Sufixo de contagem ao lado do nome — a faceta de categoria do sheet de filtros. */
  count?: number;
  /** Pastilha de contador à direita — os filtros aplicados na chip `Filtros`. */
  badge?: number;
  strikethrough?: boolean;
  children?: never;
}

/**
 * `selected` e `current` anunciam coisas diferentes, porque o design usa a chip para dois papéis:
 *
 * - **alternador** (filtro que liga e desliga) → `selected`, que emite `aria-pressed`
 * - **navegação** (chip que leva a outra tela, ou que acompanha a seção visível) → `current`, que
 *   emite `aria-current` e **nunca** `aria-pressed`
 *
 * Até a task 43 o `aria-pressed` saía incondicionalmente, o que é ARIA inválida em elemento de
 * navegação — nem `component="a"` escapava. Chip que navega e não é a atual não passa nenhum dos
 * dois: ela não tem estado a anunciar.
 *
 * Os dois são **excludentes por tipo**: `selected` e `current` juntos emitiriam `aria-pressed` e
 * `aria-current` no mesmo elemento, que é o estado inválido que este primitivo existe para não ter.
 */
export type ChipStateProps = { selected?: boolean; current?: undefined } | { selected?: undefined; current?: boolean };

export type ChipOwnProps = ChipBaseProps & ChipStateProps;

export interface ChipTypeMap<RootComponent extends React.ElementType = 'button'> {
  props: ChipOwnProps;
  defaultComponent: RootComponent;
}

export type ChipProps<RootComponent extends React.ElementType = 'button'> = OverrideProps<
  ExtendButtonBaseTypeMap<ChipTypeMap<RootComponent>>,
  RootComponent
>;

interface RootProps {
  chipTone: ChipTone;
  chipPadding: ChipPadding;
}

const Root = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'chipTone' && prop !== 'chipPadding',
})<RootProps>(({ theme, chipTone, chipPadding }) => ({
  ...chipBaseStyle(theme, chipPadding),
  ...chipToneStyle(theme, chipTone),
  '&.Mui-focusVisible': chipFocusStyle(theme),
  '&.Mui-disabled': chipDisabledStyle(theme),
}));

/**
 * A pele **não** é função do ícone. Quem passa `tone` escolhe a pele; quem não passa continua vendo
 * o que o estado escolhe — `solid` selecionada, `neutral` fora dela —, que é o que mantém as chips
 * de categoria já shipadas idênticas.
 */
const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(props, ref) {
  const {
    label,
    icon,
    iconTone,
    tone,
    padding = 'lg',
    count,
    badge,
    strikethrough,
    selected,
    current,
    ...rest
  } = props;

  const resolvedTone = resolveChipTone(tone, selected === true || current === true);

  return (
    <Root
      ref={ref}
      {...rest}
      chipTone={resolvedTone}
      chipPadding={padding}
      aria-pressed={selected}
      aria-current={current === true ? 'true' : undefined}
    >
      <ChipContent
        label={label}
        icon={icon}
        iconTone={iconTone}
        count={count}
        badge={badge}
        strikethrough={strikethrough}
        isFilled={resolvedTone === 'solid' || resolvedTone === 'brand'}
      />
    </Root>
  );
}) as ExtendButtonBase<ChipTypeMap>;

export default Chip;
