import type { IconName } from '@/components/ui';
import { ProductSort } from '@/types/product-page';

export interface SearchSortOption {
  sort: ProductSort;
  label: string;
  icon: IconName;
}

// A ordem e os rótulos são os da RF-14.
export const searchSortOptions: readonly SearchSortOption[] = [
  { sort: 'best_selling', label: 'Mais vendidos', icon: 'local_fire_department' },
  { sort: 'rating', label: 'Melhor avaliados', icon: 'star' },
  { sort: 'discount_desc', label: 'Maior desconto', icon: 'sell' },
  { sort: 'price_asc', label: 'Menor preço', icon: 'arrow_downward' },
  { sort: 'price_desc', label: 'Maior preço', icon: 'arrow_upward' },
  { sort: 'newest', label: 'Novidades', icon: 'auto_awesome' },
];

export function findSearchSortOption(sort: ProductSort): SearchSortOption {
  return searchSortOptions.find(option => option.sort === sort) ?? searchSortOptions[0];
}
