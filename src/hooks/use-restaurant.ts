'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchRestaurant } from 'src/services/restaurant';
import { Restaurant } from 'src/types/restaurant';

export const restaurantQueryKey = ['restaurant'] as const;

export function useRestaurant(): UseQueryResult<Restaurant> {
  return useQuery({ queryKey: restaurantQueryKey, queryFn: fetchRestaurant, staleTime: Infinity });
}
