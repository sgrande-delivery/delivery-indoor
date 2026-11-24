'use client';

import React from 'react';
import { styled } from '@mui/material/styles';
import InlineError from '@/components/error/InlineError';
import ProductGrid from '@/components/menu/ProductGrid';
import ProductGridCard from '@/components/menu/ProductGridCard';
import { phoneGutter, tabletGutter } from '@/components/menu/tablet-gutter';
import { categoryListMetrics } from '@/theme';
import { ProductSummary } from '@/types/product';
import CategoryListEnd from './CategoryListEnd';
import CategoryLoadingRow from './CategoryLoadingRow';
import CategoryProductItem from './CategoryProductItem';

const NEXT_PAGE_ERROR = 'Não foi possível carregar mais produtos.';

export interface CategoryProductListProps {
  products: ProductSummary[];
  /** A busca passa a linha com destaque. */
  renderItem?: (product: ProductSummary) => React.ReactNode;
  /** `grid` é o tablet: os itens vão para a grade, e o rodapé fica fora dela, na mesma margem lateral dos cards. */
  variant?: 'list' | 'grid';
  renderGridItem?: (product: ProductSummary) => React.ReactNode;
  /** O rodapé de fim de lista: a busca não fala de categoria. */
  endLabel?: string;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  nextPageError: boolean;
  onRetryNextPage: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}

interface RootProps {
  isGrid: boolean;
}

const Root = styled('div', {
  shouldForwardProp: prop => prop !== 'isGrid',
})<RootProps>(({ isGrid }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.gap,
  paddingBlockStart: categoryListMetrics.paddingBlockStart,
  paddingBlockEnd: isGrid ? 0 : categoryListMetrics.paddingBlockEnd,
  paddingInline: isGrid ? 0 : phoneGutter,
}));

// Carregando, erro e fim da grade ficam na mesma margem lateral dos cards.
const GridFooter = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: categoryListMetrics.gap,
  ...tabletGutter('paddingInline'),
});

const Sentinel = styled('span')({
  display: 'block',
});

function renderDefaultItem(product: ProductSummary): React.ReactNode {
  return <CategoryProductItem product={product} />;
}

function renderDefaultGridItem(product: ProductSummary): React.ReactNode {
  return <ProductGridCard product={product} />;
}

/**
 * A sentinela é renderizada **sempre**, depois da lista: o fim da lista é um elemento à parte. Condicionar a sentinela
 * a `hasNextPage` é o modo de falha em que o observer não religa depois de a página falhar e a lista trava.
 */
const CategoryProductList: React.FC<CategoryProductListProps> = ({
  products,
  renderItem = renderDefaultItem,
  variant = 'list',
  renderGridItem = renderDefaultGridItem,
  endLabel,
  isFetchingNextPage,
  hasNextPage,
  nextPageError,
  onRetryNextPage,
  sentinelRef,
}) => {
  const isGrid = variant === 'grid';

  const footer = (
    <>
      {isFetchingNextPage && !nextPageError && <CategoryLoadingRow withSkeleton={!isGrid} />}
      {nextPageError && (
        <InlineError message={NEXT_PAGE_ERROR} onRetry={onRetryNextPage} isRetrying={isFetchingNextPage} />
      )}
      {!hasNextPage && <CategoryListEnd label={endLabel} />}
    </>
  );

  return (
    <Root isGrid={isGrid}>
      {isGrid ? (
        <ProductGrid>
          {products.map(product => (
            <React.Fragment key={product.public_id}>{renderGridItem(product)}</React.Fragment>
          ))}
        </ProductGrid>
      ) : (
        products.map(product => <React.Fragment key={product.public_id}>{renderItem(product)}</React.Fragment>)
      )}
      {isGrid ? <GridFooter>{footer}</GridFooter> : footer}
      <Sentinel ref={sentinelRef} aria-hidden />
    </Root>
  );
};

export default CategoryProductList;
