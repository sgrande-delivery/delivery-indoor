// A api assume `delivery` quando o ambiente falta, e isso dá cardápio errado sem erro: todo serviço de catálogo passa por aqui.
export const CATALOG_ENVIRONMENT = 'board';

export function boardCatalogParams<T extends Record<string, unknown>>(
  params: T
): T & { environment: typeof CATALOG_ENVIRONMENT } {
  return { ...params, environment: CATALOG_ENVIRONMENT };
}

export function boardCatalogBody<T extends Record<string, unknown>>(
  body: T
): T & { environment: typeof CATALOG_ENVIRONMENT } {
  return { ...body, environment: CATALOG_ENVIRONMENT };
}
