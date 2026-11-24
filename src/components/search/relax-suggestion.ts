import { buildSearchHref, hasActiveSearch, SearchFilters } from '@/helpers/search-params';
import { RelaxableFilter, RelaxCandidate } from '@/types/search';

export interface RelaxSuggestion {
  /** O nome do filtro, em negrito: o `label` do servidor, sem lookup aqui. */
  subject: string;
  /** O ganho, com o `additional_count` do servidor: `4 produtos`, `1 produto`. */
  gain: string;
  /** O endereço da mesma busca sem este filtro — e só este. */
  href: string;
}

/**
 * O desempate, só quando o `additional_count` empata: a ordem do array não é critério, e o texto da faixa trocaria
 * entre renders com o mesmo dado. Categoria primeiro (o filtro mais largo, e tirá-lo preserva o termo), termo depois,
 * e ingrediente por último. É `Record` para o `tsc` cobrar a entrada de um filtro novo.
 */
const TIE_BREAK_ORDER: Record<RelaxableFilter, number> = {
  category_id: 0,
  include_ingredients: 1,
  q: 2,
  exclude_ingredients: 3,
};

const numberFormatter = new Intl.NumberFormat('pt-BR');

const subjectOf: Record<RelaxableFilter, (label: string) => string> = {
  q: label => `“${label}”`,
  category_id: label => label,
  include_ingredients: label => `com ${label}`,
  exclude_ingredients: label => `sem ${label}`,
};

function compareCandidates(left: RelaxCandidate, right: RelaxCandidate): number {
  if (left.additional_count !== right.additional_count) {
    return right.additional_count - left.additional_count;
  }

  if (left.filter !== right.filter) {
    return TIE_BREAK_ORDER[left.filter] - TIE_BREAK_ORDER[right.filter];
  }

  return left.label.localeCompare(right.label, 'pt-BR') || left.value.localeCompare(right.value);
}

function withoutCandidate(filters: SearchFilters, candidate: RelaxCandidate): SearchFilters {
  if (candidate.filter === 'q') {
    return { ...filters, term: null };
  }

  if (candidate.filter === 'category_id') {
    return { ...filters, categoryId: null };
  }

  if (candidate.filter === 'include_ingredients') {
    return { ...filters, includeIngredients: filters.includeIngredients.filter(id => id !== candidate.value) };
  }

  return { ...filters, excludeIngredients: filters.excludeIngredients.filter(id => id !== candidate.value) };
}

/**
 * O candidato que a faixa mostra, ou `null` — `relaxed: []` é o caso normal. Candidato que não muda o endereço, ou
 * que tira o último filtro, é descartado: a faixa prometeria um ganho que a ação não entregaria — sem filtro nenhum a
 * tela volta à entrada, e não à lista dos produtos prometidos.
 */
export function createRelaxSuggestion(relaxed: RelaxCandidate[], filters: SearchFilters): RelaxSuggestion | null {
  const currentHref = buildSearchHref(filters);

  for (const candidate of [...relaxed].sort(compareCandidates)) {
    const next = withoutCandidate(filters, candidate);
    const href = buildSearchHref(next);

    if (href !== currentHref && hasActiveSearch(next)) {
      return {
        subject: subjectOf[candidate.filter](candidate.label),
        gain: `${numberFormatter.format(candidate.additional_count)} ${candidate.additional_count === 1 ? 'produto' : 'produtos'}`,
        href,
      };
    }
  }

  return null;
}
