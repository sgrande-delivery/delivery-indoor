'use client';

import React from 'react';
import { pushProductSheet } from '@/components/product/product-route';
import { HomeOffer } from './home-offers';
import OfferCard from './OfferCard';

export interface HomeOfferItemProps {
  offer: HomeOffer;
}

const HomeOfferItem: React.FC<HomeOfferItemProps> = ({ offer }) => {
  function handleOpen(): void {
    pushProductSheet(offer.publicId);
  }

  return <OfferCard offer={offer} onOpen={handleOpen} />;
};

export default HomeOfferItem;
