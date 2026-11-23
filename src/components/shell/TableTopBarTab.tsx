'use client';

import React from 'react';
import Link from 'next/link';
import ButtonBase, { ExtendButtonBase } from '@mui/material/ButtonBase';
import { styled } from '@mui/material/styles';
import { Icon } from '@/components/ui';
import { controlSizes, focusRing, fontWeights, typographyTokens } from '@/theme';
import { tableTopBarMetrics as metrics } from './shell-metrics';
import type { ShellTab } from './shell-tabs';

export interface TableTopBarTabProps {
  tab: ShellTab;
  isActive: boolean;
}

interface TabRootProps {
  isActive: boolean;
}

interface TabRootTypeMap {
  props: TabRootProps;
  defaultComponent: 'button';
}

const TabRoot = styled(ButtonBase, {
  shouldForwardProp: prop => prop !== 'isActive',
})<TabRootProps>(({ theme, isActive }) => ({
  ...typographyTokens.subtitle1,
  flexShrink: 0,
  gap: metrics.tabGap,
  blockSize: controlSizes.md.height,
  boxSizing: 'border-box',
  paddingInline: metrics.tabPaddingInline,
  borderRadius: controlSizes.sm.radius,
  fontWeight: isActive ? fontWeights.extraBold : fontWeights.semiBold,
  whiteSpace: 'nowrap',
  backgroundColor: isActive ? theme.vars.palette.surface.field : 'transparent',
  color: isActive ? theme.vars.palette.surface.ink : theme.vars.palette.surface.muted,
  transition: theme.transitions.create(['background-color', 'color']),
  '&.Mui-focusVisible': {
    outline: `${focusRing.width}px solid ${theme.vars.palette.surface.ink}`,
    outlineOffset: focusRing.offset,
  },
})) as ExtendButtonBase<TabRootTypeMap>;

const TableTopBarTab: React.FC<TableTopBarTabProps> = ({ tab, isActive }) => {
  const content = (
    <>
      <Icon name={tab.icon} size={metrics.tabIconSize} fill={isActive} />
      {tab.label}
    </>
  );

  if (!tab.isAvailable) {
    return <TabRoot isActive={false}>{content}</TabRoot>;
  }

  return (
    <TabRoot href={tab.href} LinkComponent={Link} isActive={isActive} aria-current={isActive ? 'page' : undefined}>
      {content}
    </TabRoot>
  );
};

export default TableTopBarTab;
