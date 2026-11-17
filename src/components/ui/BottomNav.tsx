'use client';

import React from 'react';
import ButtonBase, { ExtendButtonBase } from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { bottomNavMetrics, focusRing, fontFamilies, pxToRem } from '@/theme';
import Icon from './Icon';
import { IconName } from './icon-names';

const NAV_LABEL = 'Navegação principal';

// href é opcional para a aba cujo destino ainda não existe: ela renderiza como botão inerte, em vez
// de apontar para uma rota que responderia 404.
export interface BottomNavItem {
  icon: IconName;
  label: string;
  href?: string;
  visual?: React.ReactNode;
  accessibleLabel?: string;
}

export interface BottomNavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  items: BottomNavItem[];
  activeHref?: string;
  linkComponent?: React.ElementType;
}

interface ItemRootProps {
  isActive: boolean;
}

interface ItemRootTypeMap {
  props: ItemRootProps;
  defaultComponent: 'button';
}

interface ActiveMarkProps {
  isActive: boolean;
}

const Root = styled('nav')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-around',
  paddingBlockStart: bottomNavMetrics.paddingBlockStart,
  paddingInline: bottomNavMetrics.paddingInline,
  paddingBlockEnd: `max(${bottomNavMetrics.paddingBlockEnd}px, env(safe-area-inset-bottom))`,
  backgroundColor: theme.vars.palette.chrome.base,
}));

const ItemRoot = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isActive',
})<ItemRootProps>(({ theme, isActive }) => ({
  flex: 1,
  minInlineSize: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: bottomNavMetrics.itemGap,
  paddingBlockStart: bottomNavMetrics.itemPaddingBlockStart,
  paddingBlockEnd: bottomNavMetrics.itemPaddingBlockEnd,
  borderRadius: bottomNavMetrics.itemRadius,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(bottomNavMetrics.labelFontSize),
  lineHeight: bottomNavMetrics.labelLineHeight,
  fontWeight: isActive ? bottomNavMetrics.activeLabelWeight : bottomNavMetrics.inactiveLabelWeight,
  whiteSpace: 'nowrap',
  color: isActive ? theme.vars.palette.chrome.accent : theme.vars.palette.chrome.idle,
  transition: theme.transitions.create(['color']),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${focusRing.colorOnInverse}`,
    outlineOffset: focusRing.offset,
  },
})) as ExtendButtonBase<ItemRootTypeMap>;

const IconBox = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: bottomNavMetrics.iconSize,
  blockSize: bottomNavMetrics.iconSize,
});

const ActiveMark = styled('span', {
  shouldForwardProp: prop => prop !== 'isActive',
})<ActiveMarkProps>(({ isActive }) => ({
  inlineSize: bottomNavMetrics.activeMark.inlineSize,
  blockSize: bottomNavMetrics.activeMark.blockSize,
  flexShrink: 0,
  borderRadius: bottomNavMetrics.activeMark.radius,
  backgroundColor: isActive ? 'currentColor' : 'transparent',
}));

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(function BottomNav(props, ref) {
  const { items, activeHref, linkComponent = 'a', 'aria-label': ariaLabel = NAV_LABEL, ...rest } = props;

  return (
    <Root ref={ref} aria-label={ariaLabel} {...rest}>
      {items.map(item => {
        const isActive = item.href !== undefined && item.href === activeHref;
        const content = (
          <>
            <IconBox>
              {item.visual ?? <Icon name={item.icon} size={bottomNavMetrics.iconSize} fill={isActive} />}
            </IconBox>
            {item.label}
            <ActiveMark aria-hidden isActive={isActive} />
          </>
        );

        if (item.href === undefined) {
          return (
            <ItemRoot key={item.label} isActive={isActive} aria-label={item.accessibleLabel}>
              {content}
            </ItemRoot>
          );
        }

        return (
          <ItemRoot
            key={item.href}
            href={item.href}
            LinkComponent={linkComponent}
            isActive={isActive}
            aria-label={item.accessibleLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            {content}
          </ItemRoot>
        );
      })}
    </Root>
  );
});

export default BottomNav;
