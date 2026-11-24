'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import { categoryListMetrics } from '@/theme';
import { ProductSummary } from '@/types/product';
import CategoryListEnd from './CategoryListEnd';
import CategoryLoadingRow from './CategoryLoadingRow';
import CategoryProductItem from './CategoryProductItem';

const NEXT_PAGE_ERROR = 'Não foi possível carregar mais produtos.';

export interface CategoryProductListProps {
  products: ProductSummary[];
  /** A busca (05) passa a linha com destaque. */
  renderItem?: (product: ProductSummary) => React.ReactNode;
  /** O rodapé de fim de lista: a busca não fala de categoria. */
  endLabel?: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  nextPageError: boolean;
  onRetryNextPage: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}

const Root = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.gap,
  paddingBlockStart: categoryListMetrics.paddingBlockStart,
  paddingBlockEnd: categoryListMetrics.paddingBlockEnd,
  paddingInline: categoryListMetrics.paddingInline,
});

const Sentinel = styled('span')({
  display: 'block',
});

function renderDefaultItem(product: ProductSummary): React.ReactNode {
  return <CategoryProductItem product={product} />;
}

/**
 * A sentinela é renderizada **sempre**, depois da lista: o fim da lista é um elemento à parte. Condicionar a sentinela
 * a `hasNextPage` é o modo de falha em que o observer não religa depois de a página falhar e a lista trava.
 */
const CategoryProductList: React.FC<CategoryProductListProps> = ({
  products,
  renderItem = renderDefaultItem,
  endLabel,
  isFetchingNextPage,
  hasNextPage,
  nextPageError,
  onRetryNextPage,
  sentinelRef,
}) => {
  return (
    <Root>
      {products.map(product => (
        <React.Fragment key={product.public_id}>{renderItem(product)}</React.Fragment>
      ))}
      {isFetchingNextPage && !nextPageError && <CategoryLoadingRow />}
      {nextPageError && (
        <InlineError message={NEXT_PAGE_ERROR} onRetry={onRetryNextPage} isRetrying={isFetchingNextPage} />
      )}
      {!hasNextPage && <CategoryListEnd label={endLabel} />}
      <Sentinel ref={sentinelRef} aria-hidden />
    </Root>
  );
};

export default CategoryProductList;
