import type { ReactElement } from 'react';
import SearchResultsScreen from '@/components/search/SearchResultsScreen';
import SearchScreen from '@/components/search/SearchScreen';
import { hasActiveSearch, parseSearchFilters } from '@/helpers/search-params';

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps): Promise<ReactElement> {
  const filters = parseSearchFilters(await searchParams);

  return hasActiveSearch(filters) ? <SearchResultsScreen filters={filters} /> : <SearchScreen />;
}
