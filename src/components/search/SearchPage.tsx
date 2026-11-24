'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MenuScreenLayout from '@/components/menu/MenuScreenLayout';
import { useMenuScreenScroller } from '@/components/menu/menu-scroller';
import { hasActiveSearch, parseSearchFilters, searchParamsToSource } from '@/helpers/search-params';
import SearchEntry from './SearchEntry';
import SearchHeader from './SearchHeader';
import SearchTermField from './SearchTermField';
import { useSearchNavigation } from './use-search-navigation';
import { useSearchResultsView } from './use-search-results-view';

/**
 * Uma tela só para `/search`. O campo é o primeiro filho do cabeçalho em **todos** os estados e a tela devolve sempre o
 * mesmo `MenuScreenLayout`: o React preserva o `input` (foco, cursor, teclado) entre a entrada e os resultados. O que
 * muda é o resto do cabeçalho e o corpo.
 */
const SearchPage: React.FC = () => {
  const params = useSearchParams();
  const filters = useMemo(() => parseSearchFilters(searchParamsToSource(params)), [params]);
  const isActive = hasActiveSearch(filters);
  const [startsOnEntry] = useState(!isActive);
  const navigation = useSearchNavigation(filters);
  const { regionRef, scrollerRef, isTablet } = useMenuScreenScroller();
  const view = useSearchResultsView({ filters, enabled: isActive, navigation, scrollerRef, isTablet });

  return (
    <MenuScreenLayout
      regionRef={regionRef}
      header={
        <>
          <SearchHeader>
            <SearchTermField term={filters.term ?? ''} autoFocus={startsOnEntry} onTermChange={navigation.setTerm} />
          </SearchHeader>
          {isActive && view.controls}
          {isActive && view.band}
        </>
      }
    >
      {isActive ? view.body : <SearchEntry />}
    </MenuScreenLayout>
  );
};

export default SearchPage;
