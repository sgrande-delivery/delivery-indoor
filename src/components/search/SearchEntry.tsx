'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { selectVisibleCategories, useMenuCategories } from '@/hooks/use-menu-categories';
import { fontFamilies, pxToRem, searchSectionMetrics, spacingScale } from '@/theme';
import SearchCategoryGrid from './SearchCategoryGrid';

const SECTION_LABEL = 'Categorias';
const CATEGORIES_ERROR = 'Não foi possível carregar as categorias.';

const Root = styled('div')({
  paddingBlockEnd: spacingScale.lg,
});

const Body = styled('section')({
  paddingInline: searchSectionMetrics.bodyPaddingInline,
  paddingBlockStart: searchSectionMetrics.bodyPaddingBlockStart,
});

const SectionLabel = styled('h2')(({ theme }) => ({
  margin: 0,
  marginBlockEnd: searchSectionMetrics.labelMarginBlockEnd,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchSectionMetrics.labelFontSize),
  fontWeight: searchSectionMetrics.labelFontWeight,
  lineHeight: searchSectionMetrics.labelLineHeight,
  letterSpacing: searchSectionMetrics.labelLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

/** O corpo da entrada: sem termo e sem filtro. Nenhum histórico de busca — o tablet da mesa é compartilhado. */
const SearchEntry: React.FC = () => {
  const categories = useMenuCategories();
  const visible = selectVisibleCategories(categories.data ?? []);

  return (
    <Root>
      {categories.isError && categories.data === undefined && (
        <Body>
          <InlineError
            message={CATEGORIES_ERROR}
            onRetry={() => void categories.refetch()}
            isRetrying={categories.isFetching}
          />
        </Body>
      )}
      {visible.length > 0 && (
        <Body>
          <SectionLabel>{SECTION_LABEL}</SectionLabel>
          <SearchCategoryGrid categories={visible} />
        </Body>
      )}
    </Root>
  );
};

export default SearchEntry;
