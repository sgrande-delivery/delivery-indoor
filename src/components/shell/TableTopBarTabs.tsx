'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tableTopBarMetrics as metrics } from './shell-metrics';
import type { ShellTab, ShellTabKey } from './shell-tabs';
import TableTopBarTab from './TableTopBarTab';

const NAV_LABEL = 'Navegação principal';

export interface TableTopBarTabsProps {
  tabs: readonly ShellTab[];
  activeTab: ShellTabKey | undefined;
}

const Nav = styled('nav')({
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
  gap: metrics.tabsGap,
  marginInlineStart: metrics.tabsMarginInlineStart,
});

const TableTopBarTabs: React.FC<TableTopBarTabsProps> = ({ tabs, activeTab }) => (
  <Nav aria-label={NAV_LABEL}>
    {tabs.map(tab => (
      <TableTopBarTab key={tab.key} tab={tab} isActive={tab.isAvailable && tab.key === activeTab} />
    ))}
  </Nav>
);

export default TableTopBarTabs;
