'use client';

import React from 'react';
import Link from 'next/link';
import { BottomNav, BottomNavItem } from '@/components/ui';
import { ShellTabKey, shellTabsFor } from './shell-tabs';

export interface ShellNavProps {
  activeTab: ShellTabKey | undefined;
}

const phoneTabs = shellTabsFor('phone');

const items: BottomNavItem[] = phoneTabs.map(tab => ({
  icon: tab.icon,
  label: tab.label,
  href: tab.isAvailable ? tab.href : undefined,
}));

const ShellNav: React.FC<ShellNavProps> = ({ activeTab }) => {
  const activeHref = phoneTabs.find(tab => tab.key === activeTab && tab.isAvailable)?.href;

  return <BottomNav items={items} activeHref={activeHref} linkComponent={Link} />;
};

export default ShellNav;
