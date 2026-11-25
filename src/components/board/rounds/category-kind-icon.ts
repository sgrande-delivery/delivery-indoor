import type { IconName } from '@/components/ui/icon-names';

const CATEGORY_KIND_ICON: Record<string, IconName> = {
  bebida: 'local_drink',
};

const FALLBACK_ICON: IconName = 'restaurant_menu';

/** Mapa explícito, sem nome de glifo novo: tipo desconhecido, ausente ou sem glifo próprio cai em `restaurant_menu`. */
export function resolveCategoryKindIcon(kind: string | null): IconName {
  if (kind !== null && Object.prototype.hasOwnProperty.call(CATEGORY_KIND_ICON, kind)) {
    return CATEGORY_KIND_ICON[kind];
  }

  return FALLBACK_ICON;
}
