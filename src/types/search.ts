import { ProductSummary } from './product';
import { ProductPageMeta, SearchFacetCategory } from './product-page';

/**
 * Os filtros que o servidor sabe propor relaxar. A união tem os quatro valores da api — o tipo diz o que o servidor
 * manda —, mas esta tela só pede `q` e `category_id`; os de ingrediente entram com a #67.
 */
export const relaxableFilters = ['q', 'category_id', 'include_ingredients', 'exclude_ingredients'] as const;

export type RelaxableFilter = (typeof relaxableFilters)[number];

/** `label` chega resolvido (`"smash"`, `"Burgers"`) e `additional_count` já calculado: nenhum dos dois é refeito aqui. */
export interface RelaxCandidate {
  filter: RelaxableFilter;
  value: string;
  label: string;
  additional_count: number;
}

/** Item da busca: o `ProductSummary` já carrega o `matched_option` opcional. */
export interface SearchResultsPage {
  data: ProductSummary[];
  meta: ProductPageMeta;
  relaxed: RelaxCandidate[];
  categoryFacets: SearchFacetCategory[];
}
