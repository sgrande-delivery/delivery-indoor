'use client';

import React from 'react';
import { Skeleton } from '@/components/ui';
import { homeRailSkeletonMetrics, menuSkeletonMetrics } from '@/theme';
import MenuRail from './MenuRail';
import MenuSectionHeader from './MenuSectionHeader';

const CARD_PLACEHOLDERS = [0, 1, 2];

export interface HomeRailSkeletonProps {
  /** Com rótulo a trilha se anuncia; sem ele fica muda, para o `MenuSkeleton` juntar várias sob um anúncio só. */
  label?: string;
  compact?: boolean;
  cardWidth?: number;
  cardHeight?: number;
}

/**
 * O cabeçalho entra como barra, não como o título: a trilha ainda pode terminar vazia e sumir, e escrever
 * "Ofertas" antes de saber se há oferta seria prometer seção.
 */
const HomeRailSkeleton: React.FC<HomeRailSkeletonProps> = ({
  label,
  compact = false,
  cardWidth = homeRailSkeletonMetrics.cardWidth,
  cardHeight = homeRailSkeletonMetrics.cardHeight,
}) => {
  return (
    <div aria-busy={label ? true : undefined} aria-label={label} role={label ? 'status' : undefined}>
      <MenuSectionHeader compact={compact}>
        <Skeleton width={menuSkeletonMetrics.titleWidth} height={menuSkeletonMetrics.titleHeight} />
      </MenuSectionHeader>
      <MenuRail>
        {CARD_PLACEHOLDERS.map(placeholder => (
          <Skeleton
            key={placeholder}
            width={cardWidth}
            height={cardHeight}
            radius={homeRailSkeletonMetrics.cardRadius}
          />
        ))}
      </MenuRail>
    </div>
  );
};

export default HomeRailSkeleton;
