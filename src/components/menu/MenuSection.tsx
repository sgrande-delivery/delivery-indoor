'use client';

import React from 'react';
import { ProductSummary } from '@/types/product';
import MenuProductCard from './MenuProductCard';
import MenuRail from './MenuRail';
import MenuSectionHeader from './MenuSectionHeader';
import MenuSectionTitle from './MenuSectionTitle';

export interface MenuSectionProps {
  id: string;
  title: string;
  products: ProductSummary[];
}

const MenuSection: React.FC<MenuSectionProps> = ({ id, title, products }) => {
  const titleId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={titleId}>
      <MenuSectionHeader>
        <MenuSectionTitle id={titleId}>{title}</MenuSectionTitle>
      </MenuSectionHeader>
      <MenuRail>
        {products.map(product => (
          <MenuProductCard key={product.public_id} product={product} />
        ))}
      </MenuRail>
    </section>
  );
};

export default MenuSection;
