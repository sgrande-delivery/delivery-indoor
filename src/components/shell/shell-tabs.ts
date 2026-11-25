import type { IconName } from '@/components/ui';
import { BOARD_ROUTE, CART_ROUTE, HOME_ROUTE, MENU_ROUTE, SEARCH_ROUTE } from '@/routes/app-routes';

export type ShellTabKey = 'menu' | 'search' | 'cart' | 'board';

export type ShellFormat = 'phone' | 'tablet';

export interface ShellTab {
  key: ShellTabKey;
  label: string;
  icon: IconName;
  href: string;
  /** Só vira `true` quando a frente dona entrega a tela; aba sem tela fica inerte, em vez de apontar para 404. */
  isAvailable: boolean;
}

export const shellTabs: readonly ShellTab[] = [
  { key: 'menu', label: 'Cardápio', icon: 'restaurant_menu', href: HOME_ROUTE, isAvailable: true },
  { key: 'search', label: 'Busca', icon: 'search', href: SEARCH_ROUTE, isAvailable: true },
  { key: 'cart', label: 'Sacola', icon: 'shopping_bag', href: CART_ROUTE, isAvailable: true },
  { key: 'board', label: 'Conta', icon: 'receipt_long', href: BOARD_ROUTE, isAvailable: true },
];

const TABLET_TAB_KEYS: readonly ShellTabKey[] = ['menu', 'board'];

export function shellTabsFor(format: ShellFormat): readonly ShellTab[] {
  return format === 'tablet' ? shellTabs.filter(tab => TABLET_TAB_KEYS.includes(tab.key)) : shellTabs;
}

export function isInTree(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function resolveActiveTab(pathname: string, format: ShellFormat): ShellTabKey | undefined {
  if (isInTree(pathname, BOARD_ROUTE)) {
    return 'board';
  }

  if (pathname === SEARCH_ROUTE) {
    return format === 'phone' ? 'search' : 'menu';
  }

  if (pathname === CART_ROUTE) {
    return format === 'phone' ? 'cart' : 'menu';
  }

  if (pathname === HOME_ROUTE || isInTree(pathname, MENU_ROUTE)) {
    return 'menu';
  }

  return undefined;
}
