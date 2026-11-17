'use client';

import React from 'react';
import ButtonBase, { ExtendButtonBase, ExtendButtonBaseTypeMap } from '@mui/material/ButtonBase';
import { OverrideProps } from '@mui/material/OverridableComponent';
import { CSSObject, styled } from '@mui/material/styles';
import { focusRing, fontFamilies, HOVER_MEDIA_QUERY, menuListItemMetrics, pxToRem } from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

export interface MenuListItemOwnProps {
  icon: IconName;
  label: string;
  /**
   * A forma **agrupada**: linha dentro de um cartão, sem raio, sombra nem fundo próprios — quem os
   * fornece é o grupo. Ausente, vale a forma solta do specimen do design system, que é card.
   */
  grouped?: boolean;
  /** Slot antes do chevron — a contagem de `Endereços` e o badge de contagem da tela 7. */
  trailing?: React.ReactNode;
  children?: never;
}

export interface MenuListItemTypeMap<RootComponent extends React.ElementType = 'button'> {
  props: MenuListItemOwnProps;
  defaultComponent: RootComponent;
}

export type MenuListItemProps<RootComponent extends React.ElementType = 'button'> = OverrideProps<
  ExtendButtonBaseTypeMap<MenuListItemTypeMap<RootComponent>>,
  RootComponent
>;

interface RootProps {
  isGrouped: boolean;
}

function shapeStyle(isGrouped: boolean): CSSObject {
  if (isGrouped) {
    return {
      paddingBlock: menuListItemMetrics.grouped.paddingBlock,
      paddingInline: menuListItemMetrics.grouped.paddingInline,
    };
  }

  return {
    paddingBlock: menuListItemMetrics.paddingBlock,
    paddingInline: menuListItemMetrics.paddingInline,
    borderRadius: menuListItemMetrics.radius,
    boxShadow: menuListItemMetrics.shadow,
  };
}

const Root = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isGrouped',
})<RootProps>(({ theme, isGrouped }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  gap: menuListItemMetrics.gap,
  backgroundColor: isGrouped ? 'transparent' : theme.vars.palette.surface.card,
  color: theme.vars.palette.surface.ink,
  textAlign: 'left',
  transition: theme.transitions.create(['background-color']),
  ...shapeStyle(isGrouped),
  [HOVER_MEDIA_QUERY]: {
    '&:hover': {
      backgroundColor: theme.vars.palette.surface.field,
    },
  },
  // A forma agrupada mora num cartão com `overflow: hidden`, e a linha ocupa a largura toda dele: o
  // anel de fora seria recortado nos três lados e sobraria o traço de baixo. Por dentro, ele cabe.
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: isGrouped ? focusRing.insetOffset : focusRing.offset,
  },
  '&.Mui-disabled': {
    color: theme.vars.palette.surface.muted,
  },
}));

const Label = styled('span')({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(menuListItemMetrics.labelFontSize),
  fontWeight: menuListItemMetrics.labelWeight,
  lineHeight: menuListItemMetrics.labelLineHeight,
});

const Chevron = styled(Icon)(({ theme }) => ({
  color: theme.vars.palette.surface.muted,
}));

/**
 * Duas formas, um componente. A solta é o card do specimen do `§07`; a agrupada é a linha da tela 7,
 * onde o cartão é do grupo e o item só desenha o conteúdo. Um segundo componente para a segunda forma
 * seria o fork do `Chip` de novo — duas cópias que compilam, e a correção seguinte pega só uma.
 *
 * **O chevron é sempre desenhado.** Ele existia atrás de um `showChevron` que nasceu sem consumidor
 * de tela — o único uso era o próprio specimen do sandbox — e a task 07 desta frente, a última que
 * poderia precisar dele, monta cartões próprios em vez de linhas de menu. Uma prop que só o board do
 * design system exercita descreve uma variante que o desenho não tem.
 */
const MenuListItem = React.forwardRef<HTMLButtonElement, MenuListItemProps>(function MenuListItem(props, ref) {
  const { icon, label, grouped = false, trailing, ...rest } = props;
  const iconSize = grouped ? menuListItemMetrics.grouped.iconSize : menuListItemMetrics.iconSize;

  return (
    <Root ref={ref} {...rest} isGrouped={grouped}>
      <Icon name={icon} size={iconSize} />
      <Label>{label}</Label>
      {trailing}
      <Chevron name="chevron_right" size={menuListItemMetrics.chevronSize} />
    </Root>
  );
}) as ExtendButtonBase<MenuListItemTypeMap>;

export default MenuListItem;
