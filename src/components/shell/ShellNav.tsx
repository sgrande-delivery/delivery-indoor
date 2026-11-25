'use client';

import React from 'react';
import Link from 'next/link';
import { useCartItemCount } from '@/components/cart/use-cart-item-count';
import { BottomNav, BottomNavItem } from '@/components/ui';
import ShellNavCartIcon from './ShellNavCartIcon';
import { ShellTab, ShellTabKey, shellTabsFor } from './shell-tabs';

export interface ShellNavProps {
  activeTab: ShellTabKey | undefined;
}

const phoneTabs = shellTabsFor('phone');

function formatItemCount(count: number): string {
  return count === 1 ? '1 item' : `${count} itens`;
}

// Sem contagem conhecida, ou com a sacola vazia, a aba é só o ícone.
function buildItem(
  tab: ShellTab,
  activeTab: ShellTabKey | undefined,
  cartItemCount: number | undefined
): BottomNavItem {
  const item: BottomNavItem = { icon: tab.icon, label: tab.label, href: tab.isAvailable ? tab.href : undefined };

  if (tab.key !== 'cart' || cartItemCount === undefined || cartItemCount <= 0) {
    return item;
  }

  return {
    ...item,
    visual: <ShellNavCartIcon icon={tab.icon} isActive={activeTab === tab.key} count={cartItemCount} />,
    accessibleLabel: `${tab.label}, ${formatItemCount(cartItemCount)}`,
  };
}

const ShellNav: React.FC<ShellNavProps> = ({ activeTab }) => {
  const cartItemCount = useCartItemCount();
  const activeHref = phoneTabs.find(tab => tab.key === activeTab && tab.isAvailable)?.href;
  const items = phoneTabs.map(tab => buildItem(tab, activeTab, cartItemCount));

  return <BottomNav items={items} activeHref={activeHref} linkComponent={Link} />;
};

export default ShellNav;
