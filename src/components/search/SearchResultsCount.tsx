'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import { tabletGutter } from '@/components/menu/tablet-gutter';
import { fontFamilies, pxToRem, searchSectionMetrics } from '@/theme';

const numberFormatter = new Intl.NumberFormat('pt-BR');

/** `7 resultados`, `1 resultado`. O número é sempre o `meta.total` do servidor. */
export function formatResultCount(total: number): string {
  return `${numberFormatter.format(total)} ${total === 1 ? 'resultado' : 'resultados'}`;
}

export interface SearchResultsCountProps {
  total: number;
  term: string | null;
  page: { current: number; last: number } | null;
}

const Root = styled('div')({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: searchSectionMetrics.labelMarginBlockEnd,
  paddingBlockStart: searchSectionMetrics.labelMarginBlockStart,
  paddingBlockEnd: 0,
  paddingInline: searchSectionMetrics.bodyPaddingInline,
  ...tabletGutter('paddingInline'),
});

const Summary = styled('h2')(({ theme }) => ({
  margin: 0,
  minInlineSize: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchSectionMetrics.labelFontSize),
  fontWeight: searchSectionMetrics.labelFontWeight,
  lineHeight: searchSectionMetrics.labelLineHeight,
  letterSpacing: searchSectionMetrics.labelLetterSpacing,
  textTransform: 'uppercase',
  color: theme.vars.palette.surface.muted,
}));

const Page = styled('span')(({ theme }) => ({
  flexShrink: 0,
  fontFamily: fontFamilies.text,
  fontSize: pxToRem(searchSectionMetrics.actionFontSize),
  lineHeight: searchSectionMetrics.labelLineHeight,
  color: theme.vars.palette.surface.muted,
}));

const SearchResultsCount: React.FC<SearchResultsCountProps> = ({ total, term, page }) => {
  return (
    <Root>
      <Summary>{term === null ? formatResultCount(total) : `${formatResultCount(total)} para “${term}”`}</Summary>
      {page !== null && <Page>{`página ${page.current} de ${page.last}`}</Page>}
    </Root>
  );
};

export default SearchResultsCount;
