'use client';

import React from 'react';
import { useRestaurantStateSocket } from '@/hooks/use-restaurant-state-socket';

/** Mantém o estado da cozinha em dia por socket. Não desenha nada. */
const RestaurantStateListener: React.FC = () => {
  useRestaurantStateSocket();

  return null;
};

export default RestaurantStateListener;
