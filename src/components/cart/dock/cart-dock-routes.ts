import { isInTree } from '@/components/shell/shell-tabs';
import { HOME_ROUTE, MENU_ROUTE, SEARCH_ROUTE } from '@/routes/app-routes';

// Mesmas rotas do grupo `app/(menu)/`: rota nova lá entra aqui no mesmo commit, senão a sacola do tablet some dela.
export function isCartDockRoute(pathname: string): boolean {
  return pathname === HOME_ROUTE || pathname === SEARCH_ROUTE || isInTree(pathname, MENU_ROUTE);
}
