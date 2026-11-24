'use client';

import React from 'react';
import { ProductSummary } from '@/types/product';
import HomeRailError from './HomeRailError';
import HomeRailSkeleton from './HomeRailSkeleton';
import HomeSectionHeader from './HomeSectionHeader';
import MenuProductCard from './MenuProductCard';
import MenuRail from './MenuRail';

export interface HomeProductRailProps {
  id: string;
  title: string;
  items: ProductSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** Trilha vazia com sucesso some inteira, cabeçalho incluído; falha sem itens vira `InlineError` no lugar dela. */
const HomeProductRail: React.FC<HomeProductRailProps> = ({ id, title, items, isLoading, isError, onRetry }) => {
  if (isLoading) {
    return <HomeRailSkeleton label={`Carregando ${title.toLowerCase()}`} />;
  }

  if (isError && items.length === 0) {
    return <HomeRailError onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return null;
  }

  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <HomeSectionHeader id={titleId} title={title} />
      <MenuRail>
        {items.map(product => (
          <MenuProductCard key={product.public_id} product={product} size="sm" />
        ))}
      </MenuRail>
    </section>
  );
};

export default HomeProductRail;
