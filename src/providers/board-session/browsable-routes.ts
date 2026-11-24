import { HOME_ROUTE, MENU_ROUTE } from '@/routes/app-routes';

/** O cardápio é a home do app. */
export const MENU_HREF = HOME_ROUTE;

/** O único lugar que diz quais rotas abrem sem mesa, depois de "Ver o cardápio". */
export const BROWSABLE_WITHOUT_TABLE: readonly string[] = [MENU_HREF, MENU_ROUTE];

export function isBrowsableWithoutTable(pathname: string): boolean {
  return BROWSABLE_WITHOUT_TABLE.includes(pathname);
}
