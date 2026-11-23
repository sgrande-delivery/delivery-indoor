/** O cardápio é a home do app. */
export const MENU_HREF = '/';

/** O único lugar que diz quais rotas abrem sem mesa, depois de "Ver o cardápio". */
export const BROWSABLE_WITHOUT_TABLE: readonly string[] = [MENU_HREF];

export function isBrowsableWithoutTable(pathname: string): boolean {
  return BROWSABLE_WITHOUT_TABLE.includes(pathname);
}
