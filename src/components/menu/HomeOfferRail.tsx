'use client';

import React from 'react';
import HomeRailError from './HomeRailError';
import HomeRailSkeleton from './HomeRailSkeleton';
import HomeSectionHeader from './HomeSectionHeader';
import { HomeOffer } from './home-offers';
import HomeOfferItem from './HomeOfferItem';
import MenuRail from './MenuRail';

const SECTION_ID = 'menu-offers';
const SECTION_TITLE = 'Ofertas';

export interface HomeOfferRailProps {
  items: HomeOffer[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const HomeOfferRail: React.FC<HomeOfferRailProps> = ({ items, isLoading, isError, onRetry }) => {
  if (isLoading) {
    return <HomeRailSkeleton label="Carregando ofertas" compact />;
  }

  if (isError && items.length === 0) {
    return <HomeRailError onRetry={onRetry} />;
  }

  if (items.length === 0) {
    return null;
  }

  const titleId = `${SECTION_ID}-title`;

  return (
    <section id={SECTION_ID} aria-labelledby={titleId}>
      <HomeSectionHeader id={titleId} title={SECTION_TITLE} compact />
      <MenuRail>
        {items.map(offer => (
          <HomeOfferItem key={offer.publicId} offer={offer} />
        ))}
      </MenuRail>
    </section>
  );
};

export default HomeOfferRail;
